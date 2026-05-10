'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { orderApi, aiApi } from '@/lib/api';
import { PageHeader, LoadingScreen, EmptyState, StatusBadge, CurrencyText, AppCard, PageContainer, PageSection, Field, AppButton, WhatsAppButton, CallButton } from '@/components/ui/shared';
import { formatDateTime, STATUS_LABELS, RETUR_LABELS } from '@/lib/format';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled'];
const RETUR_STATUSES = ['tidak_retur', 'perlu_ditarik', 'sudah_ditarik', 'rusak', 'expired'];

export default function SalesOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [returModal, setReturModal] = useState<any>(null);
  const [returForm, setReturForm] = useState({ qty_retur: '1', alasan_retur: '', status_retur: 'perlu_ditarik' });
  const [waMsg, setWaMsg] = useState('');
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'sales') { router.replace('/login'); return; }
    load();
  }, [router]);

  async function load() {
    setLoading(true);
    orderApi.listAll().then((o: any) => setOrders(o)).finally(() => setLoading(false));
  }

  async function handleStatus(orderId: string, status: string) {
    try {
      await orderApi.updateStatus(orderId, status);
      setMsg('Status diperbarui.');
      load();
      if (selected?.id === orderId) setSelected((o: any) => ({ ...o, status }));
    } catch (err: any) { setMsg(`Gagal: ${err.message}`); }
  }

  async function handleRetur(e: React.FormEvent) {
    e.preventDefault();
    if (!returModal || !selected) return;
    try {
      await orderApi.addReturn(selected.id, { item_id: returModal.id, ...returForm, qty_retur: parseInt(returForm.qty_retur) });
      setMsg('Retur berhasil dicatat.');
      setReturModal(null);
      const updated: any = await orderApi.get(selected.id);
      setSelected(updated);
    } catch (err: any) { setMsg(`Gagal: ${err.message}`); }
  }

  async function handleInvoiceWA(orderId: string) {
    setWaMsg('');
    try {
      const res: any = await aiApi.invoiceMessage(orderId);
      setWaMsg(res.message);
      if (res.wa_link) {
        const encoded = encodeURIComponent(res.message);
        window.open(`${res.wa_link}?text=${encoded}`, '_blank');
      }
    } catch (err: any) { setMsg(`Gagal generate pesan: ${err.message}`); }
  }

  const filtered = filter === 'all' ? orders : orders.filter((o: any) => o.status === filter);

  if (loading) return <LoadingScreen message="Memuat daftar antrean order..." />;

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader title="Kelola Pesanan" subtitle={`${orders.length} total order masuk`} />
      <PageContainer>
        <div className="filter-scroll">
          {['all', ...ORDER_STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filter === s ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/15' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {s === 'all' ? 'Semua' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {msg && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 animate-fade-in">✅ {msg}</div>}

        {filtered.length === 0 ? <EmptyState icon="📭" title="Tidak ada order" desc="Belum ada pesanan di kategori ini." /> : filtered.map((o: any) => {
          const isSelected = selected?.id === o.id;
          return (
            <AppCard key={o.id} className={`overflow-hidden transition-all duration-300 ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
              <button className="w-full p-4 text-left" onClick={async () => {
                if (isSelected) { setSelected(null); return; }
                const detail: any = await orderApi.get(o.id);
                setSelected(detail); setWaMsg('');
              }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order #{o.id.slice(-6).toUpperCase()}</p>
                    <p className="mt-0.5 font-extrabold text-slate-950 truncate leading-snug">{o.nama_toko || 'Toko Anonim'}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex gap-2">
                    {o.nomor_hp && <WhatsAppButton phone={o.nomor_hp} label="WA" className="text-[10px] px-2 py-1" />}
                    {o.nomor_hp && <CallButton phone={o.nomor_hp} label="Telp" className="text-[10px] px-2 py-1" />}
                  </div>
                  <CurrencyText amount={o.grand_total} large />
                </div>
              </button>

              {isSelected && (
                <div className="border-t border-dashed border-slate-200 bg-slate-50/50 p-4 animate-fade-in">
                  <PageSection title="Rincian Barang">
                    <div className="space-y-3">
                      {selected.items?.map((item: any) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="text-sm font-extrabold text-slate-900 leading-snug">{item.nama_produk}</p>
                            <CurrencyText amount={item.subtotal} className="text-sm" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.qty} ball × <CurrencyText amount={item.harga_satuan} /></span>
                            <StatusBadge status={item.status_retur} />
                          </div>
                          {item.estimasi_expired && <p className="text-[10px] font-bold text-amber-600 mt-2">⏱ Estimasi Expired: {item.estimasi_expired}</p>}
                          {item.qty_retur > 0 && <p className="text-[10px] font-bold text-red-600 mt-1">↩ Retur {item.qty_retur} ball: {item.alasan_retur}</p>}
                          <button onClick={() => setReturModal(item)} className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 py-2 text-[10px] font-bold text-red-700 transition-all hover:bg-red-100">
                            Catat Retur Barang
                          </button>
                        </div>
                      ))}
                    </div>
                  </PageSection>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase"><span>Total Pesanan</span><CurrencyText amount={selected.total_tagihan} className="text-slate-500" /></div>
                    {parseFloat(selected.total_potongan_retur) > 0 && (
                      <div className="flex justify-between text-xs font-bold text-amber-600 uppercase"><span>Potongan Retur</span><span>- <CurrencyText amount={selected.total_potongan_retur} className="text-amber-600" /></span></div>
                    )}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200 font-extrabold text-slate-950">
                      <span>Total Bersih</span><CurrencyText amount={selected.grand_total} large className="text-emerald-700" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <p className="section-kicker">Proses Order</p>
                    <div className="filter-scroll no-scrollbar">
                      {ORDER_STATUSES.map(s => (
                        <button key={s} onClick={() => handleStatus(o.id, s)}
                          className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-[11px] font-extrabold uppercase tracking-widest transition-all ${selected.status === s ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'}`}>
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <AppButton onClick={() => handleInvoiceWA(o.id)} className="w-full bg-emerald-600/10 text-emerald-700 border-emerald-200 shadow-none hover:bg-emerald-600/20 py-4">
                      📱 Tagihan WhatsApp (AI)
                    </AppButton>
                    {waMsg && <div className="rounded-2xl border border-slate-200 bg-slate-100/50 p-4 text-xs font-medium text-slate-600 leading-relaxed italic">{waMsg}</div>}
                  </div>
                </div>
              )}
            </AppCard>
          );
        })}
      </PageContainer>

      {returModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setReturModal(null)}>
          <div className="w-full rounded-t-[2rem] bg-white p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-extrabold text-slate-950">Input Retur</h2>
            <p className="mb-4 text-sm text-slate-500">{returModal.nama_produk} · pesanan {returModal.qty} ball</p>
            <form onSubmit={handleRetur} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Qty Retur"><input className="input" type="number" min="0" max={returModal.qty} value={returForm.qty_retur} onChange={e => setReturForm(p => ({ ...p, qty_retur: e.target.value }))} /></Field>
                <Field label="Status">
                  <select className="input" value={returForm.status_retur} onChange={e => setReturForm(p => ({ ...p, status_retur: e.target.value }))}>
                    {RETUR_STATUSES.map(s => <option key={s} value={s}>{RETUR_LABELS[s]}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Alasan Retur"><input className="input" required value={returForm.alasan_retur} onChange={e => setReturForm(p => ({ ...p, alasan_retur: e.target.value }))} placeholder="cth: expired, kemasan sobek" /></Field>
              <div className="flex gap-3 pt-2"><AppButton type="submit" className="flex-1">Simpan Retur</AppButton><button type="button" onClick={() => setReturModal(null)} className="btn-secondary flex-1">Batal</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
