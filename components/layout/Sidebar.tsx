'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

type NavItem = {
  name: string;
  href: string;
  icon: string;
  badge?: string;
};

const primaryLinks: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: 'space_dashboard' },
  { name: 'Library', href: '/resources', icon: 'folder_open' },
  { name: 'Generate', href: '/generator', icon: 'auto_awesome' },
  { name: 'Review', href: '/review', icon: 'timer' },
  { name: 'Wallet', href: '/wallet', icon: 'account_balance_wallet' },
];

const secondaryLinks: NavItem[] = [
  { name: 'Labs', href: '/labs', icon: 'science' },
  { name: 'Ops', href: '/ops', icon: 'monitoring' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
  { name: 'About', href: '/about', icon: 'info' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading } = useProfile();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const renderLinks = (links: NavItem[]) =>
    links.map((link) => {
      const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
      return (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
            isActive
              ? 'bg-[#102117] text-white shadow-[0_14px_30px_rgba(10,21,15,0.22)]'
              : 'text-slate-600 hover:bg-white/65 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white'
          )}
        >
          <span className="flex items-center gap-3">
            <span
              className={cn(
                'material-symbols-outlined rounded-lg p-1.5 text-[18px] transition-all',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'bg-slate-900/5 text-[#1a5c2a] group-hover:bg-[#1a5c2a]/10 dark:bg-white/5'
              )}
            >
              {link.icon}
            </span>
            <span>{link.name}</span>
          </span>
          {link.badge ? <span className="metric-chip !px-2 !py-1 !text-[10px]">{link.badge}</span> : null}
        </Link>
      );
    });

  return (
    <>
      <div className="glass-panel sticky top-4 z-40 flex items-center justify-between px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative size-10 overflow-hidden rounded-2xl bg-[#102117] p-1 shadow-[0_14px_30px_rgba(10,21,15,0.22)]">
            <Image src="/logo-favicon.png" alt="VUI Studify" fill className="object-contain p-1" />
          </div>
          <div>
            <p className="eyebrow">VUI Studify</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Daily revision loop</p>
          </div>
        </Link>
        <button
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex size-11 items-center justify-center rounded-2xl border border-black/5 bg-white/60 text-slate-700 dark:border-white/8 dark:bg-white/8 dark:text-white"
          aria-label="Toggle navigation"
        >
          <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {isOpen ? (
        <button
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={cn(
          'glass-panel fixed left-4 top-4 z-50 flex h-[calc(100vh-2rem)] w-[280px] flex-col overflow-hidden md:sticky md:left-0 md:top-4 md:z-20 md:w-[280px]',
          isOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'
        )}
      >
        <div className="nvidia-line px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative size-11 overflow-hidden rounded-xl bg-[#102117] p-1 shadow-[0_10px_24px_rgba(10,21,15,0.18)]">
              <Image src="/logo-favicon.png" alt="VUI Studify" fill className="object-contain p-1" />
            </div>
            <div>
              <p className="eyebrow">VUI Studify</p>
              <p className="mt-0.5 text-[13px] font-bold text-slate-700 dark:text-slate-200">Upload. Generate. Review.</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-3.5">
          <div className="space-y-2">
            <p className="px-3 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              Core
            </p>
            {renderLinks(primaryLinks)}
          </div>

          <div className="mt-6 space-y-2">
            <p className="px-3 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              More
            </p>
            {renderLinks(secondaryLinks)}
          </div>
        </div>

        <div className="nvidia-line px-3.5 py-3.5">
          <div className="glass-panel-strong rounded-[22px] px-3.5 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'size-10 rounded-xl bg-cover bg-center',
                  isLoading ? 'animate-pulse bg-white/10' : ''
                )}
                style={{
                  backgroundImage: profile?.avatar_url
                    ? `url("${profile.avatar_url}")`
                    : 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=fallback")',
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{profile?.full_name || 'Student'}</p>
                <p className="truncate text-xs text-white/70">
                  {profile?.credit_balance ?? 0} credits • {profile?.streak_days ?? 0} day streak
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-white/80 transition hover:bg-white/14"
                title="Log out"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
