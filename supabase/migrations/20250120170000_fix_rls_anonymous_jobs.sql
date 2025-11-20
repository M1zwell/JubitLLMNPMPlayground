-- Fix RLS Policy for Anonymous Job Creation
-- This migration allows RPC functions to create jobs even when called by anonymous users
-- Issue: auth.uid() returns NULL for anonymous users, causing insert failures

-- ===========================================================================
-- Option 1: Update RPC functions to allow NULL created_by
-- ===========================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.trigger_ccass_scrape(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.trigger_sfc_rss_sync();
DROP FUNCTION IF EXISTS public.trigger_sfc_stats_sync(TEXT[]);
DROP FUNCTION IF EXISTS public.trigger_hkex_di_scrape(TEXT, TEXT, TEXT);

-- Recreate with COALESCE to handle NULL auth.uid()
-- Using '00000000-0000-0000-0000-000000000000' as placeholder for anonymous users

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
  v_user_id UUID;
BEGIN
  -- Handle anonymous users (NULL auth.uid())
  v_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);

  v_config := jsonb_build_object(
    'source', 'ccass',
    'stock_code', p_stock_code,
    'limit', p_limit,
    'use_v2', true
  );

  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('ccass', v_config, 'pending', v_user_id)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_sfc_rss_sync()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);

  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('sfc-rss', '{}'::jsonb, 'pending', v_user_id)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

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
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);
  v_config := jsonb_build_object('tables', p_tables);

  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('sfc-stats', v_config, 'pending', v_user_id)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

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
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);

  v_config := jsonb_build_object(
    'stock_code', p_stock_code,
    'start_date', COALESCE(p_start_date, (CURRENT_DATE - INTERVAL '1 year')::TEXT),
    'end_date', COALESCE(p_end_date, CURRENT_DATE::TEXT)
  );

  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('hkex-di', v_config, 'pending', v_user_id)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- ===========================================================================
-- Option 2: Update RLS policies to allow anonymous job creation
-- ===========================================================================

-- Drop existing insert policy
DROP POLICY IF EXISTS "Allow authenticated users to insert jobs" ON public.scraping_jobs;

-- Create new insert policy that allows both authenticated and anonymous users
CREATE POLICY "Allow all users to insert jobs"
  ON public.scraping_jobs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Update read policy to allow anonymous users to read their jobs
DROP POLICY IF EXISTS "Allow users to view jobs" ON public.scraping_jobs;

CREATE POLICY "Allow all users to view jobs"
  ON public.scraping_jobs
  FOR SELECT
  TO public
  USING (true);

-- Keep service role policy for updates
-- (Edge functions use service role key to update job status)

-- ===========================================================================
-- Grant execute permissions
-- ===========================================================================

GRANT EXECUTE ON FUNCTION public.trigger_ccass_scrape(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sfc_rss_sync() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sfc_stats_sync(TEXT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_hkex_di_scrape(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ===========================================================================
-- Verification queries
-- ===========================================================================

-- Test that anonymous users can create jobs
-- SELECT trigger_ccass_scrape('00700', 10);

-- Verify job was created
-- SELECT * FROM scraping_jobs ORDER BY created_at DESC LIMIT 1;

COMMENT ON FUNCTION public.trigger_ccass_scrape IS 'Create job record for CCASS scraping (allows anonymous)';
COMMENT ON FUNCTION public.trigger_sfc_rss_sync IS 'Create job record for SFC RSS sync (allows anonymous)';
COMMENT ON FUNCTION public.trigger_sfc_stats_sync IS 'Create job record for SFC stats sync (allows anonymous)';
COMMENT ON FUNCTION public.trigger_hkex_di_scrape IS 'Create job record for HKEX DI scraping (allows anonymous)';

-- ===========================================================================
-- Security Note
-- ===========================================================================
-- This allows anonymous users to create scraping jobs, which is necessary for:
-- 1. Testing with anon key
-- 2. Dashboard usage without authentication
--
-- In production, you may want to:
-- 1. Require authentication for job creation
-- 2. Add rate limiting
-- 3. Add job quotas per user
-- 4. Log all anonymous job creations
-- ===========================================================================
