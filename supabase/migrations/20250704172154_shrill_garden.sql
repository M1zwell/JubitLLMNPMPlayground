/*
  # User System and Authentication Setup

  1. User Profiles
    - `user_profiles` table for extended user information
    - Links to Supabase auth.users
    - Stores preferences, settings, and additional user data

  2. User Workflows
    - `user_workflows` table for saving user-created workflows
    - Links workflows to specific users
    - Supports sharing and collaboration

  3. User Preferences
    - `user_preferences` table for app settings
    - Theme, language, notification preferences
    - Default model/package selections

  4. User Sessions and Activity
    - `user_sessions` table for tracking active sessions
    - `user_activity_logs` for analytics and usage tracking

  5. Security
    - Row Level Security (RLS) enabled on all tables
    - Users can only access their own data
    - Admin access patterns for moderation
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  website text,
  company text,
  job_title text,
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  preferred_language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  email_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  is_public boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_expires_at timestamptz,
  github_username text,
  linkedin_url text,
  twitter_username text,
  total_workflows integer DEFAULT 0,
  total_executions integer DEFAULT 0,
  reputation_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Workflows Table
CREATE TABLE IF NOT EXISTS user_workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  workflow_data jsonb NOT NULL,
  components_count integer DEFAULT 0,
  category text,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT false,
  is_template boolean DEFAULT false,
  execution_count integer DEFAULT 0,
  last_executed_at timestamptz,
  average_execution_time integer, -- in milliseconds
  success_rate numeric(5,2) DEFAULT 100.00,
  estimated_cost numeric(10,4) DEFAULT 0,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  thumbnail_url text,
  likes_count integer DEFAULT 0,
  forks_count integer DEFAULT 0,
  forked_from uuid REFERENCES user_workflows(id),
  version integer DEFAULT 1,
  changelog text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme text DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  compact_mode boolean DEFAULT false,
  show_animations boolean DEFAULT true,
  auto_save boolean DEFAULT true,
  auto_save_interval integer DEFAULT 30, -- seconds
  default_llm_provider text,
  default_llm_model text,
  preferred_npm_categories text[] DEFAULT '{}',
  execution_timeout integer DEFAULT 30, -- seconds
  max_concurrent_executions integer DEFAULT 3,
  show_cost_estimates boolean DEFAULT true,
  show_performance_metrics boolean DEFAULT true,
  enable_ai_suggestions boolean DEFAULT true,
  keyboard_shortcuts jsonb DEFAULT '{}',
  dashboard_layout jsonb DEFAULT '{}',
  notification_settings jsonb DEFAULT '{"workflow_complete": true, "errors": true, "weekly_digest": true}',
  privacy_settings jsonb DEFAULT '{"show_profile": true, "show_workflows": true, "show_activity": false}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Sessions Table (for tracking active sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text UNIQUE,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  location_data jsonb,
  is_active boolean DEFAULT true,
  last_activity_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User Activity Logs Table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_data jsonb DEFAULT '{}',
  resource_type text, -- 'workflow', 'model', 'package', etc.
  resource_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- User Bookmarks/Favorites Table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('workflow', 'llm_model', 'npm_package', 'user')),
  resource_id uuid NOT NULL,
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource_type, resource_id)
);

-- Workflow Likes Table
CREATE TABLE IF NOT EXISTS workflow_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES user_workflows(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, workflow_id)
);

-- User Following System
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_workflows_user_id ON user_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_is_public ON user_workflows(is_public);
CREATE INDEX IF NOT EXISTS idx_user_workflows_category ON user_workflows(category);
CREATE INDEX IF NOT EXISTS idx_user_workflows_tags ON user_workflows USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_resource ON user_favorites(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_workflow_likes_workflow_id ON workflow_likes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view public profiles"
  ON user_profiles
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_workflows
CREATE POLICY "Users can view public workflows"
  ON user_workflows
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own workflows"
  ON user_workflows
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert sessions"
  ON user_sessions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for user_activity_logs
CREATE POLICY "Users can view own activity"
  ON user_activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
  ON user_activity_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for user_favorites
CREATE POLICY "Users can manage own favorites"
  ON user_favorites
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for workflow_likes
CREATE POLICY "Users can view workflow likes"
  ON workflow_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON workflow_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON workflow_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_follows
CREATE POLICY "Users can view follows"
  ON user_follows
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON user_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON user_follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_workflows_updated_at
  BEFORE UPDATE ON user_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update workflow stats
CREATE OR REPLACE FUNCTION update_workflow_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update likes count
  IF TG_OP = 'INSERT' THEN
    UPDATE user_workflows 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.workflow_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_workflows 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.workflow_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for workflow likes
CREATE TRIGGER workflow_likes_stats
  AFTER INSERT OR DELETE ON workflow_likes
  FOR EACH ROW EXECUTE FUNCTION update_workflow_stats();

-- Function to update user profile stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles 
    SET total_workflows = total_workflows + 1 
    WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles 
    SET total_workflows = total_workflows - 1 
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for workflow count
CREATE TRIGGER user_workflow_stats
  AFTER INSERT OR DELETE ON user_workflows
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();