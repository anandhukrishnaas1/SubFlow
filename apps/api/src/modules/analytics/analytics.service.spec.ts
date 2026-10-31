import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { MockFirestore } from '../../firebase/mock-firestore';
import { AnalyticsService } from './analytics.service';

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

function createService(records: Record<string, Array<Record<string, unknown>>>) {
  const firestore = {
    collection: (name: string) => ({
      get: async () => ({
        docs: (records[name] || []).map((record, index) => ({
          id: String(record.id || `${name}-${index}`),
          data: () => record,
        })),
      }),
      doc: () => ({ set: async () => undefined }),
    }),
  };
  return new AnalyticsService({
    getFirestore: () => firestore,
    isMockFirestore: false,
  } as never);
}

test('customer churn is calculated once per customer across multiple subscriptions', async () => {
  const service = createService({
    subscriptions: [
      { id: 'old', customerId: 'c1', status: 'cancelled', startDate: daysAgo(120), cancelledAt: daysAgo(50) },
      { id: 'new-a', customerId: 'c1', status: 'cancelled', startDate: daysAgo(90), cancelledAt: daysAgo(5) },
      { id: 'new-b', customerId: 'c1', status: 'cancelled', startDate: daysAgo(75), cancelledAt: daysAgo(3) },
    ],
  });
  assert.equal((await service.getKpis()).customerChurnRate, 100);
});

test('an older cancellation does not churn a customer with another active subscription', async () => {
  const service = createService({
    subscriptions: [
      { id: 'old', customerId: 'c1', status: 'cancelled', startDate: daysAgo(120), cancelledAt: daysAgo(50) },
      { id: 'current', customerId: 'c1', status: 'active', startDate: daysAgo(90) },
    ],
  });
  assert.equal((await service.getKpis()).customerChurnRate, 0);
});

test('customer who ceases activity during the period is counted as churned', async () => {
  const service = createService({
    subscriptions: [
      { id: 'sub', customerId: 'c1', status: 'cancelled', startDate: daysAgo(90), cancelledAt: daysAgo(4) },
    ],
  });
  assert.equal((await service.getKpis()).customerChurnRate, 100);
});

test('a customer who remains active is not counted as churned', async () => {
  const service = createService({
    subscriptions: [
      { id: 'sub', customerId: 'c1', status: 'active', startDate: daysAgo(90) },
    ],
  });
  assert.equal((await service.getKpis()).customerChurnRate, 0);
});

test('empty or incomplete subscription history reports churn unavailable', async () => {
  assert.equal((await createService({}).getKpis()).customerChurnRate, null);
  const missingDates = createService({
    subscriptions: [{ id: 'sub', customerId: 'c1', status: 'cancelled' }],
  });
  assert.equal((await missingDates.getKpis()).customerChurnRate, null);
});

test('MRR excludes tax and discounts consistently; displayed ARR equals displayed MRR times twelve', async () => {
  const service = createService({
    subscriptions: [
      { id: 'monthly', status: 'active', billingInterval: 'monthly', subtotal: 10.01, taxAmount: 1.2, discountAmount: 0.02 },
      { id: 'annual', status: 'active', billingInterval: 'yearly', subtotal: 120.11, taxAmount: 14.41, discountAmount: 0.11 },
      { id: 'weekly', status: 'active', billingInterval: 'weekly', subtotal: 2.01, taxAmount: 0.2, discountAmount: 0.01 },
    ],
  });
  const kpis = await service.getKpis();
  assert.equal(kpis.arr, Math.round(kpis.mrr * 12 * 100) / 100);
  assert.equal(kpis.mrr, 28.66);
});

test('Copilot keeps customer churn, revenue churn, NRR, and cohort intents separate', async () => {
  const service = createService({
    subscriptions: [
      { id: 'sub', customerId: 'c1', status: 'cancelled', startDate: daysAgo(90), cancelledAt: daysAgo(4) },
    ],
  });
  const churn = await service.ask('What percentage of customers did we lose?');
  const revenueChurn = await service.ask('How much recurring revenue did we lose?');
  const nrr = await service.ask('What is our net revenue retention?');
  const cohort = await service.ask('How many customers from each acquisition cohort remain active?');

  assert.match(churn.answer, /customer churn over the trailing 30 days is 100/i);
  assert.match(revenueChurn.answer, /Revenue churn cannot currently be calculated/);
  assert.match(nrr.answer, /Net revenue retention cannot currently be calculated/);
  assert.match(cohort.answer, /Cohort retention cannot currently be calculated/);
  assert.ok(revenueChurn.evidence.length > 0 && revenueChurn.limitations.length > 0);
});

test('collection questions default to all records and honor calendar and explicit periods', async () => {
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10)).toISOString();
  const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 10)).toISOString();
  const service = createService({
    payments: [
      { id: 'current', amount: 10, status: 'completed', paymentDate: currentMonth, transactionRef: 'current-ref' },
      { id: 'previous', amount: 20, status: 'completed', paymentDate: previousMonth, transactionRef: 'previous-ref' },
      { id: 'failed', amount: 100, status: 'failed', paymentDate: currentMonth, transactionRef: 'failed-ref' },
      { id: 'duplicate', amount: 20, status: 'completed', paymentDate: previousMonth, transactionRef: 'previous-ref' },
    ],
  });
  const all = await service.ask('How much revenue was collected?');
  const thisMonth = await service.ask('How much revenue was collected this month?');
  const lastMonth = await service.ask('How much revenue was collected last month?');
  const explicit = await service.ask(
    `How much revenue was collected ${previousMonth.slice(0, 10)} to ${previousMonth.slice(0, 10)}?`,
  );

  assert.equal(all.evidence[0].value, 30);
  assert.equal(thisMonth.evidence[0].value, 10);
  assert.equal(lastMonth.evidence[0].value, 20);
  assert.equal(explicit.evidence[0].value, 20);
  assert.match(all.period, /All available payment records/);
  assert.match(thisMonth.period, /Current calendar month/);
  assert.match(lastMonth.period, /Last calendar month/);
});

test('unsupported Copilot questions use safe fallback', async () => {
  const result = await createService({}).ask('How will a competitor respond?');
  assert.match(result.answer, /can answer questions about current MRR\/ARR/);
  assert.deepEqual(result.evidence, []);
});

test('mock seed records are marked synthetic and excluded unless explicitly enabled in development', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousIncludeSynthetic = process.env.INCLUDE_SYNTHETIC_ANALYTICS;
  process.env.NODE_ENV = 'development';
  delete process.env.INCLUDE_SYNTHETIC_ANALYTICS;

  try {
    const firestore = new MockFirestore();
    const service = new AnalyticsService({
      getFirestore: () => firestore,
      isMockFirestore: true,
    } as never);
    const defaultMetrics = await service.getKpis();
    assert.equal(defaultMetrics.totalCustomers, 0);
    assert.equal(defaultMetrics.totalCollected, 0);

    process.env.INCLUDE_SYNTHETIC_ANALYTICS = 'true';
    const optedInMetrics = await service.getKpis();
    assert.ok(optedInMetrics.totalCustomers > 0);
    assert.ok(optedInMetrics.totalCollected > 0);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousIncludeSynthetic === undefined) {
      delete process.env.INCLUDE_SYNTHETIC_ANALYTICS;
    } else {
      process.env.INCLUDE_SYNTHETIC_ANALYTICS = previousIncludeSynthetic;
    }
  }
});
