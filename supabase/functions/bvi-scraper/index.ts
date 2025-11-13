import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// BVI FSC CSV Download URLs
const CSV_SOURCES = {
  'Banking & Fiduciary': 'https://www.bvifsc.vg/banking-fiduciary-data.csv?combine=&field_entity_status_tid%5B0%5D=72',
  'Insurance': 'https://www.bvifsc.vg/insurance-data.csv?combine=&field_entity_status_tid%5B0%5D=72',
  'Investment Business': 'https://www.bvifsc.vg/investment-business-data.csv?combine=&field_entity_status_tid%5B0%5D=72',
  'Registered Agents': 'https://www.bvifsc.vg/registered-agents-data.csv?combine=&field_entity_status_tid%5B0%5D=72',
  'VASP': 'https://www.bvifsc.vg/vasp-data.csv?combine=&field_entity_status_tid%5B0%5D=72'
}

interface BVIEntity {
  entity_name: string
  entity_type: string
  license_number?: string
  license_status?: string
  registration_date?: string
  registered_agent?: string
  address?: string
  contact_phone?: string
  contact_email?: string
  website?: string
}

// Parse CSV data
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n')
  const result: string[][] = []

  for (const line of lines) {
    if (!line.trim()) continue

    // Simple CSV parser (handles quoted fields)
    const fields: string[] = []
    let currentField = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
    }
    fields.push(currentField.trim())
    result.push(fields)
  }

  return result
}

// Clean and normalize data
function cleanData(value: string): string {
  return value.replace(/^["']|["']$/g, '').trim()
}

// Map CSV row to BVI entity
function mapCSVToEntity(row: string[], headers: string[], entityType: string): BVIEntity | null {
  if (row.length < 2) return null

  const entity: BVIEntity = {
    entity_name: '',
    entity_type: entityType
  }

  // Map headers to entity fields (flexible mapping)
  for (let i = 0; i < headers.length && i < row.length; i++) {
    const header = headers[i].toLowerCase()
    const value = cleanData(row[i])

    if (!value) continue

    if (header.includes('name') || header.includes('entity')) {
      entity.entity_name = value
    } else if (header.includes('license') && header.includes('number')) {
      entity.license_number = value
    } else if (header.includes('status')) {
      entity.license_status = value
    } else if (header.includes('registration') || header.includes('date')) {
      entity.registration_date = value
    } else if (header.includes('agent')) {
      entity.registered_agent = value
    } else if (header.includes('address')) {
      entity.address = value
    } else if (header.includes('phone') || header.includes('tel')) {
      entity.contact_phone = value
    } else if (header.includes('email')) {
      entity.contact_email = value
    } else if (header.includes('website') || header.includes('url')) {
      entity.website = value
    }
  }

  return entity.entity_name ? entity : null
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

    const { entity_types, clear_existing } = await req.json()
    const typesToScrape = entity_types || Object.keys(CSV_SOURCES)

    console.log('🔄 Starting BVI FSC scraper...')
    console.log('📋 Entity types to scrape:', typesToScrape)

    let totalInserted = 0
    let totalUpdated = 0
    let totalFailed = 0
    const results: any[] = []

    // Clear existing data if requested
    if (clear_existing) {
      console.log('🗑️  Clearing existing BVI entities...')
      const { error: deleteError } = await supabaseAdmin
        .from('bvi_entities')
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
      if (!CSV_SOURCES[entityType as keyof typeof CSV_SOURCES]) {
        console.log(`⚠️  Unknown entity type: ${entityType}`)
        continue
      }

      const csvUrl = CSV_SOURCES[entityType as keyof typeof CSV_SOURCES]
      console.log(`\n📥 Downloading ${entityType} from ${csvUrl}`)

      try {
        // Download CSV
        const response = await fetch(csvUrl)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const csvText = await response.text()
        console.log(`✅ Downloaded ${csvText.length} bytes`)

        // Parse CSV
        const rows = parseCSV(csvText)
        if (rows.length < 2) {
          console.log('⚠️  No data found in CSV')
          continue
        }

        const headers = rows[0]
        const dataRows = rows.slice(1)
        console.log(`📊 Found ${dataRows.length} records with ${headers.length} columns`)
        console.log(`📋 Headers: ${headers.join(', ')}`)

        // Process each row
        let inserted = 0
        let updated = 0
        let failed = 0

        for (const row of dataRows) {
          const entity = mapCSVToEntity(row, headers, entityType)

          if (!entity) {
            failed++
            continue
          }

          // Insert or update entity
          const { error: upsertError } = await supabaseAdmin
            .from('bvi_entities')
            .upsert({
              ...entity,
              jurisdiction: 'British Virgin Islands',
              scraped_at: new Date().toISOString()
            }, {
              onConflict: 'entity_name,license_number,entity_type',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error(`❌ Error inserting ${entity.entity_name}:`, upsertError.message)
            failed++
          } else {
            inserted++
          }
        }

        results.push({
          entity_type: entityType,
          total_records: dataRows.length,
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
    }

    console.log('\n✅ BVI FSC scraper completed!')
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
