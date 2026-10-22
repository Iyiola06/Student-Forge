'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { User } from '@supabase/supabase-js';
import { ArrowRight } from 'lucide-react';
import AppStatusBadge from '@/components/app/AppStatusBadge';
import AppEmptyState from '@/components/app/AppEmptyState';
import AppShell from '@/components/layout/AppShell';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
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
  recentTransactions: Array<{ id: string; amount: number; source: string; created_at: string }>;
  recentSessions: Array<{
    id: string;
    session_type: string;
    status: string;
    completed_items: number;
    total_items: number;
    started_at: string;
    completed_at: string | null;
  }>;
  recentAttempts: Array<{ id: string; result: string; created_at: string }>;
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

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function daysUntil(date?: string | null) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
  return Number.isFinite(diff) && diff >= 0 ? diff : null;
}

function iconForSubject(subject?: string | null): Icon3DName {
  const s = (subject || '').toLowerCase();
  if (/chem/.test(s)) return 'test-tube';
  if (/bio|life|anatomy/.test(s)) return 'dna';
  if (/phys/.test(s)) return 'bolt';
  if (/math|calc|stat|algebra/.test(s)) return 'abacus';
  if (/econ|account|finance|business/.test(s)) return 'chart';
  if (/geo|history|gov/.test(s)) return 'globe';
  if (/eng|lit|lang/.test(s)) return 'open-book';
  if (/comp|code|tech|ict/.test(s)) return 'laptop';
  return 'notebook';
}

/** The single most useful thing to do right now. */
function pickMission(args: {
  dueToday: number;
  overdue: number;
  weakTopic?: { topic_label: string; mastery_score: number };
  hasResources: boolean;
  latestResource?: { id: string; title: string };
}) {
  if (args.dueToday > 0) {
    const minutes = Math.max(2, Math.round(args.dueToday * 0.5));
    return {
      kicker: args.overdue ? `${args.overdue} overdue, review before they slip` : 'Your memory is ready for a refresh',
      title: `Review ${args.dueToday} card${args.dueToday === 1 ? '' : 's'}`,
      body: `About ${minutes} minutes. Recalling right before you forget is what makes knowledge permanent.`,
      cta: 'Start review',
      href: '/review',
      icon: 'brain' as Icon3DName,
    };
  }
  if (args.weakTopic) {
    return {
      kicker: `Weakest topic at ${args.weakTopic.mastery_score}% mastery`,
      title: `Strengthen ${args.weakTopic.topic_label}`,
      body: 'A short targeted quiz on your weakest topic gives the biggest jump in exam readiness.',
      cta: 'Practise this topic',
      href: `/generator?topic=${encodeURIComponent(args.weakTopic.topic_label)}`,
      icon: 'target' as Icon3DName,
    };
  }
  if (!args.hasResources) {
    return {
      kicker: 'Step one',
      title: 'Upload your first notes',
      body: 'A PDF, slides or photos of your notebook. We turn them into clean study material in seconds.',
      cta: 'Upload material',
      href: '/resources',
      icon: 'inbox' as Icon3DName,
    };
  }
  return {
    kicker: 'All caught up',
    title: 'Build a fresh practice set',
    body: args.latestResource
      ? `Turn "${args.latestResource.title}" into a quiz while it is still fresh.`
      : 'Generate a quiz or flashcards from your library to keep the streak moving.',
    cta: 'Generate practice',
    href: args.latestResource ? `/generator?resource=${args.latestResource.id}` : '/generator',
    icon: 'sparkles' as Icon3DName,
  };
}

const quickTools: Array<{ name: string; body: string; href: string; icon: Icon3DName; tone: string }> = [
  { name: 'Quiz', body: 'Exam-style MCQs', href: '/generator?type=mcq', icon: 'target', tone: 'pastel-mint' },
  { name: 'Flashcards', body: 'Spaced repetition', href: '/generator?type=flashcards', icon: 'card-index', tone: 'pastel-lime' },
  { name: 'AI Tutor', body: 'Ask anything', href: '/ai-tutor', icon: 'robot', tone: 'pastel-sky' },
  { name: 'Simplifier', body: 'Explain it simply', href: '/simplifier', icon: 'bulb', tone: 'pastel-peach' },
  { name: 'Exam Ready', body: 'Cheat sheet', href: '/generator?type=exam_snapshot', icon: 'scroll', tone: 'pastel-lavender' },
  { name: 'Essay Grader', body: 'Mark my answer', href: '/essay-grader', icon: 'writing-hand', tone: 'pastel-blush' },
];

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
  const streakDays = profile?.streak_days ?? 0;
  const cardsMastered = profile?.cards_mastered ?? 0;
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const examDays = daysUntil(profile?.exam_date);
  const accuracyRate = dashboard.recentAttempts.length
    ? Math.round((dashboard.recentAttempts.filter((a) => a.result === 'correct').length / dashboard.recentAttempts.length) * 100)
    : null;
  const examReadinessScore = profile?.exam_readiness_score ?? 0;
  const readiness = Math.min(
    100,
    Math.round(
      dueTodayCount === 0
        ? examReadinessScore || 0
        : Math.max(32, 100 - dueTodayCount * 6 - overdueCount * 8 - Math.max(0, 70 - (topWeakTopic?.mastery_score ?? 70)) / 2)
    )
  );

  const mission = pickMission({
    dueToday: dueTodayCount,
    overdue: overdueCount,
    weakTopic: topWeakTopic,
    hasResources: dashboard.recentResources.length > 0,
    latestResource: dashboard.recentResources.find((r) => r.processing_status === 'ready'),
  });

  // Activity over the last 7 days from attempts + sessions.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const activityByDay = week.map((day) => {
    const next = day.getTime() + 86_400_000;
    const inDay = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= day.getTime() && t < next;
    };
    return (
      dashboard.recentAttempts.filter((a) => inDay(a.created_at)).length +
      dashboard.recentSessions.filter((s) => inDay(s.started_at)).length * 3
    );
  });
  const maxActivity = Math.max(1, ...activityByDay);

  const stats: Array<{ label: string; value: string; detail: string; icon: Icon3DName }> = [
    { label: 'Due today', value: `${dueTodayCount}`, detail: overdueCount ? `${overdueCount} overdue` : 'Queue under control', icon: 'alarm' },
    { label: 'Streak', value: `${streakDays} day${streakDays === 1 ? '' : 's'}`, detail: streakDays ? 'Show up again today' : 'Start one today', icon: 'fire' },
    {
      label: 'Recall accuracy',
      value: accuracyRate === null ? '--' : `${accuracyRate}%`,
      detail: dashboard.recentAttempts.length ? `Last ${dashboard.recentAttempts.length} answers` : 'Appears after your first review',
      icon: 'target',
    },
    { label: 'Cards mastered', value: `${cardsMastered}`, detail: `Level ${level} • ${xp.toLocaleString()} XP`, icon: 'crown' },
  ];

  return (
    <AppShell title={`${greeting()}, ${firstName}`} hideHeader>
      <div className="workspace-stack">
        {/* Hero: today's mission */}
        <section className="dashboard-hero-panel animate-rise">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-9">
            <div className="relative z-10 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="eyebrow-pill">
                  <Icon3D name="wave" size={18} />
                  {greeting()}, {firstName}
                </span>
                {examDays !== null ? (
                  <span className="eyebrow-pill">
                    <Icon3D name="calendar" size={18} />
                    Exam in {examDays} day{examDays === 1 ? '' : 's'}
                  </span>
                ) : null}
              </div>

              <p className="mt-6 text-[14px] text-[#3d5a7a] dark:text-[#9fbfe0]">Today&rsquo;s mission &middot; {mission.kicker}</p>
              <h1 className="display-md mt-2 max-w-[18ch] text-balance text-[#0b1220] dark:text-white">{mission.title}</h1>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-7 text-[#3d4657] dark:text-[#c9d3e3]">{mission.body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={mission.href} className="primary-button !h-12 !px-6">
                  {mission.cta}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/ai-tutor"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white/75 px-5 text-sm font-medium text-[#0b1220] backdrop-blur-md transition hover:bg-white dark:bg-white/10 dark:text-white"
                >
                  <Icon3D name="robot" size={20} />
                  Ask the tutor
                </Link>
              </div>
            </div>

            <div className="relative sm:min-h-[230px]">
              <Icon3D name={mission.icon} size={150} priority className="animate-float absolute top-0 right-6 hidden sm:block lg:right-10" />
              <div className="dashboard-mini-surface flex items-center gap-4 sm:absolute sm:right-0 sm:bottom-0 sm:w-[300px]">
                <div className="dashboard-progress-orbit !w-[92px] shrink-0" style={{ '--progress': readiness } as CSSProperties}>
                  <div className="dashboard-progress-orbit-value">
                    <p className="font-display text-[24px] leading-none font-semibold text-[var(--text-strong)]">{readiness}</p>
                    <p className="mt-1 text-[10px] text-[var(--text-soft)]">ready</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-semibold text-[var(--text-strong)]">Exam readiness</p>
                  <p className="mt-1 text-[13px] leading-5 text-[var(--text-soft)]">
                    {readiness >= 75
                      ? 'Strong. Keep reviews short and daily.'
                      : readiness >= 50
                        ? 'Getting there. Close your weak topics.'
                        : 'Early days. Build the habit first.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="lift relative overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] animate-rise sm:p-5"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <Icon3D name={s.icon} size={44} className="absolute top-4 right-4 sm:size-[52px]" />
              <p className="text-[13px] text-[var(--text-soft)]">{s.label}</p>
              <p className="mt-6 font-display text-[28px] leading-none font-semibold tracking-[-0.03em] text-[var(--text-strong)] sm:text-[32px]">
                {s.value}
              </p>
              <p className="mt-2 text-[12.5px] text-[var(--text-soft)]">{s.detail}</p>
            </div>
          ))}
        </section>

        {/* Weak topics + week */}
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="glass-panel app-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Focus areas</p>
                <h2 className="panel-title mt-1">Where confidence needs work</h2>
              </div>
              <Link href="/review" className="secondary-button !h-9 !px-4">
                Review
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {dashboard.weakTopics.length ? (
                dashboard.weakTopics.slice(0, 5).map((topic) => (
                  <div key={topic.id} className="flex items-center gap-4 rounded-[20px] border border-[var(--line)] bg-[var(--card-2)] p-3 pr-4">
                    <span className="icon-tile size-12">
                      <Icon3D name={iconForSubject(topic.topic_label)} size={28} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[14px] font-medium text-[var(--text-strong)]">{topic.topic_label}</p>
                        <span className="shrink-0 text-[13px] font-medium text-[var(--text-soft)]">{topic.mastery_score}%</span>
                      </div>
                      <div className="mt-2 dashboard-progress-track !h-2">
                        <div
                          className="dashboard-progress-fill"
                          data-tone={topic.mastery_score < 45 ? 'warm' : undefined}
                          style={{ '--value': topic.mastery_score } as CSSProperties}
                        />
                      </div>
                      <p className="mt-1.5 text-[12px] text-[var(--text-soft)]">
                        {topic.mistakes_count} mistakes &middot; {topic.due_count} due
                      </p>
                    </div>
                    <Link
                      href={`/generator?topic=${encodeURIComponent(topic.topic_label)}`}
                      className="hidden shrink-0 text-[13px] font-medium text-[var(--accent)] hover:underline sm:inline"
                    >
                      Practise
                    </Link>
                  </div>
                ))
              ) : (
                <AppEmptyState
                  icon="seedling"
                  title="No weak topics yet"
                  description="As you answer questions, topics you struggle with show up here so you know exactly where to focus."
                />
              )}
            </div>
          </div>

          <div className="glass-panel app-panel flex flex-col">
            <p className="eyebrow">This week</p>
            <h2 className="panel-title mt-1">Your study rhythm</h2>
            <div className="mt-6 flex flex-1 items-end justify-between gap-2">
              {week.map((day, i) => {
                const value = activityByDay[i];
                const isToday = i === 6;
                return (
                  <div key={day.toISOString()} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-[120px] w-full items-end justify-center">
                      <div
                        className={cn(
                          'w-full max-w-[34px] rounded-full transition-all',
                          value ? 'bg-gradient-to-t from-[#4a9be8] to-[#8cc4f5]' : 'bg-[var(--line)]',
                          isToday && 'ring-4 ring-[var(--ring-brand)]'
                        )}
                        style={{ height: `${value ? 18 + (value / maxActivity) * 82 : 12}%` }}
                        title={`${value} activities`}
                      />
                    </div>
                    <span className={cn('text-[12px]', isToday ? 'font-semibold text-[var(--text-strong)]' : 'text-[var(--text-soft)]')}>
                      {day.toLocaleDateString(undefined, { weekday: 'narrow' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-[20px] bg-[var(--accent-softer)] p-3">
              <Icon3D name="fire" size={32} />
              <p className="text-[13px] leading-5 text-[var(--text-body)]">
                {streakDays >= 3
                  ? `${streakDays} days in a row. Short daily sessions beat long cramming nights.`
                  : 'Study a little every day. Even 5 minutes keeps the streak and your memory alive.'}
              </p>
            </div>
          </div>
        </section>

        {/* Quick tools */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="eyebrow">Study tools</p>
              <h2 className="panel-title mt-1">Pick a way to practise</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {quickTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={cn('lift group relative flex flex-col overflow-hidden rounded-[26px] border border-[var(--line)] p-4', tool.tone)}
              >
                <Icon3D name={tool.icon} size={64} className="transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-6deg]" />
                <p className="mt-4 font-display text-[15.5px] font-semibold text-[var(--text-strong)]">{tool.name}</p>
                <p className="text-[12.5px] text-[var(--text-soft)]">{tool.body}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Library + practice */}
        <section className="grid gap-5 xl:grid-cols-2">
          <div className="glass-panel app-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Library</p>
                <h2 className="panel-title mt-1">Recent material</h2>
              </div>
              <Link href="/resources" className="secondary-button !h-9 !px-4">
                Open library
              </Link>
            </div>
            <div className="mt-5 space-y-2">
              {dashboard.recentResources.length ? (
                dashboard.recentResources.map((resource) => (
                  <Link
                    key={resource.id}
                    href={`/resources/${resource.id}`}
                    className="flex items-center gap-4 rounded-[20px] p-2.5 transition hover:bg-[var(--accent-softer)]"
                  >
                    <span className="icon-tile size-12">
                      <Icon3D name={iconForSubject(resource.subject || resource.title)} size={28} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-[var(--text-strong)]">{resource.title}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-soft)]">
                        {resource.processing_error ||
                          `${resource.subject || 'General'} • ${new Date(resource.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                    <AppStatusBadge tone={toneForProcessingStatus(resource.processing_status)}>
                      {resource.processing_status || 'queued'}
                    </AppStatusBadge>
                  </Link>
                ))
              ) : (
                <AppEmptyState
                  icon="inbox"
                  title="Your library is empty"
                  description="Upload a PDF, slides or photos and we will turn them into study material you can practise from."
                  action={
                    <Link href="/resources" className="primary-button">
                      Upload material
                    </Link>
                  }
                />
              )}
            </div>
          </div>

          <div className="glass-panel app-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Practice</p>
                <h2 className="panel-title mt-1">Recent sessions</h2>
              </div>
              <Link href="/history" className="secondary-button !h-9 !px-4">
                History
              </Link>
            </div>
            <div className="mt-5 space-y-2">
              {dashboard.recentSessions.length ? (
                dashboard.recentSessions.map((session) => {
                  const pct = session.total_items ? Math.round((session.completed_items / session.total_items) * 100) : 0;
                  return (
                    <div key={session.id} className="flex items-center gap-4 rounded-[20px] p-2.5">
                      <span className="icon-tile size-12">
                        <Icon3D name={session.session_type.includes('quiz') ? 'clipboard' : 'card-index'} size={28} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium capitalize text-[var(--text-strong)]">{formatLabel(session.session_type)}</p>
                        <div className="mt-2 dashboard-progress-track !h-1.5">
                          <div className="dashboard-progress-fill" data-tone="success" style={{ '--value': pct } as CSSProperties} />
                        </div>
                      </div>
                      <span className="text-[12.5px] text-[var(--text-soft)]">
                        {session.completed_items}/{session.total_items}
                      </span>
                    </div>
                  );
                })
              ) : (
                <AppEmptyState
                  icon="card-index"
                  title="No sessions yet"
                  description="Your first review session takes about five minutes. Your history and progress will build up here."
                  action={
                    <Link href="/review" className="primary-button">
                      Start review
                    </Link>
                  }
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
