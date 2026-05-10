'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

export default function AdminDashboardPage() {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.health().then(setHealth).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Admin</p>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Sistem</h1>
        <p className="text-slate-500 mt-1">Pantau status integrasi dan konfigurasi inti aplikasi.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Gemini AI</p>
          <p className="mt-2 text-2xl font-bold">{health?.integrations?.gemini ? 'Aktif ✅' : 'Belum Setup ⚠️'}</p>
          <a href="/admin/integrations" className="mt-4 inline-block text-sm font-semibold text-blue-600">Kelola Gemini →</a>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Firebase FCM</p>
          <p className="mt-2 text-2xl font-bold">{health?.integrations?.firebase ? 'Aktif ✅' : 'Belum Setup ⚠️'}</p>
          <a href="/admin/integrations" className="mt-4 inline-block text-sm font-semibold text-blue-600">Kelola Firebase →</a>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold text-lg">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/admin/users" className="rounded-xl bg-slate-900 px-4 py-2 text-white text-sm font-semibold">Manajemen User</a>
          <a href="/admin/integrations" className="rounded-xl bg-blue-600 px-4 py-2 text-white text-sm font-semibold">Setup Integrasi</a>
        </div>
      </div>
    </div>
  );
}
