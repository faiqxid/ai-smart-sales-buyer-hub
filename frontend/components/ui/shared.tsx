'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout, getUser } from '@/lib/auth';
import { getLocalNotifications, onNotificationsUpdated } from '@/lib/notifications';
import { formatRupiah } from '@/lib/format';
import { toCallLink, toWaLink } from '@/lib/phone';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'wa';

const buyerNav = [
  { href: '/buyer/dashboard', icon: '🏠', label: 'Beranda' },
  { href: '/buyer/catalog', icon: '🧺', label: 'Katalog' },
  { href: '/buyer/orders', icon: '🧾', label: 'Pesanan' },
  { href: '/buyer/pre-orders', icon: '⏳', label: 'Inden' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

const salesNav = [
  { href: '/sales/dashboard', icon: '🛵', label: 'Hari Ini' },
  { href: '/sales/products', icon: '📦', label: 'Stok' },
  { href: '/sales/orders', icon: '🧾', label: 'Order' },
  { href: '/sales/ai-briefing', icon: '✨', label: 'Briefing' },
  { href: '/profile', icon: '👤', label: 'Profile' },
];

const toneClass: Record<Tone, string> = {
  default: 'border-slate-200 bg-white text-slate-700',
  primary: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  muted: 'border-slate-200 bg-slate-100 text-slate-600',
};

const buttonClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  wa: 'btn-wa',
};

const statusTone: Record<string, Tone> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
  tersedia: 'success',
  ready: 'success',
  menipis: 'warning',
  habis: 'danger',
  kosong: 'danger',
  matched: 'info',
  fulfilled: 'success',
  tidak_retur: 'muted',
  perlu_ditarik: 'warning',
  sudah_ditarik: 'success',
  rusak: 'danger',
  expired: 'danger',
};

const statusLabels: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  shipped: 'Dikirim',
  delivered: 'Sampai',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  tersedia: 'Tersedia',
  ready: 'Tersedia',
  menipis: 'Menipis',
  habis: 'Kosong',
  kosong: 'Kosong',
  matched: 'Sudah Cocok',
  fulfilled: 'Terpenuhi',
  tidak_retur: 'Tidak Retur',
  perlu_ditarik: 'Perlu Ditarik',
  sudah_ditarik: 'Sudah Ditarik',
  rusak: 'Rusak',
  expired: 'Expired',
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function confirmLogout() {
  if (window.confirm('Keluar dari akun ini?')) logout();
}

export function AppButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`${buttonClass[variant]} ${className}`} {...props}>{children}</button>;
}

export function AppCard({
  children,
  className = '',
  interactive = false,
}: { children: React.ReactNode; className?: string; interactive?: boolean }) {
  return <div className={`card ${interactive ? 'hover:-translate-y-0.5 hover:border-emerald-300/60 transition-all duration-200' : ''} ${className}`}>{children}</div>;
}

export function PageContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <main className={`px-4 py-4 space-y-5 animate-fade-in pb-safe ${className}`}>{children}</main>;
}

export function PageSection({ title, description, action, children, className = '' }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-3 ${className}`}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="section-kicker">{title}</p>
          {description && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ icon, label, value, helper, tone = 'default', className = '' }: {
  icon: string;
  label: string;
  value: React.ReactNode;
  helper?: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={`stat-card stat-${tone} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="stat-icon">{icon}</span>
        <span className="mini-chip">Hari ini</span>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {helper && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{helper}</p>}
      </div>
    </div>
  );
}

export function ActionCard({ href, icon, title, desc, tone = 'primary' }: {
  href: string;
  icon: string;
  title: string;
  desc?: string;
  tone?: Tone;
}) {
  return (
    <Link href={href} className={`action-card action-${tone}`}>
      <span className="action-icon">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900 truncate">{title}</span>
        {desc && <span className="block text-xs text-slate-500 mt-0.5 line-clamp-2">{desc}</span>}
      </span>
      <span className="text-slate-400">›</span>
    </Link>
  );
}

export function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="label">{label}</span>
      {children}
      {helper && <span className="block text-xs text-slate-500 leading-relaxed">{helper}</span>}
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] || 'muted';
  return <span className={`status-badge ${toneClass[tone]}`}>{statusLabels[status] || status}</span>;
}

export function StockBadge({ stock, status }: { stock?: number; status?: string }) {
  const low = typeof stock === 'number' && stock > 0 && stock <= 5;
  const resolved = status || (stock === 0 ? 'habis' : low ? 'menipis' : 'tersedia');
  return <StatusBadge status={resolved} />;
}

export function CurrencyText({ amount, large = false, className = '' }: { amount: number | string; large?: boolean; className?: string }) {
  return <span className={`font-extrabold tabular-nums text-slate-950 ${large ? 'text-xl' : 'text-base'} ${className}`}>{formatRupiah(amount)}</span>;
}

export function EmptyState({ icon, title, desc, action }: { icon: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p className="text-slate-900 font-extrabold">{title}</p>
      {desc && <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto leading-relaxed">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingScreen({ message = 'Menyiapkan data lapangan...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-app">
      <div className="text-center px-6">
        <div className="w-14 h-14 rounded-3xl bg-white border border-slate-200 shadow-xl mx-auto mb-4 flex items-center justify-center">
          <div className="w-7 h-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-slate-600 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Data belum bisa dimuat', desc, retry }: { title?: string; desc?: string; retry?: () => void }) {
  return (
    <div className="card border-red-200 bg-red-50 text-red-800">
      <div className="flex gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">{title}</p>
          {desc && <p className="text-sm mt-1 text-red-700/80 leading-relaxed">{desc}</p>}
          {retry && <button onClick={retry} className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Coba lagi</button>}
        </div>
      </div>
    </div>
  );
}

export function WhatsAppButton({ phone, label = 'WhatsApp', className = '' }: { phone: string; label?: string; className?: string }) {
  return <a href={toWaLink(phone)} target="_blank" rel="noopener noreferrer" className={`btn-wa ${className}`}>💬 {label}</a>;
}

export function CallButton({ phone, label = 'Telepon', className = '' }: { phone: string; label?: string; className?: string }) {
  return <a href={toCallLink(phone)} className={`btn-secondary ${className}`}>📞 {label}</a>;
}

export function FormActionBar({ children }: { children: React.ReactNode }) {
  return <div className="sticky bottom-0 -mx-4 mt-6 border-t border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl safe-action-bar">{children}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const user = getUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const update = () => {
      const list = getLocalNotifications();
      setUnreadCount(list.filter((n) => !n.read).length);
    };
    update();
    return onNotificationsUpdated(update);
  }, [user]);

  return (
    <header className="page-header">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/70">AI Smart Sales Hub</p>
          <h1 className="text-xl font-extrabold text-slate-950 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {action}
          {user && (
            <Link 
              href="/profile" 
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:bg-slate-50 active:scale-95"
              aria-label="Notifikasi dan Profil"
            >
              <span className="text-lg leading-none">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      onClick={confirmLogout}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 font-bold text-red-700 transition-all hover:bg-red-100 active:scale-95 ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'}`}
    >
      <span>🚪</span>
      <span>{compact ? 'Keluar' : 'Keluar akun'}</span>
    </button>
  );
}

function RoleBottomNav({ items }: { items: typeof buyerNav }) {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {items.map(item => (
        <Link key={item.href} href={item.href} className={`nav-item ${isActivePath(pathname, item.href) ? 'active' : ''}`}>
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function BuyerNav() {
  return <RoleBottomNav items={buyerNav} />;
}

export function SalesNav() {
  return <RoleBottomNav items={salesNav} />;
}
