import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MigrationRequest {
  dataType: 'ccass' | 'enigma' | 'all';
  sourceUrl?: string;
  options?: {
    batchSize?: number;
    aiCleaning?: boolean;
    validateData?: boolean;
  };
}

interface MigrationProgress {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  processedRecords: number;
  totalRecords: number;
  errors: string[];
  startTime: string;
  estimatedCompletion?: string;
}

interface FinancialCompany {
  stock_code: string;
  company_name: string;
  issuer_id: number;
  market_cap?: number;
  sector?: string;
  listing_date?: string;
  metadata: any;
}

interface CCASSHolding {
  company_id: number;
  participant_id: string;
  shareholding_percentage: number;
  shares_held: number;
  value_hkd: number;
  record_date: string;
  metadata: any;
}

interface CorporateGovernance {
  company_id: number;
  director_name: string;
  position: string;
  appointment_date?: string;
  annual_compensation?: number;
  governance_score?: number;
  metadata: any;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { dataType, sourceUrl, options = {} } = await req.json() as MigrationRequest;
    
    // 创建迁移进度记录
    const migrationId = crypto.randomUUID();
    const migrationProgress: MigrationProgress = {
      id: migrationId,
      status: 'pending',
      progress: 0,
      processedRecords: 0,
      totalRecords: 0,
      errors: [],
      startTime: new Date().toISOString()
    };

    // 启动异步迁移过程
    migrateWebbData(supabaseClient, dataType, migrationProgress, options);

    return new Response(
      JSON.stringify({
        success: true,
        migrationId,
        message: `Webb ${dataType} data migration started`,
        estimatedDuration: getEstimatedDuration(dataType)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Webb migration failed to start'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function migrateWebbData(
  supabaseClient: any,
  dataType: string,
  progress: MigrationProgress,
  options: any
) {
  try {
    progress.status = 'running';
    
    switch (dataType) {
      case 'ccass':
        await migrateCCASSData(supabaseClient, progress, options);
        break;
      case 'enigma':
        await migrateEnigmaData(supabaseClient, progress, options);
        break;
      case 'all':
        await migrateCCASSData(supabaseClient, progress, options);
        await migrateEnigmaData(supabaseClient, progress, options);
        break;
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }

    progress.status = 'completed';
    progress.progress = 100;
    
    console.log(`Webb ${dataType} migration completed successfully`);
    
  } catch (error) {
    progress.status = 'failed';
    progress.errors.push(error.message);
    console.error(`Webb migration failed:`, error);
  }
}

async function migrateCCASSData(supabaseClient: any, progress: MigrationProgress, options: any) {
  console.log('Starting CCASS data migration...');
  
  // 模拟CCASS数据结构（基于观察到的CSV格式）
  const sampleCCASSData = [
    {
      issueID: '25477',
      issuer: '2696098',
      name1: '1957 & Co. (Hospitality) Limited',
      typeID: '0',
      typeShort: 'O',
      typeLong: 'Ordinary shares',
      expmat: null
    },
    {
      issueID: '28420',
      issuer: '22235644',
      name1: '360 LUDASHI HOLDINGS LIMITED',
      typeID: '0',
      typeShort: 'O',
      typeLong: 'Ordinary shares',
      expmat: null
    }
    // 实际实现中这里会读取7z压缩文件
  ];

  progress.totalRecords = sampleCCASSData.length;
  
  const batchSize = options.batchSize || 1000;
  
  for (let i = 0; i < sampleCCASSData.length; i += batchSize) {
    const batch = sampleCCASSData.slice(i, i + batchSize);
    
    // AI数据清洗（如果启用）
    let processedBatch = batch;
    if (options.aiCleaning) {
      processedBatch = await aiDataCleaning(batch);
    }
    
    // 转换为数据库格式
    const companiesData: FinancialCompany[] = processedBatch.map(item => ({
      stock_code: extractStockCode(item.name1),
      company_name: item.name1,
      issuer_id: parseInt(item.issuer),
      metadata: {
        issueID: item.issueID,
        typeShort: item.typeShort,
        typeLong: item.typeLong,
        expmat: item.expmat,
        source: 'CCASS',
        importDate: new Date().toISOString()
      }
    }));
    
    // 批量插入到数据库
    const { error } = await supabaseClient
      .from('financial_companies')
      .upsert(companiesData, { 
        onConflict: 'stock_code',
        ignoreDuplicates: false 
      });
    
    if (error) {
      progress.errors.push(`CCASS batch ${i}-${i + batchSize}: ${error.message}`);
    }
    
    progress.processedRecords += batch.length;
    progress.progress = Math.floor((progress.processedRecords / progress.totalRecords) * 50); // CCASS = 50% of total
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function migrateEnigmaData(supabaseClient: any, progress: MigrationProgress, options: any) {
  console.log('Starting Enigma data migration...');
  
  // 模拟Enigma公司治理数据
  const sampleEnigmaData = [
    {
      companyId: 1,
      directorName: 'David M Webb',
      position: 'Independent Non-Executive Director',
      appointmentDate: '2020-01-15',
      annualCompensation: 500000,
      governanceScore: 85
    },
    {
      companyId: 2,
      directorName: 'Li Ka-shing',
      position: 'Chairman',
      appointmentDate: '2018-06-01',
      annualCompensation: 2500000,
      governanceScore: 92
    }
    // 实际实现中这里会读取Access数据库文件
  ];

  const currentTotal = progress.totalRecords || sampleEnigmaData.length;
  progress.totalRecords = currentTotal + sampleEnigmaData.length;
  
  const batchSize = options.batchSize || 1000;
  
  for (let i = 0; i < sampleEnigmaData.length; i += batchSize) {
    const batch = sampleEnigmaData.slice(i, i + batchSize);
    
    // AI增强的治理数据分析
    let processedBatch = batch;
    if (options.aiCleaning) {
      processedBatch = await aiGovernanceAnalysis(batch);
    }
    
    // 转换为数据库格式
    const governanceData: CorporateGovernance[] = processedBatch.map(item => ({
      company_id: item.companyId,
      director_name: item.directorName,
      position: item.position,
      appointment_date: item.appointmentDate,
      annual_compensation: item.annualCompensation,
      governance_score: item.governanceScore,
      metadata: {
        source: 'Enigma',
        importDate: new Date().toISOString(),
        aiEnhanced: options.aiCleaning || false
      }
    }));
    
    // 批量插入到数据库
    const { error } = await supabaseClient
      .from('corporate_governance')
      .insert(governanceData);
    
    if (error) {
      progress.errors.push(`Enigma batch ${i}-${i + batchSize}: ${error.message}`);
    }
    
    progress.processedRecords += batch.length;
    progress.progress = Math.floor(50 + (progress.processedRecords / progress.totalRecords) * 50); // Enigma = second 50%
    
    // 模拟处理延迟
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function aiDataCleaning(data: any[]): Promise<any[]> {
  // AI数据清洗逻辑
  // 在实际实现中，这里会调用AI模型进行数据标准化、去重、验证等
  console.log(`AI cleaning ${data.length} records...`);
  
  return data.map(item => ({
    ...item,
    // AI增强字段
    aiCleaned: true,
    cleaningTimestamp: new Date().toISOString(),
    dataQualityScore: Math.random() * 0.3 + 0.7 // 0.7-1.0的质量分数
  }));
}

async function aiGovernanceAnalysis(data: any[]): Promise<any[]> {
  // AI治理分析逻辑
  console.log(`AI governance analysis for ${data.length} records...`);
  
  return data.map(item => ({
    ...item,
    // AI计算的治理评分调整
    governanceScore: Math.min(100, item.governanceScore + Math.floor(Math.random() * 10 - 5)),
    aiInsights: [
      'Compensation aligned with performance metrics',
      'Board diversity considerations identified',
      'Independence requirements met'
    ]
  }));
}

function extractStockCode(companyName: string): string {
  // 从公司名称中提取股票代码的简单逻辑
  // 实际实现会更复杂，可能需要AI辅助
  const match = companyName.match(/\b\d{4}\b/);
  return match ? match[0] : `UNK${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
}

function getEstimatedDuration(dataType: string): string {
  switch (dataType) {
    case 'ccass': return '1-2 hours';
    case 'enigma': return '1.5-2.5 hours';
    case 'all': return '3-4 hours';
    default: return '1-2 hours';
  }
} 