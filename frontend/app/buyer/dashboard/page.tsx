'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { orderApi, preOrderApi } from '@/lib/api';
import { PageHeader, LoadingScreen, PageContainer, PageSection, StatCard, ActionCard, StatusBadge, CurrencyText } from '@/components/ui/shared';
import { formatDateTime } from '@/lib/format';
import { toWaLink } from '@/lib/phone';

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [preOrders, setPreOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'buyer') {
      router.replace(u?.role === 'sales' ? '/sales/dashboard' : '/login');
      return;
    }
    setUser(u);
    Promise.all([orderApi.myOrders(), preOrderApi.myPreOrders()])
      .then(([o, p]: any) => { setOrders(o); setPreOrders(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <LoadingScreen message="Menyiapkan meja kerja toko..." />;

  const activeOrders = orders.filter((o: any) => !['completed', 'cancelled'].includes(o.status));
  const pendingPreOrders = preOrders.filter((p: any) => p.status === 'pending');
  const latestOrder = orders[0];
  const totalTagihanAktif = activeOrders.reduce((s: number, o: any) => s + parseFloat(o.grand_total || 0), 0);

  return (
    <div className="min-h-screen bg-app">
      <PageHeader
        title={user?.nama_toko || 'Toko Saya'}
        subtitle={user?.nama_lengkap || 'Pemilik Toko'}
      />

      <PageContainer>
        <PageSection title="Ringkasan Belanja">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="🧾"
              label="Pesanan Aktif"
              value={activeOrders.length}
              tone={activeOrders.length > 0 ? 'primary' : 'default'}
              helper="Sedang diproses sales"
            />
            <StatCard
              icon="⏳"
              label="Inden"
              value={pendingPreOrders.length}
              tone={pendingPreOrders.length > 0 ? 'warning' : 'default'}
              helper="Menunggu stok masuk"
            />
            <StatCard
              icon="💰"
              label="Total Tagihan"
              value={<CurrencyText amount={totalTagihanAktif} />}
              tone={totalTagihanAktif > 0 ? 'danger' : 'default'}
              helper="Tagihan belum selesai"
              className="col-span-2"
            />
          </div>
        </PageSection>

        <PageSection title="Akses Cepat">
          <div className="grid gap-2">
            <ActionCard
              href="/buyer/catalog"
              icon="🧺"
              title="Katalog Belanja"
              desc="Lihat stok jajanan terbaru dan buat pesanan langsung."
              tone="primary"
            />
            <ActionCard
              href="/buyer/orders"
              icon="📋"
              title="Daftar Pesanan"
              desc="Lacak status kiriman dan lihat riwayat nota belanja."
              tone="info"
            />
            <ActionCard
              href="/buyer/pre-orders"
              icon="📝"
              title="Daftar Inden"
              desc="Pantau barang yang Anda pesan saat stok kosong."
              tone="warning"
            />
          </div>
        </PageSection>

        {latestOrder && (
          <PageSection title="Pesanan Terakhir">
            <Link href="/buyer/orders" className="card block hover:border-emerald-300 transition-all active:scale-[0.99]">
              <div className="flex items-start justify-between border-b border-dashed border-slate-200 pb-3 mb-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order ID: #{latestOrder.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-slate-500 font-medium">{formatDateTime(latestOrder.created_at)}</p>
                </div>
                <StatusBadge status={latestOrder.status} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{latestOrder.items?.length || 0} Barang</p>
                  <p className="text-xs text-slate-500">Ketuk untuk lihat detail nota</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total Nota</p>
                  <CurrencyText amount={latestOrder.grand_total} />
                </div>
              </div>
            </Link>
          </PageSection>
        )}

        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10">
          <div className="flex gap-4">
            <span className="text-3xl">🛵</span>
            <div className="min-w-0">
              <p className="font-extrabold text-lg">Hubungi Sales</p>
              <p className="text-sm text-slate-300 leading-relaxed mt-1">
                Butuh bantuan pesanan atau mau tanya stok di gudang? Hubungi sales via WhatsApp.
              </p>
              {user?.nomor_hp && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={toWaLink(user.nomor_hp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-700 shadow-lg shadow-green-900/40"
                  >
                    💬 Chat Sales
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
