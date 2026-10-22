'use client';

import Link from 'next/link';
import { useId } from 'react';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  href?: string | null;
  compact?: boolean;
  subtitle?: string | null;
  className?: string;
  markClassName?: string;
  labelClassName?: string;
};

export function BrandMark({ className }: { className?: string }) {
  const gradientId = `studify-petal-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8 shrink-0', className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8cc8f7" />
          <stop offset="1" stopColor="#2f7fd3" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="7.6" r="6.4" fill={`url(#${gradientId})`} />
      <circle cx="24.4" cy="16" r="6.4" fill={`url(#${gradientId})`} />
      <circle cx="16" cy="24.4" r="6.4" fill={`url(#${gradientId})`} />
      <circle cx="7.6" cy="16" r="6.4" fill={`url(#${gradientId})`} />
      <circle cx="16" cy="16" r="3.4" fill="#fff" />
    </svg>
  );
}

export default function BrandLogo({
  href = '/',
  compact = false,
  subtitle = null,
  className,
  markClassName,
  labelClassName,
}: BrandLogoProps) {
  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <BrandMark className={cn(compact ? 'size-7' : 'size-8', markClassName)} />
      <div className={cn('min-w-0 leading-none', labelClassName)}>
        <p className={cn('font-display font-semibold tracking-[-0.03em] whitespace-nowrap text-[var(--text-strong)]', compact ? 'text-[19px]' : 'text-[21px]')}>
          <span className={cn('text-[var(--text-soft)]', compact && 'hidden sm:inline')}>Sulva&rsquo;s </span>Studify
        </p>
        {subtitle ? <p className="mt-1 truncate text-[12px] text-[var(--text-soft)]">{subtitle}</p> : null}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Sulva's Studify home" className="rounded-full">
      {content}
    </Link>
  );
}
