--========================================================================
-- 00014 - Server-side study streaks and mastered-card counts
--
-- Profiles are protected by prevent_critical_profile_updates, which silently
-- reverts client writes to streak_days / cards_mastered. This trusted routine
-- updates them when a student actually studies (reviews, practice, tutoring).
--========================================================================

alter table public.profiles add column if not exists last_active_date date;
alter table public.profiles add column if not exists cards_mastered integer default 0;

create or replace function public.record_study_activity(
  p_user_id uuid,
  p_cards_mastered_delta integer default 0
)
returns table (
  streak_days integer,
  last_active_date date,
  cards_mastered integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_today date := (timezone('Africa/Lagos', now()))::date;
  v_streak integer;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'Unauthorized';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Profile not found';
  end if;

  v_streak := coalesce(v_profile.streak_days, 0);
  if v_profile.last_active_date is null or v_profile.last_active_date::date < v_today - 1 then
    v_streak := 1;
  elsif v_profile.last_active_date::date = v_today - 1 then
    v_streak := v_streak + 1;
  elsif v_streak = 0 then
    v_streak := 1;
  end if;

  perform set_config('app.allow_critical_profile_updates', 'true', true);

  update public.profiles
  set
    streak_days = v_streak,
    last_active_date = v_today,
    cards_mastered = greatest(0, coalesce(v_profile.cards_mastered, 0) + greatest(0, coalesce(p_cards_mastered_delta, 0))),
    updated_at = timezone('utc'::text, now())
  where id = p_user_id;

  return query
    select p.streak_days, p.last_active_date::date, p.cards_mastered
    from public.profiles p
    where p.id = p_user_id;
end;
$$;

grant execute on function public.record_study_activity(uuid, integer) to authenticated;
grant execute on function public.record_study_activity(uuid, integer) to service_role;
