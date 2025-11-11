# HK Data Pipeline

Automated web scraping and data processing module for Hong Kong financial data (HKEX, HKSFC), NPM packages, and LLM models.

## Overview

This module provides intelligent data collection, storage, querying, and reporting capabilities for:
- **HKEX** - Hong Kong Stock Exchange (CCASS shareholding data, announcements)
- **HKSFC** - Securities & Futures Commission (regulatory filings, news)
- **NPM** - Node Package Manager (package metadata, GitHub stats)
- **LLM Models** - AI model data from artificialanalysis.ai (500+ models, pricing, performance)

### Key Features

- ✅ **Automated Daily Scraping** - Set it and forget it
- ✅ **On-Demand Queries** - Scrape specific stocks or search historical data
- ✅ **Email Alerts** - Get notified of scraping status and anomalies
- ✅ **Intelligent Deduplication** - SHA-256 content hashing prevents duplicates
- ✅ **Multi-Agent Architecture** - Specialized agents for collection, reporting, and querying
- ✅ **CSV/JSON Exports** - Download data in multiple formats
- ✅ **Trend Analysis** - Compare data across time periods

## Installation

```bash
# From BMAD installer
bmad install hk-data-pipeline
```

During installation, you'll be prompted for:
- Email address for alerts
- Stock codes to track (default: 00700, 00005, 00388)
- Data sources to enable (HKEX, HKSFC, NPM, LLM)
- Daily scraping schedule

## Components

### Agents (1 of 3 implemented)

#### 1. Data Collector Agent (`data-collector`)
**Status:** ✅ Implemented

Scraping specialist for all data sources.

**Commands:**
- `/scrape-all` - Scrape all enabled sources
- `/scrape-hkex [codes]` - Targeted HKEX scraping
- `/scrape-hksfc` - HKSFC filings and news
- `/scrape-npm` - NPM package data
- `/scrape-llm` - LLM model data from artificialanalysis.ai
- `/check-status` - View recent activity
- `/retry-failed` - Retry failed scrapes
- `/test-connection` - Test all APIs and sources

**Capabilities:**
- Handles rate limits gracefully (3s HKEX delays)
- Clear success/failure reporting
- Deduplication tracking
- Error context and recommendations
- Execution time metrics

#### 2. Report Generator Agent (`report-generator`)
**Status:** 📝 Planned

Transforms scraped data into insights and exports.

**Planned Commands:**
- `/daily-report` - Generate scraping summary
- `/export-csv [source] [dates]` - Export to CSV
- `/email-report [to]` - Send formatted report
- `/trends` - Pattern analysis
- `/compare [date1] [date2]` - Time comparisons

#### 3. Data Query Agent (`data-query`)
**Status:** 📝 Planned

Search and discovery across all scraped data.

**Planned Commands:**
- `/stock [code]` - Find everything about a stock
- `/search [keyword]` - Full-text search
- `/recent` - Latest data
- `/today` / `/this-week` - Time-based queries
- `/npm-search [keyword]` - NPM package search
- `/filter [criteria]` - Custom filters

### Workflows (1 of 3 implemented)

#### 1. Daily Scraping (`daily-scraping`)
**Status:** ✅ Implemented

Automated batch scraping of all enabled sources with email reporting.

**Features:**
- Scrapes all enabled sources (HKEX, HKSFC, NPM, LLM)
- Respects stock limits and date windows
- Calculates failure rates
- Sends email summary
- Alerts on critical failures

**Triggers:**
- Manual execution via agent or BMad Builder
- Cron job / GitHub Actions (scheduled)
- External automation tools

#### 2. On-Demand Query (`on-demand-query`)
**Status:** 📝 Planned

Interactive workflow for ad-hoc data scraping and analysis.

#### 3. Report Generation (`generate-report`)
**Status:** 📝 Planned

Workflow for creating comprehensive reports from scraped data.

### Tasks

**Status:** No standalone tasks planned yet

## Quick Start

### 1. Load the Data Collector Agent

```
/bmad:hk-data-pipeline:agents:data-collector
```

### 2. Test Connection

```
*test-connection
```

### 3. Scrape All Sources

```
*scrape-all
```

### 4. Check Status

```
*check-status
```

### 5. Run Daily Scraping Workflow

```
/bmad:hk-data-pipeline:workflows:daily-scraping
```

## Module Structure

```
hk-data-pipeline/
├── agents/
│   └── data-collector.yaml         ✅ Scraping specialist
├── workflows/
│   └── daily-scraping/             ✅ Automated batch workflow
│       ├── workflow.yaml
│       └── instructions.md
├── tasks/                           (empty - none needed yet)
├── templates/                       (shared templates if needed)
├── data/                            (runtime data storage)
├── _module-installer/
│   └── install-config.yaml         ✅ Installation configuration
└── README.md                        ✅ This file
```

## Configuration

After installation, configure in `bmad/hk-data-pipeline/config.yaml`:

### Key Settings

```yaml
# Alert Email
alert_email: "your@email.com"

# Tracked Stock Codes (max 10)
tracked_stocks: "00700,00005,00388"

# Enabled Data Sources
enabled_sources: ["hkex", "hksfc", "npm", "llm"]

# Scraping Schedule
scraping_schedule: "09:00"  # 24-hour format

# Alert Thresholds
failure_threshold: "20"      # Warning if >20% fail
critical_hours: "24"         # Critical if no scrape in 24h

# Constraints
max_stocks: "10"             # Maximum stocks per scrape
days_window: "10"            # Days of history per scrape
```

## Data Sources

### HKEX (Hong Kong Stock Exchange)
- **URL:** https://www.hkex.com.hk
- **Data:** CCASS shareholding, announcements
- **Method:** Firecrawl with form submission
- **Rate Limit:** 3 seconds between stocks
- **Storage:** `hkex_announcements` table

### HKSFC (Securities & Futures Commission)
- **URL:** https://apps.sfc.hk
- **Data:** Regulatory filings, news, enforcement actions
- **Method:** Firecrawl with JavaScript rendering
- **Storage:** `hksfc_filings` table

### NPM (Node Package Manager)
- **URL:** https://registry.npmjs.org
- **Data:** Package metadata, GitHub stats, categories
- **Method:** NPM Registry API + GitHub API
- **Storage:** `npm_packages` table

### LLM Models (AI Model Leaderboard)
- **URL:** https://artificialanalysis.ai
- **Data:** 500+ AI models with pricing, performance metrics, quality index
- **Providers:** OpenAI, Google, Anthropic, DeepSeek, Meta, xAI, Alibaba, Mistral, Cohere, Amazon, and more
- **Metrics:** Input/output pricing, context window, speed, quality index, features
- **Method:** Firecrawl API (scraping) + Edge Function processing
- **Storage:** `llm_models` table
- **Updates:** Daily updates with model categorization (reasoning, coding, multimodal, lightweight, budget)

## Architecture

```
┌─────────────────────────────────────┐
│  Data Collector Agent               │
│  (Manual triggers, ad-hoc scraping) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Daily Scraping Workflow            │
│  (Automated scheduled execution)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Supabase Edge Functions            │
│  - scrape-orchestrator              │
│  - unified-scraper                  │
│  - npm-import                       │
│  - llm-update                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Firecrawl API                      │
│  (Primary scraping engine)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PostgreSQL Database (Supabase)     │
│  - hkex_announcements               │
│  - hksfc_filings                    │
│  - npm_packages                     │
│  - llm_models                       │
│  (SHA-256 deduplication)            │
└─────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Outputs                            │
│  - Email reports (yying2010@...)    │
│  - CSV exports                      │
│  - Dashboard UI (HK Scraper)        │
│  - API queries                      │
└─────────────────────────────────────┘
```

## Examples

### Example 1: Daily Automated Scraping

```bash
# Set up cron job or GitHub Actions to run:
bmad workflow hk-data-pipeline/daily-scraping

# Or use Data Collector Agent:
/bmad:hk-data-pipeline:agents:data-collector
*scrape-all
```

**Result:** All enabled sources scraped, email report sent

### Example 2: Query Specific Stock

```bash
/bmad:hk-data-pipeline:agents:data-collector
*scrape-hkex 00700
```

**Result:** Tencent (00700) CCASS data scraped on-demand

### Example 3: Check Recent Activity

```bash
/bmad:hk-data-pipeline:agents:data-collector
*check-status
```

**Result:** Table showing last scrape times and record counts

## Development Roadmap

### Phase 1: Core Foundation ✅
- [x] Module structure
- [x] Installation configuration
- [x] Data Collector Agent
- [x] Daily Scraping Workflow
- [x] Documentation

### Phase 2: Enhanced Capabilities 📝
- [ ] Report Generator Agent
- [ ] Data Query Agent
- [ ] On-Demand Query Workflow
- [ ] Report Generation Workflow
- [ ] Email integration (SMTP/SendGrid)
- [ ] Dashboard UI fixes

### Phase 3: Advanced Features 🔮
- [ ] Trend analysis and pattern detection
- [ ] Anomaly detection and alerts
- [ ] Multi-user support
- [ ] API endpoints for external access
- [ ] Webhook integrations
- [ ] Historical backfill capabilities
- [ ] Increase stock limit beyond 10
- [ ] Additional data sources

## Quick Commands

Create new components:

```bash
# Create new agent
/bmad:bmb:workflows:create-agent

# Create new workflow
/bmad:bmb:workflows:create-workflow
```

## Troubleshooting

### Scraping Fails Consistently

1. Check Firecrawl API key in config
2. Test connection: `*test-connection`
3. Check Supabase logs for errors
4. Verify rate limits not exceeded

### No Email Reports Received

- Email sending requires SMTP configuration
- Currently displays email content (not sent)
- Configure email service in future release

### HK Scraper UI Not Working

- Known issue from project setup
- Workaround: Use Data Collector Agent commands
- UI fix planned in Phase 2

## Contributing

To extend this module:

1. Add new agents: `/bmad:bmb:workflows:create-agent`
2. Add new workflows: `/bmad:bmb:workflows:create-workflow`
3. Update documentation
4. Test with real data
5. Share improvements!

## Technical Details

### Dependencies

- **Supabase** - Database and Edge Functions
- **Firecrawl API** - Web scraping engine
- **PostgreSQL** - Data storage with full-text search
- **BMad Core** - Agent and workflow framework

### Data Storage

- **Deduplication:** SHA-256 content hashing
- **Full-Text Search:** PostgreSQL tsvector
- **Indexes:** Date, company code, filing type
- **Retention:** Unlimited (user-managed)

### Performance

- **Expected Volume:** 250-400 records/day (with LLM model updates)
- **Storage Growth:** ~60-120 MB/month
- **Query Performance:** <1 second for most queries
- **Scraping Time:** 5-20 minutes per daily batch

## Support

- **Documentation:** This README
- **Brainstorming Notes:** `docs/brainstorming-session-results-2025-11-11.md`
- **Module Builder:** `/bmad:bmb:agents:bmad-builder`

## Author

Created by BMad on 2025-11-11

**Module Version:** 1.0.0
**BMAD Version:** 6.0.0-alpha.6

---

_Part of the BMAD Method ecosystem_
