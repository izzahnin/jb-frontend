'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { BottomNavBar } from '@/components/BottomNavBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import { useAuth } from '@/lib/hooks';
import 'react-toastify/dist/ReactToastify.css';

function DemoModeBanner() {
  const { user } = useAuth();
  if (user?.role !== 'demo') return null;
  return (
    <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-1.5 px-4 shrink-0">
      Mode Demo aktif — Anda hanya dapat melihat data, tidak bisa membuat perubahan
    </div>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
        <DemoModeBanner />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <BottomNavBar />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
    </ProtectedRoute>
  );
}
