--========================================================================
-- 00006 - Secure Profile RLS and Gamification Updates
--========================================================================

-- We remove the overly permissive update policy
drop policy if exists "Users can update own profile." on public.profiles;

-- Add a more restrictive policy
create policy "Users can update non-critical profile fields." 
  on public.profiles for update
  using ( auth.uid() = id );

-- Create a trigger function that silently prevents critical fields from being updated
-- by the authenticated role, while allowing service role to do so.
create or replace function public.prevent_critical_profile_updates()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Restrict direct updates from the client (authenticated users)
  if current_setting('role', true) = 'authenticated' then
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

drop trigger if exists prevent_critical_profile_updates_trigger on public.profiles;

create trigger prevent_critical_profile_updates_trigger
  before update on public.profiles
  for each row
  execute function public.prevent_critical_profile_updates();
