import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93b7e7] disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary:
          'bg-[#3b82f6] text-white shadow-[0_12px_32px_rgba(59,130,246,0.22)] hover:bg-[#2563eb] dark:bg-[#4f86c5] dark:hover:bg-[#3975ba]',
        secondary:
          'border border-slate-200 bg-white text-slate-700 shadow-[0_4px_18px_rgba(15,23,42,0.06)] hover:bg-slate-50 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:bg-white/10',
        ghost:
          'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/8',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        default: 'h-11 px-5 text-sm',
        hero: 'h-12 rounded-2xl px-7 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
});

Button.displayName = 'Button';

export { Button };
