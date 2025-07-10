-- Webb Database Schema Migration
-- Based on David Webb's MySQL setup documentation
-- Migrating to PostgreSQL/Supabase with equivalent functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create Webb schema namespace
CREATE SCHEMA IF NOT EXISTS webb;

-- Set search path to include webb schema
SET search_path TO webb, public;

-- ============================================================================
-- ENIGMA SCHEMA TABLES (Core Financial Data)
-- ============================================================================

-- Companies/Organizations table (equivalent to enigma.organisations)
CREATE TABLE webb.organisations (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(10),
    name1 TEXT NOT NULL, -- Company name (searchable)
    name2 TEXT, -- Alternative name
    name3 TEXT, -- Chinese name
    short_name VARCHAR(100),
    listing_date DATE,
    delisting_date DATE,
    market_cap DECIMAL(20,2),
    sector VARCHAR(100),
    industry VARCHAR(100),
    website TEXT,
    status VARCHAR(20) DEFAULT 'active',
    country_code CHAR(2) DEFAULT 'HK',
    exchange VARCHAR(10) DEFAULT 'HKEX',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Additional metadata for AI enhancement
    ai_insights JSONB DEFAULT '{}',
    governance_score INTEGER,
    risk_level VARCHAR(20)
);

-- People table (equivalent to enigma.people) 
CREATE TABLE webb.people (
    id SERIAL PRIMARY KEY,
    name1 TEXT NOT NULL, -- Primary name (searchable)
    name2 TEXT, -- Alternative name/Chinese name
    name3 TEXT, -- Additional name variant
    gender CHAR(1),
    birth_date DATE,
    nationality VARCHAR(50),
    education TEXT,
    biography TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- AI enhancement fields
    ai_profile JSONB DEFAULT '{}',
    influence_score INTEGER,
    network_connections INTEGER DEFAULT 0
);

-- Directors/Officers positions (equivalent to enigma.positions)
CREATE TABLE webb.positions (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES webb.people(id),
    organisation_id INTEGER REFERENCES webb.organisations(id),
    position_title TEXT NOT NULL,
    appointment_date DATE,
    resignation_date DATE,
    annual_compensation DECIMAL(15,2),
    currency CHAR(3) DEFAULT 'HKD',
    is_independent BOOLEAN DEFAULT FALSE,
    is_executive BOOLEAN DEFAULT FALSE,
    committee_memberships TEXT[], -- Array of committee names
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Governance analysis
    performance_rating INTEGER,
    governance_flags TEXT[]
);

-- Shareholdings table (equivalent to ccass.holdings)
CREATE TABLE webb.shareholdings (
    id SERIAL PRIMARY KEY,
    organisation_id INTEGER REFERENCES webb.organisations(id),
    shareholder_name TEXT NOT NULL,
    shareholder_type VARCHAR(50), -- 'individual', 'corporate', 'institutional'
    share_class VARCHAR(10) DEFAULT 'ordinary',
    shares_held BIGINT,
    shareholding_percentage DECIMAL(8,4),
    disclosure_date DATE NOT NULL,
    disclosure_type VARCHAR(50), -- 'substantial', 'director', 'initial'
    value_hkd DECIMAL(20,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- AI analysis fields
    change_analysis JSONB DEFAULT '{}',
    risk_flags TEXT[]
);

-- ============================================================================
-- CCASS SCHEMA TABLES (Settlement System Data)
-- ============================================================================

-- CCASS participants table
CREATE TABLE webb.ccass_participants (
    id SERIAL PRIMARY KEY,
    participant_id VARCHAR(20) UNIQUE NOT NULL,
    participant_name TEXT NOT NULL,
    participant_type VARCHAR(50), -- 'broker', 'custodian', 'bank'
    status VARCHAR(20) DEFAULT 'active',
    registration_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CCASS holdings details (more granular than shareholdings)
CREATE TABLE webb.ccass_holdings (
    id SERIAL PRIMARY KEY,
    organisation_id INTEGER REFERENCES webb.organisations(id),
    participant_id VARCHAR(20) REFERENCES webb.ccass_participants(participant_id),
    issue_id VARCHAR(20), -- Original CCASS issue ID
    shares_held BIGINT NOT NULL,
    record_date DATE NOT NULL,
    settlement_date DATE,
    transaction_type VARCHAR(20), -- 'buy', 'sell', 'transfer'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Additional metadata
    market_value DECIMAL(20,2),
    price_per_share DECIMAL(10,4)
);

-- ============================================================================
-- USER MANAGEMENT TABLES (Equivalent to mailvote schema)
-- ============================================================================

-- User accounts table
CREATE TABLE webb.user_accounts (
    id SERIAL PRIMARY KEY,
    user_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    status VARCHAR(20) DEFAULT 'active',
    registration_date TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- User preferences
    preferences JSONB DEFAULT '{}',
    subscription_level VARCHAR(20) DEFAULT 'basic'
);

-- User sessions table
CREATE TABLE webb.user_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    user_id UUID REFERENCES webb.user_accounts(user_id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- User stock lists (watchlists)
CREATE TABLE webb.user_stock_lists (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES webb.user_accounts(user_id),
    list_name VARCHAR(100) NOT NULL,
    organisation_id INTEGER REFERENCES webb.organisations(id),
    added_date TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    alert_enabled BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, organisation_id, list_name)
);

-- ============================================================================
-- SYSTEM CONFIGURATION TABLES (Equivalent to private.keys)
-- ============================================================================

-- System configuration keys
CREATE TABLE webb.system_config (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    key_value TEXT,
    description TEXT,
    category VARCHAR(50),
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- LOGGING AND MONITORING TABLES (Equivalent to iplog schema)
-- ============================================================================

-- IP logging for rate limiting and analytics
CREATE TABLE webb.ip_logs (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    hit_date DATE DEFAULT CURRENT_DATE,
    hit_count INTEGER DEFAULT 1,
    last_hit TIMESTAMP DEFAULT NOW(),
    user_agent TEXT,
    page_accessed TEXT,
    action_taken VARCHAR(50),
    is_blocked BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (ip_address, hit_date)
);

-- ============================================================================
-- AI ENHANCEMENT TABLES
-- ============================================================================

-- AI analysis results storage
CREATE TABLE webb.ai_analysis (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'company', 'person', 'shareholding'
    entity_id INTEGER NOT NULL,
    analysis_type VARCHAR(50) NOT NULL, -- 'governance', 'risk', 'performance'
    ai_model VARCHAR(50) NOT NULL, -- 'deepseek-v3', 'claude-4', etc.
    analysis_result JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Market analytics and predictions
CREATE TABLE webb.market_analytics (
    id SERIAL PRIMARY KEY,
    organisation_id INTEGER REFERENCES webb.organisations(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(20,4),
    calculation_date DATE DEFAULT CURRENT_DATE,
    prediction_horizon INTEGER, -- days into future
    confidence_level DECIMAL(3,2),
    ai_insights JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE (Equivalent to MySQL full-text indexes)
-- ============================================================================

-- Full-text search indexes
CREATE INDEX idx_organisations_name1_fts ON webb.organisations USING gin(to_tsvector('english', name1));
CREATE INDEX idx_organisations_name1_trgm ON webb.organisations USING gin(name1 gin_trgm_ops);
CREATE INDEX idx_people_name1_fts ON webb.people USING gin(to_tsvector('english', name1));
CREATE INDEX idx_people_name1_trgm ON webb.people USING gin(name1 gin_trgm_ops);

-- Performance indexes
CREATE INDEX idx_organisations_stock_code ON webb.organisations(stock_code);
CREATE INDEX idx_organisations_listing_date ON webb.organisations(listing_date);
CREATE INDEX idx_positions_organisation_id ON webb.positions(organisation_id);
CREATE INDEX idx_positions_person_id ON webb.positions(person_id);
CREATE INDEX idx_shareholdings_organisation_id ON webb.shareholdings(organisation_id);
CREATE INDEX idx_shareholdings_disclosure_date ON webb.shareholdings(disclosure_date);
CREATE INDEX idx_ccass_holdings_organisation_id ON webb.ccass_holdings(organisation_id);
CREATE INDEX idx_ccass_holdings_record_date ON webb.ccass_holdings(record_date);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS (Equivalent to MySQL timestamp columns)
-- ============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION webb.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all main tables
CREATE TRIGGER trigger_organisations_updated_at
    BEFORE UPDATE ON webb.organisations
    FOR EACH ROW EXECUTE FUNCTION webb.update_updated_at();

CREATE TRIGGER trigger_people_updated_at
    BEFORE UPDATE ON webb.people
    FOR EACH ROW EXECUTE FUNCTION webb.update_updated_at();

CREATE TRIGGER trigger_positions_updated_at
    BEFORE UPDATE ON webb.positions
    FOR EACH ROW EXECUTE FUNCTION webb.update_updated_at();

CREATE TRIGGER trigger_shareholdings_updated_at
    BEFORE UPDATE ON webb.shareholdings
    FOR EACH ROW EXECUTE FUNCTION webb.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) FOR DATA PROTECTION
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE webb.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webb.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webb.user_stock_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE webb.system_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for user data
CREATE POLICY "Users can view own account" ON webb.user_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account" ON webb.user_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON webb.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stock lists" ON webb.user_stock_lists
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert default system configuration
INSERT INTO webb.system_config (key_name, key_value, description, category) VALUES
('site_name', 'Webb Financial Database', 'Site display name', 'general'),
('data_source', 'David Webb Financial Database', 'Data source attribution', 'general'),
('api_version', '1.0', 'Current API version', 'technical'),
('ai_models_enabled', '["deepseek-v3", "claude-4-opus", "gpt-4o", "qwen-max"]', 'Enabled AI models', 'ai'),
('max_query_results', '1000', 'Maximum results per query', 'performance'),
('rate_limit_per_hour', '1000', 'API rate limit per hour', 'security');

-- Insert sample CCASS participant (for testing)
INSERT INTO webb.ccass_participants (participant_id, participant_name, participant_type) VALUES
('C00001', 'Hong Kong Securities Clearing Company Limited', 'clearing'),
('B00001', 'Sample Broker Limited', 'broker'),
('C00002', 'Sample Custodian Bank', 'custodian');

-- ============================================================================
-- FUNCTIONS FOR DATA ACCESS (Equivalent to MySQL stored procedures)
-- ============================================================================

-- Function to search companies (equivalent to full-text search)
CREATE OR REPLACE FUNCTION webb.search_companies(
    search_term TEXT,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id INTEGER,
    stock_code VARCHAR(10),
    name1 TEXT,
    market_cap DECIMAL(20,2),
    governance_score INTEGER,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.stock_code,
        o.name1,
        o.market_cap,
        o.governance_score,
        similarity(o.name1, search_term) as similarity
    FROM webb.organisations o
    WHERE 
        o.name1 % search_term 
        OR o.stock_code = search_term
        OR to_tsvector('english', o.name1) @@ plainto_tsquery('english', search_term)
    ORDER BY similarity DESC, o.market_cap DESC NULLS LAST
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get company directors
CREATE OR REPLACE FUNCTION webb.get_company_directors(
    company_id INTEGER
)
RETURNS TABLE (
    person_name TEXT,
    position_title TEXT,
    appointment_date DATE,
    annual_compensation DECIMAL(15,2),
    is_independent BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.name1,
        po.position_title,
        po.appointment_date,
        po.annual_compensation,
        po.is_independent
    FROM webb.positions po
    JOIN webb.people pe ON po.person_id = pe.id
    WHERE po.organisation_id = company_id
        AND po.resignation_date IS NULL
    ORDER BY po.appointment_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get shareholding analysis
CREATE OR REPLACE FUNCTION webb.get_shareholding_analysis(
    company_id INTEGER,
    analysis_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_disclosed DECIMAL(8,4);
    major_shareholders JSONB;
BEGIN
    -- Calculate total disclosed shareholding
    SELECT COALESCE(SUM(shareholding_percentage), 0)
    INTO total_disclosed
    FROM webb.shareholdings
    WHERE organisation_id = company_id
        AND disclosure_date <= analysis_date;
    
    -- Get major shareholders (>5%)
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', shareholder_name,
            'percentage', shareholding_percentage,
            'type', shareholder_type,
            'disclosure_date', disclosure_date
        ) ORDER BY shareholding_percentage DESC
    )
    INTO major_shareholders
    FROM webb.shareholdings
    WHERE organisation_id = company_id
        AND shareholding_percentage >= 5.0
        AND disclosure_date <= analysis_date;
    
    result := jsonb_build_object(
        'company_id', company_id,
        'analysis_date', analysis_date,
        'total_disclosed_percentage', total_disclosed,
        'free_float_estimate', 100 - total_disclosed,
        'major_shareholders', COALESCE(major_shareholders, '[]'::jsonb)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA webb TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA webb TO anon;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA webb TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA webb TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA webb TO authenticated, anon;

COMMENT ON SCHEMA webb IS 'David Webb Financial Database - Core financial data for Hong Kong listed companies';
COMMENT ON TABLE webb.organisations IS 'Listed companies and organizations';
COMMENT ON TABLE webb.people IS 'Directors, executives, and key personnel';
COMMENT ON TABLE webb.positions IS 'Corporate positions and appointments';
COMMENT ON TABLE webb.shareholdings IS 'Share ownership and disclosure records';
COMMENT ON TABLE webb.ccass_holdings IS 'Detailed CCASS settlement records'; 