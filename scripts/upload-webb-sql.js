const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.5D9mVu_ssolTEW1ffotXoBFY65DuMvE7ERUHedj0t2E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// File paths
const SQL_FILES = [
  {
    name: 'CCASS Structure',
    path: 'supabase/webb/CCASS schema/ccassStructure-2025-07-05- 600.sql',
    type: 'structure',
    schema: 'ccass'
  },
  {
    name: 'Enigma Structure', 
    path: 'supabase/webb/Enigma schema/enigmaStructure-2025-07-05- 000.sql',
    type: 'structure',
    schema: 'enigma'
  },
  {
    name: 'Enigma Triggers',
    path: 'supabase/webb/Enigma schema/enigmaTriggers-2025-07-05- 000.sql',
    type: 'triggers',
    schema: 'enigma'
  }
];

// MySQL to PostgreSQL conversion functions
function convertMySQLToPostgreSQL(statement, schema) {
  let pgStatement = statement;

  // Skip MySQL-specific commands
  if (pgStatement.match(/^(SET|USE|LOCK|UNLOCK|START TRANSACTION|COMMIT|ROLLBACK)/i)) {
    return '';
  }

  // Skip MySQL comments and directives
  if (pgStatement.match(/^(\/\*!|--|\#)/)) {
    return '';
  }

  // Convert data types
  pgStatement = pgStatement
    .replace(/\bTINYINT\b/gi, 'SMALLINT')
    .replace(/\bMEDIUMINT\b/gi, 'INTEGER')
    .replace(/\bBIGINT UNSIGNED\b/gi, 'BIGINT')
    .replace(/\bINT UNSIGNED\b/gi, 'INTEGER')
    .replace(/\bSMALLINT UNSIGNED\b/gi, 'SMALLINT')
    .replace(/\bTINYINT UNSIGNED\b/gi, 'SMALLINT')
    .replace(/\bDATETIME\b/gi, 'TIMESTAMP')
    .replace(/\bTEXT\b/gi, 'TEXT')
    .replace(/\bLONGTEXT\b/gi, 'TEXT')
    .replace(/\bMEDIUMTEXT\b/gi, 'TEXT')
    .replace(/\bFLOAT UNSIGNED\b/gi, 'REAL')
    .replace(/\bDOUBLE UNSIGNED\b/gi, 'DOUBLE PRECISION');

  // Convert BIT to BOOLEAN
  pgStatement = pgStatement.replace(/\bBIT\(1\)\b/gi, 'BOOLEAN');
  
  // Convert AUTO_INCREMENT to SERIAL
  pgStatement = pgStatement.replace(/\bAUTO_INCREMENT\b/gi, 'SERIAL');
  
  // Remove MySQL engine specifications
  pgStatement = pgStatement.replace(/\bENGINE\s*=\s*\w+/gi, '');
  pgStatement = pgStatement.replace(/\bDEFAULT CHARSET\s*=\s*\w+/gi, '');
  pgStatement = pgStatement.replace(/\bCOLLATE\s*=\s*\w+/gi, '');
  
  // Convert MySQL quotes to PostgreSQL
  pgStatement = pgStatement.replace(/`([^`]+)`/g, '"$1"');
  
  // Remove MySQL-specific options
  pgStatement = pgStatement.replace(/\bUSING BTREE\b/gi, '');
  pgStatement = pgStatement.replace(/\bUSING HASH\b/gi, '');

  // Convert CREATE DATABASE to CREATE SCHEMA
  pgStatement = pgStatement.replace(/CREATE DATABASE[^;]+;/gi, '');
  
  // Convert MySQL functions to PostgreSQL equivalents
  pgStatement = pgStatement
    .replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE')
    .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP');

  return pgStatement.trim();
}

function parseSQLFile(content) {
  // Split by semicolons but be careful about semicolons in strings
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';

    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
      stringChar = '';
    } else if (!inString && char === ';') {
      const statement = current.trim();
      if (statement && !statement.startsWith('--') && !statement.startsWith('/*')) {
        statements.push(statement);
      }
      current = '';
      continue;
    }

    current += char;
  }

  // Add the last statement if it doesn't end with semicolon
  const lastStatement = current.trim();
  if (lastStatement && !lastStatement.startsWith('--') && !lastStatement.startsWith('/*')) {
    statements.push(lastStatement);
  }

  return statements.filter(stmt => stmt.length > 0);
}

async function executeSQLStatement(statement) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: statement
    });

    if (error) {
      console.error('SQL Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Execution Error:', err);
    return { success: false, error: err.message };
  }
}

async function processFile(file) {
  console.log(`\n🔄 Processing ${file.name}...`);
  
  if (!fs.existsSync(file.path)) {
    console.error(`❌ File not found: ${file.path}`);
    return;
  }

  try {
    const content = fs.readFileSync(file.path, 'utf8');
    console.log(`📖 File size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
    
    const statements = parseSQLFile(content);
    console.log(`📊 Found ${statements.length} SQL statements`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Create schema if it doesn't exist
    const createSchemaSQL = `CREATE SCHEMA IF NOT EXISTS ${file.schema};`;
    await executeSQLStatement(createSchemaSQL);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const pgStatement = convertMySQLToPostgreSQL(statement, file.schema);
      
      if (pgStatement) {
        process.stdout.write(`\r⏳ Processing statement ${i + 1}/${statements.length} (${((i + 1) / statements.length * 100).toFixed(1)}%)`);
        
        const result = await executeSQLStatement(pgStatement);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push({
            index: i,
            statement: statement.substring(0, 100) + '...',
            error: result.error
          });
        }
      }

      // Add small delay to prevent overwhelming the database
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`\n✅ ${file.name} completed:`);
    console.log(`   ✓ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log('\n❌ Error details:');
      errors.forEach(err => {
        console.log(`   [${err.index}] ${err.error}`);
      });
    } else if (errors.length > 10) {
      console.log(`\n❌ ${errors.length} errors occurred (showing first 5):`);
      errors.slice(0, 5).forEach(err => {
        console.log(`   [${err.index}] ${err.error}`);
      });
    }

  } catch (error) {
    console.error(`❌ Error processing ${file.name}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Webb SQL Uploader Starting...');
  console.log('📊 Target: Supabase PostgreSQL');
  console.log('🔗 URL:', supabaseUrl);
  
  const startTime = new Date();

  for (const file of SQL_FILES) {
    await processFile(file);
  }

  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;

  console.log('\n🎉 Migration completed!');
  console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
  console.log('\n📋 Next steps:');
  console.log('   1. Verify table creation in Supabase dashboard');
  console.log('   2. Check for any constraint or index issues');
  console.log('   3. Process data files if needed (ccassData-2025-07-05-600.sql, enigmaData-2025-07-05-000.sql)');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Webb SQL Uploader

Usage: node scripts/upload-webb-sql.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Parse files without executing SQL
  --schema NAME  Process only specific schema (ccass or enigma)

Examples:
  node scripts/upload-webb-sql.js
  node scripts/upload-webb-sql.js --schema ccass
  node scripts/upload-webb-sql.js --dry-run
  `);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  console.log('🔍 Dry run mode - parsing files without execution');
  // Override executeSQLStatement for dry run
  executeSQLStatement = async (statement) => {
    console.log('DRY RUN:', statement.substring(0, 100) + '...');
    return { success: true, data: null };
  };
}

const schemaFilter = args.find(arg => arg.startsWith('--schema='))?.split('=')[1];
if (schemaFilter) {
  SQL_FILES = SQL_FILES.filter(file => file.schema === schemaFilter);
  console.log(`🎯 Processing only ${schemaFilter} schema`);
}

// Run the migration
main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}); 