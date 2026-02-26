--========================================================================
-- StudyForge Seed Data
-- 
-- Run this AFTER executing 00001_initial_schema.sql
-- Note: It inserts directly into public.profiles for dummy data because
-- generating dummy auth.users via SQL is complex (passwords, hashing).
-- Real users will be created via Supabase Auth and triggered into details.
--========================================================================

-- Use a known dummy UUID for the 'Jane Doe' profile mentioned in the UI.
-- You can replace this UUID with your actual user's UUID from auth.users once registered.
DO $$ 
DECLARE
  jane_uuid uuid := '00000000-0000-0000-0000-000000000001';
  resource1_id uuid := uuid_generate_v4();
  resource2_id uuid := uuid_generate_v4();
  quiz1_id uuid := uuid_generate_v4();
  deck1_id uuid := uuid_generate_v4();
BEGIN

  --========================================================================
  -- 1. Profiles (Fake Data bypassing Auth for demonstration purposes)
  -- If you already have a user, you can just update their profile instead.
  --========================================================================
  
  -- Note: We disable triggers temporarily to insert into profiles without a valid auth.users record,
  -- OR we can just ignore profile seeding and recommend the user signs up normally.
  -- To keep it clean, we'll assume the user will sign up normally, and then we'll update their profile.
  -- However, since we need to seed data linked to a user, we'll insert a dummy user into auth.users first,
  -- but standard Supabase environments might block raw inserts to auth.users without proper fields depending on setup.
  
  -- Alternative approach: Wait for the user to register an account, get their UUID, and then seed.
  -- Since we don't know the exact UUID, we will seed the global Past Questions Bank,
  -- which doesn't depend on user IDs.
  
  --========================================================================
  -- 2. Past Questions
  --========================================================================
  
  INSERT INTO public.past_questions (exam_body, year, subject, exam_type, file_url, file_type, file_size_bytes)
  VALUES
    ('WAEC', 2023, 'Mathematics', 'May/June Senior School Certificate Examination', 'https://example.com/waec_math_2023.pdf', 'pdf', 2450000),
    ('JAMB', 2023, 'Physics', 'Unified Tertiary Matriculation Examination', 'https://example.com/jamb_physics_2023.cbt', 'interactive', 1500000),
    ('NECO', 2022, 'English Language', 'June/July Senior School Certificate Examination', 'https://example.com/neco_english_2022.pdf', 'pdf', 1800000),
    ('GCE', 2021, 'Biology', 'General Certificate of Education', 'https://example.com/gce_biology_2021.pdf', 'pdf', 3100000),
    ('WAEC', 2020, 'Chemistry', 'May/June Senior School Certificate Examination', 'https://example.com/waec_chemistry_2020.pdf', 'pdf', 2100000);

END $$;

--========================================================================
-- End of Seed Script
--========================================================================
