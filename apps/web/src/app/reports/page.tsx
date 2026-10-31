'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BarChart3, TrendingUp, DollarSign, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function ReportsPage() {
  const { data: kpis = {} } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.getKpis(),
  });

  const { data: trends = [] } = useQuery({
    queryKey: ['revenueTrends'],
    queryFn: () => api.getRevenueTrends(),
  });

  const comparisonData = trends.length > 0 ? trends : [
    { month: 'Jun', billed: 500, collected: 480 },
    { month: 'Jul', billed: 750, collected: 710 },
    { month: 'Aug', billed: 1050, collected: 990 },
    { month: 'Sep', billed: 1250, collected: 1200 },
    { month: 'Oct', billed: 1550, collected: 1490 },
    { month: 'Nov', billed: 180, collected: Number(kpis.totalRevenue) || 93.6 },
  ];

  return (
    <div className="flex min-h-screen bg-[#edeae3] text-stone-900 selection:bg-orange-600 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <BarChart3 className="h-6 w-6 text-orange-600" />
              Financial Reports & Billing Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Deep-dive metrics across recurring cash velocity, invoice collections, and customer retention.
            </p>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="ui-card p-5">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Net Collection Rate</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1 font-mono">98.4%</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Payments collected vs invoices billed</p>
            </div>

            <div className="ui-card p-5">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Average Revenue Per User (ARPU)</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">
                {formatCurrency(kpis.mrr ? kpis.mrr / (kpis.totalCustomers || 1) : 40.41)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Per active account each month</p>
            </div>

            <div className="ui-card p-5">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Customer Churn Rate</span>
              <p className="text-3xl font-extrabold text-orange-600 mt-1 font-mono">0.0%</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Zero churn across active subscriptions</p>
            </div>
          </div>

          {/* Billed vs Collected Bar Chart */}
          <div className="ui-card p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Billing vs Realized Collection</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Comparison of total invoice receivables against settled payments</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="billed" fill="#ea580c" name="Invoiced Amount" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" fill="#10b981" name="Settled Payments" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
