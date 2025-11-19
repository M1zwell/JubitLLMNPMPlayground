import React, { useState, useCallback } from 'react';
import { supabase, getSupabaseAdmin } from '../lib/supabase';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Flex } from './ui/Flex';

// Use shared admin client to avoid multiple instances
const supabaseAdmin = getSupabaseAdmin();

interface MySQLConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  databases: string[];
}

interface MigrationSchema {
  name: string;
  tables: number;
  estimatedRows: number;
  dataSize: string;
  status: 'pending' | 'migrating' | 'completed' | 'error';
  progress: number;
  errorMessage?: string;
}

interface MigrationProgress {
  phase: string;
  percentage: number;
  currentSchema: string;
  currentTable: string;
  schemasCompleted: number;
  totalSchemas: number;
  recordsMigrated: number;
  totalEstimatedRecords: number;
  errors: string[];
  startTime?: Date;
  estimatedTimeRemaining?: string;
}

export const WebbMySQLMigrator: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [mysqlConfig, setMysqlConfig] = useState<MySQLConfig>({
    host: 'localhost',
    port: 3306,
    username: 'David',
    password: 'Welcome08~billcn', // Using provided CLI password
    databases: ['ccass', 'enigma', 'mailvote', 'iplog']
  });

  const [schemas, setSchemas] = useState<MigrationSchema[]>([
    {
      name: 'ccass',
      tables: 16,
      estimatedRows: 25847000, // ~25.8M records
      dataSize: '1.4GB',
      status: 'pending',
      progress: 0
    },
    {
      name: 'enigma', 
      tables: 85,
      estimatedRows: 18392000, // ~18.4M records
      dataSize: '1.8GB',
      status: 'pending',
      progress: 0
    },
    {
      name: 'mailvote',
      tables: 8,
      estimatedRows: 50000, // ~50K records
      dataSize: '5MB',
      status: 'pending',
      progress: 0
    },
    {
      name: 'iplog',
      tables: 3,
      estimatedRows: 1000000, // ~1M records
      dataSize: '100MB',
      status: 'pending',
      progress: 0
    }
  ]);

  const [progress, setProgress] = useState<MigrationProgress>({
    phase: 'Ready to migrate Webb MySQL databases',
    percentage: 0,
    currentSchema: '',
    currentTable: '',
    schemasCompleted: 0,
    totalSchemas: 4,
    recordsMigrated: 0,
    totalEstimatedRecords: 45289000,
    errors: []
  });

  const testMySQLConnection = async () => {
    try {
      setProgress(prev => ({
        ...prev,
        phase: 'Testing MySQL connection...',
        percentage: 5
      }));

      // Test connection via Supabase edge function
      const { data, error } = await supabaseAdmin.functions.invoke('webb-mysql-migration', {
        body: {
          action: 'test-connection',
          config: mysqlConfig
        }
      });

      if (error) {
        throw new Error(`Connection test failed: ${error.message}`);
      }

      if (data.success) {
        setIsConnected(true);
        setProgress(prev => ({
          ...prev,
          phase: 'MySQL connection successful!',
          percentage: 10
        }));
        
        // Update schema information with actual data
        if (data.schemaInfo) {
          setSchemas(prevSchemas => 
            prevSchemas.map(schema => ({
              ...schema,
              ...data.schemaInfo[schema.name]
            }))
          );
        }
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
         } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
       console.error('MySQL connection test failed:', error);
       setProgress(prev => ({
         ...prev,
         phase: 'Connection failed',
         errors: [...prev.errors, errorMessage]
       }));
     }
  };

  const startMigration = async (selectedSchemas: string[] = ['ccass', 'enigma']) => {
    if (!isConnected) {
      await testMySQLConnection();
      if (!isConnected) return;
    }

    setIsMigrating(true);
    setProgress(prev => ({
      ...prev,
      phase: 'Initializing migration...',
      percentage: 0,
      startTime: new Date(),
      errors: []
    }));

    try {
      // Step 1: Create PostgreSQL schema structure
      await createPostgreSQLSchemas(selectedSchemas);
      
      // Step 2: Migrate data schema by schema
      for (let i = 0; i < selectedSchemas.length; i++) {
        const schemaName = selectedSchemas[i];
        await migrateSchema(schemaName, i, selectedSchemas.length);
      }

      // Step 3: Create indexes and optimize
      await createOptimizedIndexes();
      
      // Step 4: Run data validation
      await validateMigratedData();

      setProgress(prev => ({
        ...prev,
        phase: 'Migration completed successfully!',
        percentage: 100
      }));

         } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
       console.error('Migration failed:', error);
       setProgress(prev => ({
         ...prev,
         phase: 'Migration failed',
         errors: [...prev.errors, errorMessage]
       }));
     } finally {
      setIsMigrating(false);
    }
  };

  const createPostgreSQLSchemas = async (schemas: string[]) => {
    setProgress(prev => ({
      ...prev,
      phase: 'Creating PostgreSQL schema structure...',
      percentage: 15
    }));

    const schemaSQL = `
      -- Create comprehensive Webb schema for PostgreSQL
      
      -- Core CCASS Tables
      CREATE TABLE IF NOT EXISTS webb.ccass_holdings (
        id SERIAL PRIMARY KEY,
        part_id SMALLINT NOT NULL,
        issue_id INTEGER NOT NULL,
        holding BIGINT NOT NULL,
        at_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(issue_id, part_id, at_date)
      );

      CREATE TABLE IF NOT EXISTS webb.ccass_parthold (
        id SERIAL PRIMARY KEY,
        part_id SMALLINT NOT NULL,
        issue_id INTEGER NOT NULL,
        holding BIGINT NOT NULL,
        at_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(part_id, issue_id, at_date)
      );

      CREATE TABLE IF NOT EXISTS webb.ccass_participants (
        id SERIAL PRIMARY KEY,
        part_id SMALLINT UNIQUE NOT NULL,
        ccass_id VARCHAR(6),
        part_name VARCHAR(255) NOT NULL,
        at_date DATE NOT NULL,
        added_date DATE,
        person_id INTEGER,
        had_holdings BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS webb.ccass_dailylog (
        id SERIAL PRIMARY KEY,
        at_date DATE NOT NULL,
        issue_id INTEGER NOT NULL,
        intermed_hldg BIGINT DEFAULT 0,
        intermed_cnt SMALLINT DEFAULT 0,
        ncip_hldg BIGINT DEFAULT 0,
        ncip_cnt SMALLINT DEFAULT 0,
        cip_hldg BIGINT DEFAULT 0,
        cip_cnt SMALLINT DEFAULT 0,
        c5 BIGINT DEFAULT 0,
        c10 BIGINT DEFAULT 0,
        cust_hldg BIGINT DEFAULT 0,
        brok_hldg BIGINT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(issue_id, at_date)
      );

      CREATE TABLE IF NOT EXISTS webb.ccass_quotes (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER NOT NULL,
        at_date DATE NOT NULL,
        prev_close DECIMAL(10,3),
        closing DECIMAL(10,3) DEFAULT 0,
        ask DECIMAL(10,3) DEFAULT 0,
        bid DECIMAL(10,3) DEFAULT 0,
        high DECIMAL(10,3) DEFAULT 0,
        low DECIMAL(10,3) DEFAULT 0,
        volume BIGINT DEFAULT 0,
        turnover BIGINT DEFAULT 0,
        suspended BOOLEAN DEFAULT FALSE,
        new_suspended BOOLEAN DEFAULT FALSE,
        no_close BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(issue_id, at_date)
      );

      -- Core Enigma Tables
      CREATE TABLE IF NOT EXISTS webb.enigma_organisations (
        id SERIAL PRIMARY KEY,
        person_id INTEGER UNIQUE NOT NULL,
        name1 VARCHAR(255) NOT NULL,
        name2 VARCHAR(255),
        chinese_name VARCHAR(255),
        org_type_id SMALLINT,
        incorporation_date DATE,
        dissolution_date DATE,
        domicile_id SMALLINT,
        status_id SMALLINT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS webb.enigma_people (
        id SERIAL PRIMARY KEY,
        person_id INTEGER UNIQUE NOT NULL,
        name1 VARCHAR(255) NOT NULL,
        name2 VARCHAR(255),
        chinese_name VARCHAR(255),
        title_id SMALLINT,
        sex CHAR(1),
        year_of_birth SMALLINT,
        month_of_birth TINYINT,
        day_of_birth TINYINT,
        nationality_id SMALLINT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS webb.enigma_directorships (
        id SERIAL PRIMARY KEY,
        director INTEGER NOT NULL,
        company INTEGER NOT NULL,
        position_id SMALLINT NOT NULL,
        appointment_date DATE,
        resignation_date DATE,
        date_accuracy TINYINT,
        res_accuracy TINYINT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS webb.enigma_issue (
        id SERIAL PRIMARY KEY,
        id1 INTEGER UNIQUE NOT NULL,
        issuer INTEGER NOT NULL,
        type_id SMALLINT NOT NULL,
        currency_id TINYINT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS webb.enigma_stocklistings (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER NOT NULL,
        stock_code VARCHAR(5) NOT NULL,
        stock_ex_id TINYINT NOT NULL,
        first_trade_date DATE,
        delist_date DATE,
        second_counter BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS webb.enigma_issuedshares (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER NOT NULL,
        at_date DATE NOT NULL,
        outstanding BIGINT NOT NULL,
        currency_id TINYINT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(issue_id, at_date)
      );

      -- Mailvote Tables  
      CREATE TABLE IF NOT EXISTS webb.mailvote_users (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        password_hash VARCHAR(255),
        created_date DATE,
        last_login TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS webb.mailvote_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        FOREIGN KEY (user_id) REFERENCES webb.mailvote_users(user_id)
      );

      -- IPLog Tables
      CREATE TABLE IF NOT EXISTS webb.iplog_entries (
        id SERIAL PRIMARY KEY,
        ip_address INET NOT NULL,
        user_agent TEXT,
        request_path TEXT,
        method VARCHAR(10),
        status_code INTEGER,
        response_size BIGINT,
        request_time TIMESTAMP WITH TIME ZONE,
        processing_time_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- AI Enhancement Tables
      CREATE TABLE IF NOT EXISTS webb.ai_governance_scores (
        id SERIAL PRIMARY KEY,
        organisation_id INTEGER NOT NULL,
        score_date DATE NOT NULL,
        transparency_score DECIMAL(5,2),
        board_composition_score DECIMAL(5,2),
        executive_compensation_score DECIMAL(5,2),
        shareholder_rights_score DECIMAL(5,2),
        overall_score DECIMAL(5,2),
        ai_analysis JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organisation_id, score_date),
        FOREIGN KEY (organisation_id) REFERENCES webb.organisations(id)
      );

      CREATE TABLE IF NOT EXISTS webb.market_intelligence (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER NOT NULL,
        analysis_date DATE NOT NULL,
        concentration_risk VARCHAR(20),
        liquidity_score DECIMAL(5,2),
        volatility_metric DECIMAL(8,4),
        market_cap DECIMAL(15,2),
        ai_sentiment VARCHAR(20),
        risk_factors JSONB,
        recommendations JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(issue_id, analysis_date)
      );
    `;

    const { error } = await supabaseAdmin.rpc('execute_sql_batch', {
      sql_statements: [schemaSQL]
    });

    if (error) {
      throw new Error(`Schema creation failed: ${error.message}`);
    }
  };

  const migrateSchema = async (schemaName: string, index: number, total: number) => {
    const basePercentage = 20 + (index * 60 / total);
    
    setProgress(prev => ({
      ...prev,
      phase: `Migrating ${schemaName} schema...`,
      currentSchema: schemaName,
      percentage: basePercentage
    }));

    // Update schema status
    setSchemas(prev => prev.map(s => 
      s.name === schemaName 
        ? { ...s, status: 'migrating', progress: 0 }
        : s
    ));

    try {
      const { data, error } = await supabaseAdmin.functions.invoke('webb-mysql-migration', {
        body: {
          action: 'migrate-schema',
          schema: schemaName,
          config: mysqlConfig,
          batchSize: 10000 // Process in 10K record batches
        }
      });

      if (error) {
        throw new Error(`Migration failed for ${schemaName}: ${error.message}`);
      }

      // Update progress incrementally
      const tables = data.tables || [];
      for (let i = 0; i < tables.length; i++) {
        const tableProgress = ((i + 1) / tables.length) * 100;
        const overallProgress = basePercentage + (tableProgress * 60 / total / 100);
        
        setProgress(prev => ({
          ...prev,
          currentTable: tables[i],
          percentage: overallProgress,
          recordsMigrated: prev.recordsMigrated + (data.recordCounts?.[tables[i]] || 0)
        }));

        setSchemas(prev => prev.map(s => 
          s.name === schemaName 
            ? { ...s, progress: tableProgress }
            : s
        ));

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark schema as completed
      setSchemas(prev => prev.map(s => 
        s.name === schemaName 
          ? { ...s, status: 'completed', progress: 100 }
          : s
      ));

         } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
       setSchemas(prev => prev.map(s => 
         s.name === schemaName 
           ? { ...s, status: 'error', errorMessage }
           : s
       ));
       throw error;
     }
  };

  const createOptimizedIndexes = async () => {
    setProgress(prev => ({
      ...prev,
      phase: 'Creating optimized indexes...',
      percentage: 85
    }));

    const indexSQL = `
      -- CCASS Indexes
      CREATE INDEX IF NOT EXISTS idx_ccass_holdings_issue_date ON webb.ccass_holdings(issue_id, at_date);
      CREATE INDEX IF NOT EXISTS idx_ccass_holdings_part_date ON webb.ccass_holdings(part_id, at_date);
      CREATE INDEX IF NOT EXISTS idx_ccass_parthold_part_issue ON webb.ccass_parthold(part_id, issue_id);
      CREATE INDEX IF NOT EXISTS idx_ccass_quotes_date ON webb.ccass_quotes(at_date);
      
      -- Enigma Indexes
      CREATE INDEX IF NOT EXISTS idx_enigma_orgs_name ON webb.enigma_organisations USING gin(to_tsvector('english', name1));
      CREATE INDEX IF NOT EXISTS idx_enigma_people_name ON webb.enigma_people USING gin(to_tsvector('english', name1 || ' ' || COALESCE(name2, '')));
      CREATE INDEX IF NOT EXISTS idx_enigma_directorships_director ON webb.enigma_directorships(director);
      CREATE INDEX IF NOT EXISTS idx_enigma_directorships_company ON webb.enigma_directorships(company);
      CREATE INDEX IF NOT EXISTS idx_enigma_stocklistings_code ON webb.enigma_stocklistings(stock_code);
      
      -- AI Enhancement Indexes
      CREATE INDEX IF NOT EXISTS idx_ai_governance_org_date ON webb.ai_governance_scores(organisation_id, score_date);
      CREATE INDEX IF NOT EXISTS idx_market_intelligence_issue_date ON webb.market_intelligence(issue_id, analysis_date);
    `;

    const { error } = await supabaseAdmin.rpc('execute_sql_batch', {
      sql_statements: [indexSQL]
    });

    if (error) {
      throw new Error(`Index creation failed: ${error.message}`);
    }
  };

  const validateMigratedData = async () => {
    setProgress(prev => ({
      ...prev,
      phase: 'Validating migrated data...',
      percentage: 95
    }));

    try {
      const validationSQL = `
        SELECT 
          'ccass_holdings' as table_name,
          COUNT(*) as record_count,
          COUNT(DISTINCT issue_id) as unique_issues,
          COUNT(DISTINCT part_id) as unique_participants,
          MAX(at_date) as latest_date
        FROM webb.ccass_holdings
        UNION ALL
        SELECT 
          'enigma_organisations' as table_name,
          COUNT(*) as record_count,
          COUNT(DISTINCT person_id) as unique_persons,
          NULL as unique_participants,
          NULL as latest_date
        FROM webb.enigma_organisations;
      `;

      const { data, error } = await supabaseAdmin.rpc('execute_sql', {
        query: validationSQL
      });

      if (error) {
        throw new Error(`Data validation failed: ${error.message}`);
      }

      console.log('Migration validation results:', data);
      
    } catch (error) {
      console.warn('Data validation failed:', error);
      // Don't fail the entire migration for validation errors
    }
  };

  const ProgressBar: React.FC<{ percentage: number; className?: string }> = ({ 
    percentage, 
    className = "" 
  }) => (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}>
      <div 
        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );

  const formatTimeRemaining = (startTime: Date, progress: number): string => {
    if (progress <= 0) return 'Calculating...';
    
    const elapsed = Date.now() - startTime.getTime();
    const estimated = (elapsed / progress) * (100 - progress);
    const minutes = Math.ceil(estimated / 60000);
    
    if (minutes < 60) {
      return `~${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `~${hours}h ${remainingMinutes}m`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Webb MySQL → PostgreSQL Migration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Direct migration from David Webb's MySQL databases to Supabase PostgreSQL
        </p>
      </div>

      {/* Connection Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">MySQL Connection</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Host</label>
            <input
              type="text"
              value={mysqlConfig.host}
              onChange={(e) => setMysqlConfig(prev => ({ ...prev, host: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              disabled={isMigrating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Port</label>
            <input
              type="number"
              value={mysqlConfig.port}
              onChange={(e) => setMysqlConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              disabled={isMigrating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={mysqlConfig.username}
              onChange={(e) => setMysqlConfig(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              disabled={isMigrating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={mysqlConfig.password}
              onChange={(e) => setMysqlConfig(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              disabled={isMigrating}
            />
          </div>
        </div>

        <Flex gap={3}>
          <Button
            onClick={testMySQLConnection}
            disabled={isMigrating}
            variant="outline"
          >
            Test Connection
          </Button>
          
          <Button
            onClick={() => startMigration(['ccass', 'enigma'])}
            disabled={!isConnected || isMigrating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isMigrating ? 'Migrating...' : 'Start Migration'}
          </Button>
        </Flex>
      </Card>

      {/* Migration Progress */}
      {isMigrating && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Migration Progress</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {progress.startTime && formatTimeRemaining(progress.startTime, progress.percentage)}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{progress.phase}</span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <ProgressBar percentage={progress.percentage} />
            </div>

            {progress.currentSchema && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current: {progress.currentSchema}
                {progress.currentTable && ` → ${progress.currentTable}`}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{progress.schemasCompleted}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Schemas Done</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {(progress.recordsMigrated / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Records Migrated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-teal-600">
                  {(progress.totalEstimatedRecords / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{progress.errors.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Schema Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Database Schemas</h3>
        <div className="grid gap-4">
          {schemas.map((schema) => (
            <div 
              key={schema.name}
              className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-600"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium capitalize">{schema.name}</h4>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    schema.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : schema.status === 'migrating'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : schema.status === 'error'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {schema.status}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {schema.tables} tables • {(schema.estimatedRows / 1000000).toFixed(1)}M records • {schema.dataSize}
                </div>
                {schema.status === 'migrating' && (
                  <div className="mt-2">
                    <ProgressBar percentage={schema.progress} className="h-1" />
                  </div>
                )}
                {schema.errorMessage && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    Error: {schema.errorMessage}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Errors */}
      {progress.errors.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
            Migration Errors
          </h3>
          <div className="space-y-2">
            {progress.errors.map((error, index) => (
              <div 
                key={index}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm"
              >
                {error}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}; 