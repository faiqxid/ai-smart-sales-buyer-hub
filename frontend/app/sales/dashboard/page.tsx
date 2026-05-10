'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { orderApi, preOrderApi, productApi } from '@/lib/api';
import { PageHeader, LoadingScreen, PageContainer, PageSection, StatCard, ActionCard, StatusBadge, CurrencyText } from '@/components/ui/shared';
import { formatRupiah, formatDateTime } from '@/lib/format';

export default function SalesDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [preOrders, setPreOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    if (u.role !== 'sales') { router.replace('/buyer/dashboard'); return; }
    setUser(u);
    Promise.all([orderApi.listAll(), preOrderApi.listAll(), productApi.list(false)])
      .then(([o, p, prod]: any) => { setOrders(o); setPreOrders(p); setProducts(prod); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <LoadingScreen message="Menyiapkan pusat kontrol sales..." />;

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o: any) => new Date(o.created_at).toDateString() === today);
  const pendingOrders = orders.filter((o: any) => o.status === 'pending');
  const lowStock = products.filter((p: any) => p.stok_ball > 0 && p.stok_ball <= 5);
  const outOfStock = products.filter((p: any) => p.stok_ball === 0);
  const pendingPO = preOrders.filter((p: any) => p.status === 'pending');
  const omsetHariIni = todayOrders.reduce((s: number, o: any) => s + parseFloat(o.grand_total || 0), 0);

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader
        title={`${user?.nama_lengkap || 'Sales'} 👋`}
        subtitle="Pusat Kontrol Sales"
        
      />

      <PageContainer>
        {/* Omset Highlight */}
        <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Omset hari ini</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatRupiah(omsetHariIni)}</p>
          <p className="mt-2 text-sm text-slate-300">{todayOrders.length} order masuk hari ini</p>
        </div>

        <PageSection title="Kondisi Lapangan">
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon="⏳" label="Pending" value={pendingOrders.length} tone={pendingOrders.length > 0 ? 'warning' : 'default'} />
            <StatCard icon="⚠️" label="Menipis" value={lowStock.length} tone={lowStock.length > 0 ? 'warning' : 'default'} />
            <StatCard icon="🚫" label="Habis" value={outOfStock.length} tone={outOfStock.length > 0 ? 'danger' : 'default'} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <StatCard icon="📝" label="Inden" value={pendingPO.length} tone={pendingPO.length > 0 ? 'primary' : 'default'} />
            <StatCard icon="📦" label="Total Produk" value={products.length} />
          </div>
        </PageSection>

        <PageSection title="Aksi Cepat">
          <div className="grid gap-2">
            <ActionCard href="/sales/ai-briefing" icon="🤖" title="Briefing AI" desc="Minta ringkasan kerja harian dari asisten AI." tone="primary" />
            <div className="grid grid-cols-2 gap-2">
              <ActionCard href="/sales/products" icon="📦" title="Kelola Produk" desc="Stok & harga" />
              <ActionCard href="/sales/orders" icon="📋" title="Kelola Order" desc="Status & retur" />
              <ActionCard href="/sales/pre-orders" icon="⏳" title="Kelola Inden" desc="Antrean toko" />
              <ActionCard href="/sales/returns" icon="↩️" title="Daftar Retur" desc="Barang ditarik" />
            </div>
          </div>
        </PageSection>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <PageSection title="Order Terbaru" action={<Link href="/sales/orders" className="text-xs font-bold text-emerald-600">Semua ›</Link>}>
            <div className="space-y-2">
              {orders.slice(0, 5).map((o: any) => (
                <Link href="/sales/orders" key={o.id} className="card flex items-center justify-between hover:border-emerald-300 transition-all active:scale-[0.99]">
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 text-sm truncate">{o.nama_toko || 'Pembeli'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{formatDateTime(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <CurrencyText amount={o.grand_total} />
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              ))}
            </div>
          </PageSection>
        )}

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <PageSection title="⚠️ Stok Menipis">
            <div className="space-y-1.5">
              {lowStock.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-bold text-amber-900">{p.nama_produk}</p>
                  <p className="text-xs font-extrabold text-amber-700">{p.stok_ball} ball</p>
                </div>
              ))}
            </div>
          </PageSection>
        )}
      </PageContainer>
    </div>
  );
}
