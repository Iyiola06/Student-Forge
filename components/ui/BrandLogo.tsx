'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  href?: string | null;
  compact?: boolean;
  subtitle?: string | null;
  className?: string;
  markClassName?: string;
  labelClassName?: string;
};

const BRAND_NAME = 'Sulva\u2019s Studify';

export default function BrandLogo({
  href = '/',
  compact = false,
  subtitle = 'Study workspace',
  className,
  markClassName,
  labelClassName,
}: BrandLogoProps) {
  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'brand-mark-shell relative overflow-hidden rounded-[18px] border border-black/6 shadow-sm dark:border-white/8',
          compact ? 'size-10' : 'size-11',
          markClassName
        )}
      >
        <Image src="/apple-touch-icon.png" alt={`${BRAND_NAME} crest`} fill className="object-contain p-1.5" priority />
      </div>
      <div className={cn('min-w-0', labelClassName)}>
        <p className="eyebrow">{BRAND_NAME}</p>
        {subtitle ? (
          <p className={cn('truncate text-[13px] font-bold text-slate-600 dark:text-slate-300', compact && 'text-xs')}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
