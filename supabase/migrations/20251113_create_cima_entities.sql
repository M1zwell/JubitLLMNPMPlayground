-- Create table for CIMA (Cayman Islands Monetary Authority) Regulated Entities
CREATE TABLE IF NOT EXISTS cima_entities (
  id BIGSERIAL PRIMARY KEY,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- Banking, Trust, Insurance, etc.
  entity_category TEXT, -- Class I, Class II, etc. for Trust providers
  license_number TEXT,
  license_status TEXT, -- Active, Suspended, Revoked, etc.
  registration_date DATE,
  expiry_date DATE,
  registered_agent_status BOOLEAN,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  jurisdiction TEXT DEFAULT 'Cayman Islands',
  additional_info JSONB, -- For flexible storage of extra fields
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_cima_entity UNIQUE (entity_name, license_number, entity_type)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cima_entity_name ON cima_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_cima_entity_type ON cima_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_cima_entity_category ON cima_entities(entity_category);
CREATE INDEX IF NOT EXISTS idx_cima_license_status ON cima_entities(license_status);
CREATE INDEX IF NOT EXISTS idx_cima_jurisdiction ON cima_entities(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_cima_scraped_at ON cima_entities(scraped_at DESC);

-- Create GIN index for JSONB additional_info field
CREATE INDEX IF NOT EXISTS idx_cima_additional_info ON cima_entities USING GIN (additional_info);

-- Enable Row Level Security
ALTER TABLE cima_entities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated and anon users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cima_entities' AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access" ON cima_entities
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cima_entities' AND policyname = 'Allow public insert access'
  ) THEN
    CREATE POLICY "Allow public insert access" ON cima_entities
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cima_entities' AND policyname = 'Allow public update access'
  ) THEN
    CREATE POLICY "Allow public update access" ON cima_entities
      FOR UPDATE
      TO public
      USING (true);
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE cima_entities IS 'CIMA (Cayman Islands Monetary Authority) regulated entities data scraped from www.cima.ky';

-- Create table for BVI FSC (Financial Services Commission) Regulated Entities
CREATE TABLE IF NOT EXISTS bvi_entities (
  id BIGSERIAL PRIMARY KEY,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- Banking, Trust, Insurance, Fund, etc.
  entity_category TEXT,
  license_number TEXT,
  license_status TEXT,
  registration_date DATE,
  expiry_date DATE,
  registered_agent TEXT,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  jurisdiction TEXT DEFAULT 'British Virgin Islands',
  additional_info JSONB,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_bvi_entity UNIQUE (entity_name, license_number, entity_type)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bvi_entity_name ON bvi_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_bvi_entity_type ON bvi_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_bvi_entity_category ON bvi_entities(entity_category);
CREATE INDEX IF NOT EXISTS idx_bvi_license_status ON bvi_entities(license_status);
CREATE INDEX IF NOT EXISTS idx_bvi_jurisdiction ON bvi_entities(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_bvi_scraped_at ON bvi_entities(scraped_at DESC);

-- Create GIN index for JSONB additional_info field
CREATE INDEX IF NOT EXISTS idx_bvi_additional_info ON bvi_entities USING GIN (additional_info);

-- Enable Row Level Security
ALTER TABLE bvi_entities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated and anon users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bvi_entities' AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access" ON bvi_entities
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bvi_entities' AND policyname = 'Allow public insert access'
  ) THEN
    CREATE POLICY "Allow public insert access" ON bvi_entities
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bvi_entities' AND policyname = 'Allow public update access'
  ) THEN
    CREATE POLICY "Allow public update access" ON bvi_entities
      FOR UPDATE
      TO public
      USING (true);
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE bvi_entities IS 'BVI FSC (Financial Services Commission) regulated entities data';
