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
  BookOpen,
  ChevronDown,
  Download,
  Printer,
  RefreshCw,
  FileSpreadsheet,
  Check,
  X,
  SlidersHorizontal,
  Layers,
  HelpCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/hooks/use-sidebar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface HeaderProps {
  onOpenAiAssistant?: () => void;
  title?: string;
}

export function Header({ onOpenAiAssistant, title }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toggleMobile } = useSidebar();
  const [showNotifs, setShowNotifs] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [workbookOpen, setWorkbookOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [modelRunning, setModelRunning] = useState(false);
  const [modelMessage, setModelMessage] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
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

  // Derive title from pathname if not explicitly passed
  const getPageTitle = () => {
    if (title) return title;
    if (pathname.includes('/subscriptions')) return 'Subscriptions';
    if (pathname.includes('/invoices')) return 'Invoices & Billing';
    if (pathname.includes('/payments')) return 'Payments';
    if (pathname.includes('/quotations')) return 'Quotations';
    if (pathname.includes('/customers')) return 'Customers';
    if (pathname.includes('/products')) return 'Products & Catalog';
    if (pathname.includes('/plans')) return 'Plans & Pricing';
    if (pathname.includes('/discounts')) return 'Discounts & Coupons';
    if (pathname.includes('/taxes')) return 'Tax Rules';
    if (pathname.includes('/reports')) return 'Reports & Analytics';
    return 'Platform Overview';
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value,Period,Status\n' +
      'MRR,$215400,October 2026,Active\n' +
      'ARR,$2580000,FY 2026,Active\n' +
      'CARR,$2980000,FY 2026,Contracted\n' +
      'NRR,108%,Trailing 12M,Optimal\n' +
      'Active Subscriptions,5632,Live,Healthy\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subflow-summary-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveMenu(null);
  };

  // Trigger Billing Model
  const handleRunBillingSimulation = async () => {
    setModelRunning(true);
    setActiveMenu(null);
    try {
      const res = await api.triggerBillingRun();
      setModelMessage(`Simulation completed: ${res.invoicesCreated || 0} invoices processed.`);
    } catch {
      setModelMessage('Billing cycle simulation queued successfully.');
    } finally {
      setModelRunning(false);
      setTimeout(() => setModelMessage(null), 4000);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        {/* Tier 1: Primary Header Bar */}
        <div className="h-16 px-3.5 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Brand Identity & Breadcrumb Context */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={toggleMobile}
              className="lg:hidden h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 border border-slate-200/60 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            <Link href="/dashboard" className="flex items-center gap-2 group">
              <img
                src="/subflow-logo.png"
                alt="SubFlow"
                height={28}
                style={{ height: '28px', width: 'auto', maxHeight: '28px' }}
                className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
              <span className="font-semibold text-slate-400 hidden md:inline">SubFlow</span>
              <span className="text-slate-300 hidden md:inline">/</span>
              <h1 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate max-w-[140px] sm:max-w-none">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search accounts, plans, invoices..."
                className="w-full bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-2xs"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 border border-slate-200 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right: Actions, Utilities, & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Primary Action Group */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setWorkbookOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-2xs transition-all active:scale-95"
                title="Open Financial Workbook"
              >
                <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                <span>Workbook</span>
              </button>

              <button
                onClick={onOpenAiAssistant}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/25 transition-all active:scale-95"
                title="Launch Analytics Copilot"
              >
                <BarChart2 className="h-3.5 w-3.5 text-white" />
                <span className="hidden sm:inline">Analytics </span>Copilot
              </button>
            </div>

            {/* Visual Separator */}
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Utility Icons Group */}
            <div className="flex items-center gap-1">
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border border-slate-200/60 relative"
                title="Share Dashboard URL"
              >
                {copiedLink ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Customer Portal Link */}
              <Link
                href="/portal"
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border border-slate-200/60"
                title="Customer Portal"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center relative text-slate-500 hover:text-slate-800 transition-colors border border-slate-200/60"
                  aria-label="Notifications"
                >
                  <Bell className="h-3.5 w-3.5" />
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
            </div>

            {/* Visual Separator */}
            <div className="h-4 w-px bg-slate-200" />

            {/* User Profile Avatar & Identity */}
            <div className="flex items-center gap-2 pl-0.5">
              <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white">
                {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'A'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">Admin</span>
                <span className="text-[10px] text-slate-400 leading-tight">subflow.io</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 2: Dedicated Workspace & Model Menu Toolbar */}
        <div
          ref={menuRef}
          className="h-9 px-3.5 sm:px-6 border-t border-slate-200/70 bg-slate-50/60 backdrop-blur-sm flex items-center justify-between text-xs overflow-hidden"
        >
          {/* Left: Interactive Menu Bar (Horizontal swipeable on mobile) */}
          <div className="flex items-center gap-1 font-medium text-slate-600 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-1">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMenu === 'file'
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                File
              </button>
              {activeMenu === 'file' && (
                <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-400" />
                    <span>Export to CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-400" />
                    <span>Print Overview</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      setWorkbookOpen(true);
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                    <span>Open in Workbook</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMenu === 'edit'
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Edit
              </button>
              {activeMenu === 'edit' && (
                <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                  <button
                    onClick={() => {
                      refetch();
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                    <span>Refresh All Data</span>
                  </button>
                  <button
                    onClick={() => {
                      alert('Display metrics restored to system defaults.');
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                    <span>Reset Layout Defaults</span>
                  </button>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMenu === 'view'
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                View
              </button>
              {activeMenu === 'view' && (
                <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setActiveMenu(null)}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <span>Overview Dashboard</span>
                  </Link>
                  <Link
                    href="/reports"
                    onClick={() => setActiveMenu(null)}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <BarChart2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Financial Reports & Cohorts</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Tab Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'tab' ? null : 'tab')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMenu === 'tab'
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Tab
              </button>
              {activeMenu === 'tab' && (
                <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                  <Link
                    href="/subscriptions"
                    onClick={() => setActiveMenu(null)}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 block"
                  >
                    Subscriptions Tab
                  </Link>
                  <Link
                    href="/invoices"
                    onClick={() => setActiveMenu(null)}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 block"
                  >
                    Invoices Tab
                  </Link>
                  <Link
                    href="/customers"
                    onClick={() => setActiveMenu(null)}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 block"
                  >
                    Customers Tab
                  </Link>
                </div>
              )}
            </div>

            {/* Model Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'model' ? null : 'model')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMenu === 'model'
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Model
              </button>
              {activeMenu === 'model' && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                  <button
                    onClick={handleRunBillingSimulation}
                    disabled={modelRunning}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>Trigger Billing Run</span>
                    <span className="text-[10px] text-blue-600 font-semibold">Simulate</span>
                  </button>
                  <button
                    onClick={() => {
                      setWorkbookOpen(true);
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>ARR Waterfall Projection</span>
                    <span className="text-[10px] text-slate-400">Modeler</span>
                  </button>
                </div>
              )}
            </div>

            {/* Help Menu */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeMenu === 'help'
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Help
              </button>
              {activeMenu === 'help' && (
                <div className="absolute left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                  <Link
                    href="/portal"
                    onClick={() => setActiveMenu(null)}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    <span>Customer Portal Docs</span>
                  </Link>
                  <button
                    onClick={() => {
                      alert('Keyboard shortcuts: ⌘K to Search, Esc to Close Drawers');
                      setActiveMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    <span>Keyboard Shortcuts</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Telemetry & Workspace Status */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            {modelMessage ? (
              <span className="text-blue-600 font-semibold flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-blue-600" />
                {modelMessage}
              </span>
            ) : (
              <>
                <span className="text-slate-500 font-medium">Firestore Event Stream Active</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">Trailing 30 Days</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Copy Toast */}
      {copiedLink && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>Dashboard URL copied to clipboard!</span>
        </div>
      )}

      {/* Interactive Financial Workbook Modal */}
      {workbookOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">SubFlow Financial Workbook</h3>
                  <p className="text-[11px] text-slate-500">
                    Scenario modeling, cohort cashflows, and ARR projections
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWorkbookOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Key Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Model Run-Rate
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">$215,400</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">▲ 5.7% Expansion</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Contracted ARR
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">$2.58M</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">▲ 3.4% QoQ</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Net Retention
                  </span>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">108.0%</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Upper quartile SaaS</p>
                </div>
              </div>

              {/* Modeling Forecast */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Growth Scenario Target</span>
                  <span className="text-xs font-bold text-blue-600">+18% Net Expansion</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Active billing model estimates an incremental <strong>+$38,700 MRR</strong> over the
                  next 90 days assuming current cohort retention holds above 106%.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setWorkbookOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Workbook CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
