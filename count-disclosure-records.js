import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getStats() {
  console.log('\n📊 HKEX Disclosure Database Statistics\n');
  console.log('='.repeat(70));

  // Get all records
  const { data, error } = await supabase
    .from('hkex_disclosure_interests')
    .select('stock_code, stock_name, shareholder_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const uniqueStocks = new Set(data.map(r => r.stock_code));
  const stockCounts = {};

  data.forEach(record => {
    if (!stockCounts[record.stock_code]) {
      stockCounts[record.stock_code] = {
        name: record.stock_name,
        count: 0
      };
    }
    stockCounts[record.stock_code].count++;
  });

  console.log(`Total Records: ${data.length}`);
  console.log(`Unique Stocks: ${uniqueStocks.size}`);
  console.log('='.repeat(70));
  console.log('\nTop 10 Stocks by Shareholder Count:\n');

  const sortedStocks = Object.entries(stockCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  sortedStocks.forEach(([code, info], index) => {
    console.log(`${index + 1}. ${code} - ${info.name}`);
    console.log(`   Shareholders: ${info.count}`);
  });

  console.log('\n' + '='.repeat(70));
}

getStats().then(() => process.exit(0));
