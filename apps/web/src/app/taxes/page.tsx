'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Percent, Plus, ShieldCheck } from 'lucide-react';

export default function TaxesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: taxes = [] } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => api.getTaxes(),
  });

  const [form, setForm] = useState({
    name: '',
    percentage: '',
    type: 'percentage',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTax({
      name: form.name,
      percentage: parseFloat(form.percentage) || 0,
      type: form.type,
      status: 'active',
    });
    queryClient.invalidateQueries({ queryKey: ['taxes'] });
    setShowModal(false);
    setForm({ name: '', percentage: '', type: 'percentage' });
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
                <Percent className="h-6 w-6 text-indigo-400" />
                Tax Rules & Jurisdictions
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Configure VAT, GST, and State Sales tax rates applied during recurring billing runs.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
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
                className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {t.type}
                    </span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {t.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mt-3">{t.name}</h3>

                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-white">{t.percentage}%</span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Applies automatically to invoices generated across all eligible subscription items.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Compliant
                  </span>
                  <button className="text-blue-400 hover:text-blue-300 font-medium">Edit</button>
                </div>
              </div>
            ))}
          </div>

          {/* Create Tax Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Create Tax Rate</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Tax Label / Jurisdiction</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Federal Goods & Services Tax (GST)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Percentage Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.percentage}
                      onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                      placeholder="18.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
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
                      Save Tax Rate
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
