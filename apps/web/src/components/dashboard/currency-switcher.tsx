'use client';

import React from 'react';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';
import { ArrowLeftRight } from 'lucide-react';

export function CurrencySwitcher({ className }: { className?: string }) {
  const { currency, setCurrency, exchangeRate } = useCurrency();

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div className="inline-flex items-center p-0.5 bg-white border border-stone-200/90 rounded-full shadow-2xs">
        <button
          type="button"
          onClick={() => setCurrency('USD')}
          className={cn(
            'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold transition-all duration-200',
            currency === 'USD'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
          )}
          title="Switch currency to United States Dollar ($)"
        >
          <span className="text-xs">$</span>
          <span>USD</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrency('INR')}
          className={cn(
            'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold transition-all duration-200',
            currency === 'INR'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
          )}
          title={`Switch currency to Indian Rupee (₹) [1 USD = ₹${exchangeRate}]`}
        >
          <span className="text-xs">₹</span>
          <span>INR</span>
        </button>
      </div>

      <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 bg-stone-100/70 border border-stone-200/60 px-2 py-0.5 rounded-full">
        <ArrowLeftRight className="h-2.5 w-2.5 text-stone-400" />
        $1 = ₹{exchangeRate}
      </span>
    </div>
  );
}
