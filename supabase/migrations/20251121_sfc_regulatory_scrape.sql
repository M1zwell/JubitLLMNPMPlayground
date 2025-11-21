-- Migration: Add SFC Regulatory Scrape trigger function
-- Date: 2025-11-21

-- Create trigger function for SFC Regulatory scrape jobs
CREATE OR REPLACE FUNCTION trigger_sfc_regulatory_scrape(
  p_categories text[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  INSERT INTO scraping_jobs (
    source,
    config,
    status,
    created_at
  ) VALUES (
    'sfc-regulatory',
    jsonb_build_object(
      'categories', COALESCE(p_categories, ARRAY['cold_shoulder_orders', 'policy_statements', 'high_shareholding', 'aml_ctf', 'virtual_assets_regulatory', 'virtual_assets_materials', 'reports', 'research_papers'])
    ),
    'pending',
    NOW()
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_sfc_regulatory_scrape(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_sfc_regulatory_scrape(text[]) TO anon;

-- Add comment
COMMENT ON FUNCTION trigger_sfc_regulatory_scrape IS 'Creates a scraping job for SFC regulatory content (cold shoulder orders, policy statements, high shareholding, etc.)';
