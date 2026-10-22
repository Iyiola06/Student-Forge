import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import Icon3D from '@/components/ui/Icon3D';
import { footerLinks } from '@/components/marketing/home-content';

const productLinks = [
  { label: 'Quiz Generator', href: '/generator' },
  { label: 'Flashcards', href: '/generator?type=flashcards' },
  { label: 'AI Tutor', href: '/ai-tutor' },
  { label: 'Simplifier', href: '/simplifier' },
];

export default function PremiumFooter() {
  return (
    <footer className="bg-white px-5 pt-14 pb-10 dark:bg-[#070d1a]">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-10 border-b border-[var(--line)] pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-[360px] text-[14px] leading-7 text-[var(--text-soft)]">
              Turn class material into practice, focus on weak topics and keep a daily review habit that actually sticks.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {(['books', 'brain', 'trophy'] as const).map((icon) => (
                <span key={icon} className="icon-tile size-11">
                  <Icon3D name={icon} size={26} />
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--text-strong)]">Product</p>
            <ul className="mt-4 space-y-3 text-[14px] text-[var(--text-soft)]">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-[var(--text-strong)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--text-strong)]">Company</p>
            <ul className="mt-4 space-y-3 text-[14px] text-[var(--text-soft)]">
              {footerLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-[var(--text-strong)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-[13px] text-[var(--text-faint)] sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Sulva&rsquo;s Studify. Built for students who want to understand.</p>
          <p>Illustrations: Microsoft Fluent Emoji (MIT)</p>
        </div>
      </div>
    </footer>
  );
}
