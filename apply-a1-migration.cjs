const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.p-86cvKSdL3dxAM1vP-dXAsxqN-jB4bVUZtFLzj0eIo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Reading migration file...');

  const sqlContent = fs.readFileSync('./supabase/migrations/20251118_create_a1_normalized.sql', 'utf8');

  // Split into individual statements (simple split on semicolon + newline)
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== '');

  console.log(`Found ${statements.length} SQL statements\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');

    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        console.error(`  ✗ Error:`, error.message);
        // Continue with other statements
      } else {
        console.log(`  ✓ Success`);
      }
    } catch (err) {
      console.error(`  ✗ Exception:`, err.message);
    }
  }

  console.log('\n=== Migration Complete ===');
}

applyMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
