-- Add content_hash column to cima_entities for deduplication
-- This migration extends the existing cima_entities table

-- Add content_hash column if it doesn't exist
ALTER TABLE cima_entities
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create unique index on content_hash for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_cima_content_hash
ON cima_entities(content_hash);

-- Update existing records to generate content_hash
-- Format: sha256(entity_name||license_number||entity_type)
UPDATE cima_entities
SET content_hash = encode(
  digest(
    entity_name || '||' || COALESCE(license_number, 'NONE') || '||' || entity_type,
    'sha256'
  ),
  'hex'
)
WHERE content_hash IS NULL;

-- Make content_hash NOT NULL after populating
ALTER TABLE cima_entities
ALTER COLUMN content_hash SET NOT NULL;

-- Drop old unique constraint if it exists
ALTER TABLE cima_entities
DROP CONSTRAINT IF NOT EXISTS unique_cima_entity;

-- Add comment
COMMENT ON COLUMN cima_entities.content_hash IS 'SHA256 hash for deduplication: entity_name||license_number||entity_type';
