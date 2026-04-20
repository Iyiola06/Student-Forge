import CTASection from '@/components/marketing/CTASection';
import DailyHabitSection from '@/components/marketing/DailyHabitSection';
import FeatureGrid from '@/components/marketing/FeatureGrid';
import FeatureShowcase from '@/components/marketing/FeatureShowcase';
import HeroSection from '@/components/marketing/HeroSection';
import MarketingNavbar from '@/components/marketing/MarketingNavbar';
import PremiumFooter from '@/components/marketing/PremiumFooter';
import PricingTeaser from '@/components/marketing/PricingTeaser';
import TrustProofStrip from '@/components/marketing/TrustProofStrip';
import { getCreditBundles } from '@/lib/billing/config';

export default function LandingPage() {
  const bundles = getCreditBundles().slice(0, 3);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 dark:bg-[#0b1420] dark:text-white">
      <MarketingNavbar />
      <main>
        <HeroSection />
        <TrustProofStrip />
        <FeatureGrid />
        <FeatureShowcase />
        <DailyHabitSection />
        <PricingTeaser bundles={bundles} />
        <CTASection />
      </main>
      <PremiumFooter />
    </div>
  );
}
