import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createAuthedRouteClient } from '@/lib/supabase/routeAuth';

type IncomingItem = { question?: string; answer?: string; explanation?: string; front?: string; back?: string };

/** Adds questions or cards (e.g. a cheat sheet's hot list, a group deck) to the review queue. */
export async function POST(request: Request) {
  try {
    const { supabase, user } = await createAuthedRouteClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { items, topic, resourceId } = (await request.json()) as { items?: IncomingItem[]; topic?: string; resourceId?: string };
    const clean = (Array.isArray(items) ? items : [])
      .filter((item) => (item?.question && item?.answer) || (item?.front && item?.back))
      .slice(0, 100);
    if (!clean.length) return NextResponse.json({ error: 'No valid items' }, { status: 400 });

    const now = new Date().toISOString();
    const rows = clean.map((item) => {
      const isCard = Boolean(item.front && item.back);
      return {
        user_id: user.id,
        item_type: isCard ? 'flashcard' : 'quiz_question',
        source_id: randomUUID(),
        source_resource_id: resourceId ?? null,
        source_topic: typeof topic === 'string' && topic.trim() ? topic.trim().slice(0, 80) : 'General',
        due_at: now,
        content_payload: isCard
          ? { front: String(item.front).slice(0, 2000), back: String(item.back).slice(0, 4000), source_kind: 'added_card' }
          : {
              question: String(item.question).slice(0, 2000),
              answer: String(item.answer).slice(0, 4000),
              explanation: item.explanation ? String(item.explanation).slice(0, 4000) : null,
              options: [],
              source_kind: 'added_question',
            },
      };
    });

    const { error } = await supabase.from('review_items').insert(rows);
    if (error) throw error;
    return NextResponse.json({ success: true, added: rows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add review items' }, { status: 500 });
  }
}
