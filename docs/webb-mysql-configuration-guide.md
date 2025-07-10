# Webb MySQL 数据库配置指南 / Webb MySQL Database Configuration Guide

## 📋 概述 / Overview

本指南基于David Webb先生提供的原始MySQL配置文档，详细说明如何在现代云环境中复现Webb数据库的完整功能。

This guide is based on David Webb's original MySQL configuration documentation, detailing how to replicate the full functionality of the Webb database in a modern cloud environment.

## 🏗️ 原始架构 / Original Architecture

### Master-Slave 配置 / Master-Slave Configuration

```yaml
原始设置 / Original Setup:
- Master Server: Hong Kong (Windows 10 PC, 32GB RAM)
  - 用途: 数据收集 (手动和自动)
  - MySQL: 8.0.37
  - 引擎: InnoDB only
  - 存储: SSD recommended

- Slave Server: USA (Windows Server 2016)
  - 用途: Webb网站服务
  - 数据: 静态镜像数据
  - 连接: 4个System DSNs
```

### 关键MySQL参数 / Critical MySQL Parameters

```ini
# my.ini / mysql.conf 配置
[mysqld]
# 精确计算需要 / Required for accurate calculations
div_precision_increment = 8

# 多字节中文字符支持 / Multibyte Chinese character support
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 全文索引优化 / Full-text index optimization
innodb_ft_min_token_size = 2      # 支持短中文名如"区" / Support short Chinese names
innodb_ft_enable_stopword = 0     # 禁用停用词 / Disable stopwords

# 角色管理 / Role management
activate_all_roles_on_login = ON

# 性能优化 / Performance optimization
innodb_flush_log_at_trx_commit = 0
innodb_log_buffer_size = 1M
innodb_buffer_pool_size = 20G     # 80% of RAM recommended
innodb_redo_log_capacity = 2G
innodb_thread_concurrency = 17
innodb_autoextend_increment = 64
innodb_buffer_pool_instances = 8
innodb_concurrency_tickets = 5000
innodb_open_files = 300
innodb_file_per_table = 1
sort_buffer_size = 256K
```

## 🗄️ 数据库架构 / Database Schema Architecture

### 核心Schema / Core Schemas

```sql
-- 1. ENIGMA Schema (1.7GB) - 核心金融数据
DROP SCHEMA IF EXISTS enigma;
CREATE SCHEMA enigma;

-- 2. CCASS Schema (1.4GB) - 清算系统数据  
DROP SCHEMA IF EXISTS ccass;
CREATE SCHEMA ccass;

-- 3. MAILVOTE Schema - 用户管理 (仅Webb服务器)
DROP SCHEMA IF EXISTS mailvote;
CREATE SCHEMA mailvote;

-- 4. IPLOG Schema - IP日志 (仅Webb服务器)
DROP SCHEMA IF EXISTS iplog;
CREATE SCHEMA iplog;

-- 5. PRIVATE Schema - 系统密钥 (仅Master服务器)
DROP SCHEMA IF EXISTS private;
CREATE SCHEMA private;
```

### 重要表结构 / Important Table Structures

```sql
-- ENIGMA.ORGANISATIONS (公司信息)
CREATE TABLE enigma.organisations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_code VARCHAR(10),
    name1 TEXT,           -- 搜索用主名称 / Primary searchable name
    name2 TEXT,           -- 备用名称 / Alternative name  
    name3 TEXT,           -- 中文名称 / Chinese name
    listing_date DATE,
    market_cap DECIMAL(20,2),
    sector VARCHAR(100),
    
    -- 全文索引 / Full-text indexes
    FULLTEXT(name1),
    INDEX idx_stock_code(stock_code),
    INDEX idx_listing_date(listing_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ENIGMA.PEOPLE (人员信息)
CREATE TABLE enigma.people (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name1 TEXT NOT NULL,   -- 搜索用主名称 / Primary searchable name
    name2 TEXT,           -- 备用名称 / Alternative name
    name3 TEXT,           -- 中文名称 / Chinese name
    gender CHAR(1),
    nationality VARCHAR(50),
    
    -- 全文索引 / Full-text indexes
    FULLTEXT(name1),
    FULLTEXT(name2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CCASS Holdings (CCASS持股数据)
CREATE TABLE ccass.holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_code VARCHAR(10),
    participant_id VARCHAR(20),
    shares_held BIGINT,
    record_date DATE,
    
    INDEX idx_stock_code(stock_code),
    INDEX idx_record_date(record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 👥 用户权限系统 / User Permission System

### MySQL 用户角色 / MySQL User Roles

```sql
-- 1. 创建核心用户 / Create core users
CREATE USER 'David'@'%' IDENTIFIED BY 'secure_password';
CREATE USER 'Web'@'%' IDENTIFIED BY 'web_password';
CREATE USER 'auto'@'%' IDENTIFIED BY 'auto_password';

-- 2. David (超级用户 / Super user)
GRANT ALL PRIVILEGES ON *.* TO 'David'@'%' WITH GRANT OPTION;
GRANT CREATE VIEW ON *.* TO 'David'@'%';
GRANT CREATE ROUTINE ON *.* TO 'David'@'%';

-- 3. Web (网站只读用户 / Website read-only user)
GRANT SELECT ON enigma.* TO 'Web'@'%';
GRANT SELECT ON ccass.* TO 'Web'@'%';
GRANT SELECT, INSERT, UPDATE ON mailvote.* TO 'Web'@'%';

-- 4. auto (自动编辑用户 / Automated editing user)
GRANT SELECT, INSERT, UPDATE ON enigma.* TO 'auto'@'%';
GRANT SELECT, INSERT, UPDATE ON ccass.* TO 'auto'@'%';
```

### 权限文件说明 / Permission File Details

```bash
# 权限配置文件位置 / Permission configuration files
/Slave/Web grants.csv           # Web用户权限
/Master grants/auto grants.csv  # auto用户权限
/Master grants/[role] grants.csv # 其他角色权限
```

## 🔗 ODBC 连接配置 / ODBC Connection Configuration

### Webb服务器System DSNs / Webb Server System DSNs

```ini
[enigmaMySQL]
Driver = MySQL ODBC 8.4.0 Unicode Driver
Server = localhost
User = Web  
Database = enigma
Port = 3306
Option = 3

[CCASSserver]
Driver = MySQL ODBC 8.4.0 Unicode Driver
Server = localhost
User = Web
Database = ccass  
Port = 3306
Option = 3

[conAuto]
Driver = MySQL ODBC 8.4.0 Unicode Driver
Server = master.domain.com      # Master服务器地址
User = auto
Database = enigma
Port = 3306
# 重要: Cursors/Results -> "Return matched rows instead of affected rows" = TRUE

[mailvote]
Driver = MySQL ODBC 8.4.0 Unicode Driver
Server = localhost
User = Web
Database = mailvote
Port = 3306
# 重要: Cursors/Results -> "Return matched rows instead of affected rows" = TRUE
```

### 编辑器PC用户DSNs / Editor PC User DSNs

```ini
[CCASS]
Driver = MySQL ODBC 8.4.0 Unicode Driver
Server = 192.168.x.x           # Master服务器LAN IP
User = David                   # 或Cynthia
Database = ccass
# 重要: Cursors/Results -> "Return matched rows instead of affected rows" = TRUE

[EnigmaMySQL]  
Driver = MySQL ODBC 8.4.0 Unicode Driver
Server = 192.168.x.x           # Master服务器LAN IP
User = David                   # 或Cynthia  
Database = enigma
# 重要: Cursors/Results -> "Return matched rows instead of affected rows" = TRUE
```

## 🔄 数据恢复流程 / Data Restoration Process

### 恢复顺序 / Restoration Order

```bash
# 1. 结构恢复 / Structure restoration
mysql -u root -p enigma < enigma_structure.sql

# 2. 数据恢复 / Data restoration  
mysql -u root -p enigma < enigma_data.sql

# 3. 触发器恢复 / Triggers restoration (最后执行!)
mysql -u root -p enigma < enigma_triggers.sql
```

### 重要注意事项 / Important Notes

```sql
-- 恢复前需要处理的问题 / Issues to handle before restoration

-- 1. Definer问题 / Definer problem
-- 所有存储过程/函数/视图都定义为用户'David'
-- 恢复前必须创建用户'David'并授予全局权限

-- 2. 时间戳字段 / Timestamp fields  
-- 某些表有自动更新的timestamp列
-- 恢复时需要临时禁用以避免数据修改

-- 3. 触发器 / Triggers
-- 触发器会在数据插入/更新时自动执行
-- 必须最后恢复以避免修改已有数据
```

## 🌐 IIS和ASP配置 / IIS and ASP Configuration

### IIS设置 / IIS Settings

```xml
<!-- web.config for ASP Classic -->
<configuration>
  <system.webServer>
    <asp>
      <!-- 重要: 启用父路径 / Important: Enable parent paths -->
      <enableParentPaths>true</enableParentPaths>
      
      <!-- 开发环境: 发送错误到浏览器 / Development: Send errors to browser -->
      <scriptErrorSentToBrowser>true</scriptErrorSentToBrowser>
      
      <!-- 编译调试属性 / Compilation debugging properties -->
      <compilation>
        <debugging>
          <sendErrorsToBrowser>true</sendErrorsToBrowser>
        </debugging>
      </compilation>
    </asp>
  </system.webServer>
</configuration>
```

### ASP文件结构 / ASP File Structure

```
webb-site/
├── dbpub/
│   ├── functions1.asp          # 核心函数库 / Core function library
│   ├── db_connection.asp       # 数据库连接 / Database connections
│   └── common_includes.asp     # 通用包含文件 / Common includes
├── ccass/
│   ├── holdings.asp           # CCASS持股查询 / CCASS holdings query
│   └── participants.asp       # 参与者信息 / Participant info
├── enigma/
│   ├── companies.asp          # 公司查询 / Company search
│   ├── directors.asp          # 董事信息 / Director information
│   └── shareholdings.asp      # 股权信息 / Shareholding info
└── admin/
    ├── edit_company.asp       # 公司编辑 / Company editing
    └── data_import.asp        # 数据导入 / Data import
```

## 🔐 系统密钥管理 / System Key Management

### PRIVATE.KEYS表结构 / PRIVATE.KEYS Table Structure

```sql
CREATE TABLE private.keys (
    key_name VARCHAR(100) PRIMARY KEY,
    key_value TEXT,
    description TEXT,
    category VARCHAR(50),
    is_encrypted BOOLEAN DEFAULT FALSE
);

-- 重要密钥 / Important keys
INSERT INTO private.keys (key_name, description, category) VALUES
('wskey', '用于加密/解密wsroles表中MySQL密码的密钥字符串', 'security'),
('mail_server', '错误邮件发送服务器连接信息', 'notification'), 
('uk_api_key', '英国API访问密钥', 'external_api'),
('master_host', 'Master服务器域名或IP地址', 'connection');
```

### 密钥使用示例 / Key Usage Examples

```vbscript
' functions1.asp中的getKey函数示例
Function getKey(keyName)
    Set conn = CreateObject("ADODB.Connection")
    conn.Open "DSN=mailvote"
    
    Set rs = conn.Execute("SELECT key_value FROM private.keys WHERE key_name='" & keyName & "'")
    If Not rs.EOF Then
        getKey = rs("key_value")
    Else
        getKey = ""
    End If
    
    rs.Close
    conn.Close
    Set rs = Nothing
    Set conn = Nothing
End Function

' 使用示例 / Usage example
mailServer = getKey("mail_server")
apiKey = getKey("uk_api_key")
```

## 🚀 现代化迁移策略 / Modernization Migration Strategy

### Supabase对应关系 / Supabase Equivalents

```typescript
// MySQL → PostgreSQL 映射
const migrationMapping = {
  // 字符集 / Character set
  'utf8mb4': 'UTF8',
  'utf8mb4_unicode_ci': 'pg_trgm + unaccent',
  
  // 引擎 / Engine  
  'InnoDB': 'PostgreSQL (内建事务支持)',
  
  // 全文索引 / Full-text indexes
  'FULLTEXT(name1)': 'CREATE INDEX USING gin(to_tsvector(name1))',
  'FULLTEXT(name1, name2)': 'GIN index with pg_trgm',
  
  // 用户权限 / User permissions
  'MySQL Users': 'Supabase RLS Policies',
  'GRANT SELECT': 'RLS Policy for SELECT',
  
  // 连接 / Connections
  'ODBC DSN': 'Supabase Client Libraries',
  'System DSN': 'Environment Variables'
}
```

### 关键差异处理 / Key Differences Handling

```sql
-- MySQL AUTO_INCREMENT → PostgreSQL SERIAL
-- MySQL: id INT AUTO_INCREMENT PRIMARY KEY
-- PostgreSQL: id SERIAL PRIMARY KEY

-- MySQL FULLTEXT → PostgreSQL GIN  
-- MySQL: FULLTEXT(name1)
-- PostgreSQL: CREATE INDEX idx_name1_fts ON table USING gin(to_tsvector('english', name1));

-- MySQL timestamp自动更新 → PostgreSQL触发器
-- MySQL: updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- PostgreSQL: 需要创建更新触发器函数
```

## 📊 性能优化建议 / Performance Optimization Recommendations

### 硬件要求 / Hardware Requirements

```yaml
最低配置 / Minimum Configuration:
- RAM: 16GB (建议32GB / Recommended 32GB)
- 存储: SSD (NVMe preferred)
- CPU: 4核心以上 / 4+ cores
- 网络: 高速互联网连接

云服务配置 / Cloud Service Configuration:
- Supabase: Pro Plan 或更高
- 数据库: 至少4GB RAM
- 存储: 高性能SSD
- 备份: 自动日备份启用
```

### 索引优化策略 / Index Optimization Strategy

```sql
-- 基于Webb数据库查询模式的索引建议
-- Index recommendations based on Webb database query patterns

-- 1. 公司搜索优化 / Company search optimization
CREATE INDEX idx_org_stock_code ON enigma.organisations(stock_code);
CREATE INDEX idx_org_name1_trgm ON enigma.organisations USING gin(name1 gin_trgm_ops);

-- 2. 人员搜索优化 / People search optimization  
CREATE INDEX idx_people_name1_trgm ON enigma.people USING gin(name1 gin_trgm_ops);
CREATE INDEX idx_people_name2_trgm ON enigma.people USING gin(name2 gin_trgm_ops);

-- 3. CCASS数据查询优化 / CCASS data query optimization
CREATE INDEX idx_ccass_stock_date ON ccass.holdings(stock_code, record_date);
CREATE INDEX idx_ccass_participant ON ccass.holdings(participant_id);

-- 4. 复合索引 / Composite indexes
CREATE INDEX idx_positions_org_person ON enigma.positions(organisation_id, person_id);
CREATE INDEX idx_shareholdings_org_date ON enigma.shareholdings(organisation_id, disclosure_date);
```

## 🔄 备份和恢复策略 / Backup and Recovery Strategy

### 自动备份方案 / Automated Backup Solution

```bash
# Supabase自动备份 (推荐)
# Supabase automatic backup (recommended)
- 每日自动备份 / Daily automatic backups
- 时间点恢复 / Point-in-time recovery  
- 跨区域备份 / Cross-region backup
- 加密存储 / Encrypted storage

# 手动备份脚本 / Manual backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "webb_backup_$DATE.sql"
gzip "webb_backup_$DATE.sql"
```

### 灾难恢复计划 / Disaster Recovery Plan

```yaml
恢复时间目标 / Recovery Time Objective (RTO):
- 关键数据: < 1小时 / Critical data: < 1 hour
- 完整系统: < 4小时 / Full system: < 4 hours

恢复点目标 / Recovery Point Objective (RPO):
- 数据丢失: < 15分钟 / Data loss: < 15 minutes
- 备份频率: 每小时 / Backup frequency: Hourly

故障切换流程 / Failover Process:
1. 检测故障 / Detect failure
2. 激活备用系统 / Activate backup system  
3. 重定向流量 / Redirect traffic
4. 通知用户 / Notify users
5. 恢复数据 / Restore data
```

## 📈 监控和维护 / Monitoring and Maintenance

### 关键指标监控 / Key Metrics Monitoring

```yaml
数据库性能 / Database Performance:
- 查询响应时间 / Query response time
- 连接数 / Connection count
- 缓存命中率 / Cache hit ratio
- 磁盘I/O使用率 / Disk I/O usage

系统资源 / System Resources:  
- CPU使用率 / CPU usage
- 内存使用率 / Memory usage
- 存储空间 / Storage space
- 网络带宽 / Network bandwidth

业务指标 / Business Metrics:
- 活跃用户数 / Active users
- 查询频率 / Query frequency  
- 数据更新频率 / Data update frequency
- 错误率 / Error rate
```

### 定期维护任务 / Regular Maintenance Tasks

```sql
-- 每周维护任务 / Weekly maintenance tasks
-- 1. 统计信息更新 / Update statistics
ANALYZE;

-- 2. 索引重建 / Rebuild indexes (if needed)
REINDEX INDEX idx_organisations_name1_trgm;

-- 3. 清理日志 / Clean up logs
DELETE FROM webb.ip_logs WHERE hit_date < CURRENT_DATE - INTERVAL '90 days';

-- 4. 检查数据完整性 / Check data integrity
SELECT COUNT(*) FROM webb.organisations WHERE stock_code IS NULL;
SELECT COUNT(*) FROM webb.positions WHERE resignation_date < appointment_date;
```

---

## 总结 / Summary

这份配置指南保留了David Webb数据库的核心架构和功能，同时提供了现代化云部署的完整路径。通过Supabase平台，我们可以获得:

This configuration guide preserves the core architecture and functionality of David Webb's database while providing a complete path for modern cloud deployment. Through the Supabase platform, we can achieve:

✅ **完整的数据迁移** / Complete data migration  
✅ **现代化的安全性** / Modern security  
✅ **自动化的备份** / Automated backups  
✅ **AI增强功能** / AI enhancements  
✅ **全球高可用性** / Global high availability  

同时保持与原始ASP应用程序的兼容性和数据完整性。

While maintaining compatibility with the original ASP application and data integrity. 