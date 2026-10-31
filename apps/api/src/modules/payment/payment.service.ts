import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FirebaseService } from '../../firebase/firebase.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from '@subflow/events';
import { InvoiceStatus, PaymentMethod } from '@subflow/shared';
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
      throw new NotFoundException('Payment not found');
    }
    return { id: doc.id, ...doc.data() };
  }

  async recordPayment(dto: {
    invoiceId: string;
    amount: number;
    method?: PaymentMethod | string;
    transactionRef?: string;
    notes?: string;
    paymentDate?: string;
  }): Promise<any> {
    const rawAmount = Number(dto.amount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }
    const payAmount = roundCurrency(rawAmount);
    if (payAmount <= 0) {
      throw new BadRequestException('Payment amount must be at least one cent');
    }

    const now = new Date();
    const docRef = this.collection.doc();
    const transactionRef = dto.transactionRef?.trim() || `TXN-${randomUUID()}`;
    const invoiceRef = this.firebase.getFirestore().collection('invoices').doc(dto.invoiceId);
    const result = await this.firebase.getFirestore().runTransaction(async (transaction) => {
      const invoiceSnapshot = await transaction.get(invoiceRef);
      if (!invoiceSnapshot.exists) {
        throw new NotFoundException('Invoice not found');
      }

      const invoice = invoiceSnapshot.data() as Record<string, unknown>;
      const duplicateSnapshot = await transaction.get(
        this.collection.where('transactionRef', '==', transactionRef).limit(1),
      );
      const existing = duplicateSnapshot.docs[0];
      if (existing) {
        const existingPayment = existing.data() as Record<string, unknown>;
        if (
          existingPayment.status !== 'completed' ||
          existingPayment.invoiceId !== dto.invoiceId ||
          roundCurrency(Number(existingPayment.amount)) !== roundCurrency(payAmount)
        ) {
          throw new ConflictException('Transaction reference has already been used');
        }
        return {
          id: existing.id,
          payment: existingPayment,
          status: String(invoice.status || ''),
          outstanding: roundCurrency(
            Number(invoice.outstandingAmount) ||
              Number(invoice.total || 0) - Number(invoice.paidAmount || 0),
          ),
          isFullPayment: false,
          duplicate: true,
        };
      }

      const invoiceTotal = Number(invoice.total);
      const currentPaid =
        invoice.paidAmount === undefined ? 0 : Number(invoice.paidAmount);
      const invoiceStatus = String(invoice.status || '');
      if (
        !Number.isFinite(invoiceTotal) ||
        invoiceTotal <= 0 ||
        !Number.isFinite(currentPaid) ||
        currentPaid < 0 ||
        currentPaid > invoiceTotal
      ) {
        throw new BadRequestException('Invoice balance is invalid');
      }
      if (
        invoiceStatus !== InvoiceStatus.CONFIRMED &&
        invoiceStatus !== InvoiceStatus.OVERDUE
      ) {
        throw new BadRequestException('Invoice is not eligible for payment');
      }
      const outstanding = roundCurrency(Math.max(0, invoiceTotal - currentPaid));
      if (payAmount > outstanding + 0.001) {
        throw new BadRequestException('Payment exceeds the outstanding invoice balance');
      }

      const newPaid = roundCurrency(currentPaid + payAmount);
      const newOutstanding = roundCurrency(Math.max(0, invoiceTotal - newPaid));
      const isFullPayment = newOutstanding <= 0.001;
      const status = isFullPayment
        ? InvoiceStatus.PAID
        : String(invoice.status || '');
      const payment = {
        invoiceId: dto.invoiceId,
        invoiceNumber: String(invoice.number || ''),
        customerId: String(invoice.customerId || ''),
        customerName: String(invoice.customerName || ''),
        method: dto.method || 'card',
        amount: roundCurrency(payAmount),
        status: 'completed',
        paymentDate: dto.paymentDate || now.toISOString(),
        transactionRef,
        notes: dto.notes || '',
        createdAt: now.toISOString(),
      };

      transaction.set(docRef, payment);
      transaction.update(invoiceRef, {
        paidAmount: newPaid,
        outstandingAmount: newOutstanding,
        status,
        ...(isFullPayment ? { paidAt: now.toISOString() } : {}),
        updatedAt: now.toISOString(),
      });

      return {
        id: docRef.id,
        payment,
        status,
        outstanding: newOutstanding,
        isFullPayment,
        duplicate: false,
      };
    });

    if (!result.duplicate) {
      if (result.isFullPayment) {
        this.eventEmitter.emit(EVENTS.INVOICE_PAID, {
          invoiceId: dto.invoiceId,
          invoiceNumber: result.payment.invoiceNumber,
          customerId: result.payment.customerId,
          amount: Number(result.payment.amount),
        });
      }
      this.eventEmitter.emit(EVENTS.PAYMENT_RECEIVED, {
        paymentId: result.id,
        invoiceId: dto.invoiceId,
        invoiceNumber: result.payment.invoiceNumber,
        customerId: result.payment.customerId,
        amount: Number(result.payment.amount),
        method: result.payment.method as PaymentMethod,
        isFullPayment: result.isFullPayment,
        remainingOutstanding: result.outstanding,
      });
    }

    return {
      id: result.id,
      ...result.payment,
      invoiceUpdatedStatus: result.status,
      remainingOutstanding: result.outstanding,
      ...(result.duplicate ? { _idempotent: true } : {}),
    };
  }
}
