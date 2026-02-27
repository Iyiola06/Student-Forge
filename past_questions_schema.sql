-- Drop existing tables if necessary
DROP TABLE IF EXISTS public.past_question_upvotes CASCADE;
DROP TABLE IF EXISTS public.past_questions CASCADE;

-- Create past_questions table
CREATE TABLE public.past_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_name text NOT NULL,
    institution_type text NOT NULL,
    subject text NOT NULL,
    course_code text,
    year integer NOT NULL,
    semester text,
    description text,
    file_url text NOT NULL,
    file_size text,
    file_type text,
    upvotes integer DEFAULT 0,
    downloads integer DEFAULT 0,
    is_approved boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Create past_question_upvotes table
CREATE TABLE public.past_question_upvotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    past_question_id uuid NOT NULL REFERENCES public.past_questions(id) ON DELETE CASCADE,
    UNIQUE(user_id, past_question_id)
);

-- Turn on RLS
ALTER TABLE public.past_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_question_upvotes ENABLE ROW LEVEL SECURITY;

-- Policies for past_questions
-- Anyone can read approved questions
CREATE POLICY "Anyone can read approved past questions"
ON public.past_questions FOR SELECT
USING (is_approved = true OR auth.uid() = user_id);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert past questions"
ON public.past_questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own
CREATE POLICY "Users can delete their own past questions"
ON public.past_questions FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own (for description updates)
CREATE POLICY "Users can update their own past questions"
ON public.past_questions FOR UPDATE
USING (auth.uid() = user_id);

-- Policies for past_question_upvotes
-- Anyone can read upvotes
CREATE POLICY "Anyone can read upvotes"
ON public.past_question_upvotes FOR SELECT
USING (true);

-- Authenticated users can insert/delete their own upvotes
CREATE POLICY "Users can toggle their own upvotes"
ON public.past_question_upvotes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Supabase Storage Bucket for past-questions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('past-questions', 'past-questions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'past-questions' );

CREATE POLICY "Authenticated users can upload past questions" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'past-questions' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can edit/delete their own past questions" 
ON storage.objects FOR ALL 
USING ( bucket_id = 'past-questions' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'past-questions' AND auth.uid() = owner );
