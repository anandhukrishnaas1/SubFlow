'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AiAssistantDrawer } from '@/components/dashboard/ai-assistant-drawer';
import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function ReportsPage() {
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const summaryQuery = useQuery({
    queryKey: ['financialSummary'],
    queryFn: () => api.getFinancialSummary(),
  });
  const trendsQuery = useQuery({
    queryKey: ['billingTrends'],
    queryFn: () => api.getBillingTrends(),
  });
  const subscriptionMetricsQuery = useQuery({
    queryKey: ['subscriptionMetrics'],
    queryFn: () => api.getSubscriptionMetrics(),
  });

  const summaryError = summaryQuery.isError || summaryQuery.isRefetchError;
  const trendsError = trendsQuery.isError || trendsQuery.isRefetchError;
  const subscriptionMetricsError =
    subscriptionMetricsQuery.isError || subscriptionMetricsQuery.isRefetchError;
  const summary = summaryQuery.data;
  const trends = trendsQuery.data || [];
  const currency = summary?.currency || 'USD';

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenAiAssistant={() => setAiAssistantOpen(true)} />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Financial Reports & Billing Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Invoiced revenue, collected cash, and recurring revenue are calculated separately from source records.
            </p>
          </div>

          {(summaryError || trendsError || subscriptionMetricsError) && (
            <div role="alert" className="flex items-center justify-between gap-3 text-sm text-rose-700">
              <span>Report data could not be loaded from the API.</span>
              <button
                type="button"
                className="font-semibold underline"
                onClick={() =>
                  Promise.all([
                    ...(summaryError ? [summaryQuery.refetch()] : []),
                    ...(trendsError ? [trendsQuery.refetch()] : []),
                    ...(subscriptionMetricsError
                      ? [subscriptionMetricsQuery.refetch()]
                      : []),
                  ])
                }
              >
                Retry
              </button>
            </div>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard
              label="Net collection rate"
              value={summaryQuery.isLoading
                ? 'Loading…'
                : summaryError
                  ? 'Unavailable'
                  : summary?.netCollectionRate == null
                    ? 'Insufficient data'
                    : `${summary.netCollectionRate.toFixed(1)}%`}
              detail="Invoice paid amounts ÷ eligible invoiced totals"
            />
            <MetricCard
              label="Average revenue per customer"
              value={summaryQuery.isLoading
                ? 'Loading…'
                : summaryError
                  ? 'Unavailable'
                  : summary?.arpu == null
                    ? 'Insufficient data'
                    : formatCurrency(summary.arpu, currency)}
              detail="Current MRR ÷ current customer count"
            />
            <MetricCard
              label="Customer churn rate"
              value={subscriptionMetricsQuery.isLoading
                ? 'Loading…'
                : subscriptionMetricsError
                  ? 'Unavailable'
                  : subscriptionMetricsQuery.data?.churnRate == null
                    ? 'Insufficient data'
                    : `${subscriptionMetricsQuery.data.churnRate.toFixed(2)}%`}
              detail="Trailing 30 days; requires dated lifecycle records"
            />
            <MetricCard
              label="Collected cash"
              value={summaryQuery.isLoading
                ? 'Loading…'
                : summaryError
                  ? 'Unavailable'
                  : summary
                    ? formatCurrency(summary.totalCollected, currency)
                    : '—'}
              detail="Recorded payments; not the same as invoice value"
            />
          </section>

          <section className="ui-card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-1">Invoiced vs collected by month</h2>
            <p className="text-xs text-slate-500 mb-6">
              Invoice totals are grouped by issue date; payments are grouped by payment date (UTC).
            </p>
            <div className="h-80 w-full">
              {trendsError ? (
                <div className="pt-28 text-center text-xs text-rose-700">
                  <p>Billing activity could not be loaded.</p>
                  <button type="button" className="mt-2 font-semibold underline" onClick={() => trendsQuery.refetch()}>
                    Retry
                  </button>
                </div>
              ) : trendsQuery.isLoading ? (
                <p className="pt-36 text-center text-xs text-slate-500">Loading billing activity…</p>
              ) : trends.length === 0 ? (
                <p className="text-xs text-slate-500 text-center">No billing activity in this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                    <Legend />
                    <Bar dataKey="billed" fill="#3b82f6" name="Invoiced" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
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

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="ui-card p-5">
      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</span>
      <p className="text-2xl font-extrabold text-slate-900 mt-2">{value}</p>
      <p className="text-[11px] text-slate-500 mt-2 font-medium">{detail}</p>
    </div>
  );
}
