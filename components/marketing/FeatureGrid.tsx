import Panel from '@/components/ui/Panel';
import SectionHeading from '@/components/marketing/SectionHeading';
import SectionWrapper from '@/components/marketing/SectionWrapper';
import { workflowItems } from '@/components/marketing/home-content';

export default function FeatureGrid() {
  return (
    <SectionWrapper id="how-it-works" tone="white">
      <SectionHeading
        title="How it works"
        body="Move from source material to a repeatable review rhythm in three clean steps."
      />

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {workflowItems.map(({ title, body, icon: Icon }) => (
          <Panel key={title} variant="default" padding="lg" className="rounded-[32px] transition-transform duration-300 hover:-translate-y-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb] dark:bg-white/8 dark:text-[#93b7e7]">
              <Icon className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-xl font-black tracking-[-0.03em] text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-3 text-base leading-8 text-slate-500 dark:text-slate-300">{body}</p>
          </Panel>
        ))}
      </div>
    </SectionWrapper>
  );
}
