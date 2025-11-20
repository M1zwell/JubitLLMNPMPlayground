-- ===========================================================================
-- HK Financial Data Scraping - Job Tracking & Automation
-- Migration: 20250120150000
-- Purpose: Add job tracking, RPC triggers, and pg_cron scheduling
-- ===========================================================================

-- ===========================================================================
-- 1. Job Tracking Table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job identification
  source TEXT NOT NULL CHECK (source IN (
    'hkex-di',           -- HKEX Disclosure of Interests
    'sfc-rss',           -- SFC RSS Feeds
    'sfc-stats',         -- SFC Statistics Tables
    'ccass'              -- CCASS Shareholding
  )),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed'
  )),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- Result tracking
  records_inserted INTEGER DEFAULT 0 CHECK (records_inserted >= 0),
  records_updated INTEGER DEFAULT 0 CHECK (records_updated >= 0),
  records_failed INTEGER DEFAULT 0 CHECK (records_failed >= 0),

  -- Error handling
  error_message TEXT,
  error_stack TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- User tracking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  duration_ms INTEGER,
  source_url TEXT,

  -- Constraints
  CONSTRAINT valid_timestamps CHECK (
    (started_at IS NULL OR started_at >= created_at) AND
    (completed_at IS NULL OR completed_at >= COALESCE(started_at, created_at))
  ),
  CONSTRAINT completed_requires_started CHECK (
    (completed_at IS NULL) OR (started_at IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_source_status
  ON public.scraping_jobs(source, status);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at
  ON public.scraping_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user
  ON public.scraping_jobs(created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status
  ON public.scraping_jobs(status)
  WHERE status IN ('pending', 'running');

COMMENT ON TABLE public.scraping_jobs IS 'Tracks all HK financial data scraping job executions with real-time status updates';

-- ===========================================================================
-- 2. Row Level Security (RLS)
-- ===========================================================================

ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all jobs
CREATE POLICY "Allow authenticated read on scraping_jobs"
  ON public.scraping_jobs FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create jobs (their own)
CREATE POLICY "Allow authenticated insert on scraping_jobs"
  ON public.scraping_jobs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

-- Service role has full access
CREATE POLICY "Service role full access on scraping_jobs"
  ON public.scraping_jobs FOR ALL
  TO service_role
  USING (true);

-- ===========================================================================
-- 3. RPC Functions for Manual Triggers
-- ===========================================================================

-- Trigger HKEX DI scraping job
CREATE OR REPLACE FUNCTION public.trigger_hkex_di_scrape(
  p_stock_code TEXT,
  p_start_date TEXT DEFAULT NULL,
  p_end_date TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
  v_config JSONB;
BEGIN
  -- Build config
  v_config := jsonb_build_object(
    'stock_code', p_stock_code,
    'start_date', COALESCE(p_start_date, (CURRENT_DATE - INTERVAL '1 year')::TEXT),
    'end_date', COALESCE(p_end_date, CURRENT_DATE::TEXT)
  );

  -- Create job record
  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('hkex-di', v_config, 'pending', auth.uid())
  RETURNING id INTO v_job_id;

  -- Trigger edge function via HTTP
  PERFORM extensions.http((
    'POST',
    current_setting('app.supabase_url', true) || '/functions/v1/hkex-disclosure-scraper',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    v_config::text
  )::extensions.http_request);

  RETURN v_job_id;
END;
$$;

-- Trigger SFC RSS sync job
CREATE OR REPLACE FUNCTION public.trigger_sfc_rss_sync()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Create job record
  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('sfc-rss', '{}'::jsonb, 'pending', auth.uid())
  RETURNING id INTO v_job_id;

  -- Trigger edge function
  PERFORM extensions.http((
    'POST',
    current_setting('app.supabase_url', true) || '/functions/v1/hksfc-rss-sync',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true))
    ],
    'application/json',
    '{}'
  )::extensions.http_request);

  RETURN v_job_id;
END;
$$;

-- Trigger SFC Statistics sync job
CREATE OR REPLACE FUNCTION public.trigger_sfc_stats_sync(
  p_tables TEXT[] DEFAULT ARRAY['A1','A2','A3','C4','C5','D3','D4']
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
  v_config JSONB;
BEGIN
  v_config := jsonb_build_object('tables', p_tables);

  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('sfc-stats', v_config, 'pending', auth.uid())
  RETURNING id INTO v_job_id;

  PERFORM extensions.http((
    'POST',
    current_setting('app.supabase_url', true) || '/functions/v1/sfc-statistics-sync',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    v_config::text
  )::extensions.http_request);

  RETURN v_job_id;
END;
$$;

-- Trigger CCASS scraping job
CREATE OR REPLACE FUNCTION public.trigger_ccass_scrape(
  p_stock_code TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
  v_config JSONB;
BEGIN
  v_config := jsonb_build_object(
    'source', 'ccass',
    'stock_code', p_stock_code,
    'limit', p_limit,
    'use_v2', true
  );

  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('ccass', v_config, 'pending', auth.uid())
  RETURNING id INTO v_job_id;

  PERFORM extensions.http((
    'POST',
    current_setting('app.supabase_url', true) || '/functions/v1/unified-scraper',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)),
      extensions.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    v_config::text
  )::extensions.http_request);

  RETURN v_job_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.trigger_hkex_di_scrape(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sfc_rss_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sfc_stats_sync(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_ccass_scrape(TEXT, INTEGER) TO authenticated;

-- ===========================================================================
-- 4. Statistics & Monitoring Functions
-- ===========================================================================

-- Get job statistics
CREATE OR REPLACE FUNCTION public.get_scraping_stats(
  p_source TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  source TEXT,
  total_jobs BIGINT,
  successful_jobs BIGINT,
  failed_jobs BIGINT,
  running_jobs BIGINT,
  avg_duration_ms NUMERIC,
  total_records_inserted BIGINT,
  total_records_updated BIGINT,
  last_run TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    source,
    COUNT(*)::BIGINT AS total_jobs,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS successful_jobs,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT AS failed_jobs,
    COUNT(*) FILTER (WHERE status = 'running')::BIGINT AS running_jobs,
    AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL)::NUMERIC(10,2) AS avg_duration_ms,
    COALESCE(SUM(records_inserted), 0)::BIGINT AS total_records_inserted,
    COALESCE(SUM(records_updated), 0)::BIGINT AS total_records_updated,
    MAX(completed_at) AS last_run
  FROM public.scraping_jobs
  WHERE created_at >= CURRENT_DATE - p_days
    AND (p_source IS NULL OR source = p_source)
  GROUP BY source
  ORDER BY source;
$$;

GRANT EXECUTE ON FUNCTION public.get_scraping_stats(TEXT, INTEGER) TO authenticated;

-- ===========================================================================
-- 5. pg_cron Scheduled Jobs
-- ===========================================================================

-- Note: These need to be run manually in Supabase SQL Editor after setting config
-- ALTER DATABASE postgres SET app.supabase_url = 'https://[project].supabase.co';
-- ALTER DATABASE postgres SET app.supabase_anon_key = '[anon-key]';

-- Daily SFC RSS Sync (10 AM HKT = 2 AM UTC)
SELECT cron.schedule(
  'daily-sfc-rss-sync',
  '0 2 * * *',
  $$
  SELECT public.trigger_sfc_rss_sync();
  $$
);

-- Weekly SFC Statistics (Sunday 3 AM HKT = Saturday 7 PM UTC)
SELECT cron.schedule(
  'weekly-sfc-stats-sync',
  '0 19 * * 6',
  $$
  SELECT public.trigger_sfc_stats_sync();
  $$
);

-- Weekly HKEX DI for Top 20 Stocks (Sunday 4 AM HKT = Saturday 8 PM UTC)
-- Note: Runs once for each stock using DO block
SELECT cron.schedule(
  'weekly-hkex-di-top-stocks',
  '0 20 * * 6',
  $$
  DO $body$
  DECLARE
    stock TEXT;
  BEGIN
    FOREACH stock IN ARRAY ARRAY['00700','00941','00388','00981','01810','09988','01299','02318','02382','00883']
    LOOP
      PERFORM public.trigger_hkex_di_scrape(stock);
      PERFORM pg_sleep(2); -- Rate limiting
    END LOOP;
  END;
  $body$;
  $$
);

COMMENT ON FUNCTION public.trigger_hkex_di_scrape IS 'Manually trigger HKEX Disclosure of Interests scraping for a stock';
COMMENT ON FUNCTION public.trigger_sfc_rss_sync IS 'Manually trigger SFC RSS feed synchronization';
COMMENT ON FUNCTION public.trigger_sfc_stats_sync IS 'Manually trigger SFC statistics tables synchronization';
COMMENT ON FUNCTION public.trigger_ccass_scrape IS 'Manually trigger CCASS shareholding scraping for a stock';
COMMENT ON FUNCTION public.get_scraping_stats IS 'Get aggregated statistics for scraping jobs';

-- ===========================================================================
-- END OF MIGRATION
-- ===========================================================================
