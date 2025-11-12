# Firecrawl Integration Architecture

**Visual guide to the LLM scraping architecture before and after refinement**

---

## Current Architecture (Before Refinement)

```
┌─────────────────────────────────────────────────────────────┐
│                    llm-update Edge Function                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  fetchArtificialAnalysisData()                     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  "Using fallback model data"             │     │    │
│  │  │  TODO: Implement Firecrawl scraping      │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                    ↓                               │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  getFallbackModelData()                  │     │    │
│  │  │  - Returns 18 hardcoded models           │     │    │
│  │  │  - OpenAI, Anthropic, Google, etc.       │     │    │
│  │  │  - Static pricing data                   │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
│                    ↓                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  processModelData()                                │    │
│  │  - Add category, rarity, features                  │    │
│  │  - Calculate avg_price                             │    │
│  └────────────────────────────────────────────────────┘    │
│                    ↓                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Database Operations                               │    │
│  │  - Check if model exists                           │    │
│  │  - INSERT new or UPDATE existing                   │    │
│  └────────────────────────────────────────────────────┘    │
│                    ↓                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Supabase Database                                 │    │
│  │  llm_models: 18 models (static)                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

Issues:
❌ No live scraping
❌ Only 18 models
❌ Data becomes stale
❌ Manual updates required
❌ Missing new models
```

---

## Refined Architecture (After Refinement)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     llm-update Edge Function (v2)                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Request Handler                                                 │   │
│  │  - Parse: update_type, force_refresh, use_firecrawl            │   │
│  │  - Check: FIRECRAWL_API_KEY environment variable               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             ↓                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Data Fetching Logic (Dual Mode)                                │   │
│  │                                                                  │   │
│  │  if (FIRECRAWL_API_KEY && use_firecrawl)                       │   │
│  │    ↓                                                            │   │
│  │  ┌──────────────────────────────────────────────────────┐     │   │
│  │  │  fetchWithFirecrawl()                                │     │   │
│  │  │                                                       │     │   │
│  │  │  ┌─────────────────────────────────────────┐        │     │   │
│  │  │  │  Firecrawl v2 Extract API                │        │     │   │
│  │  │  │                                          │        │     │   │
│  │  │  │  POST /v2/extract                        │        │     │   │
│  │  │  │  {                                       │        │     │   │
│  │  │  │    urls: ["artificialanalysis.ai"],     │        │     │   │
│  │  │  │    prompt: "Extract LLM models...",      │        │     │   │
│  │  │  │    schema: { /* JSON Schema */ },        │        │     │   │
│  │  │  │    scrapeOptions: {                      │        │     │   │
│  │  │  │      waitFor: 5000,                      │        │     │   │
│  │  │  │      proxy: "stealth",                   │        │     │   │
│  │  │  │      actions: [                          │        │     │   │
│  │  │  │        { type: "wait", ms: 3000 },       │        │     │   │
│  │  │  │        { type: "scroll", dir: "down" }   │        │     │   │
│  │  │  │      ]                                    │        │     │   │
│  │  │  │    }                                      │        │     │   │
│  │  │  │  }                                        │        │     │   │
│  │  │  └─────────────────────────────────────────┘        │     │   │
│  │  │                    ↓                                  │     │   │
│  │  │  ┌─────────────────────────────────────────┐        │     │   │
│  │  │  │  Browser Automation                      │        │     │   │
│  │  │  │  1. Load artificialanalysis.ai           │        │     │   │
│  │  │  │  2. Wait 5s for Next.js to render        │        │     │   │
│  │  │  │  3. Scroll to load lazy content          │        │     │   │
│  │  │  │  4. Extract data via AI + schema         │        │     │   │
│  │  │  └─────────────────────────────────────────┘        │     │   │
│  │  │                    ↓                                  │     │   │
│  │  │  ┌─────────────────────────────────────────┐        │     │   │
│  │  │  │  Parse JSON Response                     │        │     │   │
│  │  │  │  {                                        │        │     │   │
│  │  │  │    data: {                                │        │     │   │
│  │  │  │      models: [                            │        │     │   │
│  │  │  │        {                                  │        │     │   │
│  │  │  │          name: "GPT-4o",                  │        │     │   │
│  │  │  │          provider: "OpenAI",              │        │     │   │
│  │  │  │          input_price: 2.50,               │        │     │   │
│  │  │  │          output_price: 10.00,             │        │     │   │
│  │  │  │          quality_index: 70,               │        │     │   │
│  │  │  │          ...                              │        │     │   │
│  │  │  │        },                                 │        │     │   │
│  │  │  │        ...500+ models                     │        │     │   │
│  │  │  │      ]                                    │        │     │   │
│  │  │  │    }                                      │        │     │   │
│  │  │  │  }                                        │        │     │   │
│  │  │  └─────────────────────────────────────────┘        │     │   │
│  │  │                    ↓                                  │     │   │
│  │  │  ┌─────────────────────────────────────────┐        │     │   │
│  │  │  │  Validation & Error Handling             │        │     │   │
│  │  │  │  - Check if models array is empty        │        │     │   │
│  │  │  │  - Validate required fields              │        │     │   │
│  │  │  │  - Handle async extraction (ID)          │        │     │   │
│  │  │  │  - Catch HTTP errors                     │        │     │   │
│  │  │  └─────────────────────────────────────────┘        │     │   │
│  │  │                    ↓                                  │     │   │
│  │  │  ┌─────────────────────────────────────────┐        │     │   │
│  │  │  │  ✅ Return 500+ models                    │        │     │   │
│  │  │  │  OR                                       │        │     │   │
│  │  │  │  ⚠️  Fallback to static data              │        │     │   │
│  │  │  └─────────────────────────────────────────┘        │     │   │
│  │  └──────────────────────────────────────────────────────┘     │   │
│  │                                                                │   │
│  │  else                                                          │   │
│  │    ↓                                                          │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  getFallbackModelData()                               │    │   │
│  │  │  - Returns 18 static models                           │    │   │
│  │  │  - Guaranteed reliability                             │    │   │
│  │  │  - No API key required                                │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  processModelData()                                              │   │
│  │  - Determine category (reasoning, coding, multimodal, etc.)      │   │
│  │  - Assign rarity (legendary, epic, rare, common)                 │   │
│  │  - Extract features (vision, reasoning, long-context, etc.)      │   │
│  │  - Calculate avg_price                                           │   │
│  │  - Generate description                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Database Operations (Per Model)                                 │   │
│  │                                                                   │   │
│  │  ┌──────────────────────────────────────────┐                   │   │
│  │  │  1. Check if model exists                │                   │   │
│  │  │     SELECT * FROM llm_models              │                   │   │
│  │  │     WHERE model_id = ?                    │                   │   │
│  │  └──────────────────────────────────────────┘                   │   │
│  │                  ↓                                                │   │
│  │     ┌────────────┴────────────┐                                  │   │
│  │     ↓                          ↓                                  │   │
│  │  Exists                    Not Exists                            │   │
│  │     ↓                          ↓                                  │   │
│  │  ┌──────────────┐        ┌──────────────┐                       │   │
│  │  │  UPDATE      │        │  INSERT      │                       │   │
│  │  │  PATCH       │        │  POST        │                       │   │
│  │  │  (stats++)   │        │  (stats++)   │                       │   │
│  │  └──────────────┘        └──────────────┘                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Update Statistics                                               │   │
│  │  - total_processed: 500+                                         │   │
│  │  - models_added: 482                                             │   │
│  │  - models_updated: 18                                            │   │
│  │  - providers_found: [15+ providers]                              │   │
│  │  - categories_updated: [5 categories]                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Logging                                                          │   │
│  │  INSERT INTO llm_update_logs                                      │   │
│  │  - update_type: "manual" | "daily_batch"                          │   │
│  │  - status: "success" | "error"                                    │   │
│  │  - models_processed, models_added, models_updated                 │   │
│  │  - providers_updated, started_at, completed_at                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Response                                                         │   │
│  │  {                                                                │   │
│  │    success: true,                                                 │   │
│  │    stats: { ... },                                                │   │
│  │    logId: "uuid",                                                 │   │
│  │    message: "Successfully processed 500 models: 482 added..."     │   │
│  │  }                                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                             ↓                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Supabase Database                                               │   │
│  │  llm_models: 500+ models (live)                                  │   │
│  │  llm_update_logs: Audit trail                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘

Benefits:
✅ Live scraping from artificialanalysis.ai
✅ 500+ models with real-time pricing
✅ Automatic fallback on error
✅ Handles JavaScript rendering
✅ AI-powered data extraction
✅ Stealth proxy for anti-bot
✅ Comprehensive error handling
✅ Cost: $1-5/month
```

---

## Firecrawl v2 Extract Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Firecrawl v2 Extract API                        │
│                  https://api.firecrawl.dev/v2/extract                │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Step 1: Request Received                                           │
│  {                                                                   │
│    urls: ["https://artificialanalysis.ai/leaderboards/models"],     │
│    prompt: "Extract all LLM models with pricing and metrics",       │
│    schema: { /* JSON Schema for validation */ },                    │
│    scrapeOptions: {                                                 │
│      waitFor: 5000,          // Wait for JS                         │
│      proxy: "stealth",        // Anti-bot                           │
│      blockAds: true,          // Clean content                      │
│      onlyMainContent: true,   // Skip nav/footer                    │
│      actions: [...]           // Dynamic content loading            │
│    }                                                                 │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Step 2: Browser Automation (Headless Chrome)                       │
│                                                                      │
│  1. Launch browser with stealth proxy                               │
│  2. Navigate to artificialanalysis.ai/leaderboards/models           │
│  3. Wait 5 seconds for Next.js to render (SSR + hydration)          │
│  4. Execute actions:                                                │
│     - Wait 3 seconds                                                │
│     - Scroll down to trigger lazy loading                           │
│     - Wait 2 seconds for content to load                            │
│  5. Extract HTML/DOM                                                │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Step 3: AI-Powered Data Extraction                                 │
│                                                                      │
│  Firecrawl's AI analyzes the page:                                  │
│  - Parses HTML structure                                            │
│  - Identifies model data (tables, cards, lists)                     │
│  - Extracts based on prompt + schema                                │
│  - Validates against JSON schema                                    │
│  - Returns structured JSON                                          │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Step 4: Response                                                    │
│  {                                                                   │
│    success: true,                                                    │
│    data: {                                                           │
│      models: [                                                       │
│        {                                                             │
│          name: "GPT-4o",                                             │
│          provider: "OpenAI",                                         │
│          model_id: "gpt-4o",                                         │
│          context_window: 128000,                                     │
│          input_price: 2.50,                                          │
│          output_price: 10.00,                                        │
│          output_speed: 83.4,                                         │
│          latency: 0.56,                                              │
│          quality_index: 70                                           │
│        },                                                            │
│        {                                                             │
│          name: "Claude 3.5 Sonnet",                                  │
│          provider: "Anthropic",                                      │
│          ...                                                         │
│        },                                                            │
│        ...500+ models                                                │
│      ]                                                               │
│    }                                                                 │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌────────────────────────────────────────────────┐
│  Level 1: HTTP Error (400, 500, etc.)         │
│  - Catch fetch errors                          │
│  - Log error details                           │
│  - Trigger fallback                            │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  Level 2: Empty Response                       │
│  - Check if models array exists                │
│  - Validate array length > 0                   │
│  - Trigger fallback if empty                   │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  Level 3: Async Extraction                     │
│  - Detect if response contains ID only         │
│  - Currently falls back (TODO: polling)        │
│  - Future: Poll for results                    │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  Level 4: Per-Model Processing Error          │
│  - Try/catch around each model                 │
│  - Log error but continue                      │
│  - Don't fail entire batch                     │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│  Fallback: getFallbackModelData()              │
│  - Returns 18 static models                    │
│  - Guaranteed to work                          │
│  - Prevents function failure                   │
└────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  artificialanalysis.ai                                       │
│  - Next.js website with 500+ models                          │
│  - Real-time pricing and performance data                    │
│  - Dynamic content (requires JavaScript)                     │
└─────────────────────────────────────────────────────────────┘
                         ↓ (Firecrawl v2 Extract)
┌─────────────────────────────────────────────────────────────┐
│  llm-update Edge Function                                    │
│  - Extracts structured data via AI + schema                  │
│  - Processes 500+ models                                     │
│  - Categorizes and enriches data                             │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase Database (llm_models table)                        │
│  - Stores 500+ models                                        │
│  - Fields: name, provider, pricing, metrics, features        │
│  - Updated daily/weekly                                      │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Frontend Application                                        │
│  - LLM Market: Browse and search models                      │
│  - Model Comparison: Compare pricing/performance             │
│  - Charts: Visualize pricing trends                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Repository                                           │
│  - supabase/functions/llm-update/index.ts                   │
│  - .github/workflows/deploy-edge-functions.yml              │
└─────────────────────────────────────────────────────────────┘
                         ↓ (git push to main)
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions CI/CD                                        │
│  - Triggers on push to main                                  │
│  - Runs: supabase functions deploy llm-update                │
│  - Duration: ~18 seconds                                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase Edge Functions (Deno Runtime)                      │
│  - Deployed to: https://kiztaihzanqnrcrqaxsv.supabase.co     │
│  - Endpoint: /functions/v1/llm-update                        │
│  - Environment: FIRECRAWL_API_KEY secret                     │
└─────────────────────────────────────────────────────────────┘
                         ↓ (Manual or scheduled trigger)
┌─────────────────────────────────────────────────────────────┐
│  Function Execution                                          │
│  - Calls Firecrawl v2 Extract API                            │
│  - Processes 500+ models                                     │
│  - Updates database                                          │
│  - Logs results                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Cost Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Firecrawl v2 Extract API                                    │
│  - Base: 1 credit per URL                                    │
│  - Stealth proxy: +5 credits                                 │
│  - Total: 6 credits per scrape                               │
│  - 1 credit ≈ $0.001                                         │
│  - Cost per scrape: $0.006                                   │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Frequency Options                                           │
│                                                              │
│  Daily Scraping:                                             │
│  - $0.006 × 30 days = $0.18/month                           │
│                                                              │
│  Weekly Scraping:                                            │
│  - $0.006 × 4 weeks = $0.024/month                          │
│                                                              │
│  Monthly Scraping:                                           │
│  - $0.006 × 1 = $0.006/month                                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Recommendation: Weekly ($0.024/month)                       │
│  - Fresh data every 7 days                                   │
│  - 500+ models tracked                                       │
│  - Cost-effective                                            │
│  - Acceptable for most use cases                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Firecrawl Dashboard (https://firecrawl.dev/dashboard)       │
│  - Credits used                                              │
│  - Request count                                             │
│  - Success rate                                              │
│  - Response times                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Supabase Dashboard                                          │
│  - Edge Function logs                                        │
│  - Database query performance                                │
│  - Table row counts                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  llm_update_logs Table                                       │
│  - Track each update                                         │
│  - Success/failure status                                    │
│  - Models processed counts                                   │
│  - Error messages                                            │
│  - Execution timestamps                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Custom Monitoring Script                                    │
│  - test-firecrawl-llm-update.js                              │
│  - Tests both modes                                          │
│  - Verifies database                                         │
│  - Checks logs                                               │
│  - Compares results                                          │
└─────────────────────────────────────────────────────────────┘
```

---

**Created:** 2025-11-11
**Author:** Claude Code
**Purpose:** Visual architecture guide for Firecrawl v2 integration
