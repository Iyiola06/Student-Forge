import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Panel from '@/components/ui/Panel';
import { buttonVariants } from '@/components/ui/Button';
import SectionHeading from '@/components/marketing/SectionHeading';
import SectionWrapper from '@/components/marketing/SectionWrapper';
import { cn } from '@/lib/utils';
import type { CreditBundle } from '@/lib/billing/config';
import { formatNairaFromKobo } from '@/lib/billing/config';

export default function PricingTeaser({ bundles }: { bundles: CreditBundle[] }) {
  return (
    <SectionWrapper id="pricing" tone="soft">
      <SectionHeading
        eyebrow="Pricing"
        title="Top up when you need more generation."
        body="The pricing section now supports the same calm workflow: daily review stays lightweight, while premium AI actions are clear and predictable."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel
          variant="soft"
          padding="lg"
          className="rounded-[32px] border-white/10 bg-[#0f1724] text-white shadow-[0_24px_70px_rgba(3,10,20,0.28)]"
        >
          <h3 className="text-2xl font-black leading-tight text-white">Pay for bursts of progress, not product clutter.</h3>
          <p className="mt-4 max-w-[58ch] text-base leading-8 text-slate-200">
            Use credits for premium generation moments, keep your review flow clean, and top up only when you need more depth.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {bundles.map((bundle) => (
              <Panel key={bundle.id} variant="default" padding="sm" className="rounded-[20px] border-white/10 bg-[#111d2b] text-white">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#f6b252]">{bundle.name}</p>
                <p className="mt-4 text-3xl font-black text-white">{formatNairaFromKobo(bundle.amountKobo)}</p>
                <p className="mt-2 text-sm font-semibold text-slate-200">{bundle.credits.toLocaleString()} credits</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">{bundle.tagline}</p>
              </Panel>
            ))}
          </div>
        </Panel>

        <Panel variant="spotlight" padding="lg" className="rounded-[32px] border-white/10 bg-[#101a29] text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#f6b252]">Clarity</p>
          <h3 className="mt-4 text-2xl font-black leading-tight text-white">See exactly what premium usage unlocks.</h3>
          <div className="mt-6 space-y-4">
            {[
              'Generate quizzes from uploaded material',
              'Create flashcards without rewriting notes',
              'Ask for cleaner explanations inside the same workspace',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-4 text-sm font-semibold leading-7 text-slate-200">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#f6b252]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <Link href="/signup" className={cn(buttonVariants({ variant: 'primary', size: 'hero' }), 'mt-8 w-full')}>
            Start with a clean workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Panel>
      </div>
    </SectionWrapper>
  );
}
