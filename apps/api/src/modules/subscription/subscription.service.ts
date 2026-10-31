import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { SubscriptionStatus, BillingInterval } from '@subflow/shared';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly firebase: FirebaseService,
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
        const items = itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() }));
        return { id: doc.id, ...doc.data(), items };
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

    const items = itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() }));
    const activities = activitiesSnap.docs.map((a) => ({ id: a.id, ...a.data() }));

    return { id: doc.id, ...doc.data(), items, activities };
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
      startDate,
      expiryDate: dto.expiryDate || null,
      nextBillingDate,
      paymentTerms: dto.paymentTerms || 'Due on Receipt',
      subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      total,
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

  async convertFromQuotation(quotationId: string, planId: string, performedBy: string, performedByName: string): Promise<any> {
    const quoDoc = await this.firebase.getFirestore().collection('quotations').doc(quotationId).get();
    if (!quoDoc.exists) {
      throw new NotFoundException(`Quotation with ID ${quotationId} not found`);
    }
    const quoData = quoDoc.data() as any;

    const itemsSnap = await quoDoc.ref.collection('items').get();
    const items = itemsSnap.docs.map((i) => i.data());

    const sub = await this.create(
      {
        customerId: quoData.customerId,
        customerName: quoData.customerName,
        customerEmail: quoData.customerEmail,
        planId,
        quotationId,
        status: SubscriptionStatus.CONFIRMED,
        items,
        notes: quoData.notes,
      },
      performedBy,
      performedByName,
    );

    // Update quotation status
    await quoDoc.ref.update({
      status: 'converted',
      convertedToSubscriptionId: sub.id,
      updatedAt: new Date().toISOString(),
    });

    return sub;
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
