const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_SERVICE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const sql = `
-- Add is_public column to resources
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Permit users to read public resources
DROP POLICY IF EXISTS "Public resources are viewable by everyone." ON public.resources;
CREATE POLICY "Public resources are viewable by everyone."
  ON public.resources FOR SELECT
  USING ( is_public = true OR auth.uid() = user_id );

-- Add is_public column to quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Permit users to read public quizzes
DROP POLICY IF EXISTS "Public quizzes are viewable by everyone." ON public.quizzes;
CREATE POLICY "Public quizzes are viewable by everyone."
  ON public.quizzes FOR SELECT
  USING ( is_public = true OR auth.uid() = user_id );

-- Permit users to read public quiz questions
DROP POLICY IF EXISTS "Public quiz questions are viewable by everyone." ON public.quiz_questions;
CREATE POLICY "Public quiz questions are viewable by everyone."
  ON public.quiz_questions FOR SELECT
  USING ( 
    exists (
      select 1 from public.quizzes
      where quizzes.id = quiz_questions.quiz_id
      and (quizzes.is_public = true OR quizzes.user_id = auth.uid())
    )
  );

-- Add is_public column to flashcards (decks)
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Permit users to read public flashcard decks
DROP POLICY IF EXISTS "Public flashcard decks are viewable by everyone." ON public.flashcards;
CREATE POLICY "Public flashcard decks are viewable by everyone."
  ON public.flashcards FOR SELECT
  USING ( is_public = true OR auth.uid() = user_id );

-- Permit users to read public flashcard items
DROP POLICY IF EXISTS "Public flashcard items are viewable by everyone." ON public.flashcard_items;
CREATE POLICY "Public flashcard items are viewable by everyone."
  ON public.flashcard_items FOR SELECT
  USING ( 
    exists (
      select 1 from public.flashcards
      where flashcards.id = flashcard_items.deck_id
      and (flashcards.is_public = true OR flashcards.user_id = auth.uid())
    )
  );
`;

async function run() {
    const { data: d1, error: e1 } = await supabase.rpc('exec_sql', { sql });

    if (e1) {
        console.error("RPC exec_sql probably doesn't exist or failed.");
        console.error(e1);
    } else {
        console.log("Migration successful");
    }
}

run();
