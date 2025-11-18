const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.p-86cvKSdL3dxAM1vP-dXAsxqN-jB4bVUZtFLzj0eIo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
});

async function createTables() {
  console.log('Creating a1_market_highlights table...\n');

  // Try to insert a test record to see if table exists
  const { data: testData, error: testError } = await supabase
    .from('a1_market_highlights')
    .select('*')
    .limit(1);

  if (testError && testError.code === '42P01') {
    console.log('Table does not exist. Need to create via SQL editor or migration tool.');
    console.log('\nPlease run the following SQL in Supabase SQL Editor:');
    console.log('='.repeat(80));
    console.log(`
CREATE TABLE a1_market_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL,
  year int NOT NULL,
  quarter int,
  main_listed int,
  main_mktcap_hkbn numeric(12,2),
  main_turnover_hkmm numeric(12,2),
  gem_listed int,
  gem_mktcap_hkbn numeric(12,2),
  gem_turnover_hkmm numeric(12,2),
  trading_days int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (period_type, year, COALESCE(quarter, 0))
);

CREATE INDEX idx_a1_year ON a1_market_highlights(year DESC);
CREATE INDEX idx_a1_period_type ON a1_market_highlights(period_type);

CREATE TABLE dashboard_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  chart_key text NOT NULL,
  title text NOT NULL,
  prompt_template text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (table_name, chart_key)
);

CREATE INDEX idx_dashboard_prompts_table ON dashboard_prompts(table_name);
    `);
    console.log('='.repeat(80));
    return false;
  } else if (testError) {
    console.error('Error checking table:', testError);
    return false;
  } else {
    console.log('✓ Table a1_market_highlights exists');
    return true;
  }
}

async function insertPrompts() {
  console.log('\nInserting dashboard prompts...');

  const prompts = [
    {
      table_name: 'a1_market_highlights',
      chart_key: 'a1_market_cap_trend',
      title: 'HKEX Main Board Market Cap Trend',
      prompt_template: 'You are a Hong Kong equity market analyst. Using data from table a1_market_highlights with columns (year, main_mktcap_hkbn), generate a concise analysis of the long-term change in Main Board market capitalisation from 1997 to the latest year. Highlight major peaks and troughs, link them to likely market cycles, and comment on how current levels compare with historical highs.'
    },
    {
      table_name: 'a1_market_highlights',
      chart_key: 'a1_turnover_trend',
      title: 'Long-term Average Daily Turnover',
      prompt_template: 'Using table a1_market_highlights with columns (year, main_turnover_hkmm), analyze the evolution of average daily turnover on the Main Board from 1997 to present. Identify liquidity regimes (boom years vs quiet years) and explain what these patterns reveal about market participation and trading activity over time.'
    },
    {
      table_name: 'a1_market_highlights',
      chart_key: 'a1_turnover_quarterly',
      title: 'Quarterly Average Daily Turnover',
      prompt_template: 'Using table a1_market_highlights filtered on period_type = \'quarter\', describe the trend in main_turnover_hkmm over the last 8 quarters. Quantify quarter-on-quarter and year-on-year changes and comment whether market liquidity is improving, stable, or declining.'
    },
    {
      table_name: 'a1_market_highlights',
      chart_key: 'a1_listed_companies',
      title: 'Number of Listed Companies – Main vs GEM',
      prompt_template: 'From table a1_market_highlights, compare the evolution of main_listed and gem_listed across years. Explain how the role of GEM has changed relative to the Main Board and what this implies for new listing trends. Comment on the structural decline of GEM listings and its implications.'
    }
  ];

  for (const prompt of prompts) {
    const { error } = await supabase
      .from('dashboard_prompts')
      .upsert(prompt, {
        onConflict: 'table_name,chart_key'
      });

    if (error) {
      console.error(`  ✗ Error inserting ${prompt.chart_key}:`, error.message);
    } else {
      console.log(`  ✓ Inserted: ${prompt.chart_key}`);
    }
  }

  console.log('\n✓ Prompts inserted successfully');
}

async function main() {
  const tableExists = await createTables();

  if (tableExists) {
    await insertPrompts();
    console.log('\n=== Setup Complete ===');
  } else {
    console.log('\n=== Manual SQL execution required ===');
    console.log('After running the SQL above, run this script again to insert prompts.');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
