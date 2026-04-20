import { cn } from '@/lib/utils';

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: 'left' | 'center';
  className?: string;
};

export default function SectionHeading({ eyebrow, title, body, align = 'center', className }: SectionHeadingProps) {
  return (
    <div className={cn(align === 'center' ? 'mx-auto max-w-[760px] text-center' : 'max-w-[640px]', className)}>
      {eyebrow ? (
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#3b82f6] dark:text-[#93b7e7]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-900 md:text-4xl dark:text-white">{title}</h2>
      {body ? <p className="mt-4 text-base leading-8 text-slate-500 dark:text-slate-300">{body}</p> : null}
    </div>
  );
}
