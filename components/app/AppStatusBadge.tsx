import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const appStatusBadgeVariants = cva(
  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]',
  {
    variants: {
      tone: {
        neutral: 'border-black/7 bg-white/78 text-slate-500 dark:border-white/8 dark:bg-white/5 dark:text-slate-300',
        info: 'border-[#cfe0fb] bg-[#eff6ff] text-[#1d4ed8] dark:border-[#274770] dark:bg-[#18304f] dark:text-[#bfdbfe]',
        success: 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-300',
        warning: 'border-amber-500/15 bg-amber-500/10 text-amber-700 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-200',
        danger: 'border-red-500/15 bg-red-500/10 text-red-700 dark:border-red-400/15 dark:bg-red-400/10 dark:text-red-300',
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
