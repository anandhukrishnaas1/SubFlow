'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Percent, Plus, ShieldCheck, Edit2, Trash2 } from 'lucide-react';

export default function TaxesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);

  const { data: taxes = [] } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => api.getTaxes(),
  });

  const [form, setForm] = useState({
    name: '',
    percentage: '',
    type: 'percentage',
    status: 'active',
  });

  const handleOpenCreate = () => {
    setEditingTaxId(null);
    setForm({ name: '', percentage: '', type: 'percentage', status: 'active' });
    setShowModal(true);
  };

  const handleOpenEdit = (tax: any) => {
    setEditingTaxId(tax.id);
    setForm({
      name: tax.name,
      percentage: String(tax.percentage),
      type: tax.type || 'percentage',
      status: tax.status || 'active',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      percentage: parseFloat(form.percentage) || 0,
      type: form.type,
      status: form.status,
    };

    if (editingTaxId) {
      await api.updateTax(editingTaxId, payload);
    } else {
      await api.createTax(payload);
    }

    queryClient.invalidateQueries({ queryKey: ['taxes'] });
    setShowModal(false);
    setForm({ name: '', percentage: '', type: 'percentage', status: 'active' });
    setEditingTaxId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tax rule "${name}"?`)) return;
    try {
      await api.deleteTax(id);
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    } catch (err: any) {
      alert(err.message || 'Failed to delete tax rule');
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
                <Percent className="h-6 w-6 text-orange-600" />
                Tax Rules & Jurisdictions
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Configure VAT, GST, and State Sales tax rates applied during recurring billing runs.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-600/20 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Tax Rule
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {taxes.map((t: any) => (
              <div
                key={t.id}
                className="ui-card p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      {t.type}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base mt-3">{t.name}</h3>

                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">{t.percentage}%</span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Applies automatically to invoices generated across all eligible subscription items.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Compliant
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      title="Edit Tax Rule"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Tax Rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create / Edit Tax Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTaxId ? 'Edit Tax Rate' : 'Create Tax Rate'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Tax Label / Jurisdiction *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Federal Goods & Services Tax (GST)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Percentage Rate (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.percentage}
                      onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                      placeholder="18.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
                    >
                      {editingTaxId ? 'Update Rate' : 'Save Tax Rate'}
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
