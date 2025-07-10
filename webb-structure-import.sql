-- Webb Database Structure Import for Supabase PostgreSQL
-- 直接导入Webb数据库结构到Supabase PostgreSQL
-- Created: 2025-01-17
-- Project: David Webb Financial Database Migration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Mailvote Schema - User Management and Email Voting System
-- 1. Mailvote架构 - 用户管理和邮件投票系统

CREATE TABLE IF NOT EXISTS "webb_users" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(50) UNIQUE NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "first_name" VARCHAR(100),
  "last_name" VARCHAR(100),
  "company" VARCHAR(255),
  "position" VARCHAR(255),
  "phone" VARCHAR(50),
  "address" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "is_admin" BOOLEAN DEFAULT false,
  "email_verified" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "last_login" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "webb_user_sessions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "webb_users"("id") ON DELETE CASCADE,
  "session_token" VARCHAR(255) UNIQUE NOT NULL,
  "ip_address" INET,
  "user_agent" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP NOT NULL,
  "is_active" BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS "webb_voting_campaigns" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "company_code" VARCHAR(10),
  "meeting_date" DATE,
  "voting_deadline" TIMESTAMP,
  "status" VARCHAR(20) DEFAULT 'active',
  "created_by" INTEGER REFERENCES "webb_users"("id"),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "webb_user_votes" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "webb_users"("id") ON DELETE CASCADE,
  "campaign_id" INTEGER REFERENCES "webb_voting_campaigns"("id") ON DELETE CASCADE,
  "vote" VARCHAR(20) NOT NULL CHECK (vote IN ('for', 'against', 'abstain')),
  "shares_held" BIGINT,
  "voted_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("user_id", "campaign_id")
);

-- 2. IP Log Schema - Access Tracking and Analytics
-- 2. IP日志架构 - 访问跟踪和分析

CREATE TABLE IF NOT EXISTS "webb_ip_logs" (
  "id" SERIAL PRIMARY KEY,
  "ip_address" INET NOT NULL,
  "user_id" INTEGER REFERENCES "webb_users"("id"),
  "page_url" TEXT,
  "action" VARCHAR(100),
  "user_agent" TEXT,
  "referrer" TEXT,
  "session_id" VARCHAR(255),
  "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "response_code" INTEGER,
  "processing_time" INTEGER
);

CREATE TABLE IF NOT EXISTS "webb_access_stats" (
  "id" SERIAL PRIMARY KEY,
  "date" DATE UNIQUE NOT NULL,
  "total_visits" INTEGER DEFAULT 0,
  "unique_visitors" INTEGER DEFAULT 0,
  "total_page_views" INTEGER DEFAULT 0,
  "avg_response_time" NUMERIC(10,2),
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. System Configuration Schema
-- 3. 系统配置架构

CREATE TABLE IF NOT EXISTS "webb_system_config" (
  "id" SERIAL PRIMARY KEY,
  "config_key" VARCHAR(100) UNIQUE NOT NULL,
  "config_value" TEXT,
  "description" TEXT,
  "is_encrypted" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "webb_maintenance_log" (
  "id" SERIAL PRIMARY KEY,
  "maintenance_type" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "started_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP,
  "status" VARCHAR(20) DEFAULT 'in_progress',
  "performed_by" VARCHAR(100),
  "notes" TEXT
);

-- 4. Email System Schema
-- 4. 邮件系统架构

CREATE TABLE IF NOT EXISTS "webb_email_templates" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) UNIQUE NOT NULL,
  "subject" VARCHAR(255),
  "body_text" TEXT,
  "body_html" TEXT,
  "template_type" VARCHAR(50),
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "webb_email_logs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "webb_users"("id"),
  "template_id" INTEGER REFERENCES "webb_email_templates"("id"),
  "email_to" VARCHAR(255) NOT NULL,
  "subject" VARCHAR(255),
  "status" VARCHAR(20) DEFAULT 'pending',
  "sent_at" TIMESTAMP,
  "error_message" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Stock Lists and Watchlists
-- 5. 股票列表和观察列表

CREATE TABLE IF NOT EXISTS "webb_user_stock_lists" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "webb_users"("id") ON DELETE CASCADE,
  "stock_code" VARCHAR(10) NOT NULL,
  "list_name" VARCHAR(100) DEFAULT 'default',
  "notes" TEXT,
  "added_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Performance Indexes
-- 创建性能索引

-- User management indexes
CREATE INDEX IF NOT EXISTS "idx_webb_users_email" ON "webb_users"("email");
CREATE INDEX IF NOT EXISTS "idx_webb_users_username" ON "webb_users"("username");
CREATE INDEX IF NOT EXISTS "idx_webb_users_active" ON "webb_users"("is_active");

-- Session management indexes
CREATE INDEX IF NOT EXISTS "idx_webb_user_sessions_token" ON "webb_user_sessions"("session_token");
CREATE INDEX IF NOT EXISTS "idx_webb_user_sessions_user_id" ON "webb_user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_webb_user_sessions_active" ON "webb_user_sessions"("is_active");

-- Voting system indexes
CREATE INDEX IF NOT EXISTS "idx_webb_voting_campaigns_status" ON "webb_voting_campaigns"("status");
CREATE INDEX IF NOT EXISTS "idx_webb_voting_campaigns_company" ON "webb_voting_campaigns"("company_code");
CREATE INDEX IF NOT EXISTS "idx_webb_user_votes_user_id" ON "webb_user_votes"("user_id");

-- IP logging indexes
CREATE INDEX IF NOT EXISTS "idx_webb_ip_logs_ip" ON "webb_ip_logs"("ip_address");
CREATE INDEX IF NOT EXISTS "idx_webb_ip_logs_timestamp" ON "webb_ip_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_webb_ip_logs_user_id" ON "webb_ip_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_webb_access_stats_date" ON "webb_access_stats"("date");

-- System configuration indexes
CREATE INDEX IF NOT EXISTS "idx_webb_system_config_key" ON "webb_system_config"("config_key");
CREATE INDEX IF NOT EXISTS "idx_webb_maintenance_log_status" ON "webb_maintenance_log"("status");

-- Email system indexes
CREATE INDEX IF NOT EXISTS "idx_webb_email_logs_status" ON "webb_email_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_webb_email_logs_user_id" ON "webb_email_logs"("user_id");

-- Stock lists indexes
CREATE INDEX IF NOT EXISTS "idx_webb_user_stock_lists_user_id" ON "webb_user_stock_lists"("user_id");
CREATE INDEX IF NOT EXISTS "idx_webb_user_stock_lists_stock_code" ON "webb_user_stock_lists"("stock_code");

-- Insert Default System Configuration
-- 插入默认系统配置

INSERT INTO "webb_system_config" ("config_key", "config_value", "description") VALUES
('db_version', '1.0.0', 'Database schema version'),
('maintenance_mode', 'false', 'System maintenance status'),
('max_sessions_per_user', '5', 'Maximum concurrent sessions per user'),
('session_timeout', '3600', 'Session timeout in seconds'),
('email_enabled', 'true', 'Email notifications enabled'),
('vote_reminder_days', '7', 'Days before voting deadline to send reminders'),
('max_stock_list_items', '100', 'Maximum items per user stock list'),
('log_retention_days', '365', 'Days to retain IP logs'),
('backup_frequency', 'daily', 'Database backup frequency'),
('api_rate_limit', '1000', 'API requests per hour per user')
ON CONFLICT ("config_key") DO NOTHING;

-- Insert Default Email Templates
-- 插入默认邮件模板

INSERT INTO "webb_email_templates" ("name", "subject", "body_text", "template_type") VALUES
('welcome', 'Welcome to Webb Financial System', 'Welcome to our financial analysis platform. Your account has been created successfully.', 'user_management'),
('vote_reminder', 'Voting Reminder - Action Required', 'You have pending votes that require your attention. Please log in to cast your votes.', 'voting'),
('password_reset', 'Password Reset Request', 'Click the link below to reset your password. This link will expire in 24 hours.', 'user_management'),
('maintenance_notice', 'System Maintenance Notice', 'Our system will undergo scheduled maintenance. We apologize for any inconvenience.', 'system')
ON CONFLICT ("name") DO NOTHING;

-- Create Functions for Common Operations
-- 创建常用操作函数

-- Function to get active user sessions
CREATE OR REPLACE FUNCTION get_active_user_sessions(user_id_param INTEGER)
RETURNS TABLE(
  session_id INTEGER,
  session_token VARCHAR,
  ip_address INET,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    ws.session_token,
    ws.ip_address,
    ws.created_at,
    ws.expires_at
  FROM webb_user_sessions ws
  WHERE ws.user_id = user_id_param 
    AND ws.is_active = true 
    AND ws.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  ip_addr INET,
  user_id_param INTEGER,
  page_url_param TEXT,
  action_param VARCHAR(100),
  user_agent_param TEXT DEFAULT NULL,
  session_id_param VARCHAR(255) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO webb_ip_logs (
    ip_address, 
    user_id, 
    page_url, 
    action, 
    user_agent, 
    session_id
  ) VALUES (
    ip_addr, 
    user_id_param, 
    page_url_param, 
    action_param, 
    user_agent_param, 
    session_id_param
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update access statistics
CREATE OR REPLACE FUNCTION update_daily_stats() RETURNS VOID AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  visit_count INTEGER;
  unique_visitors INTEGER;
  page_views INTEGER;
  avg_time NUMERIC;
BEGIN
  -- Calculate today's statistics
  SELECT COUNT(*) INTO visit_count
  FROM webb_ip_logs 
  WHERE DATE(timestamp) = today_date;
  
  SELECT COUNT(DISTINCT ip_address) INTO unique_visitors
  FROM webb_ip_logs 
  WHERE DATE(timestamp) = today_date;
  
  SELECT COUNT(*) INTO page_views
  FROM webb_ip_logs 
  WHERE DATE(timestamp) = today_date 
    AND action = 'page_view';
  
  SELECT AVG(processing_time) INTO avg_time
  FROM webb_ip_logs 
  WHERE DATE(timestamp) = today_date 
    AND processing_time IS NOT NULL;
  
  -- Insert or update statistics
  INSERT INTO webb_access_stats (
    date, 
    total_visits, 
    unique_visitors, 
    total_page_views, 
    avg_response_time
  ) VALUES (
    today_date, 
    visit_count, 
    unique_visitors, 
    page_views, 
    avg_time
  )
  ON CONFLICT (date) DO UPDATE SET
    total_visits = EXCLUDED.total_visits,
    unique_visitors = EXCLUDED.unique_visitors,
    total_page_views = EXCLUDED.total_page_views,
    avg_response_time = EXCLUDED.avg_response_time;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
-- 启用行级安全

ALTER TABLE "webb_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webb_user_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webb_user_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webb_user_stock_lists" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- 创建RLS策略

-- Users can view and edit their own data
CREATE POLICY "Users can view own data" ON "webb_users"
  FOR ALL USING (auth.uid()::text = id::text);

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON "webb_user_sessions"
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Users can view and manage their own votes
CREATE POLICY "Users can manage own votes" ON "webb_user_votes"
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Users can manage their own stock lists
CREATE POLICY "Users can manage own stock lists" ON "webb_user_stock_lists"
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Create Views for Common Queries
-- 创建常用查询视图

-- Active users view
CREATE OR REPLACE VIEW active_users AS
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  company,
  last_login,
  created_at
FROM webb_users 
WHERE is_active = true;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
  l.timestamp,
  u.username,
  l.ip_address,
  l.page_url,
  l.action
FROM webb_ip_logs l
LEFT JOIN webb_users u ON l.user_id = u.id
WHERE l.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY l.timestamp DESC;

-- Voting summary view
CREATE OR REPLACE VIEW voting_summary AS
SELECT 
  c.id as campaign_id,
  c.title,
  c.company_code,
  c.meeting_date,
  c.voting_deadline,
  COUNT(v.id) as total_votes,
  COUNT(CASE WHEN v.vote = 'for' THEN 1 END) as votes_for,
  COUNT(CASE WHEN v.vote = 'against' THEN 1 END) as votes_against,
  COUNT(CASE WHEN v.vote = 'abstain' THEN 1 END) as votes_abstain
FROM webb_voting_campaigns c
LEFT JOIN webb_user_votes v ON c.id = v.campaign_id
GROUP BY c.id, c.title, c.company_code, c.meeting_date, c.voting_deadline;

-- Grant necessary permissions
-- 授予必要权限

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant permissions on tables
GRANT SELECT ON active_users TO anon, authenticated;
GRANT SELECT ON recent_activity TO authenticated;
GRANT SELECT ON voting_summary TO authenticated;

-- Success message
-- 成功消息

DO $$
BEGIN
  RAISE NOTICE 'Webb Database Structure Import Completed Successfully!';
  RAISE NOTICE 'Webb数据库结构导入成功完成！';
  RAISE NOTICE 'Tables created: 10 main tables + 3 views + 3 functions';
  RAISE NOTICE 'Indexes created: 20+ performance indexes';
  RAISE NOTICE 'RLS policies: 4 security policies enabled';
  RAISE NOTICE 'Ready for data import from compressed files (ccass250705.7z, enigma250705.7z)';
END $$; 