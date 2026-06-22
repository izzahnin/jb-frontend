'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { DriverResponse, getDrivers, createDriver, updateDriver, deleteDriver } from '@/lib/api';

type DriverForm = {
  name: string;
  license_number: string;
  phone: string;
  status: 'available' | 'on_duty' | 'off';
};

const emptyForm: DriverForm = { name: '', license_number: '', phone: '', status: 'available' };

const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
const disabledCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-400 bg-slate-50 cursor-not-allowed select-none';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';

const STATUS_STYLE: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  on_duty: 'bg-yellow-100 text-yellow-700',
  off: 'bg-slate-100 text-slate-600',
};

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  on_duty: 'On Duty',
  off: 'Off',
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null);
  const [formData, setFormData] = useState<DriverForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { void loadDrivers(); }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const res = await getDrivers();
      setDrivers(res.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data driver');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setEditingDriver(null);
    setShowForm(false);
  };

  const handleEdit = (d: DriverResponse) => {
    setEditingId(d.id);
    setEditingDriver(d);
    setFormData({ name: d.name, license_number: d.license_number, phone: d.phone, status: d.status });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setConfirmModal({
      open: true,
      title: 'Hapus Driver',
      message: 'Driver ini akan dihapus. Data tidak akan dihapus permanen.',
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }));
        try {
          await deleteDriver(id);
          await loadDrivers();
          toast.success('Driver berhasil dihapus');
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Gagal menghapus driver');
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        // is_active tidak dikirim — soft-delete diurus via tombol Hapus, bukan form
        await updateDriver(editingId, { name: formData.name, phone: formData.phone, status: formData.status });
        toast.success('Driver berhasil diperbarui');
      } else {
        await createDriver({ ...formData, is_active: true });
        toast.success('Driver berhasil ditambahkan');
      }
      resetForm();
      await loadDrivers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan driver');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<DriverResponse>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Driver',
      cell: (info) => <span className="font-medium text-slate-900">{String(info.getValue())}</span>,
    },
    {
      accessorKey: 'license_number',
      header: 'No. SIM',
      cell: (info) => <span className="font-mono text-xs">{String(info.getValue())}</span>,
    },
    { accessorKey: 'phone', header: 'Telepon', cell: (info) => String(info.getValue()) },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const s = String(info.getValue());
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[s] ?? 'bg-slate-100 text-slate-700'}`}>{STATUS_LABEL[s] ?? s}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: (info) => {
        const d = info.row.original;
        return (
          <div className="flex gap-1.5">
            <button onClick={() => handleEdit(d)} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">Edit</button>
            <button onClick={() => handleDelete(d.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors">Hapus</button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Master data pengemudi untuk dispatch trip"
        action={{ label: 'Driver Baru', onClick: () => { resetForm(); setShowForm(true); } }}
      />

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{editingId ? 'Edit Driver' : 'Tambah Driver Baru'}</h3>
              {editingId && <p className="text-xs text-slate-500 mt-0.5">No. SIM tidak dapat diubah.</p>}
            </div>
            <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Nama */}
              <div>
                <label className={labelCls}>Nama Driver <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Budi Santoso" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} required />
              </div>

              {/* No. SIM — readonly saat edit */}
              <div>
                <label className={labelCls}>
                  No. SIM <span className="text-red-400">*</span>
                  {editingId && <span className="ml-1.5 text-slate-400 font-medium normal-case tracking-normal">(tidak dapat diubah)</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="1234567890123456"
                    value={formData.license_number}
                    readOnly={!!editingId}
                    onChange={(e) => { if (!editingId) setFormData({ ...formData, license_number: e.target.value }); }}
                    className={(editingId ? disabledCls : inputCls) + ' font-mono'}
                    required={!editingId}
                  />
                  {editingId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Telepon */}
              <div>
                <label className={labelCls}>Nomor Telepon <span className="text-red-400">*</span></label>
                <input type="text" placeholder="08123456789" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} required />
              </div>

              {/* Status */}
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={formData.status}
                  disabled={editingDriver?.status === 'on_duty'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as DriverForm['status'] })}
                  className={editingDriver?.status === 'on_duty' ? disabledCls : inputCls}
                  title={editingDriver?.status === 'on_duty' ? 'Tidak bisa diubah saat driver sedang dalam trip aktif' : undefined}
                >
                  <option value="available">Available — Siap bertugas</option>
                  <option value="on_duty">On Duty — Sedang bertugas</option>
                  <option value="off">Off — Tidak aktif/cuti</option>
                </select>
                {editingDriver?.status === 'on_duty' && (
                  <div className="flex items-start gap-2 mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    Driver sedang On Duty dalam trip aktif. Status dikunci otomatis oleh sistem.
                  </div>
                )}
              </div>
            </div>

            {/* Audit trail — tampil saat Edit */}
            {editingId && (editingDriver?.created_by_name ?? editingDriver?.updated_by_name) && (
              <div className="pt-3 mt-1 border-t border-slate-100 space-y-1">
                {editingDriver?.created_by_name && (
                  <p className="text-xs text-slate-400">
                    Daftar pertama: <span className="text-slate-600 font-medium">{editingDriver.created_by_name}</span>
                    {editingDriver.created_at && (
                      <span className="text-slate-400"> · {new Date(editingDriver.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' })} WITA</span>
                    )}
                  </p>
                )}
                {editingDriver?.updated_by_name && (
                  <p className="text-xs text-slate-400">
                    Ubah terakhir: <span className="text-slate-600 font-medium">{editingDriver.updated_by_name}</span>
                    {editingDriver.updated_at && (
                      <span className="text-slate-400"> · {new Date(editingDriver.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' })} WITA</span>
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Driver'}
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
          <DataTable columns={columns} data={drivers} searchPlaceholder="Cari nama driver..." searchColumn="name" />
        </div>
      )}

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
