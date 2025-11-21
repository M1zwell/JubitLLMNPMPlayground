/**
 * HKSFC RSS Feed Sync Edge Function
 * Fetches and syncs content from all HKSFC RSS feeds
 * Handles inserts/updates with service role permissions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers - inlined for standalone deployment
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create admin client with service role
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// RSS Feed URLs
const RSS_FEEDS = {
  'Press Releases': 'https://www.sfc.hk/en/RSS-Feeds/Press-releases',
  'Circulars': 'https://www.sfc.hk/en/RSS-Feeds/Circulars',
  'Consultations': 'https://www.sfc.hk/en/RSS-Feeds/Consultations-and-Conclusions'
};

interface RSSItem {
  refNo: string;
  link: string;
  title: string;
  pubDate: string;
  description: string;
}

interface Stats {
  totalFetched: number;
  totalScraped: number;
  totalInserted: number;
  totalUpdated: number;
  errors: number;
  byFeed: Record<string, any>;
}

/**
 * Parse XML RSS feed
 */
function parseRSSFeed(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

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
 * Scrape detail page content
 */
async function scrapeDetailPage(url: string): Promise<{ content: string; summary: string }> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    let content = '';
    let summary = '';

    // Extract content
    const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (contentMatch) {
      content = contentMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Extract summary
    const summaryMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    // Fallback to body if no content
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
          .substring(0, 5000);
      }
    }

    return { content, summary };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return { content: '', summary: '' };
  }
}

/**
 * Determine filing type
 */
function determineFilingType(title: string, refNo: string, feedType: string): string {
  const titleLower = title.toLowerCase();

  if (feedType === 'Circulars') return 'Circular';
  if (feedType === 'Consultations') return 'Consultation';

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
 * Generate tags from content
 */
function generateTags(title: string, content: string, filingType: string): string[] {
  const tags: string[] = [];
  const text = (title + ' ' + content).toLowerCase();

  if (text.includes('regulation') || text.includes('compliance') || text.includes('regulatory')) {
    tags.push('Regulation');
  }
  if (text.includes('disclosure') || text.includes('reporting')) {
    tags.push('Disclosure');
  }
  if (text.includes('enforcement') || text.includes('disciplinary')) {
    tags.push('Compliance');
  }
  if (text.includes('financial') || text.includes('asset') || text.includes('fund')) {
    tags.push('Financial');
  }
  if (text.includes('securities') || text.includes('trading')) {
    tags.push('Securities');
  }
  if (text.includes('market') || text.includes('exchange')) {
    tags.push('Market');
  }
  if (text.includes('warning') || text.includes('alert') || text.includes('fraud')) {
    tags.push('Warning');
  }
  if (text.includes('fine') || text.includes('penalty') || text.includes('reprimand')) {
    tags.push('Alert');
  }

  if (filingType && !tags.includes(filingType)) {
    tags.push(filingType);
  }

  return tags.slice(0, 5);
}

/**
 * Process single RSS feed
 */
async function processRSSFeed(feedName: string, feedUrl: string, stats: Stats): Promise<void> {
  console.log(`\n📡 Fetching RSS feed: ${feedName}`);

  try {
    const response = await fetch(feedUrl);
    const xml = await response.text();
    const items = parseRSSFeed(xml);

    console.log(`✓ Found ${items.length} items`);
    stats.totalFetched += items.length;
    stats.byFeed[feedName] = { fetched: items.length, scraped: 0, inserted: 0, updated: 0 };

    for (const item of items) {
      console.log(`Processing: ${item.refNo} - ${item.title}`);

      try {
        const { content, summary } = await scrapeDetailPage(item.link);
        stats.totalScraped++;
        stats.byFeed[feedName].scraped++;

        const filingDate = new Date(item.pubDate).toISOString();
        const filingType = determineFilingType(item.title, item.refNo, feedName);
        const tags = generateTags(item.title, content + summary, filingType);

        // Generate content hash
        const encoder = new TextEncoder();
        const data = encoder.encode(item.refNo + item.title + content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Check if exists
        const { data: existing } = await supabaseAdmin
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

        if (existing) {
          if (existing.content_hash !== contentHash) {
            const { error } = await supabaseAdmin
              .from('hksfc_filings')
              .update(filing)
              .eq('id', existing.id);

            if (error) {
              console.error(`Update failed:`, error.message);
              stats.errors++;
            } else {
              console.log(`✓ Updated`);
              stats.totalUpdated++;
              stats.byFeed[feedName].updated++;
            }
          } else {
            console.log(`⊘ Skipped (no changes)`);
          }
        } else {
          const { error } = await supabaseAdmin
            .from('hksfc_filings')
            .insert({ ...filing, first_seen: now });

          if (error) {
            console.error(`Insert failed:`, error.message);
            stats.errors++;
          } else {
            console.log(`✓ Inserted`);
            stats.totalInserted++;
            stats.byFeed[feedName].inserted++;
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing item:`, error);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error(`Error fetching feed ${feedName}:`, error);
    stats.errors++;
  }
}

// Helper to update job status
async function updateJobStatus(
  jobId: string | null,
  status: 'running' | 'completed' | 'failed',
  recordsProcessed?: number,
  errorMessage?: string
) {
  if (!jobId) return;

  const update: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'running') {
    update.started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed') {
    update.completed_at = new Date().toISOString();
    if (recordsProcessed !== undefined) update.records_processed = recordsProcessed;
    if (errorMessage) update.error_message = errorMessage;
  }

  await supabaseAdmin.from('scraping_jobs').update(update).eq('id', jobId);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let jobId: string | null = null;

  try {
    // Parse request body for job_id
    const body = await req.json().catch(() => ({}));
    jobId = body.job_id || null;

    // Update job to running
    await updateJobStatus(jobId, 'running');

    const stats: Stats = {
      totalFetched: 0,
      totalScraped: 0,
      totalInserted: 0,
      totalUpdated: 0,
      errors: 0,
      byFeed: {}
    };

    const startTime = Date.now();

    // Process all feeds
    for (const [feedName, feedUrl] of Object.entries(RSS_FEEDS)) {
      await processRSSFeed(feedName, feedUrl, stats);
    }

    const elapsed = (Date.now() - startTime) / 1000;

    // Update job to completed
    await updateJobStatus(jobId, 'completed', stats.totalInserted + stats.totalUpdated);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          ...stats,
          elapsed: `${elapsed.toFixed(2)}s`
        },
        message: `RSS sync complete: ${stats.totalInserted} inserted, ${stats.totalUpdated} updated, ${stats.errors} errors`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('RSS sync error:', error);

    // Update job to failed
    await updateJobStatus(jobId, 'failed', 0, error.message);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
