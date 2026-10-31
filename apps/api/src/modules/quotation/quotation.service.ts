import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { QuotationStatus } from '@subflow/shared';

@Injectable()
export class QuotationService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get collection() {
    return this.firebase.getFirestore().collection('quotations');
  }

  private generateQuotationNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `QUO-${dateStr}-${rand}`;
  }

  async findAll(query?: { customerId?: string; status?: string }): Promise<any[]> {
    let q: FirebaseFirestore.Query = this.collection;
    if (query?.customerId) {
      q = q.where('customerId', '==', query.customerId);
    }
    if (query?.status) {
      q = q.where('status', '==', query.status);
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
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    const itemsSnap = await doc.ref.collection('items').get();
    const items = itemsSnap.docs.map((i) => ({ id: i.id, ...i.data() }));

    return { id: doc.id, ...doc.data(), items };
  }

  async create(dto: any, performedBy: string): Promise<any> {
    const docRef = this.collection.doc();
    const now = new Date();
    const quotationNumber = this.generateQuotationNumber();

    const validityDays = Number(dto.validityDays) || 30;
    const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch customer details
    const custDoc = await this.firebase.getFirestore().collection('users').doc(dto.customerId).get();
    const custData = custDoc.data() || {};

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

    const quotationData = {
      number: quotationNumber,
      customerId: dto.customerId,
      customerName: custData.displayName || custData.name || dto.customerName || 'Customer',
      customerEmail: custData.email || dto.customerEmail || '',
      validityDays,
      expiresAt,
      status: QuotationStatus.DRAFT,
      subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscount,
      total,
      notes: dto.notes || '',
      createdBy: performedBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const batch = this.firebase.getFirestore().batch();
    batch.set(docRef, quotationData);

    const savedItems: any[] = [];
    for (const item of computedItems) {
      const itemRef = docRef.collection('items').doc();
      batch.set(itemRef, item);
      savedItems.push({ id: itemRef.id, ...item });
    }

    await batch.commit();

    this.eventEmitter.emit(EVENTS.QUOTATION_CREATED, {
      quotationId: docRef.id,
      number: quotationNumber,
      customerId: quotationData.customerId,
      total,
    });

    return { id: docRef.id, ...quotationData, items: savedItems };
  }

  async send(id: string): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    await ref.update({
      status: QuotationStatus.SENT,
      updatedAt: new Date().toISOString(),
    });

    this.eventEmitter.emit(EVENTS.QUOTATION_SENT, {
      quotationId: id,
      customerId: doc.data()?.customerId,
    });

    return { id, status: QuotationStatus.SENT };
  }

  async accept(id: string): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    const data = doc.data() as any;
    if (data.status === QuotationStatus.ACCEPTED) {
      return { id, status: data.status, message: 'Quotation already accepted' };
    }

    await ref.update({
      status: QuotationStatus.ACCEPTED,
      acceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.eventEmitter.emit(EVENTS.QUOTATION_ACCEPTED, {
      quotationId: id,
      customerId: data.customerId,
      customerName: data.customerName,
      total: data.total,
    });

    return { id, status: QuotationStatus.ACCEPTED };
  }

  async reject(id: string, reason?: string): Promise<any> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    await ref.update({
      status: QuotationStatus.REJECTED,
      rejectionReason: reason || '',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.eventEmitter.emit(EVENTS.QUOTATION_REJECTED, {
      quotationId: id,
      customerId: doc.data()?.customerId,
    });

    return { id, status: QuotationStatus.REJECTED };
  }
}
