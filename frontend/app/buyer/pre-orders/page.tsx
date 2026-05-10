'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { preOrderApi } from '@/lib/api';
import { PageHeader, LoadingScreen, EmptyState, StatusBadge, AppCard, PageContainer, PageSection } from '@/components/ui/shared';
import { formatDateTime } from '@/lib/format';

export default function BuyerPreOrdersPage() {
  const router = useRouter();
  const [preOrders, setPreOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'buyer') { router.replace('/login'); return; }
    preOrderApi.myPreOrders().then((p: any) => setPreOrders(p)).finally(() => setLoading(false));
  }, [router]);

  if (loading) return <LoadingScreen message="Memeriksa antrean inden..." />;

  const pending = preOrders.filter((p: any) => p.status === 'pending');
  const others = preOrders.filter((p: any) => p.status !== 'pending');

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader title="Antrean Inden" subtitle="Status barang yang Anda pesan saat stok kosong" />
      
      <PageContainer>
        {preOrders.length === 0 ? (
          <EmptyState icon="⏳" title="Belum ada inden" desc="Anda bisa memesan barang yang habis stok melalui menu Katalog, dan akan muncul di sini." />
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed">
              <p className="font-extrabold flex items-center gap-2 mb-1">💡 Cara kerja inden</p>
              Pesanan inden akan diproses oleh sales saat stok baru masuk ke gudang. Status akan berubah menjadi <b>Sudah Cocok</b> atau <b>Terpenuhi</b>.
            </div>

            {pending.length > 0 && (
              <PageSection title="Menunggu Stok">
                <div className="space-y-3">
                  {pending.map((p: any) => (
                    <AppCard key={p.id} className="p-4 border-l-4 border-l-amber-500">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{formatDateTime(p.created_at)}</p>
                          <p className="font-extrabold text-slate-900 leading-snug">{p.nama_produk}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="text-xs font-medium text-slate-500">Minta: <b className="text-slate-950">{p.qty_request} ball</b></div>
                            {p.qty_matched > 0 && (
                              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">Terpenuhi: {p.qty_matched} ball</div>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </AppCard>
                  ))}
                </div>
              </PageSection>
            )}

            {others.length > 0 && (
              <PageSection title="Riwayat Inden">
                <div className="space-y-2">
                  {others.map((p: any) => (
                    <AppCard key={p.id} className="p-4 opacity-75">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-600 truncate">{p.nama_produk}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">{formatDateTime(p.created_at)} · {p.qty_request} ball</p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </AppCard>
                  ))}
                </div>
              </PageSection>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
