--========================================================================
-- 00008 - Story Adventure Gamifier
--========================================================================

create table if not exists public.game_runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_progress',
  source_type text not null default 'resource',
  source_id uuid,
  chapter_id text not null,
  mission_title text not null,
  current_node_id text not null,
  current_state jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamp with time zone not null default timezone('utc'::text, now()),
  finished_at timestamp with time zone
);

create table if not exists public.game_run_nodes (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.game_runs(id) on delete cascade,
  node_id text not null,
  node_order integer not null,
  node_type text not null,
  title text not null,
  subtitle text,
  content_source text not null default 'system',
  payload jsonb not null default '{}'::jsonb,
  reward jsonb,
  next_node_id text,
  branch_map jsonb,
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (run_id, node_id)
);

create table if not exists public.game_unlocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  unlock_type text not null,
  unlock_key text not null,
  payload jsonb not null default '{}'::jsonb,
  unlocked_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, unlock_type, unlock_key)
);

create table if not exists public.game_loadouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  selected_ability text not null default 'scan',
  selected_secondary_ability text not null default 'guard',
  selected_artifact text not null default 'none',
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.game_runs enable row level security;
alter table public.game_run_nodes enable row level security;
alter table public.game_unlocks enable row level security;
alter table public.game_loadouts enable row level security;

create policy "Users can manage own game runs"
  on public.game_runs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own game run nodes"
  on public.game_run_nodes for all
  using (
    exists (
      select 1 from public.game_runs
      where game_runs.id = game_run_nodes.run_id
      and game_runs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.game_runs
      where game_runs.id = game_run_nodes.run_id
      and game_runs.user_id = auth.uid()
    )
  );

create policy "Users can manage own game unlocks"
  on public.game_unlocks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own game loadouts"
  on public.game_loadouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_game_runs_user_status on public.game_runs(user_id, status);
create index if not exists idx_game_run_nodes_run_order on public.game_run_nodes(run_id, node_order);
