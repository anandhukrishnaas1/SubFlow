import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConflictException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MockFirestore } from '../../firebase/mock-firestore';

function setup() {
  const firestore = new MockFirestore();
  const emitted: Array<{ event: string; payload: unknown }> = [];
  const service = new PaymentService(
    {
      getFirestore: () => firestore,
    } as never,
    {
      emit: (event: string, payload: unknown) => emitted.push({ event, payload }),
    } as never,
  );
  return { firestore, service, emitted };
}

const payment = {
  invoiceId: 'inv_techstart_oct',
  amount: 10,
  method: 'card',
  transactionRef: 'provider-ref-001',
};

test('payment and invoice reconciliation are applied once for duplicate transaction references', async () => {
  const { firestore, service, emitted } = setup();
  const first = await service.recordPayment(payment);
  const duplicate = await service.recordPayment(payment);
  const invoice = await firestore.collection('invoices').doc(payment.invoiceId).get();
  const records = await firestore.collection('payments').where('transactionRef', '==', payment.transactionRef).get();

  assert.equal(first.remainingOutstanding, 33.24);
  assert.equal(duplicate.idempotent, true);
  assert.equal(first.id, duplicate.id);
  assert.equal(invoice.data().paidAmount, 10);
  assert.equal(records.size, 1);
  assert.equal(emitted.length, 1);
});

test('transaction reference reuse with changed payment details conflicts', async () => {
  const { firestore, service } = setup();
  await service.recordPayment(payment);
  await assert.rejects(
    service.recordPayment({ ...payment, amount: 11 }),
    ConflictException,
  );
  const invoice = await firestore.collection('invoices').doc(payment.invoiceId).get();
  assert.equal(invoice.data().paidAmount, 10);
});

test('invalid invoice state or overpayment does not create a payment or change invoice balance', async () => {
  const { firestore, service } = setup();
  await assert.rejects(
    service.recordPayment({ ...payment, amount: 100 }),
    ConflictException,
  );
  const invoice = await firestore.collection('invoices').doc(payment.invoiceId).get();
  const payments = await firestore.collection('payments').where('transactionRef', '==', payment.transactionRef).get();
  assert.equal(invoice.data().paidAmount, 0);
  assert.equal(payments.size, 0);
});
