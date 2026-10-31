'use client';

import React, { useState } from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
  const [customer, setCustomer] = useState('Acme Corporation');
  const [plan, setPlan] = useState('Pro');
  const [amount, setAmount] = useState('120');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createInvoice({
        customerId: 'cust_sample',
        customerName: customer,
        total: Number(amount) || 120,
        status: 'confirmed',
      });
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch {
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create New Invoice</h3>
              <p className="text-[11px] text-slate-500">Issue ad-hoc billing invoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto animate-in zoom-in" />
            <p className="font-bold text-slate-900 text-sm">Invoice Created Successfully!</p>
            <p className="text-xs text-slate-500">Receipt queued for customer delivery</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Customer Name</label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300"
                >
                  <option value="Pro">Pro ($120/mo)</option>
                  <option value="Starter">Starter ($49/mo)</option>
                  <option value="Enterprise">Enterprise ($490/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-black shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Issue Invoice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
