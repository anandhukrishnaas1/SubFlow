'use client';

import React from 'react';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

export function FinancialReportCard() {
  return (
    <div className="ui-card p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Financial Report</h3>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> +18.4%
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {/* Income Group */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <span>Income Streams</span>
              <span className="font-mono text-emerald-600">$215,030.00</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Recurring Subscriptions</span>
                <span className="font-mono font-medium text-slate-900">$142,600</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '68%' }} />
              </div>

              <div className="flex items-center justify-between text-slate-600 pt-1">
                <span>Add-on Analytics & Support</span>
                <span className="font-mono font-medium text-slate-900">$51,430</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full rounded-full" style={{ width: '24%' }} />
              </div>

              <div className="flex items-center justify-between text-slate-600 pt-1">
                <span>Custom Domain SSL Provisioning</span>
                <span className="font-mono font-medium text-slate-900">$21,000</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '12%' }} />
              </div>
            </div>
          </div>

          {/* Expenses Group */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <span>Expenses</span>
              <span className="font-mono text-slate-500">$48,210.00</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Cloud Infrastructure & Hosting</span>
                <span className="font-mono font-medium text-slate-900">$32,150</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: '42%' }} />
              </div>

              <div className="flex items-center justify-between text-slate-600 pt-1">
                <span>Stripe & Banking Gateway Fees</span>
                <span className="font-mono font-medium text-slate-900">$16,060</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full rounded-full" style={{ width: '22%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Summary Bar */}
      <div className="mt-5 pt-3 border-t border-slate-200/80 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900">Net Operational Margin</span>
        <span className="text-sm font-extrabold text-emerald-600 font-mono">+$166,820.00 (77.6%)</span>
      </div>
    </div>
  );
}
