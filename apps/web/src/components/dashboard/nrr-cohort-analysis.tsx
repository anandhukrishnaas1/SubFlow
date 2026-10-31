'use client';

import React from 'react';
import { Info } from 'lucide-react';

export function NrrCohortAnalysis() {
  return (
    <section className="ui-card p-6">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">NRR & Cohort Retention</h3>
        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
          Unavailable
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Net revenue retention and cohort retention require historical customer and recurring-revenue snapshots.
      </p>
      <div className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span>No historical snapshots are available, so no retention percentages or projections are displayed.</span>
      </div>
    </section>
  );
}
