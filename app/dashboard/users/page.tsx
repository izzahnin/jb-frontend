'use client';

import { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import { getUsers, createUser, deleteUser, UserResponse } from '@/lib/api';
import { useAuth } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { ConfirmModal } from '@/components/ConfirmModal';

const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';

const ROLE_STYLE: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin_sales: 'bg-blue-100 text-blue-700',
  admin_ops: 'bg-green-100 text-green-700',
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_sales: 'Admin Sales',
  admin_ops: 'Admin Ops',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'admin_sales' as UserResponse['role'],
  });

  useEffect(() => { void loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createUser(formData.username, formData.password, formData.role, formData.full_name);
      setFormData({ username: '', full_name: '', password: '', role: 'admin_sales' });
      setShowForm(false);
      await loadUsers();
      toast.success('User berhasil dibuat');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number, username: string) => {
    setConfirmModal({
      open: true,
      title: 'Nonaktifkan User',
      message: `Akun "${username}" akan dinonaktifkan. Admin tidak dapat login setelah ini.`,
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }));
        try {
          await deleteUser(id);
          await loadUsers();
          toast.success('User berhasil dinonaktifkan');
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Gagal menonaktifkan user');
        }
      },
    });
  };

  const columns: ColumnDef<UserResponse>[] = [
    {
      accessorKey: 'username',
      header: 'Username',
      cell: (info) => <span className="font-mono font-semibold text-slate-900 text-xs">{String(info.getValue())}</span>,
    },
    {
      accessorKey: 'full_name',
      header: 'Nama Lengkap',
      cell: (info) => String(info.getValue() || '—'),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: (info) => {
        const role = String(info.getValue());
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLE[role] ?? 'bg-slate-100 text-slate-700'}`}>{ROLE_LABEL[role] ?? role}</span>;
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: (info) => info.getValue()
        ? <span className="text-xs font-semibold text-green-600">Aktif</span>
        : <span className="text-xs font-semibold text-slate-400">Nonaktif</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Dibuat',
      cell: (info) => new Date(String(info.getValue())).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: (info) => {
        const u = info.row.original;
        if (currentUser?.id === u.id) return null;
        if (!u.is_active) return <span className="text-xs text-slate-400">Nonaktif</span>;
        return (
          <button onClick={() => handleDelete(u.id, u.username)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors">
            Nonaktifkan
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manajemen akun admin sistem"
        action={{ label: 'User Baru', onClick: () => setShowForm((p) => !p) }}
      />

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Buat User Admin Baru</h3>
              <p className="text-xs text-slate-500 mt-0.5">Username tidak dapat diubah setelah dibuat.</p>
            </div>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Username <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="admin_budi"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={inputCls + ' font-mono'}
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Budi Santoso"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Password <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={inputCls + ' pr-11'}
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    }
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Role <span className="text-red-400">*</span></label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserResponse['role'] })} className={inputCls}>
                  <option value="admin_sales">Admin Sales</option>
                  <option value="admin_ops">Admin Ops</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {submitting ? 'Membuat...' : 'Buat User'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <DataTable columns={columns} data={users} searchPlaceholder="Cari username..." searchColumn="username" />
        </div>
      )}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Ya, Nonaktifkan"
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
      />
    </div>
  );
}
