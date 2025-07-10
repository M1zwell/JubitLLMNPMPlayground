# Webb Database Direct Import Guide
## Webb数据库直接导入指南

### 概述 / Overview

由于安全限制，我们需要通过Supabase SQL编辑器手动执行Webb数据库结构的导入。以下是详细的步骤指南。

Due to security restrictions, we need to manually execute Webb database structure import through Supabase SQL Editor. Here's a detailed step-by-step guide.

---

### 步骤 1: 访问Supabase SQL编辑器 / Step 1: Access Supabase SQL Editor

1. 访问 Supabase Dashboard: https://app.supabase.com/project/kiztaihzanqnrcrqaxsv
2. 登录您的账户
3. 点击左侧菜单中的 "SQL Editor" / Click "SQL Editor" in the left menu
4. 创建新查询 / Create a new query

---

### 步骤 2: 执行Webb用户管理结构 / Step 2: Execute Webb User Management Structure

复制并执行以下SQL代码 / Copy and execute the following SQL code:

```sql
-- Webb用户管理表 / Webb User Management Tables
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

-- 创建索引 / Create indexes
CREATE INDEX IF NOT EXISTS "idx_webb_users_email" ON "webb_users"("email");
CREATE INDEX IF NOT EXISTS "idx_webb_users_username" ON "webb_users"("username");
CREATE INDEX IF NOT EXISTS "idx_webb_user_sessions_token" ON "webb_user_sessions"("session_token");
CREATE INDEX IF NOT EXISTS "idx_webb_user_sessions_user_id" ON "webb_user_sessions"("user_id");
```

---

### 步骤 3: 执行Webb投票系统结构 / Step 3: Execute Webb Voting System Structure

```sql
-- Webb投票系统表 / Webb Voting System Tables
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

-- 创建索引 / Create indexes
CREATE INDEX IF NOT EXISTS "idx_webb_voting_campaigns_status" ON "webb_voting_campaigns"("status");
CREATE INDEX IF NOT EXISTS "idx_webb_voting_campaigns_company" ON "webb_voting_campaigns"("company_code");
CREATE INDEX IF NOT EXISTS "idx_webb_user_votes_user_id" ON "webb_user_votes"("user_id");
```

---

### 步骤 4: 执行Webb日志系统结构 / Step 4: Execute Webb Logging System Structure

```sql
-- Webb日志系统表 / Webb Logging System Tables
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

-- 创建索引 / Create indexes
CREATE INDEX IF NOT EXISTS "idx_webb_ip_logs_ip" ON "webb_ip_logs"("ip_address");
CREATE INDEX IF NOT EXISTS "idx_webb_ip_logs_timestamp" ON "webb_ip_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_webb_ip_logs_user_id" ON "webb_ip_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_webb_access_stats_date" ON "webb_access_stats"("date");
```

---

### 步骤 5: 执行Webb系统配置结构 / Step 5: Execute Webb System Configuration Structure

```sql
-- Webb系统配置表 / Webb System Configuration Tables
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

-- 创建索引 / Create indexes
CREATE INDEX IF NOT EXISTS "idx_webb_system_config_key" ON "webb_system_config"("config_key");
CREATE INDEX IF NOT EXISTS "idx_webb_maintenance_log_status" ON "webb_maintenance_log"("status");
```

---

### 步骤 6: 执行Webb邮件系统结构 / Step 6: Execute Webb Email System Structure

```sql
-- Webb邮件系统表 / Webb Email System Tables
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

CREATE TABLE IF NOT EXISTS "webb_user_stock_lists" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER REFERENCES "webb_users"("id") ON DELETE CASCADE,
  "stock_code" VARCHAR(10) NOT NULL,
  "list_name" VARCHAR(100) DEFAULT 'default',
  "notes" TEXT,
  "added_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引 / Create indexes
CREATE INDEX IF NOT EXISTS "idx_webb_email_logs_status" ON "webb_email_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_webb_email_logs_user_id" ON "webb_email_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_webb_user_stock_lists_user_id" ON "webb_user_stock_lists"("user_id");
CREATE INDEX IF NOT EXISTS "idx_webb_user_stock_lists_stock_code" ON "webb_user_stock_lists"("stock_code");
```

---

### 步骤 7: 插入默认配置数据 / Step 7: Insert Default Configuration Data

```sql
-- 插入默认系统配置 / Insert default system configuration
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

-- 插入默认邮件模板 / Insert default email templates
INSERT INTO "webb_email_templates" ("name", "subject", "body_text", "template_type") VALUES
('welcome', 'Welcome to Webb Financial System', 'Welcome to our financial analysis platform. Your account has been created successfully.', 'user_management'),
('vote_reminder', 'Voting Reminder - Action Required', 'You have pending votes that require your attention. Please log in to cast your votes.', 'voting'),
('password_reset', 'Password Reset Request', 'Click the link below to reset your password. This link will expire in 24 hours.', 'user_management'),
('maintenance_notice', 'System Maintenance Notice', 'Our system will undergo scheduled maintenance. We apologize for any inconvenience.', 'system')
ON CONFLICT ("name") DO NOTHING;
```

---

### 步骤 8: 创建有用的视图和函数 / Step 8: Create Useful Views and Functions

```sql
-- 创建视图 / Create views
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
```

---

### 步骤 9: 验证导入 / Step 9: Verify Import

执行以下查询来验证表是否成功创建 / Execute the following query to verify tables were created successfully:

```sql
-- 检查创建的表 / Check created tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'webb_%'
ORDER BY table_name;

-- 检查表的记录数 / Check table record counts
SELECT 
  'webb_system_config' as table_name, COUNT(*) as record_count 
FROM webb_system_config
UNION ALL
SELECT 
  'webb_email_templates' as table_name, COUNT(*) as record_count 
FROM webb_email_templates;
```

---

### 步骤 10: 下一步操作 / Step 10: Next Steps

✅ **已完成 / Completed:**
- Webb用户管理系统结构 / Webb user management system structure
- Webb投票系统结构 / Webb voting system structure  
- Webb日志系统结构 / Webb logging system structure
- Webb邮件系统结构 / Webb email system structure
- 默认配置和模板 / Default configuration and templates

📋 **待完成 / To Do:**
1. 解压缩数据文件 / Extract compressed data files:
   - `ccass250705.7z` (1.49GB CCASS持股数据 / CCASS shareholding data)
   - `enigma250705.7z` (1.83GB Enigma治理数据 / Enigma governance data)

2. 转换和导入数据 / Convert and import data:
   - MySQL格式转PostgreSQL / MySQL format to PostgreSQL
   - 批量数据导入 / Bulk data import
   - 数据验证和清理 / Data validation and cleaning

3. 启用AI分析功能 / Enable AI analysis features:
   - 自然语言查询 / Natural language queries
   - 智能报告生成 / Intelligent report generation
   - 实时市场分析 / Real-time market analysis

---

### 故障排除 / Troubleshooting

**如果遇到权限错误 / If you encounter permission errors:**
- 确保使用service_role密钥 / Ensure using service_role key
- 检查RLS策略设置 / Check RLS policy settings

**如果遇到外键约束错误 / If you encounter foreign key constraint errors:**
- 按照步骤顺序执行SQL / Execute SQL in the order of steps
- 先创建引用表再创建引用者 / Create referenced tables before referencing tables

**如果遇到重复键错误 / If you encounter duplicate key errors:**
- 使用ON CONFLICT DO NOTHING子句 / Use ON CONFLICT DO NOTHING clause
- 或先删除现有数据 / Or delete existing data first

---

### 联系支持 / Contact Support

如有任何问题，请联系技术支持团队。
If you have any issues, please contact the technical support team.

Email: support@jubitai.com
Documentation: https://docs.jubitai.com/webb-database 