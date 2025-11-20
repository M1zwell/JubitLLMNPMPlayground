-- Fix Foreign Key Constraint for Anonymous Job Creation
-- Issue: Placeholder UUID for anonymous users doesn't exist in users table
-- Solution: Make created_by nullable and drop foreign key constraint

-- ===========================================================================
-- Drop foreign key constraint on created_by
-- ===========================================================================

ALTER TABLE public.scraping_jobs
DROP CONSTRAINT IF EXISTS scraping_jobs_created_by_fkey;

-- ===========================================================================
-- Make created_by nullable (already is, but ensure it's explicit)
-- ===========================================================================

ALTER TABLE public.scraping_jobs
ALTER COLUMN created_by DROP NOT NULL;

-- ===========================================================================
-- Update RPC functions to use NULL instead of placeholder UUID
-- ===========================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.trigger_ccass_scrape(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.trigger_sfc_rss_sync();
DROP FUNCTION IF EXISTS public.trigger_sfc_stats_sync(TEXT[]);
DROP FUNCTION IF EXISTS public.trigger_hkex_di_scrape(TEXT, TEXT, TEXT);

-- Recreate with NULL for anonymous users (simpler approach)

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

  -- Use NULL for anonymous users (no placeholder UUID needed)
  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('ccass', v_config, 'pending', auth.uid())
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
BEGIN
  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('sfc-rss', '{}'::jsonb, 'pending', auth.uid())
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
BEGIN
  v_config := jsonb_build_object('tables', p_tables);

  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('sfc-stats', v_config, 'pending', auth.uid())
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
BEGIN
  v_config := jsonb_build_object(
    'stock_code', p_stock_code,
    'start_date', COALESCE(p_start_date, (CURRENT_DATE - INTERVAL '1 year')::TEXT),
    'end_date', COALESCE(p_end_date, CURRENT_DATE::TEXT)
  );

  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('hkex-di', v_config, 'pending', auth.uid())
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- ===========================================================================
-- Grant execute permissions
-- ===========================================================================

GRANT EXECUTE ON FUNCTION public.trigger_ccass_scrape(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sfc_rss_sync() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sfc_stats_sync(TEXT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_hkex_di_scrape(TEXT, TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.trigger_ccass_scrape IS 'Create job record for CCASS scraping (allows anonymous, no FK constraint)';
COMMENT ON FUNCTION public.trigger_sfc_rss_sync IS 'Create job record for SFC RSS sync (allows anonymous, no FK constraint)';
COMMENT ON FUNCTION public.trigger_sfc_stats_sync IS 'Create job record for SFC stats sync (allows anonymous, no FK constraint)';
COMMENT ON FUNCTION public.trigger_hkex_di_scrape IS 'Create job record for HKEX DI scraping (allows anonymous, no FK constraint)';

-- ===========================================================================
-- Note
-- ===========================================================================
-- This allows anonymous job creation by:
-- 1. Removing foreign key constraint on created_by
-- 2. Using NULL for anonymous users (auth.uid() returns NULL)
-- 3. Updated RLS policies (from previous migration) allow this
-- ===========================================================================
