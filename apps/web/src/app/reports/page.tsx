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
    queryFn: async () => {
      const trends = await api.getBillingTrends();
      if (!Array.isArray(trends)) {
        throw new Error('The billing trends API returned an invalid response.');
      }
      return trends;
    },
  });
  const metricsQuery = useQuery({
    queryKey: ['subscriptionMetrics'],
    queryFn: () => api.getSubscriptionMetrics(),
  });
  const summary = summaryQuery.data;
  const trends = trendsQuery.data || [];
  const currency = summary?.currency || 'USD';
  const reportsFailed =
    summaryQuery.isError ||
    summaryQuery.isRefetchError ||
    trendsQuery.isError ||
    trendsQuery.isRefetchError ||
    metricsQuery.isError ||
    metricsQuery.isRefetchError;
  const hasBillingActivity = trends.some(
    (trend: any) => Number(trend.billed) > 0 || Number(trend.collected) > 0,
  );

  const displayMetric = (
    query: typeof summaryQuery | typeof metricsQuery,
    value: number | null | undefined,
    asCurrency = false,
  ) => {
    if (query.isLoading) return 'Loading…';
    if (query.isError || query.isRefetchError) return 'Unavailable';
    if (value === null || value === undefined) return 'Insufficient history';
    return asCurrency ? formatCurrency(value, currency) : `${value.toFixed(2)}%`;
  };

  return (
    <div className="flex min-h-screen bg-[#edeae3] text-stone-900 selection:bg-orange-600 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenAiAssistant={() => setAiAssistantOpen(true)} />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <BarChart3 className="h-6 w-6 text-orange-600" />
              Financial Reports & Billing Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Invoiced revenue, collected cash, and recurring revenue are calculated separately from source records.
            </p>
          </div>

          {reportsFailed && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <span>Some report data could not be loaded.</span>
              <button
                type="button"
                className="font-semibold underline"
                onClick={() =>
                  Promise.all([
                    summaryQuery.refetch(),
                    trendsQuery.refetch(),
                    metricsQuery.refetch(),
                  ])
                }
              >
                Retry
              </button>
            </div>
          )}
          {summary?.dataAvailability?.sourceMode === 'mock' &&
            !summary.dataAvailability.syntheticDataIncluded && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Development mock data is active. Synthetic sample records are excluded from analytics.
              </p>
            )}

          <section aria-label="Financial metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <MetricCard
              label="Net collection rate"
              value={displayMetric(summaryQuery, summary?.netCollectionRate)}
              detail="Invoice paid amounts ÷ eligible invoice totals"
            />
            <MetricCard
              label="Average revenue per customer"
              value={displayMetric(summaryQuery, summary?.arpu, true)}
              detail="Current MRR ÷ current customer count"
            />
            <MetricCard
              label="Customer churn rate"
              value={displayMetric(metricsQuery, metricsQuery.data?.churnRate)}
              detail="Trailing 30 days; dated lifecycle records required"
            />
            <MetricCard
              label="Collected cash"
              value={displayMetric(summaryQuery, summary?.totalCollected, true)}
              detail="Successful recorded payments; not invoice value"
            />
            <MetricCard
              label="Outstanding receivables"
              value={displayMetric(summaryQuery, summary?.outstandingPayments, true)}
              detail="Current eligible invoice balances"
            />
            <MetricCard
              label="Net revenue retention"
              value="Unavailable"
              detail="Historical revenue snapshots are not stored"
            />
          </section>

          <section className="ui-card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-1">Billing vs collected cash</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Monthly invoice totals and successful payments from available Firestore records
            </p>
            <div className="h-72 w-full">
              {trendsQuery.isLoading ? (
                <p role="status" className="pt-24 text-center text-sm text-slate-500">Loading billing records…</p>
              ) : trendsQuery.isError || trendsQuery.isRefetchError ? (
                <div role="alert" className="pt-20 text-center text-sm text-rose-700">
                  <p>Billing activity could not be loaded.</p>
                  <button type="button" className="mt-2 font-semibold underline" onClick={() => trendsQuery.refetch()}>
                    Retry
                  </button>
                </div>
              ) : trends.length === 0 || !hasBillingActivity ? (
                <p className="pt-24 text-center text-sm text-slate-500">No billing activity in the available period.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(value) => formatCurrency(value, currency)}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value), currency)}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="billed" fill="#ea580c" name="Invoiced amount" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collected" fill="#10b981" name="Collected payments" radius={[4, 4, 0, 0]} />
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

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="ui-card p-5">
      <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{label}</span>
      <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{value}</p>
      <p className="text-[11px] text-slate-500 mt-1 font-medium">{detail}</p>
    </div>
  );
}
