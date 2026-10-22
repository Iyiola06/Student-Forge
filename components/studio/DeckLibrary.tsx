'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createClient } from '@/lib/supabase/client';
import Icon3D from '@/components/ui/Icon3D';
import type { DrillCard } from '@/components/studio/FlashcardDrill';

type Deck = { id: string; title: string; subject: string | null; created_at: string; flashcard_items: Array<{ count: number }> };
type Group = { id: string; name: string };

export default function DeckLibrary({ refreshKey, onDrill }: { refreshKey: number; onDrill: (title: string, cards: DrillCard[]) => void }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingDeck, setSharingDeck] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: deckRows }, { data: memberships }] = await Promise.all([
        supabase
          .from('flashcards')
          .select('id,title,subject,created_at,flashcard_items(count)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('study_group_members').select('study_groups(id,name)').eq('user_id', user.id),
      ]);
      if (cancelled) return;
      setDecks((deckRows as Deck[]) ?? []);
      setGroups(
        ((memberships ?? []) as Array<{ study_groups: Group | Group[] | null }>)
          .flatMap((m) => (Array.isArray(m.study_groups) ? m.study_groups : m.study_groups ? [m.study_groups] : []))
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const drill = async (deck: Deck) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('flashcard_items').select('front_content,back_content').eq('deck_id', deck.id);
    if (error || !data?.length) {
      toast.error('This deck has no cards yet.');
      return;
    }
    onDrill(deck.title, data.map((d) => ({ front: d.front_content, back: d.back_content })));
  };

  const shareToGroup = async (deckId: string, groupId: string) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('study_group_decks').insert({ group_id: groupId, deck_id: deckId, shared_by: user.id });
    setSharingDeck(null);
    if (error && !String(error.message).includes('duplicate')) toast.error(error.message);
    else toast.success('Deck shared with your group.');
  };

  if (loading) return <div className="h-24 animate-pulse rounded-[22px] bg-[var(--card-2)]" />;

  if (!decks.length) {
    return (
      <p className="rounded-[22px] border border-dashed border-[var(--line-strong)] p-5 text-center text-sm text-[var(--text-soft)]">
        Decks you generate are saved here automatically.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {decks.map((deck) => {
        const count = deck.flashcard_items?.[0]?.count ?? 0;
        return (
          <div key={deck.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--card)] p-4">
            <div className="flex items-start gap-3">
              <span className="icon-tile size-11">
                <Icon3D name="card-index" size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium text-[var(--text-strong)]">{deck.title}</p>
                <p className="text-[12px] text-[var(--text-soft)]">
                  {count} cards &middot; {new Date(deck.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="primary-button !h-8 !px-3 !text-[12.5px]" onClick={() => drill(deck)}>
                Drill
              </button>
              <button
                className="secondary-button !h-8 !px-3 !text-[12.5px]"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/shared/flashcard/${deck.id}`);
                  toast.success('Share link copied.');
                }}
              >
                Copy link
              </button>
              {groups.length ? (
                sharingDeck === deck.id ? (
                  <select
                    autoFocus
                    className="h-8 rounded-full border border-[var(--line-strong)] bg-[var(--card)] px-3 text-[12.5px]"
                    defaultValue=""
                    onChange={(e) => e.target.value && shareToGroup(deck.id, e.target.value)}
                    onBlur={() => setSharingDeck(null)}
                  >
                    <option value="" disabled>
                      Choose group
                    </option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button className="secondary-button !h-8 !px-3 !text-[12.5px]" onClick={() => setSharingDeck(deck.id)}>
                    Share to group
                  </button>
                )
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
