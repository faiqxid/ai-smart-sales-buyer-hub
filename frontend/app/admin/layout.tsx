'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'admin') {
      router.replace('/');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return null;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="/admin" className="block px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">Dashboard</a>
          <a href="/admin/integrations" className="block px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">Integrations</a>
          <a href="/admin/users" className="block px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-medium">User Management</a>
        </nav>
        <div className="p-4 border-t border-slate-200 text-sm text-slate-500">
          <a href="/profile" className="hover:text-slate-800">← Kembali ke Profil</a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Nav (Simple Bottom Bar for MVP) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t flex justify-around p-3 z-50">
        <a href="/admin" className="text-sm font-medium">Dashboard</a>
        <a href="/admin/integrations" className="text-sm font-medium">Setup</a>
        <a href="/admin/users" className="text-sm font-medium">Users</a>
      </nav>
    </div>
  );
}