import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SubscriptionStatus, UserRole } from '@subflow/shared';
import { FirebaseService } from '../../firebase/firebase.service';
import {
  getInvoiceOutstanding,
  getMonthlyRecurringAmount,
  getCollectedPayments,
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

  private async getCollection(collectionName: string): Promise<AnalyticsRecord[]> {
    const snapshot = await this.firebase.getFirestore().collection(collectionName).get();
    return snapshot.docs.map((doc) => ({
      ...(doc.data() as Record<string, any>),
      id: doc.id,
    }));
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

  private isSynthetic(record: AnalyticsRecord): boolean {
    const synthetic =
      record.dataOrigin === 'SYNTHETIC' ||
      record.data_origin === 'SYNTHETIC';
    const includeSynthetic =
      process.env.NODE_ENV === 'development' &&
      process.env.INCLUDE_SYNTHETIC_ANALYTICS === 'true';
    return synthetic && !includeSynthetic;
  }

  private activeBusinessRecords(records: AnalyticsRecord[]): AnalyticsRecord[] {
    return records.filter((record) => !this.isSynthetic(record));
  }

  async getKpis(): Promise<AnalyticsKpis> {
    return this.calculateKpis(await this.getDataset());
  }

  async recalculateAll(): Promise<AnalyticsKpis> {
    this.logger.log('Recalculating analytics from source records');
    return this.calculateKpis(await this.getDataset());
  }

  private calculateKpis(dataset: AnalyticsDataset): AnalyticsKpis {
    const now = new Date();
    const users = this.activeBusinessRecords(dataset.users);
    const subscriptions = this.activeBusinessRecords(dataset.subscriptions);
    const invoices = this.activeBusinessRecords(dataset.invoices);
    const payments = this.activeBusinessRecords(dataset.payments);
    const customers = users.filter((user) => user.role === UserRole.CUSTOMER);
    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status === SubscriptionStatus.ACTIVE,
    );
    const customerChurnRate = this.calculateCustomerChurnRate(subscriptions, now);
    const mrr = activeSubscriptions.reduce(
      (total, subscription) => total + getMonthlyRecurringAmount(subscription),
      0,
    );
    const billableInvoices = invoices.filter(isInvoiceCounted);
    const collected = getCollectedPayments(payments)
      .reduce((total, payment) => total + toFiniteNumber(payment.amount), 0);
    const invoiced = billableInvoices.reduce(
      (total, invoice) => total + this.invoiceTotal(invoice),
      0,
    );
    const paidAmount = billableInvoices.reduce(
      (total, invoice) => total + toFiniteNumber(invoice.paidAmount),
      0,
    );
    const outstanding = invoices.reduce(
      (total, invoice) =>
        ['draft', 'cancelled'].includes(String(invoice.status).toLowerCase())
          ? total
          : total + getInvoiceOutstanding(invoice),
      0,
    );
    const renewals = this.getUpcomingRenewalsFrom(
      activeSubscriptions,
      now,
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    );

    return {
      totalCustomers: customers.length,
      activeSubscriptions: activeSubscriptions.length,
      pausedSubscriptions: subscriptions.filter(
        (subscription) => subscription.status === SubscriptionStatus.PAUSED,
      ).length,
      cancelledSubscriptions: subscriptions.filter(
        (subscription) => subscription.status === SubscriptionStatus.CANCELLED,
      ).length,
      customerChurnRate,
      mrr: roundCurrency(mrr),
      arr: roundCurrency(roundCurrency(mrr) * 12),
      totalCollected: roundCurrency(collected),
      totalInvoiced: roundCurrency(invoiced),
      outstandingPayments: roundCurrency(outstanding),
      overdueInvoices: invoices.filter((invoice) => isInvoiceOverdue(invoice, now)).length,
      upcomingRenewals: renewals.length,
      arpu: customers.length > 0 ? roundCurrency(mrr / customers.length) : null,
      netCollectionRate:
        invoiced > 0 ? roundCurrency((paidAmount / invoiced) * 100) : null,
      currency: 'USD',
      generatedAt: now.toISOString(),
      dataAvailability: {
        historicalSubscriptionData: customerChurnRate !== null,
        churnMetrics: customerChurnRate !== null,
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
    if (subscriptions.length === 0) return null;
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lifecycle = subscriptions
      .filter((subscription) =>
        ['active', 'paused', 'cancelled', 'closed'].includes(
          String(subscription.status || '').toLowerCase(),
        ),
      )
      .map((subscription) => {
        const start = parseAnalyticsDate(
          subscription.activatedAt || subscription.startDate || subscription.createdAt,
        );
        const status = String(subscription.status || '').toLowerCase();
        const customerId = String(subscription.customerId || '');
        const endedAt = parseAnalyticsDate(
          status === SubscriptionStatus.CANCELLED
            ? subscription.cancelledAt
            : status === SubscriptionStatus.CLOSED
              ? subscription.closedAt
              : status === SubscriptionStatus.PAUSED
                ? subscription.pausedAt
                : null,
        );
        return { customerId, status, start, endedAt };
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
    if (openingCustomerIds.size === 0) return null;

    const churnedCustomers = Array.from(openingCustomerIds).filter((customerId) => {
      const customerSubscriptions = lifecycle.filter(
        (subscription) =>
          subscription.customerId === customerId,
      );
      return !customerSubscriptions.some(({ status }) =>
        ['active', 'paused'].includes(status),
      );
    }).length;

    return roundCurrency((churnedCustomers / openingCustomerIds.size) * 100);
  }

  async getRevenueTrends(from?: string, to?: string): Promise<BillingTrend[]> {
    const [invoices, payments] = await Promise.all([
      this.getCollection('invoices'),
      this.getCollection('payments'),
    ]);
    const now = new Date();
    const months = new Map<string, BillingTrend>();
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
      throw new BadRequestException(
        'Analytics date range must cover between 1 and 24 calendar months.',
      );
    }

    for (let offset = 0; offset < monthCount; offset += 1) {
      const monthDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset, 1));
      const key = monthDate.toISOString().slice(0, 7);
      months.set(key, {
        month: monthDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
        periodStart: `${key}-01`,
        billed: 0,
        collected: 0,
        paymentsCount: 0,
      });
    }

    for (const invoice of this.activeBusinessRecords(invoices).filter(isInvoiceCounted)) {
      const issueDate = parseAnalyticsDate(invoice.issueDate || invoice.createdAt);
      const period = issueDate && months.get(issueDate.toISOString().slice(0, 7));
      if (period) {
        period.billed += this.invoiceTotal(invoice);
      }
    }

    for (const payment of getCollectedPayments(this.activeBusinessRecords(payments))) {
      const paymentDate = parseAnalyticsDate(payment.paymentDate || payment.createdAt);
      const period = paymentDate && months.get(paymentDate.toISOString().slice(0, 7));
      if (period) {
        period.collected += toFiniteNumber(payment.amount);
        period.paymentsCount += 1;
      }
    }

    return Array.from(months.values()).map((period) => ({
      ...period,
      billed: roundCurrency(period.billed),
      collected: roundCurrency(period.collected),
    }));
  }

  async getSubscriptionBreakdown() {
    const subscriptions = this.activeBusinessRecords(
      await this.getCollection('subscriptions'),
    );
    const statusCounts: Record<string, number> = {};
    const intervalCounts: Record<string, number> = {};

    for (const subscription of subscriptions) {
      const status = String(subscription.status || 'unknown').toLowerCase();
      const interval = String(subscription.billingInterval || 'unknown').toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
    }

    return {
      total: subscriptions.length,
      statusCounts,
      intervalCounts,
      generatedAt: new Date().toISOString(),
      dataAvailability: {
        churnRate: false,
        revenueChurnRate: false,
        netRevenueRetention: false,
        cohortRetention: false,
      },
    };
  }

  async getSubscriptionMetrics() {
    const [users, subscriptions] = await Promise.all([
      this.getCollection('users'),
      this.getCollection('subscriptions'),
    ]);
    const realUsers = this.activeBusinessRecords(users);
    const realSubscriptions = this.activeBusinessRecords(subscriptions);
    const churnRate = this.calculateCustomerChurnRate(realSubscriptions, new Date());
    const billingIntervals: Record<string, number> = {};
    for (const subscription of realSubscriptions) {
      const interval = String(subscription.billingInterval || 'unknown').toLowerCase();
      billingIntervals[interval] = (billingIntervals[interval] || 0) + 1;
    }

    return {
      totalCustomers: realUsers.filter((user) => user.role === UserRole.CUSTOMER).length,
      activeSubscriptions: realSubscriptions.filter(
        (subscription) => subscription.status === SubscriptionStatus.ACTIVE,
      ).length,
      pausedSubscriptions: realSubscriptions.filter(
        (subscription) => subscription.status === SubscriptionStatus.PAUSED,
      ).length,
      cancelledSubscriptions: realSubscriptions.filter(
        (subscription) => subscription.status === SubscriptionStatus.CANCELLED,
      ).length,
      billingIntervals,
      churnRate,
      revenueChurnRate: null,
      netRevenueRetention: null,
      cohortRetention: null,
      dataAvailability: {
        historicalSubscriptionData: churnRate !== null,
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
    const subscriptions = this.activeBusinessRecords(
      await this.getCollection('subscriptions'),
    ).filter((subscription) => subscription.status === SubscriptionStatus.ACTIVE);
    const now = new Date();
    const end = new Date(now.getTime() + safeDays * 24 * 60 * 60 * 1000);

    return {
      days: safeDays,
      items: this.getUpcomingRenewalsFrom(subscriptions, now, end),
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
    const [invoices, payments, subscriptions] = await Promise.all([
      this.getCollection('invoices'),
      this.getCollection('payments'),
      this.getCollection('subscriptions'),
    ]);
    const realInvoices = this.activeBusinessRecords(invoices);
    const realPayments = this.activeBusinessRecords(payments);
    const realSubscriptions = this.activeBusinessRecords(subscriptions);
    const now = new Date();
    const items: AnalyticsRisk[] = [];

    for (const invoice of realInvoices.filter((record) => isInvoiceOverdue(record, now))) {
      const balance = getInvoiceOutstanding(invoice);
      const daysLate = Math.floor(
        (now.getTime() - parseAnalyticsDate(invoice.dueDate)!.getTime()) / 86400000,
      );
      items.push({
        reference: String(invoice.number || invoice.id),
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        signal: 'overdue_invoice',
        evidence: [
          `Outstanding balance: ${roundCurrency(balance)}`,
          `${daysLate} day(s) past due`,
          `Invoice status: ${String(invoice.status)}`,
        ],
        severity: daysLate > 30 ? 'high' : daysLate > 7 ? 'medium' : 'low',
        recommendedAction: 'Review the account and follow up on the unpaid invoice.',
        detectedAt: now.toISOString(),
      });
    }

    for (const payment of realPayments.filter(
      (record) => String(record.status || '').toLowerCase() === 'failed',
    )) {
      items.push({
        reference: String(payment.invoiceNumber || payment.invoiceId || payment.id),
        customerId: payment.customerId,
        customerName: payment.customerName,
        signal: 'failed_payment',
        evidence: [
          `Payment status: ${String(payment.status)}`,
          `Amount: ${roundCurrency(toFiniteNumber(payment.amount))}`,
        ],
        severity: 'medium',
        recommendedAction: 'Check the payment failure reason and contact the customer if needed.',
        detectedAt: now.toISOString(),
      });
    }

    for (const subscription of realSubscriptions) {
      const renewalDate = parseAnalyticsDate(subscription.nextBillingDate);
      if (
        subscription.status === SubscriptionStatus.ACTIVE &&
        renewalDate !== null &&
        renewalDate >= now &&
        renewalDate <= new Date(now.getTime() + 7 * 86400000) &&
        (subscription.autoRenew === false || subscription.allowRenewal === false)
      ) {
        items.push({
          reference: String(subscription.number || subscription.id),
          customerId: subscription.customerId,
          customerName: subscription.customerName,
          signal: 'renewal_not_enabled',
          evidence: [
            `Next billing date: ${renewalDate.toISOString()}`,
            'Automatic renewal is disabled or not allowed.',
          ],
          severity: 'low',
          recommendedAction: 'Confirm the renewal decision with the customer before the billing date.',
          detectedAt: now.toISOString(),
        });
      }
    }

    return { items, generatedAt: now.toISOString() };
  }

  async getInsights() {
    const [kpis, risks, metrics] = await Promise.all([
      this.getKpis(),
      this.getRisks(),
      this.getSubscriptionMetrics(),
    ]);
    const insights: Array<{ title: string; detail: string; severity: string }> = risks.items.map(
      (risk) => ({
        title: `Review ${risk.reference}`,
        detail: `${risk.signal}: ${risk.evidence.join('; ')}`,
        severity: risk.severity,
      }),
    );

    if (!metrics.dataAvailability.churnRate) {
      insights.push({
        title: 'Churn analysis unavailable',
        detail: 'Subscription lifecycle history is not sufficient to calculate a defensible churn rate.',
        severity: 'info',
      });
    }
    if (kpis.overdueInvoices === 0) {
      insights.push({
        title: 'No overdue invoices detected',
        detail: 'No unpaid invoice with a due date before the current time was found in the available records.',
        severity: 'info',
      });
    }

    return {
      items: insights,
      dataAvailability: kpis.dataAvailability,
      generatedAt: new Date().toISOString(),
    };
  }

  async ask(question: string): Promise<AnalyticsAskResponse> {
    const normalized = question.toLowerCase();

    if (
      normalized.includes('active subscription') ||
      normalized.includes('active subscriber') ||
      (normalized.includes('subscription') && normalized.includes('active')) ||
      normalized.includes('customer count') ||
      normalized.includes('total customer') ||
      (normalized.includes('how many customers') && !normalized.includes('cohort'))
    ) {
      const kpis = await this.getKpis();
      const asksForCustomers =
        normalized.includes('customer') && !normalized.includes('subscription');
      const label = asksForCustomers ? 'Customers' : 'Active subscriptions';
      const value = asksForCustomers ? kpis.totalCustomers : kpis.activeSubscriptions;
      return {
        answer: `${label}: ${value}.`,
        period: 'Current records',
        evidence: [{ label, value }],
        limitations: [],
        mode: 'deterministic',
      };
    }

    if (normalized.includes('mrr') || normalized.includes('arr')) {
      const kpis = await this.getKpis();
      const asksForArr = normalized.includes('arr');
      const label = asksForArr ? 'ARR' : 'MRR';
      const value = asksForArr ? kpis.arr : kpis.mrr;
      return {
        answer: `Current ${label} is ${kpis.currency} ${value.toFixed(2)}.`,
        period: 'Current active subscriptions',
        evidence: [
          { label: 'Active subscriptions', value: kpis.activeSubscriptions },
          { label: `${label} (before tax, after discounts)`, value },
        ],
        limitations: [],
        mode: 'deterministic',
      };
    }

    if (normalized.includes('collection rate')) {
      const kpis = await this.getKpis();
      return {
        answer:
          kpis.netCollectionRate === null
            ? 'Net collection rate is unavailable because there are no eligible invoices.'
            : `Net collection rate is ${kpis.netCollectionRate.toFixed(2)}%.`,
        period: 'All eligible invoice records',
        evidence: [
          { label: 'Net collection rate', value: kpis.netCollectionRate },
          { label: 'Total invoiced', value: kpis.totalInvoiced },
          { label: 'Overdue invoices', value: kpis.overdueInvoices },
        ],
        limitations: [],
        mode: 'deterministic',
      };
    }

    if (normalized.includes('collect')) {
      const now = new Date();
      const explicitRange = normalized.match(
        /\b(\d{4}-\d{2}-\d{2})\s+(?:to|through|until)\s+(\d{4}-\d{2}-\d{2})\b/,
      );
      let rangeStart: Date | null = null;
      let rangeEndExclusive: Date | null = null;
      let period = 'All available payment records';
      if (explicitRange) {
        const [, from, to] = explicitRange;
        const fromDate = parseAnalyticsDate(from);
        const toDate = parseAnalyticsDate(to);
        if (
          !fromDate ||
          !toDate ||
          fromDate.toISOString().slice(0, 10) !== from ||
          toDate.toISOString().slice(0, 10) !== to ||
          fromDate.getTime() > toDate.getTime()
        ) {
          throw new BadRequestException('The payment date range is invalid.');
        }
        rangeStart = new Date(`${from}T00:00:00.000Z`);
        rangeEndExclusive = new Date(
          new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000,
        );
        period = `${from} through ${to} (UTC)`;
      } else if (normalized.includes('last month') || normalized.includes('previous month')) {
        rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        rangeEndExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        period = `Last calendar month (${rangeStart.toISOString().slice(0, 7)}, UTC)`;
      } else if (normalized.includes('this month') || normalized.includes('current month')) {
        rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        rangeEndExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        period = `Current calendar month (${rangeStart.toISOString().slice(0, 7)}, UTC)`;
      }

      const payments = getCollectedPayments(
        this.activeBusinessRecords(await this.getCollection('payments')),
      );
      const includedPayments = payments.filter((payment) => {
        if (!rangeStart || !rangeEndExclusive) return true;
        const paymentDate = parseAnalyticsDate(payment.paymentDate || payment.createdAt);
        return (
          paymentDate !== null &&
          paymentDate.getTime() >= rangeStart.getTime() &&
          paymentDate.getTime() < rangeEndExclusive.getTime()
        );
      });
      const collected = roundCurrency(
        includedPayments.reduce((total, payment) => total + toFiniteNumber(payment.amount), 0),
      );
      const undatedPayments =
        rangeStart && rangeEndExclusive
          ? payments.filter(
              (payment) => !parseAnalyticsDate(payment.paymentDate || payment.createdAt),
            ).length
          : 0;
      return {
        answer: `Recorded collections for ${period.toLowerCase()} total USD ${collected.toFixed(2)}.`,
        period,
        evidence: [
          { label: 'Collected cash', value: collected },
          { label: 'Unique recorded payments', value: includedPayments.length },
        ],
        limitations: undatedPayments
          ? [`${undatedPayments} payment(s) without a valid payment date were excluded from the requested period.`]
          : [],
        mode: 'deterministic',
      };
    }

    if (normalized.includes('receivable') || normalized.includes('outstanding')) {
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
      const risks = await this.getRisks();
      const overdue = risks.items.filter((risk) => risk.signal === 'overdue_invoice');
      return {
        answer: overdue.length
          ? `${overdue.length} overdue invoice(s) were found.`
          : 'No overdue invoices were found in the available records.',
        period: 'Current invoice balances',
        evidence: overdue.map((risk) => ({
          label: risk.reference,
          value: `${risk.customerName || risk.customerId || 'Customer'}: ${risk.evidence.join('; ')}`,
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

    if (normalized.includes('risk') || normalized.includes('payment issue')) {
      const risks = await this.getRisks();
      return {
        answer: risks.items.length
          ? `${risks.items.length} evidence-backed risk signal(s) were found.`
          : 'No configured risk signals were found in the available records.',
        period: 'Current records',
        evidence: risks.items.map((risk) => ({
          label: `${risk.reference} (${risk.severity})`,
          value: `${risk.signal}: ${risk.evidence.join('; ')}`,
        })),
        limitations: [],
        mode: 'deterministic',
      };
    }

    if (
      normalized.includes('cohort') &&
      (normalized.includes('retention') || normalized.includes('remain') || normalized.includes('active'))
    ) {
      return {
        answer: 'Cohort retention cannot currently be calculated because acquisition-cohort membership and historical activity snapshots are unavailable.',
        period: 'Historical acquisition cohorts',
        evidence: [
          { label: 'Cohort retention available', value: false },
          { label: 'Historical cohort snapshots available', value: false },
        ],
        limitations: ['Customer acquisition cohorts and period-by-period activity snapshots are not stored.'],
        mode: 'deterministic',
      };
    }

    if (
      normalized.includes('revenue churn') ||
      (normalized.includes('recurring revenue') &&
        (normalized.includes('lose') || normalized.includes('lost') || normalized.includes('churn')))
    ) {
      return {
        answer: 'Revenue churn cannot currently be calculated because historical customer-level recurring revenue snapshots are unavailable.',
        period: 'Historical recurring revenue snapshots',
        evidence: [
          { label: 'Revenue churn available', value: false },
          { label: 'Historical recurring revenue snapshots available', value: false },
        ],
        limitations: ['Revenue churn requires comparable opening and closing recurring revenue snapshots.'],
        mode: 'deterministic',
      };
    }

    if (normalized.includes('nrr') || normalized.includes('net revenue retention')) {
      return {
        answer: 'Net revenue retention (NRR) cannot currently be calculated because historical customer revenue snapshots are unavailable.',
        period: 'Historical customer revenue snapshots',
        evidence: [
          { label: 'NRR available', value: false },
          { label: 'Historical customer revenue snapshots available', value: false },
        ],
        limitations: ['NRR requires historical customer-level recurring revenue snapshots.'],
        mode: 'deterministic',
      };
    }

    if (
      normalized.includes('churn') ||
      normalized.includes('customers did we lose') ||
      normalized.includes('customers have we lost') ||
      (normalized.includes('customer') &&
        (normalized.includes('lose') || normalized.includes('lost')))
    ) {
      const kpis = await this.getKpis();
      const churnRate = kpis.customerChurnRate;
      const available = churnRate !== null;
      return {
        answer: available
          ? `Customer churn over the trailing 30 days is ${churnRate.toFixed(2)}%.`
          : 'Customer churn cannot currently be calculated because subscription lifecycle history is incomplete.',
        period: 'Trailing 30 days',
        evidence: [
          { label: 'Opening customer cohort available', value: available },
          { label: 'Customer churn rate', value: kpis.customerChurnRate },
        ],
        limitations: available
          ? []
          : ['Missing customer IDs or lifecycle dates prevent a reliable customer-level churn calculation.'],
        mode: 'deterministic',
      };
    }

    if (normalized.includes('forecast') || normalized.includes('projection')) {
      const kpis = await this.getKpis();
      return {
        answer: 'A revenue forecast is unavailable because the available records do not include sufficient historical revenue snapshots.',
        period: 'Historical revenue snapshots',
        evidence: [{ label: 'Revenue forecast available', value: kpis.dataAvailability.revenueForecast }],
        limitations: ['Forecasts are not generated without sufficient historical revenue data.'],
        mode: 'deterministic',
      };
    }

    if (
      normalized.includes('insufficient') ||
      normalized.includes('historical data') ||
      normalized.includes('which metrics') ||
      normalized.includes('what metrics')
    ) {
      const kpis = await this.getKpis();
      return {
        answer: kpis.dataAvailability.churnMetrics
          ? 'Customer churn is available from the trailing 30-day lifecycle history. Revenue churn, NRR, cohort retention, and forecasts remain unavailable because historical value and cohort snapshots are not stored.'
          : 'Customer churn, revenue churn, NRR, cohort retention, and forecasts are unavailable because the current records do not contain sufficient historical lifecycle and value snapshots.',
        period: 'Historical data availability',
        evidence: [
          { label: 'Customer churn available', value: kpis.dataAvailability.churnMetrics },
          { label: 'Revenue forecast available', value: kpis.dataAvailability.revenueForecast },
        ],
        limitations: [],
        mode: 'deterministic',
      };
    }

    if (normalized.includes('revenue') || normalized.includes('trend')) {
      const [kpis, trends] = await Promise.all([
        this.getKpis(),
        this.getRevenueTrends(),
      ]);
      return {
        answer: 'Revenue history is shown as invoiced totals and recorded collections, separately, for the last six months.',
        period: 'Last six calendar months (UTC)',
        evidence: trends.map((trend) => ({
          label: trend.month,
          value: `Invoiced ${kpis.currency} ${trend.billed.toFixed(2)}; collected ${kpis.currency} ${trend.collected.toFixed(2)}`,
        })),
        limitations:
          trends.filter((trend) => trend.billed > 0 || trend.collected > 0).length < 3
            ? ['Fewer than three months contain recorded activity; no forecast is produced.']
            : [],
        mode: 'deterministic',
      };
    }

    return {
      answer:
        'I can answer questions about current MRR/ARR, collections, receivables, overdue invoices, renewals, risk signals, churn data availability, and six-month invoiced-versus-collected trends.',
      period: 'Available analytics',
      evidence: [],
      limitations: ['This copilot uses verified analytics and does not infer unsupported metrics.'],
      mode: 'deterministic',
    };
  }
}
