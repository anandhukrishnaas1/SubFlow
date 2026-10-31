'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CreditCard,
  Users,
  Repeat,
  AlertTriangle,
  FileText,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { FinancialReportCard } from '@/components/dashboard/financial-report-card';
import { NrrCohortAnalysis } from '@/components/dashboard/nrr-cohort-analysis';
import { ChurnUpsellCards } from '@/components/dashboard/churn-upsell-cards';
import { AiAssistantDrawer } from '@/components/dashboard/ai-assistant-drawer';

// Sample Invoice Summary matching Image 1
const INVOICE_SUMMARY_DATA = [
  { month: 'Jan', total: 40, outstanding: 20 },
  { month: 'Feb', total: 110, outstanding: 75 },
  { month: 'Mar', total: 135, outstanding: 85 },
  { month: 'Apr', total: 155, outstanding: 95 },
  { month: 'May', total: 145, outstanding: 90 },
  { month: 'Jun', total: 165, outstanding: 52 },
];

// Sample Usage Report matching Image 1
const USAGE_REPORT_DATA = [
  { month: 'Jan', credits: 130, summaries: 120, apiCalls: 120 },
  { month: 'Feb', credits: 140, summaries: 150, apiCalls: 130 },
  { month: 'Mar', credits: 165, summaries: 140, apiCalls: 135 },
  { month: 'Apr', credits: 85, summaries: 65, apiCalls: 120 },
  { month: 'May', credits: 125, summaries: 130, apiCalls: 140 },
  { month: 'Jun', credits: 155, summaries: 160, apiCalls: 148 },
];

export default function DashboardPage() {
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const { data: kpis = {} } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.getKpis(),
    refetchInterval: 5000,
  });

  const { data: recentInvoices = [] } = useQuery({
    queryKey: ['recentInvoices'],
    queryFn: () => api.getInvoices(),
  });

  const { data: recentSubs = [] } = useQuery({
    queryKey: ['recentSubs'],
    queryFn: () => api.getSubscriptions(),
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenAiAssistant={() => setAiAssistantOpen(true)} />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Top KPI Cards Row matching Image 1 & Image 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. MRR Card */}
            <div className="ui-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">MRR</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  ▲ 5.7%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  $215,400
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Live recurring run-rate from active subscriptions
              </p>
            </div>

            {/* 2. ARR Card */}
            <div className="ui-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ARR</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  ▲ 3.4%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  $2.58M
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Contracted annual recurring pipeline
              </p>
            </div>

            {/* 3. CARR / Active Accounts */}
            <div className="ui-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Accounts</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  ▲ 25% MoM
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  5,632
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Across enterprise & mid-market tiers
              </p>
            </div>

            {/* 4. NRR Card */}
            <div className="ui-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">NRR</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  ▲ 1.6%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  108.4%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                Net retention with expansion outpacing churn
              </p>
            </div>
          </div>

          {/* Core Analytics Middle Row matching Image 1: 3 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Financial Report Table */}
            <FinancialReportCard />

            {/* Card 2: Invoice Summary Area Chart */}
            <div className="ui-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Invoice Summary</h3>
                  <span className="text-[11px] font-semibold text-slate-500 font-mono">Real-time</span>
                </div>

                <div className="h-56 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={INVOICE_SUMMARY_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.15} />
                        </linearGradient>
                        <linearGradient id="colorOutstanding" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.85} />
                          <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}K`} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl space-y-1 border border-slate-800">
                                <p className="font-bold text-slate-300 pb-1 border-b border-slate-800">{payload[0].payload.month}</p>
                                <div className="flex items-center justify-between gap-4 text-blue-400">
                                  <span>• Invoice total:</span>
                                  <span className="font-mono font-bold">120.03k</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-sky-300">
                                  <span>• Outstanding:</span>
                                  <span className="font-mono font-bold">52.03k</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="outstanding" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#colorOutstanding)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-blue-600" />
                  <span className="text-slate-700">Invoice total</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-sky-300" />
                  <span className="text-slate-700">Outstanding</span>
                </div>
              </div>
            </div>

            {/* Card 3: Usage Report Multi-Bar Chart */}
            <div className="ui-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Usage Report</h3>
                  <span className="text-[11px] font-semibold text-slate-500 font-mono">Monthly</span>
                </div>

                <div className="h-56 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={USAGE_REPORT_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl space-y-1 border border-slate-800">
                                <p className="font-bold text-slate-300 pb-1 border-b border-slate-800">{payload[0].payload.month}</p>
                                <div className="flex items-center justify-between gap-4 text-blue-400">
                                  <span>• API Calls:</span>
                                  <span className="font-mono font-bold">120</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-orange-400">
                                  <span>• AI Summaries:</span>
                                  <span className="font-mono font-bold">140</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-sky-300">
                                  <span>• Credits used:</span>
                                  <span className="font-mono font-bold">132</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="credits" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="summaries" fill="#fb923c" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="apiCalls" fill="#2563eb" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-sky-300" />
                  <span className="text-slate-600">Credits used</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-orange-400" />
                  <span className="text-slate-600">AI Summaries</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-blue-600" />
                  <span className="text-slate-600">API Calls</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Status Pill Badges Row matching Image 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="ui-card p-4 flex items-center justify-between bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <UserPlus className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-emerald-900">+24 Users upgraded this week</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-700" />
            </div>

            <div className="ui-card p-4 flex items-center justify-between bg-blue-50/50 border-blue-200/80 hover:bg-blue-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-blue-900">12 Upcoming renewals (next 7 days)</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-blue-700" />
            </div>

            <div className="ui-card p-4 flex items-center justify-between bg-rose-50/50 border-rose-200/80 hover:bg-rose-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-rose-900">3 High-risk accounts flagged</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-rose-700" />
            </div>
          </div>

          {/* NRR Cohort Analysis matching Image 3 */}
          <NrrCohortAnalysis />

          {/* Churn Risk & Upsell Forecasts matching Image 3 */}
          <ChurnUpsellCards />

          {/* Recent Invoices & Subscriptions Live Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Subscriptions */}
            <div className="ui-card p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Active Subscriptions</h3>
                </div>
                <Link href="/subscriptions" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  View all →
                </Link>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {recentSubs.slice(0, 4).map((sub: any) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{sub.customerName || 'Acme Corporation'}</p>
                      <p className="text-[11px] text-slate-500">{sub.planName} • {sub.billingInterval}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 font-mono">{formatCurrency(sub.total)}</p>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="ui-card p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Invoices</h3>
                </div>
                <Link href="/invoices" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  View all →
                </Link>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {recentInvoices.slice(0, 4).map((inv: any) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 font-mono">{inv.number}</p>
                      <p className="text-[11px] text-slate-500">{inv.customerName} • {formatDate(inv.issueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 font-mono">{formatCurrency(inv.total)}</p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* AI Assistant Slide-Out Drawer matching Image 2 */}
      <AiAssistantDrawer
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        kpis={kpis}
      />
    </div>
  );
}
