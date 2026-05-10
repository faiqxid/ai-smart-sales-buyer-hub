'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type User = {
  id: string;
  username: string;
  role: string;
  nama_lengkap?: string;
  nama_toko?: string;
  nomor_hp?: string;
  alamat?: string;
  created_at?: string;
};

const roleLabel: Record<string, string> = { admin: 'Admin', sales: 'Sales', buyer: 'Buyer' };
const roleColor: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  sales: 'bg-amber-100 text-amber-700',
  buyer: 'bg-blue-100 text-blue-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal create
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ username: '', password: '', role: 'buyer', nama_lengkap: '', nama_toko: '', nomor_hp: '', alamat: '' });

  // Modal reset password
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const data: any = await adminApi.listUsers();
      setUsers(data.items || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await adminApi.createUser(createData);
      setMessage('User berhasil dibuat');
      setShowCreate(false);
      setCreateData({ username: '', password: '', role: 'buyer', nama_lengkap: '', nama_toko: '', nomor_hp: '', alamat: '' });
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPw = async () => {
    if (!resetTarget) return;
    setLoading(true);
    try {
      await adminApi.resetUserPassword(resetTarget.id, newPassword);
      setMessage('Password berhasil direset');
      setResetTarget(null);
      setNewPassword('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.username.toLowerCase().includes(q) || (u.nama_lengkap || '').toLowerCase().includes(q) || (u.nama_toko || '').toLowerCase().includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen User</h1>
          <p className="text-slate-500 mt-1">Kelola akun Admin, Sales, dan Buyer.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-white font-semibold text-sm">
          + Tambah User
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">{error}</div>}
      {message && <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 text-sm">{message}</div>}

      {/* Filter & Search */}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Cari nama/username..."
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="sales">Sales</option>
          <option value="buyer">Buyer</option>
        </select>
        <span className="text-sm text-slate-500 self-center">{filtered.length} user</span>
      </div>

      {/* User Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Username</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Nama / Toko</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500">No. HP</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-slate-600">{u.nama_lengkap || u.nama_toko || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColor[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {roleLabel[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.nomor_hp || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setResetTarget(u); setNewPassword(''); }} className="text-blue-600 text-xs font-semibold hover:underline">Reset PW</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Tidak ada user</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between">
              <h2 className="text-lg font-bold">Tambah User Baru</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Username *', key: 'username', type: 'text' },
                { label: 'Password *', key: 'password', type: 'password' },
                { label: 'Nama Lengkap', key: 'nama_lengkap', type: 'text' },
                { label: 'Nama Toko', key: 'nama_toko', type: 'text' },
                { label: 'Nomor HP *', key: 'nomor_hp', type: 'text' },
                { label: 'Alamat', key: 'alamat', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold mb-1">{label}</label>
                  <input
                    type={type}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 text-sm"
                    value={(createData as any)[key]}
                    onChange={(e) => setCreateData(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold mb-1">Role *</label>
                <select
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500"
                  value={createData.role}
                  onChange={(e) => setCreateData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="buyer">Buyer</option>
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700">Batal</button>
              <button disabled={loading} onClick={handleCreate} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Buat User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between">
              <h2 className="text-lg font-bold">Reset Password</h2>
              <button onClick={() => setResetTarget(null)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Reset password untuk user <strong>{resetTarget.username}</strong>.</p>
              <div>
                <label className="block text-sm font-semibold mb-1">Password Baru</label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setResetTarget(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700">Batal</button>
              <button disabled={loading || newPassword.length < 6} onClick={handleResetPw} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {loading ? 'Mereset...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
