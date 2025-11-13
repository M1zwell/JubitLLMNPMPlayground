import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from "https://deno.land/std@0.177.0/node/crypto.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Retry helper with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      if (response.status === 429) {
        // Rate limit - wait longer
        const waitTime = (i + 1) * 5000
        console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`)
        await new Promise(r => setTimeout(r, waitTime))
        continue
      }
      if (response.status >= 500) {
        // Server error - retry
        await new Promise(r => setTimeout(r, (i + 1) * 2000))
        continue
      }
      return response // Return non-retryable errors
    } catch (error) {
      if (i === maxRetries - 1) throw error
      console.log(`⏳ Request failed, retrying ${i + 1}/${maxRetries}: ${error.message}`)
      await new Promise(r => setTimeout(r, (i + 1) * 2000))
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`)
}

// Generate content hash for deduplication
function generateContentHash(entityName: string, licenseNumber: string, entityType: string): string {
  const hash = createHash('sha256')
  hash.update(`${entityName}||${licenseNumber || 'NONE'}||${entityType}`)
  return hash.digest('hex')
}

// CIMA Entity Types
const ENTITY_TYPES = [
  'Banking, Financing and Money Services',
  'Trust & Corporate Services Providers',
  'Insurance',
  'Investment Business',
  'Insolvency Practitioners',
  'Registered Agents',
  'Virtual Assets Service Providers'
]

// Trust Categories for Trust & Corporate Services Providers
const TRUST_CATEGORIES = [
  'Class I Trust Licences - Registered Agent Status',
  'Class I Trust Licences No Registered Agent Status',
  'Class II Trust Licences',
  'Class III Licences',
  'Company Management',
  'Restricted Class II Trust Licences',
  'Restricted Class III Licences'
]

interface CIMAEntity {
  entity_name: string
  entity_type: string
  entity_category?: string
  license_number?: string
  license_status?: string
  registration_date?: string
  expiry_date?: string
  registered_agent_status?: boolean
  address?: string
  contact_phone?: string
  contact_email?: string
  website?: string
  additional_info?: any
}

// Scrape CIMA entities using Firecrawl V2 API (bypasses CSRF protection)
async function scrapeCIMAEntities(entityType: string, category?: string): Promise<CIMAEntity[]> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('VITE_FIRECRAWL_API_KEY')

  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not configured')
  }

  console.log(`📡 Using Firecrawl to scrape ${entityType}${category ? ` - ${category}` : ''}`)

  // Map entity type to dropdown value
  const dropdownValue = category || entityType

  try {
    // Use Firecrawl V2 scrape API with browser actions (with retry)
    const response = await fetchWithRetry('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://www.cima.ky/search-entities-cima',
        formats: ['markdown', 'html'],
        actions: [
          { type: 'wait', milliseconds: 2000 },
          {
            type: 'execute_js',
            script: `
              // Select entity type from dropdown
              const typeSelect = document.querySelector('select[name="AuthorizationType"]');
              if (typeSelect) {
                typeSelect.value = "${dropdownValue}";
                typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
              }
              await new Promise(r => setTimeout(r, 500));

              // Submit the form
              const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], .btn-primary');
              if (submitBtn) {
                submitBtn.click();
              } else {
                // Try to find and submit the form directly
                const form = document.querySelector('form');
                if (form) form.submit();
              }
            `
          },
          { type: 'wait', milliseconds: 5000 }
        ],
        waitFor: 3000,
        timeout: 60000
      })
    }, 3)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Firecrawl API error ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(`Firecrawl scrape failed: ${result.error || 'Unknown error'}`)
    }

    const markdown = result.data?.markdown || ''
    const html = result.data?.html || ''

    console.log(`✅ Received ${markdown.length} chars of markdown`)

    // Parse entities from the scraped content
    const entities: CIMAEntity[] = parseEntitiesFromHTML(html, markdown, entityType, category)

    console.log(`📊 Parsed ${entities.length} entities`)
    return entities

  } catch (error) {
    console.error(`❌ Error scraping CIMA with Firecrawl:`, error.message)
    throw error
  }
}

// Parse entities from HTML table (CIMA returns results in a table)
function parseEntitiesFromHTML(html: string, markdown: string, entityType: string, category?: string): CIMAEntity[] {
  const entities: CIMAEntity[] = []

  // Extract table rows from HTML
  const tableRowRegex = /<tr[^>]*>(.*?)<\/tr>/gis
  const cellRegex = /<td[^>]*>(.*?)<\/td>/gis

  const rows = [...html.matchAll(tableRowRegex)]

  for (const row of rows) {
    const rowHTML = row[1]
    const cells = [...rowHTML.matchAll(cellRegex)].map(m =>
      m[1].replace(/<[^>]*>/g, '').trim()
    )

    // Skip header rows or empty rows
    if (cells.length < 2 || cells[0].toLowerCase().includes('name') || cells[0].toLowerCase().includes('entity')) {
      continue
    }

    // Common CIMA table structure: Name, License Number, Status, etc.
    const entity: CIMAEntity = {
      entity_name: cells[0] || '',
      entity_type: entityType,
      entity_category: category,
      license_number: cells[1] || undefined,
      license_status: cells[2] || 'Active',
      address: cells[3] || undefined,
      contact_phone: cells[4] || undefined,
      contact_email: cells[5] || undefined,
      additional_info: {
        raw_cells: cells,
        source: 'firecrawl_html_parse'
      }
    }

    // Only add if we have a valid entity name
    if (entity.entity_name && entity.entity_name.length > 2) {
      entities.push(entity)
    }
  }

  // Fallback: Try to parse from markdown if HTML parsing failed
  if (entities.length === 0 && markdown.includes('|')) {
    console.log('📝 Falling back to markdown table parsing')
    const lines = markdown.split('\n')

    for (const line of lines) {
      if (!line.includes('|')) continue

      const cols = line.split('|').map(c => c.trim()).filter(c => c)

      // Skip separator rows (contain dashes)
      if (cols.some(c => c.match(/^-+$/))) continue

      // Skip header rows
      if (cols.some(c => c.toLowerCase().includes('name') || c.toLowerCase().includes('entity'))) continue

      if (cols.length >= 2 && cols[0].length > 2) {
        entities.push({
          entity_name: cols[0],
          entity_type: entityType,
          entity_category: category,
          license_number: cols[1] || undefined,
          license_status: cols[2] || 'Active',
          additional_info: {
            raw_markdown: cols,
            source: 'firecrawl_markdown_parse'
          }
        })
      }
    }
  }

  return entities
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { entity_types, trust_categories, clear_existing, include_all_statuses } = await req.json()
    const typesToScrape = entity_types || ENTITY_TYPES
    const categoriesToScrape = trust_categories || TRUST_CATEGORIES

    console.log('🔄 Starting CIMA scraper...')
    console.log('📋 Entity types to scrape:', typesToScrape)
    console.log('📋 Trust categories to scrape:', categoriesToScrape)

    let totalInserted = 0
    let totalUpdated = 0
    let totalFailed = 0
    const results: any[] = []

    // Clear existing data if requested
    if (clear_existing) {
      console.log('🗑️  Clearing existing CIMA entities...')
      const { error: deleteError } = await supabaseAdmin
        .from('cima_entities')
        .delete()
        .neq('id', 0) // Delete all

      if (deleteError) {
        console.error('❌ Error clearing data:', deleteError)
      } else {
        console.log('✅ Existing data cleared')
      }
    }

    // Scrape each entity type
    for (const entityType of typesToScrape) {
      console.log(`\n📥 Scraping ${entityType}...`)

      try {
        let allEntities: CIMAEntity[] = []

        // Special handling for Trust & Corporate Services Providers
        if (entityType === 'Trust & Corporate Services Providers') {
          for (const category of categoriesToScrape) {
            console.log(`  📂 Category: ${category}`)
            const entities = await scrapeCIMAEntities(entityType, category)
            allEntities = allEntities.concat(entities)

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } else {
          allEntities = await scrapeCIMAEntities(entityType)
        }

        console.log(`📊 Found ${allEntities.length} total entities for ${entityType}`)

        // Insert entities into database
        let inserted = 0
        let updated = 0
        let failed = 0

        for (const entity of allEntities) {
          const contentHash = generateContentHash(
            entity.entity_name,
            entity.license_number || '',
            entity.entity_type
          )

          const { error: upsertError } = await supabaseAdmin
            .from('cima_entities')
            .upsert({
              ...entity,
              content_hash: contentHash,
              jurisdiction: 'Cayman Islands',
              scraped_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'content_hash',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error(`❌ Error upserting ${entity.entity_name}:`, upsertError.message)
            failed++
          } else {
            inserted++
          }
        }

        results.push({
          entity_type: entityType,
          total_records: allEntities.length,
          inserted,
          updated,
          failed
        })

        totalInserted += inserted
        totalUpdated += updated
        totalFailed += failed

        console.log(`✅ ${entityType}: ${inserted} inserted, ${updated} updated, ${failed} failed`)

      } catch (error) {
        console.error(`❌ Error scraping ${entityType}:`, error.message)
        results.push({
          entity_type: entityType,
          error: error.message,
          inserted: 0,
          updated: 0,
          failed: 0
        })
      }

      // Add delay between entity types
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n✅ CIMA scraper completed!')
    console.log(`📊 Total: ${totalInserted} inserted, ${totalUpdated} updated, ${totalFailed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        total_inserted: totalInserted,
        total_updated: totalUpdated,
        total_failed: totalFailed,
        results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Fatal error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        total_inserted: 0,
        total_updated: 0,
        total_failed: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
