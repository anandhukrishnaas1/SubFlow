const DAYS_PER_YEAR = 365;
const MONTHS_PER_YEAR = 12;

export function toFiniteNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getMonthlyRecurringAmount(subscription: Record<string, unknown>): number {
  const subtotal = toFiniteNumber(subscription.subtotal);
  const discount = toFiniteNumber(subscription.discountAmount);
  const tax = toFiniteNumber(subscription.taxAmount);
  const total = toFiniteNumber(subscription.total);
  const beforeTax = subtotal > 0 ? subtotal : Math.max(0, total - tax);
  const recurringValue = Math.max(0, beforeTax - discount);
  const interval = String(subscription.billingInterval || 'monthly').toLowerCase();

  switch (interval) {
    case 'daily':
      return (recurringValue * DAYS_PER_YEAR) / MONTHS_PER_YEAR;
    case 'weekly':
      return (recurringValue * 52) / MONTHS_PER_YEAR;
    case 'yearly':
      return recurringValue / MONTHS_PER_YEAR;
    case 'monthly':
      return recurringValue;
    default:
      return 0;
  }
}

export function getInvoiceOutstanding(invoice: Record<string, unknown>): number {
  if (invoice.outstandingAmount !== undefined && invoice.outstandingAmount !== null) {
    return Math.max(0, toFiniteNumber(invoice.outstandingAmount));
  }
  return Math.max(
    0,
    toFiniteNumber(invoice.total) - toFiniteNumber(invoice.paidAmount),
  );
}

export function parseAnalyticsDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    const seconds = toFiniteNumber((value as { seconds?: unknown }).seconds);
    const date = new Date(seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isInvoiceCounted(invoice: Record<string, unknown>): boolean {
  const status = String(invoice.status || '').toLowerCase();
  return !['draft', 'cancelled'].includes(status);
}

export function isPaymentCollected(payment: Record<string, unknown>): boolean {
  const status = String(payment.status || '').toLowerCase();
  return !['failed', 'cancelled', 'void', 'refunded'].includes(status);
}

export function getCollectedPayments<T extends Record<string, unknown> & { id: string }>(
  payments: T[],
): T[] {
  const seen = new Set<string>();
  return payments.filter((payment) => {
    if (!isPaymentCollected(payment)) return false;
    const transactionRef = String(payment.transactionRef || '').trim();
    const key = transactionRef ? `transaction:${transactionRef}` : `record:${payment.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isInvoiceOverdue(
  invoice: Record<string, unknown>,
  now: Date,
): boolean {
  const status = String(invoice.status || '').toLowerCase();
  const dueDate = parseAnalyticsDate(invoice.dueDate);
  return (
    !['draft', 'paid', 'cancelled'].includes(status) &&
    getInvoiceOutstanding(invoice) > 0 &&
    dueDate !== null &&
    dueDate.getTime() < now.getTime()
  );
}
