'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { productApi, orderApi, preOrderApi } from '@/lib/api';
import { PageHeader, LoadingScreen, EmptyState, StockBadge, CurrencyText } from '@/components/ui/shared';

interface CartItem { product: any; qty: number; }

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'buyer') { router.replace('/login'); return; }
    productApi.list(true).then((p: any) => setProducts(p)).finally(() => setLoading(false));
  }, [router]);

  const all = products.filter((p: any) =>
    p.nama_produk.toLowerCase().includes(search.toLowerCase()) ||
    p.kategori.toLowerCase().includes(search.toLowerCase())
  );
  const available = all.filter((p: any) => p.stok_ball > 0);
  const soldOut = all.filter((p: any) => p.stok_ball <= 0);
  const cartTotal = cart.reduce((s, c) => s + parseFloat(c.product.harga) * c.qty, 0);
  const cartQty = cart.reduce((s, c) => s + c.qty, 0);

  function addToCart(product: any) {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === product.id);
      if (ex) return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  }
  function removeFromCart(productId: string) {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === productId);
      if (ex && ex.qty > 1) return prev.map(c => c.product.id === productId ? { ...c, qty: c.qty - 1 } : c);
      return prev.filter(c => c.product.id !== productId);
    });
  }

  async function handleCheckout() {
    if (!cart.length) return;
    setOrdering(true);
    setMsg(null);
    try {
      await orderApi.create({ items: cart.map(c => ({ product_id: c.product.id, qty: c.qty })) });
      setCart([]);
      setMsg({ text: 'Pesanan berhasil dibuat! Sales akan segera memproses kiriman.', ok: true });
      setTimeout(() => router.push('/buyer/orders'), 1800);
    } catch (err: any) {
      setMsg({ text: err.message, ok: false });
    } finally {
      setOrdering(false);
    }
  }

  async function handleInden(product: any) {
    try {
      await preOrderApi.create({ product_id: product.id, qty_request: 1 });
      setMsg({ text: `Inden "${product.nama_produk}" berhasil didaftarkan. Sales akan memberi tahu saat stok tersedia.`, ok: true });
    } catch (err: any) {
      setMsg({ text: err.message, ok: false });
    }
  }

  if (loading) return <LoadingScreen message="Memuat katalog barang..." />;

  function ProductCard({ p }: { p: any }) {
    const inCart = cart.find(c => c.product.id === p.id);
    const isLow = p.stok_ball > 0 && p.stok_ball <= 5;
    return (
      <div className="card flex gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-2xl">
          🧺
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-extrabold text-slate-950 leading-snug line-clamp-2">{p.nama_produk}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{p.kategori}</span>
                <StockBadge stock={p.stok_ball} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 gap-2">
            <div>
              <CurrencyText amount={p.harga} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">/ball</span>
              {isLow && <p className="text-[10px] font-bold text-amber-600 mt-0.5">⚠ Stok tersisa {p.stok_ball}</p>}
            </div>
            {p.stok_ball > 0 ? (
              inCart ? (
                <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-inner">
                  <button onClick={() => removeFromCart(p.id)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600 active:scale-95">−</button>
                  <span className="w-8 text-center text-base font-extrabold text-slate-950">{inCart.qty}</span>
                  <button onClick={() => addToCart(p)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95">+</button>
                </div>
              ) : (
                <button onClick={() => addToCart(p)} className="btn-primary px-5 py-2.5 text-sm">Beli</button>
              )
            ) : (
              <button onClick={() => handleInden(p)} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100">
                ⏳ Inden
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader title="Katalog Belanja" subtitle="Pilih barang untuk dipesan hari ini" />

      <div className="px-4 py-4 space-y-5 animate-fade-in">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">🔍</span>
          <input
            className="input pl-10"
            placeholder="Cari produk atau kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {msg && (
          <div className={`flex items-start gap-3 rounded-2xl border p-4 ${msg.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
            <span className="text-xl">{msg.ok ? '✅' : '⚠️'}</span>
            <p className="text-sm font-semibold leading-relaxed">{msg.text}</p>
          </div>
        )}

        {all.length === 0 ? (
          <EmptyState icon="📦" title="Produk tidak ditemukan" desc="Coba kata kunci lain atau kosongkan pencarian." />
        ) : (
          <>
            {available.length > 0 && (
              <div className="space-y-3">
                <p className="section-kicker">Tersedia — {available.length} produk</p>
                {available.map((p: any) => <ProductCard key={p.id} p={p} />)}
              </div>
            )}

            {soldOut.length > 0 && (
              <div className="space-y-3">
                <p className="section-kicker text-red-600/70">Stok Kosong — {soldOut.length} produk</p>
                <p className="text-xs text-slate-500">Barang di bawah bisa dipesan lewat Inden.</p>
                {soldOut.map((p: any) => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed left-3 right-3 z-40 animate-slide-up" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}>
          <button
            onClick={handleCheckout}
            disabled={ordering}
            className="btn-primary w-full py-4 shadow-2xl shadow-emerald-700/25"
          >
            <span className="shrink-0">🛒 {cartQty} item</span>
            <span className="flex-1 text-center font-extrabold truncate">{ordering ? 'Memproses pesanan...' : 'Kirim Pesanan'}</span>
            <CurrencyText amount={cartTotal} />
          </button>
        </div>
      )}
    </div>
  );
}
