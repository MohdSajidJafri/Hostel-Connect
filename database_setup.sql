-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  year_of_study INTEGER,
  expertise TEXT,
  domain TEXT,
  room_number TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create messages table with safety constraints
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 2000),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (sender_id <> recipient_id)
);

-- Create blocked_users table for user safety
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES auth.users(id) NOT NULL,
  blocked_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- Create message_reports table for moderation/safety
CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES auth.users(id) NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id) NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) BETWEEN 1 AND 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_participants_created ON messages (sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON messages (recipient_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_blocked_users_pair ON blocked_users (blocker_id, blocked_id);

-- Set up Row Level Security (RLS) for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Idempotent constraints on existing messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_messages_content_length'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT chk_messages_content_length
      CHECK (char_length(trim(content)) BETWEEN 1 AND 2000) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_messages_no_self'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT chk_messages_no_self
      CHECK (sender_id <> recipient_id) NOT VALID;
  END IF;
END $$;

-- Set up Row Level Security (RLS) for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can insert messages they send" ON messages;
CREATE POLICY "Users can insert messages they send" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND sender_id <> recipient_id
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b
      WHERE (b.blocker_id = recipient_id AND b.blocked_id = auth.uid())
         OR (b.blocker_id = auth.uid() AND b.blocked_id = recipient_id)
    )
  );

DROP POLICY IF EXISTS "Users can update messages they received" ON messages;
CREATE POLICY "Users can update messages they received" ON messages
  FOR UPDATE USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can delete their own messages or conversations" ON messages;
CREATE POLICY "Users can delete their own messages or conversations" ON messages
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- RLS for blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own blocks" ON blocked_users;
CREATE POLICY "Users can view their own blocks" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Users can block other users" ON blocked_users;
CREATE POLICY "Users can block other users" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id AND blocker_id <> blocked_id);

DROP POLICY IF EXISTS "Users can unblock users they blocked" ON blocked_users;
CREATE POLICY "Users can unblock users they blocked" ON blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- RLS for message_reports
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit reports" ON message_reports;
CREATE POLICY "Users can submit reports" ON message_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON message_reports;
CREATE POLICY "Users can view their own reports" ON message_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Enable Realtime on messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- Storage bucket & policies for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "Authenticated users can upload their own avatar" ON storage.objects;
CREATE POLICY "Authenticated users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profiles'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a function to create a profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, created_at)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function after a user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
