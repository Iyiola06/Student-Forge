alter table public.review_items
  add column if not exists content_payload jsonb not null default '{}'::jsonb,
  add column if not exists stability numeric(8,2) not null default 0.3,
  add column if not exists difficulty numeric(8,2) not null default 0.5,
  add column if not exists consecutive_correct integer not null default 0,
  add column if not exists lapse_count integer not null default 0,
  add column if not exists overdue_count integer not null default 0;

create table if not exists public.resource_processing_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  job_type text not null default 'extract',
  status text not null check (status in ('queued', 'processing', 'completed', 'failed', 'retrying', 'cancelled')),
  attempt_count integer not null default 0,
  triggered_by text not null default 'user_upload',
  failure_code text,
  failure_message text,
  diagnostics jsonb not null default '{}'::jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists resource_processing_jobs_user_status_idx
  on public.resource_processing_jobs (user_id, status, created_at desc);

create index if not exists resource_processing_jobs_resource_idx
  on public.resource_processing_jobs (resource_id, created_at desc);

alter table public.resource_processing_jobs enable row level security;

create policy "Users can manage own resource processing jobs"
  on public.resource_processing_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.generation_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete set null,
  source_type text not null check (source_type in ('resource', 'pasted_text')),
  output_type text not null,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed')),
  model_name text,
  difficulty text,
  requested_count integer,
  topic text,
  curriculum text,
  input_chars integer,
  output_items integer,
  credits_charged integer not null default 0,
  estimated_provider_cost numeric(10,4) not null default 0,
  failure_message text,
  response_payload jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists generation_jobs_user_status_idx
  on public.generation_jobs (user_id, status, created_at desc);

alter table public.generation_jobs enable row level security;

create policy "Users can manage own generation jobs"
  on public.generation_jobs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.review_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  review_item_id uuid not null references public.review_items(id) on delete cascade,
  review_session_id uuid references public.review_sessions(id) on delete set null,
  result text not null check (result in ('correct', 'incorrect')),
  submitted_answer text,
  expected_answer text,
  response_time_ms integer,
  confidence integer,
  was_due boolean not null default true,
  source_type text not null,
  source_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists review_attempts_user_created_idx
  on public.review_attempts (user_id, created_at desc);

create index if not exists review_attempts_item_created_idx
  on public.review_attempts (review_item_id, created_at desc);

alter table public.review_attempts enable row level security;

create policy "Users can manage own review attempts"
  on public.review_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.credit_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('purchase', 'grant', 'referral_bonus', 'generation_spend', 'advanced_extraction_spend', 'adjustment', 'expiry', 'refund')),
  source text not null,
  amount integer not null,
  model_name text,
  input_size integer,
  output_size integer,
  estimated_provider_cost numeric(10,4) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists credit_events_user_created_idx
  on public.credit_events (user_id, created_at desc);

alter table public.credit_events enable row level security;

create policy "Users can read own credit events"
  on public.credit_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own credit events"
  on public.credit_events for insert
  with check (auth.uid() = user_id);

create table if not exists public.app_analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  idempotency_key text not null unique,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists app_analytics_events_user_name_idx
  on public.app_analytics_events (user_id, event_name, created_at desc);

alter table public.app_analytics_events enable row level security;

create policy "Users can read own analytics events"
  on public.app_analytics_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own analytics events"
  on public.app_analytics_events for insert
  with check (auth.uid() = user_id);

drop trigger if exists resource_processing_jobs_set_updated_at on public.resource_processing_jobs;
create trigger resource_processing_jobs_set_updated_at
  before update on public.resource_processing_jobs
  for each row execute procedure public.set_updated_at();

drop trigger if exists generation_jobs_set_updated_at on public.generation_jobs;
create trigger generation_jobs_set_updated_at
  before update on public.generation_jobs
  for each row execute procedure public.set_updated_at();
