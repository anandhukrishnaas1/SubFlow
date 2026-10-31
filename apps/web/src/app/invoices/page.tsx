'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  FileText,
  Download,
  Send,
  Plus,
  CreditCard,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', filterStatus],
    queryFn: () => api.getInvoices(filterStatus !== 'all' ? { status: filterStatus } : undefined),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.confirmInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    },
  });

  const handleDownloadPdf = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      await api.downloadInvoicePdf(inv.id, inv.number);
    } catch {
      alert(`Could not download invoice ${inv.number} PDF. Please verify backend service.`);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'confirmed':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
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
                <FileText className="h-6 w-6 text-orange-600" />
                Invoices & Billing Accounts
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track generated invoices, tax amounts, balances, and downloadable PDF receipts.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs w-fit">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-2 mr-1" />
            {['all', 'confirmed', 'paid', 'draft', 'overdue'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`text-xs px-3 py-1 rounded-lg capitalize font-bold transition-all ${
                  filterStatus === st
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Invoices Table */}
          <div className="ui-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Issue Date</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Outstanding</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {inv.number}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{inv.customerName}</p>
                          <p className="text-[11px] text-slate-500">{inv.customerEmail}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(inv.issueDate)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 font-mono">
                          {formatCurrency(inv.total)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold font-mono ${
                              Number(inv.outstandingAmount) > 0 ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          >
                            {formatCurrency(inv.outstandingAmount || 0)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getStatusBadge(
                              inv.status,
                            )}`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={downloadingId === inv.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-medium transition-colors"
                          >
                            <Download className="h-3 w-3 text-orange-400" />
                            {downloadingId === inv.id ? 'Generating...' : 'PDF'}
                          </button>

                          {inv.status === 'draft' && (
                            <button
                              onClick={() => confirmMutation.mutate(inv.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-600/20 hover:bg-orange-600/30 text-orange-600 border border-orange-500/30 rounded text-[11px] font-medium transition-colors"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Confirm
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
        </main>
      </div>
    </div>
  );
}
