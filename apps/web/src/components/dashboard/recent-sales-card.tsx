'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Check, Search } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { api } from '@/lib/api';

interface PaymentRecord {
  id: string;
  transactionRef?: string;
  customerName?: string;
  invoiceNumber?: string;
  method?: string;
  amount: number;
  paymentDate?: string;
  createdAt?: string;
  status?: string;
  dataOrigin?: string;
  data_origin?: string;
}

function paymentStatus(status?: string) {
  const normalized = status?.toLowerCase();
  if (['failed', 'cancelled', 'reversed', 'refunded', 'void'].includes(normalized || '')) {
    return 'Failed';
  }
  if (!normalized || ['paid', 'completed', 'succeeded', 'success'].includes(normalized)) {
    return 'Paid';
  }
  return 'Pending';
}

export function RecentSalesCard() {
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const paymentsQuery = useQuery({
    queryKey: ['payments'],
    queryFn: async (): Promise<PaymentRecord[]> => {
      const records = await api.getPayments();
      if (!Array.isArray(records)) {
        throw new Error('The payments API returned an invalid response.');
      }
      return records;
    },
  });
  const filteredPayments = useMemo(() => {
    const records = paymentsQuery.data || [];
    return records
      .filter((payment) => {
        const query = search.toLowerCase();
        return (
          !query ||
          payment.customerName?.toLowerCase().includes(query) ||
          payment.invoiceNumber?.toLowerCase().includes(query) ||
          payment.transactionRef?.toLowerCase().includes(query)
        );
      })
      .slice()
      .sort((a, b) => {
        const dateA = Date.parse(a.paymentDate || a.createdAt || '');
        const dateB = Date.parse(b.paymentDate || b.createdAt || '');
        return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
      })
      .slice(0, 6);
  }, [paymentsQuery.data, search]);

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <h3 className="text-lg font-black text-stone-900 tracking-tight">Recent Payments</h3>
          <p className="text-[11px] text-stone-400 font-medium">Recorded payment transactions</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <input
            type="search"
            placeholder="Search payments"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-stone-50/80 border border-stone-200/90 rounded-full pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-stone-400 w-40"
          />
        </div>
      </div>

      {paymentsQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-stone-500" role="status">Loading payments…</p>
      ) : paymentsQuery.isError ? (
        <div className="py-8 text-center">
          <AlertCircle className="h-5 w-5 mx-auto text-rose-600" />
          <p className="mt-2 text-sm text-rose-700" role="alert">Payments could not be loaded.</p>
          <button type="button" className="mt-2 text-xs font-semibold underline" onClick={() => paymentsQuery.refetch()}>
            Retry
          </button>
        </div>
      ) : filteredPayments.length === 0 ? (
        <p className="py-10 text-center text-xs text-stone-400">
          {paymentsQuery.data?.length ? 'No payments match this search.' : 'No payment records yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-stone-500 border-b border-stone-100">
                <th className="py-3 pr-3">Transaction</th>
                <th className="py-3 pr-3">Customer</th>
                <th className="py-3 pr-3">Method</th>
                <th className="py-3 pr-3">Date</th>
                <th className="py-3 pr-3 text-right">Amount</th>
                <th className="py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayments.map((payment) => {
                const status = paymentStatus(payment.status);
                const paymentDate = payment.paymentDate || payment.createdAt;
                return (
                  <tr key={payment.id} className="text-stone-700">
                    <td className="py-3 pr-3 font-mono">
                      {payment.transactionRef || payment.id}
                      {(payment.dataOrigin === 'SYNTHETIC' || payment.data_origin === 'SYNTHETIC') && (
                        <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-amber-800">
                          Demo
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 font-semibold">{payment.customerName || 'Customer'}</td>
                    <td className="py-3 pr-3 capitalize">{payment.method || '—'}</td>
                    <td className="py-3 pr-3">
                      {paymentDate && !Number.isNaN(Date.parse(paymentDate))
                        ? new Date(paymentDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono font-bold">{formatAmount(payment.amount)}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 ${status === 'Paid' ? 'text-emerald-700' : status === 'Failed' ? 'text-rose-700' : 'text-amber-700'}`}>
                        {status === 'Paid' && <Check className="h-3 w-3" />}
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
