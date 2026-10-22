import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const panelVariants = cva('rounded-[28px] border border-[var(--line)] text-[var(--text-strong)]', {
  variants: {
    variant: {
      default: 'bg-[var(--card)] shadow-[var(--shadow-md)]',
      soft: 'bg-[var(--card-2)]',
      inset: 'bg-[var(--accent-softer)]',
      spotlight: 'bg-[var(--card)] shadow-[var(--shadow-lg)]',
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
