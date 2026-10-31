'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Package, Plus, Layers, Tag, CheckCircle } from 'lucide-react';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'service',
    salesPrice: '',
    costPrice: '',
    notes: '',
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createProduct({
      name: form.name,
      type: form.type,
      salesPrice: parseFloat(form.salesPrice) || 0,
      costPrice: parseFloat(form.costPrice) || 0,
      notes: form.notes,
      variants: [],
    });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setShowModal(false);
    setForm({ name: '', type: 'service', salesPrice: '', costPrice: '', notes: '' });
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
                <Package className="h-6 w-6 text-blue-400" />
                Product Catalog & Variants
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Configure billable SaaS products, digital assets, add-ons, and pricing tiers.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p: any) => {
              const margin = p.salesPrice > 0 ? Math.round(((p.salesPrice - p.costPrice) / p.salesPrice) * 100) : 100;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {p.type}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {margin}% margin
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base mt-2">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.notes || 'Core recurring product item.'}</p>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-white">
                        {formatCurrency(p.salesPrice)}
                      </span>
                      {p.costPrice > 0 && (
                        <span className="text-xs text-slate-500">
                          (Cost: {formatCurrency(p.costPrice)})
                        </span>
                      )}
                    </div>

                    {/* Variants Tag List */}
                    {p.variants && p.variants.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800/60">
                        <p className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Available Variants:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.variants.map((v: any, idx: number) => (
                            <span
                              key={v.id || idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700"
                            >
                              {v.name} {v.additionalPrice > 0 && `(+${formatCurrency(v.additionalPrice)})`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Active in catalog
                    </span>
                    <button className="text-blue-400 hover:text-blue-300 font-medium">Edit</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create Product Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Create Product</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Product Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. SubFlow Cloud Storage"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Product Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="service">Service (SaaS)</option>
                        <option value="digital">Digital Product</option>
                        <option value="physical">Physical Asset</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Sales Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.salesPrice}
                        onChange={(e) => setForm({ ...form, salesPrice: e.target.value })}
                        placeholder="49.00"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.costPrice}
                      onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                      placeholder="12.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Description / Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      placeholder="Details about product deliverables..."
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
                      Save Product
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
