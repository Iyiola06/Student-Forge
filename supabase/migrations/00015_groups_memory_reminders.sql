--========================================================================
-- 00015 - Study groups, shared decks, saved tutor chats & memory, essay
--         history, streak freezes, review reminders, personal memory model
--========================================================================

-- ---------- Profile settings ----------
alter table public.profiles add column if not exists streak_freezes integer not null default 0;
alter table public.profiles add column if not exists desired_retention numeric(4,2) not null default 0.90;
alter table public.profiles add column if not exists fsrs_params jsonb;
alter table public.profiles add column if not exists reminder_hour integer not null default 18;
alter table public.profiles add column if not exists last_reminder_sent_at timestamp with time zone;

-- Streak protection: a missed day is forgiven if a streak freeze is available.
-- Freezes are earned by finishing a Streak Saver session (max 2 banked).
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
  v_freezes integer;
  v_gap integer;
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
  v_freezes := coalesce(v_profile.streak_freezes, 0);
  v_gap := case when v_profile.last_active_date is null then null else v_today - v_profile.last_active_date::date end;

  if v_gap is null then
    v_streak := 1;
  elsif v_gap = 0 then
    v_streak := greatest(v_streak, 1);
  elsif v_gap = 1 then
    v_streak := v_streak + 1;
  elsif v_gap - 1 <= v_freezes then
    -- Spend one freeze per missed day and keep the streak alive.
    v_freezes := v_freezes - (v_gap - 1);
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  perform set_config('app.allow_critical_profile_updates', 'true', true);

  update public.profiles
  set
    streak_days = v_streak,
    streak_freezes = v_freezes,
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

create or replace function public.earn_streak_freeze(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_freezes integer;
begin
  if auth.uid() is distinct from p_user_id and auth.role() <> 'service_role' then
    raise exception 'Unauthorized';
  end if;
  update public.profiles
  set streak_freezes = least(2, coalesce(streak_freezes, 0) + 1)
  where id = p_user_id
  returning streak_freezes into v_freezes;
  return coalesce(v_freezes, 0);
end;
$$;

grant execute on function public.earn_streak_freeze(uuid) to authenticated, service_role;

-- Let students change their own study preferences despite the profile guard.
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
    new.streak_freezes = old.streak_freezes;
    new.fsrs_params = old.fsrs_params;
    new.last_reminder_sent_at = old.last_reminder_sent_at;
    if new.desired_retention is null or new.desired_retention < 0.75 or new.desired_retention > 0.97 then
      new.desired_retention = old.desired_retention;
    end if;
  end if;
  return new;
end;
$$;

-- ---------- Tutor conversations + learner memory ----------
create table if not exists public.tutor_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New conversation',
  mode text not null default 'explain' check (mode in ('explain', 'socratic', 'quiz')),
  resource_id uuid references public.resources(id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists tutor_conversations_user_updated_idx
  on public.tutor_conversations (user_id, updated_at desc);

alter table public.tutor_conversations enable row level security;

drop policy if exists "Users manage own tutor conversations" on public.tutor_conversations;
create policy "Users manage own tutor conversations"
  on public.tutor_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.learner_memory (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  notes text not null default '',
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.learner_memory enable row level security;

drop policy if exists "Users manage own learner memory" on public.learner_memory;
create policy "Users manage own learner memory"
  on public.learner_memory for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- Essay grading history ----------
create table if not exists public.essay_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  context text,
  answer_text text,
  was_handwritten boolean not null default false,
  score numeric(6,2) not null,
  max_score numeric(6,2) not null,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists essay_submissions_user_created_idx
  on public.essay_submissions (user_id, created_at desc);

alter table public.essay_submissions enable row level security;

drop policy if exists "Users manage own essay submissions" on public.essay_submissions;
create policy "Users manage own essay submissions"
  on public.essay_submissions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- Study groups + shared decks ----------
create table if not exists public.study_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null check (char_length(name) between 2 and 80),
  description text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 8)),
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.study_group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (group_id, user_id)
);

create table if not exists public.study_group_decks (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  deck_id uuid not null references public.flashcards(id) on delete cascade,
  shared_by uuid not null references public.profiles(id) on delete cascade,
  shared_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (group_id, deck_id)
);

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.study_group_members m
    where m.group_id = p_group_id and m.user_id = auth.uid()
  );
$$;

alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;
alter table public.study_group_decks enable row level security;

drop policy if exists "Members read their groups" on public.study_groups;
create policy "Members read their groups"
  on public.study_groups for select
  using (public.is_group_member(id) or owner_id = auth.uid());

drop policy if exists "Users create groups they own" on public.study_groups;
create policy "Users create groups they own"
  on public.study_groups for insert
  with check (owner_id = auth.uid());

drop policy if exists "Owners update or delete groups" on public.study_groups;
create policy "Owners update or delete groups"
  on public.study_groups for update using (owner_id = auth.uid());

drop policy if exists "Owners delete groups" on public.study_groups;
create policy "Owners delete groups"
  on public.study_groups for delete using (owner_id = auth.uid());

drop policy if exists "Members see fellow members" on public.study_group_members;
create policy "Members see fellow members"
  on public.study_group_members for select
  using (public.is_group_member(group_id));

drop policy if exists "Members leave groups" on public.study_group_members;
create policy "Members leave groups"
  on public.study_group_members for delete
  using (user_id = auth.uid());

drop policy if exists "Members see shared decks" on public.study_group_decks;
create policy "Members see shared decks"
  on public.study_group_decks for select
  using (public.is_group_member(group_id));

drop policy if exists "Members share their own decks" on public.study_group_decks;
create policy "Members share their own decks"
  on public.study_group_decks for insert
  with check (
    public.is_group_member(group_id)
    and shared_by = auth.uid()
    and exists (select 1 from public.flashcards f where f.id = deck_id and f.user_id = auth.uid())
  );

drop policy if exists "Sharers unshare decks" on public.study_group_decks;
create policy "Sharers unshare decks"
  on public.study_group_decks for delete
  using (shared_by = auth.uid());

-- Group members can read decks (and their cards) shared into their groups.
drop policy if exists "Group members read shared decks" on public.flashcards;
create policy "Group members read shared decks"
  on public.flashcards for select
  using (
    exists (
      select 1 from public.study_group_decks d
      where d.deck_id = flashcards.id and public.is_group_member(d.group_id)
    )
  );

drop policy if exists "Group members read shared deck items" on public.flashcard_items;
create policy "Group members read shared deck items"
  on public.flashcard_items for select
  using (
    exists (
      select 1 from public.study_group_decks d
      where d.deck_id = flashcard_items.deck_id and public.is_group_member(d.group_id)
    )
  );

-- Group leaderboard needs member names and XP.
drop policy if exists "Group members read each other profiles" on public.profiles;
create policy "Group members read each other profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.study_group_members mine
      join public.study_group_members theirs on theirs.group_id = mine.group_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );

-- Create a group and join it as owner in one step.
create or replace function public.create_study_group(p_name text, p_description text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;
  insert into public.study_groups (name, description, owner_id)
  values (trim(p_name), nullif(trim(coalesce(p_description, '')), ''), auth.uid())
  returning id into v_group_id;
  insert into public.study_group_members (group_id, user_id, role) values (v_group_id, auth.uid(), 'owner');
  return v_group_id;
end;
$$;

-- Join by invite code (non-members cannot read the group row directly).
create or replace function public.join_study_group(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;
  select id into v_group_id from public.study_groups where invite_code = upper(trim(p_invite_code));
  if v_group_id is null then
    raise exception 'Invite code not found';
  end if;
  select count(*) into v_count from public.study_group_members where group_id = v_group_id;
  if v_count >= 50 then
    raise exception 'This group is full';
  end if;
  insert into public.study_group_members (group_id, user_id) values (v_group_id, auth.uid())
  on conflict do nothing;
  return v_group_id;
end;
$$;

grant execute on function public.create_study_group(text, text) to authenticated;
grant execute on function public.join_study_group(text) to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;

-- Speeds up "find the review item for this generated question".
create index if not exists review_items_user_source_idx on public.review_items (user_id, source_id);
