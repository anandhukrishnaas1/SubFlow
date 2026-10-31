import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { SubscriptionStatus, InvoiceStatus, QuotationStatus, UserRole } from '@subflow/shared';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly firebase: FirebaseService) {}

  private get countersDoc() {
    return this.firebase.getFirestore().collection('counters').doc('analytics');
  }

  async getKpis(): Promise<any> {
    const doc = await this.countersDoc.get();
    if (doc.exists) {
      return doc.data();
    }
    // If not calculated yet, run full calculation
    return this.recalculateAll();
  }

  async recalculateAll(): Promise<any> {
    this.logger.log('Running full recalculation of counters/analytics');
    const db = this.firebase.getFirestore();

    const [usersSnap, subsSnap, invsSnap, paysSnap] = await Promise.all([
      db.collection('users').where('role', '==', UserRole.CUSTOMER).get(),
      db.collection('subscriptions').get(),
      db.collection('invoices').get(),
      db.collection('payments').get(),
    ]);

    const totalCustomers = usersSnap.size;

    let activeSubscriptions = 0;
    let mrr = 0;
    const now = new Date();
    let upcomingRenewals = 0;
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    subsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === SubscriptionStatus.ACTIVE) {
        activeSubscriptions++;
        const total = Number(data.total) || 0;
        if (data.billingInterval === 'monthly') {
          mrr += total;
        } else if (data.billingInterval === 'yearly') {
          mrr += total / 12;
        } else if (data.billingInterval === 'weekly') {
          mrr += total * 4.33;
        } else if (data.billingInterval === 'daily') {
          mrr += total * 30;
        }

        if (data.nextBillingDate) {
          const nextDate = new Date(data.nextBillingDate);
          if (nextDate >= now && nextDate <= next7Days) {
            upcomingRenewals++;
          }
        }
      }
    });

    const arr = mrr * 12;

    let totalRevenue = 0;
    paysSnap.docs.forEach((doc) => {
      totalRevenue += Number(doc.data().amount) || 0;
    });

    let outstandingPayments = 0;
    let overdueInvoices = 0;

    invsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status !== InvoiceStatus.PAID && data.status !== InvoiceStatus.CANCELLED) {
        outstandingPayments += Number(data.outstandingAmount) || 0;
        if (data.dueDate && new Date(data.dueDate) < now) {
          overdueInvoices++;
        }
      }
    });

    const kpiData = {
      totalCustomers,
      activeSubscriptions,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      outstandingPayments: Math.round(outstandingPayments * 100) / 100,
      overdueInvoices,
      upcomingRenewals,
      lastUpdated: now.toISOString(),
    };

    await this.countersDoc.set(kpiData, { merge: true });
    return kpiData;
  }

  async getRevenueTrends(): Promise<any[]> {
    const db = this.firebase.getFirestore();
    const paymentsSnap = await db.collection('payments').orderBy('paymentDate', 'asc').get();

    const monthlyMap = new Map<string, { month: string; revenue: number; paymentsCount: number }>();

    // Generate last 6 months keys
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      monthlyMap.set(key, { month: label, revenue: 0, paymentsCount: 0 });
    }

    paymentsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const dateStr = data.paymentDate || data.createdAt;
      if (dateStr) {
        const key = dateStr.slice(0, 7);
        if (monthlyMap.has(key)) {
          const entry = monthlyMap.get(key)!;
          entry.revenue += Number(data.amount) || 0;
          entry.paymentsCount += 1;
        }
      }
    });

    return Array.from(monthlyMap.values());
  }

  async getSubscriptionBreakdown(): Promise<any> {
    const db = this.firebase.getFirestore();
    const subsSnap = await db.collection('subscriptions').get();

    const statusCounts: Record<string, number> = {
      active: 0,
      paused: 0,
      confirmed: 0,
      draft: 0,
      cancelled: 0,
      closed: 0,
    };

    const intervalCounts: Record<string, number> = {
      monthly: 0,
      yearly: 0,
      weekly: 0,
      daily: 0,
    };

    subsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const status = data.status || 'draft';
      const interval = data.billingInterval || 'monthly';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      intervalCounts[interval] = (intervalCounts[interval] || 0) + 1;
    });

    return { statusCounts, intervalCounts };
  }

  async getRevenueLeakageReport(): Promise<any> {
    const db = this.firebase.getFirestore();
    const now = new Date();

    const [subsSnap, invsSnap, quotesSnap] = await Promise.all([
      db.collection('subscriptions').get(),
      db.collection('invoices').get(),
      db.collection('quotations').get(),
    ]);

    let churnLossARR = 0;
    const pausedOrCancelledSubs: any[] = [];

    subsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === SubscriptionStatus.CANCELLED || data.status === SubscriptionStatus.PAUSED) {
        const total = Number(data.total) || 0;
        let monthly = total;
        if (data.billingInterval === 'yearly') monthly = total / 12;
        else if (data.billingInterval === 'weekly') monthly = total * 4.33;
        else if (data.billingInterval === 'daily') monthly = total * 30;

        churnLossARR += monthly * 12;
        pausedOrCancelledSubs.push({
          id: doc.id,
          number: data.number,
          customerName: data.customerName,
          status: data.status,
          arrLoss: monthly * 12,
        });
      }
    });

    let overdueReceivablesTotal = 0;
    const overdueInvoicesList: any[] = [];
    invsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.dueDate && new Date(data.dueDate) < now && data.status === InvoiceStatus.CONFIRMED) {
        const out = Number(data.outstandingAmount) || 0;
        overdueReceivablesTotal += out;
        overdueInvoicesList.push({
          id: doc.id,
          number: data.number,
          customerName: data.customerName,
          outstandingAmount: out,
          dueDate: data.dueDate,
        });
      }
    });

    let expiringQuotesTotal = 0;
    const expiringQuotesList: any[] = [];
    quotesSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === QuotationStatus.SENT || data.status === QuotationStatus.DRAFT) {
        expiringQuotesTotal += Number(data.total) || 0;
        expiringQuotesList.push({
          id: doc.id,
          number: data.number,
          customerName: data.customerName,
          total: data.total,
        });
      }
    });

    const totalLeakage = Math.round((churnLossARR + overdueReceivablesTotal + expiringQuotesTotal) * 100) / 100;

    return {
      totalLeakage,
      metrics: {
        churnLossARR: Math.round(churnLossARR * 100) / 100,
        overdueReceivables: Math.round(overdueReceivablesTotal * 100) / 100,
        pendingQuotes: Math.round(expiringQuotesTotal * 100) / 100,
      },
      items: {
        pausedOrCancelledSubs,
        overdueInvoices: overdueInvoicesList,
        pendingQuotes: expiringQuotesList,
      },
    };
  }
}