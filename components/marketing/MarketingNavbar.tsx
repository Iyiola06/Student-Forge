'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { marketingNavLinks } from '@/components/marketing/home-content';
import { cn } from '@/lib/utils';

export default function MarketingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav
        className={cn(
          'mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 rounded-full border border-white/70 bg-white/90 py-2 pr-2 pl-5 backdrop-blur-xl transition-shadow duration-300 dark:border-white/10 dark:bg-[#0f192c]/85',
          scrolled ? 'shadow-[0_18px_44px_rgba(30,64,120,0.16)]' : 'shadow-[0_8px_24px_rgba(30,64,120,0.08)]'
        )}
        aria-label="Main"
      >
        <BrandLogo compact />

        <div className="hidden items-center gap-7 md:flex">
          {marketingNavLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-[14px] transition hover:text-[var(--text-strong)]',
                index === 0 ? 'font-medium text-[var(--text-strong)]' : 'text-[var(--text-soft)]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link href="/login" className="hidden px-3 text-[14px] font-medium text-[var(--text-strong)] md:inline-flex">
            Login
          </Link>
          <Link href="/signup" className="primary-button !h-10 !px-4 whitespace-nowrap sm:!px-5">
            Get started
          </Link>
          <button
            className="inline-flex size-10 items-center justify-center rounded-full text-[var(--text-strong)] md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="mx-auto mt-2 max-w-[1120px] rounded-[28px] border border-white/70 bg-white/95 p-3 shadow-[0_18px_44px_rgba(30,64,120,0.16)] backdrop-blur-xl animate-rise md:hidden dark:border-white/10 dark:bg-[#0f192c]/95">
          {marketingNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-[15px] font-medium text-[var(--text-strong)] hover:bg-[var(--accent-softer)]"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-2 border-t border-[var(--line)] px-2 pt-3">
            <ThemeToggle />
            <Link href="/login" className="secondary-button flex-1">
              Login
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
