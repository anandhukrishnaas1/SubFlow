'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  ExternalLink,
  BarChart2,
  Share2,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface HeaderProps {
  onOpenAiAssistant?: () => void;
}

export function Header({ onOpenAiAssistant }: HeaderProps) {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 15000,
  });

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.read).length
    : 0;

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Left: Platform Overview & Sub-menu */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/subflow-logo.png"
            alt="SubFlow"
            className="h-6 w-auto object-contain"
          />
          <div className="h-4 w-px bg-slate-200" />
          <span className="font-bold text-slate-900 text-sm tracking-tight">Platform Overview</span>
        </div>

        {/* Traditional SaaS utility menu matching Image 2 */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-500">
          <button className="hover:text-slate-900 transition-colors">File</button>
          <button className="hover:text-slate-900 transition-colors">Edit</button>
          <button className="hover:text-slate-900 transition-colors">View</button>
          <button className="hover:text-slate-900 transition-colors">Tab</button>
          <button className="hover:text-slate-900 transition-colors">Model</button>
          <button className="hover:text-slate-900 transition-colors">Help</button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Search Input */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts, plans..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
          />
        </div>

        {/* Workbook Button matching Image 2 */}
        <button
          onClick={() => alert('Workbook: SubFlow financial export and scenario builder.')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5 text-slate-500" />
          <span>Workbook</span>
        </button>

        {/* Analytics Assistant Trigger Button */}
        <button
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/25 transition-all active:scale-95"
        >
          <BarChart2 className="h-3.5 w-3.5 text-white" />
          <span>Analytics Copilot</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert('Dashboard link copied to clipboard!');
            }
          }}
          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors border border-slate-200/60"
          title="Share Dashboard"
        >
          <Share2 className="h-4 w-4" />
        </button>

        {/* Help Circle */}
        <Link
          href="/portal"
          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors border border-slate-200/60"
          title="Customer Portal"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center relative text-slate-500 transition-colors border border-slate-200/60"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-blue-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <button
                  onClick={() => {
                    api.markAllNotificationsRead();
                    refetch();
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Mark all read
                </button>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
                ) : (
                  notifications.map((n: any, idx: number) => (
                    <div
                      key={n.id || idx}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <p className="font-bold text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar matching Image 2 */}
        <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
          {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'A'}
        </div>
      </div>
    </header>
  );
}
