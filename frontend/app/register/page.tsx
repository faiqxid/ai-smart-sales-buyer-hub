'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { PageHeader, AppCard, AppButton, Field, ErrorState } from '@/components/ui/shared';
import { normalizePhone } from '@/lib/phone';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '', password: '', nama_toko: '', nomor_hp: '', alamat: '', nama_lengkap: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password minimal 6 karakter agar akun toko lebih aman.');
      return;
    }
    if (!form.nomor_hp.match(/^(\+?62|0|8)[0-9\s-]{7,}$/)) {
      setError('Nomor HP belum valid. Gunakan format 08xxxxxxxxxx atau 62xxxxxxxxxx.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        username: form.username.toLowerCase().trim(),
        nomor_hp: normalizePhone(form.nomor_hp),
      };
      const data = await authApi.register(payload) as any;
      saveAuth(data);
      router.replace('/buyer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-app">
      <PageHeader title="Daftar Toko" subtitle="Buat akun buyer untuk mulai pesan barang" />

      <div className="mx-auto w-full max-w-md px-4 py-6 animate-fade-in">
        <div className="mb-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex gap-3">
            <span className="text-2xl">🏪</span>
            <div>
              <p className="font-extrabold text-emerald-900">Akun untuk pemilik toko</p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-800/80">
                Nomor HP dipakai untuk WhatsApp/call, jadi pastikan aktif dan benar.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5">
            <ErrorState title="Data belum lengkap" desc={error} />
          </div>
        )}

        <AppCard className="p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Toko" helper="Nama yang biasa dikenal sales.">
                <input className="input" placeholder="Toko Makmur Jaya" value={form.nama_toko} onChange={set('nama_toko')} required disabled={loading} />
              </Field>
              <Field label="Nama Pemilik">
                <input className="input" placeholder="Nama pemilik" value={form.nama_lengkap} onChange={set('nama_lengkap')} disabled={loading} />
              </Field>
            </div>

            <Field label="Nomor HP / WhatsApp" helper="Contoh: 08123456789. Akan dinormalisasi otomatis ke format 62.">
              <input className="input" type="tel" inputMode="tel" placeholder="08123456789" value={form.nomor_hp} onChange={set('nomor_hp')} required disabled={loading} />
            </Field>

            <Field label="Alamat Toko" helper="Tulis patokan sederhana agar sales mudah mengantar.">
              <textarea className="input min-h-[92px] resize-none" placeholder="Jl. Melati No. 12, dekat pasar..." value={form.alamat} onChange={set('alamat')} required disabled={loading} />
            </Field>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-4">
              <p className="section-kicker">Info Login</p>
              <Field label="Username">
                <input className="input" placeholder="contoh: tokoberkah" value={form.username} onChange={set('username')} required autoComplete="username" disabled={loading} />
              </Field>
              <Field label="Password" helper="Minimal 6 karakter.">
                <input className="input" type="password" placeholder="Buat password" value={form.password} onChange={set('password')} required autoComplete="new-password" disabled={loading} />
              </Field>
            </div>

            <AppButton type="submit" className="w-full py-4 text-base" disabled={loading}>
              {loading ? '⏳ Membuat akun...' : '✅ Buat Akun Toko'}
            </AppButton>
          </form>
        </AppCard>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun? <Link href="/login" className="font-extrabold text-emerald-600">Masuk di sini</Link>
        </p>
      </div>
    </main>
  );
}
