-- Migration: Add CHECK constraint for HKSFC filing_type categories
-- Date: 2025-11-10
-- Purpose: Enforce valid categories for HKSFC filings after expanding from 5 to 10 categories

-- Drop existing constraint if any (in case of re-run)
ALTER TABLE hksfc_filings DROP CONSTRAINT IF EXISTS hksfc_filings_filing_type_check;

-- Add CHECK constraint with expanded categories
ALTER TABLE hksfc_filings
ADD CONSTRAINT hksfc_filings_filing_type_check
CHECK (filing_type IN (
  'corporate',      -- Corporate news
  'enforcement',    -- Enforcement news
  'policy',         -- Policy statements and announcements
  'shareholding',   -- High shareholding concentration announcements
  'decisions',      -- Decisions, statements and disclosures
  'events',         -- Events
  'circular',       -- Circulars
  'consultation',   -- Consultation papers
  'news',           -- General news
  'other'           -- Uncategorized
));

-- Update any NULL values to 'other' before constraint is enforced
UPDATE hksfc_filings SET filing_type = 'other' WHERE filing_type IS NULL;

COMMENT ON CONSTRAINT hksfc_filings_filing_type_check ON hksfc_filings IS
  'Ensures filing_type matches valid HKSFC categories aligned with website structure';
