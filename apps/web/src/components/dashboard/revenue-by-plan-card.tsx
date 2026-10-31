'use client';

import React, { useMemo } from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function RevenueByPlanCard() {
  const { formatAmount } = useCurrency();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.getSubscriptions(),
    refetchInterval: 5000,
  });

  const { data: kpis = {} } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.getKpis(),
  });

  const { starterRev, proRev, enterpriseRev, totalPlanRev, starterBars, proBars, enterpriseBars } =
    useMemo(() => {
      const activeSubs = (subscriptions as any[]).filter(
        (s: any) => s.status === 'active' || s.status === 'confirmed',
      );

      let sRev = 0;
      let pRev = 0;
      let eRev = 0;

      activeSubs.forEach((s: any) => {
        const amt = Number(s.total ?? s.recurringTotal) || 0;
        const name = (s.planName || s.planId || '').toLowerCase();
        if (name.includes('starter')) {
          sRev += amt;
        } else if (name.includes('enterprise')) {
          eRev += amt;
        } else {
          pRev += amt;
        }
      });

      const total = sRev + pRev + eRev || Number(kpis?.mrr) || 0;

      // Scale barcode heights dynamically based on relative real revenue
      const sRatio = total > 0 ? Math.max(0.2, sRev / total) : 0.3;
      const pRatio = total > 0 ? Math.max(0.3, pRev / total) : 0.5;
      const eRatio = total > 0 ? Math.max(0.15, eRev / total) : 0.2;

      const sBars = [85, 92, 88, 95, 90, 86, 94, 98, 91, 87, 93, 89, 96, 92].map((v) =>
        Math.round(v * sRatio),
      );
      const pBars = [65, 58, 62, 59, 64, 60, 63, 61, 57, 65, 62, 59, 64, 60, 58, 63].map((v) =>
        Math.round(v * pRatio),
      );
      const eBars = [38, 42, 35, 40, 37, 41, 36, 39, 43, 35, 38, 40, 36].map((v) =>
        Math.round(v * eRatio),
      );

      return {
        starterRev: sRev,
        proRev: pRev,
        enterpriseRev: eRev,
        totalPlanRev: total,
        starterBars: sBars,
        proBars: pBars,
        enterpriseBars: eBars,
      };
    }, [subscriptions, kpis]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.05)] transition-all flex flex-col justify-between">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500">Revenue by Plan</span>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight font-mono">
                {formatAmount(totalPlanRev)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active recurring MRR
              </span>
            </div>
          </div>

          <button
            onClick={() => alert('Viewing detailed subscription plans breakdown')}
            className="h-8 w-8 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors"
            title="Expand view"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Income Source subtitle */}
        <div className="mt-6 mb-3 flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider">
            Income Source
          </span>
          <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-orange-500" />
            Live Stripe & Razorpay stream
          </span>
        </div>

        {/* Barcode Striped Histogram Chart matching the template */}
        <div className="h-32 flex items-end justify-between gap-1 pt-4 pb-2 border-b border-stone-100 overflow-hidden">
          {/* Starter Bars (Orange) */}
          {starterBars.map((h, i) => (
            <div
              key={`starter-${i}`}
              className="flex-1 max-w-[6px] rounded-full bg-gradient-to-t from-orange-600 to-orange-500 hover:opacity-80 transition-all cursor-pointer"
              style={{ height: `${Math.max(8, h)}%` }}
              title={`Starter: ${formatAmount(starterRev)}`}
            />
          ))}

          {/* Pro Bars (Amber / Golden Yellow) */}
          {proBars.map((h, i) => (
            <div
              key={`pro-${i}`}
              className="flex-1 max-w-[6px] rounded-full bg-gradient-to-t from-amber-500 to-amber-400 hover:opacity-80 transition-all cursor-pointer"
              style={{ height: `${Math.max(8, h)}%` }}
              title={`Pro: ${formatAmount(proRev)}`}
            />
          ))}

          {/* Enterprise Bars (Light Slate / Soft Gray) */}
          {enterpriseBars.map((h, i) => (
            <div
              key={`ent-${i}`}
              className="flex-1 max-w-[6px] rounded-full bg-gradient-to-t from-stone-300 to-stone-200 hover:opacity-80 transition-all cursor-pointer"
              style={{ height: `${Math.max(8, h)}%` }}
              title={`Enterprise: ${formatAmount(enterpriseRev)}`}
            />
          ))}
        </div>
      </div>

      {/* Legend below matching template */}
      <div className="flex items-center gap-6 pt-4 text-xs font-semibold flex-wrap">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span className="text-stone-900 font-bold">Starter</span>
          <span className="text-stone-500 font-medium font-mono">{formatAmount(starterRev)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-stone-900 font-bold">Pro</span>
          <span className="text-stone-500 font-medium font-mono">{formatAmount(proRev)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="text-stone-900 font-bold">Enterprise</span>
          <span className="text-stone-500 font-medium font-mono">{formatAmount(enterpriseRev)}</span>
        </div>
      </div>
    </div>
  );
}
