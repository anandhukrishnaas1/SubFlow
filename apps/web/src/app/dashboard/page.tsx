'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Share2,
  Users,
  Check,
  BarChart2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { RevenueByPlanCard } from '@/components/dashboard/revenue-by-plan-card';
import { MonthlyGoalCard } from '@/components/dashboard/monthly-goal-card';
import { RecentSalesCard } from '@/components/dashboard/recent-sales-card';
import { UserActivityCard } from '@/components/dashboard/user-activity-card';
import { CreateInvoiceModal } from '@/components/dashboard/create-invoice-modal';
import { AiAssistantDrawer } from '@/components/dashboard/ai-assistant-drawer';

export default function DashboardPage() {
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: kpis = {} } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => api.getKpis(),
    refetchInterval: 5000,
  });

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

        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full pb-24 lg:pb-10">
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

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 shadow-2xs transition-all active:scale-95"
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
                onClick={() => setAiAssistantOpen(true)}
                className="h-9 w-9 rounded-full bg-white hover:bg-stone-50 border border-stone-200/90 flex items-center justify-center text-stone-600 shadow-2xs transition-colors"
                title="Open Copilot"
              >
                <Users className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Top 4 Metric Cards Row matching Template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Revenue */}
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Total Revenue</span>
                <div className="h-8 w-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                <span className="text-3xl font-black text-stone-900 tracking-tight">
                  $3,500
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  +4.8%
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">+$150 this week</p>
            </div>

            {/* Card 2: New Subscriptions */}
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">New Subscriptions</span>
                <div className="h-8 w-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                <span className="text-3xl font-black text-stone-900 tracking-tight">
                  350
                </span>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  -4.6%
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">+12 today</p>
            </div>

            {/* Card 3: Churn Rate */}
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Churn Rate</span>
                <div className="h-8 w-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                <span className="text-3xl font-black text-stone-900 tracking-tight">
                  4.6%
                </span>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  -0.8%
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">On track to reach optimal churn</p>
            </div>

            {/* Card 4: Active Users */}
            <div className="bg-white rounded-3xl p-6 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">Active Users</span>
                <div className="h-8 w-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                <span className="text-3xl font-black text-stone-900 tracking-tight">
                  3,500
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  +4.8%
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-2 font-medium">+120 this week</p>
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
