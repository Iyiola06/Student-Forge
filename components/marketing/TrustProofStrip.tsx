import { trustItems } from '@/components/marketing/home-content';
import SectionWrapper from '@/components/marketing/SectionWrapper';

export default function TrustProofStrip() {
  return (
    <SectionWrapper tone="white" className="border-y border-slate-100 py-10 dark:border-white/8">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center justify-center gap-3 text-slate-500 dark:text-slate-300">
            <Icon className="h-5 w-5 text-[#3b82f6] dark:text-[#93b7e7]" />
            <span className="text-sm font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
