import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getCollectedPayments,
  getMonthlyRecurringAmount,
  isInvoiceOverdue,
} from './analytics.calculations';

test('normalizes billing intervals before currency rounding', () => {
  const subscriptions = [
    { subtotal: 100, discountAmount: 10, taxAmount: 20, total: 110, billingInterval: 'monthly' },
    { subtotal: 1200, discountAmount: 120, taxAmount: 240, total: 1320, billingInterval: 'yearly' },
    { subtotal: 70, discountAmount: 7, taxAmount: 12.6, total: 75.6, billingInterval: 'weekly' },
    { subtotal: 10, discountAmount: 1, taxAmount: 1.8, total: 10.8, billingInterval: 'daily' },
  ];

  assert.deepEqual(
    subscriptions.map(getMonthlyRecurringAmount),
    [90, 90, 273, 273.75],
  );
});

test('deduplicates recorded payments and excludes failed or reversed payments', () => {
  const payments = getCollectedPayments([
    { id: 'one', transactionRef: 'ref-a', amount: 10, status: 'completed' },
    { id: 'duplicate', transactionRef: 'ref-a', amount: 10, status: 'completed' },
    { id: 'failed', transactionRef: 'ref-b', amount: 50, status: 'failed' },
    { id: 'refunded', transactionRef: 'ref-c', amount: 20, status: 'refunded' },
    { id: 'legacy', amount: 5 },
  ]);
  assert.deepEqual(payments.map(({ id }) => id), ['one', 'legacy']);
});

test('overdue detection requires a balance and excludes terminal invoices', () => {
  const now = new Date('2026-10-31T12:00:00.000Z');
  assert.equal(isInvoiceOverdue({ status: 'confirmed', outstandingAmount: 2, dueDate: '2026-10-30' }, now), true);
  assert.equal(isInvoiceOverdue({ status: 'confirmed', outstandingAmount: 0, dueDate: '2026-10-30' }, now), false);
  assert.equal(isInvoiceOverdue({ status: 'paid', outstandingAmount: 2, dueDate: '2026-10-30' }, now), false);
});
