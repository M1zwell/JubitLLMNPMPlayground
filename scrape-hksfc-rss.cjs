/**
 * HKSFC RSS Feed Scraper
 * Fetches and scrapes content from all HKSFC RSS feeds
 * - Press releases
 * - Circulars
 * - Consultations & Conclusions
 *
 * Scrapes up to 100 latest entries with full content
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// RSS Feed URLs
const RSS_FEEDS = {
  'Press Releases': 'https://www.sfc.hk/en/RSS-Feeds/Press-releases',
  'Circulars': 'https://www.sfc.hk/en/RSS-Feeds/Circulars',
  'Consultations': 'https://www.sfc.hk/en/RSS-Feeds/Consultations-and-Conclusions'
};

// Statistics
const stats = {
  totalFetched: 0,
  totalScraped: 0,
  totalInserted: 0,
  totalUpdated: 0,
  errors: 0,
  byFeed: {}
};

/**
 * Fetch content via HTTP/HTTPS
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/xml, text/xml, */*'
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse XML RSS feed to extract items
 */
function parseRSSFeed(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    // Extract fields
    const guid = (itemXml.match(/<guid[^>]*>(.*?)<\/guid>/) || [])[1] || '';
    const link = (itemXml.match(/<link>(.*?)<\/link>/) || [])[1] || '';
    const title = (itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || '';
    const pubDate = (itemXml.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
    const description = (itemXml.match(/<description>(.*?)<\/description>/) || [])[1] || '';

    if (guid && link && title) {
      items.push({
        refNo: guid.trim(),
        link: link.trim(),
        title: title.trim(),
        pubDate: pubDate.trim(),
        description: description.trim()
      });
    }
  }

  return items;
}

/**
 * Scrape content from HKSFC detail page
 */
async function scrapeDetailPage(url) {
  try {
    const html = await fetchUrl(url);

    // Extract content from HTML
    let content = '';
    let summary = '';

    // Try to extract main content
    const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (contentMatch) {
      content = contentMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Try to extract summary
    const summaryMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    // If no content found, try body
    if (!content) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        content = bodyMatch[1]
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 5000); // Limit to 5000 chars
      }
    }

    return { content, summary };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return { content: '', summary: '' };
  }
}

/**
 * Determine filing type from title and content
 */
function determineFilingType(title, refNo, feedType) {
  const titleLower = title.toLowerCase();

  if (feedType === 'Circulars') return 'Circular';
  if (feedType === 'Consultations') return 'Consultation';

  // Press releases - categorize by content
  if (titleLower.includes('reprimand') || titleLower.includes('fine') || titleLower.includes('disciplinary')) {
    return 'Enforcement Action';
  }
  if (titleLower.includes('prosecution') || titleLower.includes('sentence') || titleLower.includes('convicted')) {
    return 'Enforcement Action';
  }
  if (titleLower.includes('consult') || titleLower.includes('consultation')) {
    return 'Consultation';
  }
  if (titleLower.includes('guideline') || titleLower.includes('guidance')) {
    return 'Guideline';
  }
  if (titleLower.includes('speech') || titleLower.includes('remarks')) {
    return 'Speech';
  }
  if (titleLower.includes('appointment') || titleLower.includes('appoint')) {
    return 'Announcement';
  }

  return 'Press Release';
}

/**
 * Auto-tag based on content
 */
function generateTags(title, content, filingType) {
  const tags = [];
  const text = (title + ' ' + content).toLowerCase();

  // Compliance tags
  if (text.includes('regulation') || text.includes('compliance') || text.includes('regulatory')) {
    tags.push('Regulation');
  }
  if (text.includes('disclosure') || text.includes('reporting')) {
    tags.push('Disclosure');
  }
  if (text.includes('enforcement') || text.includes('disciplinary')) {
    tags.push('Compliance');
  }

  // Financial tags
  if (text.includes('financial') || text.includes('asset') || text.includes('fund')) {
    tags.push('Financial');
  }
  if (text.includes('securities') || text.includes('trading')) {
    tags.push('Securities');
  }
  if (text.includes('market') || text.includes('exchange')) {
    tags.push('Market');
  }

  // Warning tags
  if (text.includes('warning') || text.includes('alert') || text.includes('fraud')) {
    tags.push('Warning');
  }
  if (text.includes('fine') || text.includes('penalty') || text.includes('reprimand')) {
    tags.push('Alert');
  }

  // Add filing type as tag
  if (filingType && !tags.includes(filingType)) {
    tags.push(filingType);
  }

  return tags.slice(0, 5); // Limit to 5 tags
}

/**
 * Process RSS feed
 */
async function processRSSFeed(feedName, feedUrl, limit = 100) {
  console.log(`\n📡 Fetching RSS feed: ${feedName}`);
  console.log(`URL: ${feedUrl}`);

  try {
    // Fetch RSS feed
    const xml = await fetchUrl(feedUrl);
    const items = parseRSSFeed(xml);

    console.log(`✓ Found ${items.length} items in feed`);
    stats.totalFetched += items.length;
    stats.byFeed[feedName] = { fetched: items.length, scraped: 0, inserted: 0, updated: 0 };

    // Process each item (up to limit)
    const itemsToProcess = items.slice(0, limit);

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      console.log(`\n[${i + 1}/${itemsToProcess.length}] Processing: ${item.refNo}`);
      console.log(`Title: ${item.title}`);

      try {
        // Scrape detail page
        const { content, summary } = await scrapeDetailPage(item.link);
        stats.totalScraped++;
        stats.byFeed[feedName].scraped++;

        // Parse date
        const filingDate = new Date(item.pubDate).toISOString();

        // Determine filing type and tags
        const filingType = determineFilingType(item.title, item.refNo, feedName);
        const tags = generateTags(item.title, content + summary, filingType);

        // Generate content hash
        const contentHash = crypto
          .createHash('sha256')
          .update(item.refNo + item.title + content)
          .digest('hex');

        // Check if exists (use url as unique identifier)
        const { data: existing } = await supabase
          .from('hksfc_filings')
          .select('id, content_hash')
          .eq('url', item.link)
          .maybeSingle();

        const now = new Date().toISOString();
        const filing = {
          title: item.title,
          filing_date: filingDate,
          filing_type: filingType,
          summary: summary || item.description || item.title.substring(0, 200),
          content: content || summary || item.title,
          url: item.link,
          pdf_url: item.link,
          tags: tags,
          content_hash: contentHash,
          scraped_at: now,
          last_seen: now
        };

        // Add first_seen for new records
        if (!existing) {
          filing.first_seen = now;
        }

        if (existing) {
          if (existing.content_hash !== contentHash) {
            // Update if content changed
            const { error } = await supabase
              .from('hksfc_filings')
              .update(filing)
              .eq('id', existing.id);

            if (error) {
              console.error(`  ✗ Update failed:`, error.message);
              stats.errors++;
            } else {
              console.log(`  ✓ Updated (content changed)`);
              stats.totalUpdated++;
              stats.byFeed[feedName].updated++;
            }
          } else {
            console.log(`  ⊘ Skipped (no changes)`);
          }
        } else {
          // Insert new filing
          const { error } = await supabase
            .from('hksfc_filings')
            .insert(filing);

          if (error) {
            console.error(`  ✗ Insert failed:`, error.message);
            stats.errors++;
          } else {
            console.log(`  ✓ Inserted new filing`);
            stats.totalInserted++;
            stats.byFeed[feedName].inserted++;
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ✗ Error processing item:`, error.message);
        stats.errors++;
      }
    }

  } catch (error) {
    console.error(`✗ Error fetching feed ${feedName}:`, error.message);
    stats.errors++;
  }
}

/**
 * Main execution
 */
async function main() {
  const maxPerFeed = parseInt(process.argv[2]) || 35; // Default 35 per feed = ~100 total

  console.log('═══════════════════════════════════════════════════════');
  console.log('   HKSFC RSS Feed Scraper');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Max entries per feed: ${maxPerFeed}`);
  console.log(`Total target: ~${maxPerFeed * 3} entries`);

  const startTime = Date.now();

  // Process all feeds
  for (const [feedName, feedUrl] of Object.entries(RSS_FEEDS)) {
    await processRSSFeed(feedName, feedUrl, maxPerFeed);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   SCRAPING SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total feeds processed: ${Object.keys(RSS_FEEDS).length}`);
  console.log(`Total items fetched: ${stats.totalFetched}`);
  console.log(`Total items scraped: ${stats.totalScraped}`);
  console.log(`Total inserted: ${stats.totalInserted}`);
  console.log(`Total updated: ${stats.totalUpdated}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Time elapsed: ${elapsed}s`);

  console.log('\nBreakdown by feed:');
  for (const [feed, data] of Object.entries(stats.byFeed)) {
    console.log(`  ${feed}:`);
    console.log(`    Fetched: ${data.fetched}`);
    console.log(`    Scraped: ${data.scraped}`);
    console.log(`    Inserted: ${data.inserted}`);
    console.log(`    Updated: ${data.updated}`);
  }

  console.log('\n✓ Scraping complete!');
}

// Run
main().catch(console.error);
