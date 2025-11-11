import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.aXgFqY7MvYcBJ4oa0jmR6hX_fBx0pV0rnWt5iXcPX9c';

async function applySchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('📝 Reading SQL file...');
  const sql = readFileSync('add_hksfc_columns.sql', 'utf8');

  console.log('🚀 Executing SQL...\n');
  console.log(sql);
  console.log('\n');

  try {
    // Execute SQL using RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      console.error('Details:', error);
      return false;
    }

    console.log('✅ SQL executed successfully!');
    console.log('Result:', data);
    return true;
  } catch (error) {
    console.error('❌ Exception:', error.message);
    return false;
  }
}

applySchema()
  .then(success => {
    if (success) {
      console.log('\n✅ Schema updated successfully!');
      console.log('You can now run test-hksfc-news.js to verify database saving.');
      process.exit(0);
    } else {
      console.log('\n❌ Schema update failed. Please run the SQL manually in Supabase dashboard.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
