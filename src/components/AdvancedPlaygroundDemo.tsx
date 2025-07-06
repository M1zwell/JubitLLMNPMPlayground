import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Sparkles, Zap, Shield, Brain, GitBranch, Users, 
  TrendingUp, Award, Code, Layers3, Cpu, MemoryStick,
  AlertTriangle, CheckCircle2, Package, Workflow,
  ChevronRight, Terminal, Search, ArrowRight, Clock, 
  ExternalLink, BookOpen, Info, Settings, HelpCircle
} from 'lucide-react';

// 高级功能演示组件
export default function AdvancedPlaygroundDemo() {
  // 状态管理
  const [activeFeature, setActiveFeature] = useState('ai-assistant');
  const [code, setCode] = useState('');
  const [packages, setPackages] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [securityReport, setSecurityReport] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 模拟的高级功能
  const features = {
    'ai-assistant': {
      title: 'AI编程助手',
      icon: Brain,
      description: '智能代码生成、错误诊断、性能优化建议'
    },
    'security-scanner': {
      title: '安全扫描器',
      icon: Shield,
      description: '实时代码安全分析、漏洞检测、修复建议'
    },
    'performance-profiler': {
      title: '性能分析器',
      icon: Zap,
      description: '执行时间分析、内存使用监控、优化建议'
    },
    'dependency-optimizer': {
      title: '依赖优化器',
      icon: Package,
      description: '智能依赖分析、版本协调、tree-shaking'
    },
    'collaboration': {
      title: '实时协作',
      icon: Users,
      description: '多人编程、代码评审、知识共享'
    },
    'visual-pipeline': {
      title: '可视化管道',
      icon: Workflow,
      description: '拖拽式编程、数据流可视化、实时预览'
    }
  };

  // AI助手功能
  const AIAssistant = () => {
    const [query, setQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [explanation, setExplanation] = useState('');

    const generateCode = async () => {
      setIsGenerating(true);
      
      // 模拟AI生成
      setTimeout(() => {
        const examples = {
          '数据处理': {
            code: `// 使用lodash处理数据
import _ from 'lodash';
import dayjs from 'dayjs';

const processUserData = (users) => {
  // 按注册日期分组
  const groupedByMonth = _.groupBy(users, user => 
    dayjs(user.registeredAt).format('YYYY-MM')
  );
  
  // 计算每月统计
  const monthlyStats = _.mapValues(groupedByMonth, users => ({
    count: users.length,
    avgAge: _.meanBy(users, 'age'),
    topCountries: _.chain(users)
      .countBy('country')
      .toPairs()
      .sortBy(1)
      .reverse()
      .take(3)
      .fromPairs()
      .value()
  }));
  
  return monthlyStats;
};`,
            packages: ['lodash', 'dayjs'],
            explanation: '这段代码展示了如何结合lodash和dayjs进行复杂的数据处理。首先按月份分组用户，然后计算每月的统计信息。'
          },
          'API服务': {
            code: `// 创建RESTful API
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json());

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制100个请求
});

// 数据验证schema
const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).max(120)
});

// API路由
app.post('/api/users', limiter, async (req, res) => {
  try {
    // 验证输入
    const validatedData = UserSchema.parse(req.body);
    
    // 处理业务逻辑
    const user = await createUser(validatedData);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        errors: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }
});`,
            packages: ['express', 'cors', 'zod', 'express-rate-limit'],
            explanation: '展示了如何创建一个生产级的API服务，包含CORS、数据验证、限流等安全特性。'
          }
        };

        const result = examples[query] || examples['数据处理'];
        setGeneratedCode(result.code);
        setExplanation(result.explanation);
        
        // 自动添加建议的包
        result.packages.forEach(pkg => {
          if (!packages.includes(pkg)) {
            setPackages(prev => [...prev, pkg]);
          }
        });
        
        setIsGenerating(false);
      }, 1500);
    };

    return (
      <div className="space-y-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
          <h3 className="font-semibold mb-2 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            AI代码生成器
          </h3>
          
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="描述你想要的功能..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            />
            <button
              onClick={generateCode}
              disabled={isGenerating || !query}
              className="btn-minimal btn-primary px-4 py-2 disabled:opacity-50"
            >
              {isGenerating ? '生成中...' : '生成代码'}
            </button>
          </div>

          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setQuery('数据处理')}
              className="btn-minimal btn-ghost text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
            >
              数据处理示例
            </button>
            <button
              onClick={() => setQuery('API服务')}
              className="btn-minimal btn-ghost text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
            >
              API服务示例
            </button>
          </div>

          {generatedCode && (
            <div className="space-y-3">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <pre className="text-sm">
                  <code>{generatedCode}</code>
                </pre>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>解释：</strong> {explanation}
                </p>
              </div>
              
              <button
                onClick={() => setCode(generatedCode)}
                className="text-sm text-purple-600 hover:text-purple-700 dark:hover:text-purple-400 hover:underline flex items-center"
              >
                使用这段代码 <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* AI优化建议 */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
          <h3 className="font-semibold mb-2 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-indigo-600" />
            智能优化建议
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <strong>性能优化：</strong> 使用 <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">_.memoize</code> 缓存计算结果
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <strong>代码质量：</strong> 添加TypeScript类型定义提高可维护性
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <strong>错误处理：</strong> 使用try-catch包装异步操作
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 安全扫描器
  const SecurityScanner = () => {
    const [scanning, setScanning] = useState(false);
    const [report, setReport] = useState(null);

    const scanCode = () => {
      setScanning(true);
      
      setTimeout(() => {
        setReport({
          risk: 'medium',
          issues: [
            {
              severity: 'high',
              type: '潜在的注入漏洞',
              line: 15,
              description: '直接使用用户输入构造查询可能导致注入攻击',
              fix: '使用参数化查询或转义用户输入'
            },
            {
              severity: 'medium',
              type: '敏感信息暴露',
              line: 8,
              description: 'API密钥不应硬编码在代码中',
              fix: '使用环境变量存储敏感信息'
            },
            {
              severity: 'low',
              type: '过时的依赖',
              package: 'lodash',
              description: '使用的版本存在已知漏洞',
              fix: '更新到最新版本: npm update lodash'
            }
          ],
          score: 7.2,
          recommendations: [
            '实施输入验证和清理',
            '使用安全的密钥管理方案',
            '定期更新依赖包',
            '添加安全测试到CI/CD流程'
          ]
        });
        setScanning(false);
      }, 2000);
    };

    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              安全扫描报告
            </h3>
            <button
              onClick={scanCode}
              disabled={scanning}
              className="btn-minimal btn-primary bg-red-600 hover:bg-red-700 text-sm disabled:opacity-50"
            >
              {scanning ? '扫描中...' : '开始扫描'}
            </button>
          </div>

          {report && (
            <div className="space-y-4">
              {/* 风险评分 */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="font-medium">安全评分</span>
                <div className="flex items-center">
                  <div className={`text-2xl font-bold ${
                    report.score >= 8 ? 'text-green-600' : 
                    report.score >= 6 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {report.score}/10
                  </div>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    report.risk === 'low' ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300' :
                    report.risk === 'medium' ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300' :
                    'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                  }`}>
                    {report.risk.toUpperCase()} RISK
                  </span>
                </div>
              </div>

              {/* 安全问题列表 */}
              <div className="space-y-2">
                {report.issues.map((issue, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-red-400">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <AlertTriangle className={`w-4 h-4 mr-2 ${
                            issue.severity === 'high' ? 'text-red-600' :
                            issue.severity === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <span className="font-medium text-sm">{issue.type}</span>
                          {issue.line && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              Line {issue.line}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{issue.description}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          <strong>修复建议：</strong> {issue.fix}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 安全建议 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="font-medium text-sm mb-2 text-blue-800 dark:text-blue-300">安全最佳实践</h4>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  {report.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 性能分析器
  const PerformanceProfiler = () => {
    const [profiling, setProfiling] = useState(false);
    const [metrics, setMetrics] = useState(null);

    const profileCode = () => {
      setProfiling(true);
      
      setTimeout(() => {
        setMetrics({
          executionTime: 234,
          memoryUsage: {
            initial: 12.5,
            peak: 45.8,
            final: 23.2
          },
          cpuUsage: 28,
          functionCalls: [
            { name: 'processUserData', time: 125, calls: 1 },
            { name: '_.groupBy', time: 45, calls: 3 },
            { name: 'dayjs.format', time: 23, calls: 150 },
            { name: '_.mapValues', time: 18, calls: 1 }
          ],
          bottlenecks: [
            {
              location: 'Line 15-23',
              issue: '嵌套循环导致O(n²)复杂度',
              impact: 'high',
              suggestion: '使用Map或Set优化查找'
            },
            {
              location: 'Line 34',
              issue: '重复的日期格式化',
              impact: 'medium',
              suggestion: '缓存格式化结果'
            }
          ]
        });
        setProfiling(false);
      }, 1500);
    };

    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-600" />
              性能分析报告
            </h3>
            <button
              onClick={profileCode}
              disabled={profiling}
              className="btn-minimal btn-primary bg-green-600 hover:bg-green-700 text-sm disabled:opacity-50"
            >
              {profiling ? '分析中...' : '开始分析'}
            </button>
          </div>

          {metrics && (
            <div className="space-y-4">
              {/* 关键指标 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.executionTime}ms
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">执行时间</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.memoryUsage.peak}MB
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">峰值内存</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {metrics.cpuUsage}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">CPU使用率</div>
                </div>
              </div>

              {/* 函数调用分析 */}
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-2 flex items-center text-gray-800 dark:text-gray-200">
                  <Cpu className="w-4 h-4 mr-2" />
                  函数执行时间
                </h4>
                <div className="space-y-2">
                  {metrics.functionCalls.map((func, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-mono text-gray-800 dark:text-gray-200">{func.name}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {func.calls} 次调用
                        </span>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(func.time / metrics.executionTime) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{func.time}ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 性能瓶颈 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800">
                <h4 className="font-medium mb-2 flex items-center text-yellow-800 dark:text-yellow-300">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                  性能瓶颈
                </h4>
                <div className="space-y-2">
                  {metrics.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 border-l-4 border-l-yellow-400">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{bottleneck.issue}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{bottleneck.location}</p>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            优化建议：{bottleneck.suggestion}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          bottleneck.impact === 'high' ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300' :
                          'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {bottleneck.impact.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 内存使用趋势 */}
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-2 flex items-center text-gray-800 dark:text-gray-200">
                  <MemoryStick className="w-4 h-4 mr-2" />
                  内存使用趋势
                </h4>
                <div className="flex items-end justify-between h-20">
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-200 dark:bg-blue-700 w-8 rounded-t" style={{ height: '30%' }} />
                    <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">初始</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{metrics.memoryUsage.initial}MB</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-red-400 dark:bg-red-600 w-8 rounded-t" style={{ height: '100%' }} />
                    <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">峰值</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{metrics.memoryUsage.peak}MB</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-green-300 dark:bg-green-600 w-8 rounded-t" style={{ height: '50%' }} />
                    <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">最终</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{metrics.memoryUsage.final}MB</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 依赖优化器
  const DependencyOptimizer = () => {
    const [optimizing, setOptimizing] = useState(false);
    const [report, setReport] = useState(null);

    const optimizeDeps = () => {
      setOptimizing(true);
      
      setTimeout(() => {
        setReport({
          originalSize: 2456,
          optimizedSize: 1234,
          reduction: 50.2,
          duplicates: [
            { package: 'lodash', versions: ['4.17.15', '4.17.21'], canDedupe: true },
            { package: 'tslib', versions: ['2.0.0', '2.3.1', '2.4.0'], canDedupe: true }
          ],
          unused: [
            { package: 'moment', reason: '未检测到使用，建议移除' },
            { package: 'jquery', reason: '仅使用了$.ajax，可替换为fetch' }
          ],
          suggestions: [
            { 
              from: 'moment', 
              to: 'dayjs', 
              reason: '体积减少92%，API兼容',
              savings: '234KB'
            },
            {
              from: 'lodash',
              to: 'lodash-es',
              reason: '支持tree-shaking',
              savings: '156KB'
            }
          ]
        });
        setOptimizing(false);
      }, 2000);
    };

    return (
      <div className="space-y-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <Package className="w-5 h-5 mr-2 text-orange-600" />
              依赖优化分析
            </h3>
            <button
              onClick={optimizeDeps}
              disabled={optimizing}
              className="btn-minimal btn-primary bg-orange-600 hover:bg-orange-700 text-sm disabled:opacity-50"
            >
              {optimizing ? '分析中...' : '开始优化'}
            </button>
          </div>

          {report && (
            <div className="space-y-4">
              {/* 优化概览 */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">包体积优化</span>
                  <span className="text-2xl font-bold text-green-600">
                    -{report.reduction}%
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-700 dark:text-gray-300">
                  <span>原始: {report.originalSize}KB</span>
                  <span>→</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    优化后: {report.optimizedSize}KB
                  </span>
                </div>
              </div>

              {/* 重复依赖 */}
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">重复依赖</h4>
                <div className="space-y-2">
                  {report.duplicates.map((dup, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                      <div>
                        <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{dup.package}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {dup.versions.join(', ')}
                        </span>
                      </div>
                      <button className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                        合并版本
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 替换建议 */}
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">优化建议</h4>
                <div className="space-y-2">
                  {report.suggestions.map((sug, index) => (
                    <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{sug.from}</span>
                          <span className="mx-2 text-gray-500 dark:text-gray-400">→</span>
                          <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                            {sug.to}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          -{sug.savings}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{sug.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 实时协作
  const CollaborationPanel = () => {
    const [activeUsers] = useState([
      { id: 1, name: 'Alice', avatar: '👩‍💻', cursor: { line: 15, ch: 23 }, color: '#FF6B6B' },
      { id: 2, name: 'Bob', avatar: '👨‍💻', cursor: { line: 8, ch: 10 }, color: '#4ECDC4' },
      { id: 3, name: 'Charlie', avatar: '🧑‍💻', cursor: { line: 22, ch: 5 }, color: '#45B7D1' }
    ]);

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
        <h3 className="font-semibold mb-3 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          实时协作
        </h3>
        
        <div className="space-y-3">
          {/* 在线用户 */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">在线协作者</h4>
            <div className="flex -space-x-2">
              {activeUsers.map(user => (
                <div
                  key={user.id}
                  className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-600"
                  style={{ backgroundColor: user.color + '20', borderColor: user.color }}
                  title={`${user.name} - Line ${user.cursor.line}`}
                >
                  <span className="text-lg">{user.avatar}</span>
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center border-2 border-white dark:border-gray-500">
                <span className="text-xs font-medium">+2</span>
              </div>
            </div>
          </div>

          {/* 实时活动 */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">实时活动</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-lg">👩‍💻</span>
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">Alice</span>
                  <span className="text-gray-600 dark:text-gray-400"> 正在编辑 processData 函数</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 block">刚刚</span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-lg">👨‍💻</span>
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">Bob</span>
                  <span className="text-gray-600 dark:text-gray-400"> 添加了错误处理</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 block">2分钟前</span>
                </div>
              </div>
            </div>
          </div>

          {/* 协作工具 */}
          <div className="flex space-x-2">
            <button className="flex-1 btn-minimal btn-primary bg-blue-600 hover:bg-blue-700 text-sm">
              <GitBranch className="w-4 h-4 mr-1" />
              代码评审
            </button>
            <button className="flex-1 btn-minimal btn-primary bg-purple-600 hover:bg-purple-700 text-sm">
              <Users className="w-4 h-4 mr-1" />
              屏幕共享
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 可视化管道编辑器
  const VisualPipeline = () => {
    const [pipeline] = useState([
      { id: 1, type: 'input', name: 'CSV文件', icon: '📄' },
      { id: 2, type: 'process', name: 'Papa Parse', icon: '🔄' },
      { id: 3, type: 'transform', name: 'Lodash处理', icon: '⚙️' },
      { id: 4, type: 'output', name: 'JSON输出', icon: '📊' }
    ]);

    return (
      <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-100 dark:border-teal-800">
        <h3 className="font-semibold mb-3 flex items-center">
          <Workflow className="w-5 h-5 mr-2 text-teal-600" />
          可视化数据管道
        </h3>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between space-x-2">
            {pipeline.map((node, index) => (
              <React.Fragment key={node.id}>
                <div className={`
                  flex flex-col items-center p-3 rounded-lg border-2 
                  ${node.type === 'input' ? 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    node.type === 'process' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                    node.type === 'transform' ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                    'border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'}
                `}>
                  <span className="text-2xl mb-1">{node.icon}</span>
                  <span className="text-xs font-medium">{node.name}</span>
                </div>
                {index < pipeline.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600 relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm border border-gray-200 dark:border-gray-600">
            <strong className="text-gray-800 dark:text-gray-200">数据流预览:</strong>
            <pre className="mt-2 text-xs text-gray-700 dark:text-gray-300">
{`[{ name: "Alice", age: 25 }] 
  → 解析CSV 
  → 按年龄分组 
  → { "20-30": [{ name: "Alice", age: 25 }] }`}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  // 渲染当前功能
  const renderFeature = () => {
    switch(activeFeature) {
      case 'ai-assistant':
        return <AIAssistant />;
      case 'security-scanner':
        return <SecurityScanner />;
      case 'performance-profiler':
        return <PerformanceProfiler />;
      case 'dependency-optimizer':
        return <DependencyOptimizer />;
      case 'collaboration':
        return <CollaborationPanel />;
      case 'visual-pipeline':
        return <VisualPipeline />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 头部 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
              <Layers3 className="w-8 h-8 mr-2 text-blue-600" />
              NPM Playground 高级功能演示
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">企业版功能预览</span>
              <button className="btn-minimal btn-primary bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                升级到企业版
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 功能选择标签 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {Object.entries(features).map(([key, feature]) => {
              const Icon = feature.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFeature(key)}
                  className={`
                    flex items-center px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                    ${activeFeature === key 
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'}
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="font-medium">{feature.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 功能描述 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                {features[activeFeature].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {features[activeFeature].description}
              </p>
              
              {/* 功能亮点 */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">功能亮点：</h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span>实时响应，毫秒级延迟</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span>AI驱动的智能建议</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span>企业级安全保障</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                    <span>无缝集成现有工作流</span>
                  </li>
                </ul>
              </div>

              {/* 使用统计 */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                <h3 className="font-medium text-sm mb-2 text-gray-800 dark:text-gray-200">使用统计</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">今日使用</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">1,234次</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">平均响应时间</span>
                    <span className="font-medium text-green-600">124ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">用户满意度</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">98.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 功能演示区 */}
          <div className="lg:col-span-2">
            {renderFeature()}
            
            {/* 底部提示 */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex items-start">
                <Award className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-300">专业提示</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    这些高级功能可以显著提升您的开发效率。企业版用户可以无限制使用所有功能，
                    并获得优先技术支持和定制化服务。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}