import React, { useState, useCallback } from 'react';
import { supabase, getSupabaseAdmin, supabaseUrlForLogging } from '../lib/supabase';

// Use shared admin client to avoid multiple instances
const supabaseAdmin = getSupabaseAdmin();

interface MigrationProgress {
  phase: string;
  currentFile: string;
  percentage: number;
  recordsProcessed: number;
  totalRecords: number;
  errors: string[];
  startTime: Date | null;
  isActive: boolean;
}

interface SQLFile {
  name: string;
  path: string;
  size: string;
  type: 'structure' | 'data' | 'triggers';
  schema: 'ccass' | 'enigma';
  estimated_records?: number;
}

const SQL_FILES: SQLFile[] = [
  {
    name: 'CCASS Structure',
    path: 'supabase/webb/CCASS schema/ccassStructure-2025-07-05- 600.sql',
    size: '67KB',
    type: 'structure',
    schema: 'ccass',
    estimated_records: 0
  },
  {
    name: 'CCASS Data',
    path: 'supabase/webb/CCASS schema/ccassData-2025-07-05- 600.sql',
    size: '15GB',
    type: 'data',
    schema: 'ccass',
    estimated_records: 25847000
  },
  {
    name: 'Enigma Structure',
    path: 'supabase/webb/Enigma schema/enigmaStructure-2025-07-05- 000.sql',
    size: '437KB',
    type: 'structure',
    schema: 'enigma',
    estimated_records: 0
  },
  {
    name: 'Enigma Data',
    path: 'supabase/webb/Enigma schema/enigmaData-2025-07-05- 000.sql',
    size: '11GB',
    type: 'data',
    schema: 'enigma',
    estimated_records: 18392000
  },
  {
    name: 'Enigma Triggers',
    path: 'supabase/webb/Enigma schema/enigmaTriggers-2025-07-05- 000.sql',
    size: '22KB',
    type: 'triggers',
    schema: 'enigma',
    estimated_records: 0
  }
];

export const WebbDirectSQLUploader: React.FC = () => {
  const [progress, setProgress] = useState<MigrationProgress>({
    phase: 'Ready',
    currentFile: '',
    percentage: 0,
    recordsProcessed: 0,
    totalRecords: 0,
    errors: [],
    startTime: null,
    isActive: false
  });

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(1000);

  const processFile = async (file: SQLFile): Promise<void> => {
    setProgress(prev => ({
      ...prev,
      currentFile: file.name,
      phase: `Processing ${file.name}...`,
      percentage: 0,
      recordsProcessed: 0,
      totalRecords: file.estimated_records || 1000
    }));

    try {
      // Read file content using Node.js fs (this would need to be adapted for browser environment)
      const response = await fetch(`/${file.path}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${file.name}: ${response.statusText}`);
      }

      const sqlContent = await response.text();
      
      // Parse SQL content
      await processSQLContent(sqlContent, file);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProgress(prev => ({
        ...prev,
        errors: [...prev.errors, `${file.name}: ${errorMessage}`],
        phase: `Error processing ${file.name}`
      }));
      throw error;
    }
  };

  const processSQLContent = async (sqlContent: string, file: SQLFile): Promise<void> => {
    // Split SQL content into statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    const totalStatements = statements.length;
    let processedStatements = 0;

    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);
      
      try {
        // Execute batch using Supabase edge function
        const { data, error } = await supabaseAdmin.functions.invoke('webb-mysql-migration', {
          body: {
            action: 'execute_sql_batch',
            statements: batch,
            schema: file.schema,
            database_password: 'Welcome08~billcn'
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        processedStatements += batch.length;
        const percentage = (processedStatements / totalStatements) * 100;

        setProgress(prev => ({
          ...prev,
          percentage,
          recordsProcessed: processedStatements,
          phase: `Processing ${file.name}: ${processedStatements}/${totalStatements} statements`
        }));

        // Add delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setProgress(prev => ({
          ...prev,
          errors: [...prev.errors, `Batch ${i}-${i + batch.length}: ${errorMessage}`]
        }));
      }
    }
  };

  const startMigration = useCallback(async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to process.');
      return;
    }

    setProgress({
      phase: 'Starting migration...',
      currentFile: '',
      percentage: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      errors: [],
      startTime: new Date(),
      isActive: true
    });

    try {
      // Filter selected files
      const filesToProcess = SQL_FILES.filter(file => selectedFiles.includes(file.name));
      
      // Sort files by type (structure first, then data, then triggers)
      const sortedFiles = filesToProcess.sort((a, b) => {
        const typeOrder = { structure: 1, data: 2, triggers: 3 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      for (const file of sortedFiles) {
        await processFile(file);
      }

      setProgress(prev => ({
        ...prev,
        phase: 'Migration completed successfully!',
        isActive: false,
        percentage: 100
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProgress(prev => ({
        ...prev,
        phase: 'Migration failed',
        errors: [...prev.errors, errorMessage],
        isActive: false
      }));
    }
  }, [selectedFiles, batchSize]);

  const handleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  };

  const formatTime = (date: Date | null) => {
    return date ? date.toLocaleTimeString() : '';
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Webb Direct SQL Uploader</h1>
        <p className="text-blue-100">
          Direct upload and processing of Webb CCASS and Enigma SQL files to Supabase PostgreSQL
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-gray-800 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Migration Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Batch Size</label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              min={100}
              max={10000}
              step={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Database Password</label>
            <input
              type="password"
              value="Welcome08~billcn"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* File Selection */}
      <div className="bg-gray-800 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">SQL Files Selection</h2>
        
        <div className="space-y-3">
          {SQL_FILES.map((file) => (
            <div key={file.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={file.name}
                  checked={selectedFiles.includes(file.name)}
                  onChange={() => handleFileSelection(file.name)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor={file.name} className="font-medium cursor-pointer">
                    {file.name}
                  </label>
                  <div className="text-sm text-gray-500">
                    {file.schema.toUpperCase()} • {file.type} • {formatFileSize(file.size)}
                    {file.estimated_records && ` • ~${file.estimated_records.toLocaleString()} records`}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  file.type === 'structure' ? 'bg-blue-100 text-blue-800' :
                  file.type === 'data' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {file.type}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  file.schema === 'ccass' ? 'bg-orange-100 text-orange-800' :
                  'bg-indigo-100 text-indigo-800'
                }`}>
                  {file.schema.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedFiles.length} of {SQL_FILES.length} files selected
          </div>
          
          <button
            onClick={startMigration}
            disabled={progress.isActive || selectedFiles.length === 0}
            className={`px-6 py-3 rounded-lg font-medium ${
              progress.isActive || selectedFiles.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {progress.isActive ? 'Migration In Progress...' : 'Start Migration'}
          </button>
        </div>
      </div>

      {/* Progress Display */}
      {(progress.isActive || progress.startTime) && (
        <div className="bg-gray-800 p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Migration Progress</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{progress.phase}</span>
                <span className="text-sm text-gray-500">{progress.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>

            {progress.currentFile && (
              <div className="text-sm">
                <strong>Current File:</strong> {progress.currentFile}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Records Processed:</strong><br />
                {progress.recordsProcessed.toLocaleString()}
              </div>
              <div>
                <strong>Total Records:</strong><br />
                {progress.totalRecords.toLocaleString()}
              </div>
              <div>
                <strong>Start Time:</strong><br />
                {formatTime(progress.startTime)}
              </div>
              <div>
                <strong>Errors:</strong><br />
                <span className={progress.errors.length > 0 ? 'text-red-600' : 'text-green-600'}>
                  {progress.errors.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {progress.errors.length > 0 && (
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            Migration Errors ({progress.errors.length})
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {progress.errors.map((error, index) => (
              <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Info */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Database Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Supabase URL:</strong><br />
            {supabaseUrlForLogging || 'https://kiztaihzanqnrcrqaxsv.supabase.co'}
          </div>
          <div>
            <strong>Target Database:</strong><br />
            PostgreSQL (Webb Schema)
          </div>
          <div>
            <strong>Expected Data Size:</strong><br />
            ~26GB (15GB CCASS + 11GB Enigma)
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebbDirectSQLUploader; 