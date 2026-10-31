'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Repeat,
  FileText,
  CreditCard,
  FileCheck,
  Users,
  Package,
  Layers,
  Tag,
  Percent,
  BarChart3,
  Zap,
  ShieldCheck,
  X,
  Menu,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/quotations', label: 'Quotations', icon: FileCheck },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/plans', label: 'Plans', icon: Layers },
  { href: '/discounts', label: 'Discounts', icon: Tag },
  { href: '/taxes', label: 'Taxes', icon: Percent },
  { href: '/reports', label: 'Reports & KPIs', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, switchRole } = useAuth();
  const { mobileOpen, closeMobile, toggleMobile } = useSidebar();
  const [runningBilling, setRunningBilling] = React.useState(false);
  const [billingResult, setBillingResult] = React.useState<string | null>(null);

  const handleRunBilling = async () => {
    setRunningBilling(true);
    try {
      const res = await api.triggerBillingRun();
      setBillingResult(`Created: ${res.invoicesCreated || 0} invoices`);
      setTimeout(() => setBillingResult(null), 4000);
    } catch {
      setBillingResult('Billing run queued');
      setTimeout(() => setBillingResult(null), 3000);
    } finally {
      setRunningBilling(false);
    }
  };

  // Shared Navigation content for desktop and mobile drawer
  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <Link
            href="/dashboard"
            onClick={isMobile ? closeMobile : undefined}
            className="flex items-center gap-2 group"
          >
            <img
              src="/subflow-logo.png"
              alt="SubFlow"
              height={32}
              style={{ height: '32px', width: 'auto', maxHeight: '32px' }}
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {isMobile && (
            <button
              onClick={closeMobile}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? closeMobile : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative',
                  isActive
                    ? 'bg-orange-50 text-orange-600 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600',
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-orange-600 shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & Role Switcher */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50 shrink-0">
        {/* Automated Billing Trigger */}
        <button
          onClick={handleRunBilling}
          disabled={runningBilling}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <Zap className={cn('h-3.5 w-3.5', runningBilling && 'animate-spin')} />
          {runningBilling ? 'Processing Run...' : 'Run Billing Engine'}
        </button>

        {billingResult && (
          <div className="text-[11px] text-emerald-700 text-center font-bold bg-emerald-50 py-1 rounded-lg border border-emerald-200">
            {billingResult}
          </div>
        )}

        {/* Role Switcher Pill */}
        <div className="pt-2 border-t border-slate-200/60">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-slate-400" /> Active Role:
            </span>
            <span className="text-orange-600 uppercase font-bold text-[10px]">
              {user?.role || 'admin'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            {(['admin', 'staff', 'customer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={cn(
                  'text-[10px] font-bold capitalize py-1 rounded-lg transition-all',
                  user?.role === r
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="flex items-center gap-2.5 pt-1">
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-1 ring-slate-800">
            {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'SF'}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName || 'Alex Rivers'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@subflow.io'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Universal Slide-out Navigation Drawer & Backdrop (Active when toggled from Header or Bottom Bar) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            onClick={closeMobile}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Off-canvas Sheet */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </aside>
        </div>
      )}

      {/* 3. Mobile Bottom Navigation Bar (Active on screens < 768px for fast mobile thumb reach) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around md:hidden shadow-lg">
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors',
            pathname === '/dashboard' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900',
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/subscriptions"
          className={cn(
            'flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors',
            pathname.startsWith('/subscriptions') ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900',
          )}
        >
          <Repeat className="h-4 w-4" />
          <span>Subs</span>
        </Link>

        <Link
          href="/invoices"
          className={cn(
            'flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors',
            pathname.startsWith('/invoices') ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900',
          )}
        >
          <FileText className="h-4 w-4" />
          <span>Invoices</span>
        </Link>

        <Link
          href="/reports"
          className={cn(
            'flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors',
            pathname.startsWith('/reports') ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-900',
          )}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Reports</span>
        </Link>

        <button
          onClick={toggleMobile}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-900"
        >
          <Menu className="h-4 w-4" />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
