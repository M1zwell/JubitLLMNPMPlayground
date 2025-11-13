-- Add content_hash column to bvi_entities for deduplication
-- This migration extends the existing bvi_entities table

-- Add content_hash column if it doesn't exist
ALTER TABLE bvi_entities
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create unique index on content_hash for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_bvi_content_hash
ON bvi_entities(content_hash);

-- Update existing records to generate content_hash
-- Format: sha256(entity_name||license_number||entity_type)
UPDATE bvi_entities
SET content_hash = encode(
  digest(
    entity_name || '||' || COALESCE(license_number, 'NONE') || '||' || entity_type,
    'sha256'
  ),
  'hex'
)
WHERE content_hash IS NULL;

-- Make content_hash NOT NULL after populating (only if table has data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM bvi_entities LIMIT 1) THEN
    ALTER TABLE bvi_entities ALTER COLUMN content_hash SET NOT NULL;
  END IF;
END $$;

-- Drop old unique constraint if it exists
ALTER TABLE bvi_entities
DROP CONSTRAINT IF EXISTS unique_bvi_entity;

-- Add comment
COMMENT ON COLUMN bvi_entities.content_hash IS 'SHA256 hash for deduplication: entity_name||license_number||entity_type';
