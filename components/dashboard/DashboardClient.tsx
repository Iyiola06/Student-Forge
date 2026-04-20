'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { User } from '@supabase/supabase-js';
import { AppDataList, AppDataRow } from '@/components/app/AppDataList';
import AppEmptyState from '@/components/app/AppEmptyState';
import AppSection from '@/components/app/AppSection';
import AppStatCard from '@/components/app/AppStatCard';
import AppStatusBadge from '@/components/app/AppStatusBadge';
import DashboardHeroCard from '@/components/dashboard/DashboardHeroCard';
import DashboardProgressCluster from '@/components/dashboard/DashboardProgressCluster';
import AppShell from '@/components/layout/AppShell';
import { useProfile, type Profile } from '@/hooks/useProfile';

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

function toneForProcessingStatus(status?: string | null) {
  switch (status) {
    case 'ready':
    case 'completed':
      return 'success' as const;
    case 'failed':
    case 'error':
      return 'danger' as const;
    case 'processing':
    case 'running':
      return 'info' as const;
    default:
      return 'neutral' as const;
  }
}

function toneForSessionStatus(status?: string | null) {
  switch (status) {
    case 'completed':
      return 'success' as const;
    case 'active':
    case 'in_progress':
      return 'info' as const;
    case 'failed':
      return 'warning' as const;
    default:
      return 'neutral' as const;
  }
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export default function DashboardClient({
  initialData,
}: {
  initialData: { user: User | null; profile: Profile | null; dashboard: DashboardData };
}) {
  const { profile } = useProfile(initialData);
  const dashboard = initialData.dashboard;

  const firstName = profile?.full_name?.split(' ')[0] || 'Student';
  const dueTodayCount = dashboard.dueToday.length;
  const overdueCount = dashboard.overdue.length;
  const topWeakTopic = dashboard.weakTopics[0];
  const nextItem = dashboard.dueToday[0];
  const streakDays = profile?.streak_days ?? 0;
  const balance = profile?.credit_balance ?? 0;
  const cardsMastered = profile?.cards_mastered ?? 0;
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const completedRecentSessions = dashboard.recentSessions.filter((session) => session.status === 'completed').length;
  const accuracyRate = dashboard.recentAttempts.length
    ? Math.round((dashboard.recentAttempts.filter((attempt) => attempt.result === 'correct').length / dashboard.recentAttempts.length) * 100)
    : 0;
  const examReadinessScore = profile?.exam_readiness_score ?? 0;
  const readiness = Math.min(
    100,
    Math.round(
      dueTodayCount === 0
        ? examReadinessScore || 76
        : Math.max(
            32,
            100 -
              dueTodayCount * 6 -
              overdueCount * 8 -
              Math.max(0, 70 - (topWeakTopic?.mastery_score ?? 70)) / 2
          )
    )
  );

  const metrics = [
    {
      label: 'Due today',
      value: `${dueTodayCount}`,
      detail: overdueCount ? `${overdueCount} overdue` : 'Queue in control',
    },
    {
      label: 'Recent accuracy',
      value: `${accuracyRate}%`,
      detail: dashboard.recentAttempts.length ? `${dashboard.recentAttempts.length} recent answers tracked` : 'Builds after your first review run',
    },
    {
      label: 'Cards mastered',
      value: `${cardsMastered}`,
      detail: `${Math.max(examReadinessScore, readiness)}% exam readiness`,
    },
  ];

  return (
    <AppShell
      eyebrow="Dashboard"
      title={`Hello, ${firstName}`}
      description="Your next study move, your weak spots, and your learning momentum are all organized here."
      actions={
        <Link href="/resources" className="secondary-button hidden md:inline-flex">
          Open library
        </Link>
      }
    >
      <div className="workspace-stack">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.22fr)_360px]">
          <DashboardHeroCard
            dueTodayCount={dueTodayCount}
            overdueCount={overdueCount}
            weakTopicCount={dashboard.weakTopics.length}
            readiness={readiness}
            streakDays={streakDays}
            nextItem={
              nextItem
                ? {
                    title: nextItem.source_topic || formatLabel(nextItem.item_type),
                    kind: formatLabel(nextItem.item_type),
                    dueAt: nextItem.due_at,
                    masteryScore: nextItem.mastery_score,
                  }
                : null
            }
          />

          <AppSection
            eyebrow="Consistency"
            title={`${streakDays}-day streak`}
            description="The best dashboards reduce hesitation. The best study habits reduce recovery time."
            variant="soft"
            bodyClassName="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="dashboard-mini-surface">
                <p className="dashboard-mini-label">Level {'\u2022'} XP</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">
                  {level} {'\u2022'} {xp}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">Progress compounds fastest when your next block starts on time.</p>
              </div>

              <div className="dashboard-mini-surface">
                <p className="dashboard-mini-label">Session cadence</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">
                  {dashboard.recentSessions.length ? Math.round((completedRecentSessions / dashboard.recentSessions.length) * 100) : 0}%
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {completedRecentSessions} of {dashboard.recentSessions.length || 0} recent sessions finished cleanly.
                </p>
              </div>
            </div>

            <div className="dashboard-mini-surface">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="dashboard-mini-label">Recent rhythm</p>
                  <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">Latest session outcomes</p>
                </div>
                <span className="app-toolbar-chip">
                  <span className="material-symbols-outlined text-[15px]">account_balance_wallet</span>
                  {balance} credits
                </span>
              </div>

              {dashboard.recentSessions.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {dashboard.recentSessions.slice(0, 8).map((session) => (
                    <span key={session.id} className="dashboard-session-dot" data-state={session.status} title={session.status} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">Your session rhythm appears here after the first focused review run.</p>
              )}
            </div>
          </AppSection>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <AppStatCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <AppSection
            eyebrow="Weak topics"
            title="Where confidence needs reinforcement"
            description="These topics are most likely to create drag in your next review block."
            action={
              <Link href="/review" className="ghost-button !h-9 !px-0">
                Open review
              </Link>
            }
          >
            {dashboard.weakTopics.length ? (
              <AppDataList>
                {dashboard.weakTopics.slice(0, 5).map((topic) => (
                  <AppDataRow key={topic.id}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{topic.topic_label}</p>
                          <p className="mt-1 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                            {topic.mistakes_count} mistakes {'\u2022'} {topic.due_count} due items
                          </p>
                        </div>
                        <AppStatusBadge tone={topic.mastery_score < 45 ? 'danger' : 'warning'}>{topic.mastery_score}% mastery</AppStatusBadge>
                      </div>

                      <div className="mt-3 dashboard-progress-track">
                        <div
                          className="dashboard-progress-fill"
                          data-tone="warm"
                          style={{ '--value': topic.mastery_score } as CSSProperties}
                        />
                      </div>
                    </div>
                  </AppDataRow>
                ))}
              </AppDataList>
            ) : (
              <AppEmptyState description="No weak-topic pressure yet. Keep reviewing and this area will stay intentionally quiet." />
            )}
          </AppSection>

          <AppSection
            eyebrow="Mastery"
            title="Progress that explains your next move"
            description="A calmer view of readiness, completion quality, and how reliably materials become study-ready."
            variant="soft"
          >
            <DashboardProgressCluster
              examReadinessScore={Math.max(examReadinessScore, readiness)}
              reviewCompletionRate={dashboard.reviewCompletionRate}
              firstReadyRate={dashboard.firstReadyRate}
              accuracyRate={accuracyRate}
              cardsMastered={cardsMastered}
              level={level}
              xp={xp}
              attempts={dashboard.recentAttempts}
            />
          </AppSection>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <AppSection
            eyebrow="Recent resources"
            title="Study material entering the system"
            description="The latest uploads and whether they are already ready for flashcards, quizzes, and review."
            action={
              <Link href="/resources" className="ghost-button !h-9 !px-0">
                Open library
              </Link>
            }
          >
            {dashboard.recentResources.length ? (
              <AppDataList>
                {dashboard.recentResources.map((resource) => (
                  <AppDataRow key={resource.id}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950 dark:text-white">{resource.title}</p>
                          <p className="mt-1 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                            {(resource.subject || 'General') + ' \u2022 ' + new Date(resource.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <AppStatusBadge tone={toneForProcessingStatus(resource.processing_status)}>
                          {resource.processing_status || 'queued'}
                        </AppStatusBadge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                        {resource.processing_error || resource.extracted_preview || 'Extraction preview will appear here when processing completes.'}
                      </p>
                    </div>
                  </AppDataRow>
                ))}
              </AppDataList>
            ) : (
              <AppEmptyState
                description="Upload your first resource and Sulva’s Studify will turn it into material that can be reviewed daily."
                action={
                  <Link href="/resources" className="secondary-button">
                    Upload material
                  </Link>
                }
              />
            )}
          </AppSection>

          <AppSection
            eyebrow="Recent practice"
            title="Flashcards and quizzes you touched last"
            description="A compact record of the most recent review sessions across flashcards, quizzes, and mixed study runs."
            action={
              <Link href="/review" className="ghost-button !h-9 !px-0">
                Continue
              </Link>
            }
          >
            {dashboard.recentSessions.length ? (
              <AppDataList>
                {dashboard.recentSessions.map((session) => (
                  <AppDataRow key={session.id}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black capitalize text-slate-950 dark:text-white">
                            {formatLabel(session.session_type)}
                          </p>
                          <p className="mt-1 text-[13px] leading-6 text-slate-500 dark:text-slate-400">
                            {session.completed_items}/{session.total_items} items {'\u2022'} {new Date(session.started_at).toLocaleDateString()}
                          </p>
                        </div>
                        <AppStatusBadge tone={toneForSessionStatus(session.status)}>{session.status}</AppStatusBadge>
                      </div>
                    </div>
                  </AppDataRow>
                ))}
              </AppDataList>
            ) : (
              <AppEmptyState
                description="Your flashcard and quiz history will appear here after the first review session."
                action={
                  <Link href="/review" className="primary-button">
                    Start review
                  </Link>
                }
              />
            )}
          </AppSection>
        </section>
      </div>
    </AppShell>
  );
}
