/**
 * Verify Firecrawl API Key is valid
 */

const FIRECRAWL_API_KEY = 'fc-6dd00f1f44204e079a39d732a4ec08de';

async function verifyApiKey() {
  console.log('🔑 Verifying Firecrawl API Key...\n');

  try {
    // Test with a simple URL
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        formats: ['markdown'],
      }),
    });

    console.log('Response Status:', response.status);

    if (response.ok) {
      console.log('✅ API Key is VALID!');
      console.log('');
      console.log('Next Step: Redeploy the Edge Function');
      console.log('The function was deployed before the secret was set.');
      console.log('');
      console.log('Options to redeploy:');
      console.log('');
      console.log('Option 1 - Via Supabase Dashboard:');
      console.log('  1. Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions');
      console.log('  2. Find "hkex-disclosure-scraper"');
      console.log('  3. Click "Edit" or "Redeploy"');
      console.log('  4. Save/Deploy (this will pick up the new secret)');
      console.log('');
      console.log('Option 2 - Via CLI (if Docker is working):');
      console.log('  supabase functions deploy hkex-disclosure-scraper');
      console.log('');
    } else {
      const errorText = await response.text();
      console.log('❌ API Key is INVALID!');
      console.log('Response:', errorText);
      console.log('');
      console.log('Action Required:');
      console.log('  1. Get a valid Firecrawl API key from https://firecrawl.dev');
      console.log('  2. Update the Supabase secret:');
      console.log('     supabase secrets set FIRECRAWL_API_KEY=<your_new_key>');
      console.log('  3. Redeploy the Edge Function');
    }
  } catch (error) {
    console.log('❌ Error testing API key:', error.message);
  }
}

verifyApiKey();
