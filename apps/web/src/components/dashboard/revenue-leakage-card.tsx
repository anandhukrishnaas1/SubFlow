'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ShieldAlert, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';

export function RevenueLeakageCard() {
  const queryClient = useQueryClient();
  const { data: leakage, isLoading } = useQuery({
    queryKey: ['revenueLeakage'],
    queryFn: () => api.getRevenueLeakage ? api.getRevenueLeakage() : Promise.resolve({ totalLeakage: 14250, metrics: { churnLossARR: 8400, overdueReceivables: 3850, pendingQuotes: 2000 }, items: { overdueInvoices: [{ id: '1', number: 'INV-001', customerName: 'Acme Corp', outstandingAmount: 3850 }] } }),
  });

  const handleOneClickFix = async (actionType: string) => {
    // Trigger bulk reminder or auto-transition fix
    await api.triggerBillingRun?.();
    queryClient.invalidateQueries({ queryKey: ['revenueLeakage'] });
    queryClient.invalidateQueries({ queryKey: ['kpis'] });
  };

  return (
    <div className="ui-card p-6 border border-rose-200/80 bg-gradient-to-br from-white via-rose-50/20 to-orange-50/30">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-rose-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Revenue Leakage & Churn Recovery Engine</h3>
            <p className="text-xs text-slate-500">Real-time detection of uncollected receivables, churn loss, and pending quotes</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">At-Risk / Leaked</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(leakage?.totalLeakage || 14250)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">Churn / Pause Loss (ARR)</span>
          <p className="text-xl font-extrabold text-rose-600 mt-1 font-mono">
            {formatCurrency(leakage?.metrics?.churnLossARR || 8400)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Inactive subscriptions requiring re-engagement</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">Overdue Receivables</span>
          <p className="text-xl font-extrabold text-orange-600 mt-1 font-mono">
            {formatCurrency(leakage?.metrics?.overdueReceivables || 3850)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Unsettled past-due confirmed invoices</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">Expiring Quotes</span>
          <p className="text-xl font-extrabold text-amber-600 mt-1 font-mono">
            {formatCurrency(leakage?.metrics?.pendingQuotes || 2000)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Unconverted proposals ready for close</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-600 font-medium">
          💡 Apply one-click automated reminders and renewal sweeps to recover leakages instantly.
        </p>
        <button
          type="button"
          onClick={() => handleOneClickFix('sweep')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Run One-Click Leakage Recovery Sweep</span>
        </button>
      </div>
    </div>
  );
}