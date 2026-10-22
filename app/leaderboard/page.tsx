'use client';

import Image from 'next/image';
import AppShell from '@/components/layout/AppShell';
import AppEmptyState from '@/components/app/AppEmptyState';
import Icon3D from '@/components/ui/Icon3D';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LeaderboardPage() {
  const { profile } = useProfile();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'weekly'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    // Reset when timeframe changes
    setUsers([]);
    setPage(1);
    setHasMore(true);
  }, [timeframe]);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const supabase = createClient();
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      try {
        if (timeframe === 'all') {
          const { data, count } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, level, xp', { count: 'exact' })
            .order('xp', { ascending: false })
            .range(from, to);

          if (data) {
            setUsers(prev => page === 1 ? data : [...prev, ...data]);
            setHasMore(count !== null && from + data.length < count);
          }
        } else {
          const res = await fetch(`/api/leaderboard/weekly?page=${page}&limit=${ITEMS_PER_PAGE}`);
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            setUsers(prev => page === 1 ? json.data : [...prev, ...json.data]);
            setHasMore(json.hasMore);
          }
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
    fetchLeaderboard();
  }, [timeframe, page]);

  const top3 = users.slice(0, 3);
  const others = users.slice(3);

  const getAvatar = (url?: string) => url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';
  const getName = (id: string, name?: string) => {
    if (id === profile?.id) return 'You';
    return name || 'Student';
  };

  const tabs = (
    <div className="app-tabs">
      <button className="app-tab" data-active={timeframe === 'all'} onClick={() => setTimeframe('all')}>
        All time
      </button>
      <button className="app-tab" data-active={timeframe === 'weekly'} onClick={() => setTimeframe('weekly')}>
        This week
      </button>
    </div>
  );

  const podium = [
    { user: top3[1], place: 2, medal: 'medal' as const, height: 'h-24 md:h-32', tone: 'pastel-sky' },
    { user: top3[0], place: 1, medal: 'first-place' as const, height: 'h-32 md:h-44', tone: 'pastel-butter' },
    { user: top3[2], place: 3, medal: 'medal' as const, height: 'h-20 md:h-24', tone: 'pastel-peach' },
  ];

  return (
    <AppShell title="Leaderboard" eyebrow="Community" description="Earn XP by reviewing, practising and finishing sessions. Consistency beats cramming." actions={tabs}>
      <div className="workspace-stack mx-auto max-w-4xl">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-[var(--text-soft)]">
            <div className="size-6 animate-spin rounded-full border-4 border-[#4a9be8] border-t-transparent" />
            Loading rankings...
          </div>
        ) : (
          <>
            {top3.length > 0 ? (
              <section className="dashboard-hero-panel px-4 pt-10 sm:px-10">
                <div className="grid grid-cols-3 items-end gap-3 sm:gap-6">
                  {podium.map(({ user, place, medal, height, tone }) =>
                    user ? (
                      <div key={user.id} className="flex flex-col items-center text-center">
                        {place === 1 ? <Icon3D name="crown" size={44} className="mb-1 animate-float" /> : null}
                        <div className={cn('relative overflow-hidden rounded-full border-4 border-white bg-[var(--accent-soft)] shadow-[var(--shadow-md)] dark:border-white/10', place === 1 ? 'size-24 md:size-28' : 'size-16 md:size-20')}>
                          <Image src={getAvatar(user.avatar_url)} alt="" fill className="object-cover" unoptimized />
                        </div>
                        <p className="mt-3 max-w-full truncate font-display text-[15px] font-semibold text-[var(--text-strong)] md:text-[17px]">
                          {getName(user.id, user.full_name)}
                        </p>
                        <p className="text-[12.5px] text-[var(--text-soft)]">{user.xp?.toLocaleString()} XP</p>
                        <div className={cn('mt-3 flex w-full items-start justify-center rounded-t-[24px] border border-b-0 border-[var(--line)] pt-3', height, tone)}>
                          <Icon3D name={medal} size={place === 1 ? 44 : 34} />
                        </div>
                      </div>
                    ) : (
                      <div key={place} />
                    )
                  )}
                </div>
              </section>
            ) : null}

            <section className="glass-panel overflow-hidden">
              {others.length > 0 ? (
                <div>
                  {others.map((user, index) => {
                    const rank = index + 4;
                    const isMe = user.id === profile?.id;
                    return (
                      <div
                        key={user.id}
                        className={cn(
                          'flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5 last:border-0 md:gap-5 md:px-6',
                          isMe ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--accent-softer)]'
                        )}
                      >
                        <span className="w-7 text-center font-display text-[15px] font-semibold tabular-nums text-[var(--text-soft)]">{rank}</span>
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-[var(--accent-soft)]">
                          <Image src={getAvatar(user.avatar_url)} alt="" fill className="object-cover" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-medium text-[var(--text-strong)]">{getName(user.id, user.full_name)}</p>
                          <p className="text-[12px] text-[var(--text-soft)]">Level {user.level || 1}</p>
                        </div>
                        <span className="font-display text-[16px] font-semibold tabular-nums text-[var(--text-strong)]">
                          {user.xp?.toLocaleString()} <span className="text-[11px] font-normal text-[var(--text-soft)]">XP</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8">
                  <AppEmptyState icon="trophy" title="The race is wide open" description="Only a few learners have ranked so far. Finish a review session to climb the board." />
                </div>
              )}

              {hasMore && others.length > 0 ? (
                <div className="flex justify-center border-t border-[var(--line)] p-5">
                  <button onClick={() => setPage((p) => p + 1)} disabled={isLoadingMore} className="secondary-button">
                    {isLoadingMore ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
