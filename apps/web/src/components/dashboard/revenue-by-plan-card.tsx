'use client';

import React from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

export function RevenueByPlanCard() {
  const { formatAmount } = useCurrency();

  // Generate realistic barcode stripes matching the template
  const starterBars = [85, 92, 88, 95, 90, 86, 94, 98, 91, 87, 93, 89, 96, 92];
  const proBars = [65, 58, 62, 59, 64, 60, 63, 61, 57, 65, 62, 59, 64, 60, 58, 63];
  const enterpriseBars = [38, 42, 35, 40, 37, 41, 36, 39, 43, 35, 38, 40, 36];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.05)] transition-all flex flex-col justify-between">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-stone-500">Revenue by Plan</span>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                {formatAmount(42860)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                -3.2% vs last month
              </span>
            </div>
          </div>

          <button
            onClick={() => alert('Expanded analytical view')}
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
              style={{ height: `${h}%` }}
              title={`Starter: ${formatAmount(h * 135)}`}
            />
          ))}

          {/* Pro Bars (Amber / Golden Yellow) */}
          {proBars.map((h, i) => (
            <div
              key={`pro-${i}`}
              className="flex-1 max-w-[6px] rounded-full bg-gradient-to-t from-amber-500 to-amber-400 hover:opacity-80 transition-all cursor-pointer"
              style={{ height: `${h}%` }}
              title={`Pro: ${formatAmount(h * 290)}`}
            />
          ))}

          {/* Enterprise Bars (Light Slate / Soft Gray) */}
          {enterpriseBars.map((h, i) => (
            <div
              key={`ent-${i}`}
              className="flex-1 max-w-[6px] rounded-full bg-gradient-to-t from-stone-300 to-stone-200 hover:opacity-80 transition-all cursor-pointer"
              style={{ height: `${h}%` }}
              title={`Enterprise: ${formatAmount(h * 270)}`}
            />
          ))}
        </div>
      </div>

      {/* Legend below matching template */}
      <div className="flex items-center gap-6 pt-4 text-xs font-semibold flex-wrap">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span className="text-stone-900 font-bold">Starter</span>
          <span className="text-stone-500 font-medium">{formatAmount(12400)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-stone-900 font-bold">Pro</span>
          <span className="text-stone-500 font-medium">{formatAmount(18900)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="text-stone-900 font-bold">Enterprise</span>
          <span className="text-stone-500 font-medium">{formatAmount(11560)}</span>
        </div>
      </div>
    </div>
  );
}
