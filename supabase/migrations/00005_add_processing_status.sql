-- Add processing state columns to resources
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'ready';
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS processing_error text;
