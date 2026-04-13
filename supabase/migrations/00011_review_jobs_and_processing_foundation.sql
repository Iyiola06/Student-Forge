alter table public.resources
  add column if not exists processing_metadata jsonb not null default '{}'::jsonb,
  add column if not exists extracted_preview text,
  add column if not exists extraction_confidence numeric(5,2),
  add column if not exists extraction_method text,
  add column if not exists processing_started_at timestamp with time zone,
  add column if not exists processing_completed_at timestamp with time zone,
  add column if not exists archived_at timestamp with time zone;

create table if not exists public.resource_processing_events (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  status text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists resource_processing_events_resource_id_idx
  on public.resource_processing_events (resource_id, created_at desc);

alter table public.resource_processing_events enable row level security;

create policy "Users can read own resource processing events"
  on public.resource_processing_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own resource processing events"
  on public.resource_processing_events for insert
  with check (auth.uid() = user_id);

create table if not exists public.review_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('flashcard', 'quiz_question')),
  source_id uuid not null,
  source_resource_id uuid references public.resources(id) on delete set null,
  source_topic text,
  review_state text not null default 'new' check (review_state in ('new', 'learning', 'review', 'mastered')),
  mastery_score integer not null default 0,
  mistakes_count integer not null default 0,
  reviews_count integer not null default 0,
  due_at timestamp with time zone not null default timezone('utc'::text, now()),
  last_reviewed_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists review_items_user_due_idx
  on public.review_items (user_id, due_at, review_state);

alter table public.review_items enable row level security;

create policy "Users can manage own review items"
  on public.review_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.review_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_type text not null check (session_type in ('quick_review', 'exam_prep', 'streak_saver')),
  status text not null default 'started' check (status in ('started', 'completed', 'abandoned')),
  total_items integer not null default 0,
  completed_items integer not null default 0,
  correct_items integer not null default 0,
  started_at timestamp with time zone not null default timezone('utc'::text, now()),
  completed_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists review_sessions_user_started_idx
  on public.review_sessions (user_id, started_at desc);

alter table public.review_sessions enable row level security;

create policy "Users can manage own review sessions"
  on public.review_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.topic_mastery (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_slug text not null,
  topic_label text not null,
  mastery_score integer not null default 0,
  mistakes_count integer not null default 0,
  reviews_count integer not null default 0,
  due_count integer not null default 0,
  source_resource_id uuid references public.resources(id) on delete set null,
  last_reviewed_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique(user_id, topic_slug)
);

create index if not exists topic_mastery_user_mastery_idx
  on public.topic_mastery (user_id, mastery_score asc, due_count desc);

alter table public.topic_mastery enable row level security;

create policy "Users can manage own topic mastery"
  on public.topic_mastery for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  preference_type text not null check (preference_type in ('due_review', 'low_balance')),
  channel text not null check (channel in ('email', 'push')),
  enabled boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique(user_id, preference_type, channel)
);

alter table public.notification_preferences enable row level security;

create policy "Users can manage own notification preferences"
  on public.notification_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists review_items_set_updated_at on public.review_items;
create trigger review_items_set_updated_at
  before update on public.review_items
  for each row execute procedure public.set_updated_at();

drop trigger if exists topic_mastery_set_updated_at on public.topic_mastery;
create trigger topic_mastery_set_updated_at
  before update on public.topic_mastery
  for each row execute procedure public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute procedure public.set_updated_at();
