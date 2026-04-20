import Panel from '@/components/ui/Panel';
import SectionHeading from '@/components/marketing/SectionHeading';
import SectionWrapper from '@/components/marketing/SectionWrapper';
import { featureShowcases } from '@/components/marketing/home-content';
import { cn } from '@/lib/utils';

function PreviewPanel({ preview }: { preview: (typeof featureShowcases)[number]['preview'] }) {
  if (preview === 'quiz') {
    return (
      <Panel variant="inset" padding="default" className="rounded-[28px]">
        <Panel variant="default" padding="sm" className="mx-auto max-w-[360px] rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#dbeafe] text-xs font-black text-[#2563eb]">?</span>
              Interactive quiz
            </div>
            <span className="text-slate-400">x</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm font-medium text-[#1d4ed8]">
              Identify the stages of mitosis
            </div>
            {['Interphase', 'Prophase', 'Metaphase'].map((option) => (
              <div key={option} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                {option}
              </div>
            ))}
          </div>
        </Panel>
      </Panel>
    );
  }

  if (preview === 'tutor') {
    return (
      <Panel variant="inset" padding="default" className="rounded-[28px]">
        <div className="space-y-4">
          <Panel variant="default" padding="sm" className="max-w-[360px] rounded-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3b82f6]">Tutor prompt</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Explain why meiosis creates genetic variation in one concise answer.
            </p>
          </Panel>
          <Panel variant="soft" padding="sm" className="ml-auto max-w-[320px] rounded-2xl">
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
              Crossing over and independent assortment both mix genetic information, so each gamete carries a different combination.
            </p>
          </Panel>
        </div>
      </Panel>
    );
  }

  return (
    <Panel variant="inset" padding="default" className="rounded-[28px]">
      <Panel variant="default" padding="sm" className="mx-auto max-w-[360px] rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb]">%</div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white">Topic mastery</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Know where to repair understanding</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {[
            ['Biology', '85%', 'w-[85%] bg-[#3b82f6]'],
            ['Chemistry', '60%', 'w-[60%] bg-emerald-500'],
            ['Physics', '40%', 'w-[40%] bg-amber-500'],
          ].map(([label, value, widthClass]) => (
            <div key={label}>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
                <span className="font-bold text-slate-500 dark:text-slate-400">{value}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                <div className={cn('h-full rounded-full', widthClass)} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Panel>
  );
}

export default function FeatureShowcase() {
  return (
    <SectionWrapper id="features" tone="white">
      <SectionHeading title="Core features" body="A premium study loop that stays focused on practice, clarity, and repetition." />

      <div className="mt-24 space-y-24">
        {featureShowcases.map((item, index) => (
          <div key={item.title} className="grid items-center gap-12 lg:grid-cols-2">
            <div className={cn(index % 2 === 1 && 'lg:order-2')}>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#3b82f6] dark:text-[#93b7e7]">{item.eyebrow}</p>
              <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-4 max-w-[540px] text-lg leading-9 text-slate-500 dark:text-slate-300">{item.body}</p>
            </div>
            <div className={cn(index % 2 === 1 && 'lg:order-1')}>
              <PreviewPanel preview={item.preview} />
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
