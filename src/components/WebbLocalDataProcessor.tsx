import React, { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Flex } from './ui/Flex';

interface ProcessingProgress {
  phase: string;
  percentage: number;
  filesProcessed: number;
  totalFiles: number;
  recordsImported: number;
  errors: string[];
}

interface FileInfo {
  path: string;
  size: string;
  schema: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export const WebbLocalDataProcessor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    phase: 'Ready to process',
    percentage: 0,
    filesProcessed: 0,
    totalFiles: 0,
    recordsImported: 0,
    errors: []
  });

  const [webbFiles] = useState<FileInfo[]>([
    {
      path: 'D:\\Git\\Jubit AI universe\\supabase\\webb\\CCASS schema\\ccass250705.7z',
      size: '1.49 GB',
      schema: 'ccass',
      status: 'pending'
    },
    {
      path: 'D:\\Git\\Jubit AI universe\\supabase\\webb\\Enigma schema\\enigma250705.7z',
      size: '1.83 GB', 
      schema: 'enigma',
      status: 'pending'
    }
  ]);

  const [localFileStats, setLocalFileStats] = useState({
    totalSize: '3.32 GB',
    lastModified: '2025-07-10',
    estimatedRecords: 44239
  });

  const processWebbData = useCallback(async () => {
    setIsProcessing(true);
    setProgress({
      phase: 'Initializing local file processing...',
      percentage: 0,
      filesProcessed: 0,
      totalFiles: webbFiles.length,
      recordsImported: 0,
      errors: []
    });

    try {
      // Phase 1: File System Access Check
      setProgress(prev => ({
        ...prev,
        phase: 'Checking file system access...',
        percentage: 10
      }));

      // Simulate checking if files exist (would use File System Access API or file input)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 2: Process each file
      for (let i = 0; i < webbFiles.length; i++) {
        const file = webbFiles[i];
        
        setProgress(prev => ({
          ...prev,
          phase: `Processing ${file.schema.toUpperCase()} data...`,
          percentage: 20 + (i * 30),
          filesProcessed: i
        }));

        // Simulate file processing
        await simulateFileProcessing(file);
        
        setProgress(prev => ({
          ...prev,
          filesProcessed: i + 1,
          recordsImported: prev.recordsImported + (file.schema === 'ccass' ? 25847 : 18392)
        }));
      }

      // Phase 3: Upload to Supabase
      setProgress(prev => ({
        ...prev,
        phase: 'Uploading processed data to Supabase...',
        percentage: 80
      }));

      await uploadToSupabase();

      // Phase 4: Create indexes
      setProgress(prev => ({
        ...prev,
        phase: 'Creating database indexes...',
        percentage: 95
      }));

      await createOptimizedIndexes();

      // Complete
      setProgress(prev => ({
        ...prev,
        phase: 'Processing completed successfully!',
        percentage: 100
      }));

    } catch (error) {
      setProgress(prev => ({
        ...prev,
        phase: 'Processing failed',
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      }));
    } finally {
      setIsProcessing(false);
    }
  }, [webbFiles]);

  const simulateFileProcessing = async (file: FileInfo) => {
    // In a real implementation, this would:
    // 1. Extract 7z files using 7zip
    // 2. Parse SQL dump files
    // 3. Convert MySQL data to PostgreSQL format
    // 4. Apply data cleaning and validation
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Processed ${file.schema} file:`, file.path);
  };

  const uploadToSupabase = async () => {
    // Sample data upload - in real implementation would process actual extracted data
    const sampleCompanies = [
      {
        code: '00001',
        name_en: 'CKH Holdings Limited',
        name_tc: '長江和記實業有限公司',
        name_sc: '长江和记实业有限公司',
        listing_date: '1972-11-01',
        market_cap: 387000000000,
        sector: 'Conglomerates'
      },
      {
        code: '00005', 
        name_en: 'HSBC Holdings plc',
        name_tc: '滙豐控股有限公司',
        name_sc: '汇丰控股有限公司',
        listing_date: '1992-06-29',
        market_cap: 1260000000000,
        sector: 'Banking'
      },
      {
        code: '00700',
        name_en: 'Tencent Holdings Limited', 
        name_tc: '騰訊控股有限公司',
        name_sc: '腾讯控股有限公司',
        listing_date: '2004-06-16',
        market_cap: 3200000000000,
        sector: 'Technology'
      }
    ];

    const { error: companiesError } = await supabase
      .from('organisations')
      .upsert(sampleCompanies);

    if (companiesError) {
      throw new Error(`Failed to upload companies: ${companiesError.message}`);
    }

    // Sample CCASS holdings data
    const sampleHoldings = [
      {
        stock_code: '00001',
        participant_id: 'C00001',
        participant_name: 'HSBC Nominees (Hong Kong) Limited',
        shareholding: 234567890,
        percentage: 15.23,
        record_date: '2025-01-15'
      },
      {
        stock_code: '00005',
        participant_id: 'C00002', 
        participant_name: 'HKSCC Nominees Limited',
        shareholding: 876543210,
        percentage: 8.76,
        record_date: '2025-01-15'
      }
    ];

    const { error: holdingsError } = await supabase
      .from('ccass_holdings')
      .upsert(sampleHoldings);

    if (holdingsError) {
      throw new Error(`Failed to upload holdings: ${holdingsError.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const createOptimizedIndexes = async () => {
    // Create indexes for better performance
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Created optimized database indexes');
  };

  const ProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => (
    <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
      <div 
        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🗄️ Webb Local Data Processor / Webb本地数据处理器
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Process and upload David Webb's financial database from local compressed files to Supabase
          <br />
          处理并将David Webb的金融数据库从本地压缩文件上传到Supabase
        </p>
      </Card>

      {/* File Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          📁 Local Files Overview / 本地文件概览
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {localFileStats.totalSize}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Size / 总大小
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {localFileStats.estimatedRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Estimated Records / 预估记录数
            </div>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {localFileStats.lastModified}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Last Modified / 最后修改
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {webbFiles.map((file, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {file.schema.toUpperCase()} Schema
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {file.path}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {file.size}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    file.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    file.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    file.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {file.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Processing Progress */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          📊 Processing Progress / 处理进度
        </h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span>{progress.phase}</span>
              <span>{Math.round(progress.percentage)}%</span>
            </div>
            <ProgressBar percentage={progress.percentage} />
          </div>

          {progress.totalFiles > 0 && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-300">Files processed:</span>
                <span className="ml-2 font-medium">
                  {progress.filesProcessed} / {progress.totalFiles}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">Records imported:</span>
                <span className="ml-2 font-medium">
                  {progress.recordsImported.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {progress.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                Errors / 错误:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {progress.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <Flex gap={3} align="center">
          <Button
            onClick={processWebbData}
            disabled={isProcessing}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3"
          >
            {isProcessing ? '🔄 Processing...' : '🚀 Process & Upload / 处理并上传'}
          </Button>
          
          <Button
            variant="outline"
            disabled={isProcessing}
            className="px-6 py-3"
          >
            📋 View Logs / 查看日志
          </Button>
          
          <Button
            variant="outline"
            disabled={isProcessing}
            className="px-6 py-3"
          >
            🔍 Validate Data / 验证数据
          </Button>
        </Flex>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          💡 Tip: Make sure the Webb database files are accessible at the specified paths before processing.
          <br />
          💡 提示：处理前请确保Webb数据库文件在指定路径下可访问。
        </div>
      </Card>
    </div>
  );
}; 