'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Tag, Plus, CheckCircle, Percent, Copy } from 'lucide-react';

export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => api.getDiscounts(),
  });

  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: '',
    maxUsage: '100',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createDiscount({
      name: form.name,
      code: form.code,
      type: form.type,
      value: parseFloat(form.value) || 0,
      maxUsage: parseInt(form.maxUsage) || 100,
      status: 'active',
    });
    queryClient.invalidateQueries({ queryKey: ['discounts'] });
    setShowModal(false);
    setForm({ name: '', code: '', type: 'percentage', value: '', maxUsage: '100' });
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
                <Tag className="h-6 w-6 text-emerald-600" />
                Discounts & Promotional Codes
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Create coupon codes, percentage deductions, fixed cart credits, and usage thresholds.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              New Discount Code
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {discounts.map((d: any) => (
              <div
                key={d.id}
                className="ui-card p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                      {d.code}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {d.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base mt-3">{d.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {d.type === 'percentage' ? `${d.value}% Off Entire Subscription` : `$${d.value} Flat Deduction`}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Usage:</span>
                    <span className="font-bold text-slate-800">
                      {d.currentUsage || 0} / {d.maxUsage || '∞'} redeemed
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Ready for checkout
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(d.code)}
                    className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create Discount Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Create Discount Code</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Campaign Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Summer Launch"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Coupon Code (Uppercase)</label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER25"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 uppercase font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Discount Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Value</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        placeholder="20"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Max Redemptions</label>
                    <input
                      type="number"
                      value={form.maxUsage}
                      onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
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
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-600/20 transition-all"
                    >
                      Create Code
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
