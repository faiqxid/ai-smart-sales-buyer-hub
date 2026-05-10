'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { productApi, aiApi } from '@/lib/api';
import { PageHeader, LoadingScreen, EmptyState, StockBadge, CurrencyText, AppCard, PageContainer, Field, AppButton } from '@/components/ui/shared';

const KATEGORI = ['Roti Manis', 'Roti Tawar', 'Roti Gurih', 'Kue', 'Pastry', 'Lainnya'];

export default function SalesProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [stockModal, setStockModal] = useState<any>(null);
  const [stockQty, setStockQty] = useState('');
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nama_produk: '', kategori: 'Roti Manis', harga: '', stok_ball: '', deskripsi: '', is_active: true });

  const set = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'sales') { router.replace('/login'); return; }
    load();
  }, [router]);

  async function load() {
    setLoading(true);
    productApi.list(false).then((p: any) => setProducts(p)).finally(() => setLoading(false));
  }

  function openEdit(p: any) {
    setForm({ nama_produk: p.nama_produk, kategori: p.kategori, harga: p.harga, stok_ball: p.stok_ball, deskripsi: p.deskripsi || '', is_active: p.is_active });
    setEditTarget(p);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, harga: parseFloat(form.harga), stok_ball: parseInt(form.stok_ball) };
      if (editTarget) await productApi.update(editTarget.id, payload);
      else await productApi.create(payload);
      setMsg(editTarget ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan.');
      setShowForm(false); setEditTarget(null);
      setForm({ nama_produk: '', kategori: 'Roti Manis', harga: '', stok_ball: '', deskripsi: '', is_active: true });
      load();
    } catch (err: any) { setMsg(`Gagal: ${err.message}`); }
  }

  async function handleStock(e: React.FormEvent) {
    e.preventDefault();
    if (!stockModal) return;
    try {
      await productApi.updateStock(stockModal.id, { qty: parseInt(stockQty) });
      aiApi.preorderMatcher(stockModal.id).catch(() => {});
      setMsg('Stok berhasil diperbarui. Matcher inden dijalankan di background.');
      setStockModal(null); setStockQty(''); load();
    } catch (err: any) { setMsg(`Gagal: ${err.message}`); }
  }

  if (loading) return <LoadingScreen message="Memuat rak produk..." />;

  const filtered = products.filter((p: any) => `${p.nama_produk} ${p.kategori}`.toLowerCase().includes(search.toLowerCase()));
  const activeCount = products.filter((p: any) => p.is_active).length;
  const emptyCount = products.filter((p: any) => p.stok_ball <= 0).length;

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader title="Produk & Stok" subtitle={`${activeCount} produk aktif · ${emptyCount} stok kosong`} action={<button onClick={() => { setEditTarget(null); setShowForm(true); }} className="btn-primary px-4 py-2 text-sm">+ Produk</button>} />
      <PageContainer>
        <div className="rounded-3xl bg-slate-950 p-4 text-white">
          <p className="section-kicker text-slate-400">Rak Sales</p>
          <p className="mt-1 text-2xl font-extrabold">{products.length} Produk</p>
          <p className="text-sm text-slate-300">Perbarui stok sebelum mulai menawarkan ke toko.</p>
        </div>

        <input className="input" placeholder="🔍 Cari produk atau kategori..." value={search} onChange={e => setSearch(e.target.value)} />

        {msg && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">✅ {msg}</div>}

        {filtered.length === 0 ? <EmptyState icon="📦" title="Produk tidak ditemukan" desc="Coba kata kunci lain atau tambah produk baru." /> : (
          <div className="space-y-3">
            {filtered.map((p: any) => (
              <AppCard key={p.id} className={`p-4 ${!p.is_active ? 'opacity-55' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-2xl">🍞</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-950 leading-snug line-clamp-2">{p.nama_produk}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{p.kategori}</p>
                      </div>
                      <StockBadge stock={p.stok_ball} />
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div>
                        <CurrencyText amount={p.harga} />
                        <p className="text-xs font-bold text-slate-500">Stok: {p.stok_ball} ball</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button onClick={() => setStockModal(p)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">+ Stok</button>
                        <button onClick={() => openEdit(p)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">Edit</button>
                      </div>
                    </div>
                    <button onClick={async () => { if (confirm('Nonaktifkan produk ini?')) { await productApi.delete(p.id); load(); } }} className="mt-3 text-xs font-bold text-red-600">Nonaktifkan produk</button>
                  </div>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </PageContainer>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setShowForm(false)}>
          <div className="w-full max-h-[88vh] overflow-y-auto rounded-t-[2rem] bg-white p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4 text-xl font-extrabold text-slate-950">{editTarget ? 'Edit Produk' : 'Tambah Produk'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nama Produk"><input className="input" required value={form.nama_produk} onChange={set('nama_produk')} /></Field>
              <Field label="Kategori"><select className="input" value={form.kategori} onChange={set('kategori')}>{KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Harga"><input className="input" type="number" required value={form.harga} onChange={set('harga')} /></Field>
                <Field label="Stok Ball"><input className="input" type="number" required value={form.stok_ball} onChange={set('stok_ball')} /></Field>
              </div>
              <Field label="Deskripsi"><input className="input" value={form.deskripsi} onChange={set('deskripsi')} /></Field>
              <div className="flex gap-3 pt-2"><AppButton type="submit" className="flex-1">Simpan</AppButton><button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button></div>
            </form>
          </div>
        </div>
      )}

      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setStockModal(null)}>
          <div className="w-full rounded-t-[2rem] bg-white p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-extrabold text-slate-950">Update Stok</h2>
            <p className="mb-4 text-sm text-slate-500">{stockModal.nama_produk} · saat ini {stockModal.stok_ball} ball</p>
            <form onSubmit={handleStock} className="space-y-4">
              <Field label="Perubahan Qty" helper="Isi +10 untuk tambah, -3 untuk kurangi."><input className="input" type="number" required value={stockQty} onChange={e => setStockQty(e.target.value)} placeholder="10 atau -3" /></Field>
              <div className="flex gap-3"><AppButton type="submit" className="flex-1">Update</AppButton><button type="button" onClick={() => setStockModal(null)} className="btn-secondary flex-1">Batal</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
