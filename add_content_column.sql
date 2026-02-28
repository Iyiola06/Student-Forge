-- Fix the resources table by adding the missing 'content' column
-- This column is required to store the extracted text from PDFs so the AI features can work properly!

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS content text;
