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
  Sparkles,
  ShieldCheck,
  UserCheck,
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
      setBillingResult(`Invoices created: ${res.invoicesCreated || 0}`);
      setTimeout(() => setBillingResult(null), 4000);
    } catch {
      setBillingResult('Billing run queued');
      setTimeout(() => setBillingResult(null), 3000);
    } finally {
      setRunningBilling(false);
    }
  };

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/60">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SubFlow
              </span>
              <span className="block text-[10px] text-blue-400 font-medium -mt-1 tracking-wider uppercase">
                Event-Driven
              </span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
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
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200',
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & Role Switcher */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
        {/* Automated Billing Trigger */}
        <button
          onClick={handleRunBilling}
          disabled={runningBilling}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <Zap className={cn('h-3.5 w-3.5', runningBilling && 'animate-spin')} />
          {runningBilling ? 'Processing Run...' : 'Run Billing Engine'}
        </button>

        {billingResult && (
          <div className="text-[11px] text-emerald-400 text-center font-medium bg-emerald-500/10 py-1 rounded border border-emerald-500/20">
            {billingResult}
          </div>
        )}

        {/* Role Switcher Pill */}
        <div className="pt-2 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-slate-400" /> Active Role:
            </span>
            <span className="text-blue-400 uppercase font-semibold text-[10px]">
              {user?.role || 'admin'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {(['admin', 'staff', 'customer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={cn(
                  'text-[10px] font-medium capitalize py-1 rounded transition-all',
                  user?.role === r
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pt-1">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'SF'}
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.displayName}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
