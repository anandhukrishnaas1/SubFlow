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
  Search,
  Filter,
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
    billingInterval: 'monthly',
    paymentTerms: 'Due on Receipt',
  });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Mutations
  const activateMutation = useMutation({
    mutationFn: (id: string) => api.activateSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    },
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => api.renewSubscription(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      const invNum = res?.invoice?.number || 'Confirmed Invoice';
      setStatusMessage(`Subscription renewed for next billing cycle! Generated confirmed invoice ${invNum}.`);
    },
  });

  const billingRunMutation = useMutation({
    mutationFn: () => api.triggerBillingRun(),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      setStatusMessage(
        `Automated billing & renewal cycle completed: ${res?.processed ?? 0} due subscription(s) processed, ${res?.invoicesCreated ?? 0} confirmed invoice(s) generated.`,
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelSubscription(id, 'Customer requested cancellation'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPlan = plans.find((p: any) => p.id === newSub.planId) || plans[0];
    const selectedCustomer = customers.find((c: any) => c.id === newSub.customerId) || customers[0];

    await api.createSubscription({
      customerId: selectedCustomer?.id || 'cust_acme_corp',
      customerName: selectedCustomer?.displayName || 'Acme Corporation',
      customerEmail: selectedCustomer?.email || 'finance@acmecorp.com',
      planId: selectedPlan?.id || 'plan_starter_monthly',
      planName: selectedPlan?.name || 'Starter Plan',
      billingInterval: newSub.billingInterval,
      paymentTerms: newSub.paymentTerms,
      subtotal: selectedPlan?.basePrice || 49.0,
      total: selectedPlan?.basePrice || 49.0,
      items: selectedPlan?.products || [{ productName: selectedPlan?.name || 'Service', unitPrice: selectedPlan?.basePrice || 49.0, quantity: 1, total: selectedPlan?.basePrice || 49.0 }],
    });

    queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['kpis'] });
    setShowCreateModal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'paused':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
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
                <Repeat className="h-6 w-6 text-blue-500" />
                Subscription Lifecycle Management
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitor recurring contracts, billing cycles, renewals, and customer status.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                onClick={() => billingRunMutation.mutate()}
                disabled={billingRunMutation.isPending}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all"
                title="Run automated billing & renewal cycle for due subscriptions"
              >
                <Repeat className="h-3.5 w-3.5 text-emerald-400" />
                {billingRunMutation.isPending ? 'Running Billing...' : 'Run Auto-Billing'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                New Subscription
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-emerald-400 hover:text-white text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 w-fit">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-2 mr-1" />
            {['all', 'active', 'paused', 'confirmed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`text-xs px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Subscription</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Plan & Interval</th>
                    <th className="py-3.5 px-4">Next Billing</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No subscriptions found in this view.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                          {sub.number || sub.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">{sub.customerName}</p>
                          <p className="text-[11px] text-slate-400">{sub.customerEmail}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-200">{sub.planName}</span>
                          <span className="block text-[10px] text-slate-500 capitalize">
                            {sub.billingInterval} billing
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {formatDate(sub.nextBillingDate)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {formatCurrency(sub.total ?? sub.recurringTotal)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getStatusBadge(
                              sub.status,
                            )}`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {sub.status !== 'active' && (
                            <button
                              onClick={() => activateMutation.mutate(sub.id)}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-medium transition-colors"
                              title="Activate subscription"
                            >
                              Activate
                            </button>
                          )}
                          {sub.status !== 'cancelled' && (
                            <button
                              onClick={() => renewMutation.mutate(sub.id)}
                              disabled={renewMutation.isPending}
                              className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-[11px] font-medium transition-colors"
                              title="Renew subscription & generate confirmed invoice for next cycle"
                            >
                              Renew
                            </button>
                          )}
                          {sub.status === 'active' && (
                            <button
                              onClick={() => pauseMutation.mutate(sub.id)}
                              className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded text-[11px] font-medium transition-colors"
                              title="Pause recurring billing"
                            >
                              Pause
                            </button>
                          )}
                          {sub.status !== 'cancelled' && (
                            <button
                              onClick={() => cancelMutation.mutate(sub.id)}
                              className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded text-[11px] font-medium transition-colors"
                              title="Cancel subscription"
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
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Create New Subscription</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Customer</label>
                    <select
                      value={newSub.customerId}
                      onChange={(e) => setNewSub({ ...newSub, customerId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Select Customer...</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.displayName} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Plan</label>
                    <select
                      value={newSub.planId}
                      onChange={(e) => setNewSub({ ...newSub, planId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Select Plan...</option>
                      {plans.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.basePrice}/{p.billingInterval}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Billing Interval</label>
                      <select
                        value={newSub.billingInterval}
                        onChange={(e) => setNewSub({ ...newSub, billingInterval: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Payment Terms</label>
                      <select
                        value={newSub.paymentTerms}
                        onChange={(e) => setNewSub({ ...newSub, paymentTerms: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30"
                    >
                      Create & Activate
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
