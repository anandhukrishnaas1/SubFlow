'use client';

import React, { useState } from 'react';
import { Search, Filter, ChevronDown, CreditCard } from 'lucide-react';

interface SaleItem {
  no: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  plan: string;
  customer: string;
  method: string;
  amount: number;
  date: string;
}

const SAMPLE_SALES: SaleItem[] = [
  {
    no: '01',
    status: 'Paid',
    plan: 'Pro',
    customer: 'John Doe',
    method: 'Master Card',
    amount: 120,
    date: '12 Oct 2026',
  },
  {
    no: '02',
    status: 'Pending',
    plan: 'Starter',
    customer: 'Visa Software',
    method: 'Master Card',
    amount: 120,
    date: '12 Oct 2026',
  },
  {
    no: '03',
    status: 'Paid',
    plan: 'Enterprise',
    customer: 'Acme Corporation',
    method: 'Visa Direct',
    amount: 490,
    date: '14 Oct 2026',
  },
  {
    no: '04',
    status: 'Paid',
    plan: 'Pro',
    customer: 'Sarah Connor',
    method: 'Master Card',
    amount: 120,
    date: '15 Oct 2026',
  },
];

export function RecentSalesCard() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sales] = useState<SaleItem[]>(SAMPLE_SALES);

  const getStatusBadge = (status: SaleItem['status']) => {
    switch (status) {
      case 'Paid':
        return (
          <div className="relative inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-emerald-400/60 bg-emerald-50/70 text-emerald-700 text-xs font-bold">
            <span className="absolute -top-0.5 inset-x-2 h-0.5 bg-emerald-500 rounded-full" />
            <span>Paid</span>
          </div>
        );
      case 'Pending':
        return (
          <div className="relative inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-amber-400/60 bg-amber-50/70 text-amber-700 text-xs font-bold">
            <span className="absolute -top-0.5 inset-x-2 h-0.5 bg-amber-500 rounded-full" />
            <span>Pending</span>
          </div>
        );
      case 'Overdue':
        return (
          <div className="relative inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-rose-400/60 bg-rose-50/70 text-rose-700 text-xs font-bold">
            <span className="absolute -top-0.5 inset-x-2 h-0.5 bg-rose-500 rounded-full" />
            <span>Overdue</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)]">
      {/* Table Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Recent Sales</h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 w-32 sm:w-40"
            />
          </div>

          {/* Categories Pill */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full pl-3.5 pr-8 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option>Categories</option>
              <option>Pro</option>
              <option>Starter</option>
              <option>Enterprise</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter Pill */}
          <button
            onClick={() => alert('Filter options')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <Filter className="h-3 w-3 text-slate-400" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">NO</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">PLAN</th>
              <th className="py-3 px-4">CUSTOMER</th>
              <th className="py-3 px-4">PAYMENT METHOD</th>
              <th className="py-3 px-4">AMOUNT</th>
              <th className="py-3 px-4">DATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80 font-medium">
            {sales.map((s) => (
              <tr key={s.no} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-3 font-mono text-slate-400 font-bold">{s.no}</td>
                <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900">{s.plan}</td>
                <td className="py-3.5 px-4 text-slate-700">{s.customer}</td>
                <td className="py-3.5 px-4 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="flex -space-x-1">
                      <span className="h-3 w-3 rounded-full bg-rose-500 opacity-90" />
                      <span className="h-3 w-3 rounded-full bg-amber-400 opacity-90" />
                    </span>
                    <span>{s.method}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                  ${s.amount}
                </td>
                <td className="py-3.5 px-4 text-slate-400">{s.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
