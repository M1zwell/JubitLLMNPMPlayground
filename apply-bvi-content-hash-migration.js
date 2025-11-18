import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigration() {
  console.log('🔧 Applying BVI content_hash Migration\n');
  console.log('='.repeat(60));

  try {
    // Read the migration SQL
    const migrationSQL = readFileSync(
      'C:\\Users\\user\\JubitLLMNPMPlayground\\supabase\\migrations\\20251113_add_bvi_content_hash.sql',
      'utf-8'
    );

    console.log('\n📄 Migration SQL:');
    console.log(migrationSQL.substring(0, 200) + '...\n');

    // Apply migration - We need to run this using the psql client or RPC
    // Since we can't run raw SQL directly, let's break it down into steps

    console.log('📋 Step 1: Check if content_hash column exists...');
    const { data: columns, error: colError } = await supabase
      .from('bvi_entities')
      .select('*')
      .limit(1);

    if (colError) {
      console.error('❌ Error checking table:', colError.message);
      return;
    }

    console.log('✅ Table accessible');

    // Unfortunately, we can't add columns via the Supabase JS client
    // We need to use a Supabase Edge Function or direct database access
    console.log('\n⚠️  Direct column addition requires database admin access');
    console.log('💡 Using alternative approach: Direct SQL via curl to Supabase REST API...\n');

    // Alternative: Use SQL via Supabase's PostgREST
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        query: `
          -- Add content_hash column if it doesn't exist
          ALTER TABLE bvi_entities
          ADD COLUMN IF NOT EXISTS content_hash TEXT;

          -- Update existing records to generate content_hash
          UPDATE bvi_entities
          SET content_hash = encode(
            digest(
              entity_name || '||' || COALESCE(license_number, 'NONE') || '||' || entity_type,
              'sha256'
            ),
            'hex'
          )
          WHERE content_hash IS NULL;
        `
      })
    });

    if (response.ok) {
      console.log('✅ Migration applied successfully!');
    } else {
      const errorText = await response.text();
      console.error('❌ Migration failed:', errorText);
      console.log('\n📝 Manual migration required. Please run this SQL in Supabase SQL Editor:');
      console.log('\n' + migrationSQL);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please apply the migration manually via Supabase SQL Editor');
    console.log('📍 Location: supabase/migrations/20251113_add_bvi_content_hash.sql');
  }
}

applyMigration();
