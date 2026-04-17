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

  const metrics = [
    {
      label: 'Due today',
      value: `${dueTodayCount}`,
      detail: dashboard.overdue.length ? `${dashboard.overdue.length} overdue` : 'Queue under control',
    },
    {
      label: 'Readiness',
      value: `${readiness}%`,
      detail: `${dashboard.reviewCompletionRate}% review completion`,
    },
    {
      label: 'Weak topics',
      value: `${dashboard.weakTopics.length}`,
      detail: topWeakTopic ? topWeakTopic.topic_label : 'No risk signal yet',
    },
    {
      label: 'Credits',
      value: `${balance}`,
      detail: balance < 120 ? 'Low balance risk' : 'Premium actions available',
    },
  ];

  return (
    <AppShell
      eyebrow="Dashboard"
      title={`Hello, ${firstName}`}
      actions={
        <>
          <Link href={dueTodayCount > 0 ? '/review' : '/generator'} className="primary-button">
            {dueTodayCount > 0 ? 'Start review' : 'Generate practice'}
          </Link>
          <Link href="/resources" className="secondary-button hidden md:inline-flex">
            Open library
          </Link>
        </>
      }
    >
      <div className="workspace-stack">
        <section className="metric-strip">
          {metrics.map((metric) => (
            <div key={metric.label} className="glass-panel app-panel-tight">
              <p className="eyebrow">{metric.label}</p>
              <p className="mt-2 text-[25px] leading-[1.05] font-black tracking-[-0.05em] text-slate-950 dark:text-white">
                {metric.value}
              </p>
              <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{metric.detail}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="glass-panel app-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Review queue</p>
                <h2 className="panel-title mt-2">What to review next</h2>
              </div>
              <Link href="/review" className="ghost-button !h-9 !px-0">
                Open review
              </Link>
            </div>

            <div className="mt-4">
              {dashboard.dueToday.length ? (
                <div className="app-list">
                  {dashboard.dueToday.slice(0, 6).map((item) => (
                    <div key={item.id} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                              {item.source_topic || item.item_type.replace(/_/g, ' ')}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                              {item.item_type.replace(/_/g, ' ')} • {item.review_state}
                            </p>
                          </div>
                          <span className="metric-chip !px-2 !py-1 !text-[10px]">{item.mastery_score}%</span>
                        </div>
                        <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
                          Due {new Date(item.due_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="app-empty">No due items yet. Generate one study set or save a flashcard deck to start the review engine.</div>
              )}
            </div>
          </div>

          <div className="glass-panel app-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Weak topics</p>
                <h2 className="panel-title mt-2">Where confidence is lowest</h2>
              </div>
              <Link href="/review" className="ghost-button !h-9 !px-0">
                Deepen
              </Link>
            </div>

            <div className="mt-4">
              {dashboard.weakTopics.length ? (
                <div className="app-list">
                  {dashboard.weakTopics.slice(0, 5).map((topic) => (
                    <div key={topic.id} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950 dark:text-white">{topic.topic_label}</p>
                            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                              {topic.mistakes_count} mistakes • {topic.due_count} due items
                            </p>
                          </div>
                          <span className="text-sm font-black text-amber-600 dark:text-amber-300">{topic.mastery_score}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="app-empty">Weak-topic signals will sharpen after your first few review sessions.</div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="glass-panel app-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Library health</p>
                <h2 className="panel-title mt-2">Latest uploads and extraction status</h2>
              </div>
              <Link href="/resources" className="ghost-button !h-9 !px-0">
                Open library
              </Link>
            </div>

            <div className="mt-4">
              {dashboard.recentResources.length ? (
                <div className="app-list">
                  {dashboard.recentResources.map((resource) => (
                    <div key={resource.id} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950 dark:text-white">{resource.title}</p>
                            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                              {(resource.subject || 'General') + ' • ' + new Date(resource.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="metric-chip !px-2 !py-1 !text-[10px]">{resource.processing_status || 'queued'}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-[13px] text-slate-500 dark:text-slate-400">
                          {resource.processing_error || resource.extracted_preview || 'Extraction preview will appear here when processing completes.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="app-empty">Upload your first study material to start the core loop.</div>
              )}
            </div>
          </div>

          <div className="glass-panel app-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Recent sessions</p>
                <h2 className="panel-title mt-2">Your latest review runs</h2>
              </div>
              <Link href="/wallet" className="ghost-button !h-9 !px-0">
                Open wallet
              </Link>
            </div>

            <div className="mt-4">
              {dashboard.recentSessions.length ? (
                <div className="app-list">
                  {dashboard.recentSessions.map((session) => (
                    <div key={session.id} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black capitalize text-slate-950 dark:text-white">
                              {session.session_type.replace(/_/g, ' ')}
                            </p>
                            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                              {session.completed_items}/{session.total_items} items • {new Date(session.started_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'metric-chip !px-2 !py-1 !text-[10px]',
                              session.status === 'completed' && '!bg-[#163f73] !text-white dark:!bg-[#f39a2b] dark:!text-[#0b1420]'
                            )}
                          >
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="app-empty">Your finished review sessions will appear here.</div>
              )}
            </div>
          </div>
        </section>

        <section className="glass-panel app-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Wallet activity</p>
              <h2 className="panel-title mt-2">Recent credit movement</h2>
            </div>
            <Link href="/wallet" className="ghost-button !h-9 !px-0">
              View all
            </Link>
          </div>

          <div className="mt-4">
            {dashboard.recentTransactions.length ? (
              <div className="app-list">
                {dashboard.recentTransactions.map((tx) => (
                  <div key={tx.id} className="app-list-row">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">{tx.source.replace(/_/g, ' ')}</p>
                      <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                    <span className={cn('text-sm font-black', tx.amount < 0 ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300')}>
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="app-empty">Your wallet history will appear here after signup, usage, or purchase.</div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
