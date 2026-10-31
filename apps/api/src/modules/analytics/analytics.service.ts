import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SubscriptionStatus, UserRole } from '@subflow/shared';
import { FirebaseService } from '../../firebase/firebase.service';
import {
  getCollectedPayments,
  getInvoiceOutstanding,
  getMonthlyRecurringAmount,
  isInvoiceCounted,
  isInvoiceOverdue,
  parseAnalyticsDate,
  roundCurrency,
  toFiniteNumber,
} from './analytics.calculations';
import {
  AnalyticsAskResponse,
  AnalyticsKpis,
  AnalyticsRisk,
  BillingTrend,
} from './analytics.types';

type AnalyticsRecord = Record<string, any> & { id: string };

interface AnalyticsDataset {
  users: AnalyticsRecord[];
  subscriptions: AnalyticsRecord[];
  invoices: AnalyticsRecord[];
  payments: AnalyticsRecord[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly firebase: FirebaseService) {}

  private get countersDoc() {
    return this.firebase.getFirestore().collection('counters').doc('analytics');
  }

  private async getCollection(name: string): Promise<AnalyticsRecord[]> {
    const snapshot = await this.firebase.getFirestore().collection(name).get();
    return snapshot.docs.map((doc) => ({ ...(doc.data() as object), id: doc.id }));
  }

  private async getDataset(): Promise<AnalyticsDataset> {
    const [users, subscriptions, invoices, payments] = await Promise.all([
      this.getCollection('users'),
      this.getCollection('subscriptions'),
      this.getCollection('invoices'),
      this.getCollection('payments'),
    ]);
    return { users, subscriptions, invoices, payments };
  }

  private businessRecords(records: AnalyticsRecord[]): AnalyticsRecord[] {
    const includeSynthetic =
      process.env.NODE_ENV === 'development' &&
      process.env.INCLUDE_SYNTHETIC_ANALYTICS === 'true';
    return records.filter((record) => {
      const synthetic =
        record.dataOrigin === 'SYNTHETIC' || record.data_origin === 'SYNTHETIC';
      return (
        (!synthetic || includeSynthetic) &&
        (!this.firebase.isMockFirestore || includeSynthetic)
      );
    });
  }

  async getKpis(): Promise<AnalyticsKpis> {
    return this.calculateKpis(await this.getDataset());
  }

  async recalculateAll(): Promise<AnalyticsKpis> {
    this.logger.log('Recalculating analytics from Firestore source records');
    const metrics = this.calculateKpis(await this.getDataset());
    await this.countersDoc.set(metrics, { merge: true });
    return metrics;
  }

  private calculateKpis(dataset: AnalyticsDataset): AnalyticsKpis {
    const now = new Date();
    const users = this.businessRecords(dataset.users);
    const subscriptions = this.businessRecords(dataset.subscriptions);
    const invoices = this.businessRecords(dataset.invoices);
    const payments = this.businessRecords(dataset.payments);
    const customers = users.filter((user) => user.role === UserRole.CUSTOMER);
    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === SubscriptionStatus.ACTIVE,
    );
    const mrr = activeSubscriptions.reduce(
      (total, subscription) => total + getMonthlyRecurringAmount(subscription),
      0,
    );
    const eligibleInvoices = invoices.filter(isInvoiceCounted);
    const collected = getCollectedPayments(payments).reduce(
      (total, payment) => total + toFiniteNumber(payment.amount),
      0,
    );
    const invoiced = eligibleInvoices.reduce(
      (total, invoice) => total + this.invoiceTotal(invoice),
      0,
    );
    const paidAmount = eligibleInvoices.reduce(
      (total, invoice) => total + toFiniteNumber(invoice.paidAmount),
      0,
    );
    const outstanding = eligibleInvoices.reduce(
      (total, invoice) => total + getInvoiceOutstanding(invoice),
      0,
    );
    const upcomingRenewals = this.getUpcomingRenewalsFrom(
      activeSubscriptions,
      now,
      new Date(now.getTime() + 7 * 86400000),
    );
    const churnRate = this.calculateCustomerChurnRate(subscriptions, now);
    const roundedMrr = roundCurrency(mrr);

    return {
      totalCustomers: customers.length,
      activeSubscriptions: activeSubscriptions.length,
      pausedSubscriptions: subscriptions.filter(
        (subscription) => subscription.status === SubscriptionStatus.PAUSED,
      ).length,
      cancelledSubscriptions: subscriptions.filter(
        (subscription) => subscription.status === SubscriptionStatus.CANCELLED,
      ).length,
      customerChurnRate: churnRate,
      mrr: roundedMrr,
      arr: roundCurrency(roundedMrr * 12),
      totalRevenue: roundCurrency(collected),
      totalCollected: roundCurrency(collected),
      totalInvoiced: roundCurrency(invoiced),
      outstandingPayments: roundCurrency(outstanding),
      overdueInvoices: invoices.filter((invoice) => isInvoiceOverdue(invoice, now)).length,
      upcomingRenewals: upcomingRenewals.length,
      arpu: customers.length ? roundCurrency(mrr / customers.length) : null,
      netCollectionRate: invoiced > 0 ? roundCurrency((paidAmount / invoiced) * 100) : null,
      currency: 'USD',
      generatedAt: now.toISOString(),
      lastUpdated: now.toISOString(),
      dataAvailability: {
        historicalSubscriptionData: churnRate !== null,
        churnMetrics: churnRate !== null,
        revenueForecast: false,
        sourceMode: this.firebase.isMockFirestore ? 'mock' : 'live',
        syntheticDataIncluded:
          process.env.NODE_ENV === 'development' &&
          process.env.INCLUDE_SYNTHETIC_ANALYTICS === 'true',
      },
    };
  }

  private invoiceTotal(invoice: AnalyticsRecord): number {
    if (invoice.total !== undefined && invoice.total !== null) {
      return Math.max(0, toFiniteNumber(invoice.total));
    }
    return Math.max(
      0,
      toFiniteNumber(invoice.subtotal) +
        toFiniteNumber(invoice.taxAmount) -
        toFiniteNumber(invoice.discountAmount),
    );
  }

  private calculateCustomerChurnRate(
    subscriptions: AnalyticsRecord[],
    now: Date,
  ): number | null {
    const periodStart = new Date(now.getTime() - 30 * 86400000);
    const lifecycle = subscriptions
      .filter((subscription) =>
        ['active', 'paused', 'cancelled', 'closed'].includes(
          String(subscription.status || '').toLowerCase(),
        ),
      )
      .map((subscription) => {
        const status = String(subscription.status || '').toLowerCase();
        return {
          customerId: String(subscription.customerId || ''),
          status,
          start: parseAnalyticsDate(
            subscription.activatedAt || subscription.startDate || subscription.createdAt,
          ),
          endedAt: parseAnalyticsDate(
            status === 'cancelled'
              ? subscription.cancelledAt
              : status === 'closed'
                ? subscription.closedAt
                : status === 'paused'
                  ? subscription.pausedAt
                  : null,
          ),
        };
      });

    if (
      lifecycle.some(
        ({ customerId, status, start, endedAt }) =>
          !customerId ||
          start === null ||
          (['cancelled', 'closed'].includes(status) &&
            (endedAt === null || endedAt.getTime() > now.getTime())) ||
          (status === 'paused' &&
            start.getTime() < periodStart.getTime() &&
            (endedAt === null || endedAt.getTime() > now.getTime())),
      )
    ) {
      return null;
    }

    const openingCustomerIds = new Set(
      lifecycle
        .filter(
          ({ status, start, endedAt }) =>
            start !== null &&
            start.getTime() < periodStart.getTime() &&
            (status === 'active' ||
              (endedAt !== null &&
                endedAt.getTime() >= periodStart.getTime() &&
                endedAt.getTime() <= now.getTime())),
        )
        .map(({ customerId }) => customerId),
    );
    if (!openingCustomerIds.size) return null;

    const churnedCustomers = Array.from(openingCustomerIds).filter((customerId) => {
      const customerSubscriptions = lifecycle.filter(
        (subscription) => subscription.customerId === customerId,
      );
      return (
        !customerSubscriptions.some(({ status }) => ['active', 'paused'].includes(status)) &&
        customerSubscriptions.some(
          ({ status, endedAt }) =>
            ['cancelled', 'closed'].includes(status) &&
            endedAt !== null &&
            endedAt.getTime() >= periodStart.getTime() &&
            endedAt.getTime() <= now.getTime(),
        )
      );
    }).length;

    return roundCurrency((churnedCustomers / openingCustomerIds.size) * 100);
  }

  async getBillingTrends(from?: string, to?: string): Promise<BillingTrend[]> {
    const [invoices, payments] = await Promise.all([
      this.getCollection('invoices'),
      this.getCollection('payments'),
    ]);
    const now = new Date();
    const start = from
      ? new Date(Date.UTC(new Date(from).getUTCFullYear(), new Date(from).getUTCMonth(), 1))
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const end = to
      ? new Date(Date.UTC(new Date(to).getUTCFullYear(), new Date(to).getUTCMonth(), 1))
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthCount =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      end.getUTCMonth() -
      start.getUTCMonth() +
      1;
    if (monthCount < 1 || monthCount > 24) {
      throw new BadRequestException('Date range must cover between 1 and 24 calendar months.');
    }

    const months = new Map<string, BillingTrend>();
    for (let offset = 0; offset < monthCount; offset += 1) {
      const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset, 1));
      const key = date.toISOString().slice(0, 7);
      months.set(key, {
        month: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        periodStart: `${key}-01`,
        billed: 0,
        collected: 0,
        revenue: 0,
        paymentsCount: 0,
      });
    }

    for (const invoice of this.businessRecords(invoices).filter(isInvoiceCounted)) {
      const date = parseAnalyticsDate(invoice.issueDate || invoice.createdAt);
      const month = date && months.get(date.toISOString().slice(0, 7));
      if (month) month.billed += this.invoiceTotal(invoice);
    }
    for (const payment of getCollectedPayments(this.businessRecords(payments))) {
      const date = parseAnalyticsDate(payment.paymentDate || payment.createdAt);
      const month = date && months.get(date.toISOString().slice(0, 7));
      if (month) {
        month.collected += toFiniteNumber(payment.amount);
        month.paymentsCount += 1;
      }
    }
    return Array.from(months.values()).map((month) => ({
      ...month,
      billed: roundCurrency(month.billed),
      collected: roundCurrency(month.collected),
      revenue: roundCurrency(month.collected),
    }));
  }

  async getRevenueTrends(from?: string, to?: string): Promise<BillingTrend[]> {
    return this.getBillingTrends(from, to);
  }

  async getSubscriptionBreakdown() {
    const subscriptions = this.businessRecords(await this.getCollection('subscriptions'));
    const statusCounts: Record<string, number> = {};
    const intervalCounts: Record<string, number> = {};
    for (const subscription of subscriptions) {
      const status = String(subscription.status || 'unknown').toLowerCase();
      const interval = String(subscription.billingInterval || 'unknown').toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
    }
    return { total: subscriptions.length, statusCounts, intervalCounts };
  }

  async getSubscriptionMetrics() {
    const [users, subscriptions] = await Promise.all([
      this.getCollection('users'),
      this.getCollection('subscriptions'),
    ]);
    const records = this.businessRecords(subscriptions);
    const churnRate = this.calculateCustomerChurnRate(records, new Date());
    return {
      totalCustomers: this.businessRecords(users).filter(
        (user) => user.role === UserRole.CUSTOMER,
      ).length,
      activeSubscriptions: records.filter(
        (record) => record.status === SubscriptionStatus.ACTIVE,
      ).length,
      pausedSubscriptions: records.filter(
        (record) => record.status === SubscriptionStatus.PAUSED,
      ).length,
      cancelledSubscriptions: records.filter(
        (record) => record.status === SubscriptionStatus.CANCELLED,
      ).length,
      churnRate,
      revenueChurnRate: null,
      netRevenueRetention: null,
      cohortRetention: null,
      dataAvailability: {
        churnRate: churnRate !== null,
        revenueChurnRate: false,
        netRevenueRetention: false,
        cohortRetention: false,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getRenewals(days = 7) {
    const safeDays = Math.min(Math.max(days, 1), 90);
    const subscriptions = this.businessRecords(
      await this.getCollection('subscriptions'),
    ).filter((record) => record.status === SubscriptionStatus.ACTIVE);
    const now = new Date();
    return {
      days: safeDays,
      items: this.getUpcomingRenewalsFrom(
        subscriptions,
        now,
        new Date(now.getTime() + safeDays * 86400000),
      ),
      generatedAt: now.toISOString(),
    };
  }

  private getUpcomingRenewalsFrom(
    subscriptions: AnalyticsRecord[],
    now: Date,
    end: Date,
  ) {
    return subscriptions
      .map((subscription) => ({
        id: subscription.id,
        customerId: subscription.customerId,
        customerName: subscription.customerName || 'Customer',
        planName: subscription.planName || 'Subscription',
        nextBillingDate: parseAnalyticsDate(subscription.nextBillingDate),
      }))
      .filter(
        (subscription) =>
          subscription.nextBillingDate !== null &&
          subscription.nextBillingDate.getTime() >= now.getTime() &&
          subscription.nextBillingDate.getTime() <= end.getTime(),
      )
      .map((subscription) => ({
        ...subscription,
        nextBillingDate: subscription.nextBillingDate!.toISOString(),
      }))
      .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate));
  }

  async getRisks(): Promise<{ items: AnalyticsRisk[]; generatedAt: string }> {
    const [invoices, payments] = await Promise.all([
      this.getCollection('invoices'),
      this.getCollection('payments'),
    ]);
    const now = new Date();
    const items: AnalyticsRisk[] = [];
    for (const invoice of this.businessRecords(invoices).filter((record) =>
      isInvoiceOverdue(record, now),
    )) {
      const dueDate = parseAnalyticsDate(invoice.dueDate);
      const daysLate = dueDate
        ? Math.floor((now.getTime() - dueDate.getTime()) / 86400000)
        : 0;
      items.push({
        reference: String(invoice.number || invoice.id),
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        signal: 'overdue_invoice',
        evidence: [
          `Outstanding balance: ${roundCurrency(getInvoiceOutstanding(invoice))}`,
          `${daysLate} day(s) past due`,
          `Invoice status: ${String(invoice.status)}`,
        ],
        severity: daysLate > 30 ? 'high' : daysLate > 7 ? 'medium' : 'low',
        recommendedAction: 'Review the account and follow up on the unpaid invoice.',
        detectedAt: now.toISOString(),
      });
    }
    for (const payment of this.businessRecords(payments).filter(
      (record) => String(record.status || '').toLowerCase() === 'failed',
    )) {
      items.push({
        reference: String(payment.invoiceNumber || payment.invoiceId || payment.id),
        customerId: payment.customerId,
        customerName: payment.customerName,
        signal: 'failed_payment',
        evidence: [`Payment status: failed`, `Amount: ${roundCurrency(toFiniteNumber(payment.amount))}`],
        severity: 'medium',
        recommendedAction: 'Check the payment failure reason and contact the customer if needed.',
        detectedAt: now.toISOString(),
      });
    }
    return { items, generatedAt: now.toISOString() };
  }

  async ask(question: string): Promise<AnalyticsAskResponse> {
    const normalized = question.trim().toLowerCase();
    if (!normalized) throw new BadRequestException('A question is required.');

    const asksRevenueLoss =
      normalized.includes('revenue churn') ||
      (normalized.includes('recurring revenue') &&
        /\b(lose|lost|loss|churn|contract)\w*\b/.test(normalized));
    if (
      normalized.includes('cohort') ||
      /\b(nrr|net revenue retention)\b/.test(normalized) ||
      asksRevenueLoss
    ) {
      const label = normalized.includes('cohort')
        ? 'Cohort retention'
        : normalized.includes('nrr') || normalized.includes('net revenue')
          ? 'Net revenue retention'
          : 'Revenue churn';
      return {
        answer: `${label} cannot currently be calculated because reliable historical snapshots are unavailable.`,
        period: 'Historical data',
        evidence: [
          { label: 'Historical snapshots available', value: false },
          { label: 'Requested metric', value: label },
        ],
        limitations: ['The application does not retain period-end subscription and recurring-revenue snapshots.'],
        mode: 'deterministic',
      };
    }
    if (normalized.includes('forecast')) {
      return {
        answer: 'A revenue forecast cannot currently be calculated because historical revenue snapshots are unavailable.',
        period: 'Future period unavailable',
        evidence: [{ label: 'Historical snapshots available', value: false }],
        limitations: ['No forecasting model or historical revenue time series is available.'],
        mode: 'deterministic',
      };
    }
    if (normalized.includes('customer churn') || normalized.includes('churn rate') || normalized.includes('customers did we lose')) {
      const kpis = await this.getKpis();
      return {
        answer:
          kpis.customerChurnRate === null
            ? 'Customer churn is unavailable because dated customer subscription history is incomplete.'
            : `Customer churn over the trailing 30 days is ${kpis.customerChurnRate.toFixed(2)}%.`,
        period: 'Trailing 30 days',
        evidence: [
          { label: 'Customer churn rate', value: kpis.customerChurnRate },
          { label: 'Historical lifecycle data complete', value: kpis.dataAvailability.historicalSubscriptionData },
        ],
        limitations: kpis.customerChurnRate === null ? ['Subscription lifecycle dates or customer IDs are missing.'] : [],
        mode: 'deterministic',
      };
    }
    if (/\bmrr\b|\barr\b/.test(normalized)) {
      const kpis = await this.getKpis();
      const isArr = /\barr\b/.test(normalized);
      const label = isArr ? 'ARR' : 'MRR';
      const value = isArr ? kpis.arr : kpis.mrr;
      return {
        answer: `Current ${label} is ${kpis.currency} ${value.toFixed(2)}.`,
        period: 'Current active subscriptions',
        evidence: [
          { label: 'Active subscriptions', value: kpis.activeSubscriptions },
          { label: `${label} before tax and after discounts`, value },
        ],
        limitations: [],
        mode: 'deterministic',
      };
    }
    if (normalized.includes('collect')) {
      return this.answerCollections(normalized);
    }
    if (normalized.includes('outstanding') || normalized.includes('receivable')) {
      const kpis = await this.getKpis();
      return {
        answer: `Outstanding receivables total ${kpis.currency} ${kpis.outstandingPayments.toFixed(2)}.`,
        period: 'Current invoice balances',
        evidence: [
          { label: 'Outstanding receivables', value: kpis.outstandingPayments },
          { label: 'Overdue invoices', value: kpis.overdueInvoices },
        ],
        limitations: [],
        mode: 'deterministic',
      };
    }
    if (normalized.includes('overdue') || normalized.includes('invoice')) {
      const invoices = this.businessRecords(await this.getCollection('invoices'));
      const overdue = invoices.filter((invoice) => isInvoiceOverdue(invoice, new Date()));
      return {
        answer: overdue.length
          ? `${overdue.length} overdue invoice(s) were found.`
          : 'No overdue invoices were found in the available records.',
        period: 'Current invoice balances',
        evidence: overdue.map((invoice) => ({
          label: String(invoice.number || invoice.id),
          value: `${invoice.customerName || invoice.customerId || 'Customer'}: ${roundCurrency(getInvoiceOutstanding(invoice))} outstanding`,
        })),
        limitations: [],
        mode: 'deterministic',
      };
    }
    if (normalized.includes('renew')) {
      const renewals = await this.getRenewals(7);
      return {
        answer: `${renewals.items.length} subscription(s) are scheduled to renew within the next seven days.`,
        period: 'Next 7 days',
        evidence: renewals.items.map((item) => ({
          label: item.id,
          value: `${item.customerName}, ${item.planName}: ${item.nextBillingDate}`,
        })),
        limitations: [],
        mode: 'deterministic',
      };
    }
    return {
      answer: 'I can answer questions about current MRR/ARR, collections, outstanding receivables, overdue invoices, renewals, and customer churn. Historical revenue churn, NRR, cohorts, and forecasts are unavailable without snapshots.',
      period: 'Not applicable',
      evidence: [],
      limitations: ['The question did not match a supported analytics intent.'],
      mode: 'deterministic',
    };
  }

  private async answerCollections(normalized: string): Promise<AnalyticsAskResponse> {
    const now = new Date();
    let start: Date | null = null;
    let endExclusive: Date | null = null;
    let period = 'All available payment records';
    const explicit = normalized.match(
      /\b(\d{4}-\d{2}-\d{2})\s+(?:to|through|until)\s+(\d{4}-\d{2}-\d{2})\b/,
    );
    if (explicit) {
      const from = parseAnalyticsDate(explicit[1]);
      const to = parseAnalyticsDate(explicit[2]);
      if (!from || !to || from > to) throw new BadRequestException('The payment date range is invalid.');
      start = new Date(`${explicit[1]}T00:00:00.000Z`);
      endExclusive = new Date(new Date(`${explicit[2]}T00:00:00.000Z`).getTime() + 86400000);
      period = `${explicit[1]} through ${explicit[2]} (UTC)`;
    } else if (normalized.includes('last month') || normalized.includes('previous month')) {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      endExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      period = `Last calendar month (${start.toISOString().slice(0, 7)}, UTC)`;
    } else if (normalized.includes('this month') || normalized.includes('current month')) {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      endExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      period = `Current calendar month (${start.toISOString().slice(0, 7)}, UTC)`;
    }
    const payments = getCollectedPayments(
      this.businessRecords(await this.getCollection('payments')),
    );
    const included = payments.filter((payment) => {
      if (!start || !endExclusive) return true;
      const date = parseAnalyticsDate(payment.paymentDate || payment.createdAt);
      return date !== null && date >= start && date < endExclusive;
    });
    const collected = roundCurrency(
      included.reduce((total, payment) => total + toFiniteNumber(payment.amount), 0),
    );
    const undated =
      start && endExclusive
        ? payments.filter((payment) => !parseAnalyticsDate(payment.paymentDate || payment.createdAt)).length
        : 0;
    return {
      answer: `Recorded collections for ${period.toLowerCase()} total USD ${collected.toFixed(2)}.`,
      period,
      evidence: [
        { label: 'Collected cash', value: collected },
        { label: 'Unique recorded payments', value: included.length },
      ],
      limitations: undated
        ? [`${undated} payment(s) without a valid date were excluded from the requested period.`]
        : [],
      mode: 'deterministic',
    };
  }
}
