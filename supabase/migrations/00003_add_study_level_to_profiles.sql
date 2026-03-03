-- Add study_level to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS study_level TEXT;

-- Update the handle_new_user function to include study_level
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, study_level)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'study_level'
  );
  RETURN new;
END;
$$;
