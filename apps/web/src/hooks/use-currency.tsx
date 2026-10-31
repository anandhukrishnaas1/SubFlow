'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'USD' | 'INR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggleCurrency: () => void;
  formatAmount: (usdAmount: number, options?: { hideDecimals?: boolean; compact?: boolean }) => string;
  convertAmount: (usdAmount: number) => number;
  symbol: string;
  exchangeRate: number;
}

const USD_TO_INR_RATE = 84.0;

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  toggleCurrency: () => {},
  formatAmount: (amount) => `$${amount.toLocaleString()}`,
  convertAmount: (amount) => amount,
  symbol: '$',
  exchangeRate: USD_TO_INR_RATE,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('subflow_currency') as Currency;
      if (saved === 'USD' || saved === 'INR') {
        setCurrencyState(saved);
      }
    } catch {
      // Ignore localStorage errors in SSR or restricted environments
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem('subflow_currency', c);
    } catch {
      // Ignore
    }
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'USD' ? 'INR' : 'USD');
  };

  const convertAmount = (usdAmount: number): number => {
    if (currency === 'INR') {
      return Math.round(usdAmount * USD_TO_INR_RATE);
    }
    return usdAmount;
  };

  const formatAmount = (
    usdAmount: number,
    options?: { hideDecimals?: boolean; compact?: boolean }
  ): string => {
    const val = convertAmount(usdAmount);

    if (currency === 'INR') {
      if (options?.compact && val >= 10000000) {
        return `₹${(val / 10000000).toFixed(2)} Cr`;
      }
      if (options?.compact && val >= 100000) {
        return `₹${(val / 100000).toFixed(1)} L`;
      }
      return `₹${val.toLocaleString('en-IN')}`;
    }

    // Default USD
    if (options?.compact && val >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`;
    }
    if (options?.compact && val >= 1000) {
      return `$${(val / 1000).toFixed(1)}k`;
    }

    if (options?.hideDecimals || Number.isInteger(val)) {
      return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        formatAmount,
        convertAmount,
        symbol: currency === 'INR' ? '₹' : '$',
        exchangeRate: USD_TO_INR_RATE,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
