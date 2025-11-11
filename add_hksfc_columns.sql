-- Add summary, pdf_url, and tags columns to hksfc_filings
ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS tags text[];

-- Drop and recreate search_vector with trigger
DROP TRIGGER IF EXISTS hksfc_search_vector_update ON hksfc_filings;
DROP FUNCTION IF EXISTS update_hksfc_search_vector();

ALTER TABLE hksfc_filings DROP COLUMN IF EXISTS search_vector CASCADE;
ALTER TABLE hksfc_filings ADD COLUMN search_vector tsvector;

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

CREATE TRIGGER hksfc_search_vector_update
  BEFORE INSERT OR UPDATE ON hksfc_filings
  FOR EACH ROW
  EXECUTE FUNCTION update_hksfc_search_vector();

CREATE INDEX IF NOT EXISTS idx_hksfc_search_vector ON hksfc_filings USING GIN(search_vector);
