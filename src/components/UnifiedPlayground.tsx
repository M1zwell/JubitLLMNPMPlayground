import React, { useState, useEffect, useMemo } from 'react';
import { 
  Copy, Github, Calendar, Code, Terminal, Globe, RefreshCw, Save, Upload, 
  Layers, Target, Users, FileText, Image, Database, Mail, Lock, Filter, 
  Share2, TrendingUp, Award, Clock, DollarSign, Cpu, Eye, ExternalLink, 
  Shield, Activity, PieChart, LineChart, AreaChart, Gauge, AlertTriangle
} from 'lucide-react';
import { 
  BrainIcon, PackageIcon, WorkflowIcon, ChartIcon, SettingsIcon, 
  PlayIcon, PlusIcon, XIcon, CheckIcon, ArrowIcon, SearchIcon, 
  DownloadIcon, StarIcon, LightbulbIcon 
} from './ui/CustomIcons';
import { useLLMModels } from '../hooks/useLLMModels';
import { useNPMPackages } from '../hooks/useNPMPackages';
import { LLMModel, NPMPackage } from '../lib/supabase';

// 可视化图表组件
const PerformanceChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="surface-soft rounded-lg compact">
      <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
        <ChartIcon size="sm" className="text-slate-400" />
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs w-16 truncate text-slate-300">{item.label}</span>
            <div className="flex-1 bg-slate-700 rounded-full h-1.5">
              <div 
                className="bg-pink-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-slate-400 w-8 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkflowDiagram = ({ workflow, connections }) => {
  return (
    <div className="surface rounded-lg compact">
      <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
        <WorkflowIcon size="sm" className="text-slate-400" />
        Workflow Visualization
      </h3>
      <div className="relative">
        <svg className="w-full h-40" viewBox="0 0 800 160">
          {/* Draw workflow nodes */}
          {workflow.map((node, index) => (
            <g key={node.id}>
              {/* Node */}
              <rect
                x={100 + index * 120}
                y={60}
                width={80}
                height={40}
                rx={8}
                className={`fill-blue-600/30 stroke-blue-400 ${
                  node.status === 'running' ? 'animate-pulse' : 
                  node.status === 'completed' ? 'fill-green-600/30 stroke-green-400' : ''
                }`}
                strokeWidth="1.5"
              />
              {/* Node text */}
              <text
                x={140 + index * 120}
                y={85}
                textAnchor="middle"
                className="fill-slate-200 text-xs"
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
                  className="stroke-teal-400"
                  strokeWidth="1.5"
                  markerEnd="url(#arrowhead)"
                />
              )}
            </g>
          ))}
          
          {/* Arrow marker */}
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
                className="fill-teal-400"
              />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
};

const MetricsGauge = ({ value, max, label, color = 'blue' }) => {
  const percentage = (value / max) * 100;
  const strokeDasharray = `${percentage * 2.51} 251`;
  
  return (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 84 84">
          <circle
            cx="42"
            cy="42"
            r="40"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="42"
            cy="42"
            r="40"
            stroke={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#F59E0B'}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium">{value}</span>
        </div>
      </div>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
};

// Gamification系统
const GamificationSystem = ({ level, xp, achievements }) => {
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000];
  const currentLevelXP = levelThresholds[level] || 0;
  const nextLevelXP = levelThresholds[level + 1] || levelThresholds[levelThresholds.length - 1];
  const progressPercentage = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  const levelTitles = [
    'Novice Coder', 'Function Explorer', 'Workflow Builder', 'Integration Master',
    'AI Whisperer', 'Automation Guru', 'Code Architect', 'Digital Sage'
  ];

  return (
    <div className="surface-soft rounded-lg compact border-l-2 border-pink-400">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-base">{levelTitles[level] || 'Digital God'}</h3>
          <p className="text-xs text-slate-400">Level {level + 1} • {xp} XP</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium text-amber-400">{achievements.length}</div>
          <div className="text-xs text-slate-400">Achievements</div>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-2">
          <span>Progress to Next Level</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="bg-slate-700 rounded-full h-1.5">
          <div 
            className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {achievements.slice(0, 6).map((achievement, index) => (
          <span 
            key={index} 
            className="bg-amber-500/20 px-2 py-1 rounded-md text-xs flex items-center gap-1"
            title={achievement.description}
          >
            <Award size={12} />
            {achievement.name}
          </span>
        ))}
      </div>
    </div>
  );
};

// 主组件
const UnifiedPlayground = () => {
  const { models: llmModels, loading: llmLoading } = useLLMModels();
  const { packages: npmPackages, loading: npmLoading } = useNPMPackages({ limit: 100 });
  
  // 状态管理
  const [workflowComponents, setWorkflowComponents] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState({ llm: null, npm: [] });
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState({});
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [inputText, setInputText] = useState('Analyze this document about machine learning trends in 2024...');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showPromptExporter, setShowPromptExporter] = useState(false);
  
  // Gamification状态
  const [userLevel, setUserLevel] = useState(2);
  const [userXP, setUserXP] = useState(450);
  const [achievements, setAchievements] = useState([
    { name: 'First Combo', description: 'Created your first LLM+NPM combination' },
    { name: 'Data Master', description: 'Used 5 different data processing packages' },
    { name: 'Speed Runner', description: 'Executed workflow in under 5 seconds' }
  ]);

  // 可用组件
  const availableLLMs = llmModels.slice(0, 12);
  const availableNPMs = npmPackages.filter(pkg => 
    ['axios', 'lodash', 'joi', 'sharp', 'pdf-parse', 'bcrypt', 'uuid', 'dayjs', 'nodemailer', 'validator'].includes(pkg.name)
  );

  // 性能分析数据
  const performanceData = useMemo(() => [
    { label: 'Throughput', value: workflowComponents.length * 15 + 45 },
    { label: 'Accuracy', value: 92 },
    { label: 'Speed', value: 88 },
    { label: 'Efficiency', value: 94 }
  ], [workflowComponents]);

  const costAnalysisData = useMemo(() => [
    { label: 'LLM API', value: workflowComponents.filter(c => c.type === 'llm').length * 0.02 },
    { label: 'Compute', value: workflowComponents.length * 0.005 },
    { label: 'Storage', value: 0.001 },
    { label: 'Bandwidth', value: 0.003 }
  ], [workflowComponents]);

  // 添加组件到工作流
  const addComponent = (component, type) => {
    const newComponent = {
      id: `${type}_${component.id}_${Date.now()}`,
      type,
      data: component,
      step: workflowComponents.length + 1,
      status: 'ready',
      config: {}
    };
    
    setWorkflowComponents(prev => [...prev, newComponent]);
    generateAISuggestions([...workflowComponents, newComponent]);
    
    // XP奖励
    setUserXP(prev => prev + 10);
    
    // 检查成就
    if (workflowComponents.length === 0) {
      unlockAchievement('First Step', 'Added your first component to the workflow');
    }
  };

  const removeComponent = (componentId) => {
    setWorkflowComponents(prev => prev.filter(c => c.id !== componentId));
  };

  const unlockAchievement = (name, description) => {
    if (!achievements.find(a => a.name === name)) {
      setAchievements(prev => [...prev, { name, description }]);
      setUserXP(prev => prev + 50);
      
      // 显示成就通知
      setTimeout(() => {
        // 这里可以添加成就通知动画
      }, 100);
    }
  };

  // AI建议生成
  const generateAISuggestions = (components) => {
    const suggestions = [];
    
    if (components.length === 0) {
      suggestions.push({
        type: 'getting-started',
        title: 'Start with an LLM',
        description: 'Add a reasoning model like GPT-4o or Claude for text analysis',
        priority: 'high',
        components: availableLLMs.slice(0, 3)
      });
    } else {
      const hasLLM = components.some(c => c.type === 'llm');
      const hasDataProcessing = components.some(c => 
        c.type === 'npm' && ['joi', 'validator', 'lodash'].includes(c.data.name)
      );
      
      if (hasLLM && !hasDataProcessing) {
        suggestions.push({
          type: 'validation',
          title: 'Add data validation',
          description: 'Validate and clean LLM outputs with joi or validator',
          priority: 'medium',
          components: availableNPMs.filter(pkg => ['joi', 'validator'].includes(pkg.name))
        });
      }
      
      if (components.length >= 2) {
        suggestions.push({
          type: 'output',
          title: 'Add output formatting',
          description: 'Format results for delivery via email or file export',
          priority: 'low',
          components: availableNPMs.filter(pkg => ['nodemailer', 'pdf-lib'].includes(pkg.name))
        });
      }
    }
    
    setAiSuggestions(suggestions);
  };

  // 执行工作流
  const executeWorkflow = async () => {
    if (workflowComponents.length === 0) return;
    
    setIsExecuting(true);
    const results = {};
    
    for (let i = 0; i < workflowComponents.length; i++) {
      const component = workflowComponents[i];
      
      // 更新状态为运行中
      setWorkflowComponents(prev => prev.map(c => 
        c.id === component.id ? { ...c, status: 'running' } : c
      ));
      
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 生成模拟结果
      const result = await generateExecutionResult(component, inputText);
      results[component.id] = result;
      setExecutionResults(prev => ({ ...prev, [component.id]: result }));
      
      // 更新状态为完成
      setWorkflowComponents(prev => prev.map(c => 
        c.id === component.id ? { ...c, status: 'completed' } : c
      ));
    }
    
    setIsExecuting(false);
    setUserXP(prev => prev + 100);
    unlockAchievement('Executor', 'Successfully executed a complete workflow');
  };

  // 生成执行结果
  const generateExecutionResult = async (component, input) => {
    if (component.type === 'llm') {
      const model = component.data;
      return {
        type: 'llm_response',
        output: `🧠 ${model.name} Analysis:\n\n` +
                `Input analyzed: "${input.substring(0, 50)}..."\n\n` +
                `Key insights:\n` +
                `• Detected ${Math.floor(Math.random() * 5) + 3} main topics\n` +
                `• Sentiment: ${['Positive', 'Neutral', 'Mixed'][Math.floor(Math.random() * 3)]}\n` +
                `• Complexity: ${['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]}\n` +
                `• Confidence: ${85 + Math.floor(Math.random() * 15)}%`,
        metadata: {
          model: model.name,
          tokens_used: Math.floor(Math.random() * 1000) + 500,
          processing_time: Math.floor(Math.random() * 2000) + 800,
          cost: (model.output_price / 1000000) * (Math.floor(Math.random() * 1000) + 500)
        }
      };
    } else if (component.type === 'npm') {
      const pkg = component.data;
      return {
        type: 'npm_processing',
        output: `📦 ${pkg.name} Processing Result:\n\n` +
                generateNPMOutput(pkg.name, input),
        metadata: {
          package: pkg.name,
          version: pkg.version,
          processing_time: Math.floor(Math.random() * 1000) + 200,
          memory_used: Math.floor(Math.random() * 50) + 10
        }
      };
    }
  };

  const generateNPMOutput = (packageName, input) => {
    const outputs = {
      'axios': `✅ HTTP request completed successfully\n• Status: 200 OK\n• Response time: 245ms\n• Data size: 2.3KB`,
      'joi': `✅ Validation completed\n• Valid fields: 15/17\n• Errors found: 2\n• Validation score: 88%`,
      'lodash': `✅ Data transformation completed\n• Objects processed: 156\n• Operations: map, filter, reduce\n• Performance: Optimized`,
      'sharp': `✅ Image processing completed\n• Resolution: 1920x1080 → 800x600\n• Size: 2.4MB → 847KB\n• Format: PNG → WebP`,
      'bcrypt': `✅ Password hashing completed\n• Passwords processed: 5\n• Salt rounds: 12\n• Security level: High`,
      'uuid': `✅ UUID generation completed\n• IDs generated: 10\n• Format: v4 (random)\n• Uniqueness: Guaranteed`,
      'dayjs': `✅ Date processing completed\n• Dates formatted: 25\n• Timezone: UTC\n• Locale: en-US`,
      'validator': `✅ String validation completed\n• Emails validated: 8 (6 valid)\n• URLs checked: 12 (11 valid)\n• Success rate: 89%`
    };
    
    return outputs[packageName] || `✅ Processing completed\n• Input processed successfully\n• Output generated\n• Status: OK`;
  };

  // 生成Context和Prompts
  const generateSystemPrompts = () => {
    const llmComponents = workflowComponents.filter(c => c.type === 'llm');
    const npmComponents = workflowComponents.filter(c => c.type === 'npm');
    
    return {
      systemPrompt: `# AI Workflow System Prompt

## Workflow Configuration
You are an AI workflow execution engine with the following components:

### LLM Models:
${llmComponents.map(c => `- ${c.data.name} (${c.data.provider}): ${c.data.description || 'Advanced language model'}`).join('\n')}

### NPM Packages:
${npmComponents.map(c => `- ${c.data.name}: ${c.data.description || 'Processing package'}`).join('\n')}

## Execution Flow:
${workflowComponents.map((c, i) => `${i + 1}. ${c.type === 'llm' ? '🧠' : '📦'} ${c.data.name} - ${c.type === 'llm' ? 'Analysis' : 'Processing'}`).join('\n')}

## Instructions:
1. Process input through each component sequentially
2. Maintain context and data flow between components
3. Provide detailed analysis and processing results
4. Ensure data validation and quality control
5. Generate comprehensive output with metrics

## Quality Standards:
- Accuracy: >90%
- Performance: <5s total processing time
- Reliability: 99.5% uptime
- Security: Enterprise-grade encryption`,

      executionPrompt: `# Execution Instructions

## Input Processing:
\`\`\`
Input: "${inputText}"
\`\`\`

## Step-by-Step Execution:
${workflowComponents.map((c, i) => `
### Step ${i + 1}: ${c.data.name}
**Type**: ${c.type === 'llm' ? 'LLM Analysis' : 'NPM Processing'}
**Purpose**: ${c.type === 'llm' ? `Analyze content using ${c.data.name}` : `Process data with ${c.data.name}`}
**Expected Output**: ${c.type === 'llm' ? 'Structured analysis with insights' : 'Processed data with metadata'}
**Success Criteria**: ${c.type === 'llm' ? 'Confidence >85%' : 'No processing errors'}
`).join('')}

## Final Output Requirements:
- Comprehensive analysis report
- Performance metrics
- Quality indicators
- Actionable insights
- Error handling results`,

      implementationCode: `// Complete Workflow Implementation

class AIWorkflowEngine {
  constructor() {
    this.components = ${JSON.stringify(workflowComponents.map(c => ({
      id: c.id,
      type: c.type,
      name: c.data.name,
      config: c.config
    })), null, 2)};
    this.results = {};
  }

  async executeWorkflow(input) {
    console.log('🚀 Starting workflow execution...');
    
    for (const component of this.components) {
      try {
        const result = await this.executeComponent(component, input);
        this.results[component.id] = result;
        console.log(\`✅ \${component.name} completed\`);
      } catch (error) {
        console.error(\`❌ \${component.name} failed:, error\`);
        throw error;
      }
    }
    
    return this.generateFinalReport();
  }

  async executeComponent(component, input) {
    if (component.type === 'llm') {
      return await this.executeLLM(component, input);
    } else if (component.type === 'npm') {
      return await this.executeNPM(component, input);
    }
  }

  async executeLLM(component, input) {
    // LLM API call implementation
    const response = await fetch('/api/llm/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: component.name,
        input: input,
        config: component.config
      })
    });
    
    return await response.json();
  }

  async executeNPM(component, input) {
    // NPM package execution
    const { default: package } = await import(component.name);
    return await package.process(input, component.config);
  }

  generateFinalReport() {
    return {
      workflow_id: 'wf_' + Date.now(),
      execution_time: Date.now(),
      components_executed: this.components.length,
      results: this.results,
      performance_metrics: this.calculateMetrics(),
      status: 'completed'
    };
  }
}

// Usage
const workflow = new AIWorkflowEngine();
const results = await workflow.executeWorkflow("${inputText}");
console.log('📊 Workflow Results:', results);`
    };
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // 显示复制成功提示
  };

  if (llmLoading || npmLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-xl text-purple-300">Initializing Unified Playground...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto p-4">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">
            🎮 Unified AI+NPM Playground
          </h1>
          <p className="text-sm text-slate-400 mb-4 text-balance">
            Drag LLM models + NPM packages to create powerful AI workflows • Real-time execution • AI suggestions
          </p>
          
          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="btn-secondary flex items-center gap-2"
            >
              <ChartIcon size="sm" />
              Analytics
            </button>
            <button
              onClick={() => setShowPromptExporter(!showPromptExporter)}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText size={16} />
              Export Context
            </button>
            <button
              onClick={executeWorkflow}
              disabled={workflowComponents.length === 0 || isExecuting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <PlayIcon size="sm" />
              {isExecuting ? 'Executing...' : 'Execute Workflow'}
            </button>
          </div>
        </div>

        {/* Gamification Panel */}
        <div className="mb-6">
          <GamificationSystem 
            level={userLevel} 
            xp={userXP} 
            achievements={achievements} 
          />
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 animate-slide-up">
            <PerformanceChart data={performanceData} title="Performance Metrics" />
            <WorkflowDiagram workflow={workflowComponents} connections={[]} />
            <div className="space-y-4">
              <div className="surface-soft rounded-lg compact">
                <h3 className="font-medium text-sm mb-3">Real-time Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <MetricsGauge value={performanceData[0]?.value || 0} max={100} label="Throughput" color="blue" />
                  <MetricsGauge value={performanceData[1]?.value || 0} max={100} label="Accuracy" color="green" />
                </div>
              </div>
              <div className="surface-soft rounded-lg compact">
                <h3 className="font-medium text-sm mb-2">Cost Analysis</h3>
                <div className="text-xl font-medium text-amber-400 mb-1">
                  ${costAnalysisData.reduce((sum, item) => sum + item.value, 0).toFixed(4)}
                </div>
                <p className="text-xs text-slate-400">Total execution cost</p>
              </div>
            </div>
          </div>
        )}

        {/* Context/Prompt Exporter */}
        {showPromptExporter && (
          <div className="glass rounded-lg p-4 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="text-emerald-400" size={18} />
                Generated Context & Prompts for AI Coding Tools
              </h3>
              <button
                onClick={() => setShowPromptExporter(false)}
                className="p-1 hover:bg-slate-700 rounded"
              >
                <XIcon size="sm" />
              </button>
            </div>
            
            {(() => {
              const prompts = generateSystemPrompts();
              return (
                <div className="space-y-6">
                  <div className="bg-slate-800/50 rounded-lg compact">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-emerald-400 text-sm">System Prompt</h4>
                      <button
                        onClick={() => copyToClipboard(prompts.systemPrompt)}
                        className="compact-sm bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-xs flex items-center gap-1"
                      >
                        <Copy size={10} />
                        Copy
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {prompts.systemPrompt}
                    </pre>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg compact">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-400 text-sm">Execution Instructions</h4>
                      <button
                        onClick={() => copyToClipboard(prompts.executionPrompt)}
                        className="compact-sm bg-blue-500/20 hover:bg-blue-500/30 rounded text-xs flex items-center gap-1"
                      >
                        <Copy size={10} />
                        Copy
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {prompts.executionPrompt}
                    </pre>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg compact">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-teal-400 text-sm">JavaScript Implementation</h4>
                      <button
                        onClick={() => copyToClipboard(prompts.implementationCode)}
                        className="compact-sm bg-teal-500/20 hover:bg-teal-500/30 rounded text-xs flex items-center gap-1"
                      >
                        <Copy size={10} />
                        Copy
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {prompts.implementationCode}
                    </pre>
                  </div>
                  
                  <div className="surface rounded-lg compact border-l-2 border-amber-500">
                    <h4 className="font-medium text-amber-400 mb-2 text-sm">🎯 Ready for AI Coding Tools</h4>
                    <p className="text-xs mb-3">
                      These prompts and code are optimized for use in Cursor, Claude Code, Windsurf, v0.dev, bolt.new, and other AI coding platforms.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['cursor', 'claude-code', 'windsurf', 'v0.dev', 'bolt.new', 'lovable'].map(tool => (
                        <span key={tool} className="bg-amber-500/20 compact-sm rounded text-xs">
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
          
          {/* Left: Available LLM Models */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <BrainIcon className="text-slate-400" />
                LLM Models
              </h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableLLMs.map(model => (
                  <div
                    key={model.id}
                    onClick={() => addComponent(model, 'llm')}
                    className="surface compact rounded-lg cursor-pointer hover:bg-slate-700 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <BrainIcon size="sm" className="text-pink-400" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{model.name}</h3>
                        <p className="text-xs text-slate-400">{model.provider}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${model.quality_index >= 60 ? 'text-emerald-400' : model.quality_index >= 40 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {model.quality_index || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-slate-700/50 rounded compact-sm">
                        ${model.output_price}
                      </div>
                      <div className="bg-slate-700/50 rounded compact-sm">
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
              <h2 className="text-lg font-medium flex items-center gap-2">
                <WorkflowIcon className="text-slate-400" />
                Workflow Canvas
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter test input..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="compact bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 text-sm min-w-48"
                />
                <button
                  onClick={() => setWorkflowComponents([])}
                  className="compact bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="surface border-2 border-dashed border-slate-600 rounded-lg p-4 min-h-80">
              {workflowComponents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <Layers size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Drag & Drop to Build Your AI Workflow</p>
                    <p className="text-sm mt-1">Combine LLM models with NPM packages for powerful automation</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {workflowComponents.map((component, index) => {
                    const result = executionResults[component.id];
                    const isLLM = component.type === 'llm';
                    
                    return (
                      <div key={component.id} className="flex items-center gap-3">
                        <div className="text-xs text-slate-400 w-6">{index + 1}.</div>
                        
                        <div className={`
                          ${isLLM ? 'surface border-l-2 border-pink-400' : 'surface border-l-2 border-blue-500'}
                          compact rounded-lg flex-1 group relative
                          ${component.status === 'running' ? 'animate-pulse ring-1 ring-amber-400' : ''}
                          ${component.status === 'completed' ? 'ring-1 ring-emerald-400' : ''}
                        `}>
                          <div className="flex items-center gap-2 mb-2">
                            {isLLM ? <BrainIcon size="sm" className="text-pink-400" /> : <PackageIcon size="sm" className="text-blue-400" />}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{component.data.name}</h4>
                                {component.packageData && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <StarIcon size="sm" className="text-amber-400" />
                                    <span>{formatNumber(component.packageData.github_stars)}</span>
                                    <span className="text-emerald-400 ml-1">{formatNumber(component.packageData.weekly_downloads)}/week</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">{isLLM ? component.data.provider : component.data.description?.substring(0, 40) + '...'}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {component.status === 'running' && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-slate-300"></div>
                              )}
                              {component.status === 'completed' && (
                                <CheckIcon className="text-emerald-400" size="sm" />
                              )}
                              <button
                                onClick={() => removeComponent(component.id)}
                                className="opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/40 rounded p-1 transition-all"
                              >
                                <XIcon size="sm" />
                              </button>
                            </div>
                          </div>
                          
                          {result && (
                            <div className="mt-2 bg-slate-800/50 rounded compact-sm">
                              <div className="text-xs text-emerald-300 mb-1 flex items-center gap-1">
                                <CheckIcon size="sm" />
                                Execution Result
                              </div>
                              <div className="text-xs font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                                {result.output}
                              </div>
                              <div className="text-xs text-slate-400 mt-1 flex gap-3">
                                {result.metadata.tokens_used && (
                                  <span>🎯 {result.metadata.tokens_used} tokens</span>
                                )}
                                <span>⏱️ {result.metadata.processing_time}ms</span>
                                {result.metadata.cost && (
                                  <span>💰 ${result.metadata.cost.toFixed(4)}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {index < workflowComponents.length - 1 && (
                          <ArrowIcon className="text-slate-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* AI建议 */}
            {aiSuggestions.length > 0 && (
              <div className="mt-4 surface rounded-lg compact border-l-2 border-amber-500">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
                  <LightbulbIcon className="text-amber-400" size="sm" />
                  🤖 AI Workflow Suggestions
                </h3>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="surface-soft rounded compact-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          suggestion.priority === 'high' ? 'bg-red-400' :
                          suggestion.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                        }`}></div>
                        <h4 className="font-medium text-sm">{suggestion.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300 mb-2">{suggestion.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.components.slice(0, 3).map((comp, idx) => (
                          <button
                            key={idx}
                            onClick={() => addComponent(comp, suggestion.type === 'getting-started' ? 'llm' : 'npm')}
                            className="compact-sm bg-amber-500/20 hover:bg-amber-500/30 rounded text-xs transition-colors flex items-center gap-1"
                          >
                            <PlusIcon size="sm" />
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

          {/* Right: Available NPM Packages */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <PackageIcon className="text-slate-400" />
                NPM Packages
              </h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableNPMs.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => addComponent(pkg, 'npm')}
                    className="surface compact rounded-lg cursor-pointer hover:bg-slate-700 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <PackageIcon size="sm" className="text-blue-400" />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{pkg.name}</h3>
                        <p className="text-xs text-slate-400">{pkg.description?.substring(0, 30)}...</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="bg-slate-700/50 rounded compact-sm text-center">
                        <StarIcon size="sm" className="inline mr-1" />
                        {pkg.github_stars > 1000 ? `${Math.floor(pkg.github_stars/1000)}k` : pkg.github_stars}
                      </div>
                      <div className="bg-slate-700/50 rounded compact-sm text-center">
                        <DownloadIcon size="sm" className="inline mr-1" />
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

        {/* 底部状态栏 */}
        <div className="mt-8 glass rounded-lg compact">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-medium text-pink-400">{workflowComponents.length}</div>
              <div className="text-xs text-slate-400">Components Added</div>
            </div>
            <div>
              <div className="text-lg font-medium text-emerald-400">
                {Object.keys(executionResults).length}
              </div>
              <div className="text-xs text-slate-400">Successfully Executed</div>
            </div>
            <div>
              <div className="text-lg font-medium text-amber-400">
                ${costAnalysisData.reduce((sum, item) => sum + item.value, 0).toFixed(4)}
              </div>
              <div className="text-xs text-slate-400">Total Cost</div>
            </div>
            <div>
              <div className="text-lg font-medium text-blue-400">
                {workflowComponents.length > 0 ? '< 5s' : '0s'}
              </div>
              <div className="text-xs text-slate-400">Est. Execution Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPlayground;