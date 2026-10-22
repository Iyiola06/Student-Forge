import type { Icon3DName } from '@/components/ui/Icon3D';

export const marketingNavLinks = [
  { label: 'Home', href: '/' },
  { label: 'Tools', href: '#tools' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '/about' },
] as const;

export const examNames = ['WAEC', 'JAMB UTME', 'NECO', 'Post-UTME', 'IGCSE', 'SAT', 'University finals', 'ICAN', 'A-Levels', 'GCE'] as const;

export const pillars: Array<{ kicker: string; title: string; tone: string; icons: Icon3DName[]; body: string }> = [
  {
    kicker: 'Bring your material',
    title: 'Upload',
    tone: 'pastel-sky',
    icons: ['file-folder', 'woman-tech', 'memo'],
    body: 'PDFs, slides, scanned pages, photos of the board. We read them all and turn them into clean study notes.',
  },
  {
    kicker: 'Learn by doing',
    title: 'Practice',
    tone: 'pastel-mint',
    icons: ['target', 'pencil', 'check'],
    body: 'Quizzes, flashcards and theory questions written from your own notes, not generic question banks.',
  },
  {
    kicker: 'See your improvement',
    title: 'Review',
    tone: 'pastel-butter',
    icons: ['brain', 'alarm', 'chart-up'],
    body: 'Spaced repetition brings each card back right before you would forget it. Five minutes a day compounds.',
  },
  {
    kicker: 'Walk in confident',
    title: 'Master',
    tone: 'pastel-lavender',
    icons: ['trophy', 'grad-cap', 'glowing-star'],
    body: 'Weak topics surface automatically, so your last week before the exam goes exactly where it matters.',
  },
];

export const toolCards: Array<{
  title: string;
  body: string;
  tone: string;
  icons: Icon3DName[];
  tags: string[];
  meta: [string, string, string];
  guide: { name: string; role: string; icon: Icon3DName };
  href: string;
  featured?: boolean;
}> = [
  {
    title: 'Quiz Generator',
    body: 'Turn any chapter into exam-style MCQs with explanations for every option, at the difficulty you choose.',
    tone: 'pastel-mint',
    icons: ['target', 'clipboard', 'check'],
    tags: ['Popular', 'Active recall'],
    meta: ['Instant feedback', '60 sec', 'From your notes'],
    guide: { name: 'Quiz Coach', role: 'Practice', icon: 'woman-hand' },
    href: '/generator',
  },
  {
    title: 'Smart Flashcards',
    body: 'Cards that schedule themselves. Rate how well you knew it and the review queue adapts to your memory.',
    tone: 'pastel-lime',
    icons: ['card-index', 'brain', 'sparkles'],
    tags: ['Spaced repetition', 'Daily'],
    meta: ['Memory model', '5 min/day', 'Never forget'],
    guide: { name: 'Recall Buddy', role: 'Review', icon: 'man-hand' },
    href: '/generator?type=flashcards',
    featured: true,
  },
  {
    title: 'AI Tutor',
    body: 'A patient tutor that asks guiding questions, explains with analogies and checks you really understood.',
    tone: 'pastel-sky',
    icons: ['robot', 'speech', 'bulb'],
    tags: ['24/7', 'Socratic'],
    meta: ['Step by step', 'Any time', 'Your context'],
    guide: { name: 'Tutor', role: 'Explain', icon: 'woman-teacher' },
    href: '/ai-tutor',
  },
  {
    title: 'Simplifier',
    body: 'Paste a dense paragraph and get it back at your level, from "explain like I am 12" to university depth.',
    tone: 'pastel-peach',
    icons: ['bulb', 'open-book', 'pencil'],
    tags: ['Clarity', 'Analogies'],
    meta: ['4 levels', '30 sec', 'YouTube picks'],
    guide: { name: 'Explainer', role: 'Simplify', icon: 'man-tipping' },
    href: '/simplifier',
  },
  {
    title: 'Exam Snapshot',
    body: 'A one-page cheat sheet of abbreviations, key points and the questions most likely to show up.',
    tone: 'pastel-lavender',
    icons: ['scroll', 'crystal', 'bookmark'],
    tags: ['Exam week', 'Hot list'],
    meta: ['High-yield', '1 page', 'Printable'],
    guide: { name: 'Examiner', role: 'Predict', icon: 'woman-scientist' },
    href: '/generator?type=exam_snapshot',
  },
  {
    title: 'Essay Grader',
    body: 'Write or snap a handwritten answer. Get a score, what you did well and exactly how to earn more marks.',
    tone: 'pastel-blush',
    icons: ['writing-hand', 'hundred', 'memo'],
    tags: ['Handwriting', 'Rubric'],
    meta: ['Marked fairly', '20 sec', 'Model answer'],
    guide: { name: 'Marker', role: 'Grade', icon: 'person-bow' },
    href: '/essay-grader',
  },
];

export const loopSteps: Array<{ step: string; title: string; body: string; icon: Icon3DName }> = [
  { step: '01', title: 'Drop in your notes', body: 'Upload a PDF, a slide deck or photos. Scanned pages are read with free AI vision, page by page.', icon: 'inbox' },
  { step: '02', title: 'Get your study set', body: 'One tap turns the material into a quiz, flashcards, a summary or an exam snapshot.', icon: 'sparkles' },
  { step: '03', title: 'Recall, then review', body: 'Answer before you peek. The app tracks what you miss and schedules it back at the right time.', icon: 'brain' },
  { step: '04', title: 'Close the gaps', body: 'Your dashboard shows weak topics and tells you the single best thing to study next.', icon: 'chart-up' },
];

export const faqs = [
  {
    q: 'Is Studify free to start?',
    a: 'Yes. New accounts get free credits, and daily review of your saved flashcards never costs credits. You only spend credits when the AI generates something new.',
  },
  {
    q: 'What can I upload?',
    a: 'PDFs (including scanned ones), Word documents, PowerPoint slides, images and plain text. Scanned pages are converted to clean text automatically.',
  },
  {
    q: 'Will it work for my exam?',
    a: 'Studify builds practice from your own material, so it works for WAEC, JAMB, NECO, university courses, professional exams and anything else you have notes for.',
  },
  {
    q: 'Is my material private?',
    a: 'Your uploads are stored in your own library and are never shared with other students. You can delete any resource at any time.',
  },
] as const;

export const footerLinks = [
  { label: 'About', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Contact', href: 'mailto:hello@sulvatech.com' },
] as const;
