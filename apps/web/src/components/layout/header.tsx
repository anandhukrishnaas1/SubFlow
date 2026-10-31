'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  ExternalLink,
  BarChart2,
  Share2,
  ChevronDown,
  Download,
  Printer,
  Check,
  X,
  Layers,
  HelpCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Menu,
  Users,
  Repeat,
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Package,
  FileCheck,
  Tag,
  Percent,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/hooks/use-sidebar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onOpenAiAssistant?: () => void;
  onCreateInvoice?: () => void;
  title?: string;
}

export function Header({ onOpenAiAssistant, onCreateInvoice, title }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toggleMobile } = useSidebar();
  const [showNotifs, setShowNotifs] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 15000,
  });

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.read).length
    : 0;

  return (
    <header className="sticky top-0 z-30 bg-[#edeae3]/85 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 border-b border-[#e5e2da]">
      {/* Left: Brand Mark */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          onClick={toggleMobile}
          className="h-9 w-9 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-stone-700 border border-stone-200/90 shadow-2xs transition-colors"
          title="Open modules & billing workbench"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 group">
          <img
            src="/subflow-logo.png"
            alt="SubFlow"
            height={32}
            style={{ height: '32px', width: 'auto', maxHeight: '32px' }}
            className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>
      </div>

      {/* Center: Floating Pill Navigation matching the Template */}
      <nav className="hidden md:flex items-center bg-white/90 backdrop-blur-sm p-1.5 rounded-full border border-stone-200/90 shadow-2xs">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all',
            pathname === '/dashboard'
              ? 'bg-[#18181b] text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900',
          )}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/customers"
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
            pathname.startsWith('/customers')
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Customers</span>
        </Link>

        <Link
          href="/invoices"
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
            pathname.startsWith('/invoices') || pathname.startsWith('/subscriptions')
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Billing</span>
        </Link>

        <Link
          href="/reports"
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
            pathname.startsWith('/reports')
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Reports</span>
        </Link>

        {/* More Dropdown */}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>More</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {moreOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <Link
                href="/subscriptions"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Repeat className="h-3.5 w-3.5 text-slate-400" /> Subscriptions
              </Link>
              <Link
                href="/plans"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Layers className="h-3.5 w-3.5 text-slate-400" /> Plans & Pricing
              </Link>
              <Link
                href="/products"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Package className="h-3.5 w-3.5 text-slate-400" /> Products
              </Link>
              <Link
                href="/quotations"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <FileCheck className="h-3.5 w-3.5 text-slate-400" /> Quotations
              </Link>
              <Link
                href="/discounts"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Tag className="h-3.5 w-3.5 text-slate-400" /> Discounts
              </Link>
              <Link
                href="/taxes"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Percent className="h-3.5 w-3.5 text-slate-400" /> Taxes
              </Link>
              <div className="my-1 border-t border-slate-100" />
              <Link
                href="/portal"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-xl"
              >
                <ExternalLink className="h-3.5 w-3.5 text-orange-600" /> Customer Portal
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Right: Actions matching Template */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Create Invoice Primary Button */}
        <button
          onClick={onCreateInvoice}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-black shadow-sm transition-all active:scale-95"
          title="Create New Invoice"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Create Invoice</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="h-9 w-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 shadow-2xs relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-600 ring-2 ring-white" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <button
                  onClick={() => {
                    api.markAllNotificationsRead();
                    refetch();
                  }}
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold"
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
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
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

        {/* User Profile Avatar with link to login / switch accounts */}
        <Link
          href="/login"
          className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white overflow-hidden transition-transform hover:scale-105 active:scale-95"
          title={`Signed in as ${user?.displayName || 'User'} (${user?.role || 'admin'}) — Click to switch user`}
        >
          {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'A'}
        </Link>
      </div>
    </header>
  );
}
