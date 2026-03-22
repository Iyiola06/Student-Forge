-- One-time XP backfill for already-active users.
-- Run this once in the Supabase SQL editor after migration 00007 is applied.
--
-- Assumptions:
-- - We use durable usage signals from the database instead of trying to infer
--   every missed real-time XP event exactly.
-- - The weighting is intentionally conservative to avoid massively over-crediting.
-- - A user is treated as "active" only if they have at least one usage signal.
--
-- Recommended flow:
-- 1. Run the preview query first and review the numbers.
-- 2. If the totals look right, run the transaction block below it once.

with usage_rollup as (
  select
    p.id as user_id,
    coalesce(r.resources_count, 0) as resources_count,
    coalesce(q.quizzes_count, 0) as quizzes_count,
    coalesce(f.decks_count, 0) as decks_count,
    coalesce(fi.mastered_count, 0) as mastered_count,
    coalesce(rp.progress_points, 0) as progress_points,
    coalesce(pq.past_questions_count, 0) as past_questions_count,
    coalesce(sh.history_points, 0) as history_points
  from public.profiles p
  left join (
    select user_id, count(*)::int as resources_count
    from public.resources
    group by user_id
  ) r on r.user_id = p.id
  left join (
    select user_id, count(*)::int as quizzes_count
    from public.quizzes
    group by user_id
  ) q on q.user_id = p.id
  left join (
    select user_id, count(*)::int as decks_count
    from public.flashcards
    group by user_id
  ) f on f.user_id = p.id
  left join (
    select d.user_id, count(*)::int as mastered_count
    from public.flashcard_items fi
    join public.flashcards d on d.id = fi.deck_id
    where fi.status = 'mastered'
    group by d.user_id
  ) fi on fi.user_id = p.id
  left join (
    select user_id, coalesce(sum(greatest(least(completion_percentage, 100), 0) / 10), 0)::int as progress_points
    from public.reading_progress
    group by user_id
  ) rp on rp.user_id = p.id
  left join (
    select user_id, count(*)::int as past_questions_count
    from public.past_questions
    group by user_id
  ) pq on pq.user_id = p.id
  left join (
    select
      user_id,
      count(*) filter (
        where action_type <> 'xp_awarded'
      )::int * 5 as history_points
    from public.study_history
    group by user_id
  ) sh on sh.user_id = p.id
),
backfill as (
  select
    user_id,
    (
      resources_count * 10 +
      quizzes_count * 30 +
      decks_count * 30 +
      mastered_count * 5 +
      progress_points +
      past_questions_count * 25 +
      history_points
    )::int as xp_to_add
  from usage_rollup
  where not exists (
    select 1
    from public.study_history sh
    where sh.user_id = usage_rollup.user_id
      and sh.action_type = 'xp_backfill'
      and sh.details->>'source' = '2026-03-22_active_user_backfill'
  )
)
select
  b.user_id,
  p.full_name,
  p.xp as current_xp,
  b.xp_to_add,
  p.xp + b.xp_to_add as projected_xp,
  greatest(coalesce(p.level, 1), floor(sqrt((p.xp + b.xp_to_add) / 100.0))::int + 1) as projected_level
from backfill b
join public.profiles p on p.id = b.user_id
where b.xp_to_add > 0
order by b.xp_to_add desc, p.created_at asc;

begin;

with usage_rollup as (
  select
    p.id as user_id,
    coalesce(r.resources_count, 0) as resources_count,
    coalesce(q.quizzes_count, 0) as quizzes_count,
    coalesce(f.decks_count, 0) as decks_count,
    coalesce(fi.mastered_count, 0) as mastered_count,
    coalesce(rp.progress_points, 0) as progress_points,
    coalesce(pq.past_questions_count, 0) as past_questions_count,
    coalesce(sh.history_points, 0) as history_points
  from public.profiles p
  left join (
    select user_id, count(*)::int as resources_count
    from public.resources
    group by user_id
  ) r on r.user_id = p.id
  left join (
    select user_id, count(*)::int as quizzes_count
    from public.quizzes
    group by user_id
  ) q on q.user_id = p.id
  left join (
    select user_id, count(*)::int as decks_count
    from public.flashcards
    group by user_id
  ) f on f.user_id = p.id
  left join (
    select d.user_id, count(*)::int as mastered_count
    from public.flashcard_items fi
    join public.flashcards d on d.id = fi.deck_id
    where fi.status = 'mastered'
    group by d.user_id
  ) fi on fi.user_id = p.id
  left join (
    select user_id, coalesce(sum(greatest(least(completion_percentage, 100), 0) / 10), 0)::int as progress_points
    from public.reading_progress
    group by user_id
  ) rp on rp.user_id = p.id
  left join (
    select user_id, count(*)::int as past_questions_count
    from public.past_questions
    group by user_id
  ) pq on pq.user_id = p.id
  left join (
    select
      user_id,
      count(*) filter (
        where action_type <> 'xp_awarded'
      )::int * 5 as history_points
    from public.study_history
    group by user_id
  ) sh on sh.user_id = p.id
),
backfill as (
  select
    user_id,
    (
      resources_count * 10 +
      quizzes_count * 30 +
      decks_count * 30 +
      mastered_count * 5 +
      progress_points +
      past_questions_count * 25 +
      history_points
    )::int as xp_to_add
  from usage_rollup
  where (
    resources_count * 10 +
    quizzes_count * 30 +
    decks_count * 30 +
    mastered_count * 5 +
    progress_points +
    past_questions_count * 25 +
    history_points
  ) > 0
  and not exists (
    select 1
    from public.study_history sh
    where sh.user_id = usage_rollup.user_id
      and sh.action_type = 'xp_backfill'
      and sh.details->>'source' = '2026-03-22_active_user_backfill'
  )
),
updated as (
  update public.profiles p
  set
    xp = p.xp + b.xp_to_add,
    level = greatest(coalesce(p.level, 1), floor(sqrt((p.xp + b.xp_to_add) / 100.0))::int + 1),
    updated_at = timezone('utc'::text, now())
  from backfill b
  where p.id = b.user_id
  returning p.id, b.xp_to_add
)
insert into public.study_history (
  user_id,
  action_type,
  entity_type,
  details
)
select
  u.id,
  'xp_backfill',
  'profile',
  jsonb_build_object(
    'xp_earned', u.xp_to_add,
    'source', '2026-03-22_active_user_backfill'
  )
from updated u;

commit;
