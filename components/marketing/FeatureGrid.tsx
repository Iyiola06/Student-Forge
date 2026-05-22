import Panel from '@/components/ui/Panel';
import SectionHeading from '@/components/marketing/SectionHeading';
import SectionWrapper from '@/components/marketing/SectionWrapper';
import { workflowItems } from '@/components/marketing/home-content';

export default function FeatureGrid() {
  return (
    <SectionWrapper id="how-it-works" tone="cream">
      <SectionHeading
        eyebrow="How it works"
        title="From class material to daily practice."
        body="The page now follows the same promise as the hero: bring in what you have, turn it into active recall, then return to a small queue every day."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {workflowItems.map(({ title, body, icon: Icon }, index) => (
          <Panel key={title} variant="default" padding="lg" className="rounded-[26px] transition-transform duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf2fb] text-[#2c5d92] dark:bg-white/8 dark:text-[#f6b252]">
              <Icon className="h-7 w-7" />
              </div>
              <span className="text-sm font-black text-slate-300 dark:text-white/20">0{index + 1}</span>
            </div>
            <h3 className="mt-6 text-xl font-black text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-3 text-base leading-8 text-slate-600 dark:text-slate-300">{body}</p>
          </Panel>
        ))}
      </div>
    </SectionWrapper>
  );
}
