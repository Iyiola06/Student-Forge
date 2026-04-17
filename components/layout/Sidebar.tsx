'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import BrandLogo from '@/components/ui/BrandLogo';
import ThemeToggle from '@/components/ui/ThemeToggle';

type NavItem = {
  name: string;
  href: string;
  icon: string;
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const renderDesktopLink = (link: NavItem) => {
    const active = isActive(link.href);

    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition',
          active
            ? 'bg-[#163f73] text-white shadow-[0_16px_34px_rgba(17,47,85,0.18)]'
            : 'text-slate-700 hover:bg-[#163f73]/6 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white'
        )}
      >
        <span
          className={cn(
            'material-symbols-outlined inline-flex size-9 items-center justify-center rounded-xl text-[18px] transition',
            active
              ? 'bg-white/12 text-white'
              : 'bg-[#163f73]/6 text-[#163f73] group-hover:bg-[#163f73]/10 dark:bg-white/5 dark:text-[#f6b252]'
          )}
        >
          {link.icon}
        </span>
        <span>{link.name}</span>
      </Link>
    );
  };

  return (
    <>
      <div className="glass-panel sticky top-4 z-30 flex items-center justify-between px-4 py-3 md:hidden">
        <BrandLogo compact subtitle={null} />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMenuOpen((value) => !value)}
            className="inline-flex size-10 items-center justify-center rounded-2xl border border-black/8 bg-white/70 text-slate-700 transition hover:border-[#163f73]/20 hover:text-[#163f73] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[#f39a2b]/20 dark:hover:text-[#f6b252]"
            aria-label="Open navigation menu"
          >
            <span className="material-symbols-outlined text-[20px]">{isMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} aria-label="Close menu" />
          <div className="glass-panel absolute inset-x-4 top-20 p-4">
            <div className="flex items-center justify-between pb-4">
              <BrandLogo compact />
              <ThemeToggle />
            </div>

            <div className="space-y-2">
              <p className="nav-section-label">More</p>
              {secondaryLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition',
                      active
                        ? 'bg-[#163f73] text-white'
                        : 'text-slate-700 hover:bg-[#163f73]/6 dark:text-slate-200 dark:hover:bg-white/6'
                    )}
                  >
                    <span
                      className={cn(
                        'material-symbols-outlined inline-flex size-9 items-center justify-center rounded-xl text-[18px]',
                        active ? 'bg-white/12 text-white' : 'bg-[#163f73]/6 text-[#163f73] dark:bg-white/5 dark:text-[#f6b252]'
                      )}
                    >
                      {link.icon}
                    </span>
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 rounded-[18px] border border-black/6 bg-white/55 p-3 dark:border-white/8 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'size-11 rounded-2xl bg-cover bg-center',
                    isLoading ? 'animate-pulse bg-slate-200 dark:bg-white/10' : 'bg-[#163f73]/10'
                  )}
                  style={{
                    backgroundImage: profile?.avatar_url ? `url("${profile.avatar_url}")` : undefined,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">{profile?.full_name || 'Student'}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {profile?.credit_balance ?? 0} credits
                  </p>
                </div>
                <button onClick={handleLogout} className="secondary-button !h-9 !rounded-xl !px-3">
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <aside className="glass-panel sticky top-4 hidden h-[calc(100vh-2rem)] w-[280px] shrink-0 overflow-hidden md:flex md:flex-col">
        <div className="nvidia-line flex items-center justify-between px-4 py-4">
          <BrandLogo />
          <ThemeToggle />
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-3.5 py-4">
          <div className="space-y-2">
            <p className="nav-section-label">Core</p>
            {primaryLinks.map(renderDesktopLink)}
          </div>

          <div className="space-y-2">
            <p className="nav-section-label">More</p>
            {secondaryLinks.map(renderDesktopLink)}
          </div>
        </div>

        <div className="nvidia-line px-3.5 py-3.5">
          <div className="rounded-[18px] border border-black/6 bg-white/58 p-3 dark:border-white/8 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'size-11 rounded-2xl bg-cover bg-center',
                  isLoading ? 'animate-pulse bg-slate-200 dark:bg-white/10' : 'bg-[#163f73]/10'
                )}
                style={{
                  backgroundImage: profile?.avatar_url ? `url("${profile.avatar_url}")` : undefined,
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-950 dark:text-white">{profile?.full_name || 'Student'}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {profile?.credit_balance ?? 0} credits • {profile?.streak_days ?? 0} day streak
                </p>
              </div>
              <button onClick={handleLogout} className="secondary-button !h-9 !rounded-xl !px-3">
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <nav className="mobile-tabbar">
        <div className="flex items-center gap-1">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="mobile-tab" data-active={isActive(link.href)}>
              <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
              <span className="truncate">{link.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
