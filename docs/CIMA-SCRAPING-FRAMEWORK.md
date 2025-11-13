# CIMA Offshore Data Scraping Framework

## Overview

Production-ready scraping framework for Cayman Islands Monetary Authority (CIMA) regulated entities with automated updates and comprehensive monitoring.

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Frontend (CIMAViewer.tsx)              │
│  - Display entities with filtering             │
│  - Export JSON/CSV                              │
│  - Trigger manual updates                       │
│  - Real-time statistics dashboard               │
└────────────────┬────────────────────────────────┘
                 │ Read-only Supabase queries
                 ▼
┌─────────────────────────────────────────────────┐
│        Supabase Database (PostgreSQL)           │
│  - cima_entities (main data)                    │
│  - cima_scrape_logs (monitoring)                │
│  - cima_entity_changes (audit trail)            │
└────────────────▲────────────────────────────────┘
                 │ Write operations
                 │
┌────────────────┴────────────────────────────────┐
│      Edge Function (cima-scraper)               │
│  - Firecrawl V2 API integration                 │
│  - Retry logic with backoff                     │
│  - Content-hash deduplication                   │
│  - Error handling & logging                     │
└────────────────▲────────────────────────────────┘
                 │ HTTPS requests
                 │
┌────────────────┴────────────────────────────────┐
│         Firecrawl V2 Service                    │
│  - Browser automation (bypasses CSRF)           │
│  - JavaScript execution                         │
│  - AI-powered data extraction                   │
│  - Anti-bot stealth mode                        │
└────────────────▲────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────┐
│            CIMA Website                         │
│  https://www.cima.ky/search-entities-cima      │
└─────────────────────────────────────────────────┘
```

## Key Features

### ✅ Implemented
- **Firecrawl V2 Integration**: Bypasses CSRF protection using browser automation
- **Content-Hash Deduplication**: SHA256-based unique identification
- **Retry Logic**: Exponential backoff for rate limiting and errors
- **Multi-Entity Support**: 7 entity type categories, 28+ sub-categories
- **Real-time Updates**: Manual trigger via UI or automated cron jobs
- **Comprehensive Monitoring**: Scrape logs and entity change tracking
- **Export Capabilities**: JSON and CSV export
- **Advanced Filtering**: By type, category, status, agent status
- **Statistics Dashboard**: Total entities, active licenses, last update time

### 📊 Data Coverage

- **Entity Types**:
  1. Banking, Financing and Money Services
  2. Trust & Corporate Services Providers (7 sub-categories)
  3. Insurance (multiple types)
  4. Investment Business
  5. Insolvency Practitioners
  6. Registered Agents
  7. Virtual Assets Service Providers (VASP)

- **Expected Records**: 1,000-5,000 entities
- **Update Frequency**:
  - **Weekly**: All entity types (Monday 2 AM UTC)
  - **Daily**: VASP only (3 AM UTC)
  - **Monthly**: Comprehensive sync (1st of month, 1 AM UTC)

## Technical Implementation

### Edge Function: `cima-scraper`

**Location**: `supabase/functions/cima-scraper/index.ts`

**Key Components**:
```typescript
// Firecrawl V2 scraping with browser actions
async function scrapeCIMAEntities(entityType: string, category?: string)

// Retry with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3)

// Generate SHA256 content hash for deduplication
function generateContentHash(entityName: string, licenseNumber: string, entityType: string)

// Parse HTML table results
function parseEntitiesFromHTML(html: string, markdown: string, entityType: string, category?: string)
```

**API Endpoint**: `POST /functions/v1/cima-scraper`

**Request Body**:
```json
{
  "entity_types": ["Banking, Financing and Money Services", "Virtual Assets Service Providers"],
  "trust_categories": ["Class I Trust Licences - Registered Agent Status"],
  "clear_existing": false
}
```

**Response**:
```json
{
  "success": true,
  "total_inserted": 1234,
  "total_updated": 56,
  "total_failed": 2,
  "results": [
    {
      "entity_type": "Banking, Financing and Money Services",
      "total_records": 45,
      "inserted": 45,
      "updated": 0,
      "failed": 0
    }
  ],
  "timestamp": "2025-11-13T10:00:00.000Z"
}
```

### Database Schema

#### `cima_entities` Table
```sql
CREATE TABLE cima_entities (
  id BIGSERIAL PRIMARY KEY,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_category TEXT,
  license_number TEXT,
  license_status TEXT,
  registration_date DATE,
  expiry_date DATE,
  registered_agent_status BOOLEAN,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  jurisdiction TEXT DEFAULT 'Cayman Islands',
  content_hash TEXT NOT NULL UNIQUE,  -- SHA256 for deduplication
  additional_info JSONB,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `cima_scrape_logs` Table
```sql
CREATE TABLE cima_scrape_logs (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT,
  entity_category TEXT,
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  records_found INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  duration_ms INT,
  error_message TEXT,
  firecrawl_credits_used INT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);
```

#### `cima_entity_changes` Table
```sql
CREATE TABLE cima_entity_changes (
  id BIGSERIAL PRIMARY KEY,
  entity_id BIGINT REFERENCES cima_entities(id),
  entity_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_type TEXT CHECK (change_type IN ('created', 'updated', 'status_change', 'deleted'))
);
```

### Automated Scheduling

**Supabase Cron Jobs** (configure in SQL Editor):

```sql
-- Weekly full sync (Mondays 2 AM UTC)
SELECT cron.schedule(
  'cima-weekly-full-sync',
  '0 2 * * 1',
  $$
  SELECT net.http_post(
    url:='https://YOUR-PROJECT.supabase.co/functions/v1/cima-scraper',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR-SERVICE-KEY"}'::jsonb,
    body:='{"entity_types": ["all"]}'::jsonb
  );
  $$
);

-- Daily VASP sync (3 AM UTC)
SELECT cron.schedule(
  'cima-daily-vasp-sync',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR-PROJECT.supabase.co/functions/v1/cima-scraper',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR-SERVICE-KEY"}'::jsonb,
    body:='{"entity_types": ["Virtual Assets Service Providers"]}'::jsonb
  );
  $$
);
```

## Frontend Integration

### CIMAViewer Component

**Location**: `src/components/CIMAViewer.tsx`

**Features**:
- Entity listing with pagination
- Multi-field filtering (type, category, status, agent)
- Search by name, license number, address
- Sort by name, type, status
- Export to JSON/CSV
- Manual update trigger
- Real-time statistics dashboard
- Responsive design

**Statistics Displayed**:
- Total Entities
- Filtered Results
- Active Licenses
- Entity Types Count
- Last Updated Date/Time

**Usage in OffshoreDataHub**:
```tsx
import CIMAViewer from './CIMAViewer';

<CIMAViewer />
```

## Cost Analysis

### Firecrawl V2 Pricing
- **Per scrape**: ~$0.006 (6 credits with stealth mode)
- **Full sync** (7 entity types): ~$0.042
- **Weekly sync**: ~$0.17/month
- **Daily VASP**: ~$0.18/month
- **Total estimated**: **< $1/month**

### Performance
- **Full sync duration**: 5-10 minutes
- **Single entity type**: 20-30 seconds
- **Success rate**: >95% (with retries)
- **Database queries**: <100ms

## Deployment Steps

### 1. Database Migrations
```bash
# Run migrations in order
cd supabase/migrations
supabase db push

# Or via Supabase Dashboard > SQL Editor:
# - 20251113_add_cima_content_hash.sql
# - 20251113_create_cima_monitoring_tables.sql
```

### 2. Edge Function Deployment
```bash
# Set environment variable
supabase secrets set FIRECRAWL_API_KEY=fc-YOUR-API-KEY

# Deploy function
supabase functions deploy cima-scraper
```

### 3. Configure Cron Jobs
```bash
# Via Supabase Dashboard > Database > Cron Jobs
# Or run SQL from: 20251113_create_cima_cron_jobs.sql
```

### 4. Test Manual Trigger
```bash
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/cima-scraper \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-SERVICE-KEY" \
  -d '{"entity_types": ["Banking, Financing and Money Services"]}'
```

### 5. Frontend Deployment
```bash
npm run build
netlify deploy --prod
```

## Monitoring & Maintenance

### Check Scrape Logs
```sql
SELECT * FROM cima_scrape_logs
ORDER BY started_at DESC
LIMIT 10;
```

### View Recent Changes
```sql
SELECT * FROM cima_entity_changes
ORDER BY changed_at DESC
LIMIT 20;
```

### Monitor Success Rate
```sql
SELECT
  status,
  COUNT(*) as count,
  AVG(duration_ms) as avg_duration,
  SUM(records_inserted) as total_inserted
FROM cima_scrape_logs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

### Check Data Freshness
```sql
SELECT
  entity_type,
  COUNT(*) as count,
  MAX(scraped_at) as last_scraped
FROM cima_entities
GROUP BY entity_type
ORDER BY entity_type;
```

## Troubleshooting

### Issue: Firecrawl Returns Empty Results
**Cause**: CIMA website structure changed
**Solution**: Update HTML parsing logic in `parseEntitiesFromHTML()`

### Issue: Rate Limiting (429 errors)
**Cause**: Too many requests to Firecrawl
**Solution**: Increase delays between entity types (currently 1-3 seconds)

### Issue: CSRF Token Errors
**Cause**: Firecrawl not executing JavaScript properly
**Solution**: Check `actions` array in scraping function, ensure `execute_js` script is correct

### Issue: Duplicate Entities
**Cause**: Content hash collision or logic error
**Solution**: Check `generateContentHash()` function, verify unique constraint

## Security & Compliance

### Data Source
- ✅ **Public regulatory data**: CIMA entities are publicly accessible
- ⚠️ **Terms of Use**: Review https://www.cima.ky/terms-of-use

### Best Practices
- Respectful rate limiting (3-5 second delays)
- User-Agent identification
- No commercial use without permission
- Proper attribution of data source

### RLS Policies
- **Read**: Public access to all tables
- **Write**: Service role only for `cima_entities`
- **Insert**: Authenticated users for logs/changes

## Future Enhancements

### Planned
- [ ] Email alerts for entity status changes
- [ ] Historical trend charts (entity growth over time)
- [ ] BVI data integration (British Virgin Islands)
- [ ] Webhook notifications for new entities
- [ ] API endpoint for third-party integrations
- [ ] Advanced search with regex support
- [ ] Entity comparison tool
- [ ] Automated report generation

### Under Consideration
- [ ] OCR for PDF license documents
- [ ] Relationship mapping (linked entities)
- [ ] Sentiment analysis on regulatory news
- [ ] Multi-jurisdiction correlation

## Support & Contact

For questions or issues:
1. Check Supabase logs: Database > Logs
2. Review Edge Function logs: Functions > cima-scraper > Logs
3. Verify Firecrawl credit balance: https://firecrawl.dev/dashboard

---

**Last Updated**: 2025-11-13
**Version**: 1.0.0
**Author**: CIMA Scraping Framework Team
