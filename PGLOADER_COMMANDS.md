# pgloader Quick Reference / pgloader快速参考

## Installation Options / 安装选项

### Option 1: WSL2 + Ubuntu (Recommended for Windows) / 推荐Windows用户使用WSL2
```bash
# Install WSL2 with Ubuntu
wsl --install Ubuntu

# In WSL Ubuntu terminal:
sudo apt-get update
sudo apt-get install pgloader postgresql-client mysql-client

# Verify installation
pgloader --version
psql --version
mysql --version
```

### Option 2: Docker (Alternative) / Docker替代方案
```bash
# Pull pgloader Docker image
docker pull dimitri/pgloader

# Test Docker pgloader
docker run --rm dimitri/pgloader pgloader --version
```

### Option 3: macOS / macOS系统
```bash
brew install pgloader
```

## Quick Test Commands / 快速测试命令

### Test MySQL Connection / 测试MySQL连接
```bash
# Windows PowerShell
mysql -h localhost -u David -pWelcome08~billcn -e "SHOW DATABASES;"

# WSL/Linux
mysql -h localhost -u David -p'Welcome08~billcn' -e "SHOW DATABASES;"
```

### Test PostgreSQL Connection / 测试PostgreSQL连接
```bash
# Test Supabase connection
psql "postgresql://postgres:Welcome08~billcn@db.kiztaihzanqnrcrqaxsv.supabase.co:5432/postgres" -c "SELECT version();"
```

## Migration Commands / 迁移命令

### Method 1: PowerShell Script (Windows) / PowerShell脚本方法
```powershell
# Dry run first (recommended)
.\run-pgloader-migration.ps1 -DryRun

# Full migration
.\run-pgloader-migration.ps1
```

### Method 2: Manual pgloader / 手动pgloader
```bash
# Enigma database
pgloader webb-pgloader-migration.load

# CCASS database  
pgloader webb-ccass-migration.load
```

### Method 3: Docker Method / Docker方法
```bash
# Run Enigma migration via Docker
docker run --rm -v $(pwd):/data dimitri/pgloader pgloader /data/webb-pgloader-migration.load

# Run CCASS migration via Docker
docker run --rm -v $(pwd):/data dimitri/pgloader pgloader /data/webb-ccass-migration.load
```

### Method 4: WSL Method / WSL方法
```bash
# Copy config files to WSL
wsl cp webb-pgloader-migration.load /tmp/
wsl cp webb-ccass-migration.load /tmp/

# Run migrations in WSL
wsl pgloader /tmp/webb-pgloader-migration.load
wsl pgloader /tmp/webb-ccass-migration.load
```

## Verification Commands / 验证命令

### Check Migration Results / 检查迁移结果
```sql
-- Connect to Supabase
psql "postgresql://postgres:Welcome08~billcn@db.kiztaihzanqnrcrqaxsv.supabase.co:5432/postgres"

-- Check schemas
\dn

-- Check Enigma data
SET search_path TO enigma;
SELECT COUNT(*) FROM organisations;
SELECT COUNT(*) FROM people;
SELECT COUNT(*) FROM directorships;

-- Check CCASS data
SET search_path TO ccass;
SELECT COUNT(*) FROM holdings;
SELECT COUNT(*) FROM participants;
SELECT COUNT(*) FROM quotes;

-- Sample data
SELECT * FROM enigma.organisations LIMIT 3;
SELECT * FROM ccass.holdings LIMIT 3;
```

## Troubleshooting / 故障排除

### Common Issues / 常见问题

1. **pgloader not found / 找不到pgloader**
   ```bash
   # Solution: Install via WSL or use Docker
   wsl --install Ubuntu
   # Then: sudo apt-get install pgloader
   ```

2. **MySQL connection refused / MySQL连接被拒绝**
   ```bash
   # Check MySQL service status
   net start mysql
   # Or: services.msc -> MySQL80 service
   ```

3. **PostgreSQL connection timeout / PostgreSQL连接超时**
   ```bash
   # Test network connectivity
   ping db.kiztaihzanqnrcrqaxsv.supabase.co
   # Check firewall settings
   ```

4. **Permission denied / 权限被拒绝**
   ```bash
   # Run PowerShell as Administrator
   # Or use WSL with sudo
   ```

5. **Character encoding issues / 字符编码问题**
   ```sql
   -- Add charset to MySQL connection string
   FROM mysql://David:Welcome08~billcn@localhost:3306/enigma?charset=utf8mb4
   ```

## Performance Tips / 性能提示

### Before Migration / 迁移前
```sql
-- Optimize MySQL
SET GLOBAL innodb_buffer_pool_size = 2147483648;
SET GLOBAL max_connections = 200;
```

### During Migration / 迁移期间
```
-- Monitor system resources
-- Expect 30-90 minutes per database
-- Network speed affects performance
```

### After Migration / 迁移后
```sql
-- Optimize PostgreSQL
VACUUM ANALYZE;
REINDEX DATABASE postgres;
```

## Expected Results / 预期结果

| Database | Size | Tables | Records | Time |
|----------|------|--------|---------|------|
| Enigma   | 1.8GB | ~15    | ~18M    | 30-60 min |
| CCASS    | 1.4GB | ~15    | ~25M    | 45-90 min |

## Files Created / 创建的文件

- `webb-pgloader-migration.load` - Enigma database config
- `webb-ccass-migration.load` - CCASS database config  
- `run-pgloader-migration.ps1` - PowerShell automation script
- `run-pgloader-migration.sh` - Bash automation script
- `webb-pgloader-setup.md` - Detailed documentation
- `PGLOADER_COMMANDS.md` - This quick reference

## Integration / 集成

After successful migration, your React app components will automatically work:
- WebbFinancialIntegration.tsx
- WebbDataImporter.tsx
- WebbMySQLMigrator.tsx
- All Supabase edge functions

成功迁移后，React应用组件将自动工作。 