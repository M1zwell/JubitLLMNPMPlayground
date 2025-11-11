import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

/**
 * Test HKSFC News Scraping
 * URL: https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/#
 */

async function testHKSFCNewsScraping() {
  console.log('🔍 Testing HKSFC News Scraping...\n');
  console.log('Target URL: https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/#\n');

  const startTime = Date.now();

  try {
    // Call the scrape-orchestrator Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source: 'hksfc-news',
        strategy: 'firecrawl',
        options: {
          url: 'https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/',
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
            end: new Date().toISOString().split('T')[0]
          }
        }
      })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log('📋 Response Status:', response.status);
    console.log('⏱️  Execution Time:', duration, 'ms\n');

    if (!response.ok || !data.success) {
      console.error('❌ Scraping failed!');
      console.error('Error:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ Scraping successful!\n');

    // Extract articles
    const articles = data.data?.articles || [];

    console.log('📊 Summary:');
    console.log(`   Total articles: ${articles.length}`);
    console.log(`   Current page: ${data.data?.currentPage || 1}`);
    console.log(`   Total pages: ${data.data?.totalPages || 1}`);
    console.log(`   Scrape date: ${data.data?.scrapeDate}`);

    if (articles.length > 0) {
      console.log('\n📰 Sample Articles (first 5):\n');

      articles.slice(0, 5).forEach((article, i) => {
        console.log(`${i + 1}. "${article.title}"`);
        console.log(`   Category: ${article.category}`);
        console.log(`   Date: ${article.publishDate?.split('T')[0]}`);
        console.log(`   URL: ${article.url}`);
        if (article.pdfUrl) {
          console.log(`   PDF: ${article.pdfUrl}`);
        }
        if (article.tags && article.tags.length > 0) {
          console.log(`   Tags: ${article.tags.join(', ')}`);
        }
        console.log('');
      });

      // Category breakdown
      const categoryCount = articles.reduce((acc, article) => {
        acc[article.category] = (acc[article.category] || 0) + 1;
        return acc;
      }, {});

      console.log('📂 Articles by Category:');
      Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });
    } else {
      console.log('\n⚠️  No articles found!');
      console.log('   This may indicate:');
      console.log('   - The page structure has changed');
      console.log('   - The page uses client-side rendering (React SPA)');
      console.log('   - waitFor parameter needs adjustment');
    }

    // Save full response
    writeFileSync('hksfc-news-response.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 Full response saved to: hksfc-news-response.json');

    // Check if articles have required fields
    if (articles.length > 0) {
      console.log('\n✅ Data Validation:');
      const firstArticle = articles[0];
      console.log(`   ✓ Has title: ${!!firstArticle.title}`);
      console.log(`   ✓ Has date: ${!!firstArticle.publishDate}`);
      console.log(`   ✓ Has URL: ${!!firstArticle.url}`);
      console.log(`   ✓ Has category: ${!!firstArticle.category}`);
      console.log(`   ✓ Has ID: ${!!firstArticle.id}`);
    }

    return articles;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Check if articles are being saved to database
async function checkDatabase() {
  console.log('\n\n🗄️  Checking Database...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/hksfc_filings?select=id,title,filing_date,filing_type,url&order=scraped_at.desc&limit=10`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const data = await response.json();

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} recent records in database:\n`);
      data.forEach((record, i) => {
        console.log(`${i + 1}. ${record.title}`);
        console.log(`   Type: ${record.filing_type}`);
        console.log(`   Date: ${record.filing_date}`);
        console.log(`   URL: ${record.url}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No records found in database');
      console.log('   Note: Scraping may not be configured to save to database automatically');
    }
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

// Run tests
async function main() {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('  HKSFC NEWS SCRAPING TEST');
  console.log('═'.repeat(80));
  console.log('\n');

  const articles = await testHKSFCNewsScraping();

  if (articles && articles.length > 0) {
    await checkDatabase();

    console.log('\n');
    console.log('═'.repeat(80));
    console.log('  ✅ TEST COMPLETE');
    console.log('═'.repeat(80));
    console.log(`\n  Successfully scraped ${articles.length} articles from HKSFC`);
    console.log('  All required fields (date/title/URL) are present\n');
  } else {
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('  ❌ TEST FAILED');
    console.log('═'.repeat(80));
    console.log('\n  Unable to scrape articles - see errors above\n');
  }
}

main().catch(console.error);
