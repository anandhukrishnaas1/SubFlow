'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Info, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

export function CashFlowDiagram() {
  const metricsQuery = useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: () => api.getSubscriptionMetrics(),
  });
  const churnRate = metricsQuery.data?.churnRate;

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)]">
      <div className="flex items-start gap-3 pb-5 border-b border-stone-100">
        <span className="h-6 w-6 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
          <TrendingUp className="h-3.5 w-3.5" />
        </span>
        <div>
          <h3 className="text-lg font-black text-stone-900 tracking-tight">Revenue Movement & Retention</h3>
          <p className="text-xs text-stone-500 mt-1">
            Historical revenue movement is unavailable without recurring-revenue snapshots.
          </p>
        </div>
      </div>

      {metricsQuery.isLoading ? (
        <p className="py-6 text-sm text-stone-500" role="status">Loading subscription metrics…</p>
      ) : metricsQuery.isError ? (
        <div className="py-6">
          <p className="flex items-center gap-2 text-sm text-rose-700" role="alert">
            <AlertCircle className="h-4 w-4" /> Retention metrics could not be loaded.
          </p>
          <button type="button" className="mt-2 text-xs font-semibold underline" onClick={() => metricsQuery.refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-4 pt-5 md:grid-cols-2">
          <div className="rounded-2xl bg-stone-50 p-4">
            <h4 className="text-xs font-bold text-stone-800">Available metric</h4>
            <dl className="mt-3">
              <dt className="text-xs text-stone-500">Customer churn rate</dt>
              <dd className="mt-1 text-lg font-black text-stone-900">
                {typeof churnRate === 'number' ? `${churnRate.toFixed(2)}%` : 'Unavailable'}
              </dd>
            </dl>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <h4 className="text-xs font-bold text-stone-800">Historical metrics</h4>
            <p className="mt-3 text-xs leading-5 text-stone-600">
              Expansion, contraction, revenue churn, NRR, LTV:CAC, ARPU, and cash runway require source history
              that is not available in this workspace.
            </p>
          </div>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 border-t border-stone-100 pt-3 text-[11px] text-stone-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        No historical revenue movement or financial health figures are estimated.
      </p>
    </section>
  );
}
