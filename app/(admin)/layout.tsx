'use client';

import { Navigation } from '@/components/Navigation';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navigation />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 bg-gray-50">
        {children}
      </main>
    </>
  );
}
