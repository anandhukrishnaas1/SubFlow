'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CreditCard, Plus, CheckCircle, ArrowDownLeft } from 'lucide-react';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.getPayments(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.getInvoices(),
  });

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    method: 'card',
    transactionRef: '',
    notes: '',
  });

  // Filter invoices that still have an outstanding balance
  const unpaidInvoices = invoices.filter(
    (inv: any) => Number(inv.outstandingAmount) > 0 || inv.status !== 'paid',
  );

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.recordPayment({
      invoiceId: paymentForm.invoiceId,
      amount: parseFloat(paymentForm.amount),
      method: paymentForm.method,
      transactionRef: paymentForm.transactionRef || `TXN-${Date.now()}`,
      notes: paymentForm.notes,
    });

    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['kpis'] });
    setShowModal(false);
    setPaymentForm({ invoiceId: '', amount: '', method: 'card', transactionRef: '', notes: '' });
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <CreditCard className="h-6 w-6 text-emerald-400" />
                Payments & Collections
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Real-time transaction reconciliation, partial payment receipts, and payment method breakdowns.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Record Payment
            </button>
          </div>

          {/* Payments Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Transaction Ref</th>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No payment records yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((pay: any) => (
                      <tr key={pay.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                          {pay.transactionRef || pay.id}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-blue-400">
                          {pay.invoiceNumber || 'INV-001'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-white">
                          {pay.customerName || 'Customer'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {pay.method}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {formatDate(pay.paymentDate || pay.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                          +{formatCurrency(pay.amount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                            <CheckCircle className="h-3 w-3" /> Reconciled
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Record Payment Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Record Invoice Payment</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleRecord} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Select Invoice</label>
                    <select
                      value={paymentForm.invoiceId}
                      onChange={(e) => {
                        const inv = invoices.find((i: any) => i.id === e.target.value);
                        setPaymentForm({
                          ...paymentForm,
                          invoiceId: e.target.value,
                          amount: inv ? (inv.outstandingAmount || inv.total).toString() : '',
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Select Invoice to Reconcile...</option>
                      {invoices.map((inv: any) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.number} — {inv.customerName} (Bal: ${inv.outstandingAmount ?? inv.total})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                      <select
                        value={paymentForm.method}
                        onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="card">Credit Card</option>
                        <option value="bank_transfer">Bank Transfer / ACH</option>
                        <option value="upi">UPI / Instant Pay</option>
                        <option value="cash">Cash / Direct</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Reference ID</label>
                      <input
                        type="text"
                        value={paymentForm.transactionRef}
                        onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                        placeholder="e.g. ch_3M..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/30"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
