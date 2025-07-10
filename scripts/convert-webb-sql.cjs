const fs = require('fs');
const path = require('path');

// File paths for Webb SQL files
const SQL_FILES = [
  {
    name: 'CCASS Structure',
    input: 'supabase/webb/CCASS schema/ccassStructure-2025-07-05- 600.sql',
    output: 'supabase/webb/converted/ccass_structure_postgresql.sql',
    schema: 'ccass'
  },
  {
    name: 'Enigma Structure', 
    input: 'supabase/webb/Enigma schema/enigmaStructure-2025-07-05- 000.sql',
    output: 'supabase/webb/converted/enigma_structure_postgresql.sql',
    schema: 'enigma'
  },
  {
    name: 'Enigma Triggers',
    input: 'supabase/webb/Enigma schema/enigmaTriggers-2025-07-05- 000.sql',
    output: 'supabase/webb/converted/enigma_triggers_postgresql.sql',
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
  
  // Handle AUTO_INCREMENT - convert to SERIAL or GENERATED ALWAYS AS IDENTITY
  pgStatement = pgStatement.replace(/\b(\w+)\s+INT\s+AUTO_INCREMENT\b/gi, '$1 SERIAL');
  pgStatement = pgStatement.replace(/\b(\w+)\s+BIGINT\s+AUTO_INCREMENT\b/gi, '$1 BIGSERIAL');
  pgStatement = pgStatement.replace(/\bAUTO_INCREMENT\b/gi, '');
  
  // Remove MySQL engine and charset specifications
  pgStatement = pgStatement
    .replace(/\bENGINE\s*=\s*\w+/gi, '')
    .replace(/\bDEFAULT CHARSET\s*=\s*[\w\d]+/gi, '')
    .replace(/\bCOLLATE\s*=\s*[\w\d_]+/gi, '')
    .replace(/\bCHARSET\s+[\w\d]+/gi, '')
    .replace(/\bROW_FORMAT\s*=\s*\w+/gi, '');
  
  // Convert MySQL quotes to PostgreSQL (backticks to double quotes)
  pgStatement = pgStatement.replace(/`([^`]+)`/g, '"$1"');
  
  // Remove MySQL index hints and storage options
  pgStatement = pgStatement
    .replace(/\bUSING BTREE\b/gi, '')
    .replace(/\bUSING HASH\b/gi, '')
    .replace(/\bKEY_BLOCK_SIZE\s*=\s*\d+/gi, '')
    .replace(/\bCOMMENT\s*=\s*'[^']*'/gi, '');

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

    // Fix INDEX creation
    pgStatement = pgStatement.replace(
      /CREATE\s+(UNIQUE\s+)?INDEX\s+([^\s]+)\s+ON\s+(?!"?\w+"?\.)("?\w+"?)/gi,
      `CREATE $1INDEX $2 ON ${schema}.$3`
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

async function convertFile(file) {
  console.log(`\n🔄 Converting ${file.name}...`);
  
  if (!fs.existsSync(file.input)) {
    console.error(`❌ File not found: ${file.input}`);
    return { success: false, error: 'File not found' };
  }

  try {
    const content = fs.readFileSync(file.input, 'utf8');
    console.log(`📖 Input file size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
    
    const statements = parseSQLFile(content);
    console.log(`📊 Found ${statements.length} SQL statements`);

    let convertedStatements = [];
    let successCount = 0;
    let skippedCount = 0;

    // Add schema creation at the beginning
    convertedStatements.push(`-- Webb Database Schema: ${file.schema.toUpperCase()}`);
    convertedStatements.push(`-- Converted from MySQL to PostgreSQL`);
    convertedStatements.push(`-- Original file: ${file.input}`);
    convertedStatements.push(`-- Conversion date: ${new Date().toISOString()}`);
    convertedStatements.push('');
    convertedStatements.push(`CREATE SCHEMA IF NOT EXISTS ${file.schema};`);
    convertedStatements.push('');

    console.log(`⏳ Converting ${statements.length} statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const pgStatement = convertMySQLToPostgreSQL(statement, file.schema);
      
      if (pgStatement && pgStatement.trim().length > 0) {
        convertedStatements.push(pgStatement + ';');
        convertedStatements.push(''); // Add blank line for readability
        successCount++;
      } else {
        skippedCount++;
      }

      if (i % 100 === 0) {
        process.stdout.write(`\r⚡ Statement ${i + 1}/${statements.length} (${((i + 1) / statements.length * 100).toFixed(1)}%)`);
      }
    }

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(file.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write converted SQL
    const convertedContent = convertedStatements.join('\n');
    fs.writeFileSync(file.output, convertedContent, 'utf8');

    console.log(`\n\n✅ ${file.name} conversion completed:`);
    console.log(`   ✓ Converted statements: ${successCount}`);
    console.log(`   ⏭️  Skipped statements: ${skippedCount}`);
    console.log(`   📄 Output file: ${file.output}`);
    console.log(`   📏 Output size: ${(convertedContent.length / 1024 / 1024).toFixed(2)} MB`);

    return {
      success: true,
      successCount,
      skippedCount,
      outputFile: file.output,
      outputSize: convertedContent.length
    };

  } catch (error) {
    console.error(`❌ Error converting ${file.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Webb SQL MySQL to PostgreSQL Converter');
  console.log('🔄 Converting MySQL schemas to PostgreSQL format');
  
  const startTime = new Date();
  const results = [];

  // Process each file
  for (const file of SQL_FILES) {
    const result = await convertFile(file);
    results.push({ file: file.name, result });
  }

  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;

  console.log('\n🎉 Conversion completed!');
  console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
  
  // Summary
  console.log('\n📋 Summary:');
  results.forEach(({ file, result }) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${file}:`);
    if (result.success) {
      console.log(`      📊 ${result.successCount} statements converted, ${result.skippedCount} skipped`);
      console.log(`      📄 Output: ${result.outputFile}`);
    } else {
      console.log(`      ❌ Error: ${result.error}`);
    }
  });

  console.log('\n📋 Next steps:');
  console.log('   1. Review converted SQL files in supabase/webb/converted/');
  console.log('   2. Import files manually using Supabase SQL Editor:');
  results.forEach(({ result }) => {
    if (result.success) {
      console.log(`      - ${result.outputFile}`);
    }
  });
  console.log('   3. Verify table creation and constraints');
  console.log('   4. Import data files after structure is confirmed');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Webb SQL MySQL to PostgreSQL Converter

Usage: node scripts/convert-webb-sql.cjs [options]

Options:
  --help, -h         Show this help message
  --schema NAME      Convert only specific schema (ccass or enigma)

Examples:
  node scripts/convert-webb-sql.cjs
  node scripts/convert-webb-sql.cjs --schema ccass
  `);
  process.exit(0);
}

const schemaFilter = args.find(arg => arg.startsWith('--schema='))?.split('=')[1];
if (schemaFilter) {
  const filteredFiles = SQL_FILES.filter(file => file.schema === schemaFilter);
  if (filteredFiles.length === 0) {
    console.error(`❌ No files found for schema: ${schemaFilter}`);
    console.log('Available schemas: ccass, enigma');
    process.exit(1);
  }
  SQL_FILES.length = 0;
  SQL_FILES.push(...filteredFiles);
  console.log(`🎯 Converting only ${schemaFilter} schema`);
}

// Run the conversion
main().catch(error => {
  console.error('❌ Conversion failed:', error);
  process.exit(1);
}); 