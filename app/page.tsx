import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import PremiumFooter from '@/components/marketing/PremiumFooter';
import { ExamStrip, Faq, FinalCta, Hero, Mission, Pillars, Pricing, Statement, StudyLoop, Tools } from '@/components/marketing/Landing';
import SystemThemeSync from '@/components/theme/SystemThemeSync';
import { getCreditBundles } from '@/lib/billing/config';

export default function LandingPage() {
  const bundles = getCreditBundles().slice(0, 3);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[var(--text-strong)] dark:bg-[#070d1a]">
      <SystemThemeSync />
      <MarketingNavbar />
      <main>
        <Hero />
        <ExamStrip />
        <Statement />
        <Pillars />
        <StudyLoop />
        <Tools />
        <Mission />
        <Pricing bundles={bundles} />
        <Faq />
        <FinalCta />
      </main>
      <PremiumFooter />
    </div>
  );
}
