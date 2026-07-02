'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { trackOrder, TrackingTripDetail } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

const PublicLeafletMap = dynamic(() => import('@/components/PublicLeafletMap'), { ssr: false });

interface TrackingOrder {
  id: number;
  order_number: string;
  customer_id: number;
  origin: string;
  destination: string;
  total_containers: number;
  status: string;
  created_at: string;
}

interface TrackingResult {
  order: TrackingOrder;
  detail_trip: TrackingTripDetail | null;
}

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' });
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}

export default function HomePage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setError('');
    setTrackingData(null);
    setLoading(true);
    setSearched(true);
    try {
      const response = await trackOrder(orderNumber.trim().toUpperCase());
      setTrackingData((response.data as TrackingResult) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrderNumber('');
    setTrackingData(null);
    setError('');
    setSearched(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Branding */}
        <div className="text-center pt-4 pb-2">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/icon.svg" alt="Jalur Berlian" width={80} height={53} priority />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Jalur Berlian</h1>
          <p className="text-slate-500 text-sm mt-1">Lacak pengiriman Anda</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Nomor Order
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ORD-001"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white font-mono"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                )}
                Lacak
              </button>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Order tidak ditemukan</p>
              <p className="text-xs mt-0.5 text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!searched && !loading && (
          <div className="text-center py-8 text-slate-400 text-sm">
            Masukkan nomor order untuk melihat status pengiriman Anda
          </div>
        )}

        {/* Results */}
        {trackingData && (
          <div className="space-y-4">

            {/* Order card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Order</p>
                  <p className="text-lg font-bold text-slate-900 font-mono mt-0.5">{trackingData.order.order_number}</p>
                </div>
                <StatusBadge status={trackingData.order.status} />
              </div>
              <p className="text-xs text-slate-400 mb-4">Dibuat {formatDateTime(trackingData.order.created_at)}</p>

              {/* Route */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400 mb-1">Asal</p>
                  <p className="text-sm font-semibold text-slate-900">{trackingData.order.origin}</p>
                </div>
                <div className="shrink-0">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400 mb-1">Tujuan</p>
                  <p className="text-sm font-semibold text-slate-900">{trackingData.order.destination}</p>
                </div>
              </div>
            </div>

            {/* Trip detail */}
            {trackingData.detail_trip ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Trip</p>
                    <p className="text-base font-semibold text-slate-900 font-mono mt-0.5">
                      {trackingData.detail_trip.trip.trip_number}
                    </p>
                  </div>
                  <StatusBadge status={trackingData.detail_trip.trip.status} />
                </div>

                <div className="space-y-0 divide-y divide-slate-100">
                  <InfoRow
                    label="No. Container"
                    value={
                      <span className="font-mono">{trackingData.detail_trip.trip.container_number || '—'}</span>
                    }
                  />
                  <InfoRow
                    label="No. Seal"
                    value={
                      <span className="font-mono">{trackingData.detail_trip.trip.seal_number || '—'}</span>
                    }
                  />
                  <InfoRow label="Waktu Mulai" value={formatDateTime(trackingData.detail_trip.trip.start_time)} />
                  <InfoRow label="Waktu Selesai" value={formatDateTime(trackingData.detail_trip.trip.end_time)} />
                </div>

                {/* Latest location */}
                {trackingData.detail_trip.latest_location ? (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Lokasi Terakhir</p>
                    <div className="rounded-xl overflow-hidden border border-slate-200 mb-3">
                      <PublicLeafletMap
                        center={[trackingData.detail_trip.latest_location.latitude, trackingData.detail_trip.latest_location.longitude]}
                        history={(trackingData.detail_trip.location_history ?? []).map(l => [l.latitude, l.longitude] as [number, number])}
                        timestamp={formatDateTime(trackingData.detail_trip.latest_location.created_at)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span className="text-xs text-slate-500 font-mono">
                        {trackingData.detail_trip.latest_location.latitude.toFixed(6)},&nbsp;
                        {trackingData.detail_trip.latest_location.longitude.toFixed(6)}
                      </span>
                      <span className="ml-auto text-xs text-slate-400">
                        {formatDateTime(trackingData.detail_trip.latest_location.created_at)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 text-center py-2">Belum ada data lokasi</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-500">Belum ada trip untuk order ini</p>
                <p className="text-xs text-slate-400 mt-1">Trip akan muncul saat pengiriman dimulai</p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
              >
                Lacak order lain
              </button>
            </div>
          </div>
        )}

        {/* Admin link */}
        <div className="text-center pb-6">
          <a
            href="/login"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Login Admin
          </a>
        </div>

      </div>
    </div>
  );
}
