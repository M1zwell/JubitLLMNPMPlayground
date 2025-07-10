import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface SQLProcessRequest {
  action: 'execute_sql_batch' | 'migrate_schema' | 'process_file';
  statements?: string[];
  schema?: 'ccass' | 'enigma';
  database_password?: string;
  file_content?: string;
  file_type?: 'structure' | 'data' | 'triggers';
  batch_size?: number;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: SQLProcessRequest = await req.json()
    
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (body.action === 'execute_sql_batch') {
      return await executeSQLBatch(supabaseClient, body, corsHeaders)
    } else if (body.action === 'migrate_schema') {
      return await migrateSchema(supabaseClient, body, corsHeaders)
    } else if (body.action === 'process_file') {
      return await processFile(supabaseClient, body, corsHeaders)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function executeSQLBatch(supabaseClient: any, body: SQLProcessRequest, corsHeaders: any) {
  const { statements = [], schema } = body
  
  if (!statements.length) {
    return new Response(
      JSON.stringify({ error: 'No statements provided' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }

  const results = []
  const errors = []

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    
    try {
      // Convert MySQL syntax to PostgreSQL
      const pgStatement = convertMySQLToPostgreSQL(statement, schema)
      
      if (pgStatement.trim()) {
        const { data, error } = await supabaseClient.rpc('execute_sql', {
          sql_query: pgStatement
        })

        if (error) {
          console.error(`Statement ${i} error:`, error)
          errors.push({
            index: i,
            statement: statement.substring(0, 200) + '...',
            error: error.message
          })
        } else {
          results.push({
            index: i,
            affected_rows: data?.length || 0
          })
        }
      }
    } catch (err) {
      console.error(`Statement ${i} conversion error:`, err)
      errors.push({
        index: i,
        statement: statement.substring(0, 200) + '...',
        error: err.message
      })
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      processed: statements.length,
      successful: results.length,
      errors: errors.length,
      results,
      errors
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function migrateSchema(supabaseClient: any, body: SQLProcessRequest, corsHeaders: any) {
  const { schema } = body
  
  try {
    // Create schema tables based on the Webb database structure
    const schemaSQL = getSchemaCreationSQL(schema || 'ccass')
    
    const { data, error } = await supabaseClient.rpc('execute_sql', {
      sql_query: schemaSQL
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${schema} schema created successfully`,
        tables_created: data?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

async function processFile(supabaseClient: any, body: SQLProcessRequest, corsHeaders: any) {
  const { file_content = '', file_type, schema, batch_size = 1000 } = body
  
  if (!file_content) {
    return new Response(
      JSON.stringify({ error: 'No file content provided' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }

  try {
    // Parse SQL file content
    const statements = parseSQLFile(file_content)
    
    // Process in batches
    const batchResults = []
    
    for (let i = 0; i < statements.length; i += batch_size) {
      const batch = statements.slice(i, i + batch_size)
      
      const batchResult = await executeSQLBatch(supabaseClient, {
        action: 'execute_sql_batch',
        statements: batch,
        schema
      }, corsHeaders)
      
      const batchData = await batchResult.json()
      batchResults.push({
        batch_number: Math.floor(i / batch_size) + 1,
        start_index: i,
        end_index: Math.min(i + batch_size - 1, statements.length - 1),
        result: batchData
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        file_type,
        schema,
        total_statements: statements.length,
        total_batches: batchResults.length,
        batch_results: batchResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

function convertMySQLToPostgreSQL(statement: string, schema?: string): string {
  let pgStatement = statement

  // Skip MySQL-specific commands
  if (pgStatement.match(/^(SET|USE|LOCK|UNLOCK|START TRANSACTION|COMMIT|ROLLBACK)/i)) {
    return ''
  }

  // Skip MySQL comments and directives
  if (pgStatement.match(/^(\/\*!|--|\#)/)) {
    return ''
  }

  // Convert basic data types
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
    .replace(/\bDOUBLE UNSIGNED\b/gi, 'DOUBLE PRECISION')

  // Convert BIT to BOOLEAN
  pgStatement = pgStatement.replace(/\bBIT\(1\)\b/gi, 'BOOLEAN')
  
  // Convert AUTO_INCREMENT to SERIAL
  pgStatement = pgStatement.replace(/\bAUTO_INCREMENT\b/gi, 'SERIAL')
  
  // Remove MySQL engine specifications
  pgStatement = pgStatement.replace(/\bENGINE\s*=\s*\w+/gi, '')
  pgStatement = pgStatement.replace(/\bDEFAULT CHARSET\s*=\s*\w+/gi, '')
  pgStatement = pgStatement.replace(/\bCOLLATE\s*=\s*\w+/gi, '')
  
  // Convert MySQL quotes to PostgreSQL
  pgStatement = pgStatement.replace(/`([^`]+)`/g, '"$1"')
  
  // Remove MySQL-specific options
  pgStatement = pgStatement.replace(/\bUSING BTREE\b/gi, '')
  pgStatement = pgStatement.replace(/\bUSING HASH\b/gi, '')
  
  // Convert MySQL functions to PostgreSQL equivalents
  pgStatement = pgStatement
    .replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE')
    .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP')
    .replace(/\bCONCAT\(/gi, 'CONCAT(')

  // Handle schema prefixes
  if (schema) {
    pgStatement = pgStatement.replace(/\b(ccass|enigma)\./gi, `${schema}.`)
  }

  return pgStatement.trim()
}

function parseSQLFile(content: string): string[] {
  // Split by semicolons but be careful about semicolons in strings
  const statements = []
  let current = ''
  let inString = false
  let stringChar = ''

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const prevChar = i > 0 ? content[i - 1] : ''

    if (!inString && (char === '"' || char === "'")) {
      inString = true
      stringChar = char
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false
      stringChar = ''
    } else if (!inString && char === ';') {
      const statement = current.trim()
      if (statement && !statement.startsWith('--') && !statement.startsWith('/*')) {
        statements.push(statement)
      }
      current = ''
      continue
    }

    current += char
  }

  // Add the last statement if it doesn't end with semicolon
  const lastStatement = current.trim()
  if (lastStatement && !lastStatement.startsWith('--') && !lastStatement.startsWith('/*')) {
    statements.push(lastStatement)
  }

  return statements.filter(stmt => stmt.length > 0)
}

function getSchemaCreationSQL(schema: string): string {
  if (schema === 'ccass') {
    return `
      -- Create CCASS schema tables
      CREATE SCHEMA IF NOT EXISTS ccass;
      
      CREATE TABLE IF NOT EXISTS ccass.holdings (
        part_id SMALLINT NOT NULL,
        issue_id INTEGER NOT NULL,
        holding BIGINT NOT NULL,
        at_date DATE NOT NULL,
        PRIMARY KEY (issue_id, part_id, at_date)
      );
      
      CREATE TABLE IF NOT EXISTS ccass.participants (
        part_id SMALLINT NOT NULL PRIMARY KEY,
        ccass_id VARCHAR(6),
        part_name VARCHAR(255) NOT NULL,
        at_date DATE NOT NULL,
        added_date DATE,
        person_id INTEGER,
        had_holdings BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS ccass.quotes (
        issue_id INTEGER NOT NULL,
        at_date DATE NOT NULL,
        prev_close REAL DEFAULT 0,
        closing REAL DEFAULT 0,
        ask REAL DEFAULT 0,
        bid REAL DEFAULT 0,
        high REAL DEFAULT 0,
        low REAL DEFAULT 0,
        vol BIGINT DEFAULT 0,
        turn BIGINT DEFAULT 0,
        susp BOOLEAN DEFAULT FALSE,
        newsusp BOOLEAN DEFAULT FALSE,
        noclose BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (issue_id, at_date)
      );
    `
  } else if (schema === 'enigma') {
    return `
      -- Create Enigma schema tables
      CREATE SCHEMA IF NOT EXISTS enigma;
      
      CREATE TABLE IF NOT EXISTS enigma.organisations (
        person_id INTEGER NOT NULL PRIMARY KEY,
        name1 VARCHAR(255) NOT NULL,
        chinese_name VARCHAR(255),
        org_type_id SMALLINT,
        created_date DATE,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS enigma.people (
        person_id INTEGER NOT NULL PRIMARY KEY,
        name1 VARCHAR(255) NOT NULL,
        name2 VARCHAR(255),
        chinese_name VARCHAR(255),
        year_of_birth SMALLINT,
        sex CHAR(1),
        created_date DATE,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS enigma.directorships (
        directorship_id INTEGER NOT NULL PRIMARY KEY,
        director INTEGER NOT NULL,
        company INTEGER NOT NULL,
        position_id SMALLINT,
        appt_date DATE,
        res_date DATE,
        appt_accuracy SMALLINT DEFAULT 3,
        res_accuracy SMALLINT DEFAULT 3
      );
    `
  }
  
  return ''
} 