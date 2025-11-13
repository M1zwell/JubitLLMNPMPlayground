-- Migration: Add HKEX CCASS Change Tracking Tables
-- Date: 2025-11-11
-- Purpose: Track shareholding changes over time

-- ============================================================================
-- Table: hkex_ccass_snapshots
-- Purpose: Store complete snapshots of CCASS data for each scrape
-- ============================================================================

CREATE TABLE IF NOT EXISTS hkex_ccass_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_code TEXT NOT NULL,
  data_date DATE NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Stock information
  stock_name TEXT,
  total_participants INTEGER NOT NULL DEFAULT 0,
  total_shares BIGINT NOT NULL DEFAULT 0,

  -- Full participant data (JSON array)
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  screenshot_url TEXT,  -- Screenshot of results table
  extraction_method TEXT CHECK (extraction_method IN ('html', 'json', 'puppeteer')),
  firecrawl_credits_used INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_stock_snapshot UNIQUE (stock_code, data_date, scraped_at)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_snapshots_stock_code ON hkex_ccass_snapshots(stock_code);
CREATE INDEX IF NOT EXISTS idx_snapshots_data_date ON hkex_ccass_snapshots(data_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_scraped_at ON hkex_ccass_snapshots(scraped_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_stock_date ON hkex_ccass_snapshots(stock_code, data_date);

-- Index for participant searches (JSONB gin index)
CREATE INDEX IF NOT EXISTS idx_snapshots_participants ON hkex_ccass_snapshots USING gin(participants);

COMMENT ON TABLE hkex_ccass_snapshots IS 'Complete snapshots of HKEX CCASS shareholding data';
COMMENT ON COLUMN hkex_ccass_snapshots.participants IS 'Array of participant objects with participantId, participantName, address, shareholding, percentage';

-- ============================================================================
-- Table: hkex_ccass_changes
-- Purpose: Track significant changes in shareholdings
-- ============================================================================

CREATE TABLE IF NOT EXISTS hkex_ccass_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_code TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,

  -- Time periods
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Change data
  previous_shareholding BIGINT,
  current_shareholding BIGINT,
  share_change BIGINT NOT NULL,  -- positive = increase, negative = decrease
  previous_percentage NUMERIC(10, 4),
  current_percentage NUMERIC(10, 4),
  percentage_change NUMERIC(10, 4) NOT NULL,  -- percentage point change
  percent_change_magnitude NUMERIC(10, 4) NOT NULL,  -- % change of previous value

  -- Change classification
  change_type TEXT NOT NULL CHECK (change_type IN (
    'NEW_PARTICIPANT',      -- New participant appeared
    'EXIT_PARTICIPANT',     -- Participant no longer holding
    'SIGNIFICANT_INCREASE', -- >5% increase in holdings
    'SIGNIFICANT_DECREASE', -- >5% decrease in holdings
    'MINOR_CHANGE'          -- <5% change
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Snapshot references
  previous_snapshot_id UUID REFERENCES hkex_ccass_snapshots(id) ON DELETE SET NULL,
  current_snapshot_id UUID REFERENCES hkex_ccass_snapshots(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_changes_stock_code ON hkex_ccass_changes(stock_code);
CREATE INDEX IF NOT EXISTS idx_changes_participant_id ON hkex_ccass_changes(participant_id);
CREATE INDEX IF NOT EXISTS idx_changes_detected_at ON hkex_ccass_changes(detected_at);
CREATE INDEX IF NOT EXISTS idx_changes_change_type ON hkex_ccass_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_changes_severity ON hkex_ccass_changes(severity);
CREATE INDEX IF NOT EXISTS idx_changes_stock_dates ON hkex_ccass_changes(stock_code, from_date, to_date);

COMMENT ON TABLE hkex_ccass_changes IS 'Track significant changes in HKEX CCASS shareholdings';
COMMENT ON COLUMN hkex_ccass_changes.share_change IS 'Absolute change in shares held';
COMMENT ON COLUMN hkex_ccass_changes.percentage_change IS 'Change in percentage of total shares';
COMMENT ON COLUMN hkex_ccass_changes.percent_change_magnitude IS 'Percentage change relative to previous holding';

-- ============================================================================
-- Table: hkex_change_subscriptions (Optional - for notifications)
-- Purpose: Allow users to subscribe to change alerts for specific stocks
-- ============================================================================

CREATE TABLE IF NOT EXISTS hkex_change_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- Can be NULL for system-level subscriptions
  stock_code TEXT NOT NULL,
  participant_id TEXT,  -- NULL = all participants

  -- Notification settings
  min_severity TEXT NOT NULL DEFAULT 'medium' CHECK (min_severity IN ('low', 'medium', 'high', 'critical')),
  min_change_percent NUMERIC(10, 4) NOT NULL DEFAULT 5.0,  -- Minimum % change to notify

  -- Delivery settings
  notification_channels JSONB NOT NULL DEFAULT '["in_app"]'::jsonb,  -- ["email", "webhook", "in_app"]
  webhook_url TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_subscription UNIQUE (user_id, stock_code, participant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON hkex_change_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stock_code ON hkex_change_subscriptions(stock_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON hkex_change_subscriptions(is_active);

COMMENT ON TABLE hkex_change_subscriptions IS 'User subscriptions for shareholding change notifications';

-- ============================================================================
-- Views: Convenient queries for change tracking
-- ============================================================================

-- View: Latest snapshot for each stock
CREATE OR REPLACE VIEW hkex_latest_snapshots AS
SELECT DISTINCT ON (stock_code)
  *
FROM hkex_ccass_snapshots
ORDER BY stock_code, scraped_at DESC;

COMMENT ON VIEW hkex_latest_snapshots IS 'Most recent snapshot for each stock';

-- View: Recent significant changes (last 30 days)
CREATE OR REPLACE VIEW hkex_recent_changes AS
SELECT
  c.*,
  s.stock_name,
  s.total_shares as current_total_shares
FROM hkex_ccass_changes c
LEFT JOIN hkex_latest_snapshots s ON c.stock_code = s.stock_code
WHERE c.detected_at >= NOW() - INTERVAL '30 days'
  AND c.change_type IN ('SIGNIFICANT_INCREASE', 'SIGNIFICANT_DECREASE', 'NEW_PARTICIPANT', 'EXIT_PARTICIPANT')
ORDER BY c.detected_at DESC;

COMMENT ON VIEW hkex_recent_changes IS 'Significant shareholding changes in the last 30 days';

-- ============================================================================
-- Functions: Helper functions for change detection
-- ============================================================================

-- Function: Calculate change severity
CREATE OR REPLACE FUNCTION calculate_change_severity(
  percent_change_magnitude NUMERIC
) RETURNS TEXT AS $$
BEGIN
  IF ABS(percent_change_magnitude) >= 20 THEN
    RETURN 'critical';
  ELSIF ABS(percent_change_magnitude) >= 10 THEN
    RETURN 'high';
  ELSIF ABS(percent_change_magnitude) >= 5 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_change_severity IS 'Determine severity level based on percentage change magnitude';

-- Function: Classify change type
CREATE OR REPLACE FUNCTION classify_change_type(
  previous_shareholding BIGINT,
  current_shareholding BIGINT,
  percent_change_magnitude NUMERIC
) RETURNS TEXT AS $$
BEGIN
  IF previous_shareholding IS NULL OR previous_shareholding = 0 THEN
    RETURN 'NEW_PARTICIPANT';
  ELSIF current_shareholding IS NULL OR current_shareholding = 0 THEN
    RETURN 'EXIT_PARTICIPANT';
  ELSIF percent_change_magnitude > 5 THEN
    RETURN 'SIGNIFICANT_INCREASE';
  ELSIF percent_change_magnitude < -5 THEN
    RETURN 'SIGNIFICANT_DECREASE';
  ELSE
    RETURN 'MINOR_CHANGE';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION classify_change_type IS 'Classify type of shareholding change';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE hkex_ccass_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE hkex_ccass_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hkex_change_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: Allow public read access (data is public from HKEX)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hkex_ccass_snapshots' AND policyname = 'Public read access for snapshots') THEN
    CREATE POLICY "Public read access for snapshots" ON hkex_ccass_snapshots FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hkex_ccass_changes' AND policyname = 'Public read access for changes') THEN
    CREATE POLICY "Public read access for changes" ON hkex_ccass_changes FOR SELECT USING (true);
  END IF;
END $$;

-- Policies: Users can manage their own subscriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hkex_change_subscriptions' AND policyname = 'Users can view their own subscriptions') THEN
    CREATE POLICY "Users can view their own subscriptions" ON hkex_change_subscriptions FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hkex_change_subscriptions' AND policyname = 'Users can create their own subscriptions') THEN
    CREATE POLICY "Users can create their own subscriptions" ON hkex_change_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hkex_change_subscriptions' AND policyname = 'Users can update their own subscriptions') THEN
    CREATE POLICY "Users can update their own subscriptions" ON hkex_change_subscriptions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hkex_change_subscriptions' AND policyname = 'Users can delete their own subscriptions') THEN
    CREATE POLICY "Users can delete their own subscriptions" ON hkex_change_subscriptions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role can do anything (for background tasks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hkex_ccass_snapshots' AND policyname = 'Service role full access to snapshots') THEN
    CREATE POLICY "Service role full access to snapshots" ON hkex_ccass_snapshots FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hkex_ccass_changes' AND policyname = 'Service role full access to changes') THEN
    CREATE POLICY "Service role full access to changes" ON hkex_ccass_changes FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hkex_change_subscriptions' AND policyname = 'Service role full access to subscriptions') THEN
    CREATE POLICY "Service role full access to subscriptions" ON hkex_change_subscriptions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;
