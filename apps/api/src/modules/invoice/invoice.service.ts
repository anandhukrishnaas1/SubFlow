import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FirebaseService } from '../../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { InvoiceStatus } from '@subflow/shared';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get collection() {
    return this.firebase.getFirestore().collection('invoices');
  }

  private generateInvoiceNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${dateStr}-${rand}`;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAndUpdateOverdueInvoices(): Promise<void> {
    const now = new Date().toISOString();

    const snapshot = await this.collection
      .where('status', '==', InvoiceStatus.CONFIRMED)
      .where('dueDate', '<', now)
      .get();

    if (snapshot.empty) return;

    const batch = this.firebase.getFirestore().batch();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: InvoiceStatus.OVERDUE,
        updatedAt: now,
      });
    });

    await batch.commit();

    snapshot.docs.forEach((doc) => {
      this.eventEmitter.emit(EVENTS.INVOICE_OVERDUE, { invoiceId: doc.id });
    });
  }

  async findAll(query?: {
    customerId?: string;
    subscriptionId?: string;
    status?: string;
  }): Promise<any[]> {
    let q: FirebaseFirestore.Query = this.collection;
    if (query?.customerId) {
      q = q.where('customerId', '==', query.customerId);
    }
    if (query?.subscriptionId) {
      q = q.where('subscriptionId', '==', query.subscriptionId);
    }
    if (query?.status) {
      q = q.where('status', '==', query.status);
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
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const itemsSnap = await doc.ref.collection('items').get();
    const data = doc.data() as any;
    const items = itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() }));

    return { id: doc.id, ...data, items: items.length > 0 ? items : data.items || [] };
  }

  async create(dto: any): Promise<any> {
    // Check idempotency key if provided
    if (dto.idempotencyKey) {
      const existing = await this.collection
        .where('idempotencyKey', '==', dto.idempotencyKey)
        .limit(1)
        .get();
      if (!existing.empty) {
        const existingDoc = existing.docs[0];
        const itemsSnap = await existingDoc.ref.collection('items').get();
        const existingData = existingDoc.data() as any;
        const items = itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() }));
        return {
          id: existingDoc.id,
          ...existingData,
          items: items.length > 0 ? items : existingData.items || [],
          _idempotent: true,
        };
      }
    }

    const docRef = this.collection.doc();
    const now = new Date();
    const invoiceNumber = this.generateInvoiceNumber();

    const issueDate = dto.issueDate || now.toISOString();
    const dueDate = dto.dueDate || new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

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
        productId: item.productId || null,
        productName: item.productName || item.description || 'Service',
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        description: item.description || '',
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

    const total =
      subtotal > 0 || totalTax > 0
        ? Math.max(0, subtotal + totalTax - totalDiscount)
        : Math.max(0, Number(dto.total) || 0);
    const paidAmount = Number(dto.paidAmount) || 0;
    const outstandingAmount = Math.max(0, total - paidAmount);

    const invoiceData = {
      number: invoiceNumber,
      subscriptionId: dto.subscriptionId || null,
      subscriptionNumber: dto.subscriptionNumber || null,
      customerId: dto.customerId,
      customerName: dto.customerName || 'Customer',
      customerEmail: dto.customerEmail || '',
      status: dto.status || InvoiceStatus.DRAFT,
      issueDate,
      dueDate,
      subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      total,
      paidAmount,
      outstandingAmount,
      billingPeriodStart: dto.billingPeriodStart || null,
      billingPeriodEnd: dto.billingPeriodEnd || null,
      pdfUrl: null,
      idempotencyKey: dto.idempotencyKey || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const batch = this.firebase.getFirestore().batch();
    batch.set(docRef, invoiceData);

    const savedItems: any[] = [];
    for (const item of computedItems) {
      const itemRef = docRef.collection('items').doc();
      batch.set(itemRef, item);
      savedItems.push({ id: itemRef.id, ...item });
    }

    await batch.commit();

    this.eventEmitter.emit(EVENTS.INVOICE_CREATED, {
      invoiceId: docRef.id,
      invoiceNumber,
      subscriptionId: invoiceData.subscriptionId,
      customerId: invoiceData.customerId,
      customerEmail: invoiceData.customerEmail,
      total,
      dueDate,
    });

    return { id: docRef.id, ...invoiceData, items: savedItems };
  }

  async markAsConfirmed(id: string): Promise<any> {
    const ref = this.collection.doc(id);
    await ref.update({
      status: InvoiceStatus.CONFIRMED,
      updatedAt: new Date().toISOString(),
    });
    this.eventEmitter.emit(EVENTS.INVOICE_CONFIRMED, { invoiceId: id });
    return this.findOne(id);
  }

  async markAsSent(id: string): Promise<any> {
    const ref = this.collection.doc(id);
    await ref.update({
      status: InvoiceStatus.CONFIRMED,
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.eventEmitter.emit(EVENTS.INVOICE_SENT, { invoiceId: id });
    return this.findOne(id);
  }

  async applyPayment(invoiceId: string, paymentAmount: number): Promise<any> {
    const ref = this.collection.doc(invoiceId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    const inv = doc.data() as any;
    const currentPaid = Number(inv.paidAmount) || 0;
    const newPaid = currentPaid + paymentAmount;
    const newOutstanding = Math.max(0, (Number(inv.total) || 0) - newPaid);
    const isFullPayment = newOutstanding <= 0.001;

    const update: any = {
      paidAmount: newPaid,
      outstandingAmount: newOutstanding,
      updatedAt: new Date().toISOString(),
    };

    if (isFullPayment) {
      update.status = InvoiceStatus.PAID;
      update.paidAt = new Date().toISOString();
    }

    await ref.update(update);

    if (isFullPayment) {
      this.eventEmitter.emit(EVENTS.INVOICE_PAID, {
        invoiceId,
        invoiceNumber: inv.number,
        customerId: inv.customerId,
        amount: inv.total,
      });
    }

    return {
      invoiceId,
      paidAmount: newPaid,
      outstandingAmount: newOutstanding,
      status: update.status || inv.status,
      isFullPayment,
    };
  }

  async cancel(id: string): Promise<any> {
    const ref = this.collection.doc(id);
    await ref.update({
      status: InvoiceStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    this.eventEmitter.emit(EVENTS.INVOICE_CANCELLED, { invoiceId: id });
    return this.findOne(id);
  }
}