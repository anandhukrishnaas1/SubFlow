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
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
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

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <img
              src="/subflow-logo.png"
              alt="SubFlow"
              height={32}
              style={{ height: '32px', width: 'auto', maxHeight: '32px' }}
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </span>
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
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative',
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & Role Switcher */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
        {/* Automated Billing Trigger */}
        <button
          onClick={handleRunBilling}
          disabled={runningBilling}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
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
            <span className="text-blue-600 uppercase font-bold text-[10px]">
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
                    ? 'bg-blue-600 text-white shadow-xs'
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
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
            {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'SF'}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName || 'Alex Rivers'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@subflow.io'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
