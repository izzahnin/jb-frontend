'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { TripBoardTable } from '@/components/dispatch/TripBoardTable';
import { TripDetailsModal } from '@/components/dispatch/TripDetailsModal';
import { LocationModal } from '@/components/dispatch/LocationModal';
import {
  getOrders,
  getTrucks,
  getDrivers,
  createTrip,
  getTrips,
  startTrip,
  deliverTrip,
  TripResponse,
  TruckResponse,
  DriverResponse,
} from '@/lib/api';

type OrderLite = {
  id: number;
  order_number: string;
  status: string;
};

type TripForm = {
  order_id: string;
  truck_id: string;
  driver_id: string;
};

const emptyTripForm: TripForm = { order_id: '', truck_id: '', driver_id: '' };

const inputCls = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export default function DispatchPage() {
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [trucks, setTrucks] = useState<TruckResponse[]>([]);
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [tripForm, setTripForm] = useState<TripForm>(emptyTripForm);
  const [loading, setLoading] = useState(true);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [activeTrip, setActiveTrip] = useState<TripResponse | null>(null);
  const [detailsTrip, setDetailsTrip] = useState<TripResponse | null>(null);
  const [locationTrip, setLocationTrip] = useState<TripResponse | null>(null);
  const [startPayload, setStartPayload] = useState({ container_number: '', seal_number: '' });
  const [submitting, setSubmitting] = useState(false);
  const [startErrors, setStartErrors] = useState<{ container_number?: string; seal_number?: string }>({});

  useEffect(() => { void loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, trucksRes, driversRes, tripsRes] = await Promise.all([
        getOrders(0, 100),
        getTrucks(0, 100),
        getDrivers(),
        getTrips(),
      ]);
      setOrders((ordersRes.data ?? []).map(o => ({ id: o.id, order_number: o.order_number, status: o.status })));
      setTrucks(trucksRes.data ?? []);
      setDrivers(driversRes.data ?? []);
      setTrips(tripsRes.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const refreshTrips = async () => {
    try {
      const res = await getTrips();
      setTrips(res.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat trips');
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // trip_number digenerate otomatis oleh DB trigger (TRIP-{id}), tidak perlu dikirim
      await createTrip({
        order_id: Number(tripForm.order_id),
        truck_id: Number(tripForm.truck_id),
        driver_id: Number(tripForm.driver_id),
      });
      setSelectedOrderId(tripForm.order_id);
      await refreshTrips();
      setTripForm(emptyTripForm);
      setShowCreateTrip(false);
      toast.success('Trip berhasil dibuat');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat trip');
    } finally {
      setSubmitting(false);
    }
  };

  const ISO_CONTAINER_RE = /^[A-Z]{4}\d{7}$/;

  const validateStartPayload = (payload: typeof startPayload) => {
    const errors: typeof startErrors = {};
    if (!ISO_CONTAINER_RE.test(payload.container_number)) {
      errors.container_number = 'Format container: 4 huruf kapital + 7 angka (contoh: ABCU1234567)';
    }
    if (payload.seal_number.length < 6) {
      errors.seal_number = 'Minimal 6 karakter';
    }
    return errors;
  };

  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    const errors = validateStartPayload(startPayload);
    if (Object.keys(errors).length > 0) {
      setStartErrors(errors);
      return;
    }
    setStartErrors({});
    setSubmitting(true);
    try {
      await startTrip(activeTrip.id, {
        container_number: startPayload.container_number,
        seal_number: startPayload.seal_number,
      });
      await refreshTrips();
      setStartPayload({ container_number: '', seal_number: '' });
      setActiveTrip(null);
      toast.success('Trip berhasil dimulai');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memulai trip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeliverTrip = async (tripId: number) => {
    try {
      await deliverTrip(tripId);
      await refreshTrips();
      toast.success('Trip berhasil diselesaikan');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyelesaikan trip');
    }
  };

  const getOrderNumberById = (orderId: number) =>
    orders.find(o => o.id === orderId)?.order_number ?? `#${orderId}`;

  // Progress bar: filter trip hanya milik order yang dipilih
  const getOrderProgress = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;
    const orderTrips = trips.filter(t => t.order_id === orderId);
    const delivered = orderTrips.filter(t => t.status === 'delivered').length;
    return { trips: orderTrips.length, delivered };
  };

  // Lookup maps untuk resolve ID → detail di tabel dan modal
  const truckMap = Object.fromEntries(trucks.map(t => [t.id, t]));
  const driverMap = Object.fromEntries(drivers.map(d => [d.id, d]));

  const visibleTrips = selectedOrderId
    ? trips.filter(t => t.order_id === Number(selectedOrderId))
    : trips;

  // Order yang masih bisa dibuat trip-nya: pending/partial dan belum punya trip aktif
  const assignedOrderIds = new Set(trips.filter(t => t.is_active).map(t => t.order_id));
  const activeOrders = orders.filter(o =>
    (o.status === 'pending' || o.status === 'partial') && !assignedOrderIds.has(o.id)
  );

  const stats = {
    total: trips.length,
    pickup: trips.filter(t => t.status === 'pickup').length,
    inTransit: trips.filter(t => t.status === 'in_transit').length,
    delivered: trips.filter(t => t.status === 'delivered').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <PageHeader title="Dispatch" description="Buat, mulai, dan selesaikan trip pengiriman." />
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { label: 'Total', value: stats.total, cls: 'bg-slate-100 text-slate-700' },
            { label: 'Pickup', value: stats.pickup, cls: 'bg-purple-100 text-purple-700' },
            { label: 'In Transit', value: stats.inTransit, cls: 'bg-yellow-100 text-yellow-700' },
            { label: 'Delivered', value: stats.delivered, cls: 'bg-green-100 text-green-700' },
          ].map(({ label, value, cls }) => (
            <span key={label} className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
              {label}: {value}
            </span>
          ))}
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Trip Board</h2>
            <p className="text-xs text-slate-500 mt-0.5">Pilih order untuk filter trip.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Order</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>{o.order_number} ({o.status})</option>
              ))}
            </select>
            <button
              onClick={() => void refreshTrips()}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => { setShowCreateTrip(p => !p); setActiveTrip(null); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Trip Baru
            </button>
          </div>
        </div>

        {/* Create Trip Form */}
        {showCreateTrip && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-blue-900">Buat Trip Baru</p>
              <p className="text-xs text-blue-600 mt-0.5">No. Trip digenerate otomatis oleh sistem.</p>
            </div>
            <form onSubmit={handleCreateTrip} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Hanya order pending/partial yang bisa dipilih */}
              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wide">Order</label>
                <select
                  value={tripForm.order_id}
                  onChange={(e) => setTripForm({ ...tripForm, order_id: e.target.value })}
                  className={inputCls}
                  required
                >
                  <option value="">Pilih Order</option>
                  {activeOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} · {o.status}
                    </option>
                  ))}
                </select>
                {activeOrders.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Tidak ada order aktif (pending/partial).</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wide">Truck (Available)</label>
                <select
                  value={tripForm.truck_id}
                  onChange={(e) => setTripForm({ ...tripForm, truck_id: e.target.value })}
                  className={inputCls}
                  required
                >
                  <option value="">Pilih Truck</option>
                  {trucks.filter(t => t.status === 'available').map(t => (
                    <option key={t.id} value={t.id}>{t.plate_number} — {t.truck_type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wide">Driver (Available)</label>
                <select
                  value={tripForm.driver_id}
                  onChange={(e) => setTripForm({ ...tripForm, driver_id: e.target.value })}
                  className={inputCls}
                  required
                >
                  <option value="">Pilih Driver</option>
                  {drivers.filter(d => d.status === 'available').map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || activeOrders.length === 0}
                className="sm:col-span-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                {submitting ? 'Membuat...' : 'Buat Trip'}
              </button>
            </form>
          </div>
        )}

        {/* Order progress bar */}
        {selectedOrderId && (() => {
          const order = orders.find(o => o.id === Number(selectedOrderId));
          const progress = getOrderProgress(Number(selectedOrderId));
          if (!order || !progress) return null;
          const pct = progress.trips > 0 ? Math.round((progress.delivered / progress.trips) * 100) : 0;
          return (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{order.order_number}</p>
                <p className="text-xs text-slate-500">
                  {progress.delivered}/{progress.trips} trip selesai
                </p>
              </div>
              <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-indigo-100">
                <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-indigo-600 font-medium">{pct}% terselesaikan</p>
            </div>
          );
        })()}

        {/* Trip table */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : visibleTrips.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Belum ada trip. Buat trip baru untuk memulai.
          </div>
        ) : (
          <TripBoardTable
            trips={visibleTrips}
            trucks={trucks}
            drivers={drivers}
            getOrderNumberById={getOrderNumberById}
            onStartTrip={(trip) => {
              setActiveTrip(trip);
              setStartPayload({ container_number: '', seal_number: '' });
              setStartErrors({});
              setShowCreateTrip(false);
            }}
            onDeliverTrip={handleDeliverTrip}
            onShowDetails={(trip) => setDetailsTrip(trip)}
            onShowLocation={(trip) => setLocationTrip(trip)}
          />
        )}

        {/* Start Trip Form */}
        {activeTrip && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Mulai Trip — <span className="font-mono">{activeTrip.trip_number}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Truck: {truckMap[activeTrip.truck_id]?.plate_number ?? `#${activeTrip.truck_id}`} ·
                  Driver: {driverMap[activeTrip.driver_id]?.name ?? `#${activeTrip.driver_id}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setActiveTrip(null); setStartErrors({}); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleStartTrip} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">No. Container</label>
                <input
                  type="text"
                  placeholder="ABCU1234567"
                  value={startPayload.container_number}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    const next = { ...startPayload, container_number: val };
                    setStartPayload(next);
                    setStartErrors(prev => ({
                      ...prev,
                      container_number: ISO_CONTAINER_RE.test(val) ? undefined : prev.container_number,
                    }));
                  }}
                  className={`${inputCls}${startErrors.container_number ? ' border-red-400 focus:ring-red-400' : ''}`}
                  required
                />
                {startErrors.container_number && (
                  <p className="text-xs text-red-500 mt-1">{startErrors.container_number}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">No. Seal</label>
                <input
                  type="text"
                  placeholder="SL123456"
                  value={startPayload.seal_number}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartPayload({ ...startPayload, seal_number: val });
                    setStartErrors(prev => ({
                      ...prev,
                      seal_number: val.length >= 6 ? undefined : prev.seal_number,
                    }));
                  }}
                  className={`${inputCls}${startErrors.seal_number ? ' border-red-400 focus:ring-red-400' : ''}`}
                  required
                />
                {startErrors.seal_number && (
                  <p className="text-xs text-red-500 mt-1">{startErrors.seal_number}</p>
                )}
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  {submitting ? 'Memproses...' : 'Mulai Trip'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <LocationModal
        open={Boolean(locationTrip)}
        trip={locationTrip}
        truckInfo={locationTrip ? (truckMap[locationTrip.truck_id] ?? null) : null}
        driverInfo={locationTrip ? (driverMap[locationTrip.driver_id] ?? null) : null}
        onClose={() => setLocationTrip(null)}
      />

      <TripDetailsModal
        open={Boolean(detailsTrip)}
        trip={detailsTrip}
        orderNumber={detailsTrip ? getOrderNumberById(detailsTrip.order_id) : '—'}
        truckInfo={detailsTrip ? (truckMap[detailsTrip.truck_id] ?? null) : null}
        driverInfo={detailsTrip ? (driverMap[detailsTrip.driver_id] ?? null) : null}
        onClose={() => setDetailsTrip(null)}
      />
    </div>
  );
}
