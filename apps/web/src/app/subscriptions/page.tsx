'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  XCircle,
  CheckCircle,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Queries
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions', filterStatus],
    queryFn: () => api.getSubscriptions(filterStatus !== 'all' ? { status: filterStatus } : undefined),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.getPlans(),
  });

  // Create Form State
  const [newSub, setNewSub] = useState({
    customerId: '',
    planId: '',
    status: 'active',
    billingInterval: 'monthly',
    paymentTerms: 'Due on Receipt',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['kpis'] });
  };

  // Mutations
  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.confirmSubscription(id),
    onSuccess: invalidateAll,
    onError: (err: any) => alert(err.message || 'Failed to confirm subscription'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.activateSubscription(id),
    onSuccess: invalidateAll,
    onError: (err: any) => alert(err.message || 'Failed to activate subscription'),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseSubscription(id),
    onSuccess: invalidateAll,
    onError: (err: any) => alert(err.message || 'Failed to pause subscription'),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.resumeSubscription(id),
    onSuccess: invalidateAll,
    onError: (err: any) => alert(err.message || 'Failed to resume subscription'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelSubscription(id, 'Early closure requested'),
    onSuccess: invalidateAll,
    onError: (err: any) => alert(err.message || 'Failed to cancel subscription'),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.closeSubscription(id),
    onSuccess: invalidateAll,
    onError: (err: any) => alert(err.message || 'Failed to close subscription'),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => api.renewSubscription(id),
    onSuccess: invalidateAll,
    onError: (err: any) => alert(err.message || 'Failed to renew subscription'),
  });

  const billingRunMutation = useMutation({
    mutationFn: () => api.triggerBillingRun(),
    onSuccess: invalidateAll,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPlan = plans.find((p: any) => p.id === newSub.planId) || plans[0];
    const selectedCustomer = customers.find((c: any) => c.id === newSub.customerId) || customers[0];

    const customerName = selectedCustomer?.name || selectedCustomer?.displayName || selectedCustomer?.companyName || 'Valued Customer';
    const customerEmail = selectedCustomer?.email || 'customer@subflow.io';

    try {
      await api.createSubscription({
        customerId: selectedCustomer?.id || 'cust_default',
        customerName,
        customerEmail,
        planId: selectedPlan?.id || 'plan_starter_monthly',
        planName: selectedPlan?.name || 'Starter Plan',
        billingInterval: newSub.billingInterval,
        paymentTerms: newSub.paymentTerms,
        status: newSub.status,
        startDate: new Date(newSub.startDate).toISOString(),
        expiryDate: newSub.expiryDate ? new Date(newSub.expiryDate).toISOString() : null,
        subtotal: selectedPlan?.basePrice || 49.0,
        total: selectedPlan?.basePrice || 49.0,
        items: selectedPlan?.products || [
          {
            productName: selectedPlan?.name || 'Service Tier',
            unitPrice: selectedPlan?.basePrice || 49.0,
            quantity: 1,
            total: selectedPlan?.basePrice || 49.0,
          },
        ],
      });

      invalidateAll();
      setShowCreateModal(false);
    } catch (err: any) {
      alert(err.message || 'Error creating subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'paused':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#edeae3] text-stone-900 selection:bg-orange-600 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
                <Repeat className="h-6 w-6 text-orange-600" />
                Subscription Lifecycle Management
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Draft → Quotation → Confirmed → Active → Closed contracts, renewals, and billing dates.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => billingRunMutation.mutate()}
                disabled={billingRunMutation.isPending}
                className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                title="Run automated recurring invoicing cycle now"
              >
                <Repeat className={`h-3.5 w-3.5 ${billingRunMutation.isPending ? 'animate-spin' : ''}`} />
                {billingRunMutation.isPending ? 'Running Billing...' : 'Run Auto-Billing Cycle'}
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                New Subscription
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs w-fit overflow-x-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-2 mr-1 flex-shrink-0" />
            {['all', 'draft', 'confirmed', 'active', 'paused', 'closed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`text-xs px-3 py-1 rounded-lg capitalize font-bold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Subscriptions Table */}
          <div className="ui-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Subscription #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Plan & Cadence</th>
                    <th className="py-3.5 px-4">Next Billing</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">Loading subscriptions...</td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No subscriptions found in this view.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {sub.number || sub.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{sub.customerName}</p>
                          <p className="text-[11px] text-slate-500">{sub.customerEmail}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{sub.planName}</span>
                          <span className="block text-[10px] text-slate-500 capitalize">
                            {sub.billingInterval} billing
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(sub.nextBillingDate)}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 font-mono">
                          {formatCurrency(sub.total)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(
                              sub.status,
                            )}`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {/* Draft actions: Confirm */}
                          {sub.status === 'draft' && (
                            <button
                              onClick={() => confirmMutation.mutate(sub.id)}
                              disabled={confirmMutation.isPending}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title="Confirm subscription terms"
                            >
                              Confirm
                            </button>
                          )}

                          {/* Confirmed actions: Activate */}
                          {sub.status === 'confirmed' && (
                            <button
                              onClick={() => activateMutation.mutate(sub.id)}
                              disabled={activateMutation.isPending}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title="Activate subscription and start billing cycle"
                            >
                              Activate
                            </button>
                          )}

                          {/* Active actions: Pause, Renew, Close, Cancel */}
                          {sub.status === 'active' && (
                            <>
                              <button
                                onClick={() => renewMutation.mutate(sub.id)}
                                disabled={renewMutation.isPending}
                                className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Renew subscription & generate billing invoice"
                              >
                                Renew
                              </button>
                              <button
                                onClick={() => pauseMutation.mutate(sub.id)}
                                disabled={pauseMutation.isPending}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Pause recurring billing"
                              >
                                Pause
                              </button>
                              <button
                                onClick={() => closeMutation.mutate(sub.id)}
                                disabled={closeMutation.isPending}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Close subscription"
                              >
                                Close
                              </button>
                            </>
                          )}

                          {/* Paused actions: Resume, Close, Cancel */}
                          {sub.status === 'paused' && (
                            <>
                              <button
                                onClick={() => resumeMutation.mutate(sub.id)}
                                disabled={resumeMutation.isPending}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Resume subscription billing"
                              >
                                Resume
                              </button>
                              <button
                                onClick={() => closeMutation.mutate(sub.id)}
                                disabled={closeMutation.isPending}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Close subscription"
                              >
                                Close
                              </button>
                            </>
                          )}

                          {/* Cancel action allowed from draft, confirmed, active, paused */}
                          {sub.status !== 'cancelled' && sub.status !== 'closed' && (
                            <button
                              onClick={() => {
                                if (confirm(`Cancel subscription ${sub.number}?`)) {
                                  cancelMutation.mutate(sub.id);
                                }
                              }}
                              disabled={cancelMutation.isPending}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title="Early closure / cancellation"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal to create subscription */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Create New Subscription</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Customer *</label>
                    <select
                      value={newSub.customerId}
                      onChange={(e) => setNewSub({ ...newSub, customerId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      required
                    >
                      <option value="">Select Customer...</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.displayName || c.companyName} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Subscription Plan *</label>
                    <select
                      value={newSub.planId}
                      onChange={(e) => setNewSub({ ...newSub, planId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      required
                    >
                      <option value="">Select Plan...</option>
                      {plans.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(p.basePrice)}/{p.billingInterval}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Initial Status</label>
                      <select
                        value={newSub.status}
                        onChange={(e) => setNewSub({ ...newSub, status: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      >
                        <option value="draft">Draft</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="active">Active</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Billing Interval</label>
                      <select
                        value={newSub.billingInterval}
                        onChange={(e) => setNewSub({ ...newSub, billingInterval: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                      <input
                        type="date"
                        value={newSub.startDate}
                        onChange={(e) => setNewSub({ ...newSub, startDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        value={newSub.expiryDate}
                        onChange={(e) => setNewSub({ ...newSub, expiryDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Payment Terms</label>
                    <select
                      value={newSub.paymentTerms}
                      onChange={(e) => setNewSub({ ...newSub, paymentTerms: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
                    >
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm shadow-orange-600/20 transition-all cursor-pointer"
                    >
                      Create Subscription
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
