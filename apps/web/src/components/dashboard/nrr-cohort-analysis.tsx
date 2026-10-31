'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function NrrCohortAnalysis() {
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['subscriptionMetrics'],
    queryFn: () => api.getSubscriptionMetrics(),
  });

  return (
    <section className="ui-card p-6">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="text-base font-bold text-slate-900">Retention and cohort analysis</h3>
          <p className="text-sm text-slate-600 mt-1">
            {isLoading
              ? 'Checking subscription history…'
              : isError
                ? 'Subscription history could not be loaded.'
                : metrics?.churnRate == null
                  ? 'Insufficient historical subscription lifecycle data to calculate customer churn.'
                  : `Customer churn over the trailing 30 days: ${metrics.churnRate.toFixed(2)}%.`}
            {' '}NRR, revenue churn, and cohort retention remain unavailable until historical value and cohort snapshots exist.
          </p>
        </div>
      </div>
    </section>
  );
}
