import type { LucideIcon } from 'lucide-react';
import { CalendarCheck2, CheckCircle2, CloudUpload, FileUp, PenTool, Sparkles, TrendingUp } from 'lucide-react';

export const marketingNavLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
] as const;

export const trustItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Upload PDFs', icon: FileUp },
  { label: 'Generate Quizzes', icon: PenTool },
  { label: 'Track Weak Topics', icon: TrendingUp },
  { label: 'Daily Review', icon: CheckCircle2 },
];

export const workflowItems: Array<{ title: string; body: string; icon: LucideIcon }> = [
  {
    title: 'Upload source material',
    body: 'Securely upload notes, slides, scanned pages, or plain text without adding process friction.',
    icon: CloudUpload,
  },
  {
    title: 'Generate study aids',
    body: 'Turn material into flashcards, quizzes, and clean summaries that are ready for repeat review.',
    icon: Sparkles,
  },
  {
    title: 'Review daily',
    body: 'Return to a focused queue built around what is due, what is weak, and what deserves another pass.',
    icon: CalendarCheck2,
  },
];

export const featureShowcases = [
  {
    title: 'Smart flashcards and quizzes',
    body: 'Move from uploaded material to active recall without rewriting your notes into another tool.',
    eyebrow: 'Practice',
    preview: 'quiz',
  },
  {
    title: 'AI tutor and explanation flow',
    body: 'Ask for clarification, turn confusion into examples, and stay inside one quiet workspace while you study.',
    eyebrow: 'Support',
    preview: 'tutor',
  },
  {
    title: 'Weak topic tracking and mastery',
    body: 'Surface pressure points early and let the review loop spend more time where memory is still fragile.',
    eyebrow: 'Mastery',
    preview: 'mastery',
  },
] as const;

export const footerLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Contact', href: 'mailto:hello@sulvatech.com' },
] as const;
