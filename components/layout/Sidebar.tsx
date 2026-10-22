'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import BrandLogo from '@/components/ui/BrandLogo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';

type NavItem = {
  name: string;
  short?: string;
  href: string;
  icon: Icon3DName;
};

const primaryLinks: NavItem[] = [
  { name: 'Dashboard', short: 'Home', href: '/dashboard', icon: 'sun-cloud' },
  { name: 'Library', href: '/resources', icon: 'books' },
  { name: 'Generate', href: '/generator', icon: 'sparkles' },
  { name: 'Review', href: '/review', icon: 'brain' },
  { name: 'AI Tutor', short: 'Tutor', href: '/ai-tutor', icon: 'robot' },
];

const toolLinks: NavItem[] = [
  { name: 'Simplifier', href: '/simplifier', icon: 'bulb' },
  { name: 'Exam Ready', href: '/exam-ready', icon: 'target' },
  { name: 'Essay Grader', href: '/essay-grader', icon: 'pencil' },
  { name: 'Past Questions', href: '/past-questions', icon: 'scroll' },
  { name: 'Flashcards', href: '/flashcards', icon: 'card-index' },
  { name: 'Quest Mode', href: '/gamifier', icon: 'joystick' },
  { name: 'Leaderboard', href: '/leaderboard', icon: 'trophy' },
];

const accountLinks: NavItem[] = [
  { name: 'Wallet', href: '/wallet', icon: 'coin' },
  { name: 'Settings', href: '/settings', icon: 'gear' },
  { name: 'About', href: '/about', icon: 'seedling' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading } = useProfile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const renderLink = (link: NavItem) => (
    <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="nav-link" data-active={isActive(link.href)}>
      <span className="nav-link-icon">
        <Icon3D name={link.icon} size={22} />
      </span>
      <span className="truncate">{link.name}</span>
    </Link>
  );

  const profileCard = (
    <div className="flex items-center gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--card-2)] p-3">
      <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            'relative size-11 shrink-0 overflow-hidden rounded-full bg-cover bg-center ring-2 ring-white dark:ring-white/10',
            isLoading ? 'animate-pulse bg-[var(--line)]' : 'bg-[var(--accent-soft)]'
          )}
          style={{ backgroundImage: profile?.avatar_url ? `url("${profile.avatar_url}")` : undefined }}
        >
          {!profile?.avatar_url && !isLoading ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <Icon3D name="student-2" size={30} />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-strong)]">{profile?.full_name || 'Student'}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-soft)]">
            <span className="inline-flex items-center gap-1 font-medium text-[#e36a1c] dark:text-[#ffb27a]">
              <Icon3D name="fire" size={14} />
              {profile?.streak_days ?? 0}d
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon3D name="coin" size={14} />
              {profile?.credit_balance ?? 0}
            </span>
          </div>
        </div>
      </Link>
      <button
        onClick={handleLogout}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
        aria-label="Log out"
        title="Log out"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
      </button>
    </div>
  );

  const navSections = (
    <>
      <div className="space-y-1">
        <p className="nav-section-label pb-1">Learn</p>
        {primaryLinks.map(renderLink)}
      </div>
      <div className="space-y-1">
        <p className="nav-section-label pb-1">Study tools</p>
        {toolLinks.map(renderLink)}
      </div>
      <div className="space-y-1">
        <p className="nav-section-label pb-1">Account</p>
        {accountLinks.map(renderLink)}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile / tablet top bar */}
      <div className="sticky top-3 z-30 flex items-center justify-between rounded-full border border-[var(--line)] bg-[var(--card-glass)] py-2 pr-2 pl-4 shadow-[var(--shadow-md)] backdrop-blur-xl lg:hidden">
        <BrandLogo compact href="/dashboard" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMenuOpen((value) => !value)}
            className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--action)] text-[var(--action-ink)] transition active:scale-95"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            <span className="material-symbols-outlined text-[20px]">{isMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-[#0b1220]/35 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} aria-label="Close menu" />
          <div
            id="mobile-navigation"
            className="glass-panel absolute inset-x-3 top-[4.75rem] max-h-[calc(100dvh-6rem)] space-y-5 overflow-y-auto p-4 animate-rise"
          >
            {navSections}
            {profileCard}
          </div>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="glass-panel sticky top-6 hidden h-[calc(100vh-3rem)] w-[272px] shrink-0 overflow-hidden lg:flex lg:flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <BrandLogo href="/dashboard" />
          <ThemeToggle />
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">{navSections}</div>

        <div className="p-3">{profileCard}</div>
      </aside>

      {/* Mobile dock */}
      <nav className="mobile-tabbar" aria-label="Primary">
        <div className="flex items-center gap-1">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="mobile-tab" data-active={isActive(link.href)}>
              <Icon3D name={link.icon} size={24} />
              <span className="truncate">{link.short ?? link.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
