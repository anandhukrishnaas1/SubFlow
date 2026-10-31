'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  Sparkles,
  Repeat,
  FileText,
  CreditCard,
  Download,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function CustomerPortalPage() {
  const { user } = useAuth();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['portal-subscriptions'],
    queryFn: () => api.getSubscriptions(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['portal-invoices'],
    queryFn: () => api.getInvoices(),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['portal-payments'],
    queryFn: () => api.getPayments(),
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Top Banner & Switch Back to Admin */}
      <div className="bg-blue-50 border-b border-blue-200/80 px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-blue-900 font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Customer Self-Service Billing Portal</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-700">{user?.company || user?.displayName || 'Acme Corporation'}</span>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-bold transition-colors border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Console</span>
        </Link>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-6 md:p-10 space-y-8 flex-1">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Billing & Subscriptions</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Manage your recurring plans, view invoices, and download payment receipts.
              </p>
            </div>
          </div>

          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-right shadow-2xs">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Account ID</p>
            <p className="font-mono text-xs font-bold text-blue-600">{user?.uid || 'cust_acme_corp'}</p>
          </div>
        </div>

        {/* Active Subscriptions Section */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Repeat className="h-4 w-4 text-blue-600" />
            Active Subscriptions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.slice(0, 2).map((sub: any) => (
              <div
                key={sub.id}
                className="ui-card p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{sub.planName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {sub.status}
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(sub.total)}</span>
                    <span className="text-xs text-slate-500 font-medium"> / {sub.billingInterval}</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Next renewal: <strong className="text-slate-900">{formatDate(sub.nextBillingDate)}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                      <span>Contract: <strong className="font-mono text-slate-900">{sub.number}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Auto-renewal enabled</span>
                  <button className="text-rose-600 hover:text-rose-700 font-bold">Cancel Plan</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Invoices History Section */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Billing Statements & Invoices
          </h2>

          <div className="ui-card overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.number}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(inv.issueDate)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 font-mono">{formatCurrency(inv.total)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Downloading PDF invoice for ${inv.number}`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                      >
                        <Download className="h-3 w-3 text-blue-600" /> Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payments History Section */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Payment History & Receipts
          </h2>

          <div className="ui-card overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Receipt Ref</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.transactionRef || p.id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{p.invoiceNumber}</td>
                    <td className="py-3.5 px-4 capitalize text-slate-700 font-semibold">{p.method}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(p.paymentDate)}</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 font-mono">
                      +{formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
