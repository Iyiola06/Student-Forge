import Link from 'next/link';
import Panel from '@/components/ui/Panel';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function CTASection() {
  return (
    <section id="about" className="bg-[#f7f4ed] px-4 pb-24 pt-6 md:px-6 dark:bg-[#0f1724]">
      <div className="mx-auto w-full max-w-[1040px]">
        <Panel variant="spotlight" padding="lg" className="rounded-[32px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#2c5d92] dark:text-[#f6b252]">Start now</p>
          <h2 className="mx-auto mt-4 max-w-[13ch] text-4xl font-black leading-tight text-slate-950 md:text-5xl dark:text-white">
            Bring tomorrow&apos;s review into focus.
          </h2>
          <p className="mx-auto mt-5 max-w-[650px] text-lg leading-9 text-slate-600 dark:text-slate-300">
            Upload class notes, generate practice, and return to a clean daily review flow without rebuilding your study system every night.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" className={buttonVariants({ variant: 'primary', size: 'hero' })}>
              Create your account
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'secondary', size: 'hero' }), 'bg-white dark:bg-white/8')}>
              Log in
            </Link>
          </div>
        </Panel>
      </div>
    </section>
  );
}
