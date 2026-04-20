import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const panelVariants = cva('rounded-[28px] border text-slate-900 dark:text-white', {
  variants: {
    variant: {
      default:
        'border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-white/8 dark:bg-[#0f1724]',
      soft:
        'border-[#ebe7de] bg-[#faf9f6] shadow-[0_4px_20px_rgba(15,23,42,0.04)] dark:border-white/8 dark:bg-[#111b2a]',
      inset:
        'border-[#dbe8fb] bg-[#f5f9ff] shadow-[0_10px_30px_rgba(79,134,197,0.08)] dark:border-white/10 dark:bg-[#132033]',
      spotlight:
        'border-white/60 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#101a29]',
    },
    padding: {
      none: '',
      sm: 'p-4',
      default: 'p-6 md:p-8',
      lg: 'p-8 md:p-10',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
  },
});

type PanelProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof panelVariants>;

export default function Panel({ className, variant, padding, ...props }: PanelProps) {
  return <div className={cn(panelVariants({ variant, padding }), className)} {...props} />;
}
