import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.aXgFqY7MvYcBJ4oa0jmR6hX_fBx0pV0rnWt5iXcPX9c';

async function updateSchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🔧 Updating HKSFC filings schema...\n');

  const sqlStatements = [
    {
      name: 'Add summary column',
      sql: `ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS summary text;`
    },
    {
      name: 'Add pdf_url column',
      sql: `ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS pdf_url text;`
    },
    {
      name: 'Add tags column',
      sql: `ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS tags text[];`
    },
    {
      name: 'Drop existing search vector index',
      sql: `DROP INDEX IF EXISTS idx_hksfc_search_vector;`
    },
    {
      name: 'Drop search_vector column',
      sql: `ALTER TABLE hksfc_filings DROP COLUMN IF EXISTS search_vector CASCADE;`
    },
    {
      name: 'Add search_vector column',
      sql: `ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS search_vector tsvector;`
    },
    {
      name: 'Drop old trigger',
      sql: `DROP TRIGGER IF EXISTS hksfc_search_vector_update ON hksfc_filings;`
    },
    {
      name: 'Drop old function',
      sql: `DROP FUNCTION IF EXISTS update_hksfc_search_vector();`
    },
    {
      name: 'Create trigger function',
      sql: `
CREATE OR REPLACE FUNCTION update_hksfc_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.content, '') || ' ' ||
    coalesce(NEW.summary, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
      `
    },
    {
      name: 'Create trigger',
      sql: `
CREATE TRIGGER hksfc_search_vector_update
  BEFORE INSERT OR UPDATE ON hksfc_filings
  FOR EACH ROW
  EXECUTE FUNCTION update_hksfc_search_vector();
      `
    },
    {
      name: 'Recreate GIN index',
      sql: `CREATE INDEX IF NOT EXISTS idx_hksfc_search_vector ON hksfc_filings USING GIN(search_vector);`
    },
    {
      name: 'Add column comments',
      sql: `
COMMENT ON COLUMN hksfc_filings.summary IS 'Article excerpt or description';
COMMENT ON COLUMN hksfc_filings.pdf_url IS 'URL to PDF attachment if available';
COMMENT ON COLUMN hksfc_filings.tags IS 'Keywords/tags for categorization';
      `
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const { name, sql } of sqlStatements) {
    try {
      console.log(`⏳ ${name}...`);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`   ⚠️  ${name}: ${error}`);
        // Some failures are OK (like "already exists")
        if (error.includes('already exists') || error.includes('does not exist')) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        console.log(`   ✅ ${name}`);
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ ${name}: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`✅ Successfully executed: ${successCount}/${sqlStatements.length}`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount}`);
  }
  console.log('='.repeat(80));

  return failCount === 0;
}

updateSchema()
  .then(success => {
    if (success) {
      console.log('\n✅ Schema update complete! Run test-hksfc-news.js to verify.\n');
    } else {
      console.log('\n⚠️  Some statements failed, but schema might still be updated.\n');
    }
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
