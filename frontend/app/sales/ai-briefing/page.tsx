'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { aiApi } from '@/lib/api';
import { PageHeader, PageContainer, AppButton, AppCard, EmptyState, LoadingScreen } from '@/components/ui/shared';

export default function AIBriefingPage() {
  const router = useRouter();
  const [briefing, setBriefing] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'sales') { router.replace('/login'); return; }
  }, [router]);

  async function fetchBriefing() {
    setLoading(true);
    try {
      const res: any = await aiApi.dailyBriefing();
      setBriefing(res.briefing);
      setData(res.data);
      setFetched(true);
    } catch (err: any) {
      setBriefing(`Gagal memuat briefing: ${err.message}`);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !fetched) return <LoadingScreen message="AI sedang membaca kondisi gudang..." />;

  return (
    <div className="min-h-screen bg-app pb-safe">
      <PageHeader title="Briefing AI" subtitle="Asisten kerja harian sales lapangan" />
      <PageContainer>
        <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 shadow-lg shadow-emerald-900/5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-slate-950 text-2xl shadow-lg">🤖</div>
            <div className="min-w-0 flex-1">
              <p className="section-kicker text-emerald-700">Asisten Operasional</p>
              <h2 className="mt-1 text-xl font-extrabold leading-tight text-slate-950">Briefing pagi sebelum mulai keliling.</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                AI membaca data order, stok, inden, dan retur. Output dibuat seperti catatan kerja, bukan chatbot panjang.
              </p>
              <AppButton onClick={fetchBriefing} disabled={loading} className="mt-4 w-full sm:w-auto">
                {loading ? 'Menganalisis...' : fetched ? '🔄 Generate Ulang' : '✨ Generate Briefing'}
              </AppButton>
            </div>
          </div>
        </div>

        {fetched && (
          <AppCard className="p-5 border-l-4 border-l-emerald-600">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Catatan Kerja</p>
                <h3 className="text-lg font-extrabold text-slate-950">Yang perlu dilakukan hari ini</h3>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">AI</span>
            </div>
            <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 border border-slate-200">
              {briefing}
            </div>
          </AppCard>
        )}

        {data && (
          <div className="space-y-3">
            {data.expiring_items?.length > 0 && (
              <AppCard className="p-4 border-l-4 border-l-amber-500">
                <h3 className="mb-3 font-extrabold text-amber-900">⏱ Mendekati Expired</h3>
                <div className="space-y-2">
                  {data.expiring_items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-2 text-sm">
                      <span className="font-bold text-slate-800">{item.produk}</span>
                      <span className="text-xs font-bold text-amber-700">Exp: {item.expired}</span>
                    </div>
                  ))}
                </div>
              </AppCard>
            )}

            {data.pending_returns?.length > 0 && (
              <AppCard className="p-4 border-l-4 border-l-red-500">
                <h3 className="mb-3 font-extrabold text-red-900">↩ Retur Belum Ditarik</h3>
                <div className="space-y-2">
                  {data.pending_returns.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-red-50 px-3 py-2 text-sm">
                      <span className="font-bold text-slate-800">{r.produk}</span>
                      <span className="text-xs font-bold text-red-700">{r.qty_retur} ball</span>
                    </div>
                  ))}
                </div>
              </AppCard>
            )}

            {data.low_stock?.length > 0 && (
              <AppCard className="p-4 border-l-4 border-l-slate-900">
                <h3 className="mb-3 font-extrabold text-slate-900">📦 Stok Perlu Dicek</h3>
                <div className="space-y-2">
                  {data.low_stock.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-bold text-slate-800">{p.nama}</span>
                      <span className={`text-xs font-bold ${p.stok === 0 ? 'text-red-600' : 'text-amber-700'}`}>{p.stok === 0 ? 'Habis' : `${p.stok} ball`}</span>
                    </div>
                  ))}
                </div>
              </AppCard>
            )}

            <AppCard className="flex items-center justify-between p-4">
              <span className="text-sm font-bold text-slate-600">📝 Inden pending</span>
              <span className="text-2xl font-extrabold text-emerald-700">{data.pending_preorders || 0}</span>
            </AppCard>
          </div>
        )}

        {!fetched && !loading && (
          <EmptyState icon="📋" title="Belum ada briefing" desc="Tekan tombol generate untuk melihat prioritas kerja hari ini." />
        )}
      </PageContainer>
    </div>
  );
}
