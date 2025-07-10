#!/bin/bash

# Webb Database Migration Script using pgloader
# Migrates David Webb's MySQL databases to Supabase PostgreSQL

set -e  # Exit on any error

# Configuration
LOG_FILE="webb-migration-$(date +%Y%m%d_%H%M%S).log"
MYSQL_HOST="localhost"
MYSQL_USER="David"
MYSQL_PASS="Welcome08~billcn"
PG_HOST="db.kiztaihzanqnrcrqaxsv.supabase.co"
PG_USER="postgres"
PG_PASS="Welcome08~billcn"
PG_DB="postgres"

echo "=== Webb Database Migration Started ===" | tee -a $LOG_FILE
echo "Timestamp: $(date)" | tee -a $LOG_FILE
echo "Log file: $LOG_FILE" | tee -a $LOG_FILE

# Function to check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..." | tee -a $LOG_FILE
    
    # Check if pgloader is installed
    if ! command -v pgloader &> /dev/null; then
        echo "ERROR: pgloader is not installed" | tee -a $LOG_FILE
        echo "Please install pgloader first:" | tee -a $LOG_FILE
        echo "  Ubuntu/Debian: sudo apt-get install pgloader" | tee -a $LOG_FILE
        echo "  macOS: brew install pgloader" | tee -a $LOG_FILE
        echo "  Docker: docker pull dimitri/pgloader" | tee -a $LOG_FILE
        exit 1
    fi
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        echo "WARNING: psql not found. Install postgresql-client for verification" | tee -a $LOG_FILE
    fi
    
    echo "Prerequisites check completed" | tee -a $LOG_FILE
}

# Function to test MySQL connection
test_mysql_connection() {
    echo "Testing MySQL connection..." | tee -a $LOG_FILE
    
    if mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS -e "SHOW DATABASES;" &>/dev/null; then
        echo "✓ MySQL connection successful" | tee -a $LOG_FILE
    else
        echo "✗ MySQL connection failed" | tee -a $LOG_FILE
        echo "Please verify MySQL credentials and server status" | tee -a $LOG_FILE
        exit 1
    fi
}

# Function to test PostgreSQL connection
test_postgresql_connection() {
    echo "Testing PostgreSQL connection..." | tee -a $LOG_FILE
    
    if psql "postgresql://$PG_USER:$PG_PASS@$PG_HOST:5432/$PG_DB" -c "SELECT version();" &>/dev/null; then
        echo "✓ PostgreSQL connection successful" | tee -a $LOG_FILE
    else
        echo "✗ PostgreSQL connection failed" | tee -a $LOG_FILE
        echo "Please verify Supabase credentials and network connectivity" | tee -a $LOG_FILE
        exit 1
    fi
}

# Function to migrate Enigma database
migrate_enigma() {
    echo "=== Migrating Enigma Database (1.8GB) ===" | tee -a $LOG_FILE
    
    if [ ! -f "webb-pgloader-migration.load" ]; then
        echo "ERROR: webb-pgloader-migration.load not found" | tee -a $LOG_FILE
        exit 1
    fi
    
    echo "Starting Enigma migration at $(date)..." | tee -a $LOG_FILE
    
    if pgloader webb-pgloader-migration.load 2>&1 | tee -a $LOG_FILE; then
        echo "✓ Enigma migration completed successfully" | tee -a $LOG_FILE
    else
        echo "✗ Enigma migration failed" | tee -a $LOG_FILE
        return 1
    fi
}

# Function to migrate CCASS database
migrate_ccass() {
    echo "=== Migrating CCASS Database (1.4GB) ===" | tee -a $LOG_FILE
    
    if [ ! -f "webb-ccass-migration.load" ]; then
        echo "ERROR: webb-ccass-migration.load not found" | tee -a $LOG_FILE
        exit 1
    fi
    
    echo "Starting CCASS migration at $(date)..." | tee -a $LOG_FILE
    
    if pgloader webb-ccass-migration.load 2>&1 | tee -a $LOG_FILE; then
        echo "✓ CCASS migration completed successfully" | tee -a $LOG_FILE
    else
        echo "✗ CCASS migration failed" | tee -a $LOG_FILE
        return 1
    fi
}

# Function to verify migration
verify_migration() {
    echo "=== Verifying Migration Results ===" | tee -a $LOG_FILE
    
    if ! command -v psql &> /dev/null; then
        echo "SKIP: psql not available for verification" | tee -a $LOG_FILE
        return 0
    fi
    
    echo "Checking Enigma schema..." | tee -a $LOG_FILE
    ENIGMA_ORGS=$(psql "postgresql://$PG_USER:$PG_PASS@$PG_HOST:5432/$PG_DB" -t -c "SELECT COUNT(*) FROM enigma.organisations;" 2>/dev/null || echo "0")
    ENIGMA_PEOPLE=$(psql "postgresql://$PG_USER:$PG_PASS@$PG_HOST:5432/$PG_DB" -t -c "SELECT COUNT(*) FROM enigma.people;" 2>/dev/null || echo "0")
    
    echo "Checking CCASS schema..." | tee -a $LOG_FILE
    CCASS_HOLDINGS=$(psql "postgresql://$PG_USER:$PG_PASS@$PG_HOST:5432/$PG_DB" -t -c "SELECT COUNT(*) FROM ccass.holdings;" 2>/dev/null || echo "0")
    CCASS_PARTICIPANTS=$(psql "postgresql://$PG_USER:$PG_PASS@$PG_HOST:5432/$PG_DB" -t -c "SELECT COUNT(*) FROM ccass.participants;" 2>/dev/null || echo "0")
    
    echo "Migration Results Summary:" | tee -a $LOG_FILE
    echo "  Enigma organisations: $ENIGMA_ORGS" | tee -a $LOG_FILE
    echo "  Enigma people: $ENIGMA_PEOPLE" | tee -a $LOG_FILE
    echo "  CCASS holdings: $CCASS_HOLDINGS" | tee -a $LOG_FILE
    echo "  CCASS participants: $CCASS_PARTICIPANTS" | tee -a $LOG_FILE
}

# Function to cleanup
cleanup() {
    echo "Migration process completed at $(date)" | tee -a $LOG_FILE
    echo "Log file saved as: $LOG_FILE" | tee -a $LOG_FILE
    echo "Next steps:" | tee -a $LOG_FILE
    echo "  1. Review migration log for any errors" | tee -a $LOG_FILE
    echo "  2. Test React app Webb components" | tee -a $LOG_FILE
    echo "  3. Verify data integrity in Supabase dashboard" | tee -a $LOG_FILE
}

# Main execution
main() {
    check_prerequisites
    test_mysql_connection
    test_postgresql_connection
    
    # Ask for confirmation
    echo -n "Ready to migrate Webb databases to Supabase. Continue? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Migration cancelled by user" | tee -a $LOG_FILE
        exit 0
    fi
    
    # Run migrations
    migrate_enigma
    echo "Waiting 30 seconds before CCASS migration..." | tee -a $LOG_FILE
    sleep 30
    
    migrate_ccass
    
    # Verify results
    verify_migration
    
    # Cleanup and summary
    cleanup
    
    echo "=== Migration Complete ===" | tee -a $LOG_FILE
}

# Run main function
main "$@" 