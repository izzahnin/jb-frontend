'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getLatestLocation, getLocationHistory, TripResponse, TruckResponse, DriverResponse } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

type LatLon = [number, number];

interface RawLocation {
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  ts?: string;
}

const getLat = (p: RawLocation): number => p.latitude ?? p.lat ?? 0;
const getLon = (p: RawLocation): number => p.longitude ?? p.lon ?? 0;
const getTs = (p: RawLocation): string | undefined => p.created_at ?? p.ts;

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' });
};

type LocationModalProps = {
  open: boolean;
  trip: TripResponse | null;
  truckInfo?: TruckResponse | null;
  driverInfo?: DriverResponse | null;
  onClose: () => void;
};

export function LocationModal({ open, trip, truckInfo, driverInfo, onClose }: LocationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [center, setCenter] = useState<LatLon | null>(null);
  const [history, setHistory] = useState<LatLon[]>([]);
  const [latestTs, setLatestTs] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open || !trip) return;
    setError('');
    setCenter(null);
    setHistory([]);
    setLatestTs(undefined);
    setLoading(true);

    void (async () => {
      try {
        const [latestRes, historyRes] = await Promise.all([
          getLatestLocation(trip.id),
          getLocationHistory(trip.id, 50),
        ]);

        const latest = latestRes.data as RawLocation | null;
        const hist = (historyRes.data as RawLocation[] | null) ?? [];

        if (latest && (getLat(latest) !== 0 || getLon(latest) !== 0)) {
          setCenter([getLat(latest), getLon(latest)]);
          setLatestTs(getTs(latest));
        }

        const pts: LatLon[] = hist
          .filter(p => getLat(p) !== 0 || getLon(p) !== 0)
          .map(p => [getLat(p), getLon(p)]);
        setHistory(pts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat lokasi');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, trip]);

  if (!open || !trip) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Lokasi Trip</p>
            <h3 className="text-base font-semibold text-slate-900 font-mono mt-0.5">{trip.trip_number}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Trip info bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <p className="text-xs text-slate-400">Status</p>
            <div className="mt-0.5"><StatusBadge status={trip.status} /></div>
          </div>
          <div>
            <p className="text-xs text-slate-400">Driver</p>
            <p className="text-xs font-medium text-slate-800 mt-0.5 truncate">{driverInfo?.name ?? `#${trip.driver_id}`}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Truck</p>
            <p className="text-xs font-mono font-medium text-slate-800 mt-0.5">{truckInfo?.plate_number ?? `#${trip.truck_id}`}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Update Terakhir</p>
            <p className="text-xs font-medium text-slate-800 mt-0.5">{formatDateTime(latestTs)}</p>
          </div>
        </div>

        {/* Map area */}
        <div style={{ height: '400px', position: 'relative', flexShrink: 0 }}>
          {loading && (
            <div className="flex items-center justify-center h-full text-slate-400">
              <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memuat lokasi...
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center justify-center h-full text-red-500 text-sm px-6 text-center">
              {error}
            </div>
          )}
          {!loading && !error && !center && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <p className="text-sm font-medium">Belum ada data lokasi</p>
              <p className="text-xs">Lokasi akan muncul saat driver mengirim GPS</p>
            </div>
          )}
          {!loading && !error && center && (
            <LeafletMap center={center} history={history} latestTimestamp={formatDateTime(latestTs)} />
          )}
        </div>

        {/* Footer */}
        {center && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-xs text-slate-600 font-mono">
              {center[0].toFixed(6)}, {center[1].toFixed(6)}
            </span>
            {history.length > 0 && (
              <span className="ml-auto text-xs text-slate-400">{history.length} titik riwayat</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
