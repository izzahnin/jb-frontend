'use client';

import type { TripResponse, TruckResponse, DriverResponse } from '@/lib/api';

type TripDetailsModalProps = {
  open: boolean;
  trip: TripResponse | null;
  orderNumber: string;
  truckInfo?: TruckResponse | null;
  driverInfo?: DriverResponse | null;
  onClose: () => void;
};

const STATUS_STYLE: Record<string, string> = {
  pickup: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' });
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-900 text-right">{value}</span>
    </div>
  );
}

export function TripDetailsModal({ open, trip, orderNumber, truckInfo, driverInfo, onClose }: TripDetailsModalProps) {
  if (!open || !trip) return null;

  const statusClass = STATUS_STYLE[trip.status] ?? 'bg-slate-100 text-slate-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Detail Trip</p>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5 font-mono">{trip.trip_number}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tutup"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <Row label="Order #" value={orderNumber} />
          <Row
            label="Truck"
            value={
              truckInfo ? (
                <div className="text-right">
                  <p className="font-mono font-semibold">{truckInfo.plate_number}</p>
                  <p className="text-xs text-slate-400">{truckInfo.truck_type}</p>
                </div>
              ) : `#${trip.truck_id}`
            }
          />
          <Row
            label="Driver"
            value={
              driverInfo ? (
                <div className="text-right">
                  <p className="font-medium">{driverInfo.name}</p>
                  <p className="text-xs text-slate-400">{driverInfo.phone}</p>
                </div>
              ) : `#${trip.driver_id}`
            }
          />
          <Row label="No. Container" value={trip.container_number || '—'} />
          <Row label="No. Seal" value={trip.seal_number || '—'} />
          <Row
            label="Status"
            value={
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
                {trip.status.replace('_', ' ').toUpperCase()}
              </span>
            }
          />
          <Row label="Waktu Mulai" value={formatDateTime(trip.start_time)} />
          {trip.started_by_name && (
            <Row label="Dimulai oleh" value={<span className="text-slate-500 font-normal">{trip.started_by_name}</span>} />
          )}
          <Row label="Waktu Selesai" value={formatDateTime(trip.end_time)} />
          {trip.completed_by_name && (
            <Row label="Diselesaikan oleh" value={<span className="text-slate-500 font-normal">{trip.completed_by_name}</span>} />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
