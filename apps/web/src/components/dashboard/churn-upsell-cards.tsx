'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Risk {
  reference: string;
  customerName?: string;
  signal: string;
  evidence: string[];
  severity: string;
  recommendedAction: string;
}

export function ChurnUpsellCards() {
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['analyticsRisks'],
    queryFn: () => api.getAnalyticsRisks(),
  });
  const risks: Risk[] = data?.items || [];

  return (
    <section className="ui-card p-5">
      <div className="flex items-center gap-2">
        {risks.length > 0 ? (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        )}
        <h3 className="text-sm font-bold text-slate-900">Evidence-based risk signals</h3>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500 mt-3">Loading risk signals…</p>
      ) : isError ? (
        <p className="text-sm text-rose-600 mt-3">Risk signals could not be loaded.</p>
      ) : risks.length === 0 ? (
        <p className="text-sm text-slate-600 mt-3">
          No configured risk signals were detected in the available records. Predictive churn and
          upsell forecasts are not shown without historical evidence.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {risks.map((risk) => (
            <li key={`${risk.signal}-${risk.reference}`} className="py-3 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  {risk.customerName || risk.reference}
                </p>
                <span className="text-xs uppercase text-amber-700">{risk.severity}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {risk.signal.replace(/_/g, ' ')} · {risk.evidence.join(' · ')}
              </p>
              <p className="text-xs text-slate-500 mt-1">{risk.recommendedAction}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
