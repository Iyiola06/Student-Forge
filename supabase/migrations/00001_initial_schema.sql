--========================================================================
-- StudyForge Initial Schema Migration
--========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

--========================================================================
-- 1. Profiles Table (extends auth.users)
--========================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  role text default 'student'::text,
  level integer default 1,
  xp integer default 0,
  streak_days integer default 0,
  cards_mastered integer default 0,
  exam_readiness_score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS Policies for Profiles
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

--========================================================================
-- Trigger to automatically create a profile when a new user signs up
--========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

--========================================================================
-- 2. Resources Table (PDFs, Docs uploaded by user)
--========================================================================

create table public.resources (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  subject text,
  file_type text not null,
  file_url text not null,
  file_size_bytes integer default 0,
  progress_percentage integer default 0,
  last_accessed_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.resources enable row level security;

create policy "Users can read own resources"
  on public.resources for select
  using ( auth.uid() = user_id );

create policy "Users can insert own resources"
  on public.resources for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own resources"
  on public.resources for update
  using ( auth.uid() = user_id );

create policy "Users can delete own resources"
  on public.resources for delete
  using ( auth.uid() = user_id );

--========================================================================
-- 3. Quizzes Table
--========================================================================

create table public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  resource_id uuid references public.resources(id) on delete set null,
  title text not null,
  subject text,
  difficulty text default 'medium'::text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quizzes enable row level security;

create policy "Users can manage own quizzes"
  on public.quizzes for all
  using ( auth.uid() = user_id );

--========================================================================
-- 4. Quiz Questions Table
--========================================================================

create table public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text not null,
  question_type text default 'multiple_choice'::text,
  options jsonb default '[]'::jsonb,
  correct_answer text not null,
  explanation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_questions enable row level security;

-- Quiz questions inherit permissions from the parent quiz via user_id join,
-- but for simplicity, allow operations if the parent quiz belongs to the user.
create policy "Users can manage questions for own quizzes"
  on public.quiz_questions for all
  using ( 
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and quizzes.user_id = auth.uid()
    )
  );

--========================================================================
-- 5. Flashcards Table (Decks)
--========================================================================

create table public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  resource_id uuid references public.resources(id) on delete set null,
  title text not null,
  subject text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.flashcards enable row level security;

create policy "Users can manage own flashcards"
  on public.flashcards for all
  using ( auth.uid() = user_id );

--========================================================================
-- 6. Flashcard Items Table
--========================================================================

create table public.flashcard_items (
  id uuid primary key default uuid_generate_v4(),
  deck_id uuid references public.flashcards(id) on delete cascade not null,
  front_content text not null,
  back_content text not null,
  status text default 'new'::text, -- 'new', 'learning', 'mastered'
  next_review_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.flashcard_items enable row level security;

create policy "Users can manage items for own flashcard decks"
  on public.flashcard_items for all
  using ( 
    exists (
      select 1 from public.flashcards
      where flashcards.id = flashcard_items.deck_id
      and flashcards.user_id = auth.uid()
    )
  );

--========================================================================
-- 7. Study History Table (Activity Feed)
--========================================================================

create table public.study_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  action_type text not null, -- e.g., 'quiz_completed', 'document_read'
  entity_id uuid, -- Optional relation to the specific resource, quiz, or deck
  entity_type text, -- e.g., 'quiz', 'resource', 'flashcard'
  details jsonb default '{}'::jsonb, -- Additional data like score or time spent
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.study_history enable row level security;

create policy "Users can manage own study history"
  on public.study_history for all
  using ( auth.uid() = user_id );

--========================================================================
-- 8. Past Questions Table (Global Bank)
--========================================================================

create table public.past_questions (
  id uuid primary key default uuid_generate_v4(),
  exam_body text not null, -- e.g., 'WAEC', 'JAMB', 'NECO'
  year integer not null,
  subject text not null,
  exam_type text not null, -- e.g., 'May/June Senior School Certificate Examination'
  file_url text not null,
  file_type text default 'pdf'::text,
  file_size_bytes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.past_questions enable row level security;

-- Anyone authenticated can read past questions
create policy "Authenticated users can view past questions"
  on public.past_questions for select
  to authenticated
  using ( true );

-- Only admins/service role can insert or update past questions (no user policy for writes)

--========================================================================
-- Set up Storage Buckets (requires storage extension/schema in Supabase)
--========================================================================

-- It's common to configure storage buckets directly via the dashboard or using
-- storage service APIs. If using raw SQL, you would insert into storage.buckets.
-- Assuming a 'resources' bucket and a 'past_questions' bucket exists:
insert into storage.buckets (id, name, public) values ('resources', 'resources', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('past_questions', 'past_questions', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

create policy "Users can access own resources in storage"
  on storage.objects for all
  using ( bucket_id = 'resources' and auth.uid() = owner );

create policy "Public avatars are viewable by everyone."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Public past_questions are viewable by everyone."
  on storage.objects for select
  using ( bucket_id = 'past_questions' );
