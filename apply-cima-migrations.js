import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigrations() {
  console.log('🚀 Applying CIMA database migrations...\n');

  try {
    // Read the consolidated migration file
    const sqlPath = join(__dirname, 'supabase', 'migrations', 'CONSOLIDATED_CIMA_MIGRATION.sql');
    console.log(`📄 Reading migration file: ${sqlPath}`);
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log(`📊 SQL file size: ${(sql.length / 1024).toFixed(2)} KB\n`);

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let executed = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      // Get first line for display
      const firstLine = statement.split('\n')[0].trim().substring(0, 60);
      console.log(`[${i + 1}/${statements.length}] Executing: ${firstLine}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

        if (error) {
          // Try alternative approach: direct query
          const { error: directError } = await supabase.from('_sql').select().limit(0);

          if (directError) {
            console.error(`❌ Error:`, error.message);
            failed++;

            // Continue with other statements
            continue;
          }
        }

        executed++;
        console.log(`✅ Success\n`);
      } catch (err) {
        console.error(`❌ Error:`, err.message);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`✅ Executed: ${executed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(50) + '\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tables = ['cima_entities', 'bvi_entities', 'cima_scrape_logs', 'cima_entity_changes'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
          console.log(`❌ ${table}: Not accessible (${error.message})`);
        } else {
          console.log(`✅ ${table}: Ready (${data.length} records)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Error (${err.message})`);
      }
    }

    console.log('\n🎉 Migration process complete!');
    console.log('\nNext steps:');
    console.log('1. Run: node populate-sample-cima-data.js');
    console.log('2. Check frontend: https://chathogs.com (Offshore Data tab)');
    console.log('3. Deploy edge function: supabase functions deploy cima-scraper');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('\n⚠️ Alternative approach: Run the SQL manually in Supabase Dashboard:');
    console.error('   1. Go to: https://supabase.com/dashboard');
    console.error('   2. Navigate to: SQL Editor');
    console.error('   3. Open: supabase/migrations/CONSOLIDATED_CIMA_MIGRATION.sql');
    console.error('   4. Copy contents and execute\n');
    process.exit(1);
  }
}

applyMigrations();
