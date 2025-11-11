import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

async function scrapeAndExportToCSV() {
  console.log('🚀 Scraping HKEX CCASS holdings for stock code 700...\n');

  try {
    // Call the scrape-orchestrator Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source: 'hkex-ccass',
        strategy: 'firecrawl',
        options: {
          stockCodes: ['00700'],
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days ago
          }
        }
      })
    });

    const data = await response.json();

    console.log('📋 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    if (!response.ok || !data.success) {
      console.error('❌ Scraping failed!');
      console.error('Error:', data.error);
      return;
    }

    console.log('✅ Scraping successful!\n');

    // Extract the participant data
    const stockData = data.data[0];

    if (!stockData || !stockData.participants) {
      console.error('❌ No participant data found');
      return;
    }

    console.log(`📊 Stock: ${stockData.stockName} (${stockData.stockCode})`);
    console.log(`📅 Data Date: ${stockData.dataDate}`);
    console.log(`👥 Participants: ${stockData.totalParticipants}`);
    console.log(`💰 Total Shares: ${stockData.totalShares.toLocaleString()}\n`);

    // Convert to CSV
    const csvHeaders = [
      'Participant ID',
      'Participant Name',
      'Address',
      'Shareholding',
      'Percentage'
    ].join(',');

    const csvRows = stockData.participants.map(p => {
      return [
        `"${p.participantId}"`,
        `"${p.participantName}"`,
        `"${p.address}"`,
        p.shareholding,
        p.percentage
      ].join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Write to file
    const filename = `hkex_ccass_${stockData.stockCode}_${stockData.dataDate}.csv`;
    writeFileSync(filename, csvContent, 'utf8');

    console.log(`✅ CSV exported successfully!`);
    console.log(`📁 File: ${filename}`);
    console.log(`📊 Rows: ${stockData.participants.length}\n`);

    // Show preview of first 5 rows
    console.log('📄 CSV Preview (first 5 rows):\n');
    console.log(csvHeaders);
    csvRows.slice(0, 5).forEach(row => console.log(row));
    console.log('...\n');

    console.log(`✨ Execution time: ${data.executionTime}ms`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

scrapeAndExportToCSV().catch(console.error);
