'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Info } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { api } from '@/lib/api';

export function FinancialReportCard() {
  const { formatAmount } = useCurrency();
  const summaryQuery = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => api.getFinancialSummary(),
  });
  const summary = summaryQuery.data;
  const amountValue = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? formatAmount(value) : 'Unavailable';

  return (
    <section className="ui-card p-6 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100">
          Financial Summary
        </h3>
        {summaryQuery.isLoading ? (
          <p className="py-8 text-sm text-slate-500" role="status">Loading financial summary…</p>
        ) : summaryQuery.isError ? (
          <div className="py-8">
            <p className="flex items-center gap-2 text-sm text-rose-700" role="alert">
              <AlertCircle className="h-4 w-4" /> Financial summary could not be loaded.
            </p>
            <button type="button" className="mt-2 text-xs font-semibold underline" onClick={() => summaryQuery.refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">Invoiced</dt>
              <dd className="font-mono font-semibold text-slate-900">{amountValue(summary?.totalInvoiced)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">Collected</dt>
              <dd className="font-mono font-semibold text-emerald-700">{amountValue(summary?.totalCollected)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">Outstanding</dt>
              <dd className="font-mono font-semibold text-slate-900">{amountValue(summary?.outstandingPayments)}</dd>
            </div>
          </dl>
        )}
      </div>
      <p className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Invoiced and collected amounts are reported independently from billing records.
      </p>
    </section>
  );
}
