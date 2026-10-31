'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  Repeat,
  FileText,
  CreditCard,
  Download,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  X,
  Loader2,
} from 'lucide-react';

export default function CustomerPortalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

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

  const handleDownloadPdf = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      await api.downloadInvoicePdf(inv.id, inv.number);
    } catch {
      alert(`Could not generate PDF for invoice ${inv.number}. Please ensure backend is running.`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenRazorpay = (inv: any) => {
    setSelectedInvoice(inv);
    setRazorpayModalOpen(true);
  };

  const handleConfirmRazorpayTest = async () => {
    if (!selectedInvoice) return;
    setPaying(true);
    try {
      const payAmount = Number(selectedInvoice.outstandingAmount ?? selectedInvoice.total);
      const res = await api.verifyRazorpayPayment({
        invoiceId: selectedInvoice.id,
        razorpayOrderId: `order_rzp_${Date.now()}`,
        razorpayPaymentId: `pay_rzp_test_${Math.random().toString(36).substring(2, 9)}`,
        amount: payAmount,
        notes: `Customer Portal Razorpay Test settlement for ${selectedInvoice.number}`,
      });

      queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['portal-payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });

      setPaySuccessMsg(`Payment of ${formatCurrency(payAmount)} authorized via Razorpay Test Gateway!`);
      setTimeout(() => {
        setRazorpayModalOpen(false);
        setSelectedInvoice(null);
        setPaySuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edeae3] text-stone-900 selection:bg-orange-600 selection:text-white flex flex-col">
      {/* Top Banner & Switch Back to Admin */}
      <div className="bg-orange-50 border-b border-orange-200/80 px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-orange-900 font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
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
          <div className="flex items-center gap-4">
            <img
              src="/subflow-logo.png"
              alt="SubFlow"
              height={36}
              style={{ height: '36px', width: 'auto', maxHeight: '36px' }}
              className="h-9 w-auto object-contain"
            />
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Billing & Subscriptions</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Manage your recurring plans, view invoices, and download payment receipts.
              </p>
            </div>
          </div>

          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-right shadow-2xs">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Account ID</p>
            <p className="font-mono text-xs font-bold text-orange-600">{user?.uid || 'cust_acme_corp'}</p>
          </div>
        </div>

        {/* Active Subscriptions Section */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Repeat className="h-4 w-4 text-orange-600" />
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
                      <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
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
            <FileText className="h-4 w-4 text-orange-600" />
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
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv: any) => {
                  const isUnpaid = inv.status !== 'paid' && Number(inv.outstandingAmount ?? inv.total) > 0;
                  return (
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
                        <div className="flex items-center justify-end gap-2">
                          {isUnpaid && (
                            <button
                              onClick={() => handleOpenRazorpay(inv)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                            >
                              <Zap className="h-3 w-3 fill-white" /> Pay via Razorpay
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={downloadingId === inv.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors shadow-2xs disabled:opacity-50"
                          >
                            {downloadingId === inv.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin text-orange-600" /> Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-3 w-3 text-orange-600" /> PDF
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                    <td className="py-3.5 px-4 font-mono font-bold text-orange-600">{p.invoiceNumber}</td>
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

        {/* Razorpay Test Mode Checkout Modal */}
        {razorpayModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Zap className="h-4 w-4 fill-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Razorpay Gateway</h3>
                    <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Test Environment Mode</p>
                  </div>
                </div>
                <button
                  onClick={() => setRazorpayModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {paySuccessMsg ? (
                <div className="py-8 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Payment Successful!</h4>
                  <p className="text-xs text-slate-600 font-medium">{paySuccessMsg}</p>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Invoice Reference</span>
                      <span className="font-mono font-bold text-slate-800">{selectedInvoice.number}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Customer</span>
                      <span className="font-semibold text-slate-800">{selectedInvoice.customerName}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Razorpay Key ID</span>
                      <span className="font-mono text-[11px] text-blue-600 font-semibold">rzp_test_SubFlowGateway2026</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-700">Total Payable</span>
                      <span className="text-xl font-black text-slate-900 font-mono">
                        {formatCurrency(Number(selectedInvoice.outstandingAmount ?? selectedInvoice.total))}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-800 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      This transaction is routed through the Razorpay test sandbox. Instant webhook reconciliation will mark the invoice settled and credit your SubFlow account telemetry.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRazorpayModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={paying}
                      onClick={handleConfirmRazorpayTest}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/30 flex items-center justify-center gap-2"
                    >
                      {paying ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Authorizing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3.5 w-3.5 fill-white" /> Authorize Test Pay
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
