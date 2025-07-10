# Webb Database Migration Script using pgloader (PowerShell)
# Migrates David Webb's MySQL databases to Supabase PostgreSQL

param(
    [switch]$DryRun = $false
)

# Configuration
$LogFile = "webb-migration-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
$MysqlHost = "localhost"
$MysqlUser = "David"
$MysqlPass = "Welcome08~billcn"
$PgHost = "db.kiztaihzanqnrcrqaxsv.supabase.co"
$PgUser = "postgres"
$PgPass = "Welcome08~billcn"
$PgDb = "postgres"

# Function to write log
function Write-Log {
    param($Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

Write-Log "=== Webb Database Migration Started ==="
Write-Log "Log file: $LogFile"

# Function to check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if running in WSL or Docker is available
    $wslExists = Get-Command wsl -ErrorAction SilentlyContinue
    $dockerExists = Get-Command docker -ErrorAction SilentlyContinue
    
    if (-not $wslExists -and -not $dockerExists) {
        Write-Log "ERROR: Neither WSL nor Docker found"
        Write-Log "Please install one of the following:"
        Write-Log "  1. WSL2 with Ubuntu: wsl --install Ubuntu"
        Write-Log "  2. Docker Desktop for Windows"
        return $false
    }
    
    if ($wslExists) {
        Write-Log "✓ WSL detected - will use WSL for pgloader"
        $global:UseWSL = $true
    } elseif ($dockerExists) {
        Write-Log "✓ Docker detected - will use Docker for pgloader"
        $global:UseDocker = $true
    }
    
    Write-Log "Prerequisites check completed"
    return $true
}

# Function to test MySQL connection
function Test-MySQLConnection {
    Write-Log "Testing MySQL connection..."
    
    try {
        if ($global:UseWSL) {
            $result = wsl mysql -h $MysqlHost -u $MysqlUser -p$MysqlPass -e "SHOW DATABASES;" 2>&1
        } else {
            # Try Windows mysql if available
            $result = mysql -h $MysqlHost -u $MysqlUser -p$MysqlPass -e "SHOW DATABASES;" 2>&1
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ MySQL connection successful"
            return $true
        } else {
            Write-Log "✗ MySQL connection failed: $result"
            return $false
        }
    } catch {
        Write-Log "✗ MySQL connection failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to test PostgreSQL connection
function Test-PostgreSQLConnection {
    Write-Log "Testing PostgreSQL connection..."
    
    $connectionString = "postgresql://$PgUser:$PgPass@$PgHost:5432/$PgDb"
    
    try {
        if ($global:UseWSL) {
            $result = wsl psql "$connectionString" -c "SELECT version();" 2>&1
        } else {
            # Try using Docker psql if available
            $result = docker run --rm postgres:latest psql "$connectionString" -c "SELECT version();" 2>&1
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ PostgreSQL connection successful"
            return $true
        } else {
            Write-Log "✗ PostgreSQL connection failed: $result"
            return $false
        }
    } catch {
        Write-Log "✗ PostgreSQL connection failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to run pgloader
function Invoke-PgLoader {
    param($ConfigFile)
    
    Write-Log "Running pgloader with config: $ConfigFile"
    
    if (-not (Test-Path $ConfigFile)) {
        Write-Log "ERROR: Configuration file $ConfigFile not found"
        return $false
    }
    
    try {
        if ($global:UseWSL) {
            # Copy config to WSL and run pgloader
            wsl cp $ConfigFile /tmp/
            $wslConfigFile = "/tmp/$((Get-Item $ConfigFile).Name)"
            $result = wsl pgloader $wslConfigFile
        } elseif ($global:UseDocker) {
            # Use Docker to run pgloader
            $result = docker run --rm -v "${PWD}:/data" dimitri/pgloader pgloader "/data/$ConfigFile"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ pgloader completed successfully"
            return $true
        } else {
            Write-Log "✗ pgloader failed with exit code: $LASTEXITCODE"
            Write-Log "Output: $result"
            return $false
        }
    } catch {
        Write-Log "✗ pgloader execution failed: $($_.Exception.Message)"
        return $false
    }
}

# Function to migrate Enigma database
function Start-EnigmaMigration {
    Write-Log "=== Migrating Enigma Database (1.8GB) ==="
    
    $configFile = "webb-pgloader-migration.load"
    if (-not (Test-Path $configFile)) {
        Write-Log "ERROR: $configFile not found"
        return $false
    }
    
    Write-Log "Starting Enigma migration at $(Get-Date)..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would run pgloader with $configFile"
        return $true
    }
    
    return Invoke-PgLoader $configFile
}

# Function to migrate CCASS database
function Start-CCASMigration {
    Write-Log "=== Migrating CCASS Database (1.4GB) ==="
    
    $configFile = "webb-ccass-migration.load"
    if (-not (Test-Path $configFile)) {
        Write-Log "ERROR: $configFile not found"
        return $false
    }
    
    Write-Log "Starting CCASS migration at $(Get-Date)..."
    
    if ($DryRun) {
        Write-Log "DRY RUN: Would run pgloader with $configFile"
        return $true
    }
    
    return Invoke-PgLoader $configFile
}

# Function to verify migration
function Test-MigrationResults {
    Write-Log "=== Verifying Migration Results ==="
    
    $connectionString = "postgresql://$PgUser:$PgPass@$PgHost:5432/$PgDb"
    
    try {
        if ($global:UseWSL) {
            $enigmaOrgs = wsl psql "$connectionString" -t -c "SELECT COUNT(*) FROM enigma.organisations;" 2>$null
            $enigmaPeople = wsl psql "$connectionString" -t -c "SELECT COUNT(*) FROM enigma.people;" 2>$null
            $ccassHoldings = wsl psql "$connectionString" -t -c "SELECT COUNT(*) FROM ccass.holdings;" 2>$null
            $ccassParticipants = wsl psql "$connectionString" -t -c "SELECT COUNT(*) FROM ccass.participants;" 2>$null
        } else {
            Write-Log "SKIP: Verification requires psql (install WSL or use Docker)"
            return
        }
        
        Write-Log "Migration Results Summary:"
        Write-Log "  Enigma organisations: $($enigmaOrgs.Trim())"
        Write-Log "  Enigma people: $($enigmaPeople.Trim())"
        Write-Log "  CCASS holdings: $($ccassHoldings.Trim())"
        Write-Log "  CCASS participants: $($ccassParticipants.Trim())"
        
    } catch {
        Write-Log "WARNING: Could not verify results - $($_.Exception.Message)"
    }
}

# Main execution
function Main {
    if (-not (Test-Prerequisites)) {
        exit 1
    }
    
    if (-not (Test-MySQLConnection)) {
        Write-Log "Please verify MySQL server is running and credentials are correct"
        exit 1
    }
    
    if (-not (Test-PostgreSQLConnection)) {
        Write-Log "Please verify Supabase credentials and network connectivity"
        exit 1
    }
    
    # Ask for confirmation
    if (-not $DryRun) {
        $response = Read-Host "Ready to migrate Webb databases to Supabase. Continue? (y/N)"
        if ($response -notmatch '^[Yy]$') {
            Write-Log "Migration cancelled by user"
            exit 0
        }
    }
    
    # Run migrations
    if (-not (Start-EnigmaMigration)) {
        Write-Log "Enigma migration failed - stopping"
        exit 1
    }
    
    if (-not $DryRun) {
        Write-Log "Waiting 30 seconds before CCASS migration..."
        Start-Sleep -Seconds 30
    }
    
    if (-not (Start-CCASMigration)) {
        Write-Log "CCASS migration failed"
        exit 1
    }
    
    # Verify results
    Test-MigrationResults
    
    # Summary
    Write-Log "Migration process completed at $(Get-Date)"
    Write-Log "Log file saved as: $LogFile"
    Write-Log "Next steps:"
    Write-Log "  1. Review migration log for any errors"
    Write-Log "  2. Test React app Webb components"
    Write-Log "  3. Verify data integrity in Supabase dashboard"
    Write-Log "=== Migration Complete ==="
}

# Run main function
Main 