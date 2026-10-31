import { Injectable, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { InvoiceService } from '../invoice/invoice.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { PaymentMethod } from '@subflow/shared';

@Injectable()
export class PaymentService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly invoiceService: InvoiceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get collection() {
    return this.firebase.getFirestore().collection('payments');
  }

  async findAll(query?: { customerId?: string; invoiceId?: string }): Promise<any[]> {
    let q: FirebaseFirestore.Query = this.collection;
    if (query?.customerId) {
      q = q.where('customerId', '==', query.customerId);
    }
    if (query?.invoiceId) {
      q = q.where('invoiceId', '==', query.invoiceId);
    }
    const snap = await q.orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string): Promise<any> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new BadRequestException(`Payment with ID ${id} not found`);
    }
    return { id: doc.id, ...doc.data() };
  }

  async recordPayment(dto: {
    invoiceId: string;
    amount: number;
    method: PaymentMethod | string;
    transactionRef?: string;
    notes?: string;
    paymentDate?: string;
  }): Promise<any> {
    const invoice = await this.invoiceService.findOne(dto.invoiceId);
    if (!invoice) {
      throw new BadRequestException(`Invoice ${dto.invoiceId} does not exist`);
    }

    const payAmount = Number(dto.amount);
    if (payAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    if (payAmount > Number(invoice.outstandingAmount) + 0.01) {
      throw new BadRequestException(
        `Payment amount ($${payAmount}) exceeds outstanding invoice balance ($${invoice.outstandingAmount})`,
      );
    }

    const now = new Date();
    const docRef = this.collection.doc();

    const paymentData = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      method: dto.method || 'card',
      amount: payAmount,
      paymentDate: dto.paymentDate || now.toISOString(),
      transactionRef: dto.transactionRef || `TXN-${Date.now()}`,
      notes: dto.notes || '',
      createdAt: now.toISOString(),
    };

    await docRef.set(paymentData);

    // Reconcile invoice balance
    const recon = await this.invoiceService.applyPayment(invoice.id, payAmount);

    this.eventEmitter.emit(EVENTS.PAYMENT_RECEIVED, {
      paymentId: docRef.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      customerId: invoice.customerId,
      amount: payAmount,
      method: paymentData.method as any,
      isFullPayment: recon.isFullPayment,
      remainingOutstanding: recon.outstandingAmount,
    });

    return {
      id: docRef.id,
      ...paymentData,
      invoiceUpdatedStatus: recon.status,
      remainingOutstanding: recon.outstandingAmount,
    };
  }

  async createRazorpayOrder(dto: { invoiceId: string; amount?: number }): Promise<any> {
    const invoice = await this.invoiceService.findOne(dto.invoiceId);
    if (!invoice) {
      throw new BadRequestException(`Invoice ${dto.invoiceId} does not exist`);
    }

    const payAmount = dto.amount ? Number(dto.amount) : Number(invoice.outstandingAmount ?? invoice.total);
    if (payAmount <= 0) {
      throw new BadRequestException('Outstanding balance is zero or invoice is already settled');
    }

    const orderId = `order_test_${Date.now()}`;
    return {
      orderId,
      amount: Math.round(payAmount * 100), // in paise
      currency: 'INR',
      displayAmount: payAmount,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_SubFlowGateway2026',
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      mode: 'test',
    };
  }

  async verifyRazorpayPayment(dto: {
    invoiceId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    notes?: string;
  }): Promise<any> {
    const txnRef = dto.razorpayPaymentId || `pay_test_${Date.now()}`;
    return this.recordPayment({
      invoiceId: dto.invoiceId,
      amount: dto.amount,
      method: PaymentMethod.RAZORPAY,
      transactionRef: txnRef,
      notes: dto.notes || `Settled via Razorpay Test Gateway (Order: ${dto.razorpayOrderId || 'N/A'})`,
    });
  }
}
