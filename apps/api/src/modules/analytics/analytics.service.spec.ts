import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { FirebaseService } from '../../firebase/firebase.service';
import { roundCurrency } from './analytics.calculations';
import { AnalyticsService } from './analytics.service';

function createFirebase(records: Record<string, Array<Record<string, unknown>>>) {
  return {
    isMockFirestore: false,
    getFirestore: () => ({
      collection: (name: string) => ({
        get: async () => ({
          docs: (records[name] || []).map((record, index) => ({
            id: String(record.id || `${name}-${index}`),
            data: () => record,
          })),
        }),
      }),
    }),
  } as unknown as FirebaseService;
}

describe('AnalyticsService', () => {
  it('explains unavailable retention rather than substituting customer churn', async () => {
    const firebase = {
      isMockFirestore: false,
      getFirestore: () => ({
        collection: () => ({ get: async () => ({ docs: [] }) }),
      }),
    } as unknown as FirebaseService;

    const response = await new AnalyticsService(firebase).ask('What is our NRR?');
    assert.match(response.answer, /NRR\) cannot currently be calculated/);
    assert.equal(
      response.evidence.some((item) => item.label === 'NRR available'),
      true,
    );
  });

  it('calculates customer churn from eligible lifecycle records and ignores drafts', async () => {
    const now = new Date();
    const daysAgo = (days: number) =>
      new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const records: Record<string, Array<Record<string, unknown>>> = {
      users: [],
      subscriptions: [
        {
          id: 'active-customer',
          customerId: 'customer-1',
          status: 'active',
          activatedAt: daysAgo(90),
        },
        {
          id: 'cancelled-customer',
          customerId: 'customer-2',
          status: 'cancelled',
          startDate: daysAgo(90),
          cancelledAt: daysAgo(10),
        },
        {
          id: 'paused-customer',
          customerId: 'customer-3',
          status: 'paused',
          startDate: daysAgo(120),
          pausedAt: daysAgo(60),
        },
        { id: 'draft', status: 'draft' },
      ],
      invoices: [],
      payments: [],
    };
    const firebase = createFirebase(records);

    const metrics = await new AnalyticsService(firebase).getKpis();
    assert.equal(metrics.customerChurnRate, 50);
    assert.equal(metrics.dataAvailability.churnMetrics, true);
  });

  it('counts multiple cancellations once at customer level', async () => {
    const now = new Date();
    const records = {
      subscriptions: [
        {
          id: 'cancelled-a',
          customerId: 'customer-a',
          status: 'cancelled',
          startDate: new Date(now.getTime() - 90 * 86400000).toISOString(),
          cancelledAt: new Date(now.getTime() - 12 * 86400000).toISOString(),
        },
        {
          id: 'cancelled-b',
          customerId: 'customer-a',
          status: 'cancelled',
          startDate: new Date(now.getTime() - 70 * 86400000).toISOString(),
          cancelledAt: new Date(now.getTime() - 8 * 86400000).toISOString(),
        },
      ],
    };

    const metrics = await new AnalyticsService(createFirebase(records)).getKpis();
    assert.equal(metrics.customerChurnRate, 100);
  });

  it('counts a customer with older and current-period cancellations as churned once', async () => {
    const now = new Date();
    const records = {
      subscriptions: [
        {
          id: 'older-cancellation',
          customerId: 'customer-a',
          status: 'cancelled',
          startDate: new Date(now.getTime() - 180 * 86400000).toISOString(),
          cancelledAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
        },
        {
          id: 'current-cancellation',
          customerId: 'customer-a',
          status: 'cancelled',
          startDate: new Date(now.getTime() - 90 * 86400000).toISOString(),
          cancelledAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
        },
      ],
    };

    const metrics = await new AnalyticsService(createFirebase(records)).getKpis();
    assert.equal(metrics.customerChurnRate, 100);
  });

  it('does not count a customer who has another active subscription', async () => {
    const now = new Date();
    const records = {
      subscriptions: [
        {
          id: 'older-cancellation',
          customerId: 'customer-a',
          status: 'cancelled',
          startDate: new Date(now.getTime() - 180 * 86400000).toISOString(),
          cancelledAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
        },
        {
          id: 'active-subscription',
          customerId: 'customer-a',
          status: 'active',
          activatedAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
        },
      ],
    };

    const metrics = await new AnalyticsService(createFirebase(records)).getKpis();
    assert.equal(metrics.customerChurnRate, 0);
  });

  it('does not count a customer who remains active', async () => {
    const records = {
      subscriptions: [
        {
          id: 'active-subscription',
          customerId: 'customer-a',
          status: 'active',
          activatedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
        },
      ],
    };

    const metrics = await new AnalyticsService(createFirebase(records)).getKpis();
    assert.equal(metrics.customerChurnRate, 0);
  });

  it('returns unavailable churn for empty and incomplete lifecycle data', async () => {
    const empty = await new AnalyticsService(createFirebase({ subscriptions: [] })).getKpis();
    assert.equal(empty.customerChurnRate, null);

    const missingDate = await new AnalyticsService(
      createFirebase({
        subscriptions: [
          { id: 'undated', customerId: 'customer-a', status: 'cancelled' },
        ],
      }),
    ).getKpis();
    assert.equal(missingDate.customerChurnRate, null);

    const missingCustomerId = await new AnalyticsService(
      createFirebase({
        subscriptions: [
          {
            id: 'no-customer-id',
            status: 'active',
            activatedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
          },
        ],
      }),
    ).getKpis();
    assert.equal(missingCustomerId.customerChurnRate, null);

    const missingPauseDate = await new AnalyticsService(
      createFirebase({
        subscriptions: [
          {
            id: 'undated-pause',
            customerId: 'customer-a',
            status: 'paused',
            startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
          },
        ],
      }),
    ).getKpis();
    assert.equal(missingPauseDate.customerChurnRate, null);
  });

  it('routes customer churn, revenue churn, NRR, and cohort retention separately', async () => {
    const service = new AnalyticsService(createFirebase({ subscriptions: [] }));
    const customerChurn = await service.ask('What percentage of customers did we lose?');
    const revenueChurn = await service.ask('How much recurring revenue did we lose?');
    const nrr = await service.ask('What is our net revenue retention?');
    const cohort = await service.ask(
      'How many customers from each acquisition cohort remain active?',
    );

    assert.match(customerChurn.answer, /Customer churn cannot currently be calculated/);
    assert.equal(customerChurn.evidence.some((item) => item.label === 'Customer churn rate'), true);
    assert.ok(customerChurn.limitations.length > 0);

    assert.match(revenueChurn.answer, /Revenue churn cannot currently be calculated/);
    assert.equal(revenueChurn.evidence.some((item) => item.label === 'Revenue churn available'), true);
    assert.ok(revenueChurn.limitations.length > 0);

    assert.match(nrr.answer, /NRR\) cannot currently be calculated/);
    assert.equal(nrr.evidence.some((item) => item.label === 'NRR available'), true);
    assert.ok(nrr.limitations.length > 0);

    assert.match(cohort.answer, /Cohort retention cannot currently be calculated/);
    assert.equal(cohort.evidence.some((item) => item.label === 'Cohort retention available'), true);
    assert.ok(cohort.limitations.length > 0);
  });

  it('uses all records by default and respects this month, last month, and explicit collection ranges', async () => {
    const now = new Date();
    const previousMonthPayment = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15, 12),
    );
    const currentMonthPayment = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12),
    );
    const records = {
      payments: [
        {
          id: 'previous-month',
          amount: 10,
          status: 'completed',
          paymentDate: previousMonthPayment.toISOString(),
        },
        {
          id: 'current-month',
          amount: 20,
          status: 'completed',
          paymentDate: currentMonthPayment.toISOString(),
          transactionRef: 'txn-current',
        },
        {
          id: 'duplicate-current',
          amount: 20,
          status: 'completed',
          paymentDate: currentMonthPayment.toISOString(),
          transactionRef: 'txn-current',
        },
        {
          id: 'failed-current',
          amount: 500,
          status: 'failed',
          paymentDate: currentMonthPayment.toISOString(),
        },
      ],
    };
    const service = new AnalyticsService(createFirebase(records));
    const allTime = await service.ask('How much revenue was collected?');
    const thisMonth = await service.ask('How much revenue was collected this month?');
    const lastMonth = await service.ask('How much revenue was collected last month?');
    const explicit = await service.ask(
      `How much revenue was collected from ${previousMonthPayment.toISOString().slice(0, 10)} to ${currentMonthPayment.toISOString().slice(0, 10)}?`,
    );

    assert.match(allTime.answer, /USD 30\.00/);
    assert.equal(allTime.period, 'All available payment records');
    assert.match(thisMonth.answer, /USD 20\.00/);
    assert.match(thisMonth.period, /Current calendar month/);
    assert.match(lastMonth.answer, /USD 10\.00/);
    assert.match(lastMonth.period, /Last calendar month/);
    assert.match(explicit.answer, /USD 30\.00/);
    assert.match(explicit.period, /through/);
    assert.equal(allTime.evidence.find((item) => item.label === 'Unique recorded payments')?.value, 2);
  });

  it('keeps ARR equal to displayed MRR multiplied by twelve for fractional mixed intervals', async () => {
    const records = {
      subscriptions: [
        { id: 'monthly', status: 'active', billingInterval: 'monthly', subtotal: 10.015 },
        {
          id: 'annual',
          status: 'active',
          billingInterval: 'yearly',
          subtotal: 120.18,
          taxAmount: 24.036,
          discountAmount: 0.18,
        },
        { id: 'weekly', status: 'active', billingInterval: 'weekly', subtotal: 1.003 },
        { id: 'daily', status: 'active', billingInterval: 'daily', subtotal: 0.111 },
      ],
    };
    const metrics = await new AnalyticsService(createFirebase(records)).getKpis();
    const expectedMrr =
      10.015 + 120 / 12 + (1.003 * 52) / 12 + (0.111 * 365) / 12;

    assert.equal(metrics.mrr, roundCurrency(expectedMrr));
    assert.equal(metrics.arr, roundCurrency(metrics.mrr * 12));
  });

  it('calculates current financial metrics from business records, not cached counters', async () => {
    const now = new Date();
    const daysFromNow = (days: number) =>
      new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const records: Record<string, Array<Record<string, unknown>>> = {
      users: [
        { id: 'customer-1', role: 'customer' },
        { id: 'customer-2', role: 'customer' },
        { id: 'admin-1', role: 'admin' },
      ],
      subscriptions: [
        {
          id: 'monthly',
          status: 'active',
          billingInterval: 'monthly',
          subtotal: 100,
          taxAmount: 20,
          discountAmount: 10,
          total: 110,
          nextBillingDate: daysFromNow(3),
        },
        {
          id: 'annual',
          status: 'active',
          billingInterval: 'yearly',
          subtotal: 1200,
          taxAmount: 240,
        },
        {
          id: 'paused',
          status: 'paused',
          billingInterval: 'monthly',
          subtotal: 500,
        },
        {
          id: 'test-subscription',
          dataOrigin: 'SYNTHETIC',
          status: 'active',
          billingInterval: 'monthly',
          subtotal: 10000,
        },
      ],
      invoices: [
        {
          id: 'overdue',
          status: 'confirmed',
          total: 120,
          paidAmount: 30,
          outstandingAmount: 90,
          dueDate: daysFromNow(-2),
        },
        {
          id: 'paid',
          status: 'paid',
          total: 55,
          paidAmount: 55,
          outstandingAmount: 0,
          dueDate: daysFromNow(10),
        },
        { id: 'cancelled', status: 'cancelled', total: 100, outstandingAmount: 100 },
        { id: 'draft', status: 'draft', total: 200, outstandingAmount: 200 },
        {
          id: 'synthetic-invoice',
          data_origin: 'SYNTHETIC',
          status: 'confirmed',
          total: 5000,
          outstandingAmount: 5000,
        },
      ],
      payments: [
        { id: 'payment-1', amount: 60, status: 'completed' },
        { id: 'failed-payment', amount: 40, status: 'failed' },
      ],
      counters: [{ id: 'analytics', mrr: 999999, totalRevenue: 888888 }],
    };
    const fakeFirestore = {
      collection: (name: string) => ({
        get: async () => ({
          docs: (records[name] || []).map((record) => ({
            id: record.id,
            data: () => record,
          })),
        }),
      }),
    };
    const firebase = {
      getFirestore: () => fakeFirestore,
    } as unknown as FirebaseService;
    const oldSyntheticSetting = process.env.INCLUDE_SYNTHETIC_ANALYTICS;
    process.env.INCLUDE_SYNTHETIC_ANALYTICS = 'false';

    try {
      const metrics = await new AnalyticsService(firebase).getKpis();
      assert.equal(metrics.totalCustomers, 2);
      assert.equal(metrics.activeSubscriptions, 2);
      assert.equal(metrics.pausedSubscriptions, 1);
      assert.equal(metrics.mrr, 190);
      assert.equal(metrics.arr, 2280);
      assert.equal(metrics.totalCollected, 60);
      assert.equal(metrics.totalInvoiced, 175);
      assert.equal(metrics.outstandingPayments, 90);
      assert.equal(metrics.overdueInvoices, 1);
      assert.equal(metrics.upcomingRenewals, 1);
      assert.equal(metrics.arpu, 95);
      assert.equal(metrics.netCollectionRate, 48.57);
      assert.equal(metrics.dataAvailability.churnMetrics, false);
    } finally {
      if (oldSyntheticSetting === undefined) {
        delete process.env.INCLUDE_SYNTHETIC_ANALYTICS;
      } else {
        process.env.INCLUDE_SYNTHETIC_ANALYTICS = oldSyntheticSetting;
      }
    }
  });
});
