-- Add the last_active_date column to the profiles table
-- This allows the application to track daily logins and calculate the user's streak

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_date DATE;
