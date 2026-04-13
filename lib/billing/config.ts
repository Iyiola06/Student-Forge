export type CreditBundle = {
  id: string;
  name: string;
  amountKobo: number;
  credits: number;
  tagline: string;
};

export type AiCreditFeature =
  | 'ai_generate'
  | 'ai_quiz'
  | 'ai_simplify'
  | 'ai_tutor'
  | 'ai_chat'
  | 'ai_grade'
  | 'ai_blueprint'
  | 'ai_dashboard';

const DEFAULT_BUNDLES: CreditBundle[] = [
  {
    id: 'starter',
    name: 'Starter',
    amountKobo: 50000,
    credits: 500,
    tagline: 'Small top-up for focused sessions.',
  },
  {
    id: 'standard',
    name: 'Standard',
    amountKobo: 150000,
    credits: 1500,
    tagline: 'A clean refill for weekly study.',
  },
  {
    id: 'exam_prep',
    name: 'Exam Prep',
    amountKobo: 300000,
    credits: 3600,
    tagline: 'A deeper reserve for exam-week generation bursts.',
  },
];

export const AI_CREDIT_COSTS: Record<AiCreditFeature, number> = {
  ai_generate: 40,
  ai_quiz: 35,
  ai_simplify: 30,
  ai_tutor: 15,
  ai_chat: 20,
  ai_grade: 25,
  ai_blueprint: 30,
  ai_dashboard: 10,
};

export const FEATURE_CREDIT_POLICIES: Record<
  AiCreditFeature,
  { creditCost: number; creditEventType: 'generation_spend' | 'advanced_extraction_spend'; estimatedProviderCost: number }
> = {
  ai_generate: { creditCost: 40, creditEventType: 'generation_spend', estimatedProviderCost: 18 },
  ai_quiz: { creditCost: 35, creditEventType: 'generation_spend', estimatedProviderCost: 16 },
  ai_simplify: { creditCost: 30, creditEventType: 'generation_spend', estimatedProviderCost: 12 },
  ai_tutor: { creditCost: 15, creditEventType: 'generation_spend', estimatedProviderCost: 8 },
  ai_chat: { creditCost: 20, creditEventType: 'generation_spend', estimatedProviderCost: 9 },
  ai_grade: { creditCost: 25, creditEventType: 'generation_spend', estimatedProviderCost: 11 },
  ai_blueprint: { creditCost: 30, creditEventType: 'generation_spend', estimatedProviderCost: 12 },
  ai_dashboard: { creditCost: 10, creditEventType: 'generation_spend', estimatedProviderCost: 5 },
};

export function getCreditBundles(): CreditBundle[] {
  const raw =
    process.env.PAYSTACK_CREDIT_BUNDLES ||
    process.env.NEXT_PUBLIC_PAYSTACK_CREDIT_BUNDLES;

  if (!raw) {
    return DEFAULT_BUNDLES;
  }

  try {
    const parsed = JSON.parse(raw) as CreditBundle[];
    const valid = parsed.filter(
      (bundle) =>
        bundle?.id &&
        bundle?.name &&
        Number.isFinite(bundle.amountKobo) &&
        Number.isFinite(bundle.credits)
    );

    return valid.length > 0 ? valid : DEFAULT_BUNDLES;
  } catch {
    return DEFAULT_BUNDLES;
  }
}

export function getCreditBundle(bundleId: string) {
  return getCreditBundles().find((bundle) => bundle.id === bundleId) ?? null;
}

export function formatNairaFromKobo(amountKobo: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amountKobo / 100);
}
