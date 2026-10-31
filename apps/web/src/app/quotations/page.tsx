'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { FileCheck, Plus, Send, CheckCircle2, ArrowRightCircle } from 'lucide-react';

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => api.getQuotations(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const [form, setForm] = useState({
    customerId: '',
    productId: '',
    quantity: 1,
    validityDays: 30,
    notes: '',
  });

  const [conversionBanner, setConversionBanner] = useState<string | null>(null);

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.sendQuotation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.acceptQuotation(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      const subNum = res?.convertedToSubscriptionNumber || res?.subscription?.number || res?.number || 'Active Subscription';
      const invNum = res?.convertedInvoiceNumber || res?.invoice?.number || 'Confirmed Invoice';
      setConversionBanner(`Quotation accepted! Auto-created subscription (${subNum}) and confirmed invoice (${invNum}).`);
    },
  });

  const convertMutation = useMutation({
    mutationFn: (quotationId: string) =>
      api.convertQuotation({ quotationId, planId: 'plan_pro_monthly' }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      const subNum = res?.number || 'Active Subscription';
      const invNum = res?.invoice?.number || 'Confirmed Invoice';
      setConversionBanner(`Quotation converted into live subscription (${subNum}) with confirmed invoice (${invNum})!`);
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c: any) => c.id === form.customerId) || customers[0];
    const prod = products.find((p: any) => p.id === form.productId) || products[0];

    const qty = Number(form.quantity) || 1;
    const price = Number(prod?.salesPrice || 49.0);
    const subtotal = qty * price;
    const taxAmount = subtotal * 0.1; // 10%
    const total = subtotal + taxAmount;

    await api.createQuotation({
      customerId: cust?.id || 'cust_acme_corp',
      customerName: cust?.displayName || 'Acme Corporation',
      customerEmail: cust?.email || 'finance@acmecorp.com',
      validityDays: form.validityDays,
      notes: form.notes,
      items: [
        {
          productId: prod?.id,
          productName: prod?.name || 'Service Product',
          quantity: qty,
          unitPrice: price,
          taxAmount,
          total,
        },
      ],
    });

    queryClient.invalidateQueries({ queryKey: ['quotations'] });
    setShowModal(false);
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
                <FileCheck className="h-6 w-6 text-amber-400" />
                Quotations & Estimates
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Draft customized subscription estimates, send to clients, and convert to live subscriptions.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              New Quotation
            </button>
          </div>

          {conversionBanner && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{conversionBanner}</span>
              </div>
              <button
                onClick={() => setConversionBanner(null)}
                className="text-emerald-400 hover:text-white text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Quotations Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Quote #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Line Items</th>
                    <th className="py-3.5 px-4">Valid Until</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {quotations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No quotations created yet.
                      </td>
                    </tr>
                  ) : (
                    quotations.map((q: any) => {
                      const isAcceptedOrConverted =
                        q.status === 'accepted' || q.status === 'converted' || Boolean(q.convertedToSubscriptionId);
                      return (
                        <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-200">{q.number}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-white">{q.customerName}</p>
                            <p className="text-[11px] text-slate-400">{q.customerEmail}</p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {(q.items || []).map((i: any) => i.productName).join(', ') || 'Custom Solution'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{formatDate(q.expiresAt)}</td>
                          <td className="py-3.5 px-4 font-bold text-white">{formatCurrency(q.total)}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                                isAcceptedOrConverted
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : q.status === 'sent'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {q.status === 'draft' && (
                              <button
                                onClick={() => sendMutation.mutate(q.id)}
                                disabled={sendMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-[11px] font-medium transition-colors"
                              >
                                <Send className="h-3 w-3" /> Send
                              </button>
                            )}
                            {!isAcceptedOrConverted && (
                              <button
                                onClick={() => acceptMutation.mutate(q.id)}
                                disabled={acceptMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-medium transition-colors"
                                title="Accept quote & auto-create active subscription + confirmed invoice"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Accept
                              </button>
                            )}
                            {!isAcceptedOrConverted ? (
                              <button
                                onClick={() => convertMutation.mutate(q.id)}
                                disabled={convertMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-[11px] font-medium transition-colors"
                                title="Convert into live recurring subscription and confirmed invoice"
                              >
                                <ArrowRightCircle className="h-3 w-3" /> Convert to Sub
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[11px] font-medium">
                                <CheckCircle2 className="h-3 w-3" /> Converted
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Quotation Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Create Estimate / Quote</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Customer</label>
                    <select
                      value={form.customerId}
                      onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Select Customer...</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Primary Product</label>
                    <select
                      value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Select Product...</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.salesPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Validity (Days)</label>
                      <input
                        type="number"
                        value={form.validityDays}
                        onChange={(e) => setForm({ ...form, validityDays: parseInt(e.target.value) || 30 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Scope Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      placeholder="Special discount terms or onboarding notes..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
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
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30"
                    >
                      Generate Quote
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
