'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { getDashboardStats, DashboardStatsResponse } from '@/lib/api';
import { useAuth } from '@/lib/hooks';

// SVG icons as tiny components
function IconBox() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}
function IconTruck() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}
function IconDriver() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}
function IconDispatch() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

const STAT_CARDS = (stats: DashboardStatsResponse) => [
  {
    label: 'Total Order',
    value: stats.total_orders,
    icon: <IconBox />,
    iconBg: 'bg-blue-600',
    trend: `${stats.order_breakdown.pending} pending`,
    badge: { label: '↑ Aktif', cls: 'bg-blue-50 text-blue-600' },
    progress: null,
  },
  {
    label: 'Truck Aktif',
    value: stats.active_trucks,
    icon: <IconTruck />,
    iconBg: 'bg-emerald-600',
    trend: `dari ${stats.total_trucks} total`,
    badge: { label: '● On Duty', cls: 'bg-emerald-50 text-emerald-600' },
    progress: stats.total_trucks > 0 ? Math.round((stats.active_trucks / stats.total_trucks) * 100) : 0,
  },
  {
    label: 'Total User',
    value: stats.total_users,
    icon: <IconUsers />,
    iconBg: 'bg-violet-600',
    trend: null,
    badge: null,
    progress: null,
  },
  {
    label: 'Admin',
    value: stats.total_admins,
    icon: <IconShield />,
    iconBg: 'bg-orange-600',
    trend: null,
    badge: null,
    progress: null,
  },
];

const NAV_SECTIONS = [
  {
    title: 'Customers',
    description: 'Data master pelanggan untuk pembuatan order',
    icon: <IconBuilding />,
    iconBg: 'bg-blue-50 text-blue-600',
    href: '/dashboard/customers',
  },
  {
    title: 'Drivers',
    description: 'Data master pengemudi untuk dispatch trip',
    icon: <IconDriver />,
    iconBg: 'bg-violet-50 text-violet-600',
    href: '/dashboard/drivers',
  },
  {
    title: 'Orders',
    description: 'Kelola pengiriman dan tracking order',
    icon: <IconBox />,
    iconBg: 'bg-emerald-50 text-emerald-600',
    href: '/dashboard/orders',
  },
  {
    title: 'Trucks',
    description: 'Manajemen armada kendaraan',
    icon: <IconTruck />,
    iconBg: 'bg-orange-50 text-orange-600',
    href: '/dashboard/trucks',
  },
  {
    title: 'Dispatch',
    description: 'Buat dan eksekusi trip (mulai, lokasi, selesai)',
    icon: <IconDispatch />,
    iconBg: 'bg-indigo-50 text-indigo-600',
    href: '/dashboard/dispatch',
  },
  {
    title: 'Users',
    description: 'Manajemen akun admin',
    icon: <IconUsers />,
    iconBg: 'bg-rose-50 text-rose-600',
    href: '/dashboard/users',
  },
];

function DeniedToastHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('denied') === '1') {
      toast.error('Akses ditolak: role Anda tidak memiliki izin untuk halaman tersebut.');
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  return null;
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatDate(d: Date) {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    getDashboardStats()
      .then((res) => { if (res.data) setStats(res.data); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat statistik'))
      .finally(() => setLoading(false));
  }, []);

  const today = formatDate(new Date());

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <DeniedToastHandler />
      </Suspense>

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-widest mb-1">PT. Jalur Berlian Makassar</p>
            <h1 className="text-2xl font-bold tracking-tight">
              Selamat datang{user?.full_name ? `, ${user.full_name.charAt(0).toUpperCase() + user.full_name.slice(1)}` : ''} 👋
            </h1>
            <p className="text-blue-200 text-sm mt-1">Sistem Manajemen Fleet &amp; Order</p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-blue-200 text-sm">{today}</p>
            {/* <div className="mt-2 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-medium">Sistem Aktif</span>
            </div> */}
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-12 w-56 h-56 rounded-full bg-white/5" />
      </div>

      {/* Stat Cards */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3">
                  <div className="w-9 h-9 bg-slate-200 rounded-xl" />
                  <div className="h-7 bg-slate-200 rounded w-16" />
                  <div className="h-3 bg-slate-100 rounded w-24" />
                </div>
              ))
            : stats
            ? STAT_CARDS(stats).map((card) => (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center text-white`}>
                      {card.icon}
                    </div>
                    {card.badge && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${card.badge.cls}`}>
                        {card.badge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{card.label}</p>
                  {card.trend && (
                    <p className="text-xs text-slate-400 mt-1">{card.trend}</p>
                  )}
                </div>
              ))
            : null}
        </div>
      )}

      {/* Order breakdown */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Status Order</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Pending', value: stats.order_breakdown.pending, cls: 'bg-slate-100 text-slate-700' },
              { label: 'Partial', value: stats.order_breakdown.partial, cls: 'bg-blue-100 text-blue-700' },
              { label: 'Completed', value: stats.order_breakdown.completed, cls: 'bg-green-100 text-green-700' },
              { label: 'Cancelled', value: stats.order_breakdown.cancelled, cls: 'bg-red-100 text-red-700' },
            ].map(({ label, value, cls }) => (
                <div key={label} className={`rounded-xl px-4 py-3 ${cls}`}>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs font-medium mt-0.5">{label}</p>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Nav sections */}
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Menu</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAV_SECTIONS.map((section) => (
            <Link key={section.href} href={section.href}>
              <div className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${section.iconBg} flex items-center justify-center mb-4`}>
                    {section.icon}
                  </div>
                  <span className="text-slate-300 group-hover:text-slate-600 transition-colors mt-1">
                    <IconArrow />
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{section.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
