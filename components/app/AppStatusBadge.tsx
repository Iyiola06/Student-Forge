import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const appStatusBadgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium capitalize before:size-1.5 before:rounded-full before:bg-current before:content-[""]',
  {
    variants: {
      tone: {
        neutral: 'bg-[var(--card-2)] text-[var(--text-soft)]',
        info: 'bg-[var(--accent-soft)] text-[var(--accent-strong)]',
        success: 'bg-[var(--success-soft)] text-[var(--success)]',
        warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
        danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
);

type AppStatusBadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof appStatusBadgeVariants>;

export default function AppStatusBadge({ className, tone, ...props }: AppStatusBadgeProps) {
  return <span className={cn(appStatusBadgeVariants({ tone }), className)} {...props} />;
}
