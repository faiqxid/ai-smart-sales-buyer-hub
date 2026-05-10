'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { orderApi } from '@/lib/api';
import { PageHeader, LoadingScreen, EmptyState, AppCard, PageContainer, WhatsAppButton } from '@/components/ui/shared';
import { RETUR_LABELS } from '@/lib/format';
import { toWaLink } from '@/lib/phone';

const RETUR_STATUSES = ['perlu_ditarik', 'sudah_ditarik', 'rusak', 'expired'];

const RETUR_TONE: Record<string, { border: string; badge: string; bg: string; label: string; text: string }> = {
  perlu_ditarik: { border: 'border-l-red-500',   badge: 'bg-red-100 text-red-800 border-red-200',    bg: 'bg-red-50',    label: '❗ Harus Ditarik', text: 'text-red-900' },
  sudah_ditarik: { border: 'border-l-emerald-500',badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', bg: 'bg-emerald-50', label: '✅ Sudah Ditarik', text: 'text-emerald-900' },
  rusak:         { border: 'border-l-amber-500',  badge: 'bg-amber-100 text-amber-800 border-amber-200', bg: 'bg-amber-50',    label: '🔧 Rusak',       text: 'text-amber-900' },
  expired:       { border: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-800 border-purple-200', bg: 'bg-purple-50', label: '⏰ Expired',  text: 'text-purple-900' },
};

export default function SalesReturnsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('perlu_ditarik');

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'sales') { router.replace('/login'); return; }
    loadReturns();
  }, [router]);

  async function loadReturns() {
    setLoading(true);
    try {
      const orders: any = await orderApi.listAll();
      const allItems: any[] = [];
      for (const order of orders) {
        const detail: any = await orderApi.get(order.id);
        if (detail.items) {
          detail.items
            .filter((item: any) => item.status_retur !== 'tidak_retur')
            .forEach((item: any) => {
              allItems.push({ ...item, order_id: order.id, nama_toko: order.nama_toko, nomor_hp: order.nomor_hp, order_date: order.created_at });
            });
        }
      }
      setItems(allItems);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status_retur === filter);

  if (loading) return <LoadingScreen message="Memuat daftar retur..." />;

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader title="Retur Barang" subtitle={`${items.length} item perlu diperhatikan`} />
      <PageContainer>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RETUR_STATUSES.map(s => {
            const tone = RETUR_TONE[s];
            const count = items.filter(i => i.status_retur === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`rounded-2xl border-2 p-3 text-center transition-all ${filter === s ? `${tone.bg} ${tone.border.replace('border-l-', 'border-')}` : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <p className={`text-2xl font-extrabold ${filter === s ? tone.text : 'text-slate-800'}`}>{count}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wide ${filter === s ? tone.text : 'text-slate-500'}`}>{RETUR_LABELS[s]}</p>
              </button>
            );
          })}
        </div>

        <div className="filter-scroll">
          {['all', ...RETUR_STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filter === s ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {s === 'all' ? 'Semua' : RETUR_LABELS[s]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="✅" title={filter === 'perlu_ditarik' ? 'Semua retur sudah ditangani!' : 'Tidak ada item'} desc={filter === 'perlu_ditarik' ? 'Tidak ada barang yang perlu ditarik hari ini.' : undefined} />
        ) : (
          <div className="space-y-3">
            {filtered.map((item: any, idx: number) => {
              const tone = RETUR_TONE[item.status_retur] || RETUR_TONE.rusak;
              return (
                <AppCard key={`${item.id}-${idx}`} className={`p-4 border-l-4 ${tone.border}`}>
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-950 leading-snug">{item.nama_produk}</p>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">{item.nama_toko}</p>
                    </div>
                    <span className={`shrink-0 rounded-xl border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${tone.badge}`}>{RETUR_LABELS[item.status_retur]}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Qty Retur</p>
                      <p className="font-extrabold text-slate-900">{item.qty_retur} ball</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Alasan</p>
                      <p className="font-bold text-slate-700">{item.alasan_retur || '-'}</p>
                    </div>
                    {item.estimasi_expired && (
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Estimasi Expired</p>
                        <p className="font-bold text-amber-700">{item.estimasi_expired}</p>
                      </div>
                    )}
                  </div>

                  {item.nomor_hp && (
                    <div className="mt-4 flex gap-2">
                      <WhatsAppButton phone={item.nomor_hp} label={`WA ${item.nama_toko}`} className="text-xs" />
                    </div>
                  )}
                </AppCard>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
