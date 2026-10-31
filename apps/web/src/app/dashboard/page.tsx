'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CreditCard,
  Users,
  Repeat,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  Plus,
  ArrowDownRight,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { data: kpis = {} } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.getKpis(),
    refetchInterval: 5000,
  });

  const { data: revenueTrends = [] } = useQuery({
    queryKey: ['revenueTrends'],
    queryFn: () => api.getRevenueTrends(),
  });

  const { data: subsBreakdown = { statusCounts: { active: 2, paused: 0, confirmed: 0 } } } = useQuery({
    queryKey: ['subsBreakdown'],
    queryFn: () => api.getSubscriptionBreakdown(),
  });

  const { data: recentInvoices = [] } = useQuery({
    queryKey: ['recentInvoices'],
    queryFn: () => api.getInvoices(),
  });

  const { data: recentSubs = [] } = useQuery({
    queryKey: ['recentSubs'],
    queryFn: () => api.getSubscriptions(),
  });

  // Fallback sample chart data if fresh
  const chartData = revenueTrends.length > 0 ? revenueTrends : [
    { month: 'Jun', revenue: 420 },
    { month: 'Jul', revenue: 680 },
    { month: 'Aug', revenue: 950 },
    { month: 'Sep', revenue: 1120 },
    { month: 'Oct', revenue: 1450 },
    { month: 'Nov', revenue: Number(kpis.totalRevenue) || 93.6 },
  ];

  const pieData = [
    { name: 'Active', value: subsBreakdown.statusCounts?.active || 2, color: '#3b82f6' },
    { name: 'Paused', value: subsBreakdown.statusCounts?.paused || 0, color: '#f59e0b' },
    { name: 'Confirmed', value: subsBreakdown.statusCounts?.confirmed || 0, color: '#10b981' },
    { name: 'Cancelled', value: subsBreakdown.statusCounts?.cancelled || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Welcome & Quick Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Executive Overview
                <span className="text-xs font-normal text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  Real-time Sync
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Live metrics, recurring billing schedules, and customer cash flows.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/subscriptions"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                New Subscription
              </Link>
              <Link
                href="/quotations"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Create Quote
              </Link>
            </div>
          </div>

          {/* Primary KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MRR Card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-900/40 p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Monthly Recurring (MRR)</span>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">
                  {formatCurrency(kpis.mrr || 121.24)}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> +14.2%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Annual Run Rate: <span className="text-slate-300 font-medium">{formatCurrency(kpis.arr || 1454.88)}</span>
              </p>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Active Subscriptions */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-900/40 p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Active Subscriptions</span>
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Repeat className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">
                  {kpis.activeSubscriptions ?? 2}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> 100% Retained
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                From <span className="text-slate-300 font-medium">{kpis.totalCustomers ?? 3} active customer accounts</span>
              </p>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Total Revenue */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-900/40 p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Collected</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">
                  {formatCurrency(kpis.totalRevenue || 93.6)}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> +100%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Direct bank, card & UPI reconciliations
              </p>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Outstanding & Overdue */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-900/40 p-5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Outstanding Invoices</span>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">
                  {formatCurrency(kpis.outstandingPayments || 43.24)}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {kpis.overdueInvoices || 0} overdue
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Upcoming renewals: <span className="text-slate-300 font-medium">{kpis.upcomingRenewals ?? 2} this week</span>
              </p>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Velocity Chart */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Revenue Growth Velocity</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Recurring billing cash flow trends over time</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Positive Cashflow
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subscription Distribution Donut */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Subscription States</h3>
                <p className="text-xs text-slate-400 mt-0.5">Active contracts by lifecycle status</p>
              </div>

              <div className="h-48 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                {pieData.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-slate-300 font-medium">{p.name}:</span>
                    <span className="text-xs font-bold text-white">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Subscriptions & Recent Invoices Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Subscriptions Preview */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Active Subscriptions</h3>
                <Link href="/subscriptions" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                  View all →
                </Link>
              </div>

              <div className="space-y-2.5">
                {recentSubs.slice(0, 4).map((sub: any) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{sub.customerName}</p>
                      <p className="text-[11px] text-slate-400">{sub.planName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-200">{formatCurrency(sub.total)}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Invoices Preview */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Recent Invoices</h3>
                <Link href="/invoices" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                  View all →
                </Link>
              </div>

              <div className="space-y-2.5">
                {recentInvoices.slice(0, 4).map((inv: any) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{inv.number}</p>
                      <p className="text-[11px] text-slate-400">{inv.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-200">{formatCurrency(inv.total)}</p>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
    </div>
  );
}
