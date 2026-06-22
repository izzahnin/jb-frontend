'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CustomerResponse, getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/lib/api';

type CustomerForm = {
  company_name: string;
  pic_name: string;
  phone: string;
  email: string;
  address: string;
  npwp: string;
};

function formatNPWP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 15);
  let result = '';
  if (digits.length > 0) result += digits.slice(0, 2);
  if (digits.length > 2) result += '.' + digits.slice(2, 5);
  if (digits.length > 5) result += '.' + digits.slice(5, 8);
  if (digits.length > 8) result += '.' + digits.slice(8, 9);
  if (digits.length > 9) result += '-' + digits.slice(9, 12);
  if (digits.length > 12) result += '.' + digits.slice(12, 15);
  return result;
}

const emptyForm: CustomerForm = {
  company_name: '',
  pic_name: '',
  phone: '',
  email: '',
  address: '',
  npwp: '',
};

const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
const disabledCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-400 bg-slate-50 cursor-not-allowed select-none';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerResponse | null>(null);
  const [formData, setFormData] = useState<CustomerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [npwpWarning, setNpwpWarning] = useState(false);

  useEffect(() => { void loadCustomers(); }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomers();
      setCustomers(res.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setEditingCustomer(null);
    setShowForm(false);
    setNpwpWarning(false);
  };

  const handleEdit = (c: CustomerResponse) => {
    setEditingId(c.id);
    setEditingCustomer(c);
    setFormData({ company_name: c.company_name, pic_name: c.pic_name, phone: c.phone, email: c.email, address: c.address, npwp: c.npwp });
    setShowForm(true);
    setNpwpWarning(false);
  };

  const handleDelete = (id: number) => {
    setConfirmModal({
      open: true,
      title: 'Hapus Customer',
      message: 'Customer ini akan dihapus. Data tidak akan dihapus permanen.',
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }));
        try {
          await deleteCustomer(id);
          await loadCustomers();
          toast.success('Customer berhasil dihapus');
        } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal menghapus customer');
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateCustomer(editingId, {
          company_name: formData.company_name,
          pic_name: formData.pic_name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        });
        toast.success('Customer berhasil diperbarui');
      } else {
        await createCustomer(formData);
        toast.success('Customer berhasil ditambahkan');
      }
      resetForm();
      await loadCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan customer');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<CustomerResponse>[] = [
    {
      accessorKey: 'company_name',
      header: 'Perusahaan',
      cell: (info) => <span className="font-medium text-slate-900">{String(info.getValue())}</span>,
    },
    { accessorKey: 'pic_name', header: 'PIC', cell: (info) => String(info.getValue()) },
    { accessorKey: 'phone', header: 'Telepon', cell: (info) => String(info.getValue()) },
    { accessorKey: 'email', header: 'Email', cell: (info) => String(info.getValue() || '—') },
    { accessorKey: 'npwp', header: 'NPWP', cell: (info) => <span className="font-mono text-xs">{String(info.getValue() || '—')}</span> },
    {
      id: 'actions',
      header: 'Aksi',
      cell: (info) => {
        const c = info.row.original;
        return (
          <div className="flex gap-1.5">
            <button onClick={() => handleEdit(c)} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">Edit</button>
            <button onClick={() => handleDelete(c.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors">Hapus</button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Master data customer untuk pembuatan order"
        action={{ label: 'Customer Baru', onClick: () => { resetForm(); setShowForm(true); } }}
      />

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{editingId ? 'Edit Customer' : 'Tambah Customer Baru'}</h3>
              {editingId && <p className="text-xs text-slate-500 mt-0.5">NPWP tidak dapat diubah setelah disimpan.</p>}
            </div>
            <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nama Perusahaan <span className="text-red-400">*</span></label>
                <input type="text" placeholder="PT. Contoh Jaya" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Nama PIC <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Budi Santoso" value={formData.pic_name} onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Nomor Telepon <span className="text-red-400">*</span></label>
                <input type="text" placeholder="08123456789" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" placeholder="info@perusahaan.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>
                  NPWP
                  {editingId && <span className="ml-1.5 text-amber-500 font-medium normal-case tracking-normal">(tidak dapat diubah)</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="00.000.000.0-000.000"
                    value={formData.npwp}
                    readOnly={!!editingId}
                    onClick={() => { if (editingId) setNpwpWarning(true); }}
                    onChange={(e) => { if (!editingId) setFormData({ ...formData, npwp: formatNPWP(e.target.value) }); }}
                    className={editingId ? disabledCls : inputCls}
                  />
                  {editingId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </div>
                  )}
                </div>
                {npwpWarning && editingId && (
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    NPWP tidak dapat diubah setelah customer dibuat.
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Alamat</label>
                <input type="text" placeholder="Jl. Contoh No. 1, Makassar" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputCls} />
              </div>
            </div>

            {/* Audit trail — tampil saat Edit */}
            {editingId && (editingCustomer?.created_by_name ?? editingCustomer?.updated_by_name) && (
              <div className="pt-3 mt-1 border-t border-slate-100 space-y-1">
                {editingCustomer?.created_by_name && (
                  <p className="text-xs text-slate-400">
                    Daftar pertama: <span className="text-slate-600 font-medium">{editingCustomer.created_by_name}</span>
                    {editingCustomer.created_at && (
                      <span className="text-slate-400"> · {new Date(editingCustomer.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' })} WITA</span>
                    )}
                  </p>
                )}
                {editingCustomer?.updated_by_name && (
                  <p className="text-xs text-slate-400">
                    Ubah terakhir: <span className="text-slate-600 font-medium">{editingCustomer.updated_by_name}</span>
                    {editingCustomer.updated_at && (
                      <span className="text-slate-400"> · {new Date(editingCustomer.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Makassar' })} WITA</span>
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Customer'}
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
          <DataTable columns={columns} data={customers} searchPlaceholder="Cari nama perusahaan..." searchColumn="company_name" />
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
