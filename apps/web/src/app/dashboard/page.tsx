'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Share2,
  Users,
  Check,
  TrendingUp,
  UserCheck,
  CreditCard,
  Layers,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { RevenueByPlanCard } from '@/components/dashboard/revenue-by-plan-card';
import { MonthlyGoalCard } from '@/components/dashboard/monthly-goal-card';
import { RecentSalesCard } from '@/components/dashboard/recent-sales-card';
import { UserActivityCard } from '@/components/dashboard/user-activity-card';
import { SubscriptionPipelineDiagram } from '@/components/dashboard/subscription-pipeline-diagram';
import { CashFlowDiagram } from '@/components/dashboard/cash-flow-diagram';
import { CurrencySwitcher } from '@/components/dashboard/currency-switcher';
import { CreateInvoiceModal } from '@/components/dashboard/create-invoice-modal';
import { AiAssistantDrawer } from '@/components/dashboard/ai-assistant-drawer';
import { useCurrency } from '@/hooks/use-currency';

export default function DashboardPage() {
  const { formatAmount } = useCurrency();
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: kpis = {} } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.getKpis(),
    refetchInterval: 5000,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.getSubscriptions(),
    refetchInterval: 5000,
  });

  const totalSubs = (subscriptions as any[]).length;
  const activeSubs = (subscriptions as any[]).filter((s: any) => s.status === 'active').length;
  const cancelledSubs = (subscriptions as any[]).filter((s: any) => s.status === 'cancelled').length;
  const churnRate = totalSubs > 0 ? ((cancelledSubs / totalSubs) * 100).toFixed(1) + '%' : '0.0%';

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#edeae3] text-stone-900 font-sans antialiased relative selection:bg-orange-600 selection:text-white">
      {/* Subtle warm sunset ambient glow at top */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-orange-200/25 via-amber-100/10 to-transparent pointer-events-none -z-0" />

      {/* Sidebar (renders permanent desktop sidebar & mobile drawer) */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header matching Template */}
        <Header
          onCreateInvoice={() => setCreateInvoiceOpen(true)}
          onOpenAiAssistant={() => setAiAssistantOpen(true)}
        />

        <main className="p-4 sm:p-8 space-y-7 max-w-7xl mx-auto w-full pb-24 lg:pb-10">
          {/* Dashboard Title & Quick Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
                Track revenue, subscriptions, and user growth in real time.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              {/* Currency Swapper Pill ($ USD / ₹ INR) */}
              <CurrencySwitcher />

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 shadow-2xs transition-all active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 text-stone-500" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAiAssistantOpen(true)}
                className="h-9 w-9 rounded-full bg-white hover:bg-stone-50 border border-stone-200/90 flex items-center justify-center text-stone-600 shadow-2xs transition-colors"
                title="Open Copilot Assistant"
              >
                <Users className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Top 4 Metric Cards Row with REAL Business Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Revenue */}
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">Total Revenue</span>
                <div className="h-9 w-9 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 shadow-2xs">
                  <ShoppingCart className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-3xl font-black text-stone-900 tracking-tight font-mono">
                    {formatAmount(Number(kpis?.totalRevenue) || 0)}
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-2 font-medium">
                  {kpis?.mrr ? `${formatAmount(Number(kpis.mrr))} MRR run-rate` : 'From confirmed payments'}
                </p>
              </div>
            </div>

            {/* Card 2: Active Subscriptions */}
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">Active Subscriptions</span>
                <div className="h-9 w-9 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 shadow-2xs">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-3xl font-black text-stone-900 tracking-tight font-mono">
                    {activeSubs}
                  </span>
                  <span className="text-[11px] font-extrabold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                    {totalSubs} Total
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-2 font-medium">
                  {kpis?.upcomingRenewals ? `${kpis.upcomingRenewals} renewals in 7d` : 'Next cycle on schedule'}
                </p>
              </div>
            </div>

            {/* Card 3: Churn Rate */}
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">Churn Rate</span>
                <div className="h-9 w-9 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 shadow-2xs">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-3xl font-black text-stone-900 tracking-tight font-mono">
                    {churnRate}
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Healthy
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-2 font-medium">
                  {cancelledSubs > 0 ? `${cancelledSubs} churned accounts` : 'Zero churn recorded'}
                </p>
              </div>
            </div>

            {/* Card 4: Total Customers */}
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500">Active Customers</span>
                <div className="h-9 w-9 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-700 shadow-2xs">
                  <UserCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-3xl font-black text-stone-900 tracking-tight font-mono">
                    {(Number(kpis?.totalCustomers) || 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-2 font-medium">
                  Direct database customers
                </p>
              </div>
            </div>
          </div>

          {/* Middle Row: Revenue by Plan & Monthly Revenue Goal (2 Cols + 1 Col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueByPlanCard />
            </div>
            <div className="lg:col-span-1">
              <MonthlyGoalCard />
            </div>
          </div>

          {/* Bottom Row: Recent Sales & User Activity (2 Cols + 1 Col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentSalesCard />
            </div>
            <div className="lg:col-span-1">
              <UserActivityCard />
            </div>
          </div>

          {/* Interactive Subscription Lifecycle Pipeline Diagram */}
          <SubscriptionPipelineDiagram />

          {/* Cash Flow & Net MRR Movement Matrix Diagram */}
          <CashFlowDiagram />
        </main>
      </div>

      {/* Interactive Modals */}
      <CreateInvoiceModal
        isOpen={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
      />

      <AiAssistantDrawer
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        kpis={kpis}
      />
    </div>
  );
}
