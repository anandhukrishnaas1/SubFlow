'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Layers, Plus, Check, Shield, Zap } from 'lucide-react';

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.getPlans(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const [form, setForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    billingInterval: 'monthly',
    minQuantity: '1',
    productIds: [] as string[],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createPlan({
      name: form.name,
      description: form.description,
      basePrice: parseFloat(form.basePrice) || 0,
      billingInterval: form.billingInterval,
      minQuantity: parseInt(form.minQuantity) || 1,
      productIds: form.productIds,
    });
    queryClient.invalidateQueries({ queryKey: ['plans'] });
    setShowModal(false);
    setForm({ name: '', description: '', basePrice: '', billingInterval: 'monthly', minQuantity: '1', productIds: [] });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
                <Layers className="h-6 w-6 text-blue-600" />
                Subscription Plans & Pricing Tiers
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Design recurring membership tiers, cadence schedules, and product bundle definitions.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-all self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Create Plan
            </button>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan: any) => (
              <div
                key={plan.id}
                className="ui-card p-6 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {plan.billingInterval}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg mt-3">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{plan.description}</p>

                  <div className="my-6">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {formatCurrency(plan.basePrice)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium"> / {plan.billingInterval}</span>
                  </div>

                  {/* Bundled Features / Products */}
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Included in this tier:
                    </p>
                    {(plan.products || []).map((prod: any, idx: number) => (
                      <div key={prod.id || idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <Check className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <span>{prod.name}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <Check className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                      <span>Automated recurring billing cycle</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Min Qty: {plan.minQuantity || 1}</span>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700">
                    Configure Rules →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create Plan Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Create Plan</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Plan Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Pro Monthly Tier"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      placeholder="Plan benefits and features..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Base Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.basePrice}
                        onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                        placeholder="78.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Billing Interval</label>
                      <select
                        value={form.billingInterval}
                        onChange={(e) => setForm({ ...form, billingInterval: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>
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
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm shadow-blue-600/20 transition-all"
                    >
                      Save Plan
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
