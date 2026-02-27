-- Run this in your Supabase SQL Editor to support the Gamifier feature

create table if not exists public.reading_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  resource_id uuid references public.resources(id) on delete cascade not null,
  last_page integer default 1,
  completion_percentage integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, resource_id)
);

alter table public.reading_progress enable row level security;

create policy "Users can manage own reading progress"
  on public.reading_progress for all
  using ( auth.uid() = user_id );
  
-- Add badges column to profiles if it doesn't exist
alter table public.profiles add column if not exists badges jsonb default '[]'::jsonb;
