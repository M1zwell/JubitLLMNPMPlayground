import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sql_query } = await req.json()
    
    if (!sql_query) {
      return new Response(
        JSON.stringify({ error: 'No SQL query provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Execute the SQL query
    const { data, error } = await supabaseClient
      .from('dummy') // This is just a placeholder, we'll execute raw SQL
      .select('*')
      .limit(0)

    // For raw SQL execution, we need to use a different approach
    // Using the PostgreSQL connection directly
    try {
      const result = await executeRawSQL(sql_query)
      
      return new Response(
        JSON.stringify({
          success: true,
          data: result,
          query: sql_query.substring(0, 100) + (sql_query.length > 100 ? '...' : '')
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (sqlError) {
      console.error('SQL execution error:', sqlError)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: sqlError.message,
          query: sql_query.substring(0, 100) + (sql_query.length > 100 ? '...' : '')
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function executeRawSQL(query: string) {
  // Since we can't directly execute arbitrary SQL in Supabase edge functions,
  // we'll need to use the database connection URL
  const databaseUrl = Deno.env.get('DATABASE_URL')
  
  if (!databaseUrl) {
    throw new Error('Database URL not configured')
  }

  // Import the PostgreSQL client
  const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts')
  
  const client = new Client(databaseUrl)
  
  try {
    await client.connect()
    const result = await client.queryObject(query)
    await client.end()
    
    return result.rows
  } catch (error) {
    await client.end()
    throw error
  }
} 