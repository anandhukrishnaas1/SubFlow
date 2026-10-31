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

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.sendQuotation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.acceptQuotation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
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
    <div className="flex min-h-screen bg-[#edeae3] text-stone-900 selection:bg-orange-600 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
                <FileCheck className="h-6 w-6 text-amber-500" />
                Quotations & Estimates
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Draft customized subscription estimates, send to clients, and convert to live subscriptions.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-600/20 transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              New Quotation
            </button>
          </div>

          {/* Quotations Table */}
          <div className="ui-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Quote #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Line Items</th>
                    <th className="py-3.5 px-4">Valid Until</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No quotations created yet.
                      </td>
                    </tr>
                  ) : (
                    quotations.map((q: any) => (
                      <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{q.number}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{q.customerName}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{q.customerEmail}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {(q.items || []).map((i: any) => i.productName).join(', ') || 'Custom Solution'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">{formatDate(q.expiresAt)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 font-mono">{formatCurrency(q.total)}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              q.status === 'accepted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : q.status === 'sent'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {q.status === 'draft' && (
                            <button
                              onClick={() => sendMutation.mutate(q.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              <Send className="h-3 w-3" /> Send
                            </button>
                          )}
                          {q.status !== 'accepted' && (
                            <button
                              onClick={() => acceptMutation.mutate(q.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Accept
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              await api.createSubscription({
                                customerId: q.customerId,
                                customerName: q.customerName,
                                customerEmail: q.customerEmail,
                                planName: 'Converted from Quotation',
                                billingInterval: 'monthly',
                                quotationId: q.id,
                                total: q.total,
                                items: q.items,
                              });
                              alert(`Quotation ${q.number} converted into live active subscription!`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold transition-colors"
                            title="Convert into live recurring subscription"
                          >
                            <ArrowRightCircle className="h-3 w-3" /> Convert to Sub
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Quotation Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Create Estimate / Quote</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Customer</label>
                    <select
                      value={form.customerId}
                      onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
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
                    <label className="block text-slate-700 font-medium mb-1">Primary Product</label>
                    <select
                      value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
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
                      <label className="block text-slate-700 font-medium mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Validity (Days)</label>
                      <input
                        type="number"
                        value={form.validityDays}
                        onChange={(e) => setForm({ ...form, validityDays: parseInt(e.target.value) || 30 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Scope Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      placeholder="Special discount terms or onboarding notes..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm shadow-orange-600/20 transition-all"
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
