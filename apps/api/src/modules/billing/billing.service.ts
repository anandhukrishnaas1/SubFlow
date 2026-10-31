import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseService } from '../../firebase/firebase.service';
import { InvoiceService } from '../invoice/invoice.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { SubscriptionStatus, InvoiceStatus } from '@subflow/shared';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly invoiceService: InvoiceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private calculateNextBillingDate(from: Date, interval: string): string {
    const d = new Date(from);
    switch (interval) {
      case 'daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        d.setMonth(d.getMonth() + 1);
        break;
    }
    return d.toISOString();
  }

  async findDueSubscriptions(): Promise<any[]> {
    const nowIso = new Date().toISOString();
    const snap = await this.firebase
      .getFirestore()
      .collection('subscriptions')
      .where('status', '==', SubscriptionStatus.ACTIVE)
      .get();

    const dueDocs = snap.docs.filter((doc) => {
      const data = doc.data() as any;
      if (data.autoRenew === false) return false;
      return Boolean(data.nextBillingDate && data.nextBillingDate <= nowIso);
    });

    return Promise.all(
      dueDocs.map(async (doc) => {
        const itemsSnap = await doc.ref.collection('items').get();
        const data = doc.data() as any;
        const subItems = itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() }));
        return {
          id: doc.id,
          ...data,
          items: subItems.length > 0 ? subItems : data.items || [],
        };
      }),
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async runBillingCycle(): Promise<{
    processed: number;
    invoicesCreated: number;
    errors: string[];
  }> {
    const now = new Date();
    this.logger.log(`Starting automated billing cycle at ${now.toISOString()}`);

    const dueSubscriptions = await this.findDueSubscriptions();
    this.logger.log(`Found ${dueSubscriptions.length} subscriptions due for billing`);

    let processed = 0;
    let invoicesCreated = 0;
    const errors: string[] = [];

    for (const sub of dueSubscriptions) {
      try {
        const periodStart = sub.nextBillingDate || now.toISOString();
        const periodEnd = this.calculateNextBillingDate(new Date(periodStart), sub.billingInterval);
        const idempotencyKey = `billing-${sub.id}-${periodStart.slice(0, 10)}`;

        const subSubtotal = Number(sub.subtotal ?? sub.recurringSubtotal ?? sub.total ?? sub.recurringTotal) || 0;
        const subTax = Number(sub.taxAmount ?? sub.recurringTax) || 0;
        const subDiscount = Number(sub.discountAmount ?? sub.recurringDiscount) || 0;
        const subTotal = Number(sub.total ?? sub.recurringTotal) || Math.max(0, subSubtotal + subTax - subDiscount);

        const invoiceItems =
          Array.isArray(sub.items) && sub.items.length > 0
            ? sub.items
            : [
                {
                  productId: sub.planId || null,
                  productName: sub.planName || 'Recurring Subscription',
                  description: `Recurring ${sub.billingInterval || 'monthly'} billing (${periodStart.slice(0, 10)} to ${periodEnd.slice(0, 10)})`,
                  quantity: 1,
                  unitPrice: subSubtotal || subTotal,
                  taxAmount: subTax,
                  discountAmount: subDiscount,
                  total: subTotal,
                },
              ];

        // Create confirmed invoice (with idempotency key guard)
        const invoiceResult = await this.invoiceService.create({
          subscriptionId: sub.id,
          subscriptionNumber: sub.number,
          customerId: sub.customerId,
          customerName: sub.customerName,
          customerEmail: sub.customerEmail,
          status: InvoiceStatus.CONFIRMED,
          issueDate: now.toISOString(),
          dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          subtotal: subSubtotal,
          taxAmount: subTax,
          discountAmount: subDiscount,
          total: subTotal,
          items: invoiceItems,
          idempotencyKey,
        });

        if (!invoiceResult._idempotent) {
          invoicesCreated++;
          this.eventEmitter.emit(EVENTS.INVOICE_CONFIRMED, {
            invoiceId: invoiceResult.id,
            invoiceNumber: invoiceResult.number,
            subscriptionId: sub.id,
            customerId: sub.customerId,
            total: invoiceResult.total,
          });
        }

        const renewalCount = (Number(sub.renewalCount) || 0) + 1;

        // Advance subscription nextBillingDate and record auto-renewal metadata
        await this.firebase
          .getFirestore()
          .collection('subscriptions')
          .doc(sub.id)
          .update({
            nextBillingDate: periodEnd,
            lastRenewedAt: now.toISOString(),
            renewalCount,
            updatedAt: now.toISOString(),
          });

        // Add activity record
        await this.firebase
          .getFirestore()
          .collection('subscriptions')
          .doc(sub.id)
          .collection('activities')
          .add({
            action: 'BILLING_CYCLE_PROCESSED',
            description: `Confirmed invoice ${invoiceResult.number} generated & subscription auto-renewed for period ${periodStart.slice(0, 10)} to ${periodEnd.slice(0, 10)}`,
            performedBy: 'system-billing-worker',
            performedByName: 'SubFlow Billing Engine',
            createdAt: now.toISOString(),
          });

        this.eventEmitter.emit(EVENTS.BILLING_CYCLE_TRIGGERED, {
          subscriptionId: sub.id,
          billingDate: periodStart,
        });

        this.eventEmitter.emit(EVENTS.SUBSCRIPTION_RENEWED, {
          subscriptionId: sub.id,
          customerId: sub.customerId,
          customerName: sub.customerName,
          planId: sub.planId,
          planName: sub.planName,
          billingInterval: sub.billingInterval,
          nextBillingDate: periodEnd,
          total: subTotal,
        });

        processed++;
      } catch (err) {
        this.logger.error(`Failed billing subscription ${sub.id}: ${err.message}`);
        errors.push(`Subscription ${sub.id}: ${err.message}`);
      }
    }

    this.eventEmitter.emit(EVENTS.BILLING_CYCLE_COMPLETED, {
      processed,
      invoicesCreated,
    });

    this.logger.log(`Billing cycle finished: ${processed} processed, ${invoicesCreated} invoices created.`);
    return { processed, invoicesCreated, errors };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markOverdueInvoices(): Promise<{ markedOverdue: number }> {
    const nowIso = new Date().toISOString();
    const snap = await this.firebase
      .getFirestore()
      .collection('invoices')
      .where('status', '==', InvoiceStatus.CONFIRMED)
      .get();

    let markedOverdue = 0;
    for (const doc of snap.docs) {
      const data = doc.data() as any;
      if (data.dueDate && data.dueDate <= nowIso && (Number(data.outstandingAmount) || 0) > 0) {
        await doc.ref.update({
          status: InvoiceStatus.OVERDUE,
          updatedAt: nowIso,
        });
        this.eventEmitter.emit(EVENTS.INVOICE_OVERDUE, {
          invoiceId: doc.id,
          invoiceNumber: data.number,
          customerId: data.customerId,
          outstandingAmount: data.outstandingAmount,
        });
        markedOverdue++;
      }
    }
    return { markedOverdue };
  }
}
