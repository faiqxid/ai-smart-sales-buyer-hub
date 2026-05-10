'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { preOrderApi } from '@/lib/api';
import { PageHeader, LoadingScreen, EmptyState, StatusBadge, AppCard, PageContainer } from '@/components/ui/shared';
import { formatDateTime } from '@/lib/format';

const STATUSES = ['pending', 'matched', 'fulfilled', 'cancelled'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Menunggu',
  matched: 'Stok Cocok',
  fulfilled: 'Selesai',
  cancelled: 'Batal',
};

export default function SalesPreOrdersPage() {
  const router = useRouter();
  const [preOrders, setPreOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'sales') { router.replace('/login'); return; }
    load();
  }, [router]);

  async function load() {
    setLoading(true);
    preOrderApi.listAll().then((p: any) => setPreOrders(p)).finally(() => setLoading(false));
  }

  async function handleStatus(id: string, status: string) {
    try {
      await preOrderApi.updateStatus(id, status);
      setMsg('Status inden berhasil diperbarui.');
      load();
    } catch (err: any) { setMsg(`Gagal: ${err.message}`); }
  }

  const filtered = filter === 'all' ? preOrders : preOrders.filter((p: any) => p.status === filter);
  const pending = preOrders.filter((p: any) => p.status === 'pending').length;
  const matched = preOrders.filter((p: any) => p.status === 'matched').length;
  const fulfilled = preOrders.filter((p: any) => p.status === 'fulfilled').length;

  if (loading) return <LoadingScreen message="Memuat antrean inden..." />;

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader title="Antrean Inden" subtitle={`${preOrders.length} permintaan barang kosong`} />
      <PageContainer>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center">
            <p className="text-2xl font-extrabold text-amber-900">{pending}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Menunggu</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-2xl font-extrabold text-emerald-900">{matched}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Stok Cocok</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-2xl font-extrabold text-slate-900">{fulfilled}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Selesai</p>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Cara kerja inden</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-900">
            Saat stok ditambah, sistem akan mencoba mencocokkan antrean inden. Sales tinggal tandai status sesuai realisasi di lapangan.
          </p>
        </div>

        <div className="filter-scroll">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filter === s ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {s === 'all' ? 'Semua' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {msg && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">✅ {msg}</div>}

        {filtered.length === 0 ? (
          <EmptyState icon="⏳" title="Tidak ada inden" desc="Belum ada permintaan pada status ini." />
        ) : (
          <div className="space-y-3">
            {filtered.map((po: any) => {
              const progress = Number(po.qty_request || 0) > 0 ? Math.min(100, Math.round((Number(po.qty_matched || 0) / Number(po.qty_request || 1)) * 100)) : 0;
              return (
                <AppCard key={po.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{formatDateTime(po.created_at)}</p>
                      <p className="mt-1 font-extrabold text-slate-950 leading-tight">{po.nama_toko || 'Toko'}</p>
                      <p className="text-sm font-bold text-emerald-700">{po.nama_produk}</p>
                    </div>
                    <StatusBadge status={po.status} />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>Minta {po.qty_request} ball</span>
                      <span>Terpenuhi {po.qty_matched || 0} ball</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {po.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatus(po.id, 'matched')} className="btn-success text-xs px-3 py-2">Tandai Stok Cocok</button>
                        <button onClick={() => handleStatus(po.id, 'cancelled')} className="btn-danger text-xs px-3 py-2">Batalkan</button>
                      </>
                    )}
                    {po.status === 'matched' && (
                      <button onClick={() => handleStatus(po.id, 'fulfilled')} className="btn-success text-xs px-4 py-2">Selesai Diantar</button>
                    )}
                  </div>
                </AppCard>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
