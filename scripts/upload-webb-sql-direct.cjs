const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Supabase PostgreSQL connection configuration
// Using the direct connection URL for Supabase
const DATABASE_URL = 'postgresql://postgres:Welcome08~billcn@db.kiztaihzanqnrcrqaxsv.supabase.co:5432/postgres?sslmode=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// File paths for Webb SQL files
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

  // Skip MySQL-specific commands and comments
  if (pgStatement.match(/^(SET|USE|LOCK|UNLOCK|START TRANSACTION|COMMIT|ROLLBACK|\/\*!|--|#)/i)) {
    return '';
  }

  // Skip empty statements
  if (!pgStatement.trim()) {
    return '';
  }

  // Convert data types
  pgStatement = pgStatement
    .replace(/\bTINYINT\s*\(\d+\)?\s*(UNSIGNED)?\b/gi, 'SMALLINT')
    .replace(/\bSMALLINT\s*\(\d+\)?\s*(UNSIGNED)?\b/gi, 'SMALLINT')
    .replace(/\bMEDIUMINT\s*\(\d+\)?\s*(UNSIGNED)?\b/gi, 'INTEGER')
    .replace(/\bINT\s*\(\d+\)?\s*(UNSIGNED)?\b/gi, 'INTEGER')
    .replace(/\bBIGINT\s*\(\d+\)?\s*(UNSIGNED)?\b/gi, 'BIGINT')
    .replace(/\bFLOAT\s*(\(\d+,\d+\))?\s*(UNSIGNED)?\b/gi, 'REAL')
    .replace(/\bDOUBLE\s*(\(\d+,\d+\))?\s*(UNSIGNED)?\b/gi, 'DOUBLE PRECISION')
    .replace(/\bDATETIME\b/gi, 'TIMESTAMP')
    .replace(/\bTEXT\b/gi, 'TEXT')
    .replace(/\bLONGTEXT\b/gi, 'TEXT')
    .replace(/\bMEDIUMTEXT\b/gi, 'TEXT')
    .replace(/\bTINYTEXT\b/gi, 'TEXT');

  // Convert VARCHAR lengths
  pgStatement = pgStatement.replace(/VARCHAR\((\d+)\)/gi, (match, length) => {
    const len = parseInt(length);
    return len > 255 ? 'TEXT' : `VARCHAR(${length})`;
  });

  // Convert BIT to BOOLEAN
  pgStatement = pgStatement.replace(/\bBIT\(1\)\b/gi, 'BOOLEAN');
  
  // Handle AUTO_INCREMENT
  pgStatement = pgStatement.replace(/\bAUTO_INCREMENT\b/gi, '');
  
  // Remove MySQL engine and charset specifications
  pgStatement = pgStatement
    .replace(/\bENGINE\s*=\s*\w+/gi, '')
    .replace(/\bDEFAULT CHARSET\s*=\s*[\w\d]+/gi, '')
    .replace(/\bCOLLATE\s*=\s*[\w\d_]+/gi, '')
    .replace(/\bCHARSET\s+[\w\d]+/gi, '');
  
  // Convert MySQL quotes to PostgreSQL (backticks to double quotes)
  pgStatement = pgStatement.replace(/`([^`]+)`/g, '"$1"');
  
  // Remove MySQL index hints
  pgStatement = pgStatement
    .replace(/\bUSING BTREE\b/gi, '')
    .replace(/\bUSING HASH\b/gi, '')
    .replace(/\bKEY_BLOCK_SIZE\s*=\s*\d+/gi, '');

  // Convert CREATE DATABASE to CREATE SCHEMA
  pgStatement = pgStatement.replace(/CREATE DATABASE[^;]+;/gi, '');
  
  // Convert MySQL functions to PostgreSQL equivalents
  pgStatement = pgStatement
    .replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE')
    .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/\bUNIX_TIMESTAMP\(\)/gi, 'EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)')
    .replace(/\bYEAR\(/gi, 'EXTRACT(YEAR FROM ')
    .replace(/\bMONTH\(/gi, 'EXTRACT(MONTH FROM ')
    .replace(/\bDAY\(/gi, 'EXTRACT(DAY FROM ');

  // Handle specific MySQL syntax issues
  pgStatement = pgStatement
    .replace(/\bIF NOT EXISTS\b/gi, 'IF NOT EXISTS')
    .replace(/\bON UPDATE CURRENT_TIMESTAMP\b/gi, '');

  // Fix table and schema references
  if (schema) {
    // Add schema prefix to table names in CREATE TABLE statements
    pgStatement = pgStatement.replace(
      /CREATE TABLE\s+(?!IF\s+NOT\s+EXISTS\s+)(?!"?\w+"?\.)("?\w+"?)/gi,
      `CREATE TABLE IF NOT EXISTS ${schema}.$1`
    );
    
    pgStatement = pgStatement.replace(
      /CREATE TABLE\s+IF\s+NOT\s+EXISTS\s+(?!"?\w+"?\.)("?\w+"?)/gi,
      `CREATE TABLE IF NOT EXISTS ${schema}.$1`
    );
  }

  // Clean up extra whitespace and commas
  pgStatement = pgStatement
    .replace(/,\s*\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim();

  return pgStatement;
}

function parseSQLFile(content) {
  // Remove MySQL-specific comments
  content = content
    .replace(/\/\*![^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
    .replace(/--[^\r\n]*/g, '')
    .replace(/#[^\r\n]*/g, '');

  // Split by semicolons but be careful about semicolons in strings
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = i < content.length - 1 ? content[i + 1] : '';
    const prevChar = i > 0 ? content[i - 1] : '';

    // Handle comments
    if (!inString && char === '/' && nextChar === '*') {
      inComment = true;
      i++; // Skip next character
      continue;
    }
    
    if (inComment && char === '*' && nextChar === '/') {
      inComment = false;
      i++; // Skip next character
      continue;
    }

    if (inComment) {
      continue;
    }

    // Handle strings
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
      stringChar = '';
    } else if (!inString && char === ';') {
      const statement = current.trim();
      if (statement && statement.length > 10) { // Ignore very short statements
        statements.push(statement);
      }
      current = '';
      continue;
    }

    current += char;
  }

  // Add the last statement if it doesn't end with semicolon
  const lastStatement = current.trim();
  if (lastStatement && lastStatement.length > 10) {
    statements.push(lastStatement);
  }

  return statements.filter(stmt => stmt.length > 0);
}

async function executeSQLStatement(client, statement, schema) {
  try {
    const result = await client.query(statement);
    return { 
      success: true, 
      rowCount: result.rowCount,
      command: result.command 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      detail: error.detail 
    };
  }
}

async function processFile(file) {
  console.log(`\n🔄 Processing ${file.name}...`);
  
  if (!fs.existsSync(file.path)) {
    console.error(`❌ File not found: ${file.path}`);
    return { success: false, error: 'File not found' };
  }

  const client = await pool.connect();
  
  try {
    const content = fs.readFileSync(file.path, 'utf8');
    console.log(`📖 File size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
    
    const statements = parseSQLFile(content);
    console.log(`📊 Found ${statements.length} SQL statements`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Create schema if it doesn't exist
    console.log(`🔨 Creating schema '${file.schema}' if not exists...`);
    const schemaResult = await executeSQLStatement(client, `CREATE SCHEMA IF NOT EXISTS ${file.schema};`, file.schema);
    if (!schemaResult.success) {
      console.error(`❌ Failed to create schema: ${schemaResult.error}`);
    }

    console.log(`\n⏳ Processing ${statements.length} statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const pgStatement = convertMySQLToPostgreSQL(statement, file.schema);
      
      if (pgStatement && pgStatement.trim().length > 0) {
        process.stdout.write(`\r⚡ Statement ${i + 1}/${statements.length} (${((i + 1) / statements.length * 100).toFixed(1)}%)`);
        
        const result = await executeSQLStatement(client, pgStatement, file.schema);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          // Only log first few errors to avoid spam
          if (errors.length < 10) {
            errors.push({
              index: i + 1,
              statement: statement.substring(0, 150) + '...',
              converted: pgStatement.substring(0, 150) + '...',
              error: result.error,
              code: result.code
            });
          }
        }
      }

      // Small delay every 50 statements to prevent overwhelming
      if (i % 50 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    console.log(`\n\n✅ ${file.name} processing completed:`);
    console.log(`   ✓ Successful statements: ${successCount}`);
    console.log(`   ❌ Failed statements: ${errorCount}`);
    console.log(`   📊 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Error details (showing first ${Math.min(errors.length, 5)}):`);
      errors.slice(0, 5).forEach(err => {
        console.log(`   [${err.index}] ${err.error}`);
        if (err.code) console.log(`       Code: ${err.code}`);
      });
      
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more errors`);
      }
    }

    return {
      success: errorCount === 0,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Return first 10 errors
    };

  } catch (error) {
    console.error(`❌ Error processing ${file.name}:`, error.message);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 Webb SQL Direct Uploader Starting...');
  console.log('🔗 Target: Supabase PostgreSQL');
  console.log('🏁 Host: aws-0-ap-southeast-1.pooler.supabase.com');
  console.log('📊 Database: postgres');
  
  const startTime = new Date();
  const results = [];

  // Test connection first
  console.log('\n🔍 Testing database connection...');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Database connected successfully');
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[1]}`);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Process each file
  for (const file of SQL_FILES) {
    const result = await processFile(file);
    results.push({ file: file.name, result });
  }

  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;

  console.log('\n🎉 Migration completed!');
  console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
  
  // Summary
  console.log('\n📋 Summary:');
  results.forEach(({ file, result }) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${file}: ${result.successCount || 0} success, ${result.errorCount || 0} errors`);
  });

  console.log('\n📋 Next steps:');
  console.log('   1. Check Supabase dashboard for new tables');
  console.log('   2. Verify table structures and constraints');
  console.log('   3. Upload data files if structures look good');
  console.log('   4. Test queries and indexes');

  await pool.end();
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Webb SQL Direct Uploader

Usage: node scripts/upload-webb-sql-direct.js [options]

Options:
  --help, -h         Show this help message
  --schema NAME      Process only specific schema (ccass or enigma)
  --dry-run          Parse files without executing SQL

Examples:
  node scripts/upload-webb-sql-direct.js
  node scripts/upload-webb-sql-direct.js --schema ccass
  node scripts/upload-webb-sql-direct.js --dry-run
  `);
  process.exit(0);
}

const schemaFilter = args.find(arg => arg.startsWith('--schema='))?.split('=')[1];
if (schemaFilter) {
  SQL_FILES = SQL_FILES.filter(file => file.schema === schemaFilter);
  console.log(`🎯 Processing only ${schemaFilter} schema`);
}

const isDryRun = args.includes('--dry-run');
if (isDryRun) {
  console.log('🔍 Dry run mode - files will be parsed but no SQL will be executed');
  // Override executeSQLStatement for dry run
  executeSQLStatement = async (client, statement, schema) => {
    console.log('DRY RUN:', statement.substring(0, 100) + '...');
    return { success: true, rowCount: 0, command: 'DRY_RUN' };
  };
}

// Run the migration
main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}); 