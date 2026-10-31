import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'SubFlow — Subscriptions. Simplified.',
  description:
    'Modern, event-driven subscription management and recurring billing platform powered by Firebase Firestore and real-time streams.',
  icons: {
    icon: '/subflow-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#edeae3] text-stone-900 antialiased selection:bg-orange-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
