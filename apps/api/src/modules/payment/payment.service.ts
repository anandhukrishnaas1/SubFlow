import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { InvoiceStatus, PaymentMethod } from '@subflow/shared';
import { FirebaseService } from '../../firebase/firebase.service';
import { roundCurrency } from '../analytics/analytics.calculations';

@Injectable()
export class PaymentService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private get collection() {
    return this.firebase.getFirestore().collection('payments');
  }

  async findAll(query?: { customerId?: string; invoiceId?: string }): Promise<any[]> {
    let payments: FirebaseFirestore.Query = this.collection;
    if (query?.customerId) {
      payments = payments.where('customerId', '==', query.customerId);
    }
    if (query?.invoiceId) {
      payments = payments.where('invoiceId', '==', query.invoiceId);
    }
    const snapshot = await payments.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async findOne(id: string): Promise<any> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) throw new NotFoundException(`Payment with ID ${id} not found`);
    return { id: doc.id, ...doc.data() };
  }

  async recordPayment(
    dto: {
      invoiceId: string;
      amount: number;
      method: PaymentMethod | string;
      transactionRef?: string;
      notes?: string;
      paymentDate?: string;
    },
    authorizedCustomerId?: string,
  ): Promise<any> {
    const amount = roundCurrency(Number(dto.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }
    if (!Object.values(PaymentMethod).includes(dto.method as PaymentMethod)) {
      throw new BadRequestException('Payment method is invalid.');
    }
    const transactionRef = dto.transactionRef?.trim() || `txn_${randomUUID()}`;
    if (transactionRef.length > 200) {
      throw new BadRequestException('Transaction reference must not exceed 200 characters.');
    }
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();
    if (Number.isNaN(paymentDate.getTime())) {
      throw new BadRequestException('Payment date is invalid.');
    }

    const db = this.firebase.getFirestore();
    const invoiceRef = db.collection('invoices').doc(dto.invoiceId);
    const paymentId = `txn_${createHash('sha256').update(transactionRef).digest('hex')}`;
    const paymentRef = this.collection.doc(paymentId);
    const now = new Date().toISOString();
    const outcome = await db.runTransaction(async (transaction) => {
      const [invoiceSnapshot, existingPaymentSnapshot] = await Promise.all([
        transaction.get(invoiceRef),
        transaction.get(paymentRef),
      ]);
      if (!invoiceSnapshot.exists) {
        throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found.`);
      }

      const invoice = invoiceSnapshot.data() as Record<string, any>;
      if (authorizedCustomerId && invoice.customerId !== authorizedCustomerId) {
        throw new NotFoundException(`Invoice with ID ${dto.invoiceId} not found.`);
      }

      if (existingPaymentSnapshot.exists) {
        const existing = existingPaymentSnapshot.data() as Record<string, any>;
        if (
          existing.transactionRef !== transactionRef ||
          existing.invoiceId !== dto.invoiceId ||
          Number(existing.amount) !== amount ||
          existing.method !== dto.method
        ) {
          throw new ConflictException(
            'Transaction reference has already been used with different payment details.',
          );
        }
        return {
          id: existingPaymentSnapshot.id,
          payment: existing,
          status: invoice.status,
          outstandingAmount: Number(invoice.outstandingAmount) || 0,
          idempotent: true,
        };
      }

      if (![InvoiceStatus.CONFIRMED, InvoiceStatus.OVERDUE].includes(invoice.status)) {
        throw new ConflictException('Payments can only be recorded for confirmed or overdue invoices.');
      }

      const total = Number(invoice.total) || 0;
      const paidAmount = Number(invoice.paidAmount) || 0;
      const calculatedOutstanding = Math.max(0, total - paidAmount);
      const outstanding =
        invoice.outstandingAmount === undefined || invoice.outstandingAmount === null
          ? calculatedOutstanding
          : Number(invoice.outstandingAmount);
      if (
        !Number.isFinite(outstanding) ||
        outstanding < 0 ||
        Math.abs(outstanding - calculatedOutstanding) > 0.01
      ) {
        throw new ConflictException('Invoice balance is inconsistent and cannot accept a payment.');
      }
      if (outstanding <= 0 || amount > outstanding + 0.001) {
        throw new ConflictException(
          `Payment amount (${amount}) exceeds outstanding invoice balance (${outstanding}).`,
        );
      }

      const nextPaidAmount = roundCurrency(paidAmount + amount);
      const nextOutstanding = roundCurrency(Math.max(0, outstanding - amount));
      const isFullPayment = nextOutstanding <= 0.001;
      const status = isFullPayment ? InvoiceStatus.PAID : invoice.status;
      const payment = {
        invoiceId: dto.invoiceId,
        invoiceNumber: invoice.number,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        method: dto.method,
        amount,
        status: 'completed',
        paymentDate: paymentDate.toISOString(),
        transactionRef,
        notes: dto.notes || '',
        createdAt: now,
      };

      transaction.set(paymentRef, payment);
      transaction.update(invoiceRef, {
        paidAmount: nextPaidAmount,
        outstandingAmount: nextOutstanding,
        status,
        ...(isFullPayment ? { paidAt: now } : {}),
        updatedAt: now,
      });

      return {
        id: paymentId,
        payment,
        status,
        outstandingAmount: nextOutstanding,
        isFullPayment,
        idempotent: false,
      };
    });

    if (!outcome.idempotent) {
      if (outcome.isFullPayment) {
        this.eventEmitter.emit(EVENTS.INVOICE_PAID, {
          invoiceId: dto.invoiceId,
          invoiceNumber: outcome.payment.invoiceNumber,
          customerId: outcome.payment.customerId,
          amount: outcome.payment.amount,
        });
      }
      this.eventEmitter.emit(EVENTS.PAYMENT_RECEIVED, {
        paymentId: outcome.id,
        invoiceId: dto.invoiceId,
        invoiceNumber: outcome.payment.invoiceNumber,
        customerId: outcome.payment.customerId,
        amount,
        method: dto.method,
        isFullPayment: outcome.isFullPayment,
        remainingOutstanding: outcome.outstandingAmount,
      });
    }

    return {
      id: outcome.id,
      ...outcome.payment,
      invoiceUpdatedStatus: outcome.status,
      remainingOutstanding: outcome.outstandingAmount,
      idempotent: outcome.idempotent,
    };
  }
}
