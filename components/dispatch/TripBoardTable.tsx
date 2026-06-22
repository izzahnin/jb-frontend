'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import type { TripResponse, TruckResponse, DriverResponse } from '@/lib/api';

const STATUS_STYLE: Record<string, string> = {
  pickup: 'bg-purple-100 text-purple-700',
  in_transit: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

type TripBoardTableProps = {
  trips: TripResponse[];
  trucks: TruckResponse[];
  drivers: DriverResponse[];
  getOrderNumberById: (orderId: number) => string;
  onStartTrip: (trip: TripResponse) => void;
  onDeliverTrip: (tripId: number) => void;
  onShowDetails: (trip: TripResponse) => void;
  onShowLocation: (trip: TripResponse) => void;
};

export function TripBoardTable({
  trips,
  trucks,
  drivers,
  getOrderNumberById,
  onStartTrip,
  onDeliverTrip,
  onShowDetails,
  onShowLocation,
}: TripBoardTableProps) {
  // Lookup maps — resolve ID → detail tanpa API tambahan
  const truckMap = Object.fromEntries(trucks.map(t => [t.id, t]));
  const driverMap = Object.fromEntries(drivers.map(d => [d.id, d]));

  const columns: ColumnDef<TripResponse>[] = [
    {
      accessorKey: 'order_id',
      header: 'Order',
      cell: (info) => (
        <span className="font-medium text-slate-900">{getOrderNumberById(Number(info.getValue()))}</span>
      ),
    },
    {
      accessorKey: 'trip_number',
      header: 'Trip #',
      cell: (info) => <span className="font-mono text-xs text-slate-700">{String(info.getValue())}</span>,
    },
    {
      accessorKey: 'container_number',
      header: 'Container',
      cell: (info) => info.getValue() ? (
        <span className="font-mono text-xs">{String(info.getValue())}</span>
      ) : (
        <span className="text-slate-300">—</span>
      ),
    },
    {
      accessorKey: 'truck_id',
      header: 'Truck',
      cell: (info) => {
        const truck = truckMap[Number(info.getValue())];
        const trip = info.row.original;
        const plateNumber = truck?.plate_number ?? trip.truck_plate_number;
        const isInactive = !truck && !!trip.truck_plate_number;
        if (!plateNumber) return <span className="text-slate-400 text-xs">#{String(info.getValue())}</span>;
        return (
          <div>
            <p className="font-mono font-semibold text-xs text-slate-900">
              {plateNumber}{isInactive ? <span className="text-slate-400 font-normal"> (Nonaktif)</span> : null}
            </p>
            {truck?.truck_type && <p className="text-xs text-slate-400">{truck.truck_type}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: 'driver_id',
      header: 'Driver',
      cell: (info) => {
        const driver = driverMap[Number(info.getValue())];
        if (!driver) return <span className="text-slate-400 text-xs">#{String(info.getValue())}</span>;
        return (
          <div>
            <p className="text-xs font-medium text-slate-900">{driver.name}</p>
            <p className="text-xs text-slate-400">{driver.phone}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const status = String(info.getValue());
        const cls = STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-700';
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
            {status.replace('_', ' ').toUpperCase()}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: (info) => {
        const trip = info.row.original;
        return (
          <div className="flex items-center gap-1.5">
            {trip.status === 'pickup' && (
              <button
                onClick={() => onStartTrip(trip)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
              >
                Mulai
              </button>
            )}
            {trip.status === 'in_transit' && (
              <button
                onClick={() => onDeliverTrip(trip.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Deliver
              </button>
            )}
            {['in_transit', 'delivered'].includes(trip.status) && (
              <button
                onClick={() => onShowLocation(trip)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Lokasi
              </button>
            )}
            <button
              onClick={() => onShowDetails(trip)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
            >
              Detail
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={trips}
      searchPlaceholder="Cari trip..."
      searchColumn="trip_number"
    />
  );
}
