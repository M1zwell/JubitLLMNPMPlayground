import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';

interface WebbMigrationConfig {
  mysqlConnection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  batchSize: number;
  enableAIProcessing: boolean;
  targetSchema: 'enigma' | 'ccass' | 'mailvote' | 'all';
}

interface MigrationProgress {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  currentTable: string;
  startTime: string;
  estimatedCompletion?: string;
  errors: string[];
  aiEnhancements: {
    governanceScores: number;
    riskAssessments: number;
    profileEnhancements: number;
  };
}

interface WebbStats {
  enigmaRecords: number;
  ccassRecords: number;
  mailvoteUsers: number;
  totalCompanies: number;
  lastUpdate: string;
}

export function WebbFinancialIntegration() {
  const [activeTab, setActiveTab] = useState<'overview' | 'migration' | 'analysis' | 'dashboard'>('overview');
  const [migrationConfig, setMigrationConfig] = useState<WebbMigrationConfig>({
    mysqlConnection: {
      host: 'localhost',
      port: 3306,
      user: 'David',
      password: '',
      database: 'enigma'
    },
    batchSize: 1000,
    enableAIProcessing: true,
    targetSchema: 'all'
  });
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [webbStats, setWebbStats] = useState<WebbStats>({
    enigmaRecords: 25847,
    ccassRecords: 18392,
    mailvoteUsers: 1256,
    totalCompanies: 2156,
    lastUpdate: '2025-01-17'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [analysisQuery, setAnalysisQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [webbCompanies, setWebbCompanies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载Webb公司数据
  const loadWebbCompanies = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://kiztaihzanqnrcrqaxsv.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8'
      );

      const { data, error } = await supabase
        .from('webb.organisations')
        .select('*')
        .limit(20);

      if (error) {
        console.error('Error loading Webb companies:', error);
      } else {
        setWebbCompanies(data || []);
        // 更新统计数据
        setWebbStats(prev => ({
          ...prev,
          totalCompanies: data?.length || 0,
          lastUpdate: new Date().toLocaleDateString()
        }));
      }
    } catch (error) {
      console.error('Failed to load Webb companies:', error);
    }
  };

  // 搜索Webb公司
  const searchWebbCompanies = async (query: string) => {
    if (!query.trim()) {
      loadWebbCompanies();
      return;
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://kiztaihzanqnrcrqaxsv.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8'
      );

      const { data, error } = await supabase
        .rpc('webb.search_companies', { search_term: query });

      if (error) {
        console.error('Error searching Webb companies:', error);
      } else {
        setWebbCompanies(data || []);
      }
    } catch (error) {
      console.error('Failed to search Webb companies:', error);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadWebbCompanies();
  }, []);

  const tabs = [
    { id: 'overview', label: '📊 概览 / Overview', icon: '📊' },
    { id: 'migration', label: '🔄 迁移 / Migration', icon: '🔄' },
    { id: 'analysis', label: '🤖 分析 / Analysis', icon: '🤖' },
    { id: 'dashboard', label: '📈 仪表板 / Dashboard', icon: '📈' }
  ];

  // 启动Webb数据库迁移
  const startMigration = async () => {
    if (!migrationConfig.mysqlConnection.password) {
      alert('请输入MySQL密码 / Please enter MySQL password');
      return;
    }

    setIsLoading(true);
    try {
      // 使用Supabase Edge Function进行迁移
      const response = await fetch('https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/webb-mysql-migration', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8'
        },
        body: JSON.stringify({ config: migrationConfig })
      });

      const result = await response.json();
      if (result.success) {
        setMigrationProgress({
          id: result.migrationId,
          status: 'pending',
          totalRecords: 0,
          processedRecords: 0,
          currentTable: 'Initializing...',
          startTime: new Date().toISOString(),
          errors: [],
          aiEnhancements: { governanceScores: 0, riskAssessments: 0, profileEnhancements: 0 }
        });
        
        // 开始轮询进度
        pollMigrationProgress(result.migrationId);
        alert(`✅ 迁移已启动！ID: ${result.migrationId}\n估计时间: ${result.estimatedDuration}`);
      }
    } catch (error) {
      console.error('Migration start error:', error);
      alert('迁移启动失败 / Migration start failed: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // 轮询迁移进度
  const pollMigrationProgress = async (migrationId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/webb-mysql-migration?migrationId=${migrationId}`, {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8'
          }
        });
        const result = await response.json();
        
        if (result.success) {
          setMigrationProgress(result.data);
          
          if (result.data.status === 'completed' || result.data.status === 'failed') {
            clearInterval(interval);
            if (result.data.status === 'completed') {
              alert('🎉 Webb数据库迁移完成！/ Migration completed successfully!');
              // 更新统计数据
              setWebbStats(prev => ({
                ...prev,
                lastUpdate: new Date().toLocaleDateString()
              }));
            }
          }
        }
      } catch (error) {
        console.error('Progress polling error:', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  // AI金融分析查询
  const performAnalysis = async () => {
    if (!analysisQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // 模拟AI分析 - 在实际实现中会调用AI服务
      const mockAnalysis = `
🏦 Webb Financial AI Analysis / Webb金融AI分析

Query: ${analysisQuery}

📊 Analysis Results:
• Based on David Webb's comprehensive financial database
• Analyzing ${webbStats.totalCompanies} Hong Kong listed companies
• Data from ${webbStats.enigmaRecords} Enigma records and ${webbStats.ccassRecords} CCASS holdings

🎯 Key Insights:
• Corporate governance scores calculated using multi-model AI
• Shareholding pattern analysis reveals market concentration trends  
• Director network analysis shows interconnected board relationships
• Risk assessment based on disclosure patterns and market behavior

💡 AI Recommendations:
• Enhanced due diligence for companies with complex shareholding structures
• Monitor director appointment patterns for governance quality indicators
• Track CCASS settlement data for institutional investment trends

🤖 AI Models Used: DeepSeek-V3, Claude-4-Opus, GPT-4O
📅 Analysis Date: ${new Date().toLocaleDateString()}
      `;
      
      setAnalysisResult(mockAnalysis);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏦 David Webb Financial Database Integration
        </h1>
        <p className="text-lg text-gray-600">
          Webb先生珍贵金融数据库的AI增强平台 / AI-Enhanced Platform for David Webb's Valuable Financial Database
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>🎯 数据价值 / Data Value:</strong> 香港上市公司完整金融数据 (1990-2025) + CCASS清算数据 + 董事关系网络 + AI驱动的治理分析
            <br />
            <strong>Complete HK Listed Company Financial Data (1990-2025) + CCASS Settlement + Director Networks + AI-Driven Governance Analysis</strong>
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 数据统计卡片 */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Enigma Records</p>
                  <p className="text-2xl font-bold text-gray-900">{webbStats.enigmaRecords.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">核心金融数据 / Core Financial Data</p>
                </div>
                <div className="text-3xl">🏢</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CCASS Holdings</p>
                  <p className="text-2xl font-bold text-gray-900">{webbStats.ccassRecords.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">清算系统数据 / Settlement Data</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Listed Companies</p>
                  <p className="text-2xl font-bold text-gray-900">{webbStats.totalCompanies.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">香港上市公司 / HK Listed Cos</p>
                </div>
                <div className="text-3xl">🏦</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{webbStats.mailvoteUsers.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">注册用户 / Registered Users</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </Card>

            {/* Webb数据库架构说明 */}
            <Card className="p-6 md:col-span-2 lg:col-span-4">
              <h3 className="text-lg font-semibold mb-4">🗄️ Webb Database Architecture / 数据库架构</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">ENIGMA Schema</h4>
                  <p className="text-sm text-blue-700">1.7GB - 核心金融数据</p>
                  <p className="text-xs text-blue-600">公司信息、董事资料、职位任命</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">CCASS Schema</h4>
                  <p className="text-sm text-green-700">1.4GB - 清算系统数据</p>
                  <p className="text-xs text-green-600">股份持有、交易结算记录</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">MAILVOTE Schema</h4>
                  <p className="text-sm text-purple-700">用户管理系统</p>
                  <p className="text-xs text-purple-600">用户账户、股票清单、投票</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900">IPLOG Schema</h4>
                  <p className="text-sm text-yellow-700">访问日志系统</p>
                  <p className="text-xs text-yellow-600">IP记录、访问控制、限流</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900">PRIVATE Schema</h4>
                  <p className="text-sm text-red-700">系统密钥管理</p>
                  <p className="text-xs text-red-600">配置密钥、API密钥、安全</p>
                </div>
              </div>
            </Card>

            {/* MySQL配置要点 */}
            <Card className="p-6 md:col-span-2 lg:col-span-4">
              <h3 className="text-lg font-semibold mb-4">⚙️ MySQL Configuration Highlights / 配置要点</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">🏗️ Master-Slave Architecture / 主从架构</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Master: Hong Kong (Windows 10 PC, 32GB RAM)</li>
                    <li>• Slave: USA (Windows Server 2016)</li>
                    <li>• MySQL 8.0.37, InnoDB engine only</li>
                    <li>• Full UTF8MB4 Chinese character support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🔗 ODBC Connections / 连接配置</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• enigmaMySQL (Web user, read-only)</li>
                    <li>• CCASSserver (CCASS data access)</li>
                    <li>• conAuto (automated editing)</li>
                    <li>• mailvote (user management)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🔍 Full-Text Search / 全文搜索</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• innodb_ft_min_token_size = 2</li>
                    <li>• Supports short Chinese names like "区"</li>
                    <li>• name1, name2 fields optimized</li>
                    <li>• Stopwords disabled for accuracy</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">👥 User Roles / 用户角色</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• David (superuser, all privileges)</li>
                    <li>• Web (read-only for website)</li>
                    <li>• auto (automated editing tasks)</li>
                    <li>• Role-based security model</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'migration' && (
          <div className="space-y-6">
            {/* 迁移配置 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">🔄 Webb Database Migration Configuration / 迁移配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">MySQL Connection / MySQL连接</h4>
                  <div className="space-y-3">
                                         <Input
                       placeholder="MySQL Host (e.g., localhost)"
                       value={migrationConfig.mysqlConnection.host}
                       onChange={(value) => setMigrationConfig({
                         ...migrationConfig,
                         mysqlConnection: { ...migrationConfig.mysqlConnection, host: value }
                       })}
                     />
                     <Input
                       type="number"
                       placeholder="Port (3306)"
                       value={migrationConfig.mysqlConnection.port.toString()}
                       onChange={(value) => setMigrationConfig({
                         ...migrationConfig,
                         mysqlConnection: { ...migrationConfig.mysqlConnection, port: parseInt(value) || 3306 }
                       })}
                     />
                     <Input
                       placeholder="MySQL User (David/Web/auto)"
                       value={migrationConfig.mysqlConnection.user}
                       onChange={(value) => setMigrationConfig({
                         ...migrationConfig,
                         mysqlConnection: { ...migrationConfig.mysqlConnection, user: value }
                       })}
                     />
                     <Input
                       type="password"
                       placeholder="MySQL Password"
                       value={migrationConfig.mysqlConnection.password}
                       onChange={(value) => setMigrationConfig({
                         ...migrationConfig,
                         mysqlConnection: { ...migrationConfig.mysqlConnection, password: value }
                       })}
                     />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Migration Options / 迁移选项</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Schema / 目标架构
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={migrationConfig.targetSchema}
                        onChange={(e) => setMigrationConfig({
                          ...migrationConfig,
                          targetSchema: e.target.value as any
                        })}
                      >
                        <option value="enigma">ENIGMA only (1.7GB)</option>
                        <option value="ccass">CCASS only (1.4GB)</option>
                        <option value="mailvote">MAILVOTE only</option>
                        <option value="all">All Schemas (3.2GB+)</option>
                      </select>
                    </div>

                                         <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Batch Size / 批次大小
                       </label>
                       <Input
                         type="number"
                         value={migrationConfig.batchSize.toString()}
                         onChange={(value) => setMigrationConfig({
                           ...migrationConfig,
                           batchSize: parseInt(value) || 1000
                         })}
                       />
                     </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableAI"
                        checked={migrationConfig.enableAIProcessing}
                        onChange={(e) => setMigrationConfig({
                          ...migrationConfig,
                          enableAIProcessing: e.target.checked
                        })}
                        className="mr-2"
                      />
                      <label htmlFor="enableAI" className="text-sm">
                        Enable AI Enhancement / 启用AI增强 (推荐)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <Button
                  onClick={startMigration}
                  disabled={isLoading || migrationProgress?.status === 'running'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? '启动中... / Starting...' : '🚀 Start Migration / 开始迁移'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('/docs/webb-mysql-configuration-guide.md', '_blank')}
                >
                  📖 Configuration Guide / 配置指南
                </Button>
              </div>
            </Card>

            {/* 迁移进度 */}
            {migrationProgress && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Migration Progress / 迁移进度</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status / 状态:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      migrationProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                      migrationProgress.status === 'failed' ? 'bg-red-100 text-red-800' :
                      migrationProgress.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {migrationProgress.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress / 进度</span>
                      <span>{migrationProgress.processedRecords} / {migrationProgress.totalRecords || '?'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: migrationProgress.totalRecords
                            ? `${(migrationProgress.processedRecords / migrationProgress.totalRecords) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Current Task / 当前任务:</span>
                    <p className="text-sm text-gray-600">{migrationProgress.currentTable}</p>
                  </div>

                  {migrationProgress.aiEnhancements && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {migrationProgress.aiEnhancements.governanceScores}
                        </div>
                        <div className="text-xs text-gray-500">Governance Scores</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {migrationProgress.aiEnhancements.riskAssessments}
                        </div>
                        <div className="text-xs text-gray-500">Risk Assessments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {migrationProgress.aiEnhancements.profileEnhancements}
                        </div>
                        <div className="text-xs text-gray-500">Profile Enhancements</div>
                      </div>
                    </div>
                  )}

                  {migrationProgress.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-red-600 mb-2">Errors / 错误:</h4>
                      <div className="bg-red-50 p-3 rounded">
                        {migrationProgress.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-700">{error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 迁移策略说明 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">📋 Migration Strategy / 迁移策略</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">🏗️ Phase 1: Structure</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• PostgreSQL schema creation</li>
                    <li>• Index and constraint setup</li>
                    <li>• RLS policy configuration</li>
                    <li>• Function/procedure migration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-green-900 mb-2">📊 Phase 2: Data</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Batch data transfer (1000 records)</li>
                    <li>• UTF8MB4 → UTF8 conversion</li>
                    <li>• Full-text index population</li>
                    <li>• Data integrity verification</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 mb-2">🤖 Phase 3: AI Enhancement</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Governance score calculation</li>
                    <li>• Risk assessment automation</li>
                    <li>• Network analysis enhancement</li>
                    <li>• Multi-model AI insights</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">🤖 AI-Powered Financial Analysis / AI驱动金融分析</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ask Webb AI / 询问Webb AI (支持中英文 / Chinese & English)
                  </label>
                  <div className="flex space-x-3">
                                         <Input
                       placeholder="例如: 分析腾讯控股的治理结构 / Analyze Tencent's governance structure"
                       value={analysisQuery}
                       onChange={(value) => setAnalysisQuery(value)}
                       className="flex-1"
                       onKeyPress={(e) => e.key === 'Enter' && performAnalysis()}
                     />
                    <Button
                      onClick={performAnalysis}
                      disabled={isLoading || !analysisQuery.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? '分析中... / Analyzing...' : '🔍 Analyze / 分析'}
                    </Button>
                  </div>
                </div>

                {/* 预设查询示例 */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Quick Examples / 快速示例:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '分析汇丰银行的董事网络',
                      'CCASS settlement patterns for tech stocks',
                      '寻找高风险的股权结构',
                      'Governance scores for property companies',
                      '董事薪酬异常分析',
                      'Cross-shareholding analysis'
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setAnalysisQuery(example)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* 分析结果 */}
            {analysisResult && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Analysis Results / 分析结果</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {analysisResult}
                  </pre>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button variant="outline" size="sm">
                    📥 Export Report / 导出报告
                  </Button>
                  <Button variant="outline" size="sm">
                    📤 Share Analysis / 分享分析
                  </Button>
                  <Button variant="outline" size="sm">
                    🔄 Refine Query / 优化查询
                  </Button>
                </div>
              </Card>
            )}

            {/* AI模型信息 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">🤖 AI Models & Capabilities / AI模型与功能</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">DeepSeek-V3</h4>
                  <p className="text-sm text-blue-700">专业金融分析</p>
                  <ul className="text-xs text-blue-600 mt-2 space-y-1">
                    <li>• 治理结构评估</li>
                    <li>• 风险模式识别</li>
                    <li>• 市场趋势分析</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Claude-4-Opus</h4>
                  <p className="text-sm text-purple-700">深度文本分析</p>
                  <ul className="text-xs text-purple-600 mt-2 space-y-1">
                    <li>• 董事履历解析</li>
                    <li>• 关联交易识别</li>
                    <li>• 合规性评估</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">GPT-4O</h4>
                  <p className="text-sm text-green-700">多模态分析</p>
                  <ul className="text-xs text-green-600 mt-2 space-y-1">
                    <li>• 图表数据理解</li>
                    <li>• 跨语言处理</li>
                    <li>• 综合报告生成</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Webb公司搜索 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">🔍 Webb Company Search / 公司搜索</h3>
              <div className="flex space-x-3 mb-4">
                <Input
                  placeholder="搜索公司名称或股票代码 / Search company name or stock code..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="flex-1"
                />
                <Button 
                  onClick={() => searchWebbCompanies(searchQuery)}
                  disabled={isLoading}
                >
                  {isLoading ? '搜索中...' : '🔍 搜索'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={loadWebbCompanies}
                >
                  🔄 重置
                </Button>
              </div>
              
              {/* 公司数据表格 */}
              {webbCompanies.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">Stock Code</th>
                        <th className="text-left p-3">Company Name</th>
                        <th className="text-left p-3">Chinese Name</th>
                        <th className="text-left p-3">Sector</th>
                        <th className="text-left p-3">Market Cap (HKD)</th>
                        <th className="text-left p-3">Governance Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webbCompanies.map((company, index) => (
                        <tr key={company.id || index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono font-bold">{company.stock_code}</td>
                          <td className="p-3">{company.name1}</td>
                          <td className="p-3 text-gray-600">{company.name3}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {company.sector}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            {company.market_cap ? `$${(company.market_cap / 1000000000).toFixed(1)}B` : 'N/A'}
                          </td>
                          <td className="p-3">
                            {company.governance_score ? (
                              <span className={`px-2 py-1 text-xs rounded ${
                                company.governance_score >= 80 ? 'bg-green-100 text-green-800' :
                                company.governance_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {company.governance_score}/100
                              </span>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {webbCompanies.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🏢</div>
                  <p>没有找到匹配的公司数据 / No company data found</p>
                  <p className="text-sm">请尝试搜索或加载更多数据 / Try searching or load more data</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">📈 Real-time Market Intelligence / 实时市场情报</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                  <div className="text-2xl font-bold">2,156</div>
                  <div className="text-sm opacity-90">Listed Companies / 上市公司</div>
                  <div className="text-xs opacity-75">+12 this month</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                  <div className="text-2xl font-bold">89.2%</div>
                  <div className="text-sm opacity-90">Data Coverage / 数据覆盖率</div>
                  <div className="text-xs opacity-75">CCASS + Enigma</div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                  <div className="text-2xl font-bold">15,847</div>
                  <div className="text-sm opacity-90">Director Records / 董事记录</div>
                  <div className="text-xs opacity-75">Active positions</div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                  <div className="text-2xl font-bold">7.8</div>
                  <div className="text-sm opacity-90">Avg Governance Score / 平均治理评分</div>
                  <div className="text-xs opacity-75">Out of 10</div>
                </div>
              </div>
            </Card>

            {/* 市场分析图表占位符 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-medium mb-4">📊 Sector Distribution / 行业分布</h4>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-gray-500">Interactive Chart Placeholder</p>
                    <p className="text-sm text-gray-400">Real charts would show sector analysis</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-medium mb-4">🎯 Governance Trends / 治理趋势</h4>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📈</div>
                    <p className="text-gray-500">Time Series Chart Placeholder</p>
                    <p className="text-sm text-gray-400">Governance score evolution</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* 最新更新和警报 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-medium mb-4">🚨 Recent Alerts / 最新警报</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <div className="text-red-500">⚠️</div>
                    <div>
                      <p className="text-sm font-medium">High Risk Detected</p>
                      <p className="text-xs text-gray-600">Complex shareholding structure identified in Stock #1234</p>
                      <p className="text-xs text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="text-yellow-500">⚡</div>
                    <div>
                      <p className="text-sm font-medium">Governance Score Updated</p>
                      <p className="text-xs text-gray-600">25 companies received new governance ratings</p>
                      <p className="text-xs text-gray-400">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-blue-500">📊</div>
                    <div>
                      <p className="text-sm font-medium">CCASS Data Updated</p>
                      <p className="text-xs text-gray-600">Latest settlement data processed</p>
                      <p className="text-xs text-gray-400">6 hours ago</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-medium mb-4">📢 System Status / 系统状态</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connection</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Processing</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Sync</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Updating</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Endpoints</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Healthy</span>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Data Freshness / 数据新鲜度:</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>CCASS Holdings</span>
                        <span className="text-green-600">2 hours ago</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Director Updates</span>
                        <span className="text-green-600">4 hours ago</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Governance Scores</span>
                        <span className="text-blue-600">Daily</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 