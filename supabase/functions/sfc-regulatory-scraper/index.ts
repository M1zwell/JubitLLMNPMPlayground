/**
 * SFC Regulatory Scraper (Standalone)
 * Comprehensive scraper for all SFC regulatory content categories
 *
 * Endpoint: POST /functions/v1/sfc-regulatory-scraper
 * Body: {
 *   categories?: string[],  // Specific categories to scrape (default: all)
 *   job_id?: string
 * }
 *
 * Categories:
 * - cold_shoulder_orders: Current cold shoulder orders
 * - policy_statements: Policy statements and announcements
 * - high_shareholding: High shareholding concentration
 * - circulars: Circulars (suitability)
 * - consultations: Consultation papers
 * - reports: Reports and surveys
 * - research_papers: Research papers
 * - aml_ctf: AML/CTF requirements
 * - virtual_assets_regulatory: Virtual assets regulatory requirements
 * - virtual_assets_materials: Virtual assets other useful materials
 * - news: News and announcements
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

// Category definitions with URLs and parsing info
const CATEGORY_CONFIG: Record<string, {
  url: string;
  filing_type: string;
  tags: string[];
  parser: 'table' | 'list' | 'static' | 'dynamic';
  description: string;
}> = {
  cold_shoulder_orders: {
    url: 'https://www.sfc.hk/en/News-and-announcements/Decisions-statements-and-disclosures/Current-cold-shoulder-orders',
    filing_type: 'Cold Shoulder Order',
    tags: ['Enforcement', 'Regulatory Action', 'Cold Shoulder'],
    parser: 'table',
    description: 'Current cold shoulder orders imposed on individuals'
  },
  policy_statements: {
    url: 'https://www.sfc.hk/en/News-and-announcements/Policy-statements-and-announcements',
    filing_type: 'Policy Statement',
    tags: ['Policy', 'Announcement', 'Regulatory'],
    parser: 'list',
    description: 'Policy statements and announcements'
  },
  high_shareholding: {
    url: 'https://www.sfc.hk/en/News-and-announcements/High-shareholding-concentration-announcements',
    filing_type: 'High Shareholding',
    tags: ['Shareholding', 'Concentration', 'Warning'],
    parser: 'table',
    description: 'High shareholding concentration announcements'
  },
  reports: {
    url: 'https://www.sfc.hk/en/Published-resources/Reports-and-surveys/Other-reports-and-surveys',
    filing_type: 'Report',
    tags: ['Report', 'Survey', 'Research'],
    parser: 'list',
    description: 'Reports and surveys'
  },
  research_papers: {
    url: 'https://www.sfc.hk/en/Published-resources/Research-papers',
    filing_type: 'Research Paper',
    tags: ['Research', 'Paper', 'Analysis'],
    parser: 'list',
    description: 'Research papers'
  },
  aml_ctf: {
    url: 'https://www.sfc.hk/en/Rules-and-standards/Anti-money-laundering-and-counter-financing-of-terrorism/Legal-and-regulatory-requirements',
    filing_type: 'AML/CTF Requirement',
    tags: ['AML', 'CTF', 'Compliance', 'Regulatory'],
    parser: 'static',
    description: 'Anti-money laundering and counter-financing of terrorism requirements'
  },
  virtual_assets_regulatory: {
    url: 'https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Other-virtual-asset-related-activities/Regulatory-requirements',
    filing_type: 'Virtual Assets Regulatory',
    tags: ['Virtual Assets', 'Crypto', 'Regulatory', 'Fintech'],
    parser: 'static',
    description: 'Virtual assets regulatory requirements'
  },
  virtual_assets_materials: {
    url: 'https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Other-useful-materials',
    filing_type: 'Virtual Assets Material',
    tags: ['Virtual Assets', 'Crypto', 'Guidance', 'Fintech'],
    parser: 'list',
    description: 'Other virtual asset useful materials'
  },
  // Dynamic pages (require JS - will use Firecrawl actions when available)
  circulars: {
    url: 'https://apps.sfc.hk/edistributionWeb/gateway/EN/circular/suitability/',
    filing_type: 'Circular',
    tags: ['Circular', 'Suitability', 'Guidance'],
    parser: 'dynamic',
    description: 'Circulars on suitability'
  },
  consultations: {
    url: 'https://apps.sfc.hk/edistributionWeb/gateway/EN/consultation/',
    filing_type: 'Consultation',
    tags: ['Consultation', 'Policy', 'Public Comment'],
    parser: 'dynamic',
    description: 'Consultation papers'
  },
  news: {
    url: 'https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/',
    filing_type: 'News',
    tags: ['News', 'Announcement', 'Press Release'],
    parser: 'dynamic',
    description: 'News and announcements'
  }
};

interface ScrapedItem {
  title: string;
  url: string;
  filing_date: string | null;
  summary: string;
  content: string;
  category: string;
  extra_data?: Record<string, any>;
}

// Generate content hash
function generateContentHash(...values: string[]): string {
  const hash = createHash('sha256');
  hash.update(values.join('||'));
  return hash.digest('hex');
}

// Parse date from various formats
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // Try DD Mon YYYY format (e.g., "25 Sep 2025")
  const ddMonYYYY = dateStr.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
  if (ddMonYYYY) {
    const months: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    const month = months[ddMonYYYY[2]];
    if (month) {
      return `${ddMonYYYY[3]}-${month}-${ddMonYYYY[1].padStart(2, '0')}`;
    }
  }

  // Try DD/MM/YYYY format
  const ddmmyyyy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
  }

  // Try YYYY-MM-DD format
  const yyyymmdd = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (yyyymmdd) {
    return dateStr;
  }

  return null;
}

// Scrape static page content
async function scrapeStaticPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SFC-Scraper/1.0)'
      }
    });
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return '';
  }
}

// Parse table-based pages (cold shoulder, high shareholding)
async function parseTablePage(html: string, category: string, config: typeof CATEGORY_CONFIG[string]): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  if (category === 'cold_shoulder_orders') {
    // Parse cold shoulder orders table
    // Pattern: Name | Period | Imposed by | News release
    const tableMatch = html.match(/<table[^>]*class="[^"]*table[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
      const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      while ((rowMatch = rowPattern.exec(tableMatch[1])) !== null) {
        const row = rowMatch[1];
        // Skip header rows
        if (row.includes('<th')) continue;

        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        if (cells.length >= 4) {
          const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').trim();
          const name = stripHtml(cells[0]);
          const period = stripHtml(cells[1]);
          const imposedBy = stripHtml(cells[2]);
          const newsRelease = stripHtml(cells[3]);

          // Extract link from news release
          const linkMatch = cells[3].match(/href="([^"]+)"/);
          const newsUrl = linkMatch ? `https://www.sfc.hk${linkMatch[1]}` : config.url;

          // Extract date from news release
          const dateMatch = newsRelease.match(/(\d{1,2}\s+\w{3}\s+\d{4})/);
          const filingDate = dateMatch ? parseDate(dateMatch[1]) : null;

          if (name && name.length > 2) {
            items.push({
              title: `Cold Shoulder Order: ${name}`,
              url: newsUrl,
              filing_date: filingDate,
              summary: `${name} subject to cold shoulder order from ${period}. Imposed by: ${imposedBy}`,
              content: `Name: ${name}\nCold Shoulder Period: ${period}\nImposed By: ${imposedBy}\nNews Release: ${newsRelease}`,
              category,
              extra_data: { person_name: name, period, imposed_by: imposedBy, reference: newsRelease }
            });
          }
        }
      }
    }
  } else if (category === 'high_shareholding') {
    // Parse high shareholding concentration table
    const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
      const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      while ((rowMatch = rowPattern.exec(tableMatch[1])) !== null) {
        const row = rowMatch[1];
        if (row.includes('<th')) continue;

        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        if (cells.length >= 4) {
          const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').trim();
          const announcementDate = stripHtml(cells[0]);
          const infoDate = stripHtml(cells[1]);
          const stockCode = stripHtml(cells[2]);
          const companyName = stripHtml(cells[3]);

          const linkMatch = cells[3].match(/href="([^"]+)"/);
          const pdfUrl = linkMatch ? linkMatch[1] : '';

          const filingDate = parseDate(announcementDate);

          if (stockCode && companyName) {
            items.push({
              title: `High Shareholding: ${stockCode} - ${companyName}`,
              url: pdfUrl.startsWith('http') ? pdfUrl : `https://www.sfc.hk${pdfUrl}`,
              filing_date: filingDate,
              summary: `High shareholding concentration announcement for ${companyName} (${stockCode})`,
              content: `Stock Code: ${stockCode}\nCompany: ${companyName}\nAnnouncement Date: ${announcementDate}\nInformation Date: ${infoDate}`,
              category,
              extra_data: { stock_code: stockCode, company_name: companyName, info_date: infoDate }
            });
          }
        }
      }
    }
  }

  return items;
}

// Parse list-based pages (policy statements, reports, research papers)
async function parseListPage(html: string, category: string, config: typeof CATEGORY_CONFIG[string]): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  // Look for common list patterns
  // Pattern 1: Date followed by title/link
  const listPattern = /(\d{1,2}\s+\w{3}\s+\d{4})\s*[\n\r]+\s*(?:<[^>]+>)*\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = listPattern.exec(html)) !== null) {
    const dateStr = match[1];
    const url = match[2].startsWith('http') ? match[2] : `https://www.sfc.hk${match[2]}`;
    const title = match[3].trim();
    const filingDate = parseDate(dateStr);

    if (title && title.length > 5) {
      items.push({
        title,
        url,
        filing_date: filingDate,
        summary: title,
        content: title,
        category
      });
    }
  }

  // Pattern 2: Look for link elements with dates nearby
  if (items.length === 0) {
    const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,100}?(\d{1,2}\s+\w{3}\s+\d{4}|\d{4}-\d{2}-\d{2})/gi;
    while ((match = linkPattern.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `https://www.sfc.hk${match[1]}`;
      const title = match[2].trim();
      const dateStr = match[3];
      const filingDate = parseDate(dateStr);

      // Filter out navigation links
      if (title && title.length > 10 && !title.toLowerCase().includes('home') && !title.toLowerCase().includes('skip')) {
        items.push({
          title,
          url,
          filing_date: filingDate,
          summary: title,
          content: title,
          category
        });
      }
    }
  }

  return items;
}

// Parse static info pages (AML/CTF, VA regulatory)
async function parseStaticInfoPage(html: string, category: string, config: typeof CATEGORY_CONFIG[string]): Promise<ScrapedItem[]> {
  const items: ScrapedItem[] = [];

  // Extract main content
  const contentMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                       html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                       html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (contentMatch) {
    const content = contentMatch[1]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);

    // Extract title
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : config.description;

    // Create single item for static page
    items.push({
      title,
      url: config.url,
      filing_date: new Date().toISOString().split('T')[0],
      summary: content.substring(0, 300),
      content,
      category
    });
  }

  // Also extract any linked documents
  const docPattern = /<a[^>]+href="([^"]+\.pdf)"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = docPattern.exec(html)) !== null) {
    const url = match[1].startsWith('http') ? match[1] : `https://www.sfc.hk${match[1]}`;
    const title = match[2].trim();

    if (title && title.length > 5) {
      items.push({
        title,
        url,
        filing_date: null,
        summary: `${config.filing_type}: ${title}`,
        content: title,
        category
      });
    }
  }

  return items;
}

// Scrape dynamic page using Firecrawl (when available)
async function scrapeDynamicPage(category: string, config: typeof CATEGORY_CONFIG[string]): Promise<ScrapedItem[]> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

  if (!FIRECRAWL_API_KEY) {
    console.log(`⚠️ Firecrawl API key not available, skipping dynamic page: ${category}`);
    return [];
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: config.url,
        formats: ['markdown'],
        waitFor: 5000,
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Firecrawl error for ${category}: ${error}`);
      return [];
    }

    const data = await response.json();
    const markdown = data.data?.markdown || '';

    // Parse markdown table
    const items: ScrapedItem[] = [];
    const lines = markdown.split('\n');
    let headerFound = false;

    for (const line of lines) {
      if (!line.trim()) continue;

      // Check for header
      if (line.includes('Date') || line.includes('Title') || line.includes('Reference')) {
        headerFound = true;
        continue;
      }

      if (line.match(/^[\s|:-]+$/)) continue;

      if (headerFound && line.startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 2) {
          const dateStr = cells.find(c => c.match(/\d{1,2}\s+\w{3}\s+\d{4}|\d{4}-\d{2}-\d{2}/));
          const title = cells.find(c => c.length > 20 && !c.match(/^\d/));

          if (title) {
            items.push({
              title,
              url: config.url,
              filing_date: dateStr ? parseDate(dateStr) : null,
              summary: title,
              content: title,
              category
            });
          }
        }
      }
    }

    return items;
  } catch (error) {
    console.error(`Error scraping dynamic page ${category}:`, error);
    return [];
  }
}

// Helper to update job status
async function updateJobStatus(
  supabase: any,
  jobId: string | null | undefined,
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

  await supabase.from('scraping_jobs').update(update).eq('id', jobId);
}

// Main handler
serve(async (req: Request) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let jobId: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    const { categories, job_id }: { categories?: string[]; job_id?: string } = body;
    jobId = job_id;

    // Determine which categories to scrape
    const categoriesToScrape = categories && categories.length > 0
      ? categories.filter(c => c in CATEGORY_CONFIG)
      : Object.keys(CATEGORY_CONFIG);

    console.log(`[SFC Regulatory Scraper] Starting: ${categoriesToScrape.length} categories`);

    await updateJobStatus(supabase, jobId, 'running');

    let totalScraped = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    const results: Record<string, { scraped: number; inserted: number; updated: number }> = {};

    // Process each category
    for (const category of categoriesToScrape) {
      const config = CATEGORY_CONFIG[category];
      console.log(`\n📡 Processing: ${category} (${config.parser})`);

      results[category] = { scraped: 0, inserted: 0, updated: 0 };

      try {
        let items: ScrapedItem[] = [];

        if (config.parser === 'dynamic') {
          items = await scrapeDynamicPage(category, config);
        } else {
          const html = await scrapeStaticPage(config.url);

          if (config.parser === 'table') {
            items = await parseTablePage(html, category, config);
          } else if (config.parser === 'list') {
            items = await parseListPage(html, category, config);
          } else if (config.parser === 'static') {
            items = await parseStaticInfoPage(html, category, config);
          }
        }

        console.log(`✓ Found ${items.length} items for ${category}`);
        totalScraped += items.length;
        results[category].scraped = items.length;

        // Insert/update items
        for (const item of items) {
          try {
            const contentHash = generateContentHash(item.url, item.title);
            const now = new Date().toISOString();

            // Check if exists
            const { data: existing } = await supabase
              .from('hksfc_filings')
              .select('id, content_hash')
              .eq('url', item.url)
              .maybeSingle();

            const filing = {
              title: item.title,
              filing_date: item.filing_date || now.split('T')[0],
              filing_type: config.filing_type,
              summary: item.summary,
              content: item.content,
              url: item.url,
              pdf_url: item.url.endsWith('.pdf') ? item.url : null,
              tags: [...config.tags, category],
              content_hash: contentHash,
              scraped_at: now,
              last_seen: now
            };

            if (existing) {
              if (existing.content_hash !== contentHash) {
                const { error } = await supabase
                  .from('hksfc_filings')
                  .update(filing)
                  .eq('id', existing.id);

                if (error) {
                  console.error(`Update error:`, error.message);
                  totalFailed++;
                } else {
                  totalUpdated++;
                  results[category].updated++;
                }
              }
            } else {
              const { error } = await supabase
                .from('hksfc_filings')
                .insert({ ...filing, first_seen: now });

              if (error) {
                console.error(`Insert error:`, error.message);
                totalFailed++;
              } else {
                totalInserted++;
                results[category].inserted++;
              }
            }
          } catch (itemError) {
            console.error(`Item error:`, itemError);
            totalFailed++;
          }
        }

        // Rate limiting between categories
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (categoryError) {
        console.error(`Error processing ${category}:`, categoryError);
        totalFailed++;
      }
    }

    const duration = Date.now() - startTime;

    // Log execution
    await supabase.from('scrape_logs').insert({
      source: 'sfc-regulatory',
      status: totalFailed > 0 ? 'partial' : 'success',
      records_inserted: totalInserted,
      records_updated: totalUpdated,
      records_failed: totalFailed,
      duration_ms: duration,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      scraper_engine: 'native-fetch',
      scraper_version: '1.0.0'
    });

    await updateJobStatus(supabase, jobId, 'completed', totalInserted + totalUpdated);

    const response = {
      success: true,
      source: 'sfc-regulatory',
      categories_processed: categoriesToScrape.length,
      total_scraped: totalScraped,
      total_inserted: totalInserted,
      total_updated: totalUpdated,
      total_failed: totalFailed,
      duration_ms: duration,
      results
    };

    console.log(`\n[SFC Regulatory Scraper] Complete:`, response);

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[SFC Regulatory Scraper] Error:', error);

    await updateJobStatus(supabase, jobId, 'failed', 0, error.message);

    return new Response(
      JSON.stringify({ success: false, error: error.message, duration_ms: duration }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 500 }
    );
  }
});
