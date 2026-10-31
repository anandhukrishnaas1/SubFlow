'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import { SidebarProvider } from '@/hooks/use-sidebar';
import { CurrencyProvider } from '@/hooks/use-currency';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
