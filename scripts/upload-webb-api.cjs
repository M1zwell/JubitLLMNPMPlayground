const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.5D9mVu_ssolTEW1ffotXoBFY65DuMvE7ERUHedj0t2E';

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
    .replace(/\bUNIX_TIMESTAMP\(\)/gi, 'EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)');

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

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';

    // Handle strings
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
      stringChar = '';
    } else if (!inString && char === ';') {
      const statement = current.trim();
      if (statement && statement.length > 20) { // Ignore very short statements
        statements.push(statement);
      }
      current = '';
      continue;
    }

    current += char;
  }

  // Add the last statement if it doesn't end with semicolon
  const lastStatement = current.trim();
  if (lastStatement && lastStatement.length > 20) {
    statements.push(lastStatement);
  }

  return statements.filter(stmt => stmt.length > 0);
}

async function executeSQL(query) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/execute-sql-batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql_query: query
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status
      };
    }

    const result = await response.json();
    return { success: result.success || true, data: result };

  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function testConnection() {
  console.log('🔍 Testing edge function connection...');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/execute-sql-batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql_query: 'SELECT 1 as test'
      })
    });

    if (response.ok) {
      console.log('✅ Edge function connection successful');
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error('❌ Edge function test failed:', response.status, errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('❌ Edge function connection failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function processFile(file) {
  console.log(`\n🔄 Processing ${file.name}...`);
  
  if (!fs.existsSync(file.path)) {
    console.error(`❌ File not found: ${file.path}`);
    return { success: false, error: 'File not found' };
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
    console.log(`🔨 Creating schema '${file.schema}' if not exists...`);
    const schemaResult = await executeSQL(`CREATE SCHEMA IF NOT EXISTS ${file.schema};`);
    if (!schemaResult.success) {
      console.warn(`⚠️  Schema creation warning: ${schemaResult.error}`);
    }

    console.log(`\n⏳ Processing ${statements.length} statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const pgStatement = convertMySQLToPostgreSQL(statement, file.schema);
      
      if (pgStatement && pgStatement.trim().length > 0) {
        process.stdout.write(`\r⚡ Statement ${i + 1}/${statements.length} (${((i + 1) / statements.length * 100).toFixed(1)}%)`);
        
        const result = await executeSQL(pgStatement);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          // Only log first few errors to avoid spam
          if (errors.length < 5) {
            errors.push({
              index: i + 1,
              statement: statement.substring(0, 100) + '...',
              error: result.error,
              status: result.status
            });
          }
        }
      }

      // Small delay every 20 statements to prevent overwhelming the API
      if (i % 20 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n\n✅ ${file.name} processing completed:`);
    console.log(`   ✓ Successful statements: ${successCount}`);
    console.log(`   ❌ Failed statements: ${errorCount}`);
    console.log(`   📊 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Error details (first ${errors.length}):`);
      errors.forEach(err => {
        console.log(`   [${err.index}] ${err.error}`);
      });
    }

    return {
      success: errorCount < successCount, // Consider successful if more succeed than fail
      successCount,
      errorCount,
      errors: errors
    };

  } catch (error) {
    console.error(`❌ Error processing ${file.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Webb SQL API Uploader Starting...');
  console.log('🔗 Target: Supabase REST API');
  console.log('🌐 URL:', SUPABASE_URL);
  
  const startTime = new Date();
  const results = [];

  // Test edge function connection
  const testResult = await testConnection();
  if (!testResult.success) {
    console.error('❌ Edge function connection failed. Exiting...');
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
  console.log('   1. Check Supabase dashboard for new schemas and tables');
  console.log('   2. Verify table structures in Table Editor');
  console.log('   3. Upload data files using the Webb interface');
  console.log('   4. Test queries and performance');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Webb SQL API Uploader

Usage: node scripts/upload-webb-api.cjs [options]

Options:
  --help, -h         Show this help message
  --schema NAME      Process only specific schema (ccass or enigma)

Examples:
  node scripts/upload-webb-api.cjs
  node scripts/upload-webb-api.cjs --schema ccass
  `);
  process.exit(0);
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