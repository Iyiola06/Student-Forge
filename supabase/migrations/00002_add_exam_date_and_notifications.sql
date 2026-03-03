-- Add exam_date to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exam_date DATE;

-- Create push_subscriptions table for notification tokens
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, subscription)
);

