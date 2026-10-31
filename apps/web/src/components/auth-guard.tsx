'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const PUBLIC_ROUTES = ['/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        // Enforce route protection: only after successful login/register can a user use this platform
        router.replace('/login');
      } else if (user && isPublicRoute) {
        // If already authenticated, redirect away from /login
        router.replace(user.role === 'customer' ? '/portal' : '/dashboard');
      }
    }
  }, [user, loading, isPublicRoute, router]);

  // While checking authentication on protected pages, display clean loading canvas
  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-[#edeae3] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-stone-300 border-t-orange-600 animate-spin" />
          <p className="text-xs font-bold text-stone-600 tracking-wider uppercase">
            Verifying SubFlow Security Session...
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated and attempting to view a protected route, block render while redirecting
  if (!user && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-[#edeae3] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-stone-300 border-t-orange-600 animate-spin" />
          <p className="text-xs font-bold text-stone-600 tracking-wider uppercase">
            Redirecting to Sign In...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
