import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import { footerLinks } from '@/components/marketing/home-content';

export default function PremiumFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white px-4 py-12 md:px-6 dark:border-white/8 dark:bg-[#0b1420]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-between gap-8 md:flex-row">
        <div className="text-center md:text-left">
          <BrandLogo href="/" subtitle="Daily study workspace" />
          <p className="mt-4 max-w-[360px] text-sm leading-7 text-slate-600 dark:text-slate-400">
            {'Sulva\u2019s Studify'} turns class material into practice, weak-topic focus, and a dependable daily review loop.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[#2c5d92] dark:hover:text-[#f6b252]">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
