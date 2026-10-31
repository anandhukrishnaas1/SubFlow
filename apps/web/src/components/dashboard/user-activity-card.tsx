'use client';

import React from 'react';
import { Activity, Info } from 'lucide-react';

export function UserActivityCard() {
  return (
    <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-64">
      <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
        <Activity className="h-4 w-4 text-stone-500" />
        <h3 className="text-sm font-bold text-stone-900 tracking-tight">User Activity</h3>
      </div>
      <div className="py-8 text-center">
        <p className="text-sm font-semibold text-stone-700">Activity metrics unavailable</p>
        <p className="text-xs text-stone-500 mt-2">
          This workspace does not currently provide activity-event analytics.
        </p>
      </div>
      <div className="flex items-center gap-2 border-t border-stone-100 pt-3 text-[11px] text-stone-500">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>No usage or uptime figures are inferred from billing records.</span>
      </div>
    </section>
  );
}
