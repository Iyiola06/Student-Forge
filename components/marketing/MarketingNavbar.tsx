import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import { buttonVariants } from '@/components/ui/Button';
import { marketingNavLinks } from '@/components/marketing/home-content';
import { cn } from '@/lib/utils';

export default function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#ebe7de]/80 bg-[#faf9f6]/88 px-4 backdrop-blur-md md:px-6 dark:border-white/8 dark:bg-[#0b1420]/88">
      <nav className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-6 py-4">
        <BrandLogo subtitle="Daily study workspace" />

        <div className="hidden items-center gap-8 md:flex">
          {marketingNavLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 transition hover:text-[#2563eb] dark:text-slate-300 dark:hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden md:inline-flex')}>
            Log in
          </Link>
          <Link href="/signup" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
