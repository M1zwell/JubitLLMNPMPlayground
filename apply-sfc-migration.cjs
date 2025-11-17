/**
 * Apply SFC numeric fields migration directly using pg client
 */

const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.kiztaihzanqnrcrqaxsv:Sk-04L-7rxOoIxRmkQ-H2MolHWOtqvQE@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function applyMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    const sql = fs.readFileSync('supabase/migrations/20251117000004_fix_sfc_numeric_fields.sql', 'utf8');

    console.log('📝 Applying SFC numeric fields migration...\n');
    console.log('SQL Preview:');
    console.log(sql.substring(0, 200) + '...\n');

    // Execute the entire migration
    await client.query(sql);

    console.log('✅ Migration applied successfully!\n');
    console.log('✨ SFC statistics tables are now ready for data import.\n');

  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
