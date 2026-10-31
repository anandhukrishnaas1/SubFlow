'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, FileText, Repeat } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { FinancialReportCard } from '@/components/dashboard/financial-report-card';
import { NrrCohortAnalysis } from '@/components/dashboard/nrr-cohort-analysis';
import { ChurnUpsellCards } from '@/components/dashboard/churn-upsell-cards';
import { AiAssistantDrawer } from '@/components/dashboard/ai-assistant-drawer';

export default function DashboardPage() {
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const kpisQuery = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.getKpis(),
  });
  const trendsQuery = useQuery({
    queryKey: ['billingTrends'],
    queryFn: () => api.getBillingTrends(),
  });
  const breakdownQuery = useQuery({
    queryKey: ['subscriptionBreakdown'],
    queryFn: () => api.getSubscriptionBreakdown(),
  });
  const invoicesQuery = useQuery({
    queryKey: ['recentInvoices'],
    queryFn: () => api.getInvoices(),
  });
  const subscriptionsQuery = useQuery({
    queryKey: ['recentSubs'],
    queryFn: () => api.getSubscriptions(),
  });

  const kpisError = kpisQuery.isError || kpisQuery.isRefetchError;
  const trendsError = trendsQuery.isError || trendsQuery.isRefetchError;
  const breakdownError = breakdownQuery.isError || breakdownQuery.isRefetchError;
  const invoicesError = invoicesQuery.isError || invoicesQuery.isRefetchError;
  const subscriptionsError =
    subscriptionsQuery.isError || subscriptionsQuery.isRefetchError;
  const kpis = kpisQuery.data;
  const trends = trendsQuery.data || [];
  const intervalData = Object.entries(breakdownQuery.data?.intervalCounts || {}).map(
    ([interval, count]) => ({ interval, count }),
  );
  const kpiCards = [
    {
      label: 'MRR',
      value: kpis ? formatCurrency(kpis.mrr, kpis.currency) : '—',
      caption: 'Active recurring value, before tax and after discounts',
    },
    {
      label: 'ARR',
      value: kpis ? formatCurrency(kpis.arr, kpis.currency) : '—',
      caption: 'Annualized recurring run-rate (MRR × 12)',
    },
    {
      label: 'Active subscriptions',
      value: kpis ? String(kpis.activeSubscriptions) : '—',
      caption: 'Subscriptions currently in active status',
    },
    {
      label: 'Outstanding receivables',
      value: kpis ? formatCurrency(kpis.outstandingPayments, kpis.currency) : '—',
      caption: `${kpis?.overdueInvoices ?? '—'} overdue invoice(s)`,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenAiAssistant={() => setAiAssistantOpen(true)} />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {(kpisError || trendsError) && (
            <div role="alert" className="flex items-center justify-between gap-3 text-sm text-rose-700">
              <span>Some analytics could not be loaded from the API.</span>
              <button
                type="button"
                className="font-semibold underline"
                onClick={() =>
                  Promise.all([
                    ...(kpisError ? [kpisQuery.refetch()] : []),
                    ...(trendsError ? [trendsQuery.refetch()] : []),
                  ])
                }
              >
                Retry
              </button>
            </div>
          )}

          <section aria-label="Key performance indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {kpiCards.map((card) => (
              <div className="ui-card p-5" key={card.label}>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                  {kpisQuery.isLoading ? 'Loading…' : card.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">{card.caption}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FinancialReportCard
              summary={kpis}
              isLoading={kpisQuery.isLoading}
              isError={kpisError}
            />

            <div className="ui-card p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Invoiced vs collected</h2>
                <span className="text-[11px] font-semibold text-slate-500">Last 6 months</span>
              </div>
              <div className="h-56 w-full pt-4">
                {trendsError ? (
                  <div className="pt-12 text-center text-xs text-rose-700">
                    <p>Billing activity could not be loaded.</p>
                    <button type="button" className="mt-2 font-semibold underline" onClick={() => trendsQuery.refetch()}>
                      Retry
                    </button>
                  </div>
                ) : trendsQuery.isLoading ? (
                  <p className="pt-16 text-center text-xs text-slate-500">Loading billing activity…</p>
                ) : trends.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center">No billing activity in this period.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value), kpis?.currency)} />
                      <Area dataKey="billed" name="Invoiced" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
                      <Area dataKey="collected" name="Collected" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="ui-card p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Subscriptions by interval</h2>
                <span className="text-[11px] font-semibold text-slate-500">Current</span>
              </div>
              <div className="h-56 w-full pt-4">
                {breakdownError ? (
                  <div className="pt-12 text-center text-xs text-rose-700">
                    <p>Subscription records could not be loaded.</p>
                    <button type="button" className="mt-2 font-semibold underline" onClick={() => breakdownQuery.refetch()}>
                      Retry
                    </button>
                  </div>
                ) : breakdownQuery.isLoading ? (
                  <p className="pt-16 text-center text-xs text-slate-500">Loading subscriptions…</p>
                ) : intervalData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intervalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="interval" stroke="#94a3b8" fontSize={11} />
                      <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" name="Subscriptions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-500 text-center pt-16">No subscription records available.</p>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/subscriptions" className="ui-card p-4 flex items-center justify-between hover:bg-blue-50/50">
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <Repeat className="h-4 w-4 text-blue-600" />
                {kpis?.upcomingRenewals ?? '—'} upcoming renewal(s) in the next 7 days
              </span>
              <ArrowUpRight className="h-4 w-4 text-blue-700" />
            </Link>
            <Link href="/invoices" className="ui-card p-4 flex items-center justify-between hover:bg-amber-50/50">
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                {kpis?.overdueInvoices ?? '—'} overdue invoice(s)
              </span>
              <ArrowUpRight className="h-4 w-4 text-amber-700" />
            </Link>
          </section>

          <NrrCohortAnalysis />
          <ChurnUpsellCards />

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="ui-card p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">Subscriptions</h2>
                </div>
                <Link href="/subscriptions" className="text-xs font-semibold text-blue-600">View all →</Link>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {(subscriptionsQuery.data || []).slice(0, 4).map((subscription: any) => (
                  <div key={subscription.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{subscription.customerName || 'Customer'}</p>
                      <p className="text-[11px] text-slate-500">{subscription.planName} · {subscription.billingInterval}</p>
                    </div>
                    <span className="font-semibold uppercase text-slate-600">{subscription.status}</span>
                  </div>
                ))}
                {subscriptionsError ? (
                  <p role="alert" className="py-4 text-rose-600">
                    Subscriptions could not be loaded.
                    <button
                      type="button"
                      className="ml-2 font-semibold underline"
                      onClick={() => subscriptionsQuery.refetch()}
                    >
                      Retry
                    </button>
                  </p>
                ) : !subscriptionsQuery.isLoading && !subscriptionsQuery.data?.length && (
                  <p className="py-4 text-slate-500">No subscriptions available.</p>
                )}
              </div>
            </div>

            <div className="ui-card p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">Recent invoices</h2>
                </div>
                <Link href="/invoices" className="text-xs font-semibold text-blue-600">View all →</Link>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {(invoicesQuery.data || []).slice(0, 4).map((invoice: any) => (
                  <div key={invoice.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 font-mono">{invoice.number}</p>
                      <p className="text-[11px] text-slate-500">
                        {invoice.customerName || 'Customer'} · {formatDate(invoice.issueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 font-mono">{formatCurrency(invoice.total, kpis?.currency || 'USD')}</p>
                      <span className="text-[10px] font-bold uppercase text-slate-600">{invoice.status}</span>
                    </div>
                  </div>
                ))}
                {invoicesError ? (
                  <p role="alert" className="py-4 text-rose-600">
                    Invoices could not be loaded.
                    <button
                      type="button"
                      className="ml-2 font-semibold underline"
                      onClick={() => invoicesQuery.refetch()}
                    >
                      Retry
                    </button>
                  </p>
                ) : !invoicesQuery.isLoading && !invoicesQuery.data?.length && (
                  <p className="py-4 text-slate-500">No invoices available.</p>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
      <AiAssistantDrawer
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
      />
    </div>
  );
}
