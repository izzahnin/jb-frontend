'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import { getOrders, createOrder, updateOrder, deleteOrder, getCustomers, CustomerResponse, OrderResponse } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { MapPickerModal } from '@/components/MapPickerModal';
import { ConfirmModal } from '@/components/ConfirmModal';

const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
const disabledCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-400 bg-slate-50 cursor-not-allowed select-none';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';

type OrderStatus = 'pending' | 'partial' | 'completed' | 'cancelled';

// Status hanya bisa maju ke depan, tidak bisa mundur.
// 'completed' dihapus dari transisi manual — hanya berubah otomatis via penyelesaian trip.
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['partial', 'cancelled'],
  partial: ['cancelled'],
  completed: [],
  cancelled: [],
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  partial: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  partial: 'Partial',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [editingOrder, setEditingOrder] = useState<OrderResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    origin: '',
    destination: '',
    status: 'pending' as OrderStatus,
  });
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapPicker, setMapPicker] = useState<'origin' | 'destination' | null>(null);

  useEffect(() => {
    void Promise.all([loadOrders(), loadCustomers()]);
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data ?? []);
    } catch { setCustomers([]); }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrders(0, 100);
      setOrders(res.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat orders');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ customer_id: '', origin: '', destination: '', status: 'pending' });
    setOriginCoords(null);
    setDestCoords(null);
    setMapPicker(null);
    setEditingOrder(null);
    setShowForm(false);
  };

  const handleEdit = (order: OrderResponse) => {
    setEditingOrder(order);
    setFormData({
      customer_id: String(order.customer_id),
      origin: order.origin,
      destination: order.destination,
      status: order.status as OrderStatus,
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setConfirmModal({
      open: true,
      title: 'Hapus Order',
      message: 'Order ini akan dihapus. Data tidak akan dihapus permanen.',
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }));
        try {
          await deleteOrder(id);
          await loadOrders();
          toast.success('Order berhasil dihapus');
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Gagal menghapus order');
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, { status: formData.status });
        toast.success('Status order berhasil diperbarui');
      } else {
        // order_number dan total_containers diurus otomatis oleh backend
        await createOrder(
          Number(formData.customer_id),
          formData.origin,
          formData.destination,
          {
            origin_lat: originCoords?.lat,
            origin_lng: originCoords?.lng,
            dest_lat: destCoords?.lat,
            dest_lng: destCoords?.lng,
          },
        );
        toast.success('Order berhasil dibuat');
      }
      resetForm();
      await loadOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan order');
    } finally {
      setSubmitting(false);
    }
  };

  const getCustomerName = (id: number) =>
    customers.find(c => c.id === id)?.company_name ?? `Customer #${id}`;

  const validNextStatuses = editingOrder
    ? NEXT_STATUSES[editingOrder.status as OrderStatus] ?? []
    : [];

  const columns: ColumnDef<OrderResponse>[] = [
    {
      accessorKey: 'order_number',
      header: 'No. Order',
      cell: (info) => <span className="font-mono font-medium text-slate-900 text-xs">{String(info.getValue())}</span>,
    },
    {
      accessorKey: 'customer_id',
      header: 'Customer',
      cell: (info) => getCustomerName(Number(info.getValue())),
    },
    { accessorKey: 'origin', header: 'Asal', cell: (info) => String(info.getValue()) },
    { accessorKey: 'destination', header: 'Tujuan', cell: (info) => String(info.getValue()) },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const s = String(info.getValue());
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[s] ?? 'bg-slate-100 text-slate-700'}`}>
            {STATUS_LABEL[s] ?? s}
          </span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Tanggal',
      cell: (info) => new Date(String(info.getValue())).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: (info) => {
        const order = info.row.original;
        const canEdit = order.status === 'pending';
        return (
          <div className="flex gap-1.5">
            {canEdit ? (
            <button
              onClick={() => handleEdit(order)}
              title="Edit order (hanya saat pending)"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Edit
            </button>
            ) : (
            <span
              title={`Order ${order.status} tidak dapat diedit`}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed select-none"
            >
              Edit
            </span>
            )}
            <button
              onClick={() => handleDelete(order.id)}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
            >
              Hapus
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Buat dan pantau seluruh order pengiriman barang pelanggan."
        action={{ label: 'Order Baru', onClick: () => { resetForm(); setShowForm(true); } }}
      />

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {editingOrder ? 'Edit Status Order' : 'Buat Order Baru'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingOrder
                  ? 'Customer dan rute tidak dapat diubah. Status hanya bisa maju.'
                  : 'No. Order digenerate otomatis oleh sistem.'}
              </p>
            </div>
            <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Customer */}
              <div>
                <label className={labelCls}>
                  Customer <span className="text-red-400">*</span>
                  {editingOrder && <span className="ml-1.5 text-slate-400 font-medium normal-case tracking-normal">(tidak dapat diubah)</span>}
                </label>
                {editingOrder ? (
                  <div className="relative">
                    <input type="text" value={getCustomerName(Number(formData.customer_id))} readOnly className={disabledCls} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2"><svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg></div>
                  </div>
                ) : (
                  <select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} className={inputCls} required>
                    <option value="">Pilih Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                )}
              </div>

              {/* Asal */}
              <div>
                <label className={labelCls}>
                  Asal <span className="text-red-400">*</span>
                  {editingOrder && <span className="ml-1.5 text-slate-400 font-medium normal-case tracking-normal">(tidak dapat diubah)</span>}
                </label>
                {editingOrder ? (
                  <input type="text" value={formData.origin} readOnly className={disabledCls} />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pelabuhan Makassar"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className={inputCls}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMapPicker('origin')}
                      title="Pilih lokasi di peta"
                      className="shrink-0 px-3 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </button>
                  </div>
                )}
                {!editingOrder && originCoords && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs text-green-600 font-mono bg-green-50 border border-green-200 rounded-lg px-2 py-0.5">
                      ✓ {originCoords.lat.toFixed(5)}, {originCoords.lng.toFixed(5)}
                    </span>
                    <button type="button" onClick={() => setOriginCoords(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Tujuan */}
              <div>
                <label className={labelCls}>
                  Tujuan <span className="text-red-400">*</span>
                  {editingOrder && <span className="ml-1.5 text-slate-400 font-medium normal-case tracking-normal">(tidak dapat diubah)</span>}
                </label>
                {editingOrder ? (
                  <input type="text" value={formData.destination} readOnly className={disabledCls} />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pelabuhan Surabaya"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className={inputCls}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMapPicker('destination')}
                      title="Pilih lokasi di peta"
                      className="shrink-0 px-3 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </button>
                  </div>
                )}
                {!editingOrder && destCoords && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs text-green-600 font-mono bg-green-50 border border-green-200 rounded-lg px-2 py-0.5">
                      ✓ {destCoords.lat.toFixed(5)}, {destCoords.lng.toFixed(5)}
                    </span>
                    <button type="button" onClick={() => setDestCoords(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Status — hanya tampil saat edit */}
              {editingOrder && (
                <div>
                  <label className={labelCls}>Status Baru <span className="text-red-400">*</span></label>
                  {validNextStatuses.length === 0 ? (
                    <div className="px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-400">
                      Status <span className="font-semibold">{STATUS_LABEL[editingOrder.status]}</span> sudah final.
                    </div>
                  ) : (
                    <>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                        className={inputCls}
                      >
                        <option value={editingOrder.status} disabled>
                          {STATUS_LABEL[editingOrder.status]} (saat ini)
                        </option>
                        {validNextStatuses.map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-1.5">
                        Dari <span className="font-medium text-slate-600">{STATUS_LABEL[editingOrder.status]}</span> → pilih status berikutnya
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Audit trail — tampil saat Edit */}
            {editingOrder && (editingOrder.created_at || editingOrder.updated_at) && (
              <div className="pt-3 mt-1 border-t border-slate-100 space-y-1">
                {editingOrder.created_at && (
                  <p className="text-xs text-slate-400">
                    Dibuat: <span className="text-slate-400"> · {new Date(editingOrder.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' })} WITA</span>
                  </p>
                )}
                {editingOrder.updated_at && (
                  <p className="text-xs text-slate-400">
                    Ubah terakhir: <span className="text-slate-400"> · {new Date(editingOrder.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' })} WITA</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting || (!!editingOrder && validNextStatuses.length === 0)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {submitting ? 'Menyimpan...' : editingOrder ? 'Simpan Perubahan' : 'Buat Order'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
          <DataTable columns={columns} data={orders} searchPlaceholder="Cari no. order..." searchColumn="order_number" />
        </div>
      )}

      <MapPickerModal
        open={mapPicker !== null}
        title={mapPicker === 'origin' ? 'Pilih Lokasi Asal' : 'Pilih Lokasi Tujuan'}
        onConfirm={(lat, lng) => {
          if (mapPicker === 'origin') setOriginCoords({ lat, lng });
          else setDestCoords({ lat, lng });
          setMapPicker(null);
        }}
        onClose={() => setMapPicker(null)}
      />

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
      />
    </div>
  );
}
