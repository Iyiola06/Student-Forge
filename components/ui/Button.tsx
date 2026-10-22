import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-brand)] disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--action)] text-[var(--action-ink)] shadow-[var(--shadow-action)] hover:-translate-y-px hover:bg-[var(--action-hover)]',
        secondary:
          'border border-[var(--line-strong)] bg-[var(--card)] text-[var(--text-strong)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]',
        ghost: 'text-[var(--text-body)] hover:bg-[var(--accent-softer)] hover:text-[var(--text-strong)]',
        sky: 'bg-[#4a9be8] text-white shadow-[0_10px_24px_rgba(74,155,232,0.32)] hover:-translate-y-px hover:bg-[#2f7fd3]',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        default: 'h-11 px-5 text-sm',
        hero: 'h-12 px-7 text-[15px]',
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
