'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { orderApi } from '@/lib/api';
import { PageHeader, LoadingScreen, EmptyState, StatusBadge, CurrencyText, AppCard, PageContainer } from '@/components/ui/shared';
import { formatDateTime } from '@/lib/format';

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'buyer') { router.replace('/login'); return; }
    orderApi.myOrders().then((o: any) => {
      setOrders(o);
      if (o.length > 0) setExpanded(o[0].id); // Auto-expand nota pertama
    }).finally(() => setLoading(false));
  }, [router]);

  if (loading) return <LoadingScreen message="Memuat daftar pesanan..." />;

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader title="Pesanan Saya" subtitle="Riwayat belanja dan status kiriman" />
      
      <PageContainer>
        {orders.length === 0 ? (
          <EmptyState icon="📭" title="Belum ada pesanan" desc="Mulai belanja dari katalog sekarang." />
        ) : (
          <div className="space-y-4">
            {orders.map((o: any) => {
              const isExpanded = expanded === o.id;
              const hasRetur = parseFloat(o.total_potongan_retur) > 0;
              
              return (
                <AppCard key={o.id} className="overflow-hidden transition-all duration-300">
                  {/* Header Nota */}
                  <button 
                    className="w-full p-4 text-left focus:outline-none" 
                    onClick={() => setExpanded(isExpanded ? null : o.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order #{o.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">{formatDateTime(o.created_at)}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700">{o.items?.length || 0} Barang</p>
                      <div className="text-right">
                        {hasRetur && <p className="text-[10px] text-slate-400 line-through mb-0.5"><CurrencyText amount={o.total_tagihan} /></p>}
                        <CurrencyText amount={o.grand_total} className="text-lg" />
                      </div>
                    </div>
                  </button>

                  {/* Isi Nota (Expanded) */}
                  {isExpanded && o.items && (
                    <div className="border-t border-dashed border-slate-200 bg-slate-50/50 p-4 animate-fade-in">
                      <p className="section-kicker mb-3">Rincian Barang</p>
                      <div className="space-y-3">
                        {o.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-start text-sm gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 leading-snug">{item.nama_produk}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.qty} ball × <CurrencyText amount={item.harga_satuan} /></p>
                              {item.qty_retur > 0 && (
                                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">
                                  <span>↩️</span> Retur {item.qty_retur} ball
                                </div>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <CurrencyText amount={item.subtotal} className="text-slate-900 font-bold" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 border-t border-slate-200 pt-3 space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                          <span>Total Pembelian</span>
                          <CurrencyText amount={o.total_tagihan} />
                        </div>
                        {hasRetur && (
                          <div className="flex justify-between text-xs font-bold text-amber-600">
                            <span>Potongan Retur</span>
                            <span>- <CurrencyText amount={o.total_potongan_retur} /></span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                          <span className="text-sm font-extrabold text-slate-900">Total Tagihan</span>
                          <CurrencyText amount={o.grand_total} className="text-emerald-700 text-lg" />
                        </div>
                      </div>
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
