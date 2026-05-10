'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

const valueCards = [
  { icon: '📦', title: 'Stok terlihat jelas', desc: 'Sales dan toko tahu barang ready, menipis, atau kosong sebelum order dibuat.' },
  { icon: '🧾', title: 'Order seperti nota', desc: 'Total, retur, dan tagihan disusun rapi agar mudah dicek di HP.' },
  { icon: '⏳', title: 'Inden tidak tercecer', desc: 'Toko bisa pesan dulu, sales bisa lihat antrean dan stok yang cocok.' },
  { icon: '💬', title: 'WhatsApp sekali ketuk', desc: 'Hubungi toko atau sales langsung dari halaman kerja.' },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) router.replace(user.role === 'sales' ? '/sales/dashboard' : '/buyer/dashboard');
  }, [router]);

  return (
    <main className="min-h-screen bg-transparent">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-5 sm:max-w-5xl">
        <nav className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/80 px-3 py-3 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-72x72.png" alt="SalesHub" className="h-11 w-11 rounded-2xl border border-slate-200 object-cover" />
            <div>
              <p className="text-sm font-extrabold text-slate-950 leading-none">SalesHub</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/70">Order lapangan</p>
            </div>
          </div>
          <Link href="/login" className="btn-secondary px-3 py-2 text-xs">Masuk</Link>
        </nav>

        <div className="grid flex-1 items-center gap-8 py-10 sm:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
              🛵 Dibuat untuk sales keliling & toko kecil
            </div>
            <div className="space-y-4">
              <h1 className="text-[2.55rem] font-extrabold leading-[0.95] tracking-tight text-slate-950 sm:text-6xl">
                Kerja sales harian jadi lebih rapi, dari stok sampai tagihan.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-600">
                Aplikasi PWA untuk mengatur katalog jajanan/roti, order toko, inden, retur, dan briefing kerja tanpa tampilan ribet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/login" className="btn-primary py-4">🔑 Masuk</Link>
              <Link href="/register" className="btn-secondary py-4">🏪 Daftar Toko</Link>
            </div>
            <p className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-xs leading-relaxed text-slate-500">
              Akun sales dibuat oleh admin. Toko bisa daftar sendiri lalu mulai melihat katalog dan status pesanan.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -right-5 -top-6 h-32 w-32 rounded-full bg-emerald-200/60 blur-3xl" />
            <div className="absolute -bottom-4 -left-4 h-28 w-28 rounded-full bg-amber-200/70 blur-3xl" />
            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/80">
              <div className="mb-4 flex items-center justify-between border-b border-dashed border-slate-200 pb-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Nota hari ini</p>
                  <p className="text-lg font-extrabold text-slate-950">Toko Sumber Rejeki</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Ready</span>
              </div>
              <div className="space-y-3">
                {[
                  ['Roti Coklat', '12 ball', 'Rp 180.000'],
                  ['Snack Mix', '8 ball', 'Rp 112.000'],
                  ['Retur Expired', '-2 ball', '-Rp 28.000'],
                ].map(([name, qty, price]) => (
                  <div key={name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">{qty}</p>
                    </div>
                    <p className="shrink-0 text-sm font-extrabold text-slate-900">{price}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
                <p className="text-xs text-slate-300">Grand total</p>
                <p className="text-2xl font-extrabold">Rp 264.000</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">Briefing AI: tarik 2 ball expired, cek stok Roti Keju yang mulai menipis.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 pb-6 sm:grid-cols-4">
          {valueCards.map((item) => (
            <div key={item.title} className="card bg-white/80">
              <div className="mb-3 text-2xl">{item.icon}</div>
              <h3 className="font-extrabold text-slate-950">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
