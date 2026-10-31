'use client';

import React from 'react';
import { ArrowRight, Info } from 'lucide-react';

export function MonthlyGoalCard() {
  // Generate dashed ticks for the radial semi-circle gauge
  const totalTicks = 24;
  const activeTicks = Math.round(totalTicks * 0.85);

  return (
    <div className="bg-gradient-to-br from-[#ea580c] via-[#f97316] to-[#c2410c] text-white rounded-3xl p-6 sm:p-7 shadow-[0_10px_35px_-5px_rgba(234,88,12,0.35)] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-bold text-white tracking-tight">Monthly Revenue Goal</h3>
          <button
            onClick={() => alert('Goal forecast settings')}
            className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            title="View Details"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Semi-circular Speedometer Gauge */}
        <div className="relative flex flex-col items-center justify-center pt-4 pb-2">
          {/* Radial Arc SVG */}
          <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
            <svg viewBox="0 0 200 110" className="w-full h-full">
              {/* Gauge Track Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="3 7"
              />
              {/* Gauge Progress Arc (85%) */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#ffffff"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="4 7"
                strokeDashoffset="35"
              />
            </svg>

            {/* Gauge Center Text */}
            <div className="absolute inset-x-0 bottom-1 flex flex-col items-center text-center">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                85%
              </span>
              <span className="text-[11px] text-orange-100 font-medium mt-1">
                $85,000 of $100,000 target
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

        {/* Multi-segment Bar */}
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
