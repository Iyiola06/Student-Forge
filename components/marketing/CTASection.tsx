import Link from 'next/link';
import Panel from '@/components/ui/Panel';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function CTASection() {
  return (
    <section id="about" className="bg-[#faf9f6] px-4 pb-24 pt-6 md:px-6">
      <div className="mx-auto w-full max-w-[1040px]">
        <Panel variant="soft" padding="lg" className="rounded-[40px] text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#3b82f6] dark:text-[#93b7e7]">Start now</p>
          <h2 className="mx-auto mt-4 max-w-[12ch] text-4xl font-black tracking-[-0.05em] text-slate-900 md:text-5xl dark:text-white">
            Bring your study material into one premium workspace.
          </h2>
          <p className="mx-auto mt-5 max-w-[640px] text-lg leading-9 text-slate-500 dark:text-slate-300">
            Upload class notes, generate practice, and return to a clean daily review flow without juggling multiple tools.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/signup" className={buttonVariants({ variant: 'primary', size: 'hero' })}>
              Create your account
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'secondary', size: 'hero' }), 'bg-white')}>
              Log in
            </Link>
          </div>
        </Panel>
      </div>
    </section>
  );
}
