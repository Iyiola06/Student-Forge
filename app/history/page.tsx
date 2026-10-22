'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AppEmptyState from '@/components/app/AppEmptyState';
import Icon3D, { type Icon3DName } from '@/components/ui/Icon3D';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Kind = 'review' | 'essay' | 'tutor' | 'upload' | 'xp';

type TimelineItem = {
  id: string;
  kind: Kind;
  title: string;
  detail: string;
  at: string;
  badge?: string | null;
  href?: string;
};

const FILTERS: Array<{ id: 'all' | Kind; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'review', label: 'Reviews' },
  { id: 'essay', label: 'Essays' },
  { id: 'tutor', label: 'Tutor' },
  { id: 'upload', label: 'Uploads' },
  { id: 'xp', label: 'XP' },
];

const ICONS: Record<Kind, Icon3DName> = {
  review: 'brain',
  essay: 'writing-hand',
  tutor: 'robot',
  upload: 'inbox',
  xp: 'glowing-star',
};

function timeAgo(iso: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const steps: Array<[number, string]> = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, unit] of steps) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HistoryPage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const [query, setQuery] = useState('');
  const [week, setWeek] = useState({ reviews: 0, accuracy: null as number | null, xp: 0 });

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

      // Each source is optional: tables added by newer migrations may not exist yet.
      const safe = async <T,>(promise: PromiseLike<{ data: T[] | null }>) => {
        try {
          return (await promise).data ?? [];
        } catch {
          return [] as T[];
        }
      };

      const [sessions, history, essays, chats, resources, attempts] = await Promise.all([
        safe<any>(supabase.from('review_sessions').select('id,session_type,status,completed_items,total_items,correct_items,started_at').eq('user_id', user.id).order('started_at', { ascending: false }).limit(40)),
        safe<any>(supabase.from('study_history').select('id,action_type,details,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(60)),
        safe<any>(supabase.from('essay_submissions').select('id,question,score,max_score,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)),
        safe<any>(supabase.from('tutor_conversations').select('id,title,mode,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(30)),
        safe<any>(supabase.from('resources').select('id,title,processing_status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)),
        safe<any>(supabase.from('review_attempts').select('result,created_at').eq('user_id', user.id).gte('created_at', weekAgo).limit(2000)),
      ]);

      const timeline: TimelineItem[] = [
        ...sessions.map((s: any) => ({
          id: `s-${s.id}`,
          kind: 'review' as const,
          title: `${label(s.session_type)} session`,
          detail: `${s.completed_items}/${s.total_items} cards • ${s.correct_items ?? 0} recalled`,
          at: s.started_at,
          badge: s.status === 'completed' ? 'Completed' : 'Unfinished',
          href: '/review',
        })),
        ...essays.map((e: any) => ({
          id: `e-${e.id}`,
          kind: 'essay' as const,
          title: e.question,
          detail: 'Graded answer',
          at: e.created_at,
          badge: `${Math.round(Number(e.score))}/${Math.round(Number(e.max_score))}`,
          href: '/essay-grader',
        })),
        ...chats.map((c: any) => ({
          id: `c-${c.id}`,
          kind: 'tutor' as const,
          title: c.title,
          detail: `${label(c.mode)} mode`,
          at: c.updated_at,
          href: `/ai-tutor?conversation=${c.id}`,
        })),
        ...resources.map((r: any) => ({
          id: `r-${r.id}`,
          kind: 'upload' as const,
          title: r.title,
          detail: 'Added to your library',
          at: r.created_at,
          badge: r.processing_status,
          href: `/resources/${r.id}`,
        })),
        ...history
          .filter((h: any) => h.action_type === 'xp_awarded')
          .map((h: any) => ({
            id: `h-${h.id}`,
            kind: 'xp' as const,
            title: `+${h.details?.xp_earned ?? 0} XP`,
            detail: label(String(h.details?.source ?? 'study')),
            at: h.created_at,
          })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

      const correct = attempts.filter((a: any) => a.result === 'correct').length;
      setWeek({
        reviews: attempts.length,
        accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : null,
        xp: history
          .filter((h: any) => h.action_type === 'xp_awarded' && h.created_at >= weekAgo)
          .reduce((sum: number, h: any) => sum + Number(h.details?.xp_earned ?? 0), 0),
      });
      setItems(timeline);
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (filter === 'all' || item.kind === filter) &&
          (!query.trim() || `${item.title} ${item.detail}`.toLowerCase().includes(query.trim().toLowerCase()))
      ),
    [items, filter, query]
  );

  return (
    <AppShell eyebrow="Progress" title="Study history" description="Everything you have reviewed, practised, uploaded and earned, in one timeline.">
      <div className="workspace-stack">
        <section className="stat-trio">
          {[
            { label: 'Cards reviewed this week', value: week.reviews.toLocaleString(), icon: 'brain' as const },
            { label: 'Recall accuracy', value: week.accuracy === null ? '--' : `${week.accuracy}%`, icon: 'target' as const },
            { label: 'XP this week', value: week.xp.toLocaleString(), icon: 'glowing-star' as const },
          ].map((s) => (
            <div key={s.label} className="relative overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
              <Icon3D name={s.icon} size={36} className="absolute top-3 right-3" />
              <p className="pr-10 text-[12.5px] text-[var(--text-soft)]">{s.label}</p>
              <p className="mt-4 font-display text-[26px] font-semibold text-[var(--text-strong)]">{s.value}</p>
            </div>
          ))}
        </section>

        <section className="glass-panel app-panel">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="app-tabs overflow-x-auto">
              {FILTERS.map((f) => (
                <button key={f.id} className="app-tab" data-active={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history..."
              className="h-10 rounded-full border border-[var(--line-strong)] bg-[var(--card)] px-4 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent)] md:w-64"
            />
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-[20px] bg-[var(--card-2)]" />
                ))}
              </div>
            ) : visible.length ? (
              <ol className="space-y-1.5">
                {visible.map((item) => {
                  const body = (
                    <>
                      <span className="icon-tile size-11">
                        <Icon3D name={ICONS[item.kind]} size={26} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-medium text-[var(--text-strong)]">{item.title}</p>
                        <p className="truncate text-[12.5px] text-[var(--text-soft)]">
                          {item.detail} &middot; {timeAgo(item.at)}
                        </p>
                      </div>
                      {item.badge ? <span className="pill-tag shrink-0 capitalize">{item.badge}</span> : null}
                    </>
                  );
                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <Link href={item.href} className={cn('flex items-center gap-3 rounded-[20px] p-2.5 transition hover:bg-[var(--accent-softer)]')}>
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 rounded-[20px] p-2.5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <AppEmptyState
                icon="calendar"
                title="Nothing here yet"
                description="Your reviews, essays, tutor chats and uploads will appear here as you study."
                action={
                  <Link href="/review" className="primary-button">
                    Start a review
                  </Link>
                }
              />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
