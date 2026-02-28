import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = await createClient();

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

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, data });
}
