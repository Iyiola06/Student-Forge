-- Add the is_anonymous column to the past_questions table
-- This allows students to upload community content without revealing their identity

ALTER TABLE public.past_questions
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
