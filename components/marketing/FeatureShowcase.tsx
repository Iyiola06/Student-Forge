import Panel from '@/components/ui/Panel';
import SectionHeading from '@/components/marketing/SectionHeading';
import SectionWrapper from '@/components/marketing/SectionWrapper';
import { featureShowcases } from '@/components/marketing/home-content';
import { cn } from '@/lib/utils';

function PreviewPanel({ preview }: { preview: (typeof featureShowcases)[number]['preview'] }) {
  if (preview === 'quiz') {
    return (
      <Panel variant="inset" padding="default" className="rounded-[26px]">
        <Panel variant="default" padding="sm" className="mx-auto max-w-[380px] rounded-[20px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf2fb] text-xs font-black text-[#2c5d92] dark:bg-white/8 dark:text-[#f6b252]">?</span>
              Interactive quiz
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200">Generated</span>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[#dbe8fb] bg-[#eaf2fb] px-4 py-3 text-sm font-bold text-[#163f73] dark:border-white/10 dark:bg-white/8 dark:text-slate-100">
              Identify the stages of mitosis
            </div>
            {['Interphase', 'Prophase', 'Metaphase'].map((option) => (
              <div key={option} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
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
      <Panel variant="inset" padding="default" className="rounded-[26px]">
        <div className="space-y-4">
          <Panel variant="default" padding="sm" className="max-w-[380px] rounded-[20px]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2c5d92] dark:text-[#f6b252]">Tutor prompt</p>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700 dark:text-slate-200">
              Explain why meiosis creates genetic variation in one concise answer.
            </p>
          </Panel>
          <Panel variant="soft" padding="sm" className="ml-auto max-w-[340px] rounded-[20px]">
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
              Crossing over and independent assortment both mix genetic information, so each gamete carries a different combination.
            </p>
          </Panel>
        </div>
      </Panel>
    );
  }

  return (
    <Panel variant="inset" padding="default" className="rounded-[26px]">
      <Panel variant="default" padding="sm" className="mx-auto max-w-[380px] rounded-[20px]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf2fb] text-sm font-black text-[#2c5d92] dark:bg-white/8 dark:text-[#f6b252]">%</div>
          <div>
            <p className="font-black text-slate-900 dark:text-white">Topic mastery</p>
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
                <span className="font-bold text-slate-700 dark:text-slate-200">{label}</span>
                <span className="font-black text-slate-500 dark:text-slate-400">{value}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/8">
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
      <SectionHeading eyebrow="Core features" title="Everything points back to active recall." body="The feature sections now read like product moments: generate practice, ask for clarity, and see what needs attention next." />

      <div className="mt-20 space-y-20">
        {featureShowcases.map((item, index) => (
          <div key={item.title} className="grid items-center gap-10 rounded-[32px] border border-slate-200/70 bg-[#f8fafc] p-5 md:p-8 lg:grid-cols-2 dark:border-white/8 dark:bg-white/4">
            <div className={cn(index % 2 === 1 && 'lg:order-2')}>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#2c5d92] dark:text-[#f6b252]">{item.eyebrow}</p>
              <h3 className="mt-4 text-3xl font-black leading-tight text-slate-950 dark:text-white">{item.title}</h3>
              <p className="mt-4 max-w-[540px] text-lg leading-9 text-slate-600 dark:text-slate-300">{item.body}</p>
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
