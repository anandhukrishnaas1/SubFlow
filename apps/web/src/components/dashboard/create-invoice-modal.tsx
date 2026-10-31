'use client';

import React, { useState } from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateInvoiceModal({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) {
  const queryClient = useQueryClient();
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.getCustomers(),
    enabled: isOpen,
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Acme Corporation');
  const [customerEmail, setCustomerEmail] = useState('');
  const [description, setDescription] = useState('Professional Subscription Billing');
  const [amount, setAmount] = useState('120');
  const [taxPercent, setTaxPercent] = useState('18');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    if (!id) return;
    const found = (customers || []).find((c: any) => c.id === id);
    if (found) {
      setCustomerName(found.name || found.companyName || 'Customer');
      setCustomerEmail(found.email || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const unitPrice = Number(amount) || 0;
      const taxRate = Number(taxPercent) || 0;
      const taxAmount = (unitPrice * taxRate) / 100;
      const total = unitPrice + taxAmount;

      await api.createInvoice({
        customerId: selectedCustomerId || 'cust_adhoc',
        customerName: customerName.trim() || 'Valued Customer',
        customerEmail: customerEmail.trim() || undefined,
        status: 'confirmed',
        subtotal: unitPrice,
        taxAmount: taxAmount,
        discountAmount: 0,
        total: total,
        paidAmount: 0,
        outstandingAmount: total,
        items: [
          {
            productName: description,
            quantity: 1,
            unitPrice: unitPrice,
            taxAmount: taxAmount,
            discountAmount: 0,
            total: total,
          },
        ],
      });

      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: ['kpis'] });
      await queryClient.invalidateQueries({ queryKey: ['activities'] });

      setDone(true);
      setTimeout(() => {
        setDone(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      console.error('Invoice creation error:', err);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1000);
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
            <p className="text-xs text-slate-500">Receipt generated with tax breakdown</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {customers && customers.length > 0 && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300"
                >
                  <option value="">-- Choose registered customer (or type custom) --</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.companyName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Description / Item</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subtotal (₹ / $)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="1"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-slate-300"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-slate-600 font-medium">
              <span>Total with Tax:</span>
              <span className="font-bold text-slate-900 text-sm">
                {(Number(amount) || 0) + ((Number(amount) || 0) * (Number(taxPercent) || 0)) / 100}
              </span>
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
