'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

interface SaleItem {
  no: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  plan: 'Pro' | 'Starter' | 'Enterprise';
  customer: string;
  method: 'Master Card' | 'Visa Direct' | 'UPI AutoPay';
  amount: number; // Stored in base USD, dynamically converted
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
  {
    no: '05',
    status: 'Paid',
    plan: 'Enterprise',
    customer: 'Stark Technologies',
    method: 'Visa Direct',
    amount: 650,
    date: '16 Oct 2026',
  },
  {
    no: '06',
    status: 'Pending',
    plan: 'Starter',
    customer: 'Bharat Payments Ltd',
    method: 'UPI AutoPay',
    amount: 80,
    date: '17 Oct 2026',
  },
];

export function RecentSalesCard() {
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Categories');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Pending'>('ALL');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const filteredSales = useMemo(() => {
    return SAMPLE_SALES.filter((sale) => {
      const matchesSearch =
        sale.customer.toLowerCase().includes(search.toLowerCase()) ||
        sale.plan.toLowerCase().includes(search.toLowerCase()) ||
        sale.no.includes(search);

      const matchesCategory =
        selectedCategory === 'Categories' ||
        selectedCategory === 'All' ||
        sale.plan.toLowerCase() === selectedCategory.toLowerCase();

      const matchesStatus =
        statusFilter === 'ALL' || sale.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, selectedCategory, statusFilter]);

  const getStatusBadge = (status: SaleItem['status']) => {
    switch (status) {
      case 'Paid':
        return (
          <div className="relative inline-flex items-center justify-center px-4 py-1 rounded-full border border-emerald-400/70 bg-emerald-50/80 text-emerald-700 text-xs font-bold">
            <span className="absolute -top-0.5 inset-x-2.5 h-0.5 bg-emerald-500 rounded-full" />
            <span>Paid</span>
          </div>
        );
      case 'Pending':
        return (
          <div className="relative inline-flex items-center justify-center px-4 py-1 rounded-full border border-amber-400/70 bg-amber-50/80 text-amber-700 text-xs font-bold">
            <span className="absolute -top-0.5 inset-x-2.5 h-0.5 bg-amber-500 rounded-full" />
            <span>Pending</span>
          </div>
        );
      case 'Overdue':
        return (
          <div className="relative inline-flex items-center justify-center px-4 py-1 rounded-full border border-rose-400/70 bg-rose-50/80 text-rose-700 text-xs font-bold">
            <span className="absolute -top-0.5 inset-x-2.5 h-0.5 bg-rose-500 rounded-full" />
            <span>Overdue</span>
          </div>
        );
    }
  };

  const renderPaymentIcon = (method: SaleItem['method']) => {
    if (method === 'Master Card') {
      return (
        <span className="flex items-center -space-x-1.5 shrink-0" title="MasterCard">
          <span className="h-3.5 w-3.5 rounded-full bg-[#eb001b] opacity-95 shadow-2xs" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#f79e1b] opacity-90 shadow-2xs" />
        </span>
      );
    }
    if (method === 'Visa Direct') {
      return (
        <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-[#1a1f71] text-white font-black text-[8px] italic rounded tracking-wider shadow-2xs">
          VISA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-emerald-600 text-white font-extrabold text-[8px] rounded shadow-2xs">
        UPI
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.05)] transition-all">
      {/* Table Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div>
          <h3 className="text-lg font-black text-stone-900 tracking-tight">Recent Sales</h3>
          <p className="text-[11px] text-stone-400 font-medium">Real-time settlement stream</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-stone-50/80 border border-stone-200/90 rounded-full pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-stone-400 w-32 sm:w-40 transition-all"
            />
          </div>

          {/* Categories Pill Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-stone-50/80 hover:bg-stone-100 border border-stone-200/90 rounded-full pl-3.5 pr-8 py-1.5 text-xs font-bold text-stone-700 focus:outline-none cursor-pointer transition-colors"
            >
              <option value="Categories">Categories</option>
              <option value="All">All Plans</option>
              <option value="Pro">Pro</option>
              <option value="Starter">Starter</option>
              <option value="Enterprise">Enterprise</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-stone-400 pointer-events-none" />
          </div>

          {/* Filter Status Pill */}
          <div className="relative">
            <button
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                statusFilter !== 'ALL'
                  ? 'bg-orange-50 text-orange-700 border-orange-300'
                  : 'bg-stone-50/80 hover:bg-stone-100 text-stone-700 border-stone-200/90'
              }`}
            >
              <Filter className="h-3 w-3 text-stone-400" />
              <span>{statusFilter === 'ALL' ? 'Filter' : statusFilter}</span>
            </button>

            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-xl border border-stone-200/90 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setFilterMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  All Statuses
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('Paid');
                    setFilterMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center justify-between"
                >
                  <span>Paid</span>
                  <CheckCircle2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('Pending');
                    setFilterMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-bold rounded-xl text-amber-700 hover:bg-amber-50 transition-colors flex items-center justify-between"
                >
                  <span>Pending</span>
                  <Clock className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-100 text-stone-400 font-extrabold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">NO</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">PLAN</th>
              <th className="py-3 px-4">CUSTOMER</th>
              <th className="py-3 px-4">PAYMENT METHOD</th>
              <th className="py-3 px-4">AMOUNT</th>
              <th className="py-3 px-4">DATE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100/80 font-medium">
            {filteredSales.map((s) => (
              <tr key={s.no} className="hover:bg-stone-50/70 transition-colors group">
                <td className="py-3.5 px-3 font-mono text-stone-400 font-bold">{s.no}</td>
                <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>
                <td className="py-3.5 px-4 font-black text-stone-900">{s.plan}</td>
                <td className="py-3.5 px-4 text-stone-800 font-semibold">{s.customer}</td>
                <td className="py-3.5 px-4 text-stone-700">
                  <div className="flex items-center gap-2">
                    {renderPaymentIcon(s.method)}
                    <span className="font-semibold text-stone-800">{s.method}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono font-black text-stone-900 text-sm">
                  {formatAmount(s.amount)}
                </td>
                <td className="py-3.5 px-4 text-stone-400 font-medium">{s.date}</td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-stone-400">
                  No transactions match your search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
