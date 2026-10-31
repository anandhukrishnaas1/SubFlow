'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Info } from 'lucide-react';
import { api } from '@/lib/api';

export function ChurnUpsellCards() {
  const metricsQuery = useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: () => api.getSubscriptionMetrics(),
  });
  const churnRate = metricsQuery.data?.churnRate;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <section className="ui-card p-5">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">Customer Churn</h4>
        {metricsQuery.isLoading ? (
          <p className="mt-6 text-sm text-slate-500" role="status">Loading…</p>
        ) : metricsQuery.isError ? (
          <div className="mt-5">
            <p className="flex items-center gap-2 text-sm text-rose-700" role="alert">
              <AlertCircle className="h-4 w-4" /> Metric unavailable.
            </p>
            <button type="button" className="mt-2 text-xs font-semibold underline" onClick={() => metricsQuery.refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <p className="mt-6 text-2xl font-black text-slate-900">
            {typeof churnRate === 'number' ? `${churnRate.toFixed(2)}%` : 'Unavailable'}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">Based on available subscription lifecycle records.</p>
      </section>

      <section className="ui-card p-5">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">Revenue Churn</h4>
        <p className="mt-6 text-lg font-bold text-slate-600">Unavailable</p>
        <p className="mt-2 text-xs text-slate-500">
          Historical recurring-revenue snapshots are not available.
        </p>
      </section>

      <section className="ui-card p-5">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight">Expansion Forecast</h4>
        <p className="mt-6 text-lg font-bold text-slate-600">Unavailable</p>
        <p className="mt-2 flex items-start gap-2 text-xs text-slate-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          No forecast model or supporting historical data is configured.
        </p>
      </section>
    </div>
  );
}
