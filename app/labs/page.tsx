'use client';

import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';

const tools = [
  { href: '/flashcards', name: 'Flashcards', body: 'Legacy drill surface while review mode evolves.' },
  { href: '/essay-grader', name: 'Essay Grader', body: 'Premium writing feedback and rubric checks.' },
  { href: '/simplifier', name: 'Simplifier', body: 'Condense dense materials into faster summaries.' },
  { href: '/ai-tutor', name: 'AI Tutor', body: 'Conversational help for point-in-time questions.' },
  { href: '/gamifier', name: 'Gamifier', body: 'Secondary study motivation surface.' },
  { href: '/leaderboard', name: 'Leaderboard', body: 'Competitive progress and ranking views.' },
  { href: '/exam-ready', name: 'Exam Ready', body: 'Legacy exam prep planning tools.' },
];

export default function LabsPage() {
  return (
    <AppShell
      eyebrow="Labs"
      title="Secondary tools"
      description="These features remain available, but the product now prioritizes the core loop: library, generate, review, and wallet."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="glass-panel p-6 transition hover:-translate-y-1">
            <p className="eyebrow">Labs</p>
            <h3 className="panel-title mt-2">{tool.name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{tool.body}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#1a5c2a]">
              Open tool
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </span>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
