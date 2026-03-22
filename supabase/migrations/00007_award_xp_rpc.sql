--========================================================================
-- 00007 - Award XP RPC
--========================================================================

-- Allow controlled updates to protected profile fields from trusted routines.
create or replace function public.prevent_critical_profile_updates()
returns trigger
language plpgsql
security definer
as $$
begin
  if current_setting('role', true) = 'authenticated'
     and coalesce(current_setting('app.allow_critical_profile_updates', true), 'false') <> 'true' then
    new.xp = old.xp;
    new.level = old.level;
    new.streak_days = old.streak_days;
    new.role = old.role;
    new.cards_mastered = old.cards_mastered;
    new.exam_readiness_score = old.exam_readiness_score;
  end if;
  return new;
end;
$$;

create or replace function public.award_xp(
  p_user_id uuid,
  p_xp_to_add integer,
  p_source text default 'unknown'
)
returns table (
  success boolean,
  new_xp integer,
  new_level integer,
  xp_added integer,
  error text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_new_xp integer;
  v_new_level integer;
begin
  if p_user_id is null or p_xp_to_add is null or p_xp_to_add <= 0 then
    return query select false, null::integer, null::integer, 0, 'Invalid parameters';
    return;
  end if;

  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    return query select false, null::integer, null::integer, 0, 'Unauthorized';
    return;
  end if;

  select *
  into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return query select false, null::integer, null::integer, 0, 'Profile not found';
    return;
  end if;

  v_new_xp := coalesce(v_profile.xp, 0) + p_xp_to_add;
  v_new_level := greatest(
    coalesce(v_profile.level, 1),
    floor(sqrt(v_new_xp / 100.0))::integer + 1
  );

  perform set_config('app.allow_critical_profile_updates', 'true', true);

  update public.profiles
  set
    xp = v_new_xp,
    level = v_new_level,
    updated_at = timezone('utc'::text, now())
  where id = p_user_id;

  insert into public.study_history (
    user_id,
    action_type,
    entity_type,
    details
  )
  values (
    p_user_id,
    'xp_awarded',
    'profile',
    jsonb_build_object('xp_earned', p_xp_to_add, 'source', p_source)
  );

  return query select true, v_new_xp, v_new_level, p_xp_to_add, null::text;
end;
$$;

grant execute on function public.award_xp(uuid, integer, text) to authenticated;
grant execute on function public.award_xp(uuid, integer, text) to service_role;
