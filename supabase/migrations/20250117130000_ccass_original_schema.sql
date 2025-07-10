-- CCASS Original Schema Migration for PostgreSQL
-- Converted from David Webb's MySQL structure to Supabase PostgreSQL
-- Date: 2025-01-17

-- Create CCASS original schema
CREATE SCHEMA IF NOT EXISTS ccass_original;

-- Grant permissions
GRANT USAGE ON SCHEMA ccass_original TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA ccass_original TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ccass_original TO anon, authenticated;

-- Table: bigchanges - Significant shareholding changes
CREATE TABLE IF NOT EXISTS ccass_original.bigchanges (
  atDate DATE NOT NULL,
  issueID INTEGER NOT NULL,
  partID SMALLINT NOT NULL,
  stkchg REAL DEFAULT NULL,
  prevDate DATE DEFAULT NULL,
  PRIMARY KEY (atDate, issueID, partID)
);

-- Table: calendar - HK settlement calendar
CREATE TABLE IF NOT EXISTS ccass_original.calendar (
  tradeDate DATE NOT NULL,
  settleDate DATE NOT NULL,
  deferred BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (tradeDate)
);

CREATE INDEX IF NOT EXISTS idx_ccass_calendar_settle ON ccass_original.calendar(settleDate, tradeDate);

-- Table: dailylog - Daily concentration analysis
CREATE TABLE IF NOT EXISTS ccass_original.dailylog (
  atDate DATE NOT NULL,
  issueID INTEGER NOT NULL,
  intermedHldg BIGINT NOT NULL DEFAULT 0,
  intermedCnt SMALLINT NOT NULL DEFAULT 0,
  NCIPhldg BIGINT NOT NULL DEFAULT 0,
  NCIPcnt SMALLINT NOT NULL DEFAULT 0,
  CIPhldg BIGINT NOT NULL DEFAULT 0,
  CIPcnt SMALLINT NOT NULL DEFAULT 0,
  c5 BIGINT NOT NULL DEFAULT 0,
  c10 BIGINT NOT NULL DEFAULT 0,
  CustHldg BIGINT NOT NULL DEFAULT 0,
  BrokHldg BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (issueID, atDate)
);

-- Table: holdings - Core CCASS shareholding data
CREATE TABLE IF NOT EXISTS ccass_original.holdings (
  partID SMALLINT NOT NULL,
  issueID INTEGER NOT NULL,
  holding BIGINT NOT NULL,
  atDate DATE NOT NULL,
  PRIMARY KEY (issueID, partID, atDate)
);

-- Table: parthold - Alternative primary key structure
CREATE TABLE IF NOT EXISTS ccass_original.parthold (
  partID SMALLINT NOT NULL,
  issueID INTEGER NOT NULL,
  holding BIGINT NOT NULL,
  atDate DATE NOT NULL,
  PRIMARY KEY (partID, issueID, atDate)
);

-- Table: participants - CCASS participants
CREATE TABLE IF NOT EXISTS ccass_original.participants (
  partID SERIAL PRIMARY KEY,
  CCASSID VARCHAR(6),
  partName VARCHAR(255) NOT NULL,
  atDate DATE NOT NULL,
  addedDate DATE DEFAULT NULL,
  personID INTEGER DEFAULT NULL,
  hadHoldings BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ccass_participants_ccassid ON ccass_original.participants(CCASSID);
CREATE INDEX IF NOT EXISTS idx_ccass_participants_name ON ccass_original.participants(partName);

-- Table: oldnames - Participant name changes
CREATE TABLE IF NOT EXISTS ccass_original.oldnames (
  oldNameID SERIAL PRIMARY KEY,
  oldName VARCHAR(255) NOT NULL,
  dateChanged DATE NOT NULL,
  partID SMALLINT NOT NULL,
  FOREIGN KEY (partID) REFERENCES ccass_original.participants(partID)
);

-- Table: missing - Missing records from daily runs
CREATE TABLE IF NOT EXISTS ccass_original.missing (
  atDate DATE NOT NULL,
  issueID INTEGER NOT NULL,
  stockCode INTEGER NOT NULL,
  PRIMARY KEY (atDate, issueID)
);

-- Table: quotes - Main price data
CREATE TABLE IF NOT EXISTS ccass_original.quotes (
  issueID INTEGER NOT NULL,
  atDate DATE NOT NULL,
  prevClose REAL DEFAULT 0,
  closing REAL NOT NULL DEFAULT 0,
  ask REAL NOT NULL DEFAULT 0,
  bid REAL NOT NULL DEFAULT 0,
  high REAL NOT NULL DEFAULT 0,
  low REAL NOT NULL DEFAULT 0,
  vol BIGINT NOT NULL DEFAULT 0,
  turn BIGINT NOT NULL DEFAULT 0,
  susp BOOLEAN NOT NULL DEFAULT FALSE,
  newsusp BOOLEAN NOT NULL DEFAULT FALSE,
  noclose BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (issueID, atDate)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ccass_quotes_nozero ON ccass_original.quotes(issueID, noclose, atDate);

-- Table: pquotes - Parallel trading quotes
CREATE TABLE IF NOT EXISTS ccass_original.pquotes (
  issueID INTEGER NOT NULL,
  atDate DATE NOT NULL,
  prevClose REAL NOT NULL DEFAULT 0,
  closing REAL NOT NULL DEFAULT 0,
  ask REAL NOT NULL DEFAULT 0,
  bid REAL NOT NULL DEFAULT 0,
  high REAL NOT NULL DEFAULT 0,
  low REAL NOT NULL DEFAULT 0,
  vol BIGINT NOT NULL DEFAULT 0,
  turn BIGINT NOT NULL DEFAULT 0,
  susp BOOLEAN NOT NULL DEFAULT FALSE,
  newsusp BOOLEAN NOT NULL DEFAULT FALSE,
  noclose BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (issueID, atDate)
);

-- Table: shortnames - Stock code to name mapping
CREATE TABLE IF NOT EXISTS ccass_original.shortnames (
  ID SERIAL PRIMARY KEY,
  issueID INTEGER DEFAULT NULL,
  shortName VARCHAR(45) NOT NULL,
  fromDate DATE NOT NULL,
  toDate DATE DEFAULT NULL,
  stockCode VARCHAR(5) DEFAULT NULL,
  useDate DATE NOT NULL,
  stockExID SMALLINT NOT NULL,
  parallel BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ccass_shortnames_name ON ccass_original.shortnames(shortName);

-- Table: specialdays - Market holidays and special events
CREATE TABLE IF NOT EXISTS ccass_original.specialdays (
  specialDate DATE NOT NULL,
  pubHol BOOLEAN NOT NULL DEFAULT FALSE,
  partSess BOOLEAN NOT NULL DEFAULT FALSE,
  noAM BOOLEAN NOT NULL DEFAULT FALSE,
  noPM BOOLEAN NOT NULL DEFAULT FALSE,
  noSettle BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (specialDate)
);

-- Table: sehkmonthend - Month end dates
CREATE TABLE IF NOT EXISTS ccass_original.sehkmonthend (
  monthEnd DATE NOT NULL,
  PRIMARY KEY (monthEnd)
);

-- Table: unquotes - Unlisted stock quotes
CREATE TABLE IF NOT EXISTS ccass_original.unquotes (
  stockCode INTEGER NOT NULL,
  atDate DATE NOT NULL,
  prevClose REAL DEFAULT 0,
  closing REAL NOT NULL DEFAULT 0,
  ask REAL NOT NULL DEFAULT 0,
  bid REAL NOT NULL DEFAULT 0,
  high REAL NOT NULL DEFAULT 0,
  low REAL NOT NULL DEFAULT 0,
  vol BIGINT NOT NULL DEFAULT 0,
  turn BIGINT NOT NULL DEFAULT 0,
  susp BOOLEAN NOT NULL DEFAULT FALSE,
  newsusp BOOLEAN NOT NULL DEFAULT FALSE,
  noclose BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (stockCode, atDate)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ccass_unquotes_nozero ON ccass_original.unquotes(stockCode, noclose, atDate);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_ccass_holdings_partid ON ccass_original.holdings(partID);
CREATE INDEX IF NOT EXISTS idx_ccass_holdings_issueid ON ccass_original.holdings(issueID);
CREATE INDEX IF NOT EXISTS idx_ccass_holdings_date ON ccass_original.holdings(atDate);

CREATE INDEX IF NOT EXISTS idx_ccass_parthold_partid ON ccass_original.parthold(partID);
CREATE INDEX IF NOT EXISTS idx_ccass_parthold_issueid ON ccass_original.parthold(issueID);
CREATE INDEX IF NOT EXISTS idx_ccass_parthold_date ON ccass_original.parthold(atDate);

CREATE INDEX IF NOT EXISTS idx_ccass_quotes_date ON ccass_original.quotes(atDate);
CREATE INDEX IF NOT EXISTS idx_ccass_quotes_closing ON ccass_original.quotes(closing);

CREATE INDEX IF NOT EXISTS idx_ccass_dailylog_date ON ccass_original.dailylog(atDate);
CREATE INDEX IF NOT EXISTS idx_ccass_dailylog_issueid ON ccass_original.dailylog(issueID);

-- Create full-text search indexes for Chinese character support
CREATE INDEX IF NOT EXISTS idx_ccass_participants_partname_ft 
ON ccass_original.participants USING GIN (to_tsvector('simple', partName));

CREATE INDEX IF NOT EXISTS idx_ccass_shortnames_ft 
ON ccass_original.shortnames USING GIN (to_tsvector('simple', shortName));

-- Grant permissions on new tables
GRANT ALL ON ALL TABLES IN SCHEMA ccass_original TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ccass_original TO anon, authenticated;

-- Add comments for documentation
COMMENT ON SCHEMA ccass_original IS 'CCASS (Central Clearing and Settlement System) original data structure from David Webb database';
COMMENT ON TABLE ccass_original.holdings IS 'Core CCASS shareholding data with primary key (issueID, partID, atDate)';
COMMENT ON TABLE ccass_original.parthold IS 'Alternative shareholding table with primary key (partID, issueID, atDate)';
COMMENT ON TABLE ccass_original.participants IS 'CCASS participants information';
COMMENT ON TABLE ccass_original.quotes IS 'Daily stock price and trading data';
COMMENT ON TABLE ccass_original.dailylog IS 'Daily concentration analysis and summary statistics'; 