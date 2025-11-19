// Verify D3 data import
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyImport() {
  console.log('=== Verifying D3 Data Import ===\n');

  // Get count by domicile
  const { data: countData, error: countError } = await supabase
    .from('d3_fund_nav_by_type')
    .select('domicile', { count: 'exact', head: true });

  if (!countError) {
    console.log('Total records:', countData);
  }

  // Get distinct dates
  const { data: dates, error: datesError } = await supabase
    .from('d3_fund_nav_by_type')
    .select('as_at_date')
    .order('as_at_date', { ascending: false });

  if (!datesError && dates) {
    const uniqueDates = [...new Set(dates.map(d => d.as_at_date))];
    console.log('\nDistinct dates in database:', uniqueDates.length);
    console.log('\nLatest 10 dates:');
    uniqueDates.slice(0, 10).forEach(date => console.log(`  ${date}`));
    console.log('\nOldest 5 dates:');
    uniqueDates.slice(-5).forEach(date => console.log(`  ${date}`));
  }

  // Get summary by domicile and date
  console.log('\n=== Latest Data by Domicile ===');
  for (const domicile of ['HK', 'NonHK', 'All']) {
    const { data, error } = await supabase
      .from('d3_fund_nav_by_type')
      .select('as_at_date, fund_type, nav_usd_mn')
      .eq('domicile', domicile)
      .order('as_at_date', { ascending: false })
      .limit(15);

    if (!error && data && data.length > 0) {
      const latestDate = data[0].as_at_date;
      console.log(`\n${domicile} - Latest: ${latestDate}`);
      const latestRecords = data.filter(d => d.as_at_date === latestDate);
      latestRecords.forEach(r => {
        if (r.nav_usd_mn !== null) {
          console.log(`  ${r.fund_type}: $${r.nav_usd_mn.toLocaleString()}M`);
        }
      });

      // Count records for this domicile
      const { count } = await supabase
        .from('d3_fund_nav_by_type')
        .select('*', { count: 'exact', head: true })
        .eq('domicile', domicile);

      console.log(`  Total records for ${domicile}: ${count}`);
    }
  }

  // Check for Q3 2025 data (should be around September 30, 2025)
  console.log('\n=== Checking Q3 2025 Data (Sep 2025) ===');
  const { data: q3Data, error: q3Error } = await supabase
    .from('d3_fund_nav_by_type')
    .select('*')
    .gte('as_at_date', '2025-09-01')
    .lte('as_at_date', '2025-09-30');

  if (!q3Error) {
    if (q3Data && q3Data.length > 0) {
      console.log(`Found ${q3Data.length} records for September 2025`);
      const dates = [...new Set(q3Data.map(d => d.as_at_date))];
      console.log('Dates:', dates);
    } else {
      console.log('No data found for September 2025');

      // Check August 2025 instead
      const { data: augData, error: augError } = await supabase
        .from('d3_fund_nav_by_type')
        .select('*')
        .gte('as_at_date', '2025-08-01')
        .lte('as_at_date', '2025-08-31');

      if (!augError && augData && augData.length > 0) {
        console.log(`\nFound ${augData.length} records for August 2025`);
        const dates = [...new Set(augData.map(d => d.as_at_date))];
        console.log('Dates:', dates);
        console.log('\nNote: Q3 ends on Sep 30, but data might be labeled as Aug 31');
      }
    }
  }

  console.log('\n=== Verification Complete ===');
}

verifyImport();
