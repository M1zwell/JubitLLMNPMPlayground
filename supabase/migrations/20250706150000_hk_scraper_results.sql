-- HK Financial Scraper - Database Schema
-- Creates tables for storing web scraping results, cache, and analytics

-- ============================================================================
-- Table: scraping_results
-- Stores all scraping results with metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scraping_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source information
  source_name TEXT NOT NULL,
  source_category TEXT NOT NULL CHECK (source_category IN ('HKEX', 'HKSFC', 'NPM', 'WEBB', 'CUSTOM')),
  source_url TEXT NOT NULL,

  -- Scraping metadata
  scraping_method TEXT NOT NULL CHECK (scraping_method IN ('firecrawl', 'puppeteer')),
  scraping_strategy TEXT NOT NULL CHECK (scraping_strategy IN ('auto', 'firecrawl', 'puppeteer')),

  -- Results
  success BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  record_count INTEGER DEFAULT 0,
  error_message TEXT,

  -- Performance metrics
  execution_time INTEGER, -- milliseconds
  retry_count INTEGER DEFAULT 0,
  cached BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraping_results_user_id ON public.scraping_results(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_results_source_category ON public.scraping_results(source_category);
CREATE INDEX IF NOT EXISTS idx_scraping_results_created_at ON public.scraping_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_results_success ON public.scraping_results(success);
CREATE INDEX IF NOT EXISTS idx_scraping_results_data_gin ON public.scraping_results USING GIN(data);

-- ============================================================================
-- Table: scraping_cache
-- Stores cached scraping results to reduce API calls
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scraping_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache key (hash of URL + options)
  cache_key TEXT UNIQUE NOT NULL,

  -- Cached data
  source_url TEXT NOT NULL,
  data JSONB NOT NULL,
  record_count INTEGER DEFAULT 0,

  -- Cache metadata
  scraping_method TEXT NOT NULL,
  ttl INTEGER NOT NULL DEFAULT 3600, -- Time-to-live in seconds
  hit_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Indexes for cache
CREATE INDEX IF NOT EXISTS idx_scraping_cache_cache_key ON public.scraping_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_scraping_cache_expires_at ON public.scraping_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_scraping_cache_source_url ON public.scraping_cache(source_url);

-- ============================================================================
-- Table: scraping_analytics
-- Stores analytics and metrics for scraping operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scraping_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Time period
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Metrics by source category
  source_category TEXT NOT NULL,

  -- Counters
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  cached_requests INTEGER DEFAULT 0,

  -- Performance
  avg_execution_time INTEGER, -- milliseconds
  total_records_scraped INTEGER DEFAULT 0,

  -- Method distribution
  firecrawl_count INTEGER DEFAULT 0,
  puppeteer_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint on user + date + category
  UNIQUE(user_id, date, source_category)
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_scraping_analytics_user_id ON public.scraping_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_analytics_date ON public.scraping_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_analytics_category ON public.scraping_analytics(source_category);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.scraping_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_analytics ENABLE ROW LEVEL SECURITY;

-- Scraping Results Policies
CREATE POLICY "Users can view their own scraping results"
  ON public.scraping_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scraping results"
  ON public.scraping_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraping results"
  ON public.scraping_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraping results"
  ON public.scraping_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Scraping Cache Policies (public read, authenticated write)
CREATE POLICY "Anyone can read cache"
  ON public.scraping_cache
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert cache"
  ON public.scraping_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cache"
  ON public.scraping_cache
  FOR UPDATE
  TO authenticated
  USING (true);

-- Scraping Analytics Policies
CREATE POLICY "Users can view their own analytics"
  ON public.scraping_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.scraping_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
  ON public.scraping_analytics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for scraping_results
DROP TRIGGER IF EXISTS update_scraping_results_updated_at ON public.scraping_results;
CREATE TRIGGER update_scraping_results_updated_at
  BEFORE UPDATE ON public.scraping_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for scraping_analytics
DROP TRIGGER IF EXISTS update_scraping_analytics_updated_at ON public.scraping_analytics;
CREATE TRIGGER update_scraping_analytics_updated_at
  BEFORE UPDATE ON public.scraping_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.scraping_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment cache hit count
CREATE OR REPLACE FUNCTION increment_cache_hit(cache_key_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.scraping_cache
  SET hit_count = hit_count + 1
  WHERE cache_key = cache_key_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update analytics
CREATE OR REPLACE FUNCTION update_scraping_analytics(
  p_user_id UUID,
  p_category TEXT,
  p_success BOOLEAN,
  p_cached BOOLEAN,
  p_method TEXT,
  p_execution_time INTEGER,
  p_record_count INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.scraping_analytics (
    user_id,
    date,
    source_category,
    total_requests,
    successful_requests,
    failed_requests,
    cached_requests,
    avg_execution_time,
    total_records_scraped,
    firecrawl_count,
    puppeteer_count
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    p_category,
    1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    CASE WHEN p_cached THEN 1 ELSE 0 END,
    p_execution_time,
    CASE WHEN p_success THEN p_record_count ELSE 0 END,
    CASE WHEN p_method = 'firecrawl' THEN 1 ELSE 0 END,
    CASE WHEN p_method = 'puppeteer' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date, source_category)
  DO UPDATE SET
    total_requests = scraping_analytics.total_requests + 1,
    successful_requests = scraping_analytics.successful_requests + CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_requests = scraping_analytics.failed_requests + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    cached_requests = scraping_analytics.cached_requests + CASE WHEN p_cached THEN 1 ELSE 0 END,
    avg_execution_time = (scraping_analytics.avg_execution_time * scraping_analytics.total_requests + p_execution_time) / (scraping_analytics.total_requests + 1),
    total_records_scraped = scraping_analytics.total_records_scraped + CASE WHEN p_success THEN p_record_count ELSE 0 END,
    firecrawl_count = scraping_analytics.firecrawl_count + CASE WHEN p_method = 'firecrawl' THEN 1 ELSE 0 END,
    puppeteer_count = scraping_analytics.puppeteer_count + CASE WHEN p_method = 'puppeteer' THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.scraping_results IS 'Stores web scraping results from HK Financial Scraper';
COMMENT ON TABLE public.scraping_cache IS 'Cache for scraping results to reduce API calls';
COMMENT ON TABLE public.scraping_analytics IS 'Analytics and metrics for scraping operations';

COMMENT ON FUNCTION clean_expired_cache() IS 'Removes expired cache entries, returns count of deleted rows';
COMMENT ON FUNCTION increment_cache_hit(TEXT) IS 'Increments hit count for a cached entry';
COMMENT ON FUNCTION update_scraping_analytics(UUID, TEXT, BOOLEAN, BOOLEAN, TEXT, INTEGER, INTEGER) IS 'Updates daily analytics for scraping operations';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scraping_results TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.scraping_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.scraping_analytics TO authenticated;

-- Grant select to anon for cache
GRANT SELECT ON public.scraping_cache TO anon;

-- ============================================================================
-- Sample Data (Optional - Remove in production)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO public.scraping_results (
  user_id,
  source_name,
  source_category,
  source_url,
  scraping_method,
  scraping_strategy,
  success,
  data,
  record_count,
  execution_time
)
VALUES (
  auth.uid(),
  'HKEX CCASS Sample',
  'HKEX',
  'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx',
  'puppeteer',
  'auto',
  true,
  '{"stockCode": "00700", "participants": [{"id": "C00001", "name": "HSBC Nominees", "shareholding": "1000000"}]}'::jsonb,
  1,
  2500
);
*/
