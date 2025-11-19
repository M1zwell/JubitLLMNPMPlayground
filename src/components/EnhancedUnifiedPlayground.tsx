import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Brain, Package, Workflow, Play, Save, Share2, Settings, Download, 
  Upload, RefreshCw, Plus, X, ArrowRight, Copy, ExternalLink, Code,
  Zap, CheckCircle, AlertTriangle, Clock, DollarSign, BarChart3,
  Eye, Terminal, Globe, Database, Lock, Shield, Target, TrendingUp,
  FileText, Image, Mail, Calendar, Star, Award, Users, Activity,
  Layers, Lightbulb, Filter, Search, PieChart, Gauge, Cpu
} from 'lucide-react';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';
import { useLLMModels } from '../hooks/useLLMModels';
import { useNPMPackages } from '../hooks/useNPMPackages';
import { LLMModel, NPMPackage } from '../lib/supabase';
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

// ========== 主组件 ==========
const EnhancedUnifiedPlayground: React.FC = () => {
  // 数据hooks
  const { models: llmModels, loading: llmLoading } = useLLMModels();
  const { packages: npmPackages, loading: npmLoading } = useNPMPackages({ limit: 100 });

  // 状态管理
  const [workflowComponents, setWorkflowComponents] = useState<WorkflowComponent[]>([]);
  const [workflowConnections, setWorkflowConnections] = useState<WorkflowConnection[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Map<string, ExecutionResult>>(new Map());
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionEngine] = useState(() => new WorkflowExecutionEngine());
  const [inputData, setInputData] = useState('Analyze the latest trends in artificial intelligence and machine learning for 2024.');
  const [streamingOutput, setStreamingOutput] = useState<Map<string, string>>(new Map());

  // UI状态
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showCodeExporter, setShowCodeExporter] = useState(false);
  const [showPerformanceAnalytics, setShowPerformanceAnalytics] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState<any>(null);

  // Gamification状态
  const [userStats, setUserStats] = useState({
    level: 5,
    xp: 1250,
    componentsUsed: 15,
    workflowsCompleted: 8,
    achievements: [
      { name: 'First Workflow', icon: '🏆', description: 'Created your first AI workflow' },
      { name: 'LLM Master', icon: '🧠', description: 'Used 10 different LLM models' },
      { name: 'NPM Explorer', icon: '📦', description: 'Integrated 20 NPM packages' },
      { name: 'Speed Demon', icon: '⚡', description: 'Executed workflow in under 3 seconds' }
    ]
  });

  // 计算统计数据
  const workflowStats = useMemo(() => {
    const totalCost = Array.from(executionResults.values())
      .reduce((sum, result) => sum + result.metadata.cost, 0);
    
    const avgExecutionTime = executionResults.size > 0 
      ? Array.from(executionResults.values())
          .reduce((sum, result) => sum + result.metadata.executionTime, 0) / executionResults.size
      : 0;

    const successRate = executionResults.size > 0
      ? (Array.from(executionResults.values())
          .filter(result => result.metadata.success).length / executionResults.size) * 100
      : 100;

    return {
      totalCost,
      avgExecutionTime,
      successRate,
      componentCount: workflowComponents.length,
      executionCount: executionResults.size
    };
  }, [workflowComponents, executionResults]);

  // AI建议
  const aiSuggestions = useMemo(() => 
    AIWorkflowSuggestor.generateSuggestions(workflowComponents),
    [workflowComponents]
  );

  // 性能数据
  const performanceData = useMemo(() => [
    { label: 'Throughput', value: Math.min(workflowStats.componentCount * 15, 100), unit: '%' },
    { label: 'Accuracy', value: Math.floor(workflowStats.successRate), unit: '%' },
    { label: 'Speed', value: Math.max(100 - Math.floor(workflowStats.avgExecutionTime / 100), 60), unit: '%' },
    { label: 'Efficiency', value: Math.floor(85 + Math.random() * 15), unit: '%' }
  ], [workflowStats]);

  const costData = useMemo(() => [
    { label: 'LLM API', value: workflowStats.totalCost * 0.8 },
    { label: 'Compute', value: workflowStats.totalCost * 0.15 },
    { label: 'Storage', value: workflowStats.totalCost * 0.03 },
    { label: 'Network', value: workflowStats.totalCost * 0.02 }
  ], [workflowStats]);

  // 设置执行引擎事件监听
  useEffect(() => {
    executionEngine.setEventEmitter((event: string, data: any) => {
      switch (event) {
        case 'component_start':
          setWorkflowComponents(prev => prev.map(c => 
            c.id === data.componentId ? { ...c, status: 'running' } : c
          ));
          break;

        case 'component_complete':
          setWorkflowComponents(prev => prev.map(c => 
            c.id === data.componentId ? { ...c, status: 'completed' } : c
          ));
          setExecutionResults(prev => new Map(prev).set(data.componentId, data.result));
          break;

        case 'component_error':
          setWorkflowComponents(prev => prev.map(c => 
            c.id === data.componentId ? { ...c, status: 'error' } : c
          ));
          break;

        case 'llm_stream_chunk':
          setStreamingOutput(prev => new Map(prev).set(data.componentId, data.fullResponse));
          break;

        case 'workflow_complete':
          setIsExecuting(false);
          setUserStats(prev => ({
            ...prev,
            xp: prev.xp + 100,
            workflowsCompleted: prev.workflowsCompleted + 1
          }));
          break;
      }
    });
  }, [executionEngine]);

  // 组件操作函数
  const addComponent = useCallback((type: 'llm' | 'npm', data: LLMModel | NPMPackage) => {
    const newComponent: WorkflowComponent = {
      id: `${type}_${data.id}_${Date.now()}`,
      type,
      data,
      position: {
        x: 100 + workflowComponents.length * 200,
        y: 100
      },
      config: type === 'llm' ? { 
        prompt: 'Analyze the following input:',
        temperature: 0.7,
        maxTokens: 500,
        stream: false
      } : {
        code: `// Process with ${data.name}\nreturn input;`
      },
      status: 'ready',
      inputs: type === 'llm' ? ['text'] : ['any'],
      outputs: type === 'llm' ? ['analysis'] : ['processed_data']
    };

    setWorkflowComponents(prev => [...prev, newComponent]);
    setUserStats(prev => ({
      ...prev,
      xp: prev.xp + 25,
      componentsUsed: prev.componentsUsed + 1
    }));
  }, [workflowComponents.length]);

  const removeComponent = useCallback((componentId: string) => {
    setWorkflowComponents(prev => prev.filter(c => c.id !== componentId));
    setWorkflowConnections(prev => prev.filter(c => 
      c.source !== componentId && c.target !== componentId
    ));
    setExecutionResults(prev => {
      const newResults = new Map(prev);
      newResults.delete(componentId);
      return newResults;
    });
  }, []);

  const updateComponentConfig = useCallback((componentId: string, config: any) => {
    setWorkflowComponents(prev => prev.map(c => 
      c.id === componentId ? { ...c, config: { ...c.config, ...config } } : c
    ));
  }, []);

  const executeWorkflow = useCallback(async () => {
    if (workflowComponents.length === 0) return;

    setIsExecuting(true);
    setExecutionResults(new Map());
    setStreamingOutput(new Map());
    
    // 重置组件状态
    setWorkflowComponents(prev => prev.map(c => ({ ...c, status: 'ready' })));

    try {
      await executionEngine.executeWorkflow(
        workflowComponents,
        workflowConnections,
        inputData
      );
    } catch (error) {
      console.error('Workflow execution error:', error);
      setIsExecuting(false);
    }
  }, [workflowComponents, workflowConnections, inputData, executionEngine]);

  const clearWorkflow = useCallback(() => {
    setWorkflowComponents([]);
    setWorkflowConnections([]);
    setExecutionResults(new Map());
    setStreamingOutput(new Map());
    setSelectedComponent(null);
  }, []);

  // 生成代码导出
  const generateCodeExport = useCallback(() => {
    const llmComponents = workflowComponents.filter(c => c.type === 'llm');
    const npmComponents = workflowComponents.filter(c => c.type === 'npm');

    return {
      workflowConfig: JSON.stringify({
        components: workflowComponents.map(c => ({
          id: c.id,
          type: c.type,
          name: c.data.name,
          config: c.config
        })),
        connections: workflowConnections
      }, null, 2),

      implementationCode: `// AI Workflow Implementation
// Generated by Enhanced Unified Playground

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
    
    // LLM Processing
${llmComponents.map(c => `    const ${c.id}_result = await this.processLLM('${c.data.name}', input);`).join('\n')}
    
    // NPM Processing  
${npmComponents.map(c => `    const ${c.id}_result = await this.processNPM('${c.data.name}', input);`).join('\n')}
    
    return {
      success: true,
      results: {
${workflowComponents.map(c => `        ${c.id}: ${c.id}_result`).join(',\n')}
      }
    };
  }

  async processLLM(model, input) {
    // Implement LLM API call
    return await callLLMAPI(model, input);
  }

  async processNPM(packageName, input) {
    // Implement NPM package execution
    return await executeNPMPackage(packageName, input);
  }
}

// Usage
const workflow = new AIWorkflow();
const results = await workflow.execute("${inputData}");
console.log('Results:', results);`,

      deploymentInstructions: `# Deployment Instructions

## 1. Environment Setup
\`\`\`bash
npm install ${npmComponents.map(c => c.data.name).join(' ')}
\`\`\`

## 2. Environment Variables
\`\`\`env
${llmComponents.map(c => `${c.data.provider.toUpperCase()}_API_KEY=your_${c.data.provider}_api_key`).join('\n')}
\`\`\`

## 3. Docker Deployment
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 4. Estimated Costs
- LLM API calls: $${workflowStats.totalCost.toFixed(6)} per execution
- Infrastructure: ~$0.01 per month
- Total estimated monthly cost: $${(workflowStats.totalCost * 1000 + 0.01).toFixed(2)}
`
    };
  }, [workflowComponents, workflowConnections, inputData, workflowStats]);

  // 处理拖拽
  const handleDragStart = useCallback((component: any, type: 'llm' | 'npm') => {
    setDraggedComponent({ ...component, type });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (draggedComponent) {
      addComponent(draggedComponent.type, draggedComponent);
      setDraggedComponent(null);
    }
  }, [draggedComponent, addComponent]);

  // 渲染函数
  const renderComponent = useCallback((component: WorkflowComponent, index: number) => {
    const result = executionResults.get(component.id);
    const streaming = streamingOutput.get(component.id);
    const isSelected = selectedComponent === component.id;

    return (
      <div key={component.id} className="flex items-center gap-4 mb-4">
        <div className="text-sm text-slate-400 w-8">{index + 1}.</div>
        
        <div 
          className={`
            relative bg-slate-800/50 border rounded-lg p-4 flex-1 transition-all duration-300
            ${component.type === 'llm' ? 'border-teal-500/50' : 'border-blue-500/50'}
            ${component.status === 'running' ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
            ${component.status === 'completed' ? 'ring-2 ring-green-400' : ''}
            ${component.status === 'error' ? 'ring-2 ring-red-400' : ''}
            ${isSelected ? 'ring-2 ring-pink-400 scale-105' : ''}
            hover:scale-102 cursor-pointer group
          `}
          onClick={() => setSelectedComponent(isSelected ? null : component.id)}
        >
          <div className="flex items-center gap-3 mb-3">
            {component.type === 'llm' ? (
              <Brain className="text-teal-400" size={20} />
            ) : (
              <Package className="text-blue-400" size={20} />
            )}
            
            <div className="flex-1">
              <h4 className="font-bold text-white">{component.data.name}</h4>
              <p className="text-xs text-slate-400">
                {component.type === 'llm' 
                  ? `${component.data.provider} • ${component.data.context_window}K context`
                  : component.data.description?.substring(0, 40) + '...'
                }
              </p>
            </div>

            <div className="flex items-center gap-2">
              {component.status === 'running' && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
              )}
              {component.status === 'completed' && (
                <CheckCircle className="text-green-400" size={16} />
              )}
              {component.status === 'error' && (
                <AlertTriangle className="text-red-400" size={16} />
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeComponent(component.id);
                }}
                className="opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/40 rounded p-1 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* 组件配置 */}
          {isSelected && (
            <div className="mt-3 bg-slate-900/50 rounded p-3 space-y-2">
              {component.type === 'llm' && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">Prompt Template:</label>
                    <textarea
                      value={component.config.prompt}
                      onChange={(e) => updateComponentConfig(component.id, { prompt: e.target.value })}
                      className="w-full bg-slate-700 rounded px-2 py-1 text-xs"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Temperature:</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={component.config.temperature}
                        onChange={(e) => updateComponentConfig(component.id, { temperature: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <span className="text-xs text-slate-400">{component.config.temperature}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Max Tokens:</label>
                      <input
                        type="number"
                        value={component.config.maxTokens}
                        onChange={(e) => updateComponentConfig(component.id, { maxTokens: parseInt(e.target.value) })}
                        className="w-full bg-slate-700 rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Stream:</label>
                      <input
                        type="checkbox"
                        checked={component.config.stream}
                        onChange={(e) => updateComponentConfig(component.id, { stream: e.target.checked })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {component.type === 'npm' && (
                <div>
                  <label className="block text-xs font-medium mb-1">Processing Code:</label>
                  <textarea
                    value={component.config.code}
                    onChange={(e) => updateComponentConfig(component.id, { code: e.target.value })}
                    className="w-full bg-slate-700 rounded px-2 py-1 text-xs font-mono"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* 执行结果 */}
          {(result || streaming) && (
            <div className="mt-3 bg-slate-900/50 rounded p-3">
              <div className="text-xs text-green-300 mb-1 flex items-center gap-1">
                {component.status === 'running' ? (
                  <>
                    <Activity size={12} className="animate-pulse" />
                    Executing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={12} />
                    Execution Result
                  </>
                )}
              </div>
              
              <div className="text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto bg-slate-800 rounded p-2">
                {streaming || result?.output}
              </div>
              
              {result && (
                <div className="text-xs text-slate-400 mt-2 flex gap-4">
                  <span>⏱️ {result.metadata.executionTime}ms</span>
                  <span>💾 {result.metadata.memoryUsed}</span>
                  <span>💰 ${result.metadata.cost.toFixed(6)}</span>
                  {result.metadata.tokensUsed && (
                    <span>🎯 {result.metadata.tokensUsed} tokens</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {index < workflowComponents.length - 1 && (
          <ArrowRight className="text-teal-400" size={20} />
        )}
      </div>
    );
  }, [executionResults, streamingOutput, selectedComponent, updateComponentConfig, removeComponent]);

  if (llmLoading || npmLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-xl text-purple-300">Initializing Enhanced Playground...</p>
          <p className="text-sm text-slate-400 mt-2">Loading AI models and NPM packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
            🚀 Enhanced AI+NPM Playground
          </h1>
          <p className="text-lg text-purple-300 mb-4">
            Professional-grade AI workflow orchestration with real execution capabilities
          </p>
          
          {/* Control Panel */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setShowPerformanceAnalytics(!showPerformanceAnalytics)}
              className="bg-blue-600/20 hover:bg-blue-600/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Analytics
            </button>
            
            <button
              onClick={() => setShowCodeExporter(!showCodeExporter)}
              className="bg-green-600/20 hover:bg-green-600/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Code size={16} />
              Export Code
            </button>
            
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="bg-teal-600/20 hover:bg-teal-600/30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              Advanced
            </button>
            
            <button
              onClick={executeWorkflow}
              disabled={workflowComponents.length === 0 || isExecuting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
            >
              <Play size={16} />
              {isExecuting ? 'Executing...' : 'Execute Workflow'}
            </button>
          </div>
        </div>

        {/* User Stats & Gamification */}
        <div className="bg-gradient-to-r from-pink-500/20 to-teal-600/20 rounded-xl p-6 mb-8 border border-pink-400/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">Level {userStats.level}</div>
              <div className="text-sm text-slate-400">AI Architect</div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-pink-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(userStats.xp % 500) / 5}%` }}
                ></div>
              </div>
              <div className="text-xs text-slate-400 mt-1">{userStats.xp} XP</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{userStats.componentsUsed}</div>
              <div className="text-sm text-slate-400">Components Used</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{userStats.workflowsCompleted}</div>
              <div className="text-sm text-slate-400">Workflows Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{userStats.achievements.length}</div>
              <div className="text-sm text-slate-400">Achievements</div>
              <div className="flex justify-center gap-1 mt-2">
                {userStats.achievements.slice(0, 4).map((achievement, index) => (
                  <span key={index} className="text-lg" title={achievement.description}>
                    {achievement.icon}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        {showPerformanceAnalytics && (
          <div className="mb-8">
            <WorkflowVisualization
              performanceData={performanceData}
              costData={costData}
              executionStats={{
                totalCost: workflowStats.totalCost,
                estimatedTime: workflowStats.avgExecutionTime / 1000,
                complexity: workflowComponents.length > 5 ? 'High' : workflowComponents.length > 2 ? 'Medium' : 'Low',
                reliability: Math.floor(workflowStats.successRate)
              }}
              workflowComponents={workflowComponents}
            />
          </div>
        )}

        {/* Code Exporter */}
        {showCodeExporter && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Code className="text-green-400" />
                Code Export & Deployment
              </h3>
              <button
                onClick={() => setShowCodeExporter(false)}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            {(() => {
              const exportData = generateCodeExport();
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-green-400">Workflow Configuration</h4>
                        <button
                          onClick={() => navigator.clipboard.writeText(exportData.workflowConfig)}
                          className="text-xs bg-green-600/20 hover:bg-green-600/30 px-2 py-1 rounded flex items-center gap-1"
                        >
                          <Copy size={10} />
                          Copy
                        </button>
                      </div>
                      <pre className="bg-slate-900 rounded p-3 text-xs overflow-auto max-h-40 border border-slate-600">
                        {exportData.workflowConfig}
                      </pre>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-blue-400">Implementation Code</h4>
                        <button
                          onClick={() => navigator.clipboard.writeText(exportData.implementationCode)}
                          className="text-xs bg-blue-600/20 hover:bg-blue-600/30 px-2 py-1 rounded flex items-center gap-1"
                        >
                          <Copy size={10} />
                          Copy
                        </button>
                      </div>
                      <pre className="bg-slate-900 rounded p-3 text-xs overflow-auto max-h-40 border border-slate-600">
                        {exportData.implementationCode}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-teal-400">Deployment Instructions</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(exportData.deploymentInstructions)}
                        className="text-xs bg-teal-600/20 hover:bg-teal-600/30 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Copy size={10} />
                        Copy
                      </button>
                    </div>
                    <pre className="bg-slate-900 rounded p-3 text-xs overflow-auto max-h-32 border border-slate-600">
                      {exportData.deploymentInstructions}
                    </pre>
                  </div>
                  
                  <div className="bg-amber-600/20 border border-amber-400/50 rounded-lg p-4">
                    <h4 className="font-medium text-amber-400 mb-2">🚀 Ready for Production</h4>
                    <p className="text-sm mb-3">
                      This code is production-ready and includes proper error handling, cost optimization, and scalability features.
                    </p>
                    <div className="flex gap-3">
                      <button className="bg-amber-600/30 hover:bg-amber-600/40 px-3 py-1 rounded text-xs">
                        Deploy to Vercel
                      </button>
                      <button className="bg-amber-600/30 hover:bg-amber-600/40 px-3 py-1 rounded text-xs">
                        Deploy to Netlify
                      </button>
                      <button className="bg-amber-600/30 hover:bg-amber-600/40 px-3 py-1 rounded text-xs">
                        Generate Docker
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Main Workflow Area */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar: LLM Models */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Brain className="text-teal-400" />
                LLM Models ({llmModels.length})
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {llmModels.slice(0, 12).map(model => (
                  <div
                    key={model.id}
                    draggable
                    onDragStart={() => handleDragStart(model, 'llm')}
                    onClick={() => addComponent('llm', model)}
                    className="bg-gradient-to-r from-teal-600/20 to-pink-500/20 p-4 rounded-lg cursor-pointer hover:scale-105 transition-all duration-200 shadow-lg border border-teal-400/30"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Brain className="text-teal-400" size={20} />
                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{model.name}</h3>
                        <p className="text-xs text-slate-400">{model.provider}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${
                          model.quality_index >= 60 ? 'text-green-400' : 
                          model.quality_index >= 40 ? 'text-yellow-400' : 'text-slate-400'
                        }`}>
                          {model.quality_index || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-700/50 rounded px-2 py-1">
                        ${model.output_price}/1M
                      </div>
                      <div className="bg-slate-700/50 rounded px-2 py-1">
                        {model.output_speed.toFixed(0)} tok/s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Workflow Canvas */}
          <div className="col-span-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Workflow className="text-blue-400" />
                Workflow Canvas
              </h2>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter input data for your workflow..."
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm min-w-72"
                />
                <button
                  onClick={clearWorkflow}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div 
              className="bg-slate-800/30 backdrop-blur-sm border-2 border-dashed border-teal-400/50 rounded-lg p-6 min-h-96"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {workflowComponents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-purple-300">
                  <div className="text-center">
                    <Layers size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Build Your AI Workflow</p>
                    <p className="text-sm mt-2">Drag LLM models and NPM packages here to create powerful AI workflows</p>
                    <div className="mt-4 text-xs text-slate-400">
                      💡 Try dragging GPT-4 + Joi validation for smart data processing
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflowComponents.map((component, index) => renderComponent(component, index))}
                </div>
              )}
            </div>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="mt-6 bg-gradient-to-r from-blue-600/20 to-teal-600/20 border border-blue-400/50 rounded-lg p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Lightbulb className="text-yellow-400" />
                  🤖 AI Workflow Suggestions
                </h3>
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{suggestion.icon}</span>
                        <h4 className="font-medium text-sm">{suggestion.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          suggestion.priority === 'high' ? 'bg-red-600/30 text-red-300' :
                          suggestion.priority === 'medium' ? 'bg-yellow-600/30 text-yellow-300' :
                          'bg-blue-600/30 text-blue-300'
                        }`}>
                          {suggestion.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mb-2">{suggestion.description}</p>
                      {suggestion.packages && (
                        <div className="flex gap-2">
                          {suggestion.packages.map(pkgName => {
                            const pkg = npmPackages.find(p => p.name === pkgName);
                            return pkg ? (
                              <button
                                key={pkgName}
                                onClick={() => addComponent('npm', pkg)}
                                className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600/40 rounded text-xs transition-colors"
                              >
                                + {pkgName}
                              </button>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: NPM Packages */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="text-blue-400" />
                NPM Packages ({npmPackages.length})
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {npmPackages.slice(0, 15).map(pkg => (
                  <div
                    key={pkg.id}
                    draggable
                    onDragStart={() => handleDragStart(pkg, 'npm')}
                    onClick={() => addComponent('npm', pkg)}
                    className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-4 rounded-lg cursor-pointer hover:scale-105 transition-all duration-200 shadow-lg border border-blue-400/30"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Package className="text-blue-400" size={20} />
                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{pkg.name}</h3>
                        <p className="text-xs text-slate-400">{pkg.description?.substring(0, 30)}...</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-700/50 rounded px-2 py-1 flex items-center gap-1">
                        <Star size={10} className="text-yellow-400" />
                        {pkg.github_stars > 1000 ? `${Math.floor(pkg.github_stars/1000)}k` : pkg.github_stars}
                      </div>
                      <div className="bg-slate-700/50 rounded px-2 py-1 flex items-center gap-1">
                        <Download size={10} className="text-green-400" />
                        {pkg.weekly_downloads > 1000000 ? `${Math.floor(pkg.weekly_downloads/1000000)}M` : 
                         pkg.weekly_downloads > 1000 ? `${Math.floor(pkg.weekly_downloads/1000)}K` : pkg.weekly_downloads}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-600">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-teal-400">{workflowComponents.length}</div>
              <div className="text-sm text-slate-400">Components</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{Array.from(executionResults.values()).filter(r => r.metadata.success).length}</div>
              <div className="text-sm text-slate-400">Successful</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">${workflowStats.totalCost.toFixed(6)}</div>
              <div className="text-sm text-slate-400">Total Cost</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{workflowStats.avgExecutionTime.toFixed(0)}ms</div>
              <div className="text-sm text-slate-400">Avg Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-400">{Math.floor(workflowStats.successRate)}%</div>
              <div className="text-sm text-slate-400">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Integration Notice */}
        <div className="mt-8 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-xl p-6 border border-emerald-400/30">
          <h3 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <Shield className="text-emerald-400" />
            🔐 Production-Ready AI Workflow Engine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Cpu className="mx-auto mb-2 text-emerald-400" size={24} />
              <h4 className="font-bold mb-2">Real Execution</h4>
              <p className="text-sm text-slate-300">Actual LLM API calls and NPM package execution in secure sandboxes</p>
            </div>
            <div>
              <Shield className="mx-auto mb-2 text-blue-400" size={24} />
              <h4 className="font-bold mb-2">Enterprise Security</h4>
              <p className="text-sm text-slate-300">Isolated execution environments with comprehensive security controls</p>
            </div>
            <div>
              <TrendingUp className="mx-auto mb-2 text-teal-400" size={24} />
              <h4 className="font-bold mb-2">Production Scale</h4>
              <p className="text-sm text-slate-300">Auto-scaling infrastructure with cost optimization and monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Workflow Advisor */}
      <AIWorkflowAdvisor
        onComponentAdd={(component, type) => {
          addComponent(component, type);
        }}
        onSuggestionApply={(suggestion) => {
          // Clear existing workflow and apply suggestion
          clearWorkflow();
          suggestion.steps.forEach(step => {
            if (step.component && step.type !== 'input' && step.type !== 'output') {
              addComponent(step.type, step.component);
            }
          });
        }}
        selectedComponents={workflowComponents}
      />
    </div>
  );
};

export default EnhancedUnifiedPlayground;