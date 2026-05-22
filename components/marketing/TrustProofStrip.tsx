import { trustItems } from '@/components/marketing/home-content';
import SectionWrapper from '@/components/marketing/SectionWrapper';

export default function TrustProofStrip() {
  return (
    <SectionWrapper tone="white" className="border-y border-slate-200/70 py-8 dark:border-white/8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-[#f8fafc] px-4 py-4 text-slate-600 dark:border-white/8 dark:bg-white/5 dark:text-slate-300">
            <Icon className="h-5 w-5 text-[#2c5d92] dark:text-[#f6b252]" />
            <span className="text-sm font-black">{label}</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
