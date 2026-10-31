import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { MockFirestore } from '../../firebase/mock-firestore';
import { PaymentService } from './payment.service';

function createService(firestore: MockFirestore) {
  const emittedEvents: Array<{ event: string; payload: unknown }> = [];
  const service = new PaymentService(
    { getFirestore: () => firestore } as unknown as FirebaseService,
    {
      emit: (event: string, payload: unknown) => emittedEvents.push({ event, payload }),
    } as never,
  );
  return { service, emittedEvents };
}

async function seedInvoice(firestore: MockFirestore, id = 'invoice-1') {
  await firestore.collection('invoices').doc(id).set({
    number: 'INV-1',
    customerId: 'customer-1',
    customerName: 'Customer One',
    total: 100,
    paidAmount: 0,
    outstandingAmount: 100,
    status: 'confirmed',
  });
}

describe('PaymentService recordPayment', () => {
  it('records a payment and reconciles the invoice in one transaction', async () => {
    const firestore = new MockFirestore();
    await seedInvoice(firestore);
    const { service, emittedEvents } = createService(firestore);

    const payment = await service.recordPayment({
      invoiceId: 'invoice-1',
      amount: 25.25,
      method: 'card',
      transactionRef: 'gateway-ref-1',
    });

    const invoice = (await firestore.collection('invoices').doc('invoice-1').get()).data();
    assert.equal(payment.amount, 25.25);
    assert.equal(invoice.paidAmount, 25.25);
    assert.equal(invoice.outstandingAmount, 74.75);
    assert.equal(invoice.status, 'confirmed');
    assert.equal(
      (await firestore.collection('payments').where('transactionRef', '==', 'gateway-ref-1').get()).size,
      1,
    );
    assert.equal(emittedEvents.length, 1);
  });

  it('treats a repeated transaction reference as idempotent', async () => {
    const firestore = new MockFirestore();
    await seedInvoice(firestore);
    const { service, emittedEvents } = createService(firestore);
    const paymentInput = {
      invoiceId: 'invoice-1',
      amount: 25,
      method: 'card',
      transactionRef: 'gateway-ref-1',
    };

    const first = await service.recordPayment(paymentInput);
    const retry = await service.recordPayment(paymentInput);
    const invoice = (await firestore.collection('invoices').doc('invoice-1').get()).data();

    assert.equal(first.id, retry.id);
    assert.equal(retry._idempotent, true);
    assert.equal(invoice.paidAmount, 25);
    assert.equal(
      (await firestore.collection('payments').where('transactionRef', '==', 'gateway-ref-1').get()).size,
      1,
    );
    assert.equal(emittedEvents.length, 1);
  });

  it('rejects reused transaction references with different payment details', async () => {
    const firestore = new MockFirestore();
    await seedInvoice(firestore);
    const { service } = createService(firestore);
    await service.recordPayment({
      invoiceId: 'invoice-1',
      amount: 25,
      method: 'card',
      transactionRef: 'gateway-ref-1',
    });

    await assert.rejects(
      () =>
        service.recordPayment({
          invoiceId: 'invoice-1',
          amount: 30,
          method: 'card',
          transactionRef: 'gateway-ref-1',
        }),
      ConflictException,
    );
    assert.equal(
      (await firestore.collection('payments').where('transactionRef', '==', 'gateway-ref-1').get()).size,
      1,
    );
  });

  it('does not record payments exceeding the current outstanding amount', async () => {
    const firestore = new MockFirestore();
    await seedInvoice(firestore);
    const { service } = createService(firestore);

    await assert.rejects(
      () =>
        service.recordPayment({
          invoiceId: 'invoice-1',
          amount: 100.01,
          method: 'card',
          transactionRef: 'gateway-ref-1',
        }),
      BadRequestException,
    );
    assert.equal(
      (await firestore.collection('payments').where('transactionRef', '==', 'gateway-ref-1').get()).size,
      0,
    );
    const invoice = (await firestore.collection('invoices').doc('invoice-1').get()).data();
    assert.equal(invoice.paidAmount, 0);
  });

  it('rejects payments against draft and cancelled invoices', async () => {
    for (const status of ['draft', 'cancelled']) {
      const firestore = new MockFirestore();
      await seedInvoice(firestore);
      await firestore.collection('invoices').doc('invoice-1').update({ status });
      const { service } = createService(firestore);

      await assert.rejects(
        () =>
          service.recordPayment({
            invoiceId: 'invoice-1',
            amount: 25,
            method: 'card',
            transactionRef: `gateway-ref-${status}`,
          }),
        BadRequestException,
      );
      assert.equal(
        (await firestore
          .collection('payments')
          .where('transactionRef', '==', `gateway-ref-${status}`)
          .get()).size,
        0,
      );
    }
  });
});
