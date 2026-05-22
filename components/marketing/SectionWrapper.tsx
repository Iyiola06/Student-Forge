import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionWrapperProps = {
  id?: string;
  tone?: 'white' | 'cream' | 'soft';
  className?: string;
  innerClassName?: string;
  children: ReactNode;
};

const toneClasses: Record<NonNullable<SectionWrapperProps['tone']>, string> = {
  white: 'bg-white dark:bg-[#0b1420]',
  cream: 'bg-[#f7f4ed] dark:bg-[#0f1724]',
  soft: 'bg-[#fcfbf8] dark:bg-[#111d2b]',
};

export default function SectionWrapper({ id, tone = 'white', className, innerClassName, children }: SectionWrapperProps) {
  return (
    <section id={id} className={cn('px-4 py-20 md:px-6 md:py-24', toneClasses[tone], className)}>
      <div className={cn('mx-auto w-full max-w-[1240px]', innerClassName)}>{children}</div>
    </section>
  );
}
