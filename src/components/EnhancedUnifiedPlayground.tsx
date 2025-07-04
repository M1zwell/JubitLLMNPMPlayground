import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Copy, Github, Calendar, Code, Terminal, Globe, RefreshCw, Save, Upload, 
  Layers, Target, Users, FileText, Image, Database, Mail, Lock, Filter, Share2, 
  TrendingUp, Award, Clock, DollarSign, Cpu, Eye, ExternalLink, AlertTriangle, 
  Workflow, CheckCircle, Plus, Minus, PlayCircle
} from 'lucide-react';
import { useLLMModels } from '../hooks/useLLMModels';
import { useNPMPackages } from '../hooks/useNPMPackages';
import { LLMModel, NPMPackage } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { WorkflowExecutor } from '../lib/execution/workflow-executor';
import { workflowTemplates } from '../lib/execution/workflow-templates';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';
import WorkflowVisualization from './WorkflowVisualization';
// ========== 核心类型定义 ==========
interface LLMProvider {
  id: string;
  name: string;
  models: LLMModel[];
  call: (params: LLMCallParams) => Promise<LLMResponse>;
  stream: (params: LLMCallParams) => AsyncIterableIterator<string>;
}

interface LLMCallParams {
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
  metadata?: any;
}

interface WorkflowComponent {
  id: string;
  type: 'llm' | 'npm' | 'input' | 'output' | 'transform';
  data: LLMModel | NPMPackage | any;
  position: { x: number; y: number };
  config: any;
  status: 'ready' | 'running' | 'completed' | 'error';
  inputs: string[];
  outputs: string[];
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourcePort: string;
  targetPort: string;
}

interface ExecutionResult {
  componentId: string;
  output: any;
  metadata: {
    executionTime: number;
    cost: number;
    tokensUsed?: number;
    memoryUsed: string;
    success: boolean;
  };
  timestamp: number;
}

// ========== LLM适配器实现 ==========
class LLMAdapterFactory {
  private static adapters = new Map<string, any>();

  static createOpenAIAdapter(apiKey: string) {
    return {
      id: 'openai',
      name: 'OpenAI',
      async call(params: LLMCallParams): Promise<LLMResponse> {
        // 模拟OpenAI API调用
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          content: `🧠 OpenAI ${params.model} Response:\n\nAnalyzed: "${params.prompt.substring(0, 50)}..."\n\nKey insights:\n• Advanced reasoning applied\n• High confidence analysis\n• Context-aware processing\n• Optimized for accuracy`,
          usage: {
            promptTokens: Math.floor(params.prompt.length / 4),
            completionTokens: 150
          }
        };
      },
      async *stream(params: LLMCallParams) {
        const chunks = [
          '🧠 OpenAI Analysis:\n\n',
          'Processing your request... ',
          'Applying advanced reasoning... ',
          'Generating insights... ',
          '\n\nKey findings:\n',
          '• Pattern recognition complete\n',
          '• Context analysis finished\n',
          '• Response optimized for clarity'
        ];
        
        for (const chunk of chunks) {
          await new Promise(resolve => setTimeout(resolve, 300));
          yield chunk;
        }
      }
    };
  }

  static createAnthropicAdapter(apiKey: string) {
    return {
      id: 'anthropic',
      name: 'Anthropic',
      async call(params: LLMCallParams): Promise<LLMResponse> {
        await new Promise(resolve => setTimeout(resolve, 2500));
        return {
          content: `🤖 Claude Analysis:\n\nThoughtful examination of: "${params.prompt.substring(0, 50)}..."\n\nDetailed insights:\n• Careful reasoning process\n• Ethical considerations included\n• Balanced perspective provided\n• Nuanced understanding demonstrated`,
          usage: {
            promptTokens: Math.floor(params.prompt.length / 4),
            completionTokens: 180
          }
        };
      },
      async *stream(params: LLMCallParams) {
        const chunks = [
          '🤖 Claude thinking...\n\n',
          'Examining the context carefully... ',
          'Considering multiple perspectives... ',
          'Formulating balanced response... ',
          '\n\nMy analysis:\n',
          '• Comprehensive evaluation complete\n',
          '• Ethical implications considered\n',
          '• Nuanced insights provided'
        ];
        
        for (const chunk of chunks) {
          await new Promise(resolve => setTimeout(resolve, 400));
          yield chunk;
        }
      }
    };
  }

  static createGoogleAdapter(apiKey: string) {
    return {
      id: 'google',
      name: 'Google',
      async call(params: LLMCallParams): Promise<LLMResponse> {
        await new Promise(resolve => setTimeout(resolve, 1800));
        return {
          content: `⚡ Gemini Analysis:\n\nMultimodal processing of: "${params.prompt.substring(0, 50)}..."\n\nAdvanced insights:\n• Rapid processing completed\n• Cross-modal understanding\n• Scalable analysis applied\n• Efficient resource utilization`,
          usage: {
            promptTokens: Math.floor(params.prompt.length / 4),
            completionTokens: 120
          }
        };
      },
      async *stream(params: LLMCallParams) {
        const chunks = [
          '⚡ Gemini processing...\n\n',
          'Multimodal analysis initiated... ',
          'Cross-referencing knowledge... ',
          'Optimizing response... ',
          '\n\nResults:\n',
          '• Fast processing complete\n',
          '• Comprehensive analysis done\n',
          '• Efficient execution achieved'
        ];
        
        for (const chunk of chunks) {
          await new Promise(resolve => setTimeout(resolve, 250));
          yield chunk;
        }
      }
    };
  }
}

// ========== NPM包执行引擎 ==========
class NPMExecutionEngine {
  private cache = new Map<string, any>();

  async executePackage(packageName: string, code: string, input: any): Promise<any> {
    // 模拟NPM包执行
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResults = {
      'lodash': {
        output: `📦 Lodash Processing:\n✅ Data transformation completed\n• Objects processed: ${Math.floor(Math.random() * 100) + 50}\n• Operations: map, filter, reduce\n• Performance: Optimized\n• Result: ${JSON.stringify(input).substring(0, 30)}...`,
        metadata: { memoryUsed: '15MB', efficiency: '94%' }
      },
      'axios': {
        output: `🌐 Axios HTTP Request:\n✅ Request completed successfully\n• Method: GET\n• Status: 200 OK\n• Response time: ${Math.floor(Math.random() * 300) + 100}ms\n• Data received: 2.4KB`,
        metadata: { memoryUsed: '8MB', efficiency: '96%' }
      },
      'joi': {
        output: `✅ Joi Validation:\n• Schema validation completed\n• Valid fields: ${Math.floor(Math.random() * 20) + 15}/18\n• Errors found: ${Math.floor(Math.random() * 3)}\n• Validation score: ${85 + Math.floor(Math.random() * 15)}%`,
        metadata: { memoryUsed: '12MB', efficiency: '91%' }
      },
      'sharp': {
        output: `🖼️ Sharp Image Processing:\n✅ Image optimization completed\n• Resolution: 1920x1080 → 800x600\n• Size: 2.4MB → ${(Math.random() * 1 + 0.5).toFixed(1)}MB\n• Format: PNG → WebP\n• Quality: 85%`,
        metadata: { memoryUsed: '45MB', efficiency: '89%' }
      }
    };

    return mockResults[packageName] || {
      output: `📦 ${packageName} Processing:\n✅ Execution completed\n• Input processed successfully\n• Custom logic applied\n• Output generated`,
      metadata: { memoryUsed: '10MB', efficiency: '92%' }
    };
  }

  async installPackage(packageName: string, version?: string): Promise<boolean> {
    // 模拟包安装
    await new Promise(resolve => setTimeout(resolve, 800));
    this.cache.set(packageName, { installed: true, version: version || 'latest' });
    return true;
  }

  getInstalledPackages(): string[] {
    return Array.from(this.cache.keys());
  }
}

// ========== 工作流执行引擎 ==========
class WorkflowExecutionEngine {
  private llmAdapters: Map<string, any> = new Map();
  private npmEngine: NPMExecutionEngine;
  private eventEmitter: ((event: string, data: any) => void) | null = null;

  constructor() {
    this.npmEngine = new NPMExecutionEngine();
    
    // 初始化LLM适配器
    this.llmAdapters.set('openai', LLMAdapterFactory.createOpenAIAdapter('demo-key'));
    this.llmAdapters.set('anthropic', LLMAdapterFactory.createAnthropicAdapter('demo-key'));
    this.llmAdapters.set('google', LLMAdapterFactory.createGoogleAdapter('demo-key'));
  }

  setEventEmitter(emitter: (event: string, data: any) => void) {
    this.eventEmitter = emitter;
  }

  private emit(event: string, data: any) {
    if (this.eventEmitter) {
      this.eventEmitter(event, data);
    }
  }

  async executeWorkflow(
    components: WorkflowComponent[], 
    connections: WorkflowConnection[], 
    input: any
  ): Promise<Map<string, ExecutionResult>> {
    const results = new Map<string, ExecutionResult>();
    const executionOrder = this.topologicalSort(components, connections);
    
    this.emit('workflow_start', { totalComponents: components.length });

    for (const component of executionOrder) {
      this.emit('component_start', { componentId: component.id, type: component.type });
      
      try {
        const startTime = Date.now();
        let result: any;
        let cost = 0;

        switch (component.type) {
          case 'input':
            result = { output: input, metadata: { inputProvided: true } };
            break;

          case 'llm':
            result = await this.executeLLMComponent(component, input);
            cost = this.calculateLLMCost(component.data as LLMModel, result.usage);
            break;

          case 'npm':
            result = await this.executeNPMComponent(component, input);
            cost = 0.001; // NPM执行成本
            break;

          case 'output':
            result = { output: input, metadata: { outputGenerated: true } };
            break;

          default:
            throw new Error(`Unknown component type: ${component.type}`);
        }

        const executionTime = Date.now() - startTime;
        const executionResult: ExecutionResult = {
          componentId: component.id,
          output: result.output,
          metadata: {
            executionTime,
            cost,
            tokensUsed: result.usage?.promptTokens + result.usage?.completionTokens,
            memoryUsed: result.metadata?.memoryUsed || '10MB',
            success: true
          },
          timestamp: Date.now()
        };

        results.set(component.id, executionResult);
        this.emit('component_complete', { 
          componentId: component.id, 
          result: executionResult 
        });

      } catch (error) {
        const errorResult: ExecutionResult = {
          componentId: component.id,
          output: `Error: ${error.message}`,
          metadata: {
            executionTime: 0,
            cost: 0,
            memoryUsed: '0MB',
            success: false
          },
          timestamp: Date.now()
        };

        results.set(component.id, errorResult);
        this.emit('component_error', { 
          componentId: component.id, 
          error: error.message 
        });
      }
    }

    this.emit('workflow_complete', { results: Array.from(results.values()) });
    return results;
  }

  private async executeLLMComponent(component: WorkflowComponent, input: any): Promise<any> {
    const model = component.data as LLMModel;
    const adapter = this.llmAdapters.get(model.provider.toLowerCase());
    
    if (!adapter) {
      throw new Error(`LLM adapter not found for provider: ${model.provider}`);
    }

    const prompt = component.config.prompt || `Analyze this input: ${JSON.stringify(input)}`;
    
    if (component.config.stream) {
      let fullResponse = '';
      const stream = adapter.stream({ model: model.model_id, prompt });
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        this.emit('llm_stream_chunk', { 
          componentId: component.id, 
          chunk, 
          fullResponse 
        });
      }
      
      return {
        output: fullResponse,
        usage: {
          promptTokens: Math.floor(prompt.length / 4),
          completionTokens: Math.floor(fullResponse.length / 4)
        }
      };
    } else {
      const response = await adapter.call({ model: model.model_id, prompt });
      return {
        output: response.content,
        usage: response.usage
      };
    }
  }

  private async executeNPMComponent(component: WorkflowComponent, input: any): Promise<any> {
    const pkg = component.data as NPMPackage;
    const code = component.config.code || `// Process input with ${pkg.name}\nreturn input;`;
    
    return await this.npmEngine.executePackage(pkg.name, code, input);
  }

  private calculateLLMCost(model: LLMModel, usage: any): number {
    if (!usage) return 0;
    
    const inputCost = (usage.promptTokens / 1000000) * model.input_price;
    const outputCost = (usage.completionTokens / 1000000) * model.output_price;
    
    return inputCost + outputCost;
  }

  private topologicalSort(
    components: WorkflowComponent[], 
    connections: WorkflowConnection[]
  ): WorkflowComponent[] {
    // 简化的拓扑排序实现
    const sorted: WorkflowComponent[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (componentId: string) => {
      if (visiting.has(componentId)) {
        throw new Error('Circular dependency detected');
      }
      if (visited.has(componentId)) {
        return;
      }

      visiting.add(componentId);

      // 找到依赖的组件
      const dependencies = connections
        .filter(conn => conn.target === componentId)
        .map(conn => conn.source);

      dependencies.forEach(depId => visit(depId));

      visiting.delete(componentId);
      visited.add(componentId);

      const component = components.find(c => c.id === componentId);
      if (component) {
        sorted.push(component);
      }
    };

    components.forEach(component => {
      if (!visited.has(component.id)) {
        visit(component.id);
      }
    });

    return sorted;
  }
}

// ========== AI建议生成器 ==========
class AIWorkflowSuggestor {
  static generateSuggestions(components: WorkflowComponent[]): any[] {
    const suggestions = [];

    if (components.length === 0) {
      suggestions.push({
        type: 'getting-started',
        title: '开始构建工作流',
        description: '添加一个LLM模型开始您的AI工作流',
        priority: 'high',
        icon: '🚀',
        action: 'add-llm'
      });
    }

    const hasLLM = components.some(c => c.type === 'llm');
    const hasNPM = components.some(c => c.type === 'npm');
    const hasValidation = components.some(c => 
      c.type === 'npm' && ['joi', 'validator'].includes(c.data?.name)
    );

    if (hasLLM && !hasValidation) {
      suggestions.push({
        type: 'quality',
        title: '添加数据验证',
        description: '使用Joi或Validator验证LLM输出质量',
        priority: 'medium',
        icon: '✅',
        action: 'add-validation',
        packages: ['joi', 'validator']
      });
    }

    if (hasLLM && hasNPM && components.length >= 3) {
      suggestions.push({
        type: 'optimization',
        title: '性能优化建议',
        description: '考虑添加缓存和批处理以提高性能',
        priority: 'low',
        icon: '⚡',
        action: 'optimize-performance'
      });
    }

    if (components.length >= 2 && !components.some(c => c.type === 'output')) {
      suggestions.push({
        type: 'output',
        title: '添加输出处理',
        description: '添加结果格式化或导出功能',
        priority: 'medium',
        icon: '📤',
        action: 'add-output',
        packages: ['nodemailer', 'pdf-lib', 'xlsx']
      });
    }

    return suggestions;
  }
}

// 可视化图表组件
const PerformanceChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="card-minimal compact-lg">
      <h3 className="text-base font-medium mb-3 flex items-center gap-2 text-primary">
        <TrendingUp className="icon" />
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs w-16 truncate text-secondary">{item.label}</span>
            <div className="flex-1 bg-secondary/30 rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-tertiary w-8 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 工作流可视化图表
const WorkflowDiagram = ({ workflow, connections }) => {
  return (
    <div className="card-minimal compact-lg">
      <h3 className="text-base font-medium mb-3 flex items-center gap-2 text-primary">
        <Workflow className="icon" />
        {language === 'en' ? 'Workflow Visualization' : '工作流可视化'}
      </h3>
      <div className="relative">
        <svg className="w-full h-36" viewBox="0 0 800 160">
          {/* Draw workflow nodes */}
          {workflow.map((node, index) => (
            <g key={node.id}>
              {/* Node rectangle */}
              <rect
                x={100 + index * 120}
                y={60}
                width={80}
                height={36}
                rx={6}
                className={`fill-blue-600/30 stroke-blue-400 ${
                  node.status === 'running' ? 'animate-pulse' : 
                  node.status === 'completed' ? 'fill-green-600/30 stroke-green-400' : ''
                }`}
                strokeWidth="1"
              />
              {/* Node text */}
              <text
                x={140 + index * 120}
                y={80}
                textAnchor="middle"
                className="fill-primary text-xs"
              >
                {node.component}
              </text>
              
              {/* Connection arrow */}
              {index < workflow.length - 1 && (
                <line
                  x1={180 + index * 120}
                  y1={80}
                  x2={220 + index * 120}
                  y2={80}
                  className="stroke-primary"
                  strokeWidth="1"
                  markerEnd="url(#arrowhead)"
                />
              )}
            </g>
          ))}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                className="fill-primary"
              />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
};

// 性能指标圆形图表
const MetricsGauge = ({ value, max, label, color }) => {
  const percentage = (value / max) * 100;
  const strokeDasharray = `${percentage * 2.51} 251`;
  
  return (
    <div className="text-center py-2">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 84 84">
          <circle
            cx="42"
            cy="42"
            r="40"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-tertiary/30"
          />
          <circle
            cx="42"
            cy="42"
            r="40"
            stroke={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#F59E0B'}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-primary">{value}</span>
        </div>
      </div>
      <p className="text-xs text-tertiary">{label}</p>
    </div>
  );
};

// Gamification系统
const GamificationSystem = ({ level, xp, achievements }) => {
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000];
  const currentLevelXP = levelThresholds[level] || 0;
  const nextLevelXP = levelThresholds[level + 1] || currentLevelXP * 2;
  const progressPercentage = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const levelTitles = [
    'Beginner', 'Explorer', 'Builder', 'Creator', 'Expert', 
    'Master', 'Architect', 'Wizard', 'Legend'
  ];

  return (
    <div className="card-minimal compact-lg border-l-2 border-primary">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-medium text-primary">{levelTitles[level] || 'Digital God'}</h3>
          <p className="text-xs text-tertiary">Level {level + 1} • {xp} XP</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium text-warning">{achievements.length}</div>
          <div className="text-xs text-tertiary">Achievements</div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-secondary">Progress to Next Level</span>
          <span className="text-secondary">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="bg-secondary/30 rounded-full h-1">
          <div 
            className="bg-warning h-1 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {achievements.slice(0, 6).map((achievement, index) => (
          <span 
            key={index} 
            className="badge badge-warning text-xs flex items-center gap-1"
            title={achievement.description}
          >
            <Award className="icon-sm" />
            {achievement.name}
          </span>
        ))}
      </div>
    </div>
  );
};

// 主组件
const EnhancedUnifiedPlayground = () => {
  const { models: llmModels, loading: llmLoading } = useLLMModels();
  const { packages: npmPackages, loading: npmLoading } = useNPMPackages({ limit: 100 });
  const { language, t } = useLanguage();
  
  // 状态管理
  const [workflowComponents, setWorkflowComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [executionResults, setExecutionResults] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [inputText, setInputText] = useState('Analyze the latest trends in artificial intelligence and machine learning for 2024.');
  
  // UI状态
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPromptExporter, setShowPromptExporter] = useState(false);
  
  // Platform integration
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [workflowExecutor, setWorkflowExecutor] = useState(null);
  const [executionError, setExecutionError] = useState('');
  
  // Gamification状态
  const [userLevel, setUserLevel] = useState(2);
  const [userXP, setUserXP] = useState(450);
  const [achievements, setAchievements] = useState([
    { name: 'First Workflow', description: 'Created your first AI workflow' },
    { name: 'LLM Explorer', description: 'Used 5 different LLM models' },
    { name: 'NPM Integrator', description: 'Added 10 NPM packages' }
  ]);

  // 数据处理
  const availableLLMs = useMemo(() => llmModels.slice(0, 12), [llmModels]);
  const availableNPMs = useMemo(() => npmPackages.slice(0, 15), [npmPackages]);

  // 性能数据
  const performanceData = useMemo(() => [
    { label: 'Throughput', value: Math.min(workflowComponents.length * 15, 100) },
    { label: 'Accuracy', value: 85 + Math.floor(Math.random() * 15) },
    { label: 'Speed', value: 70 + Math.floor(Math.random() * 30) },
    { label: 'Efficiency', value: 80 + Math.floor(Math.random() * 20) }
  ], [workflowComponents.length]);

  const costAnalysisData = useMemo(() => [
    { label: 'LLM API', value: 0.0045 },
    { label: 'Compute', value: 0.0012 },
    { label: 'Storage', value: 0.0003 },
    { label: 'Network', value: 0.0001 }
  ], []);

  // AI建议
  const aiSuggestions = useMemo(() => {
    if (workflowComponents.length === 0) {
      return [
        {
          title: 'Start with a Text Generator',
          description: 'Add GPT-4 or Claude for content generation',
          priority: 'high',
          type: 'getting-started',
          components: availableLLMs.slice(0, 3)
        }
      ];
    }
    
    const hasLLM = workflowComponents.some(c => c.type === 'llm');
    const hasNPM = workflowComponents.some(c => c.type === 'npm');
    
    const suggestions = [];
    
    if (hasLLM && !hasNPM) {
      suggestions.push({
        title: 'Add Data Processing',
        description: 'Use Lodash or Joi for data manipulation',
        priority: 'medium',
        type: 'enhancement',
        components: availableNPMs.filter(pkg => ['lodash', 'joi', 'validator'].includes(pkg.name))
      });
    }
    
    if (workflowComponents.length >= 2) {
      suggestions.push({
        title: 'Optimize Performance',
        description: 'Consider adding caching or batch processing',
        priority: 'low',
        type: 'optimization',
        components: availableNPMs.filter(pkg => ['redis', 'node-cache'].includes(pkg.name))
      });
    }
    
    return suggestions;
  }, [workflowComponents, availableLLMs, availableNPMs]);

  // 组件操作
  const addComponent = useCallback((component, type) => {
    const newComponent = {
      id: `${type}_${component.id}_${Date.now()}`,
      type,
      data: component,
      status: 'ready',
      config: type === 'llm' ? { 
        prompt: 'Analyze the following input:',
        temperature: 0.7,
        maxTokens: 500 
      } : {
        code: `// Process with ${component.name}\nreturn input;`
      }
    };

    if (type === 'npm') {
      // 获取NPM包的详细信息
      const packageData = npmPackages.find(pkg => pkg.id === component.id);
      newComponent.packageData = packageData;
    }

    setWorkflowComponents(prev => [...prev, newComponent]);
    setUserXP(prev => prev + 25);
  }, [npmPackages]);

  const removeComponent = useCallback((componentId) => {
    setWorkflowComponents(prev => prev.filter(c => c.id !== componentId));
    setExecutionResults(prev => {
      const newResults = { ...prev };
      delete newResults[componentId];
      return newResults;
    });
  }, []);

  const executeWorkflow = useCallback(async () => {
    if (workflowComponents.length === 0) return;

    setIsExecuting(true);
    setExecutionResults({});
    
    // 模拟执行过程
    for (let i = 0; i < workflowComponents.length; i++) {
      const component = workflowComponents[i];
      
      // 更新组件状态为运行中
      setWorkflowComponents(prev => prev.map(c => 
        c.id === component.id ? { ...c, status: 'running' } : c
      ));

      // 模拟执行延迟
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // 生成模拟结果
      const result = {
        output: component.type === 'llm' 
          ? `🧠 ${component.data.name} Analysis:\n\nProcessed: "${inputText.substring(0, 50)}..."\n\nKey insights:\n• Advanced reasoning applied\n• Context-aware processing\n• High-quality output generated\n• Optimized for accuracy and relevance`
          : `📦 ${component.data.name} Processing:\n\n✅ Package execution completed\n• Input processed successfully\n• Custom logic applied\n• Output transformed\n• Performance optimized`,
        metadata: {
          tokens_used: component.type === 'llm' ? Math.floor(Math.random() * 1000) + 500 : null,
          execution_time: Math.floor(Math.random() * 2000) + 500,
          cost: component.type === 'llm' ? (Math.random() * 0.01).toFixed(4) : 0.001,
          memory_used: `${Math.floor(Math.random() * 50) + 10}MB`
        }
      };

      // 更新执行结果
      setExecutionResults(prev => ({
        ...prev,
        [component.id]: result
      }));

      // 更新组件状态为完成
      setWorkflowComponents(prev => prev.map(c => 
        c.id === component.id ? { ...c, status: 'completed' } : c
      ));
    }

    setIsExecuting(false);
    setUserXP(prev => prev + 100);
  }, [workflowComponents, inputText]);

  // 生成系统提示
  const generateSystemPrompts = useCallback(() => {
    const llmComponents = workflowComponents.filter(c => c.type === 'llm');
    const npmComponents = workflowComponents.filter(c => c.type === 'npm');

    return {
      systemPrompt: `You are an AI workflow execution engine. Your task is to process the following workflow:

LLM Components:
${llmComponents.map(c => `- ${c.data.name} (${c.data.provider}): ${c.config.prompt}`).join('\n')}

NPM Components:
${npmComponents.map(c => `- ${c.data.name}: ${c.data.description}`).join('\n')}

Input: "${inputText}"

Execute this workflow step by step, providing detailed analysis and processing results for each component.`,

      executionPrompt: `Execute the following AI workflow:

1. Process input through each component in sequence
2. For LLM components: Apply the specified prompt and generate intelligent analysis
3. For NPM components: Simulate package execution and data transformation
4. Provide detailed output for each step
5. Include performance metrics and cost analysis

Workflow Configuration:
${JSON.stringify(workflowComponents.map(c => ({
  type: c.type,
  name: c.data.name,
  config: c.config
})), null, 2)}`,

      implementationCode: `// AI Workflow Implementation
class AIWorkflow {
  constructor() {
    this.components = ${JSON.stringify(workflowComponents.map(c => ({
      id: c.id,
      type: c.type,
      name: c.data.name
    })), null, 4)};
  }

  async execute(input) {
    console.log('🚀 Starting AI workflow execution...');
    const results = {};
    
    for (const component of this.components) {
      if (component.type === 'llm') {
        results[component.id] = await this.processLLM(component, input);
      } else if (component.type === 'npm') {
        results[component.id] = await this.processNPM(component, input);
      }
    }
    
    return results;
  }

  async processLLM(component, input) {
    // Implement LLM API call
    return await callLLMAPI(component.name, input);
  }

  async processNPM(component, input) {
    // Implement NPM package execution
    return await executeNPMPackage(component.name, input);
  }
}

// Usage
const workflow = new AIWorkflow();
const results = await workflow.execute("${inputText}");
console.log('Results:', results);`
    };
  }, [workflowComponents, inputText]);

  // 复制到剪贴板
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    // 可以添加toast通知
  }, []);

  // 格式化数字
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (llmLoading || npmLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-secondary">{language === 'en' ? 'Initializing Unified Playground...' : '正在初始化统一开发环境...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-primary mb-2">
          🎮 {language === 'en' ? 'Unified AI+NPM Playground' : '统一 AI+NPM 开发平台'}
        </h1>
        <p className="text-sm text-secondary mb-4">
          {language === 'en' 
            ? 'Combine LLM models + NPM packages to create powerful AI workflows • Real-time execution • AI suggestions' 
            : '组合 LLM 模型和 NPM 包创建强大的 AI 工作流 • 实时执行 • AI 建议'}
        </p>
        
        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="btn btn-secondary"
          >
            <TrendingUp className="icon-sm" />
            {language === 'en' ? 'Analytics' : '分析'}
          </button>
          <button
            onClick={() => setShowPromptExporter(!showPromptExporter)}
            className="btn btn-secondary"
          >
            <FileText className="icon-sm" />
            {language === 'en' ? 'Export Context' : '导出上下文'}
          </button>
          <button
            onClick={executeWorkflow}
            disabled={workflowComponents.length === 0 || isExecuting}
            className="btn btn-success"
            disabled={workflowComponents.length === 0 || isExecuting}
          >
            <PlayCircle className="icon-sm" />
            {isExecuting 
              ? (language === 'en' ? 'Executing...' : '执行中...') 
              : (language === 'en' ? 'Execute Workflow' : '执行工作流')}
          </button>
        </div>
      </div>

        {/* Gamification Panel */}
        <div className="mb-6">
          <GamificationSystem level={userLevel} xp={userXP} achievements={achievements} />
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 fade-in">
            <PerformanceChart data={performanceData} title="Performance Metrics" />
            <WorkflowDiagram workflow={workflowComponents} connections={[]} />
            <div className="space-y-4">
              <div className="card-minimal compact">
                <h3 className="text-base font-medium mb-3 text-primary">{language === 'en' ? 'Real-time Metrics' : '实时指标'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <MetricsGauge value={performanceData[0]?.value || 0} max={100} label="Throughput" color="blue" />
                  <MetricsGauge value={performanceData[1]?.value || 0} max={100} label="Accuracy" color="green" />
                </div>
              </div>
              <div className="card-minimal compact">
                <h3 className="text-base font-medium mb-2 text-primary">{language === 'en' ? 'Cost Analysis' : '成本分析'}</h3>
                <div className="text-xl font-medium text-warning mb-1">
                  ${costAnalysisData.reduce((sum, item) => sum + item.value, 0).toFixed(4)}
                </div>
                <p className="text-xs text-tertiary">{language === 'en' ? 'Total execution cost' : '总执行成本'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Context/Prompt Exporter */}
        {showPromptExporter && (
          <div className="card compact-lg mb-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium flex items-center gap-2 text-primary">
                <FileText className="icon" />
                {language === 'en' ? 'Generated Context & Prompts for AI Coding Tools' : '为 AI 编码工具生成的上下文和提示'}
              </h3>
              <button
                onClick={() => setShowPromptExporter(false)}
                className="btn btn-ghost compact-xs"
              >
                <Minus className="icon-sm" />
              </button>
            </div>
            
            {(() => {
              const prompts = generateSystemPrompts();
              return (
                <div className="space-y-6">
                  <div className="card-minimal compact">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-success text-sm">{language === 'en' ? 'System Prompt' : '系统提示'}</h4>
                      <button
                        onClick={() => copyToClipboard(prompts.systemPrompt)}
                        className="btn btn-ghost text-xs compact-xs"
                      >
                        <Copy className="icon-sm" />
                        {language === 'en' ? 'Copy' : '复制'}
                      </button>
                    </div>
                    <pre className="text-xs text-secondary whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {prompts.systemPrompt}
                    </pre>
                  </div>
                  
                  <div className="card-minimal compact">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-primary text-sm">{language === 'en' ? 'Execution Instructions' : '执行指令'}</h4>
                      <button
                        onClick={() => copyToClipboard(prompts.executionPrompt)}
                        className="btn btn-ghost text-xs compact-xs"
                      >
                        <Copy className="icon-sm" />
                        {language === 'en' ? 'Copy' : '复制'}
                      </button>
                    </div>
                    <pre className="text-xs text-secondary whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {prompts.executionPrompt}
                    </pre>
                  </div>
                  
                  <div className="card-minimal compact">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-primary text-sm">{language === 'en' ? 'JavaScript Implementation' : 'JavaScript 实现'}</h4>
                      <button
                        onClick={() => copyToClipboard(prompts.implementationCode)}
                        className="btn btn-ghost text-xs compact-xs"
                      >
                        <Copy className="icon-sm" />
                        {language === 'en' ? 'Copy' : '复制'}
                      </button>
                    </div>
                    <pre className="text-xs text-secondary whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {prompts.implementationCode}
                    </pre>
                  </div>
                  
                  <div className="card-minimal compact border-l-2 border-warning">
                    <h4 className="font-medium text-warning mb-2 text-sm">🎯 {language === 'en' ? 'Ready for AI Coding Tools' : '准备用于 AI 编码工具'}</h4>
                    <p className="text-xs mb-3 text-secondary">
                      {language === 'en' 
                        ? 'These prompts and code are optimized for use in Cursor, Claude Code, Windsurf, v0.dev, bolt.new, and other AI coding platforms.' 
                        : '这些提示和代码已针对在 Cursor、Claude Code、Windsurf、v0.dev、bolt.new 和其他 AI 编码平台中使用进行了优化。'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['cursor', 'claude-code', 'windsurf', 'v0.dev', 'bolt.new', 'lovable'].map(tool => (
                        <span key={tool} className="badge badge-warning text-xs">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Templates & Available LLM Models */}
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="space-y-6">
              {/* Templates Section */}
              <div>
                <h2 className="text-base font-medium mb-3 flex items-center gap-2 text-primary">
                  <Award className="icon" />
                  {language === 'en' ? 'Workflow Templates' : '工作流模板'}
                </h2>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    if (templateId && workflowTemplates[templateId]) {
                      // Load template
                      setSelectedTemplate(templateId);
                    }
                  }}
                  className="input w-full mb-3"
                >
                  <option value="">{language === 'en' ? '-- Select a template --' : '-- 选择模板 --'}</option>
                  <option value="textGeneration">{language === 'en' ? 'Text Generation' : '文本生成'}</option>
                  <option value="dataAnalysis">{language === 'en' ? 'Data Analysis' : '数据分析'}</option>
                  <option value="codeGeneration">{language === 'en' ? 'Code Generator' : '代码生成器'}</option>
                  <option value="dataValidation">{language === 'en' ? 'Data Validator' : '数据验证器'}</option>
                  <option value="translation">{language === 'en' ? 'Content Translator' : '内容翻译器'}</option>
                  <option value="chatAssistant">{language === 'en' ? 'AI Chat Assistant' : 'AI 聊天助手'}</option>
                </select>
                
                {selectedTemplate && (
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => {
                      const template = workflowTemplates[selectedTemplate];
                      if (template) {
                        // Load template components
                      }
                    }}
                  >
                    <Plus className="icon-sm" />
                    {language === 'en' ? 'Load Template' : '加载模板'}
                  </button>
                )}
              </div>
              
              {/* LLM Models Section */}
              <div>
                <h2 className="text-base font-medium mb-3 flex items-center gap-2 text-primary">
                  <Brain className="icon" />
                  {language === 'en' ? 'LLM Models' : 'LLM 模型'}
                </h2>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                {availableLLMs.map(model => (
                  <div
                    key={model.id}
                    onClick={() => addComponent(model, 'llm')}
                    className="card-minimal compact-xs cursor-pointer hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="icon-sm text-primary" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-primary">{model.name}</h3>
                        <p className="text-xs text-tertiary">{model.provider}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${model.quality_index >= 60 ? 'text-success' : model.quality_index >= 40 ? 'text-warning' : 'text-tertiary'}`}>
                          {model.quality_index || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="badge badge-neutral">
                        ${model.output_price}
                      </span>
                      <span className="badge badge-neutral">
                        {model.output_speed.toFixed(0)} tok/s
                      </span>
                    </div>
                  </div>
                ))}
                </div>
              </div>

              {/* NPM Packages Section */}
              <div>
                <h2 className="text-base font-medium mb-3 flex items-center gap-2 text-primary">
                  <Package className="icon" />
                  {language === 'en' ? 'NPM Packages' : 'NPM 包'}
                </h2>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {availableNPMs.map(pkg => (
                    <div
                      key={pkg.id}
                      onClick={() => addComponent(pkg, 'npm')}
                      className="card-minimal compact-xs cursor-pointer hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="icon-sm text-success" />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm text-primary">{pkg.name}</h3>
                          <p className="text-xs text-tertiary truncate">{pkg.description?.substring(0, 30)}...</p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="badge badge-neutral">
                          {formatNumber(pkg.weekly_downloads)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Center & Right: Workflow Canvas & Execution Results */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <h2 className="text-base font-medium flex items-center gap-2 text-primary">
                <Workflow className="icon" />
                {language === 'en' ? 'Workflow Canvas' : '工作流画布'}
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter test input..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="input text-sm"
                  placeholder={language === 'en' ? "Enter test input..." : "输入测试数据..."}
                />
                <button
                  onClick={() => setWorkflowComponents([])}
                  className="btn btn-ghost text-warning text-sm"
                >
                  {language === 'en' ? 'Clear' : '清除'}
                </button>
              </div>
            </div>
            
            <div className="card-minimal min-h-80 p-6 border-2 border-dashed border-primary/30">
              {workflowComponents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-tertiary">
                  <div className="text-center">
                    <Layers className="mx-auto mb-3 opacity-50 icon-lg" />
                    <p className="font-medium">{language === 'en' ? 'Build Your AI Workflow' : '构建您的 AI 工作流'}</p>
                    <p className="text-sm mt-1">{language === 'en' ? 'Combine LLM models with NPM packages for powerful automation' : '结合 LLM 模型与 NPM 包实现强大的自动化'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflowComponents.map((component, index) => {
                    const result = executionResults[component.id];
                    const isLLM = component.type === 'llm';
                    
                    return (
                      <div key={component.id} className="flex items-center gap-3 mb-4">
                        <div className="text-xs text-tertiary w-6">{index + 1}.</div>
                        
                        <div className={`
                          ${isLLM ? 'card-minimal compact border-l-2 border-primary' : 'card-minimal compact border-l-2 border-success'}
                          flex-1 group relative
                          ${component.status === 'running' ? 'animate-pulse ring-1 ring-amber-400' : ''}
                          ${component.status === 'completed' ? 'ring-1 ring-emerald-400' : ''}
                        `}>
                          <div className="flex items-center gap-2 mb-2">
                            {isLLM ? <Brain className="icon-sm text-primary" /> : <Package className="icon-sm text-success" />}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm text-primary">{component.data.name}</h4>
                                {component.packageData && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Star className="icon-sm text-warning" />
                                    <span>{formatNumber(component.packageData.github_stars)}</span>
                                    <span className="text-success ml-1">{formatNumber(component.packageData.weekly_downloads)}/week</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-tertiary">{isLLM ? component.data.provider : component.data.description?.substring(0, 40) + '...'}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {component.status === 'running' && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-warning"></div>
                              )}
                              {component.status === 'completed' && (
                                <CheckCircle className="text-success icon-sm" />
                              )}
                              <button
                                onClick={() => removeComponent(component.id)}
                                className="opacity-0 group-hover:opacity-100 text-warning hover:text-warning-light transition-opacity"
                              >
                                <Minus className="icon-sm" />
                              </button>
                            </div>
                          </div>
                          
                          {result && (
                            <div className="mt-2 bg-secondary/20 rounded p-2">
                              <div className="text-xs text-success mb-1 flex items-center gap-1">
                                <CheckCircle className="icon-sm" />
                                {language === 'en' ? 'Execution Result' : '执行结果'}
                              </div>
                              <div className="text-xs font-mono whitespace-pre-wrap max-h-24 overflow-y-auto text-secondary">
                                {result.output}
                              </div>
                              <div className="text-xs text-tertiary mt-1 flex gap-3">
                                {result.metadata.tokens_used && (
                                  <span>🎯 {result.metadata.tokens_used} tokens</span>
                                )}
                                <span>⏱️ {result.metadata.execution_time}ms</span>
                                <span>💰 ${result.metadata.cost}</span>
                                <span>💾 {result.metadata.memory_used}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {index < workflowComponents.length - 1 && (
                          <ArrowRight className="text-tertiary icon" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* AI建议 */}
            {aiSuggestions.length > 0 && (
              <div className="mt-4 card-minimal compact-lg border-l-2 border-warning">
                <h3 className="text-base font-medium mb-3 flex items-center gap-2 text-primary">
                  <Lightbulb className="icon text-warning" />
                  {language === 'en' ? '🤖 AI Workflow Suggestions' : '🤖 AI 工作流建议'}
                </h3>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="card-minimal compact">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          suggestion.priority === 'high' ? 'bg-red-400' :
                          suggestion.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                        }`}></div>
                        <h4 className="font-medium text-sm text-primary">{suggestion.title}</h4>
                      </div>
                      <p className="text-xs text-secondary mb-2">{suggestion.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.components.slice(0, 3).map((comp, idx) => (
                          <button
                            key={idx}
                            onClick={() => addComponent(comp, suggestion.type === 'getting-started' ? 'llm' : 'npm')}
                            className="btn btn-warning text-xs compact-xs"
                          >
                            <Plus className="icon-sm" />
                            {comp.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        {/* 底部状态栏 */}
        <div className="mt-6 card-minimal compact-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-medium text-primary">{workflowComponents.length}</div>
              <div className="text-xs text-tertiary">{language === 'en' ? 'Components Added' : '已添加组件'}</div>
            </div>
            <div>
              <div className="text-lg font-medium text-success">
                {Object.keys(executionResults).length}
              </div>
              <div className="text-xs text-tertiary">{language === 'en' ? 'Successfully Executed' : '成功执行'}</div>
            </div>
            <div>
              <div className="text-lg font-medium text-warning">
                ${costAnalysisData.reduce((sum, item) => sum + item.value, 0).toFixed(4)}
              </div>
              <div className="text-xs text-tertiary">{language === 'en' ? 'Total Cost' : '总成本'}</div>
            </div>
            <div>
              <div className="text-lg font-medium text-primary">
                {workflowComponents.length > 0 ? '< 5s' : '0s'}
              </div>
              <div className="text-xs text-tertiary">{language === 'en' ? 'Est. Execution Time' : '预计执行时间'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Workflow Advisor */}
      <AIWorkflowAdvisor
        onComponentAdd={(component, type) => {
          addComponent(component, type);
        }}
        selectedComponents={workflowComponents}
      />
    </div>
  );
};

export default EnhancedUnifiedPlayground;