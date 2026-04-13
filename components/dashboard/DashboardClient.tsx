'use client';

import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import AppShell from '@/components/layout/AppShell';
import { useProfile, type Profile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

type DashboardData = {
  dueToday: Array<{
    id: string;
    item_type: string;
    source_topic: string | null;
    due_at: string;
    review_state: string;
    mastery_score: number;
    last_reviewed_at: string | null;
  }>;
  overdue: Array<{ id: string }>;
  weakTopics: Array<{
    id: string;
    topic_slug: string;
    topic_label: string;
    mastery_score: number;
    mistakes_count: number;
    due_count: number;
    last_reviewed_at: string | null;
  }>;
  recentResources: Array<{
    id: string;
    title: string;
    subject: string | null;
    processing_status: string | null;
    processing_error: string | null;
    extracted_preview: string | null;
    created_at: string;
    processing_started_at: string | null;
    processing_completed_at: string | null;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    source: string;
    created_at: string;
  }>;
  recentSessions: Array<{
    id: string;
    session_type: string;
    status: string;
    completed_items: number;
    total_items: number;
    started_at: string;
    completed_at: string | null;
  }>;
  recentAttempts: Array<{
    id: string;
    result: string;
    created_at: string;
  }>;
  reviewCompletionRate: number;
  firstReadyRate: number;
  failedResources: number;
};

export default function DashboardClient({
  initialData,
}: {
  initialData: { user: User | null; profile: Profile | null; dashboard: DashboardData };
}) {
  const { profile } = useProfile(initialData);
  const dashboard = initialData.dashboard;

  const firstName = profile?.full_name?.split(' ')[0] || 'Student';
  const dueTodayCount = dashboard.dueToday.length;
  const nextResource = dashboard.recentResources[0];
  const topWeakTopic = dashboard.weakTopics[0];
  const balance = profile?.credit_balance ?? 0;
  const readiness = Math.min(
    100,
    Math.round(
      dueTodayCount === 0
        ? 72
        : Math.max(
            30,
            100 -
              dueTodayCount * 6 -
              dashboard.overdue.length * 8 -
              Math.max(0, 70 - (topWeakTopic?.mastery_score ?? 70)) / 2
          )
    )
  );

  const sidebar = (
    <>
      <section className="glass-panel p-5">
        <p className="eyebrow">Wallet</p>
        <h3 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">
          {balance} credits
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Credits are reserved for premium AI actions. Daily review stays light and habit-friendly.
        </p>
        <Link
          href="/wallet"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[#102117] px-4 text-sm font-black text-white transition hover:bg-[#163623]"
        >
          Open wallet
        </Link>
      </section>

      <section className="glass-panel p-5">
        <p className="eyebrow">Recent Sessions</p>
        <div className="mt-4 space-y-3">
          {dashboard.recentSessions.length ? (
            dashboard.recentSessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-black/5 bg-white/55 p-4 dark:border-white/8 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black capitalize text-slate-900 dark:text-white">
                    {session.session_type.replace(/_/g, ' ')}
                  </p>
                  <span className="metric-chip !px-2 !py-1 !text-[10px]">{session.status}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {session.completed_items}/{session.total_items} items •{' '}
                  {new Date(session.started_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Your finished review sessions will appear here.</p>
          )}
        </div>
      </section>
    </>
  );

  return (
    <AppShell
      eyebrow="Daily Command"
      title={`Welcome back, ${firstName}`}
      description="The product now revolves around one job: convert raw study material into a reliable review habit. Start with what is due, then fix weak areas, then generate more only when needed."
      sidebar={sidebar}
      actions={
        <Link
          href={dueTodayCount > 0 ? '/review' : '/generator'}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#102117] px-4 text-sm font-black text-white transition hover:bg-[#163623]"
        >
          {dueTodayCount > 0 ? 'Start review' : 'Generate practice'}
        </Link>
      }
    >
      <section className="glass-panel-strong p-6 text-white md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="eyebrow !text-emerald-200/75">Today’s Focus</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.06em] md:text-5xl">
              {dueTodayCount > 0
                ? `${dueTodayCount} items are ready for today’s revision loop.`
                : 'Your queue is clear. Generate a fresh practice set or deepen one weak topic.'}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
              Keep momentum by finishing due items first, then use generation only where you need fresh material.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="metric-chip !border-white/10 !bg-white/10 !text-white">
                {dashboard.overdue.length} overdue
              </span>
              <span className="metric-chip !border-white/10 !bg-white/10 !text-white">
                {dashboard.weakTopics.length} weak topics
              </span>
              <span className="metric-chip !border-white/10 !bg-white/10 !text-white">
                {dashboard.firstReadyRate}% recent extraction success
              </span>
              <span className="metric-chip !border-white/10 !bg-white/10 !text-white">
                {dashboard.reviewCompletionRate}% review completion
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { label: 'Readiness', value: `${readiness}%`, tone: 'text-emerald-200' },
              { label: 'Due today', value: `${dueTodayCount}`, tone: 'text-white' },
              { label: 'Low-balance risk', value: balance < 120 ? 'High' : 'Stable', tone: 'text-sky-200' },
              { label: 'Recent answers', value: `${dashboard.recentAttempts.length}`, tone: 'text-emerald-200' },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">{item.label}</p>
                <p className={cn('mt-3 text-3xl font-black tracking-[-0.05em]', item.tone)}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Review Queue</p>
              <h3 className="panel-title mt-2">What to review next</h3>
            </div>
            <Link href="/review" className="text-sm font-black text-[#1a5c2a]">
              Open review
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {dashboard.dueToday.length ? (
              dashboard.dueToday.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-[24px] border border-black/5 bg-white/60 p-4 dark:border-white/8 dark:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black capitalize text-slate-950 dark:text-white">
                        {item.source_topic || item.item_type.replace(/_/g, ' ')}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        {item.item_type.replace(/_/g, ' ')} • {item.review_state}
                      </p>
                    </div>
                    <span className="metric-chip !px-2 !py-1 !text-[10px]">{item.mastery_score}% mastery</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    Due {new Date(item.due_at).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-black/8 bg-white/45 p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                No due items yet. Save a flashcard deck or complete one generated quiz to start the review engine.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="eyebrow">Weak Topics</p>
          <h3 className="panel-title mt-2">Where confidence is lowest</h3>
          <div className="mt-5 space-y-3">
            {dashboard.weakTopics.length ? (
              dashboard.weakTopics.slice(0, 5).map((topic) => (
                <div key={topic.id} className="rounded-[24px] border border-black/5 bg-white/60 p-4 dark:border-white/8 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-950 dark:text-white">{topic.topic_label}</p>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-300">{topic.mastery_score}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-white/8">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                      style={{ width: `${Math.max(8, topic.mastery_score)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {topic.mistakes_count} mistakes • {topic.due_count} due items
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Weak-topic signals will appear after your first few review sessions.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Resource Health</p>
              <h3 className="panel-title mt-2">Latest uploads and extraction status</h3>
            </div>
            <Link href="/resources" className="text-sm font-black text-[#1a5c2a]">
              Open library
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {dashboard.recentResources.length ? (
              dashboard.recentResources.map((resource) => (
                <div key={resource.id} className="rounded-[24px] border border-black/5 bg-white/60 p-4 dark:border-white/8 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">{resource.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {resource.subject || 'General'} • {new Date(resource.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="metric-chip !px-2 !py-1 !text-[10px]">{resource.processing_status || 'queued'}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {resource.processing_error ||
                      resource.extracted_preview ||
                      'Extraction preview will appear here once the source text is available.'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload your first study resource to start the core loop.
              </p>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <p className="eyebrow">Credit Activity</p>
          <h3 className="panel-title mt-2">Recent wallet movement</h3>
          <div className="mt-5 space-y-3">
            {dashboard.recentTransactions.length ? (
              dashboard.recentTransactions.map((tx) => (
                <div key={tx.id} className="rounded-[24px] border border-black/5 bg-white/60 p-4 dark:border-white/8 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {tx.source.replace(/_/g, ' ')}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={cn('text-sm font-black', tx.amount < 0 ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300')}>
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Your wallet history will appear here after signup, usage, or purchase.</p>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
