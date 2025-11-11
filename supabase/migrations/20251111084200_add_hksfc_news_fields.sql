-- Migration: Add summary, pdf_url, and tags fields to hksfc_filings
-- Date: 2025-11-11
-- Purpose: Support HKSFC news scraping with additional metadata fields

-- Add summary column (article excerpt/description)
ALTER TABLE hksfc_filings
ADD COLUMN IF NOT EXISTS summary text;

-- Add pdf_url column (link to PDF attachment if available)
ALTER TABLE hksfc_filings
ADD COLUMN IF NOT EXISTS pdf_url text;

-- Add tags column (keywords/categories array)
ALTER TABLE hksfc_filings
ADD COLUMN IF NOT EXISTS tags text[];

-- Update search_vector to include summary (using trigger instead of generated column)
DROP INDEX IF EXISTS idx_hksfc_search_vector;
ALTER TABLE hksfc_filings
DROP COLUMN IF EXISTS search_vector CASCADE;

-- Add search_vector as a regular column
ALTER TABLE hksfc_filings
ADD COLUMN search_vector tsvector;

-- Create trigger function to update search_vector
CREATE OR REPLACE FUNCTION update_hksfc_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.content, '') || ' ' ||
    coalesce(NEW.summary, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger
DROP TRIGGER IF EXISTS hksfc_search_vector_update ON hksfc_filings;
CREATE TRIGGER hksfc_search_vector_update
  BEFORE INSERT OR UPDATE ON hksfc_filings
  FOR EACH ROW
  EXECUTE FUNCTION update_hksfc_search_vector();

-- Recreate GIN index
CREATE INDEX idx_hksfc_search_vector ON hksfc_filings USING GIN(search_vector);

-- Update existing rows
UPDATE hksfc_filings SET search_vector = to_tsvector('english',
  coalesce(title, '') || ' ' ||
  coalesce(content, '') || ' ' ||
  coalesce(summary, '') || ' ' ||
  coalesce(array_to_string(tags, ' '), '')
) WHERE search_vector IS NULL;

-- Add comments
COMMENT ON COLUMN hksfc_filings.summary IS 'Article excerpt or description';
COMMENT ON COLUMN hksfc_filings.pdf_url IS 'URL to PDF attachment if available';
COMMENT ON COLUMN hksfc_filings.tags IS 'Keywords/tags for categorization (e.g., ["securities", "crypto"])';
