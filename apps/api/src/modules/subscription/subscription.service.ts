import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseService } from '../../firebase/firebase.service';
import { InvoiceService } from '../invoice/invoice.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { SubscriptionStatus, BillingInterval, InvoiceStatus, QuotationStatus } from '@subflow/shared';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly invoiceService: InvoiceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get collection() {
    return this.firebase.getFirestore().collection('subscriptions');
  }

  private generateSubNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `SUB-${dateStr}-${rand}`;
  }

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

  async findAll(query?: { customerId?: string; status?: string; planId?: string }): Promise<any[]> {
    let q: FirebaseFirestore.Query = this.collection;
    if (query?.customerId) {
      q = q.where('customerId', '==', query.customerId);
    }
    if (query?.status) {
      q = q.where('status', '==', query.status);
    }
    if (query?.planId) {
      q = q.where('planId', '==', query.planId);
    }

    const snap = await q.orderBy('createdAt', 'desc').get();

    return Promise.all(
      snap.docs.map(async (doc) => {
        const itemsSnap = await doc.ref.collection('items').get();
        const data = doc.data() as any;
        const items = itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() }));
        return { id: doc.id, ...data, items: items.length > 0 ? items : data.items || [] };
      }),
    );
  }

  async findOne(id: string): Promise<any> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const [itemsSnap, activitiesSnap] = await Promise.all([
      doc.ref.collection('items').get(),
      doc.ref.collection('activities').orderBy('createdAt', 'desc').get(),
    ]);

    const data = doc.data() as any;
    const items = itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() }));
    const activities = activitiesSnap.docs.map((a) => ({ id: a.id, ...a.data() }));

    return { id: doc.id, ...data, items: items.length > 0 ? items : data.items || [], activities };
  }

  async create(dto: any, performedBy: string, performedByName: string = 'User'): Promise<any> {
    const docRef = this.collection.doc();
    const now = new Date();
    const subNumber = this.generateSubNumber();

    // Customer info
    const custDoc = await this.firebase.getFirestore().collection('users').doc(dto.customerId).get();
    const custData = custDoc.data() || {};

    // Plan info
    let planName = dto.planName || 'Custom Plan';
    let billingInterval = dto.billingInterval || 'monthly';
    if (dto.planId) {
      const planDoc = await this.firebase.getFirestore().collection('plans').doc(dto.planId).get();
      if (planDoc.exists) {
        planName = planDoc.data()?.name || planName;
        billingInterval = planDoc.data()?.billingInterval || billingInterval;
      }
    }

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const computedItems = (dto.items || []).map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const lineSubtotal = qty * price;
      const taxAmount = Number(item.taxAmount) || 0;
      const discountAmount = Number(item.discountAmount) || 0;
      const lineTotal = lineSubtotal + taxAmount - discountAmount;

      subtotal += lineSubtotal;
      totalTax += taxAmount;
      totalDiscount += discountAmount;

      return {
        productId: item.productId,
        productName: item.productName || 'Product',
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        quantity: qty,
        unitPrice: price,
        taxAmount,
        discountAmount,
        total: lineTotal,
        taxes: item.taxes || [],
        discounts: item.discounts || [],
      };
    });

    if (computedItems.length === 0 && (dto.subtotal || dto.total)) {
      subtotal = Number(dto.subtotal ?? dto.total) || 0;
      totalTax = Number(dto.taxAmount) || 0;
      totalDiscount = Number(dto.discountAmount) || 0;
    }

    const total = Math.max(0, subtotal + totalTax - totalDiscount);
    const startDate = dto.startDate || now.toISOString();
    const nextBillingDate = this.calculateNextBillingDate(new Date(startDate), billingInterval);

    const subscriptionData = {
      number: subNumber,
      customerId: dto.customerId,
      customerName: custData.displayName || custData.name || dto.customerName || 'Customer',
      customerEmail: custData.email || dto.customerEmail || '',
      planId: dto.planId || null,
      planName,
      billingInterval,
      quotationId: dto.quotationId || null,
      status: dto.status || SubscriptionStatus.DRAFT,
      autoRenew: dto.autoRenew !== undefined ? Boolean(dto.autoRenew) : true,
      renewalCount: 0,
      startDate,
      expiryDate: dto.expiryDate || null,
      nextBillingDate,
      paymentTerms: dto.paymentTerms || 'Due on Receipt',
      subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      total,
      recurringSubtotal: subtotal,
      recurringTax: totalTax,
      recurringDiscount: totalDiscount,
      recurringTotal: total,
      createdBy: performedBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const batch = this.firebase.getFirestore().batch();
    batch.set(docRef, subscriptionData);

    const savedItems: any[] = [];
    for (const item of computedItems) {
      const itemRef = docRef.collection('items').doc();
      batch.set(itemRef, item);
      savedItems.push({ id: itemRef.id, ...item });
    }

    // Add activity record
    const actRef = docRef.collection('activities').doc();
    batch.set(actRef, {
      action: 'CREATED',
      description: `Subscription ${subNumber} created in ${subscriptionData.status} state`,
      performedBy,
      performedByName,
      createdAt: now.toISOString(),
    });

    await batch.commit();

    this.eventEmitter.emit(EVENTS.SUBSCRIPTION_CREATED, {
      subscriptionId: docRef.id,
      number: subNumber,
      customerId: subscriptionData.customerId,
      total,
    });

    return { id: docRef.id, ...subscriptionData, items: savedItems };
  }

  async convertFromQuotation(
    quotationId: string,
    planId: string = 'plan_pro_monthly',
    performedBy: string = 'system',
    performedByName: string = 'User',
  ): Promise<any> {
    const quoDoc = await this.firebase.getFirestore().collection('quotations').doc(quotationId).get();
    if (!quoDoc.exists) {
      throw new NotFoundException(`Quotation with ID ${quotationId} not found`);
    }
    const quoData = quoDoc.data() as any;

    // Idempotency guard: if already converted to a subscription, return existing subscription & invoice
    if (quoData.convertedToSubscriptionId) {
      try {
        const existingSub = await this.findOne(quoData.convertedToSubscriptionId);
        let existingInvoice = null;
        if (quoData.convertedInvoiceId) {
          existingInvoice = await this.invoiceService.findOne(quoData.convertedInvoiceId).catch(() => null);
        }
        return { ...existingSub, invoice: existingInvoice, _alreadyConverted: true };
      } catch {
        // Proceed if referenced subscription no longer exists
      }
    }

    const itemsSnap = await quoDoc.ref.collection('items').get();
    const subcollectionItems = itemsSnap.docs.map((i) => i.data());
    const rawItems = subcollectionItems.length > 0 ? subcollectionItems : quoData.items || [];

    const items =
      rawItems.length > 0
        ? rawItems
        : [
            {
              productId: null,
              productName: `Quotation ${quoData.number || quotationId}`,
              quantity: 1,
              unitPrice: Number(quoData.subtotal ?? quoData.total) || 0,
              taxAmount: Number(quoData.taxAmount) || 0,
              discountAmount: Number(quoData.discountAmount) || 0,
              total: Number(quoData.total) || 0,
            },
          ];

    const sub = await this.create(
      {
        customerId: quoData.customerId,
        customerName: quoData.customerName,
        customerEmail: quoData.customerEmail,
        planId: planId || quoData.planId || 'plan_pro_monthly',
        planName: quoData.planName || 'Converted from Quotation',
        billingInterval: quoData.billingInterval || 'monthly',
        quotationId,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        subtotal: quoData.subtotal,
        taxAmount: quoData.taxAmount,
        discountAmount: quoData.discountAmount,
        total: quoData.total,
        items,
        notes: quoData.notes,
      },
      performedBy,
      performedByName,
    );

    const now = new Date();
    // Auto-create confirmed invoice for the first billing cycle
    const invoice = await this.invoiceService.create({
      subscriptionId: sub.id,
      subscriptionNumber: sub.number,
      customerId: sub.customerId,
      customerName: sub.customerName,
      customerEmail: sub.customerEmail,
      status: InvoiceStatus.CONFIRMED,
      issueDate: now.toISOString(),
      dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      billingPeriodStart: sub.startDate,
      billingPeriodEnd: sub.nextBillingDate,
      subtotal: sub.subtotal,
      taxAmount: sub.taxAmount,
      discountAmount: sub.discountAmount,
      total: sub.total,
      items: sub.items && sub.items.length > 0 ? sub.items : items,
      idempotencyKey: `quote-convert-${quotationId}`,
    });

    // Update quotation status to ACCEPTED and link subscription + invoice
    await quoDoc.ref.update({
      status: QuotationStatus.ACCEPTED,
      acceptedAt: quoData.acceptedAt || now.toISOString(),
      convertedToSubscriptionId: sub.id,
      convertedToSubscriptionNumber: sub.number,
      convertedInvoiceId: invoice.id,
      convertedInvoiceNumber: invoice.number,
      updatedAt: now.toISOString(),
    });

    this.eventEmitter.emit(EVENTS.SUBSCRIPTION_ACTIVATED, {
      subscriptionId: sub.id,
      customerId: sub.customerId,
      customerName: sub.customerName,
      planId: sub.planId,
      planName: sub.planName,
      billingInterval: sub.billingInterval,
      nextBillingDate: sub.nextBillingDate,
      total: sub.total,
    });

    return { ...sub, invoice };
  }

  async renew(
    id: string,
    performedBy: string = 'system',
    performedByName: string = 'User',
  ): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const currentData = doc.data() as any;
    if (currentData.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException(`Cannot renew a cancelled subscription (${id})`);
    }

    const itemsSnap = await ref.collection('items').get();
    const subItems = itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() }));
    const items = subItems.length > 0 ? subItems : currentData.items || [];

    const now = new Date();
    const billingInterval = currentData.billingInterval || 'monthly';
    const currentBillingDate = currentData.nextBillingDate ? new Date(currentData.nextBillingDate) : now;
    const periodStart = currentBillingDate.toISOString();
    const baseDateForNext = currentBillingDate > now ? currentBillingDate : now;
    const nextBillingDate = this.calculateNextBillingDate(baseDateForNext, billingInterval);
    const renewalCount = (Number(currentData.renewalCount) || 0) + 1;

    const subSubtotal = Number(currentData.subtotal ?? currentData.recurringSubtotal ?? currentData.total ?? currentData.recurringTotal) || 0;
    const subTax = Number(currentData.taxAmount ?? currentData.recurringTax) || 0;
    const subDiscount = Number(currentData.discountAmount ?? currentData.recurringDiscount) || 0;
    const subTotal = Number(currentData.total ?? currentData.recurringTotal) || Math.max(0, subSubtotal + subTax - subDiscount);

    const invoiceItems =
      items.length > 0
        ? items
        : [
            {
              productId: currentData.planId || null,
              productName: currentData.planName || 'Subscription Renewal',
              description: `Renewal (${billingInterval}) for period ${periodStart.slice(0, 10)} to ${nextBillingDate.slice(0, 10)}`,
              quantity: 1,
              unitPrice: subSubtotal || subTotal,
              taxAmount: subTax,
              discountAmount: subDiscount,
              total: subTotal,
            },
          ];

    const invoice = await this.invoiceService.create({
      subscriptionId: id,
      subscriptionNumber: currentData.number,
      customerId: currentData.customerId,
      customerName: currentData.customerName,
      customerEmail: currentData.customerEmail,
      status: InvoiceStatus.CONFIRMED,
      issueDate: now.toISOString(),
      dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      billingPeriodStart: periodStart,
      billingPeriodEnd: nextBillingDate,
      subtotal: subSubtotal,
      taxAmount: subTax,
      discountAmount: subDiscount,
      total: subTotal,
      items: invoiceItems,
      idempotencyKey: `renew-${id}-${periodStart.slice(0, 10)}-${renewalCount}`,
    });

    const update: any = {
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate,
      lastRenewedAt: now.toISOString(),
      renewalCount,
      updatedAt: now.toISOString(),
    };

    if (currentData.expiryDate) {
      const expBase = new Date(currentData.expiryDate) > now ? new Date(currentData.expiryDate) : now;
      update.expiryDate = this.calculateNextBillingDate(expBase, billingInterval);
    }

    const batch = this.firebase.getFirestore().batch();
    batch.update(ref, update);

    const actRef = ref.collection('activities').doc();
    batch.set(actRef, {
      action: 'RENEWED',
      description: `Subscription renewed (#${renewalCount}) until ${nextBillingDate.slice(0, 10)}. Confirmed invoice ${invoice.number} generated.`,
      performedBy,
      performedByName,
      createdAt: now.toISOString(),
    });

    await batch.commit();

    this.eventEmitter.emit(EVENTS.SUBSCRIPTION_RENEWED, {
      subscriptionId: id,
      customerId: currentData.customerId,
      customerName: currentData.customerName,
      planId: currentData.planId,
      planName: currentData.planName,
      billingInterval,
      nextBillingDate,
      total: subTotal,
    });

    return {
      id,
      ...currentData,
      ...update,
      items: invoiceItems,
      invoice,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async processAutoRenewals(): Promise<{
    renewed: number;
    invoicesCreated: number;
    errors: string[];
  }> {
    const nowIso = new Date().toISOString();
    this.logger.log(`Running scheduled subscription auto-renewal check at ${nowIso}`);

    const snap = await this.collection
      .where('status', '==', SubscriptionStatus.ACTIVE)
      .where('nextBillingDate', '<=', nowIso)
      .get();

    let renewed = 0;
    let invoicesCreated = 0;
    const errors: string[] = [];

    for (const doc of snap.docs) {
      const data = doc.data() as any;
      if (data.autoRenew === false) {
        continue;
      }
      try {
        const result = await this.renew(
          doc.id,
          'system-auto-renew',
          'SubFlow Auto-Renewal Scheduler',
        );
        renewed++;
        if (result.invoice && !result.invoice._idempotent) {
          invoicesCreated++;
        }
      } catch (err) {
        this.logger.error(`Auto-renewal failed for subscription ${doc.id}: ${err.message}`);
        errors.push(`Subscription ${doc.id}: ${err.message}`);
      }
    }

    return { renewed, invoicesCreated, errors };
  }

  async setStatus(
    id: string,
    status: SubscriptionStatus,
    performedBy: string,
    performedByName: string = 'User',
    meta?: any,
  ): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    const currentData = doc.data() as any;
    const previousStatus = currentData.status;
    const now = new Date();
    const update: any = {
      status,
      updatedAt: now.toISOString(),
    };

    if (status === SubscriptionStatus.ACTIVE) {
      update.activatedAt = now.toISOString();
      if (!currentData.nextBillingDate) {
        update.nextBillingDate = this.calculateNextBillingDate(now, currentData.billingInterval);
      }
    } else if (status === SubscriptionStatus.PAUSED) {
      update.pausedAt = now.toISOString();
    } else if (status === SubscriptionStatus.CANCELLED) {
      update.cancelledAt = now.toISOString();
      update.cancellationReason = meta?.reason || '';
    } else if (status === SubscriptionStatus.CLOSED) {
      update.closedAt = now.toISOString();
    }

    const batch = this.firebase.getFirestore().batch();
    batch.update(ref, update);

    const actRef = ref.collection('activities').doc();
    batch.set(actRef, {
      action: `STATUS_CHANGE_TO_${status.toUpperCase()}`,
      description: `Subscription status updated from ${previousStatus} to ${status}${meta?.reason ? ` (${meta.reason})` : ''}`,
      performedBy,
      performedByName,
      createdAt: now.toISOString(),
    });

    await batch.commit();

    // Emit typed events
    if (status === SubscriptionStatus.ACTIVE) {
      this.eventEmitter.emit(EVENTS.SUBSCRIPTION_ACTIVATED, {
        subscriptionId: id,
        customerId: currentData.customerId,
        customerName: currentData.customerName,
        planId: currentData.planId,
        planName: currentData.planName,
        billingInterval: currentData.billingInterval,
        nextBillingDate: update.nextBillingDate || currentData.nextBillingDate,
        total: currentData.total,
      });
    } else {
      this.eventEmitter.emit(`subscription.${status}`, {
        subscriptionId: id,
        customerId: currentData.customerId,
        previousStatus,
        newStatus: status,
        performedBy,
      });
    }

    return { id, ...currentData, ...update };
  }

  async getActivities(id: string): Promise<any[]> {
    const ref = this.collection.doc(id).collection('activities');
    const snap = await ref.orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}
