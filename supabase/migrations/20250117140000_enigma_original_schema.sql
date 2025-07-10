-- Enigma Original Schema Migration for PostgreSQL
-- Converted from David Webb's MySQL structure to Supabase PostgreSQL
-- Date: 2025-01-17

-- Create Enigma original schema
CREATE SCHEMA IF NOT EXISTS enigma_original;

-- Grant permissions
GRANT USAGE ON SCHEMA enigma_original TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA enigma_original TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA enigma_original TO anon, authenticated;

-- Table: persons - Core identifier for all entities
CREATE TABLE IF NOT EXISTS enigma_original.persons (
  personID SERIAL PRIMARY KEY
);

-- Table: people - Individual persons data
CREATE TABLE IF NOT EXISTS enigma_original.people (
  personID INTEGER NOT NULL,
  sex CHAR(1) DEFAULT NULL,
  yob SMALLINT DEFAULT NULL,
  mob SMALLINT DEFAULT NULL,
  dob SMALLINT DEFAULT NULL,
  yod SMALLINT DEFAULT NULL,
  mond SMALLINT DEFAULT NULL,
  dodd SMALLINT DEFAULT NULL,
  titleID SMALLINT DEFAULT NULL,
  name1 VARCHAR(90) NOT NULL,
  name2 VARCHAR(63) DEFAULT NULL,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hkid VARCHAR(8) DEFAULT NULL,
  sfcid VARCHAR(6) DEFAULT NULL,
  cname VARCHAR(20) DEFAULT NULL,
  sfcupd TIMESTAMP DEFAULT NULL,
  sfclastdate DATE DEFAULT NULL,
  hkidsource VARCHAR(255) DEFAULT NULL,
  userID INTEGER NOT NULL DEFAULT 0,
  namestem CHAR(5) NOT NULL DEFAULT '',
  dn1 VARCHAR(90) NOT NULL DEFAULT '',
  dn2 VARCHAR(63) DEFAULT NULL,
  dsex CHAR(1) DEFAULT NULL,
  PRIMARY KEY (personID),
  UNIQUE (name1, name2),
  UNIQUE (sfcid),
  UNIQUE (hkid),
  FOREIGN KEY (personID) REFERENCES enigma_original.persons(personID) ON DELETE CASCADE
);

-- Table: organisations - Corporate entities data
CREATE TABLE IF NOT EXISTS enigma_original.organisations (
  personID INTEGER NOT NULL,
  name1 VARCHAR(255),
  name2 VARCHAR(255),
  cname VARCHAR(255),
  incorpdate DATE,
  regid VARCHAR(50),
  domicileid SMALLINT,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (personID),
  FOREIGN KEY (personID) REFERENCES enigma_original.persons(personID) ON DELETE CASCADE
);

-- Table: positions - Director/officer positions
CREATE TABLE IF NOT EXISTS enigma_original.positions (
  positionID SERIAL PRIMARY KEY,
  posshort VARCHAR(21) NOT NULL,
  poslong VARCHAR(70) NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0,
  rank SMALLINT NOT NULL,
  lsrole SMALLINT DEFAULT NULL
);

-- Table: directorships - Director appointments
CREATE TABLE IF NOT EXISTS enigma_original.directorships (
  id SERIAL PRIMARY KEY,
  director INTEGER NOT NULL,
  company INTEGER NOT NULL,
  positionid SMALLINT NOT NULL,
  apptdate DATE,
  apptacc SMALLINT DEFAULT NULL,
  resdate DATE,
  resacc SMALLINT DEFAULT NULL,
  notes TEXT,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  userid INTEGER NOT NULL DEFAULT 0,
  eventid INTEGER DEFAULT NULL,
  FOREIGN KEY (director) REFERENCES enigma_original.persons(personID),
  FOREIGN KEY (company) REFERENCES enigma_original.persons(personID),
  FOREIGN KEY (positionid) REFERENCES enigma_original.positions(positionID)
);

-- Table: issue - Securities/stocks
CREATE TABLE IF NOT EXISTS enigma_original.issue (
  id1 SERIAL PRIMARY KEY,
  name1 VARCHAR(255),
  name2 VARCHAR(255),
  cname VARCHAR(255),
  issuer INTEGER NOT NULL,
  typeid SMALLINT NOT NULL DEFAULT 0,
  par REAL DEFAULT NULL,
  currid SMALLINT DEFAULT NULL,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  userid INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (issuer) REFERENCES enigma_original.persons(personID)
);

-- Table: stocklistings - Stock exchange listings
CREATE TABLE IF NOT EXISTS enigma_original.stocklistings (
  issueid INTEGER NOT NULL,
  stockcode VARCHAR(5) NOT NULL,
  stockexid SMALLINT NOT NULL,
  secondctr BOOLEAN NOT NULL DEFAULT FALSE,
  firsttradedate DATE DEFAULT NULL,
  delistdate DATE DEFAULT NULL,
  id SERIAL,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  userid INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (issueid) REFERENCES enigma_original.issue(id1)
);

-- Table: sectypes - Security types
CREATE TABLE IF NOT EXISTS enigma_original.sectypes (
  typeid SERIAL PRIMARY KEY,
  typeshort VARCHAR(50),
  typename VARCHAR(255)
);

-- Table: domiciles - Jurisdictions
CREATE TABLE IF NOT EXISTS enigma_original.domiciles (
  domicileid SERIAL PRIMARY KEY,
  domname VARCHAR(100),
  domshort VARCHAR(10)
);

-- Table: roles - Advisory roles
CREATE TABLE IF NOT EXISTS enigma_original.roles (
  roleid SERIAL PRIMARY KEY,
  rolename VARCHAR(100),
  roleshort VARCHAR(50)
);

-- Table: adviserships - Professional services appointments
CREATE TABLE IF NOT EXISTS enigma_original.adviserships (
  id SERIAL PRIMARY KEY,
  company INTEGER NOT NULL,
  adviser INTEGER NOT NULL,
  role SMALLINT NOT NULL,
  adddate DATE,
  addacc SMALLINT,
  dropdate DATE,
  dropacc SMALLINT,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (company) REFERENCES enigma_original.persons(personID),
  FOREIGN KEY (adviser) REFERENCES enigma_original.persons(personID),
  FOREIGN KEY (role) REFERENCES enigma_original.roles(roleid)
);

-- Table: sholdings - Shareholdings
CREATE TABLE IF NOT EXISTS enigma_original.sholdings (
  id SERIAL PRIMARY KEY,
  issueid INTEGER NOT NULL,
  holderid INTEGER NOT NULL,
  heldas SMALLINT NOT NULL DEFAULT 0,
  atdate DATE NOT NULL,
  stakes REAL DEFAULT NULL,
  shares BIGINT DEFAULT NULL,
  userid INTEGER NOT NULL DEFAULT 0,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issueid) REFERENCES enigma_original.issue(id1),
  FOREIGN KEY (holderid) REFERENCES enigma_original.persons(personID)
);

-- Table: events - Corporate events
CREATE TABLE IF NOT EXISTS enigma_original.events (
  eventid SERIAL PRIMARY KEY,
  issueid INTEGER NOT NULL,
  announced DATE,
  eventtype SMALLINT NOT NULL,
  yearend DATE DEFAULT NULL,
  exdate DATE DEFAULT NULL,
  bookclosefr DATE DEFAULT NULL,
  bookcloseto DATE DEFAULT NULL,
  distdate DATE DEFAULT NULL,
  new REAL DEFAULT NULL,
  old REAL DEFAULT NULL,
  currid SMALLINT DEFAULT NULL,
  price REAL DEFAULT NULL,
  pricehkd REAL DEFAULT NULL,
  issue2 INTEGER DEFAULT NULL,
  notes TEXT,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issueid) REFERENCES enigma_original.issue(id1)
);

-- Table: issuedshares - Outstanding shares data
CREATE TABLE IF NOT EXISTS enigma_original.issuedshares (
  id SERIAL PRIMARY KEY,
  issueid INTEGER NOT NULL,
  atdate DATE NOT NULL,
  outstanding BIGINT NOT NULL,
  userid INTEGER NOT NULL DEFAULT 0,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issueid) REFERENCES enigma_original.issue(id1)
);

-- Table: currencies - Currency data
CREATE TABLE IF NOT EXISTS enigma_original.currencies (
  currid SERIAL PRIMARY KEY,
  currcode VARCHAR(3) NOT NULL,
  currname VARCHAR(50)
);

-- Table: titles - Personal titles
CREATE TABLE IF NOT EXISTS enigma_original.titles (
  titleid SERIAL PRIMARY KEY,
  titlelong VARCHAR(50),
  titleshort VARCHAR(10)
);

-- Table: alias - Alternative names
CREATE TABLE IF NOT EXISTS enigma_original.alias (
  personid INTEGER NOT NULL,
  alias VARCHAR(255) NOT NULL,
  PRIMARY KEY (personid, alias),
  FOREIGN KEY (personid) REFERENCES enigma_original.persons(personID) ON DELETE CASCADE
);

-- Table: namechanges - Name change history
CREATE TABLE IF NOT EXISTS enigma_original.namechanges (
  id SERIAL PRIMARY KEY,
  personid INTEGER NOT NULL,
  oldname VARCHAR(255),
  newname VARCHAR(255),
  datechanged DATE NOT NULL,
  userid INTEGER NOT NULL DEFAULT 0,
  modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (personid) REFERENCES enigma_original.persons(personID)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enigma_people_names ON enigma_original.people(name1, name2);
CREATE INDEX IF NOT EXISTS idx_enigma_people_birth ON enigma_original.people(yob, mob, dob);
CREATE INDEX IF NOT EXISTS idx_enigma_people_hkid ON enigma_original.people(hkid);
CREATE INDEX IF NOT EXISTS idx_enigma_people_sfcid ON enigma_original.people(sfcid);
CREATE INDEX IF NOT EXISTS idx_enigma_people_stem ON enigma_original.people(namestem);

CREATE INDEX IF NOT EXISTS idx_enigma_orgs_name ON enigma_original.organisations(name1);
CREATE INDEX IF NOT EXISTS idx_enigma_orgs_regid ON enigma_original.organisations(regid);
CREATE INDEX IF NOT EXISTS idx_enigma_orgs_domicile ON enigma_original.organisations(domicileid);

CREATE INDEX IF NOT EXISTS idx_enigma_directors_director ON enigma_original.directorships(director);
CREATE INDEX IF NOT EXISTS idx_enigma_directors_company ON enigma_original.directorships(company);
CREATE INDEX IF NOT EXISTS idx_enigma_directors_position ON enigma_original.directorships(positionid);
CREATE INDEX IF NOT EXISTS idx_enigma_directors_appt ON enigma_original.directorships(apptdate);
CREATE INDEX IF NOT EXISTS idx_enigma_directors_res ON enigma_original.directorships(resdate);

CREATE INDEX IF NOT EXISTS idx_enigma_issue_issuer ON enigma_original.issue(issuer);
CREATE INDEX IF NOT EXISTS idx_enigma_issue_type ON enigma_original.issue(typeid);

CREATE INDEX IF NOT EXISTS idx_enigma_stocklistings_issue ON enigma_original.stocklistings(issueid);
CREATE INDEX IF NOT EXISTS idx_enigma_stocklistings_code ON enigma_original.stocklistings(stockcode);
CREATE INDEX IF NOT EXISTS idx_enigma_stocklistings_exchange ON enigma_original.stocklistings(stockexid);

CREATE INDEX IF NOT EXISTS idx_enigma_sholdings_issue ON enigma_original.sholdings(issueid);
CREATE INDEX IF NOT EXISTS idx_enigma_sholdings_holder ON enigma_original.sholdings(holderid);
CREATE INDEX IF NOT EXISTS idx_enigma_sholdings_date ON enigma_original.sholdings(atdate);

CREATE INDEX IF NOT EXISTS idx_enigma_events_issue ON enigma_original.events(issueid);
CREATE INDEX IF NOT EXISTS idx_enigma_events_type ON enigma_original.events(eventtype);
CREATE INDEX IF NOT EXISTS idx_enigma_events_exdate ON enigma_original.events(exdate);

CREATE INDEX IF NOT EXISTS idx_enigma_adviserships_company ON enigma_original.adviserships(company);
CREATE INDEX IF NOT EXISTS idx_enigma_adviserships_adviser ON enigma_original.adviserships(adviser);
CREATE INDEX IF NOT EXISTS idx_enigma_adviserships_role ON enigma_original.adviserships(role);

-- Create full-text search indexes for Chinese character support
CREATE INDEX IF NOT EXISTS idx_enigma_people_names_ft 
ON enigma_original.people USING GIN (to_tsvector('simple', COALESCE(name1, '') || ' ' || COALESCE(name2, '') || ' ' || COALESCE(cname, '')));

CREATE INDEX IF NOT EXISTS idx_enigma_orgs_names_ft 
ON enigma_original.organisations USING GIN (to_tsvector('simple', COALESCE(name1, '') || ' ' || COALESCE(name2, '') || ' ' || COALESCE(cname, '')));

CREATE INDEX IF NOT EXISTS idx_enigma_issue_names_ft 
ON enigma_original.issue USING GIN (to_tsvector('simple', COALESCE(name1, '') || ' ' || COALESCE(name2, '') || ' ' || COALESCE(cname, '')));

-- Grant permissions on new tables
GRANT ALL ON ALL TABLES IN SCHEMA enigma_original TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA enigma_original TO anon, authenticated;

-- Insert basic reference data
INSERT INTO enigma_original.sectypes (typeid, typeshort, typename) VALUES
(0, 'ORD', 'Ordinary Shares'),
(1, 'PREF', 'Preference Shares'),
(6, 'DRC', 'Depositary Receipt'),
(7, 'REIT', 'Real Estate Investment Trust'),
(8, 'ETF', 'Exchange Traded Fund'),
(10, 'BOND', 'Bond'),
(42, 'UNIT', 'Unit Trust'),
(51, 'STAPL', 'Stapled Securities')
ON CONFLICT (typeid) DO NOTHING;

INSERT INTO enigma_original.positions (positionid, posshort, poslong, status, rank) VALUES
(1, 'Chairman', 'Chairman', 0, 1),
(2, 'CEO', 'Chief Executive Officer', 0, 2),
(3, 'ED', 'Executive Director', 0, 3),
(4, 'INED', 'Independent Non-executive Director', 0, 4),
(5, 'NED', 'Non-executive Director', 0, 5),
(6, 'CFO', 'Chief Financial Officer', 0, 6),
(7, 'CoSec', 'Company Secretary', 0, 7),
(8, 'MD', 'Managing Director', 0, 8)
ON CONFLICT (positionid) DO NOTHING;

INSERT INTO enigma_original.roles (roleid, rolename, roleshort) VALUES
(1, 'Auditor', 'Auditor'),
(2, 'Legal Adviser', 'Legal'),
(3, 'Financial Adviser', 'Fin Adviser'),
(4, 'Sponsor', 'Sponsor'),
(5, 'Principal Banker', 'Banker'),
(6, 'Share Registrar', 'Registrar'),
(7, 'Compliance Adviser', 'Compliance')
ON CONFLICT (roleid) DO NOTHING;

INSERT INTO enigma_original.domiciles (domicileid, domname, domshort) VALUES
(1, 'Hong Kong', 'HK'),
(2, 'Cayman Islands', 'Cayman'),
(3, 'British Virgin Islands', 'BVI'),
(4, 'Bermuda', 'Bermuda'),
(5, 'Singapore', 'SG'),
(6, 'United Kingdom', 'UK'),
(7, 'United States', 'US'),
(8, 'China', 'CN')
ON CONFLICT (domicileid) DO NOTHING;

INSERT INTO enigma_original.currencies (currid, currcode, currname) VALUES
(1, 'HKD', 'Hong Kong Dollar'),
(2, 'USD', 'US Dollar'),
(3, 'CNY', 'Chinese Yuan'),
(4, 'GBP', 'British Pound'),
(5, 'SGD', 'Singapore Dollar'),
(6, 'EUR', 'Euro'),
(7, 'JPY', 'Japanese Yen')
ON CONFLICT (currid) DO NOTHING;

INSERT INTO enigma_original.titles (titleid, titlelong, titleshort) VALUES
(1, 'Mister', 'Mr'),
(2, 'Missus', 'Mrs'),
(3, 'Miss', 'Ms'),
(4, 'Doctor', 'Dr'),
(5, 'Professor', 'Prof'),
(6, 'Sir', 'Sir'),
(7, 'Dame', 'Dame'),
(8, 'Lord', 'Lord'),
(9, 'Lady', 'Lady')
ON CONFLICT (titleid) DO NOTHING;

-- Add comments for documentation
COMMENT ON SCHEMA enigma_original IS 'Enigma original data structure from David Webb database - 35-year Hong Kong corporate governance dataset';
COMMENT ON TABLE enigma_original.people IS 'Individual persons with detailed identity information';
COMMENT ON TABLE enigma_original.organisations IS 'Corporate entities and their incorporation details';
COMMENT ON TABLE enigma_original.directorships IS 'Director and officer appointments with dates';
COMMENT ON TABLE enigma_original.issue IS 'Securities and financial instruments';
COMMENT ON TABLE enigma_original.sholdings IS 'Shareholding records over time';
COMMENT ON TABLE enigma_original.events IS 'Corporate events like dividends, splits, and rights issues'; 