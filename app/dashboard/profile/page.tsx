'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/hooks';
import { updateProfile } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin_sales: 'Admin Sales',
  admin_ops: 'Admin Ops',
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin_sales: 'bg-blue-100 text-blue-700',
  admin_ops: 'bg-emerald-100 text-emerald-700',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload: { full_name?: string; password?: string } = {};
    if (fullName.trim() && fullName.trim() !== user.full_name) {
      payload.full_name = fullName.trim();
    }
    if (password) {
      if (password.length < 6) {
        toast.error('Password minimal 6 karakter');
        return;
      }
      payload.password = password;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('Tidak ada perubahan');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile(payload);
      if (payload.full_name) {
        updateUser({ full_name: payload.full_name });
      }
      toast.success(res?.message ?? 'Profil berhasil diperbarui');
      setPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

  return (
    <ProtectedRoute>
      <PageHeader title="Profil Saya" description="Kelola informasi akun Anda" />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Kolom kiri — Kartu Identitas */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Dark header */}
            <div className="bg-slate-900 px-6 py-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-bold text-white mb-3">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <p className="text-white font-semibold text-lg leading-tight">{user?.full_name || user?.username}</p>
              <p className="text-slate-400 text-sm mt-0.5">@{user?.username}</p>
            </div>

            {/* Info rows */}
            <div className="divide-y divide-slate-100">
              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs text-slate-500">Role</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user ? (ROLE_COLOR[user.role] ?? 'bg-slate-100 text-slate-700') : ''}`}>
                  {user ? (ROLE_LABEL[user.role] ?? user.role) : '-'}
                </span>
              </div>
              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs text-slate-500">Username</span>
                <span className="text-xs font-medium text-slate-800 font-mono">{user?.username}</span>
              </div>
              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs text-slate-500">Bergabung</span>
                <span className="text-xs font-medium text-slate-800">{joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom kanan — Form Edit */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Edit Informasi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Username tidak dapat diubah</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={user?.username ?? ''}
                  disabled
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Username bersifat unik dan tidak dapat diubah</p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password Baru
                  <span className="ml-1.5 text-slate-400 font-normal text-xs">(kosongkan jika tidak ingin ubah)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-11 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
