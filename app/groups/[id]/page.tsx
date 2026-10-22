/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import AppShell from '@/components/layout/AppShell';
import AppEmptyState from '@/components/app/AppEmptyState';
import FlashcardDrill, { type DrillCard } from '@/components/studio/FlashcardDrill';
import Icon3D from '@/components/ui/Icon3D';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Group = { id: string; name: string; description: string | null; invite_code: string; owner_id: string };
type Member = { user_id: string; role: string; profile: { full_name: string | null; avatar_url: string | null; xp: number | null; streak_days: number | null } | null };
type SharedDeck = { deck_id: string; shared_by: string; shared_at: string; deck: { id: string; title: string; flashcard_items: Array<{ count: number }> } | null };

const one = <T,>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? value[0] ?? null : value ?? null);

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [decks, setDecks] = useState<SharedDeck[]>([]);
  const [myDecks, setMyDecks] = useState<Array<{ id: string; title: string }>>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState<{ title: string; cards: DrillCard[] } | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setMe(user.id);
      const [{ data: g }, { data: m }, { data: d }, { data: mine }] = await Promise.all([
        supabase.from('study_groups').select('id,name,description,invite_code,owner_id').eq('id', id).maybeSingle(),
        supabase.from('study_group_members').select('user_id,role,profile:profiles(full_name,avatar_url,xp,streak_days)').eq('group_id', id),
        supabase
          .from('study_group_decks')
          .select('deck_id,shared_by,shared_at,deck:flashcards(id,title,flashcard_items(count))')
          .eq('group_id', id)
          .order('shared_at', { ascending: false }),
        supabase.from('flashcards').select('id,title').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      ]);
      setGroup((g as Group) ?? null);
      setMembers(
        ((m ?? []) as any[])
          .map((row) => ({ ...row, profile: one(row.profile) }))
          .sort((a, b) => Number(b.profile?.xp ?? 0) - Number(a.profile?.xp ?? 0))
      );
      setDecks(((d ?? []) as any[]).map((row) => ({ ...row, deck: one(row.deck) })));
      setMyDecks((mine as Array<{ id: string; title: string }>) ?? []);
      setLoading(false);
    })();
  }, [id, refresh]);

  const loadCards = async (deckId: string) => {
    const { data } = await createClient().from('flashcard_items').select('front_content,back_content').eq('deck_id', deckId);
    return (data ?? []).map((c) => ({ front: c.front_content, back: c.back_content }));
  };

  const addToMyReview = async (deck: SharedDeck) => {
    const cards = await loadCards(deck.deck_id);
    if (!cards.length) return toast.error('This deck has no cards.');
    const res = await fetch('/api/review/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: deck.deck?.title, items: cards }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || 'Could not add cards');
    toast.success(`${data.added} cards added to your spaced review.`);
  };

  const share = async (deckId: string) => {
    if (!me || !deckId) return;
    const { error } = await createClient().from('study_group_decks').insert({ group_id: id, deck_id: deckId, shared_by: me });
    if (error) return toast.error(error.message.includes('duplicate') ? 'That deck is already shared here.' : error.message);
    toast.success('Deck shared with the group.');
    setRefresh((n) => n + 1);
  };

  const leave = async () => {
    if (!me || !confirm('Leave this group?')) return;
    await createClient().from('study_group_members').delete().eq('group_id', id).eq('user_id', me);
    router.push('/groups');
  };

  if (!loading && !group) {
    return (
      <AppShell title="Study group">
        <AppEmptyState icon="locked" title="Group not found" description="It may have been deleted, or you are not a member." action={<Link href="/groups" className="primary-button">Back to groups</Link>} />
      </AppShell>
    );
  }

  const nameOf = (userId: string) => members.find((m) => m.user_id === userId)?.profile?.full_name || 'A member';

  return (
    <AppShell
      eyebrow="Study group"
      title={group?.name ?? 'Loading...'}
      description={group?.description ?? undefined}
      actions={
        group ? (
          <div className="flex flex-wrap gap-2">
            <button
              className="app-toolbar-chip"
              onClick={() => {
                navigator.clipboard.writeText(group.invite_code);
                toast.success('Invite code copied.');
              }}
            >
              <Icon3D name="key" size={16} /> Code <span className="font-mono tracking-[0.15em]">{group.invite_code}</span>
            </button>
            {group.owner_id !== me ? (
              <button className="ghost-button !h-9" onClick={leave}>
                Leave
              </button>
            ) : null}
          </div>
        ) : null
      }
    >
      <div className="workspace-stack">
        {drill ? (
          <section className="glass-panel app-panel">
            <h2 className="panel-title mb-4">{drill.title}</h2>
            <FlashcardDrill cards={drill.cards} onExit={() => setDrill(null)} />
          </section>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="glass-panel app-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Shared decks</p>
                <h2 className="panel-title mt-1">Study together</h2>
              </div>
              {myDecks.length ? (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    share(e.target.value);
                    e.target.value = '';
                  }}
                  className="h-10 w-full min-w-0 max-w-full truncate rounded-full border border-[var(--line-strong)] bg-[var(--card)] px-3 text-[13px] sm:w-auto sm:max-w-[280px]"
                >
                  <option value="" disabled>
                    Share one of your decks
                  </option>
                  {myDecks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            <div className="mt-4 space-y-2">
              {decks.length ? (
                decks.map((d) => (
                  <div key={d.deck_id} className="flex flex-wrap items-center gap-3 rounded-[20px] border border-[var(--line)] bg-[var(--card)] p-3">
                    <span className="icon-tile size-11">
                      <Icon3D name="card-index" size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-medium text-[var(--text-strong)]">{d.deck?.title ?? 'Deck'}</p>
                      <p className="text-[12px] text-[var(--text-soft)]">
                        {d.deck?.flashcard_items?.[0]?.count ?? 0} cards &middot; shared by {d.shared_by === me ? 'you' : nameOf(d.shared_by)}
                      </p>
                    </div>
                    <button className="secondary-button !h-8 !px-3 !text-[12.5px]" onClick={async () => setDrill({ title: d.deck?.title ?? 'Deck', cards: await loadCards(d.deck_id) })}>
                      Drill
                    </button>
                    <button className="primary-button !h-8 !px-3 !text-[12.5px]" onClick={() => addToMyReview(d)}>
                      Add to my review
                    </button>
                  </div>
                ))
              ) : (
                <AppEmptyState icon="card-box" title="No shared decks yet" description="Share a deck from your library and everyone in the group can drill it or add it to their review." />
              )}
            </div>
          </div>

          <div className="glass-panel app-panel">
            <p className="eyebrow">Members</p>
            <h2 className="panel-title mt-1">Group leaderboard</h2>
            <ol className="mt-4 space-y-1.5">
              {members.map((m, i) => (
                <li key={m.user_id} className={cn('flex items-center gap-3 rounded-[18px] p-2.5', m.user_id === me && 'bg-[var(--accent-soft)]')}>
                  <span className="w-6 text-center font-display text-[14px] font-semibold text-[var(--text-soft)]">{i + 1}</span>
                  <span className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-soft)]">
                    {m.profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.profile.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      <Icon3D name="student-2" size={28} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[var(--text-strong)]">
                      {m.user_id === me ? 'You' : m.profile?.full_name || 'Student'}
                      {m.role === 'owner' ? <span className="ml-2 text-[11px] text-[var(--text-soft)]">owner</span> : null}
                    </p>
                    <p className="flex items-center gap-1 text-[12px] text-[var(--text-soft)]">
                      <Icon3D name="fire" size={12} /> {m.profile?.streak_days ?? 0}d streak
                    </p>
                  </div>
                  <span className="font-display text-[15px] font-semibold text-[var(--text-strong)]">
                    {(m.profile?.xp ?? 0).toLocaleString()} <span className="text-[11px] font-normal text-[var(--text-soft)]">XP</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
