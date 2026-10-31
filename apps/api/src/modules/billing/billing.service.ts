import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { InvoiceService } from '../invoice/invoice.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { SubscriptionStatus } from '@subflow/shared';

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
      .where('nextBillingDate', '<=', nowIso)
      .get();

    return Promise.all(
      snap.docs.map(async (doc) => {
        const itemsSnap = await doc.ref.collection('items').get();
        return {
          id: doc.id,
          ...doc.data(),
          items: itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() })),
        };
      }),
    );
  }

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

        // Check if invoice already exists with this idempotency key
        const invoiceResult = await this.invoiceService.create({
          subscriptionId: sub.id,
          subscriptionNumber: sub.number,
          customerId: sub.customerId,
          customerName: sub.customerName,
          customerEmail: sub.customerEmail,
          issueDate: now.toISOString(),
          dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          subtotal: sub.subtotal,
          taxAmount: sub.taxAmount,
          discountAmount: sub.discountAmount,
          total: sub.total,
          items: sub.items,
          idempotencyKey,
        });

        if (!invoiceResult._idempotent) {
          invoicesCreated++;
        }

        // Advance subscription nextBillingDate
        await this.firebase
          .getFirestore()
          .collection('subscriptions')
          .doc(sub.id)
          .update({
            nextBillingDate: periodEnd,
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
            description: `Invoice ${invoiceResult.number} generated for period ${periodStart.slice(0, 10)} to ${periodEnd.slice(0, 10)}`,
            performedBy: 'system-billing-worker',
            performedByName: 'SubFlow Billing Engine',
            createdAt: now.toISOString(),
          });

        this.eventEmitter.emit(EVENTS.BILLING_CYCLE_TRIGGERED, {
          subscriptionId: sub.id,
          billingDate: periodStart,
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
}
