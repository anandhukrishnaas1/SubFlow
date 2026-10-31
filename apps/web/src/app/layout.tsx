import type { Metadata } from 'next';
import './globals.css';

import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'SubFlow — Subscription Management & Recurring Billing',
  description:
    'Modern, event-driven subscription management and recurring billing platform powered by Firebase Firestore and real-time streams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
