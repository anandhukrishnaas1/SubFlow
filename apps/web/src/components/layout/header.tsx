'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Search, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AiInsightsCopilot } from '@/components/ai/ai-insights-copilot';

export function Header() {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 15000,
  });

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.read).length
    : 0;

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
        {/* Search Input */}
        <div className="flex items-center gap-3 w-96">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              onFocus={() => setShowAiDrawer(true)}
              placeholder='Ask AI or search subscriptions, invoices...'
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Ask AI Insights Button */}
          <button
            type="button"
            onClick={() => setShowAiDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-500/20 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask AI Insights</span>
          </button>

          {/* Customer Portal Link */}
          <Link
            href="/portal"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
            <span>Customer Portal</span>
          </Link>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="h-9 w-9 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-center relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">Notifications</span>
                  <button
                    onClick={async () => {
                      await api.markAllNotificationsRead();
                      refetch();
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No notifications yet</p>
                  ) : (
                    notifications.map((n: any, idx: number) => (
                      <div
                        key={n.id || idx}
                        className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                      >
                        <p className="font-semibold text-slate-200">{n.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Role Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
            <span className="text-xs text-slate-300 capitalize">{user?.role || 'Admin'}</span>
          </div>
        </div>
      </header>

      <AiInsightsCopilot
        mode="drawer"
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
      />
    </>
  );
}
