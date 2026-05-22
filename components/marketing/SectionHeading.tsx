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
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#2c5d92] dark:text-[#f6b252]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-4xl dark:text-white">{title}</h2>
      {body ? <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">{body}</p> : null}
    </div>
  );
}
