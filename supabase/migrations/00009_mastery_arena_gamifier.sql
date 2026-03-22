--========================================================================
-- 00009 - Mastery Arena Gamifier
--========================================================================

create table if not exists public.game_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null,
  status text not null default 'in_progress',
  topic text not null,
  subject text not null,
  source_type text not null default 'resources',
  source_id uuid,
  current_round integer not null default 0,
  current_state jsonb not null default '{}'::jsonb,
  score integer not null default 0,
  best_streak integer not null default 0,
  started_at timestamp with time zone not null default timezone('utc'::text, now()),
  finished_at timestamp with time zone
);

create table if not exists public.game_session_rounds (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  round_id text not null,
  round_order integer not null,
  challenge_type text not null,
  topic text not null,
  subject text not null,
  source_type text not null,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (session_id, round_order)
);

create table if not exists public.game_mastery (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_key text not null,
  topic text not null,
  subject text not null,
  mastery_score integer not null default 50,
  last_mode text,
  last_seen_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, topic_key)
);

create table if not exists public.game_daily_stats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  played_on date not null,
  sessions_count integer not null default 0,
  best_score integer not null default 0,
  xp_earned integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, played_on)
);

alter table public.game_sessions enable row level security;
alter table public.game_session_rounds enable row level security;
alter table public.game_mastery enable row level security;
alter table public.game_daily_stats enable row level security;

create policy "Users can manage own game sessions"
  on public.game_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own game session rounds"
  on public.game_session_rounds for all
  using (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = game_session_rounds.session_id
      and game_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.game_sessions
      where game_sessions.id = game_session_rounds.session_id
      and game_sessions.user_id = auth.uid()
    )
  );

create policy "Users can manage own game mastery"
  on public.game_mastery for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own game daily stats"
  on public.game_daily_stats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_game_sessions_user_status on public.game_sessions(user_id, status);
create index if not exists idx_game_sessions_user_mode on public.game_sessions(user_id, mode);
create index if not exists idx_game_session_rounds_session_order on public.game_session_rounds(session_id, round_order);
create index if not exists idx_game_mastery_user_topic on public.game_mastery(user_id, topic_key);
create index if not exists idx_game_daily_stats_user_day on public.game_daily_stats(user_id, played_on);
