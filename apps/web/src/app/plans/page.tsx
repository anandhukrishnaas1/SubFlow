'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Layers, Plus, Check, Edit2, Trash2, ShieldCheck, Clock, RefreshCw, AlertCircle, Calendar } from 'lucide-react';

interface PlanFormData {
  id?: string;
  name: string;
  description: string;
  basePrice: string;
  billingInterval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  minQuantity: string;
  availableFrom: string;
  availableUntil: string;
  autoClose: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  allowCancel: boolean;
  productIds: string[];
}

const initialForm: PlanFormData = {
  name: '',
  description: '',
  basePrice: '',
  billingInterval: 'monthly',
  minQuantity: '1',
  availableFrom: new Date().toISOString().split('T')[0],
  availableUntil: '',
  autoClose: false,
  allowPause: true,
  allowRenewal: true,
  allowCancel: true,
  productIds: [],
};

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.getPlans(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const handleOpenCreate = () => {
    setEditingPlanId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (plan: any) => {
    setEditingPlanId(plan.id);
    setForm({
      id: plan.id,
      name: plan.name || '',
      description: plan.description || '',
      basePrice: String(plan.basePrice ?? ''),
      billingInterval: plan.billingInterval || 'monthly',
      minQuantity: String(plan.minQuantity ?? 1),
      availableFrom: plan.availableFrom ? plan.availableFrom.split('T')[0] : '',
      availableUntil: plan.availableUntil ? plan.availableUntil.split('T')[0] : '',
      autoClose: Boolean(plan.autoClose),
      allowPause: plan.allowPause !== undefined ? Boolean(plan.allowPause) : true,
      allowRenewal: plan.allowRenewal !== undefined ? Boolean(plan.allowRenewal) : true,
      allowCancel: plan.allowCancel !== undefined ? Boolean(plan.allowCancel) : true,
      productIds: plan.productIds || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        basePrice: parseFloat(form.basePrice) || 0,
        billingInterval: form.billingInterval,
        minQuantity: parseInt(form.minQuantity) || 1,
        availableFrom: form.availableFrom ? new Date(form.availableFrom).toISOString() : new Date().toISOString(),
        availableUntil: form.availableUntil ? new Date(form.availableUntil).toISOString() : null,
        autoClose: form.autoClose,
        allowPause: form.allowPause,
        allowRenewal: form.allowRenewal,
        allowCancel: form.allowCancel,
        productIds: form.productIds,
      };

      if (editingPlanId) {
        await api.updatePlan(editingPlanId, payload);
      } else {
        await api.createPlan(payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['plans'] });
      setShowModal(false);
      setForm(initialForm);
      setEditingPlanId(null);
    } catch (err) {
      console.error('Plan save error:', err);
      alert('Failed to save plan. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete plan "${planName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deletePlan(planId);
      await queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (err) {
      console.error('Delete plan error:', err);
      alert('Could not delete plan.');
    }
  };

  const handleToggleStatus = async (plan: any) => {
    const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
    try {
      await api.setPlanStatus(plan.id, nextStatus);
      await queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (err) {
      console.error('Status toggle error:', err);
    }
  };

  const toggleProductSelect = (productId: string) => {
    setForm((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
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
                <Layers className="h-6 w-6 text-orange-600" />
                Subscription Plans & Pricing Tiers
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Design recurring membership tiers, interval schedules, and configurable lifecycle rules.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-600/20 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Plan
            </button>
          </div>

          {/* Pricing Cards Grid */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading subscription plans...</div>
          ) : plans.length === 0 ? (
            <div className="ui-card p-12 text-center space-y-3">
              <Layers className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No subscription plans found</h3>
              <p className="text-xs text-slate-500">Create your first recurring billing tier to begin onboarding customers.</p>
              <button
                onClick={handleOpenCreate}
                className="mt-2 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl"
              >
                Create First Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan: any) => (
                <div
                  key={plan.id}
                  className={`ui-card p-6 flex flex-col justify-between hover:border-orange-400 hover:shadow-md transition-all ${
                    plan.status === 'inactive' ? 'opacity-60 bg-slate-50/50' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                          {plan.billingInterval}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(plan)}
                          title="Click to toggle active status"
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                            plan.status === 'inactive'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {plan.status === 'inactive' ? 'Inactive' : 'Active'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(plan)}
                          title="Edit Plan & Rules"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id, plan.name)}
                          title="Delete Plan"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-lg mt-3">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{plan.description || 'No description'}</p>

                    <div className="my-5">
                      <span className="text-3xl font-extrabold text-slate-900 font-mono">
                        {formatCurrency(plan.basePrice)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium"> / {plan.billingInterval}</span>
                    </div>

                    {/* Rules & Lifecycle Badges */}
                    <div className="space-y-1.5 mb-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifecycle Policies:</p>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                          plan.allowPause !== false ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400 line-through'
                        }`}>
                          <Clock className="h-3 w-3" />
                          Pause / Resume
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                          plan.allowRenewal !== false ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-400 line-through'
                        }`}>
                          <RefreshCw className="h-3 w-3" />
                          Renewals
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                          plan.autoClose ? 'bg-amber-50 text-amber-800 font-semibold' : 'bg-slate-50 text-slate-500'
                        }`}>
                          <ShieldCheck className="h-3 w-3" />
                          {plan.autoClose ? 'Auto-Close on Expiry' : 'Manual Expiry'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-medium ${
                          plan.allowCancel !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400 line-through'
                        }`}>
                          Early Closure Allowed
                        </span>
                      </div>
                    </div>

                    {/* Availability window if present */}
                    {(plan.availableFrom || plan.availableUntil) && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-4">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Available: {plan.availableFrom ? new Date(plan.availableFrom).toLocaleDateString() : 'Now'}
                          {plan.availableUntil ? ` until ${new Date(plan.availableUntil).toLocaleDateString()}` : ' (Indefinite)'}
                        </span>
                      </div>
                    )}

                    {/* Bundled Features / Products */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Included Products:
                      </p>
                      {plan.products && plan.products.length > 0 ? (
                        plan.products.map((prod: any, idx: number) => (
                          <div key={prod.id || idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                            <Check className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                            <span>{prod.name}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No products explicitly bound</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <Check className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                        <span>Automated recurring billing cycle</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Min Qty: {plan.minQuantity || 1}</span>
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      Configure Rules →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create / Edit Plan Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-orange-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      {editingPlanId ? 'Configure Plan & Lifecycle Rules' : 'Create New Subscription Plan'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Plan Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Pro Monthly Tier"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      placeholder="Plan benefits and features..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Base Price ($ / ₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.basePrice}
                        onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                        placeholder="78.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Billing Interval</label>
                      <select
                        value={form.billingInterval}
                        onChange={(e) => setForm({ ...form, billingInterval: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Min Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={form.minQuantity}
                        onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Available From</label>
                      <input
                        type="date"
                        value={form.availableFrom}
                        onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Available Until</label>
                      <input
                        type="date"
                        value={form.availableUntil}
                        onChange={(e) => setForm({ ...form, availableUntil: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Configurable Lifecycle Rules */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                    <p className="font-bold text-slate-800 text-xs">Configurable Lifecycle Rules</p>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.autoClose}
                        onChange={(e) => setForm({ ...form, autoClose: e.target.checked })}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span><strong>Automatic Closure:</strong> Auto-close subscription when plan/term reaches end date</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.allowPause}
                        onChange={(e) => setForm({ ...form, allowPause: e.target.checked })}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span><strong>Allow Pause & Resume:</strong> Customers or staff can temporarily halt billing</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.allowRenewal}
                        onChange={(e) => setForm({ ...form, allowRenewal: e.target.checked })}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span><strong>Subscription Renewal:</strong> Subscriptions can renew for another term</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.allowCancel}
                        onChange={(e) => setForm({ ...form, allowCancel: e.target.checked })}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span><strong>Early Closure:</strong> Allow subscribers to close the subscription before expiry</span>
                    </label>
                  </div>

                  {/* Product Bundling Selection */}
                  {products.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-slate-700 font-bold mb-1">Bundle Included Products</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                        {products.map((prod: any) => {
                          const isChecked = form.productIds.includes(prod.id);
                          return (
                            <label
                              key={prod.id}
                              className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-orange-50 border-orange-300 text-orange-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleProductSelect(prod.id)}
                                className="rounded text-orange-600"
                              />
                              <span className="truncate">{prod.name} ({formatCurrency(prod.salesPrice)})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : editingPlanId ? 'Save Changes' : 'Create Plan'}
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
