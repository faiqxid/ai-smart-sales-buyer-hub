'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { PageHeader, AppCard, AppButton, Field, ErrorState } from '@/components/ui/shared';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(form.username.toLowerCase().trim(), form.password) as any;
      saveAuth(data);
      const nextPath = data.role === 'admin' ? '/admin' : data.role === 'sales' ? '/sales/dashboard' : '/buyer/dashboard';
      router.replace(nextPath);
    } catch (err: any) {
      setError(err.message || 'Username atau password salah');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-app">
      <PageHeader title="Masuk Akun" />
      
      <div className="mx-auto w-full max-w-sm px-4 py-10 animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-xl">
            <img src="/icons/icon-128x128.png" alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950">Selamat Datang</h2>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-[240px]">
            Gunakan username dan password yang sudah terdaftar.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorState title="Masuk Gagal" desc={error} />
          </div>
        )}

        <AppCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Username">
              <input
                className="input"
                type="text"
                placeholder="Masukkan username"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
                autoComplete="username"
                disabled={loading}
              />
            </Field>

            <Field label="Password">
              <input
                className="input"
                type="password"
                placeholder="Masukkan password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </Field>

            <AppButton type="submit" className="w-full py-4 text-base" disabled={loading}>
              {loading ? '🔐 Memproses...' : '🔓 Masuk Sekarang'}
            </AppButton>
          </form>
        </AppCard>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Punya toko tapi belum punya akun?
          </p>
          <Link href="/register" className="mt-2 inline-block font-extrabold text-emerald-600">
            Daftar Toko Baru ›
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600 transition-colors">Beranda</Link>
          <span>•</span>
          <p>Bantuan Admin</p>
        </div>
      </div>
    </main>
  );
}
