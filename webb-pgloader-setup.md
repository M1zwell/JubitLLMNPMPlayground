# Webb Database Migration with pgloader / Webb数据库使用pgloader迁移

## Overview / 概述

This guide shows how to use pgloader to migrate David Webb's MySQL databases (Enigma 1.8GB + CCASS 1.4GB) to Supabase PostgreSQL. pgloader is the recommended tool for MySQL→PostgreSQL migrations as it handles data type conversions automatically.

本指南展示如何使用pgloader将David Webb的MySQL数据库（Enigma 1.8GB + CCASS 1.4GB）迁移到Supabase PostgreSQL。pgloader是MySQL→PostgreSQL迁移的推荐工具，因为它自动处理数据类型转换。

## Installation / 安装

### Windows (WSL recommended / 推荐使用WSL)

```bash
# Install WSL2 with Ubuntu
wsl --install Ubuntu

# In WSL Ubuntu terminal:
sudo apt-get update
sudo apt-get install pgloader postgresql-client

# Verify installation
pgloader --version
```

### Alternative: Docker Method / 替代方案：Docker方法

```bash
# Pull pgloader Docker image
docker pull dimitri/pgloader

# Use Docker to run migrations
docker run --rm -it \
  -v $(pwd):/data \
  dimitri/pgloader \
  pgloader /data/webb-pgloader-migration.load
```

### macOS

```bash
brew install pgloader
```

## Database Preparation / 数据库准备

### 1. Verify MySQL Configuration / 验证MySQL配置

Based on your existing MySQL 8.0.37 setup [[memory:2869709]]:

```sql
-- Connect to MySQL and verify databases
mysql -u David -p

SHOW DATABASES;
USE enigma;
SHOW TABLES;
SELECT COUNT(*) FROM organisations;

USE ccass;
SHOW TABLES;
SELECT COUNT(*) FROM holdings;
```

### 2. Test PostgreSQL Connection / 测试PostgreSQL连接

```bash
# Test Supabase connection
psql "postgresql://postgres:Welcome08~billcn@db.kiztaihzanqnrcrqaxsv.supabase.co:5432/postgres"

# Check current schemas
\dn

# Exit PostgreSQL
\q
```

## Migration Process / 迁移过程

### Phase 1: Enigma Database (1.8GB) / 阶段1：Enigma数据库

```bash
# Run Enigma migration
pgloader webb-pgloader-migration.load

# Monitor progress - pgloader shows:
# - Tables created
# - Rows migrated per table
# - Data conversion issues
# - Total time and throughput
```

### Phase 2: CCASS Database (1.4GB) / 阶段2：CCASS数据库

```bash
# Run CCASS migration
pgloader webb-ccass-migration.load
```

## Expected Migration Results / 预期迁移结果

### Enigma Database / Enigma数据库
- **Tables**: ~15 tables including organisations, people, directorships
- **Records**: ~18M+ records total
- **Time**: ~30-60 minutes depending on connection speed
- **Size**: 1.8GB compressed → ~2.2GB in PostgreSQL

### CCASS Database / CCASS数据库  
- **Tables**: ~15 tables including holdings, participants, quotes
- **Records**: ~25M+ shareholding records
- **Time**: ~45-90 minutes
- **Size**: 1.4GB compressed → ~1.8GB in PostgreSQL

## Monitoring Migration / 监控迁移

pgloader provides real-time progress:

```
2024-01-17T12:30:15 LOG pgloader version "3.6.2"
2024-01-17T12:30:16 LOG Migrating from "mysql://David@localhost:3306/enigma"
2024-01-17T12:30:16 LOG Migrating into "postgresql://postgres@db.kiztaihzanqnrcrqaxsv.supabase.co:5432/postgres"

                    table name     errors       rows      bytes      total time
-----------------------  ---------  ---------  ---------  --------------
              fetch meta          0          15                     0.125s
               drop/SQL          0          1                      0.089s
           before load/SQL       0          1                      0.034s
            Create Indexes       0          0                      0.000s
             organisations       0     982,475     125.3 MB          2.234s
                    people       0   1,847,293     287.9 MB          4.567s
             directorships       0   3,294,847     489.2 MB          8.923s
           after load/SQL        0          7                      0.445s
-----------------------  ---------  ---------  ---------  --------------
          TOTAL             0   6,124,615     902.4 MB         16.417s
```

## Verification / 验证

After migration, verify data integrity:

```sql
-- Connect to Supabase
psql "postgresql://postgres:Welcome08~billcn@db.kiztaihzanqnrcrqaxsv.supabase.co:5432/postgres"

-- Check schemas
\dn

-- Verify Enigma data
SET search_path TO enigma;
SELECT COUNT(*) FROM organisations;
SELECT COUNT(*) FROM people;
SELECT COUNT(*) FROM directorships;

-- Verify CCASS data  
SET search_path TO ccass;
SELECT COUNT(*) FROM holdings;
SELECT COUNT(*) FROM participants;

-- Check sample data
SELECT * FROM enigma.organisations LIMIT 5;
SELECT * FROM ccass.holdings LIMIT 5;
```

## Troubleshooting / 故障排除

### Common Issues / 常见问题

1. **Connection Timeout / 连接超时**
   ```bash
   # Increase timeout in pgloader config
   SET net_read_timeout to '600', net_write_timeout to '600';
   ```

2. **Character Encoding Issues / 字符编码问题**
   ```bash
   # Add to MySQL connection string
   FROM mysql://David:Welcome08~billcn@localhost:3306/enigma?charset=utf8mb4
   ```

3. **Memory Issues / 内存问题**
   ```bash
   # Reduce batch size
   SET batch_rows to '10000', batch_size to '20MB';
   ```

4. **Large Table Timeout / 大表超时**
   ```bash
   # Split large tables manually
   WITH data only, batch rows = 25000
   ```

## Performance Optimization / 性能优化

### Pre-Migration / 迁移前
```sql
-- Optimize MySQL for export
SET GLOBAL innodb_buffer_pool_size = 2147483648;
SET GLOBAL max_connections = 200;
```

### Post-Migration / 迁移后
```sql
-- Optimize PostgreSQL
VACUUM ANALYZE;
REINDEX DATABASE postgres;
```

## Integration with React App / 与React应用集成

After successful migration, your existing Webb components will automatically connect:

- `WebbFinancialIntegration.tsx` - Dashboard view
- `WebbDataImporter.tsx` - Data management
- `WebbMySQLMigrator.tsx` - Migration status
- Supabase edge functions for real-time queries

成功迁移后，现有的Webb组件将自动连接。

## Cost Estimation / 成本估算

- **Migration Time**: 2-4 hours total for both databases
- **Supabase Storage**: ~4GB additional storage
- **Bandwidth**: ~3.2GB transfer from MySQL to PostgreSQL
- **Downtime**: Zero (read-only migration)

## Next Steps / 下一步

1. Run migration with `pgloader`
2. Verify data integrity
3. Update React app configuration
4. Test Webb financial integration features
5. Deploy to production

This approach is much more reliable than manual SQL file processing and handles the MySQL-specific configurations automatically.

这种方法比手动SQL文件处理更可靠，并自动处理MySQL特定配置。 