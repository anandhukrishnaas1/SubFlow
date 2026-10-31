'use client';

import React from 'react';
import { ArrowRight, Info, Target } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

export function MonthlyGoalCard() {
  const { formatAmount } = useCurrency();

  // Generate radiating tick bars for the radial semi-circle speedometer
  const totalTicks = 32;
  const activeCount = Math.round(totalTicks * 0.85); // 27 active ticks
  const cx = 100;
  const cy = 94;
  const rInner = 58;
  const rOuter = 80;

  const ticks = Array.from({ length: totalTicks }).map((_, i) => {
    const angle = Math.PI - (i / (totalTicks - 1)) * Math.PI;
    const x1 = cx + rInner * Math.cos(angle);
    const y1 = cy - rInner * Math.sin(angle);
    const x2 = cx + rOuter * Math.cos(angle);
    const y2 = cy - rOuter * Math.sin(angle);
    const isActive = i < activeCount;
    return { x1, y1, x2, y2, isActive };
  });

  return (
    <div className="bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] text-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_36px_-6px_rgba(234,88,12,0.4)] hover:shadow-[0_16px_40px_-6px_rgba(234,88,12,0.5)] transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-white" />
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">Monthly Revenue Goal</h3>
          </div>
          <button
            onClick={() => alert('Goal forecast settings')}
            className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            title="View Details"
          >
            <ArrowRight className="h-3.5 w-3.5 -rotate-45" />
          </button>
        </div>

        {/* Semi-circular Speedometer Gauge */}
        <div className="relative flex flex-col items-center justify-center pt-3 pb-2">
          {/* Radial Arc SVG */}
          <div className="relative w-52 h-32 flex items-end justify-center overflow-hidden">
            <svg viewBox="0 0 200 108" className="w-full h-full">
              {ticks.map((t, idx) => (
                <line
                  key={idx}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.25)'}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {/* Gauge Center Text */}
            <div className="absolute inset-x-0 bottom-1 flex flex-col items-center text-center">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                85%
              </span>
              <span className="text-[11px] text-orange-100 font-medium mt-1">
                {formatAmount(85000)} of {formatAmount(100000)} target
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info & Multi-segment Progress */}
      <div className="space-y-3 pt-3 border-t border-white/15">
        <div className="flex items-center justify-center gap-1.5 text-xs text-orange-100 font-medium">
          <Info className="h-3.5 w-3.5 text-white/90" />
          <span>15% remaining to hit monthly goal</span>
        </div>

        {/* Multi-segment Bar matching template */}
        <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden flex p-0.5">
          <div className="bg-white h-full rounded-full" style={{ width: '45%' }} />
          <div className="bg-emerald-300 h-full rounded-full ml-1" style={{ width: '30%' }} />
          <div className="bg-amber-300 h-full rounded-full ml-1" style={{ width: '10%' }} />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-white/90 font-semibold pt-1">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-white" /> Net Profit
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-300" /> Revenue
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-300" /> Target
          </span>
        </div>
      </div>
    </div>
  );
}
