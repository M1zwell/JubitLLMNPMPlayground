-- Fix RPC Functions - Remove HTTP Extension Dependency
-- This migration creates simplified RPC functions that only create job records
-- Edge functions will be triggered via direct HTTP calls from the frontend instead

-- ===========================================================================
-- Drop existing functions with HTTP calls
-- ===========================================================================

DROP FUNCTION IF EXISTS public.trigger_hkex_di_scrape(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.trigger_sfc_rss_sync();
DROP FUNCTION IF EXISTS public.trigger_sfc_stats_sync(TEXT[]);
DROP FUNCTION IF EXISTS public.trigger_ccass_scrape(TEXT, INTEGER);

-- ===========================================================================
-- Create simplified RPC functions (job record creation only)
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

  -- Create job record (frontend will trigger the actual edge function)
  INSERT INTO public.scraping_jobs (source, config, status, created_by)
  VALUES ('hkex-di', v_config, 'pending', auth.uid())
  RETURNING id INTO v_job_id;

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

  RETURN v_job_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.trigger_hkex_di_scrape(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sfc_rss_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sfc_stats_sync(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_ccass_scrape(TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.trigger_hkex_di_scrape IS 'Create job record for HKEX Disclosure of Interests scraping';
COMMENT ON FUNCTION public.trigger_sfc_rss_sync IS 'Create job record for SFC RSS feed synchronization';
COMMENT ON FUNCTION public.trigger_sfc_stats_sync IS 'Create job record for SFC statistics tables synchronization';
COMMENT ON FUNCTION public.trigger_ccass_scrape IS 'Create job record for CCASS shareholding scraping';

-- ===========================================================================
-- Note: Edge functions will be triggered by frontend via direct HTTP calls
-- The RPC functions now only create job records for tracking
-- ===========================================================================
