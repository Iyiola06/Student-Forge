alter table public.profiles
  add column if not exists institution text,
  add column if not exists course text,
  add column if not exists cohort text;

alter table public.resources
  add column if not exists institution text,
  add column if not exists course text,
  add column if not exists cohort text;

alter table public.review_items
  add column if not exists institution text,
  add column if not exists course text,
  add column if not exists cohort text;

create table if not exists public.referral_codes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique(user_id)
);

create table if not exists public.referral_redemptions (
  id uuid primary key default uuid_generate_v4(),
  referral_code_id uuid not null references public.referral_codes(id) on delete cascade,
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  suspicious boolean not null default false,
  suspicious_reason text,
  review_status text not null default 'needs_review' check (review_status in ('needs_review', 'approved', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique(referred_user_id)
);

create index if not exists referral_redemptions_referrer_idx
  on public.referral_redemptions (referrer_user_id, created_at desc);

alter table public.referral_codes enable row level security;
alter table public.referral_redemptions enable row level security;

create policy "Users can read own referral codes"
  on public.referral_codes for select
  using (auth.uid() = user_id);

create policy "Users can insert own referral codes"
  on public.referral_codes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own referral codes"
  on public.referral_codes for update
  using (auth.uid() = user_id);

create policy "Users can read own referral redemptions"
  on public.referral_redemptions for select
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

create policy "Users can insert own referral redemptions"
  on public.referral_redemptions for insert
  with check (auth.uid() = referred_user_id);

create table if not exists public.notification_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (notification_type in ('purchase_confirmation', 'low_balance_warning', 'upcoming_expiry_warning', 'referral_success')),
  channel text not null check (channel in ('email', 'in_app')),
  dedupe_key text not null unique,
  status text not null default 'queued' check (status in ('queued', 'sent', 'dismissed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.notification_events enable row level security;

create policy "Users can read own notification events"
  on public.notification_events for select
  using (auth.uid() = user_id);

create policy "Users can insert own notification events"
  on public.notification_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification events"
  on public.notification_events for update
  using (auth.uid() = user_id);

drop trigger if exists referral_codes_set_updated_at on public.referral_codes;
create trigger referral_codes_set_updated_at
  before update on public.referral_codes
  for each row execute procedure public.set_updated_at();

drop trigger if exists referral_redemptions_set_updated_at on public.referral_redemptions;
create trigger referral_redemptions_set_updated_at
  before update on public.referral_redemptions
  for each row execute procedure public.set_updated_at();

drop trigger if exists notification_events_set_updated_at on public.notification_events;
create trigger notification_events_set_updated_at
  before update on public.notification_events
  for each row execute procedure public.set_updated_at();
