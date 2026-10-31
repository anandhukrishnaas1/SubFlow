'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface FinancialSummary {
  totalInvoiced?: number;
  totalCollected?: number;
  outstandingPayments?: number;
  netCollectionRate?: number | null;
}

export function FinancialReportCard({
  summary,
  isLoading,
  isError,
}: {
  summary?: FinancialSummary;
  isLoading: boolean;
  isError: boolean;
}) {
  const rows = [
    { label: 'Invoiced amount', value: summary?.totalInvoiced },
    { label: 'Cash collected', value: summary?.totalCollected },
    { label: 'Outstanding receivables', value: summary?.outstandingPayments },
  ];

  return (
    <div className="ui-card p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Financial Summary</h3>
          <span className="text-[11px] font-semibold text-slate-500">Source records</span>
        </div>
        <div className="mt-4 space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{row.label}</span>
              <span className="font-mono font-semibold text-slate-900">
                {isLoading
                  ? 'Loading…'
                  : isError
                    ? 'Unavailable'
                    : row.value === undefined
                      ? '—'
                      : formatCurrency(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Net collection rate</span>
        <span className="text-sm font-bold text-slate-900 font-mono">
          {isLoading
            ? 'Loading…'
            : isError
              ? 'Unavailable'
              : summary?.netCollectionRate == null
                ? 'Insufficient data'
                : `${summary.netCollectionRate.toFixed(1)}%`}
        </span>
      </div>
    </div>
  );
}
