'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useCurrency } from '@/hooks/use-currency';
import {
  Package,
  Plus,
  Layers,
  Trash2,
  Edit2,
  CheckCircle,
  X,
} from 'lucide-react';

interface VariantInput {
  name: string;
  additionalPrice: number;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { formatAmount } = useCurrency();

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('service');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');

  // Selected variant for live preview per product
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProducts(),
  });

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedProductId(null);
    setName('');
    setType('service');
    setSalesPrice('');
    setCostPrice('');
    setNotes('');
    setVariants([]);
    setNewVarName('');
    setNewVarPrice('');
  };

  const openEditModal = (p: any) => {
    setModalMode('edit');
    setSelectedProductId(p.id);
    setName(p.name || '');
    setType(p.type || 'service');
    setSalesPrice(String(p.salesPrice || ''));
    setCostPrice(String(p.costPrice || ''));
    setNotes(p.notes || '');
    setVariants(
      p.variants?.map((v: any) => ({
        name: v.name,
        additionalPrice: Number(v.additionalPrice) || 0,
      })) || [],
    );
    setNewVarName('');
    setNewVarPrice('');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedProductId(null);
  };

  const handleAddVariant = () => {
    if (!newVarName.trim()) return;
    setVariants([
      ...variants,
      {
        name: newVarName.trim(),
        additionalPrice: parseFloat(newVarPrice) || 0,
      },
    ]);
    setNewVarName('');
    setNewVarPrice('');
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      type,
      salesPrice: parseFloat(salesPrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      notes,
      variants,
    };

    if (modalMode === 'edit' && selectedProductId) {
      await api.updateProduct(selectedProductId, payload);
    } else {
      await api.createProduct(payload);
    }

    queryClient.invalidateQueries({ queryKey: ['products'] });
    closeModal();
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (confirm(`Are you sure you want to delete or archive product "${prodName}"?`)) {
      await api.deleteProduct(id);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
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
              <h1 className="text-2xl font-black tracking-tight text-stone-900 flex items-center gap-2.5">
                <Package className="h-6 w-6 text-orange-600" />
                Product Catalog & Variants
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
                Configure billable SaaS products, variants with automatic delta pricing (e.g. Odoo +₹560), and margins.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold shadow-md shadow-orange-600/20 transition-all self-start sm:self-auto active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p: any) => {
              const activeVariantAdd = selectedVariants[p.id] || 0;
              const effectivePrice = Number(p.salesPrice || 0) + activeVariantAdd;
              const margin =
                effectivePrice > 0
                  ? Math.round(((effectivePrice - (p.costPrice || 0)) / effectivePrice) * 100)
                  : 100;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl p-6 border border-[#e5e2da] shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
                        {p.type}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {margin}% margin
                      </span>
                    </div>

                    <h3 className="font-black text-stone-900 text-base mt-2.5">{p.name}</h3>
                    <p className="text-xs text-stone-500 mt-1 font-medium line-clamp-2">
                      {p.notes || 'Core recurring product item.'}
                    </p>

                    {/* Effective Price with Variant Calculation */}
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-stone-900 font-mono">
                        {formatAmount(effectivePrice)}
                      </span>
                      {activeVariantAdd > 0 && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                          incl. variant +{formatAmount(activeVariantAdd)}
                        </span>
                      )}
                      {p.costPrice > 0 && (
                        <span className="text-xs text-stone-400 font-medium font-mono">
                          (Cost: {formatAmount(p.costPrice)})
                        </span>
                      )}
                    </div>

                    {/* Variants Interactive Picker */}
                    {p.variants && p.variants.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-stone-100">
                        <p className="text-[11px] font-bold text-stone-600 mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-stone-400" />
                            Select Variant to preview price:
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedVariants({
                                ...selectedVariants,
                                [p.id]: 0,
                              })
                            }
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition-all ${
                              activeVariantAdd === 0
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            Base
                          </button>
                          {p.variants.map((v: any, idx: number) => {
                            const isSelected = activeVariantAdd === Number(v.additionalPrice || 0);
                            return (
                              <button
                                key={v.id || idx}
                                type="button"
                                onClick={() =>
                                  setSelectedVariants({
                                    ...selectedVariants,
                                    [p.id]: Number(v.additionalPrice || 0),
                                  })
                                }
                                className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition-all ${
                                  isSelected
                                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                }`}
                              >
                                {v.name} (+{formatAmount(v.additionalPrice || 0)})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-4 mt-5 border-t border-stone-100 flex items-center justify-between text-xs font-medium">
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Active in catalog
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(p)}
                        className="text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal: Create or Edit Product with Variants */}
          {modalMode && (
            <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                      <Package className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-stone-900">
                        {modalMode === 'edit' ? 'Edit Product' : 'Create New Product'}
                      </h3>
                      <p className="text-[11px] text-stone-500 font-medium">
                        Set baseline pricing and configurable variants
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="h-8 w-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Product Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. SubFlow Cloud Storage"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-700 font-bold mb-1">Product Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                      >
                        <option value="service">Service (SaaS)</option>
                        <option value="digital">Digital Product</option>
                        <option value="physical">Physical Asset</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-bold mb-1">Sales Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={salesPrice}
                        onChange={(e) => setSalesPrice(e.target.value)}
                        placeholder="49.00"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="12.00"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">Description / Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Details about product deliverables..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                    />
                  </div>

                  {/* Product Variants Sub-Section */}
                  <div className="pt-3 border-t border-stone-100">
                    <label className="block text-stone-800 font-bold mb-1.5 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-orange-600" />
                      Product Variants & Surcharges (e.g. Odoo variant +₹560)
                    </label>

                    {/* Existing Variants list */}
                    {variants.length > 0 && (
                      <div className="space-y-1.5 mb-2.5">
                        {variants.map((v, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold"
                          >
                            <span>{v.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-stone-800 font-bold">
                                +{formatAmount(v.additionalPrice)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(i)}
                                className="text-stone-400 hover:text-rose-600 p-0.5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Variant Inputs */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Variant name (e.g. Odoo Module, 50GB Storage)"
                        value={newVarName}
                        onChange={(e) => setNewVarName(e.target.value)}
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-xl p-2 text-stone-900 text-xs focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Addl. Price"
                        value={newVarPrice}
                        onChange={(e) => setNewVarPrice(e.target.value)}
                        className="w-24 bg-stone-50 border border-stone-200 rounded-xl p-2 text-stone-900 text-xs font-mono focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="px-3 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md shadow-orange-600/20 transition-all active:scale-95"
                    >
                      {modalMode === 'edit' ? 'Update Product' : 'Create Product'}
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
