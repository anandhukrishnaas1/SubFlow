'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCurrency } from '@/hooks/use-currency';
import { api } from '@/lib/api';

export function RevenueByPlanCard() {
  const { formatAmount } = useCurrency();
  const trendsQuery = useQuery({
    queryKey: ['billing-trends'],
    queryFn: () => api.getBillingTrends(),
  });
  const trends = trendsQuery.data;
  const hasActivity = Array.isArray(trends) && trends.some(
    (item: any) => Number(item.billed) > 0 || Number(item.collected) > 0,
  );

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-stone-500">Billing Trends</span>
          <p className="text-sm font-semibold text-stone-800 mt-1">
            Invoiced and collected amounts by month
          </p>
        </div>
        <BarChart3 className="h-5 w-5 text-stone-400" />
      </div>

      {trendsQuery.isLoading ? (
        <p className="py-12 text-center text-sm text-stone-500" role="status">Loading billing trends…</p>
      ) : trendsQuery.isError ? (
        <div className="py-8 text-center">
          <AlertCircle className="h-5 w-5 mx-auto text-rose-600" />
          <p className="mt-2 text-sm text-rose-700" role="alert">Billing trends could not be loaded.</p>
          <button type="button" className="mt-2 text-xs font-semibold underline" onClick={() => trendsQuery.refetch()}>
            Retry
          </button>
        </div>
      ) : !Array.isArray(trends) || trends.length === 0 || !hasActivity ? (
        <p className="py-12 text-center text-sm text-stone-500">
          No billing activity is available for the selected period.
        </p>
      ) : (
        <div className="h-64 mt-4" aria-label="Monthly billed and collected revenue chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatAmount(value)} />
              <Tooltip formatter={(value) => formatAmount(Number(value))} />
              <Bar dataKey="billed" name="Invoiced" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
