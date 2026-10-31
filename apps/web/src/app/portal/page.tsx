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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner & Switch Back to Admin */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900/80 to-slate-950/80 border-b border-blue-500/20 px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-blue-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Customer Self-Service Billing Portal</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-semibold">{user?.company || user?.displayName || 'Acme Corporation'}</span>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-medium transition-colors border border-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Admin Console</span>
        </Link>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-6 md:p-10 space-y-8 flex-1">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Billing & Subscriptions</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage your recurring plans, view invoices, and download payment receipts.
              </p>
            </div>
          </div>

          <div className="px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-right">
            <p className="text-[11px] text-slate-400">Account ID</p>
            <p className="font-mono text-xs font-semibold text-blue-400">{user?.uid || 'cust_acme_corp'}</p>
          </div>
        </div>

        {/* Active Subscriptions Section */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Repeat className="h-4 w-4 text-blue-400" />
            Active Subscriptions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.slice(0, 2).map((sub: any) => (
              <div
                key={sub.id}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase">{sub.planName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      {sub.status}
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="text-2xl font-extrabold text-white">{formatCurrency(sub.total)}</span>
                    <span className="text-xs text-slate-400"> / {sub.billingInterval}</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>Next renewal: <strong className="text-slate-200">{formatDate(sub.nextBillingDate)}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                      <span>Contract: {sub.number}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Auto-renewal enabled</span>
                  <button className="text-rose-400 hover:text-rose-300 font-medium">Cancel Plan</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Invoices History Section */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            Billing Statements & Invoices
          </h2>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">{inv.number}</td>
                    <td className="py-3.5 px-4 text-slate-300">{formatDate(inv.issueDate)}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{formatCurrency(inv.total)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => alert(`Downloading PDF invoice for ${inv.number}`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-medium transition-colors"
                      >
                        <Download className="h-3 w-3 text-blue-400" /> Download PDF
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
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            Payment History & Receipts
          </h2>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Receipt Ref</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-300">{p.transactionRef || p.id}</td>
                    <td className="py-3.5 px-4 font-mono text-blue-400">{p.invoiceNumber}</td>
                    <td className="py-3.5 px-4 capitalize text-slate-300">{p.method}</td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(p.paymentDate)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
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
