'use client';

import React from 'react';
import { Info, Target } from 'lucide-react';

export function MonthlyGoalCard() {
  return (
    <section className="bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] text-white rounded-3xl p-6 sm:p-7 shadow-[0_12px_36px_-6px_rgba(234,88,12,0.4)] flex flex-col justify-between min-h-64">
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
          <Target className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-sm font-bold tracking-tight">Monthly Revenue Goal</h3>
      </div>
      <div className="py-8 text-center">
        <p className="text-2xl font-black">Not configured</p>
        <p className="text-xs text-orange-100 mt-2">
          A revenue target has not been set for this workspace.
        </p>
      </div>
      <div className="flex items-center gap-2 border-t border-white/15 pt-3 text-xs text-orange-100">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>Progress will appear once a goal is configured.</span>
      </div>
    </section>
  );
}
