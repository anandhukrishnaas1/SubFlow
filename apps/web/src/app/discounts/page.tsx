'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Tag, Plus, CheckCircle, Percent, Copy, Edit2, Trash2, Calendar, ShieldCheck, DollarSign } from 'lucide-react';

interface DiscountFormData {
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  minPurchase: string;
  minQuantity: string;
  startDate: string;
  endDate: string;
  maxUsage: string;
  appliesToEntireSubscription: boolean;
  status: 'active' | 'inactive';
}

const initialForm: DiscountFormData = {
  name: '',
  code: '',
  type: 'percentage',
  value: '',
  minPurchase: '',
  minQuantity: '0',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  maxUsage: '100',
  appliesToEntireSubscription: true,
  status: 'active',
};

export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountFormData>(initialForm);

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => api.getDiscounts(),
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (d: any) => {
    setEditingId(d.id);
    setForm({
      name: d.name || '',
      code: d.code || '',
      type: d.type || 'percentage',
      value: String(d.value ?? ''),
      minPurchase: String(d.minPurchase ?? ''),
      minQuantity: String(d.minQuantity ?? 0),
      startDate: d.startDate ? d.startDate.split('T')[0] : '',
      endDate: d.endDate ? d.endDate.split('T')[0] : '',
      maxUsage: d.maxUsage ? String(d.maxUsage) : '',
      appliesToEntireSubscription: d.appliesToEntireSubscription ?? true,
      status: d.status || 'active',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: parseFloat(form.value) || 0,
      minPurchase: parseFloat(form.minPurchase) || 0,
      minQuantity: parseInt(form.minQuantity) || 0,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      maxUsage: form.maxUsage ? parseInt(form.maxUsage) : null,
      appliesToEntireSubscription: form.appliesToEntireSubscription,
      status: form.status,
    };

    if (editingId) {
      await api.updateDiscount(editingId, payload);
    } else {
      await api.createDiscount(payload);
    }

    queryClient.invalidateQueries({ queryKey: ['discounts'] });
    setShowModal(false);
    setForm(initialForm);
    setEditingId(null);
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete discount code "${code}"?`)) return;
    try {
      await api.deleteDiscount(id);
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    } catch (err: any) {
      alert(err.message || 'Failed to delete discount');
    }
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
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all self-start sm:self-auto cursor-pointer"
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
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      d.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base mt-3">{d.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5 font-bold">
                    {d.type === 'percentage' ? `${d.value}% Off Entire Subscription` : `$${d.value} Flat Deduction`}
                  </p>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-500 font-medium">
                    {d.minPurchase > 0 && <div>Min Spend: ${d.minPurchase}</div>}
                    {d.minQuantity > 0 && <div>Min Quantity: {d.minQuantity} items</div>}
                    {(d.startDate || d.endDate) && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>Valid: {d.startDate ? d.startDate.slice(0, 10) : 'Now'}{d.endDate ? ` to ${d.endDate.slice(0, 10)}` : ' (No expiry)'}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Usage:</span>
                    <span className="font-bold text-slate-800">
                      {d.currentUsage || 0} / {d.maxUsage || '∞'} redeemed
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      title="Edit Discount Rule"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id, d.code)}
                      className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Discount Rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(d.code)}
                    className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create / Edit Discount Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    {editingId ? 'Edit Discount Code' : 'Create Discount Code'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Campaign Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Summer Launch Campaign"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Coupon Code (Uppercase) *</label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER25"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 uppercase font-mono focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Discount Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($ / ₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Value *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        placeholder="20"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Min Spend Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.minPurchase}
                        onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Max Redemptions</label>
                      <input
                        type="number"
                        value={form.maxUsage}
                        onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
                        placeholder="100"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      {editingId ? 'Update Discount' : 'Create Discount'}
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
