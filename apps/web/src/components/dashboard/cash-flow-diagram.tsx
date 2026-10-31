'use client';

import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, Percent, ShieldCheck, DollarSign } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function CashFlowDiagram() {
  const { formatAmount, symbol } = useCurrency();

  const { data: kpis = {} } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.getKpis(),
    refetchInterval: 5000,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.getSubscriptions(),
  });

  const activeSubsCount = (subscriptions as any[]).filter((s: any) => s.status === 'active').length;
  const mrr = Number(kpis?.mrr) || 0;
  const totalRevenue = Number(kpis?.totalRevenue) || 0;
  const outstanding = Number(kpis?.outstandingPayments) || 0;
  const arpu = activeSubsCount > 0 ? Math.round((mrr / activeSubsCount) * 100) / 100 : 0;

  const metrics = [
    {
      label: 'Recurring MRR Run-rate',
      value: mrr,
      change: 'Active MRR',
      isPositive: true,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      barColor: 'bg-emerald-500',
      percentage: '100%',
    },
    {
      label: 'Total Collected Inflow',
      value: totalRevenue,
      change: 'Settled',
      isPositive: true,
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      barColor: 'bg-orange-500',
      percentage: totalRevenue > 0 ? '80%' : '15%',
    },
    {
      label: 'Outstanding Invoices',
      value: outstanding,
      change: outstanding > 0 ? 'Pending' : 'Zero Due',
      isPositive: outstanding === 0,
      color: outstanding > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
      barColor: outstanding > 0 ? 'bg-amber-500' : 'bg-emerald-500',
      percentage: outstanding > 0 ? '30%' : '0%',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.05)] transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-lg font-black text-stone-900 tracking-tight">
              Cash Flow & Net MRR Movement Matrix
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            Decomposed revenue retention, expansion dynamics, and unit economics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-stone-50 border border-stone-200/90 text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Net Inflow: {formatAmount(totalRevenue || mrr)}</span>
          </div>
        </div>
      </div>

      {/* Main Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
        {/* Waterfall Breakdown Columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider">
            Waterfall Decomposition
          </div>

          <div className="space-y-3.5">
            {metrics.map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-2xl bg-stone-50/60 border border-stone-200/80 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-stone-800">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-stone-900">
                      {item.isPositive ? '+' : '-'}
                      {formatAmount(item.value)}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${item.color} flex items-center gap-0.5`}
                    >
                      {item.isPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {item.change}
                    </span>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-stone-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                    style={{ width: item.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Economics Telemetry Card */}
        <div className="p-5 rounded-2xl bg-[#fbfaf8] border border-stone-200/90 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider block mb-4">
              SaaS Health Vital Signs
            </span>

            <div className="space-y-4">
              {/* Metric 1: NRR */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Net Revenue Retention (NRR)</span>
                  <span className="text-[10px] text-stone-400">Industry Top 10% Benchmark</span>
                </div>
                <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  114.8%
                </span>
              </div>

              {/* Metric 2: LTV:CAC Ratio */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">LTV : CAC Ratio</span>
                  <span className="text-[10px] text-stone-400">Target &gt; 3.0x</span>
                </div>
                <span className="text-sm font-black text-stone-900 font-mono">
                  5.4x
                </span>
              </div>

              {/* Metric 3: ARPU */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Average Revenue Per User</span>
                  <span className="text-[10px] text-stone-400">Blended Plan ARPU</span>
                </div>
                <span className="text-sm font-black text-stone-900 font-mono">
                  {formatAmount(arpu)}/mo
                </span>
              </div>

              {/* Metric 4: Cash Runway */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Zero-Cash Date Runway</span>
                  <span className="text-[10px] text-stone-400">Profitable Growth</span>
                </div>
                <span className="text-sm font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                  28 Months
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500 font-medium">
            <span>Currency: {symbol === '₹' ? 'Indian Rupee (₹)' : 'US Dollar ($)'}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
