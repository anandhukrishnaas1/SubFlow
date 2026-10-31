import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  getInvoiceOutstanding,
  getCollectedPayments,
  getMonthlyRecurringAmount,
  isInvoiceOverdue,
} from './analytics.calculations';

describe('analytics calculations', () => {
  it('normalizes recurring revenue before tax and after discounts', () => {
    assert.equal(
      getMonthlyRecurringAmount({
        billingInterval: 'monthly',
        subtotal: 78,
        taxAmount: 15.6,
        discountAmount: 8,
        total: 85.6,
      }),
      70,
    );
    assert.equal(
      getMonthlyRecurringAmount({
        billingInterval: 'yearly',
        subtotal: 1200,
        taxAmount: 240,
      }),
      100,
    );
    assert.equal(
      getMonthlyRecurringAmount({ billingInterval: 'weekly', subtotal: 10 }),
      (10 * 52) / 12,
    );
    assert.equal(
      getMonthlyRecurringAmount({ billingInterval: 'daily', subtotal: 2 }),
      (2 * 365) / 12,
    );
    assert.equal(
      getMonthlyRecurringAmount({
        billingInterval: 'monthly',
        subtotal: 10.015,
        taxAmount: 2.003,
        discountAmount: 0.015,
        total: 12.003,
      }),
      10,
    );
  });

  it('excludes failed payments and deduplicates matching transaction references', () => {
    const collected = getCollectedPayments([
      { id: 'one', amount: 10, status: 'completed', transactionRef: 'txn-1' },
      { id: 'duplicate', amount: 10, status: 'completed', transactionRef: 'txn-1' },
      { id: 'failed', amount: 20, status: 'failed', transactionRef: 'txn-2' },
      { id: 'unique', amount: 5, status: 'completed' },
    ]);

    assert.deepEqual(collected.map((payment) => payment.id), ['one', 'unique']);
  });

  it('uses the recorded invoice balance and safely derives a missing balance', () => {
    assert.equal(getInvoiceOutstanding({ outstandingAmount: 3.25, total: 100 }), 3.25);
    assert.equal(getInvoiceOutstanding({ total: 100, paidAmount: 40 }), 60);
    assert.equal(getInvoiceOutstanding({ total: 'invalid' }), 0);
  });

  it('requires an unpaid, non-cancelled invoice with a valid past due date', () => {
    const now = new Date('2026-10-31T12:00:00Z');
    assert.equal(
      isInvoiceOverdue(
        { status: 'confirmed', outstandingAmount: 10, dueDate: '2026-10-30T00:00:00Z' },
        now,
      ),
      true,
    );
    assert.equal(
      isInvoiceOverdue(
        { status: 'confirmed', outstandingAmount: 0, dueDate: '2026-10-30T00:00:00Z' },
        now,
      ),
      false,
    );
    assert.equal(
      isInvoiceOverdue(
        { status: 'paid', outstandingAmount: 10, dueDate: '2026-10-30T00:00:00Z' },
        now,
      ),
      false,
    );
  });
});
