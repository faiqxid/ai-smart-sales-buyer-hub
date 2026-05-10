'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { getUser, logout } from '@/lib/auth';
import { getLocalNotifications, markNotificationsRead, clearLocalNotifications, onNotificationsUpdated, type LocalNotification } from '@/lib/notifications';
import { AppButton, AppCard, Field, LoadingScreen, PageContainer, PageHeader, PageSection } from '@/components/ui/shared';

type Profile = {
  id: string;
  username: string;
  role: string;
  nama_lengkap?: string;
  nama_toko?: string;
  nomor_hp: string;
  alamat?: string;
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Barusan';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [form, setForm] = useState({ nama_lengkap: '', nama_toko: '', nomor_hp: '', alamat: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'profile' | 'notif'>('notif');

  useEffect(() => {
    const user = getUser();
    if (!user) { router.replace('/login'); return; }

    authApi.me()
      .then((data) => {
        setProfile(data);
        setForm({ nama_lengkap: data.nama_lengkap || '', nama_toko: data.nama_toko || '', nomor_hp: data.nomor_hp || '', alamat: data.alamat || '' });
      })
      .catch((err) => setError(err.message || 'Gagal memuat profile'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const load = () => setNotifications(getLocalNotifications());
    load();
    return onNotificationsUpdated(load);
  }, []);

  // Mark all read when notifications tab opened
  useEffect(() => {
    if (tab === 'notif') markNotificationsRead();
  }, [tab]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      const updated = await authApi.updateProfile(form) as Profile;
      setProfile(updated);
      const oldUser = getUser();
      if (oldUser) {
        localStorage.setItem('user', JSON.stringify({
          ...oldUser,
          nama_toko: updated.nama_toko,
          nama_lengkap: updated.nama_lengkap,
          nomor_hp: updated.nomor_hp,
        }));
      }
      setMessage('Profile berhasil diperbarui');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen message="Memuat profile akun..." />;

  const backHref = profile?.role === 'sales' ? '/sales/dashboard' : '/buyer/dashboard';

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader title="Profile & Notifikasi" subtitle="Akun dan riwayat notifikasi" />

      <PageContainer>
        {/* User Card */}
        <AppCard className="bg-slate-950 text-white border-slate-900">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 text-2xl">
              {profile?.role === 'sales' ? '🛵' : '🏪'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {profile?.role === 'sales' ? 'Akun Sales' : 'Akun Buyer'}
              </p>
              <h2 className="mt-1 truncate text-xl font-extrabold">{profile?.nama_lengkap || profile?.nama_toko || profile?.username}</h2>
              <p className="mt-1 truncate text-sm text-slate-300">@{profile?.username}</p>
            </div>
          </div>
        </AppCard>

        {/* Tabs */}
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('notif')}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${tab === 'notif' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500'}`}
          >
            🔔 Notifikasi {notifications.filter(n => !n.read).length > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{notifications.filter(n => !n.read).length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${tab === 'profile' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500'}`}
          >
            👤 Edit Profile
          </button>
        </div>

        {/* Notification List */}
        {tab === 'notif' && (
          <PageSection
            title="Riwayat Notifikasi"
            action={
              notifications.length > 0 ? (
                <button onClick={clearLocalNotifications} className="text-xs font-bold text-red-500">Hapus Semua</button>
              ) : undefined
            }
          >
            {notifications.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-3xl mb-2">🔕</p>
                <p className="font-extrabold text-slate-700">Belum ada notifikasi</p>
                <p className="text-sm text-slate-500 mt-1">Notifikasi masuk akan muncul di sini.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className={`card flex gap-3 items-start ${!n.read ? 'border-emerald-200 bg-emerald-50' : ''}`}>
                    <span className="mt-0.5 text-xl shrink-0">{n.type === 'order' ? '🧾' : n.type === 'test' || n.type === 'test_notification' ? '🧪' : '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-slate-900 truncate">{n.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"></span>}
                  </div>
                ))}
              </div>
            )}
          </PageSection>
        )}

        {/* Edit Profile */}
        {tab === 'profile' && (
          <PageSection title="Data Profile" description="Update data agar kontak dan identitas toko tetap akurat.">
            <form onSubmit={handleSubmit} className="card space-y-4">
              {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}
              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

              <Field label="Nama Lengkap">
                <input className="input" value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} placeholder="Nama pemilik / sales" />
              </Field>
              <Field label="Nama Toko">
                <input className="input" value={form.nama_toko} onChange={(e) => setForm({ ...form, nama_toko: e.target.value })} placeholder="Contoh: Toko Barokah" />
              </Field>
              <Field label="Nomor HP / WhatsApp">
                <input className="input" value={form.nomor_hp} onChange={(e) => setForm({ ...form, nomor_hp: e.target.value })} placeholder="08xxxxxxxxxx" />
              </Field>
              <Field label="Alamat">
                <textarea className="input min-h-[96px] resize-none" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat toko / area operasional" />
              </Field>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <AppButton type="button" variant="secondary" onClick={() => router.push(backHref)}>Kembali</AppButton>
                <AppButton type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</AppButton>
              </div>
            </form>
          </PageSection>
        )}

        <PageSection title="Akun">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-extrabold text-red-700"
          >
            🚪 Keluar dari akun
          </button>
        </PageSection>
      </PageContainer>
    </div>
  );
}
