import React, { useState, useEffect } from 'react';
import { 
  Shuffle, Brain, FileText, Download, Database, Star, TrendingUp, 
  Zap, Target, Users, BarChart3, Clock, DollarSign, Lightbulb, 
  Settings, Eye, Code, Globe, Save, RefreshCw, Sparkles, Crown,
  AlertTriangle, CheckCircle, ArrowRight, Copy, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShakeUpAnalyzerProps {
  workflowCanvas: any[];
  onOptimizationApplied: (optimizedWorkflow: any[]) => void;
  onClose: () => void;
}

interface AnalysisReport {
  id: string;
  workflowAnalysis: {
    currentSetup: any;
    performanceScore: number;
    costEfficiency: number;
    complexity: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  shakeUpRecommendations: {
    priority: 'high' | 'medium' | 'low';
    type: string;
    title: string;
    description: string;
    impact: string;
    implementation: string[];
    expectedOutcome: string;
  }[];
  promptEngineering: {
    llmOptimization: {
      modelSelection: string;
      promptTemplate: string;
      contextStrategy: string;
      temperatureSettings: number;
      maxTokens: number;
    };
    chainOfThought: string[];
    fewShotExamples: any[];
  };
  contextEngineering: {
    dataPreprocessing: string[];
    contextWindow: {
      strategy: string;
      chunking: string;
      prioritization: string[];
    };
    memoryManagement: {
      shortTerm: string;
      longTerm: string;
      contextRetention: string[];
    };
  };
  executionPlan: {
    phases: {
      phase: number;
      title: string;
      duration: string;
      tasks: string[];
      dependencies: string[];
      successCriteria: string[];
    }[];
    timeline: string;
    resources: string[];
    risks: { risk: string; mitigation: string; }[];
  };
  exportMetadata: {
    createdAt: string;
    workflowId: string;
    version: string;
    author: string;
  };
}

const ShakeUpAnalyzer: React.FC<ShakeUpAnalyzerProps> = ({ 
  workflowCanvas, 
  onOptimizationApplied, 
  onClose 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportFormat, setExportFormat] = useState('json');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Start analysis
  const performShakeUpAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const report = generateComprehensiveAnalysis(workflowCanvas);
    setAnalysisReport(report);
    setIsAnalyzing(false);
  };

  // Generate comprehensive analysis
  const generateComprehensiveAnalysis = (workflow: any[]): AnalysisReport => {
    const llmBlocks = workflow.filter(b => b.type === 'llm');
    const npmBlocks = workflow.filter(b => b.type === 'npm');
    
    // Calculate performance metrics
    const totalCost = llmBlocks.reduce((sum, block) => {
      const pricing = block.price || { output: 1.0 };
      return sum + pricing.output * 0.001; // Simulate cost per 1K tokens
    }, 0);
    
    const performanceScore = Math.min(100, 
      (workflow.length * 15) + 
      (llmBlocks.length * 20) + 
      (npmBlocks.length * 10) +
      (workflow.length > 3 ? 25 : 0)
    );
    
    const costEfficiency = totalCost < 0.01 ? 95 : totalCost < 0.05 ? 80 : totalCost < 0.1 ? 65 : 45;
    
    // Generate analysis report
    return {
      id: `analysis_${Date.now()}`,
      workflowAnalysis: {
        currentSetup: {
          totalBlocks: workflow.length,
          llmModels: llmBlocks.length,
          npmPackages: npmBlocks.length,
          estimatedCost: totalCost,
          complexity: workflow.length <= 3 ? 'Simple' : workflow.length <= 6 ? 'Moderate' : 'Complex'
        },
        performanceScore,
        costEfficiency,
        complexity: workflow.length <= 3 ? 'Simple' : workflow.length <= 6 ? 'Moderate' : 'Complex',
        strengths: generateStrengths(workflow, llmBlocks, npmBlocks),
        weaknesses: generateWeaknesses(workflow, llmBlocks, npmBlocks),
        opportunities: generateOpportunities(workflow, llmBlocks, npmBlocks)
      },
      shakeUpRecommendations: generateShakeUpRecommendations(workflow, llmBlocks, npmBlocks),
      promptEngineering: generatePromptEngineering(llmBlocks),
      contextEngineering: generateContextEngineering(workflow),
      executionPlan: generateExecutionPlan(workflow),
      exportMetadata: {
        createdAt: new Date().toISOString(),
        workflowId: `workflow_${Date.now()}`,
        version: '1.0.0',
        author: 'AI Shake-Up Analyzer'
      }
    };
  };

  // Generate strengths analysis
  const generateStrengths = (workflow: any[], llmBlocks: any[], npmBlocks: any[]): string[] => {
    const strengths = [];
    
    if (llmBlocks.length > 0 && npmBlocks.length > 0) {
      strengths.push('🤖 Excellent AI-Code integration with both LLM intelligence and NPM functionality');
    }
    
    if (llmBlocks.some(b => b.model?.includes('deepseek'))) {
      strengths.push('💰 Cost-optimized with ultra-affordable DeepSeek models');
    }
    
    if (llmBlocks.some(b => b.model?.includes('claude'))) {
      strengths.push('🧠 High-quality reasoning with Claude\'s advanced capabilities');
    }
    
    if (npmBlocks.some(b => b.package === 'sharp' || b.package === 'pdf-parse')) {
      strengths.push('📄 Robust document/image processing pipeline');
    }
    
    if (workflow.length >= 4) {
      strengths.push('🏗️ Comprehensive workflow with multiple processing stages');
    }
    
    if (npmBlocks.some(b => b.package === 'joi' || b.package === 'validator')) {
      strengths.push('✅ Built-in data validation for reliability');
    }
    
    return strengths.length > 0 ? strengths : ['🌟 Solid foundation ready for optimization'];
  };

  // Generate weaknesses analysis
  const generateWeaknesses = (workflow: any[], llmBlocks: any[], npmBlocks: any[]): string[] => {
    const weaknesses = [];
    
    if (llmBlocks.length === 0) {
      weaknesses.push('🤖 Missing AI intelligence - consider adding LLM models for enhanced processing');
    }
    
    if (npmBlocks.length === 0) {
      weaknesses.push('📦 Lacks data processing utilities - NPM packages could enhance functionality');
    }
    
    if (workflow.length < 3) {
      weaknesses.push('🔗 Limited workflow complexity - could benefit from additional processing stages');
    }
    
    if (!npmBlocks.some(b => b.package === 'joi' || b.package === 'validator')) {
      weaknesses.push('⚠️ No data validation - potential reliability issues');
    }
    
    if (llmBlocks.some(b => b.price?.output > 10)) {
      weaknesses.push('💸 High-cost LLM models detected - consider budget alternatives');
    }
    
    if (!npmBlocks.some(b => b.package === 'axios' || b.package === 'nodemailer')) {
      weaknesses.push('🌐 Limited external connectivity - missing API or notification capabilities');
    }
    
    return weaknesses.length > 0 ? weaknesses : ['✨ Well-optimized workflow with minimal weaknesses'];
  };

  // Generate opportunities
  const generateOpportunities = (workflow: any[], llmBlocks: any[], npmBlocks: any[]): string[] => {
    const opportunities = [
      '🚀 Add parallel processing for improved performance',
      '📊 Implement real-time analytics and monitoring',
      '🔄 Create feedback loops for continuous improvement',
      '🛡️ Enhance security with encryption and authentication',
      '📈 Scale horizontally with microservices architecture',
      '🎯 Optimize for specific use cases and domains',
      '🤝 Enable collaborative workflows with team features',
      '📱 Add mobile-responsive interfaces',
      '🔗 Integrate with external APIs and services',
      '💾 Implement persistent storage and caching'
    ];
    
    return opportunities.slice(0, 5);
  };

  // Generate shake-up recommendations
  const generateShakeUpRecommendations = (workflow: any[], llmBlocks: any[], npmBlocks: any[]) => {
    const recommendations = [];
    
    // High priority recommendations
    if (llmBlocks.length === 0) {
      recommendations.push({
        priority: 'high' as const,
        type: 'AI Integration',
        title: '🤖 Add AI Intelligence Layer',
        description: 'Your workflow lacks AI processing capabilities. Adding an LLM model will unlock intelligent analysis, content generation, and decision-making.',
        impact: 'Transforms basic data processing into intelligent automation',
        implementation: [
          'Add GPT-4o mini for cost-effective AI processing',
          'Integrate Claude 3.5 Sonnet for advanced reasoning tasks',
          'Consider DeepSeek V3 for ultra-budget AI capabilities'
        ],
        expectedOutcome: '300-500% improvement in output quality and automation level'
      });
    }
    
    if (npmBlocks.length === 0) {
      recommendations.push({
        priority: 'high' as const,
        type: 'Data Processing',
        title: '📦 Add Data Processing Utilities',
        description: 'NPM packages provide essential data transformation, validation, and formatting capabilities missing from your workflow.',
        impact: 'Enables robust data handling and processing pipeline',
        implementation: [
          'Add joi for data validation',
          'Include axios for API connectivity',
          'Integrate sharp for image processing'
        ],
        expectedOutcome: '200-300% improvement in data reliability and processing speed'
      });
    }
    
    // Medium priority recommendations
    if (!npmBlocks.some(b => b.package === 'joi')) {
      recommendations.push({
        priority: 'medium' as const,
        type: 'Data Validation',
        title: '✅ Implement Data Validation',
        description: 'Add robust data validation to prevent errors and ensure data quality throughout your workflow.',
        impact: 'Significantly reduces runtime errors and improves reliability',
        implementation: [
          'Add joi validation package',
          'Define validation schemas for all data inputs',
          'Implement error handling for validation failures'
        ],
        expectedOutcome: '90% reduction in data-related errors'
      });
    }
    
    if (llmBlocks.some(b => b.price?.output > 10)) {
      recommendations.push({
        priority: 'medium' as const,
        type: 'Cost Optimization',
        title: '💰 Optimize LLM Costs',
        description: 'Replace expensive models with cost-effective alternatives that maintain quality.',
        impact: 'Reduces operational costs while maintaining performance',
        implementation: [
          'Replace expensive models with DeepSeek V3 ($0.28/1M tokens)',
          'Use GPT-4o mini for simple tasks ($0.60/1M tokens)',
          'Implement model routing based on task complexity'
        ],
        expectedOutcome: '70-90% cost reduction with minimal quality impact'
      });
    }
    
    // Low priority recommendations
    recommendations.push({
      priority: 'low' as const,
      type: 'Performance Enhancement',
      title: '⚡ Add Parallel Processing',
      description: 'Implement parallel execution for independent processing stages to improve overall workflow speed.',
      impact: 'Reduces total execution time for complex workflows',
      implementation: [
        'Identify independent processing stages',
        'Implement async/await patterns',
        'Add queue management for batch processing'
      ],
      expectedOutcome: '40-60% reduction in total processing time'
    });
    
    return recommendations;
  };

  // Generate detailed prompt engineering
  const generatePromptEngineering = (llmBlocks: any[]) => {
    const primaryModel = llmBlocks[0];
    const modelName = primaryModel?.name || 'GPT-4o mini';
    
    return {
      llmOptimization: {
        modelSelection: `${modelName} optimized for your workflow`,
        promptTemplate: `You are an expert AI assistant specialized in ${getWorkflowDomain()}. 

Your task is to analyze the provided data and generate actionable insights.

Context:
- Input format: {input_format}
- Expected output: {output_format}  
- Quality requirements: {quality_requirements}

Please follow these guidelines:
1. Analyze the input data thoroughly
2. Apply domain-specific knowledge
3. Generate structured, actionable output
4. Provide confidence scores for recommendations
5. Highlight any data quality issues

Input: {user_input}

Analysis:`,
        contextStrategy: 'Multi-layered context with domain expertise, task specification, and output formatting',
        temperatureSettings: 0.3,
        maxTokens: 2048
      },
      chainOfThought: [
        '1. Data Ingestion: Receive and validate input data structure',
        '2. Context Analysis: Understand the domain and requirements',
        '3. Processing Strategy: Determine optimal analysis approach',
        '4. Core Analysis: Apply AI reasoning to generate insights',
        '5. Quality Check: Validate output against requirements',
        '6. Formatting: Structure results for downstream processing',
        '7. Metadata Addition: Include confidence scores and explanations'
      ],
      fewShotExamples: [
        {
          input: 'Sample document with financial data',
          output: 'Structured analysis with key metrics, trends, and recommendations',
          explanation: 'Demonstrates proper financial document analysis pattern'
        },
        {
          input: 'Image with text content requiring OCR',
          output: 'Extracted text with confidence scores and layout preservation',
          explanation: 'Shows vision-to-text processing best practices'
        }
      ]
    };
  };

  // Generate context engineering
  const generateContextEngineering = (workflow: any[]) => {
    return {
      dataPreprocessing: [
        '🔍 Input Validation: Verify data types, formats, and required fields',
        '🧹 Data Cleaning: Remove duplicates, handle missing values, normalize formats',
        '📏 Size Optimization: Compress large inputs, chunk oversized content',
        '🏷️ Metadata Enrichment: Add timestamps, source tracking, and processing flags',
        '🔐 Security Scanning: Validate for malicious content and PII detection'
      ],
      contextWindow: {
        strategy: 'Dynamic context window management with priority-based content selection',
        chunking: 'Semantic chunking with overlap for context preservation',
        prioritization: [
          'Critical system instructions (highest priority)',
          'Recent conversation context',
          'Domain-specific knowledge base',
          'Historical processing results',
          'Auxiliary reference materials (lowest priority)'
        ]
      },
      memoryManagement: {
        shortTerm: 'Active workflow state, current processing context, and immediate results',
        longTerm: 'User preferences, workflow patterns, and optimization learnings',
        contextRetention: [
          'Retain successful processing patterns for reuse',
          'Cache frequently accessed data and configurations',
          'Store error patterns for improved error handling',
          'Maintain performance metrics for optimization'
        ]
      }
    };
  };

  // Generate execution plan
  const generateExecutionPlan = (workflow: any[]) => {
    return {
      phases: [
        {
          phase: 1,
          title: '🚀 Initialization & Setup',
          duration: '5-10 minutes',
          tasks: [
            'Verify all required dependencies and packages',
            'Initialize configuration and environment variables',
            'Establish database connections and API endpoints',
            'Run pre-flight checks and validation tests'
          ],
          dependencies: ['System requirements', 'Access credentials', 'Network connectivity'],
          successCriteria: ['All dependencies loaded', 'Configuration validated', 'Connections established']
        },
        {
          phase: 2,
          title: '⚙️ Core Implementation',
          duration: '15-30 minutes',
          tasks: [
            'Implement optimized workflow structure',
            'Configure LLM models with optimal parameters',
            'Set up NPM package integrations',
            'Establish data flow and processing pipelines'
          ],
          dependencies: ['Phase 1 completion', 'Design specifications', 'Performance requirements'],
          successCriteria: ['Workflow executes successfully', 'All integrations functional', 'Performance targets met']
        },
        {
          phase: 3,
          title: '🧪 Testing & Optimization',
          duration: '10-20 minutes',
          tasks: [
            'Run comprehensive test suite',
            'Performance benchmarking and optimization',
            'Error handling and edge case testing',
            'Load testing and scalability verification'
          ],
          dependencies: ['Phase 2 completion', 'Test data sets', 'Performance baselines'],
          successCriteria: ['All tests passing', 'Performance within targets', 'Error handling robust']
        },
        {
          phase: 4,
          title: '🚢 Deployment & Monitoring',
          duration: '10-15 minutes',
          tasks: [
            'Deploy to production environment',
            'Set up monitoring and alerting',
            'Configure logging and analytics',
            'Establish backup and recovery procedures'
          ],
          dependencies: ['Phase 3 completion', 'Production environment', 'Monitoring tools'],
          successCriteria: ['Successful deployment', 'Monitoring active', 'Documentation complete']
        }
      ],
      timeline: '40-75 minutes total implementation time',
      resources: [
        'Development environment with Node.js 18+',
        'API keys for LLM services (OpenAI, Anthropic, etc.)',
        'Database instance (PostgreSQL recommended)',
        'Monitoring and logging infrastructure',
        'Testing frameworks and automation tools'
      ],
      risks: [
        {
          risk: 'API rate limits or service outages',
          mitigation: 'Implement retry logic, fallback models, and circuit breakers'
        },
        {
          risk: 'Data quality issues or format inconsistencies',
          mitigation: 'Robust validation, error handling, and data cleaning pipelines'
        },
        {
          risk: 'Performance bottlenecks in processing pipeline',
          mitigation: 'Performance monitoring, caching strategies, and parallel processing'
        },
        {
          risk: 'Cost overruns from expensive LLM usage',
          mitigation: 'Usage monitoring, budget alerts, and model optimization'
        }
      ]
    };
  };

  // Helper function to determine workflow domain
  const getWorkflowDomain = () => {
    const hasDocProcessing = workflowCanvas.some(b => b.package === 'pdf-parse' || b.package === 'sharp');
    const hasDataValidation = workflowCanvas.some(b => b.package === 'joi' || b.package === 'validator');
    const hasAPI = workflowCanvas.some(b => b.package === 'axios');
    
    if (hasDocProcessing) return 'document and image processing';
    if (hasDataValidation) return 'data validation and quality assurance';
    if (hasAPI) return 'API integration and data exchange';
    return 'general data processing and automation';
  };

  // Export report locally
  const exportReportLocally = () => {
    if (!analysisReport) return;
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `shake-up-analysis-${timestamp}`;
    
    let content: string;
    let mimeType: string;
    let fileExtension: string;
    
    if (exportFormat === 'json') {
      content = JSON.stringify(analysisReport, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else if (exportFormat === 'markdown') {
      content = generateMarkdownReport(analysisReport);
      mimeType = 'text/markdown';
      fileExtension = 'md';
    } else {
      content = generateTextReport(analysisReport);
      mimeType = 'text/plain';
      fileExtension = 'txt';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Save to Supabase
  const saveToSupabase = async () => {
    if (!analysisReport) return;
    
    setIsSaving(true);
    setSaveStatus('Saving analysis to database...');
    
    try {
      const { data, error } = await supabase
        .from('workflow_analyses')
        .insert({
          analysis_id: analysisReport.id,
          workflow_data: workflowCanvas,
          analysis_report: analysisReport,
          performance_score: analysisReport.workflowAnalysis.performanceScore,
          cost_efficiency: analysisReport.workflowAnalysis.costEfficiency,
          complexity: analysisReport.workflowAnalysis.complexity,
          recommendations_count: analysisReport.shakeUpRecommendations.length,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setSaveStatus('✅ Analysis saved successfully to database!');
      setTimeout(() => setSaveStatus(null), 3000);
      
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      setSaveStatus('❌ Failed to save to database. Please try again.');
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate markdown report
  const generateMarkdownReport = (report: AnalysisReport): string => {
    return `# 🤖 AI Shake-Up Analysis Report

**Generated:** ${new Date(report.exportMetadata.createdAt).toLocaleString()}  
**Workflow ID:** ${report.exportMetadata.workflowId}  
**Version:** ${report.exportMetadata.version}

---

## 📊 Workflow Analysis Overview

### Current Setup
- **Total Blocks:** ${report.workflowAnalysis.currentSetup.totalBlocks}
- **LLM Models:** ${report.workflowAnalysis.currentSetup.llmModels}
- **NPM Packages:** ${report.workflowAnalysis.currentSetup.npmPackages}
- **Estimated Cost:** $${report.workflowAnalysis.currentSetup.estimatedCost.toFixed(4)}
- **Complexity:** ${report.workflowAnalysis.complexity}

### Performance Metrics
- **Performance Score:** ${report.workflowAnalysis.performanceScore}/100
- **Cost Efficiency:** ${report.workflowAnalysis.costEfficiency}/100

### Strengths ✅
${report.workflowAnalysis.strengths.map(s => `- ${s}`).join('\n')}

### Weaknesses ⚠️
${report.workflowAnalysis.weaknesses.map(w => `- ${w}`).join('\n')}

### Opportunities 🚀
${report.workflowAnalysis.opportunities.map(o => `- ${o}`).join('\n')}

---

## 🔄 Shake-Up Recommendations

${report.shakeUpRecommendations.map(rec => `
### ${rec.title} (${rec.priority.toUpperCase()} Priority)

**Type:** ${rec.type}  
**Impact:** ${rec.impact}

**Description:** ${rec.description}

**Implementation Steps:**
${rec.implementation.map(step => `- ${step}`).join('\n')}

**Expected Outcome:** ${rec.expectedOutcome}

---
`).join('')}

## 🎯 Detailed Prompt Engineering

### LLM Optimization
- **Model Selection:** ${report.promptEngineering.llmOptimization.modelSelection}
- **Context Strategy:** ${report.promptEngineering.llmOptimization.contextStrategy}
- **Temperature:** ${report.promptEngineering.llmOptimization.temperatureSettings}
- **Max Tokens:** ${report.promptEngineering.llmOptimization.maxTokens}

### Optimized Prompt Template
\`\`\`
${report.promptEngineering.llmOptimization.promptTemplate}
\`\`\`

### Chain of Thought Process
${report.promptEngineering.chainOfThought.map(step => `${step}`).join('\n')}

---

## 🧠 Context Engineering Strategy

### Data Preprocessing Pipeline
${report.contextEngineering.dataPreprocessing.map(step => `- ${step}`).join('\n')}

### Context Window Management
- **Strategy:** ${report.contextEngineering.contextWindow.strategy}
- **Chunking:** ${report.contextEngineering.contextWindow.chunking}

**Prioritization:**
${report.contextEngineering.contextWindow.prioritization.map(p => `- ${p}`).join('\n')}

### Memory Management
- **Short-term:** ${report.contextEngineering.memoryManagement.shortTerm}
- **Long-term:** ${report.contextEngineering.memoryManagement.longTerm}

**Context Retention:**
${report.contextEngineering.memoryManagement.contextRetention.map(r => `- ${r}`).join('\n')}

---

## 🚀 Execution Plan

**Timeline:** ${report.executionPlan.timeline}

${report.executionPlan.phases.map(phase => `
### Phase ${phase.phase}: ${phase.title}
**Duration:** ${phase.duration}

**Tasks:**
${phase.tasks.map(task => `- ${task}`).join('\n')}

**Dependencies:**
${phase.dependencies.map(dep => `- ${dep}`).join('\n')}

**Success Criteria:**
${phase.successCriteria.map(criteria => `- ${criteria}`).join('\n')}
`).join('\n')}

### Required Resources
${report.executionPlan.resources.map(resource => `- ${resource}`).join('\n')}

### Risk Management
${report.executionPlan.risks.map(risk => `
**Risk:** ${risk.risk}  
**Mitigation:** ${risk.mitigation}
`).join('\n')}

---

*Report generated by AI Shake-Up Analyzer v${report.exportMetadata.version}*
`;
  };

  // Generate text report
  const generateTextReport = (report: AnalysisReport): string => {
    return `AI SHAKE-UP ANALYSIS REPORT
Generated: ${new Date(report.exportMetadata.createdAt).toLocaleString()}
Workflow ID: ${report.exportMetadata.workflowId}

=== WORKFLOW ANALYSIS ===
Performance Score: ${report.workflowAnalysis.performanceScore}/100
Cost Efficiency: ${report.workflowAnalysis.costEfficiency}/100
Complexity: ${report.workflowAnalysis.complexity}

Strengths:
${report.workflowAnalysis.strengths.map(s => `- ${s}`).join('\n')}

Weaknesses:
${report.workflowAnalysis.weaknesses.map(w => `- ${w}`).join('\n')}

=== RECOMMENDATIONS ===
${report.shakeUpRecommendations.map(rec => `
${rec.title} (${rec.priority.toUpperCase()})
${rec.description}
Expected Outcome: ${rec.expectedOutcome}
`).join('\n')}

=== PROMPT ENGINEERING ===
Model: ${report.promptEngineering.llmOptimization.modelSelection}
Temperature: ${report.promptEngineering.llmOptimization.temperatureSettings}
Max Tokens: ${report.promptEngineering.llmOptimization.maxTokens}

Template:
${report.promptEngineering.llmOptimization.promptTemplate}

=== EXECUTION PLAN ===
Timeline: ${report.executionPlan.timeline}

${report.executionPlan.phases.map(phase => `
Phase ${phase.phase}: ${phase.title}
Duration: ${phase.duration}
Tasks: ${phase.tasks.join(', ')}
`).join('\n')}

Generated by AI Shake-Up Analyzer`;
  };

  // Auto-start analysis on mount
  useEffect(() => {
    performShakeUpAnalysis();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'recommendations', label: 'Shake-Up', icon: Shuffle },
    { id: 'prompts', label: 'Prompt Engineering', icon: Brain },
    { id: 'context', label: 'Context Engineering', icon: Settings },
    { id: 'execution', label: 'Execution Plan', icon: Target }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl border border-purple-400/30 w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6 border-b border-purple-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-xl">
                <Shuffle className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">🤖 AI Shake-Up Analyzer</h2>
                <p className="text-purple-300">Intelligent workflow optimization and strategic recommendations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {analysisReport && (
                <>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="text">Text</option>
                  </select>
                  
                  <button
                    onClick={exportReportLocally}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
                  >
                    <Download size={16} />
                    Export
                  </button>
                  
                  <button
                    onClick={saveToSupabase}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
                  >
                    <Database size={16} />
                    {isSaving ? 'Saving...' : 'Save to DB'}
                  </button>
                </>
              )}
              
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          
          {saveStatus && (
            <div className="mt-3 p-3 bg-blue-600/20 border border-blue-400/30 rounded-lg">
              <p className="text-blue-300 text-sm">{saveStatus}</p>
            </div>
          )}
        </div>

        {/* Analysis Loading */}
        {isAnalyzing && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-4">🧠 Analyzing Your Workflow...</h3>
            <div className="space-y-2 text-purple-300">
              <p>⚡ Evaluating performance patterns</p>
              <p>💰 Calculating cost optimization opportunities</p>
              <p>🎯 Generating intelligent recommendations</p>
              <p>📋 Crafting detailed execution plan</p>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisReport && (
          <>
            {/* Tab Navigation */}
            <div className="bg-white/5 border-b border-purple-400/20">
              <div className="flex overflow-x-auto">
                {tabs.map(tab => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap
                        ${activeTab === tab.id 
                          ? 'text-purple-300 border-b-2 border-purple-400 bg-purple-600/10' 
                          : 'text-gray-400 hover:text-gray-300'
                        }
                      `}
                    >
                      <IconComponent size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 rounded-xl border border-purple-400/30">
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="text-purple-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Performance Score</h3>
                      </div>
                      <div className="text-4xl font-bold text-purple-300 mb-2">
                        {analysisReport.workflowAnalysis.performanceScore}/100
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${analysisReport.workflowAnalysis.performanceScore}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-6 rounded-xl border border-green-400/30">
                      <div className="flex items-center gap-3 mb-4">
                        <DollarSign className="text-green-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Cost Efficiency</h3>
                      </div>
                      <div className="text-4xl font-bold text-green-300 mb-2">
                        {analysisReport.workflowAnalysis.costEfficiency}/100
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${analysisReport.workflowAnalysis.costEfficiency}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-6 rounded-xl border border-blue-400/30">
                      <div className="flex items-center gap-3 mb-4">
                        <BarChart3 className="text-blue-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Complexity</h3>
                      </div>
                      <div className="text-4xl font-bold text-blue-300 mb-2">
                        {analysisReport.workflowAnalysis.complexity}
                      </div>
                      <div className="text-sm text-blue-200">
                        {analysisReport.workflowAnalysis.currentSetup.totalBlocks} total blocks
                      </div>
                    </div>
                  </div>

                  {/* Strengths, Weaknesses, Opportunities */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-600/10 p-6 rounded-xl border border-green-400/30">
                      <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                        <CheckCircle size={20} />
                        Strengths
                      </h3>
                      <ul className="space-y-3">
                        {analysisReport.workflowAnalysis.strengths.map((strength, idx) => (
                          <li key={idx} className="text-green-200 text-sm flex items-start gap-2">
                            <Star size={12} className="text-green-400 mt-1 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-orange-600/10 p-6 rounded-xl border border-orange-400/30">
                      <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        Weaknesses
                      </h3>
                      <ul className="space-y-3">
                        {analysisReport.workflowAnalysis.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-orange-200 text-sm flex items-start gap-2">
                            <AlertTriangle size={12} className="text-orange-400 mt-1 flex-shrink-0" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-blue-600/10 p-6 rounded-xl border border-blue-400/30">
                      <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <Lightbulb size={20} />
                        Opportunities
                      </h3>
                      <ul className="space-y-3">
                        {analysisReport.workflowAnalysis.opportunities.map((opportunity, idx) => (
                          <li key={idx} className="text-blue-200 text-sm flex items-start gap-2">
                            <Lightbulb size={12} className="text-blue-400 mt-1 flex-shrink-0" />
                            {opportunity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-white mb-4">🔄 Strategic Shake-Up Recommendations</h3>
                    <p className="text-purple-300">AI-powered optimization strategies for maximum impact</p>
                  </div>
                  
                  {analysisReport.shakeUpRecommendations.map((rec, idx) => (
                    <div key={idx} className={`
                      p-6 rounded-xl border-l-4 
                      ${rec.priority === 'high' 
                        ? 'bg-red-600/10 border-red-400 border border-red-400/30' 
                        : rec.priority === 'medium'
                        ? 'bg-yellow-600/10 border-yellow-400 border border-yellow-400/30'
                        : 'bg-blue-600/10 border-blue-400 border border-blue-400/30'
                      }
                    `}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-white mb-2">{rec.title}</h4>
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`
                              px-3 py-1 rounded-full text-xs font-bold
                              ${rec.priority === 'high' 
                                ? 'bg-red-600/30 text-red-300' 
                                : rec.priority === 'medium'
                                ? 'bg-yellow-600/30 text-yellow-300'
                                : 'bg-blue-600/30 text-blue-300'
                              }
                            `}>
                              {rec.priority.toUpperCase()} PRIORITY
                            </span>
                            <span className="text-gray-400 text-sm">{rec.type}</span>
                          </div>
                        </div>
                        <div className="text-4xl">
                          {rec.priority === 'high' ? '🚨' : rec.priority === 'medium' ? '⚡' : '💡'}
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-4">{rec.description}</p>
                      
                      <div className="bg-white/5 p-4 rounded-lg mb-4">
                        <h5 className="font-bold text-purple-300 mb-2">💥 Expected Impact:</h5>
                        <p className="text-purple-200 text-sm">{rec.impact}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <h5 className="font-bold text-cyan-300">🛠️ Implementation Steps:</h5>
                        <ul className="space-y-2">
                          {rec.implementation.map((step, stepIdx) => (
                            <li key={stepIdx} className="text-cyan-200 text-sm flex items-start gap-2">
                              <ArrowRight size={12} className="text-cyan-400 mt-1 flex-shrink-0" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mt-4 p-3 bg-green-600/10 rounded-lg border border-green-400/30">
                        <h5 className="font-bold text-green-300 text-sm mb-1">🎯 Expected Outcome:</h5>
                        <p className="text-green-200 text-sm">{rec.expectedOutcome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prompt Engineering Tab */}
              {activeTab === 'prompts' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-white mb-4">🎯 Advanced Prompt Engineering</h3>
                    <p className="text-purple-300">Optimized prompts and strategies for maximum LLM performance</p>
                  </div>
                  
                  {/* LLM Optimization Settings */}
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6 rounded-xl border border-purple-400/30">
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Settings className="text-purple-400" />
                      LLM Optimization Configuration
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-bold text-purple-300 mb-2">Model Selection</h5>
                        <p className="text-purple-200 text-sm mb-4">{analysisReport.promptEngineering.llmOptimization.modelSelection}</p>
                        
                        <h5 className="font-bold text-purple-300 mb-2">Parameters</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Temperature:</span>
                            <span className="text-purple-300">{analysisReport.promptEngineering.llmOptimization.temperatureSettings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Max Tokens:</span>
                            <span className="text-purple-300">{analysisReport.promptEngineering.llmOptimization.maxTokens}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-bold text-purple-300 mb-2">Context Strategy</h5>
                        <p className="text-purple-200 text-sm">{analysisReport.promptEngineering.llmOptimization.contextStrategy}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Optimized Prompt Template */}
                  <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600/30">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-white flex items-center gap-2">
                        <Code className="text-blue-400" />
                        Optimized Prompt Template
                      </h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(analysisReport.promptEngineering.llmOptimization.promptTemplate)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-2 transition-colors"
                      >
                        <Copy size={12} />
                        Copy
                      </button>
                    </div>
                    <pre className="bg-black/30 p-4 rounded-lg text-green-300 text-sm overflow-x-auto border border-green-400/20">
                      {analysisReport.promptEngineering.llmOptimization.promptTemplate}
                    </pre>
                  </div>
                  
                  {/* Chain of Thought */}
                  <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-6 rounded-xl border border-green-400/30">
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Brain className="text-green-400" />
                      Chain of Thought Process
                    </h4>
                    <div className="space-y-3">
                      {analysisReport.promptEngineering.chainOfThought.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-green-200">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Few-Shot Examples */}
                  <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-6 rounded-xl border border-yellow-400/30">
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="text-yellow-400" />
                      Few-Shot Learning Examples
                    </h4>
                    <div className="space-y-4">
                      {analysisReport.promptEngineering.fewShotExamples.map((example, idx) => (
                        <div key={idx} className="bg-black/20 p-4 rounded-lg border border-yellow-400/20">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <h5 className="font-bold text-yellow-300 mb-2">Input:</h5>
                              <p className="text-yellow-200 text-sm">{example.input}</p>
                            </div>
                            <div>
                              <h5 className="font-bold text-yellow-300 mb-2">Output:</h5>
                              <p className="text-yellow-200 text-sm">{example.output}</p>
                            </div>
                          </div>
                          <p className="text-yellow-200/80 text-xs italic">{example.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Context Engineering Tab */}
              {activeTab === 'context' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-white mb-4">🧠 Advanced Context Engineering</h3>
                    <p className="text-purple-300">Sophisticated context management and data preprocessing strategies</p>
                  </div>
                  
                  {/* Data Preprocessing */}
                  <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 p-6 rounded-xl border border-cyan-400/30">
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Database className="text-cyan-400" />
                      Data Preprocessing Pipeline
                    </h4>
                    <div className="space-y-3">
                      {analysisReport.contextEngineering.dataPreprocessing.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                          <div className="bg-cyan-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-cyan-200">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Context Window Management */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 rounded-xl border border-purple-400/30">
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Eye className="text-purple-400" />
                        Context Window Strategy
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-bold text-purple-300 mb-2">Strategy:</h5>
                          <p className="text-purple-200 text-sm">{analysisReport.contextEngineering.contextWindow.strategy}</p>
                        </div>
                        <div>
                          <h5 className="font-bold text-purple-300 mb-2">Chunking:</h5>
                          <p className="text-purple-200 text-sm">{analysisReport.contextEngineering.contextWindow.chunking}</p>
                        </div>
                        <div>
                          <h5 className="font-bold text-purple-300 mb-2">Prioritization:</h5>
                          <ul className="space-y-1">
                            {analysisReport.contextEngineering.contextWindow.prioritization.map((priority, idx) => (
                              <li key={idx} className="text-purple-200 text-sm flex items-start gap-2">
                                <span className="text-purple-400 font-bold">{idx + 1}.</span>
                                {priority}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-6 rounded-xl border border-indigo-400/30">
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Brain className="text-indigo-400" />
                        Memory Management
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-bold text-indigo-300 mb-2">Short-term Memory:</h5>
                          <p className="text-indigo-200 text-sm">{analysisReport.contextEngineering.memoryManagement.shortTerm}</p>
                        </div>
                        <div>
                          <h5 className="font-bold text-indigo-300 mb-2">Long-term Memory:</h5>
                          <p className="text-indigo-200 text-sm">{analysisReport.contextEngineering.memoryManagement.longTerm}</p>
                        </div>
                        <div>
                          <h5 className="font-bold text-indigo-300 mb-2">Context Retention:</h5>
                          <ul className="space-y-2">
                            {analysisReport.contextEngineering.memoryManagement.contextRetention.map((retention, idx) => (
                              <li key={idx} className="text-indigo-200 text-sm flex items-start gap-2">
                                <CheckCircle size={12} className="text-indigo-400 mt-1 flex-shrink-0" />
                                {retention}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Plan Tab */}
              {activeTab === 'execution' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-bold text-white mb-4">🚀 Comprehensive Execution Plan</h3>
                    <p className="text-purple-300">Detailed roadmap for implementing your optimized workflow</p>
                  </div>
                  
                  {/* Timeline Overview */}
                  <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-6 rounded-xl border border-green-400/30 text-center">
                    <h4 className="text-2xl font-bold text-white mb-2">⏱️ {analysisReport.executionPlan.timeline}</h4>
                    <p className="text-green-300">Total implementation time</p>
                  </div>
                  
                  {/* Execution Phases */}
                  <div className="space-y-6">
                    {analysisReport.executionPlan.phases.map((phase, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-6 rounded-xl border border-blue-400/30">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold flex-shrink-0">
                            {phase.phase}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-white mb-2">{phase.title}</h4>
                            <p className="text-blue-300 text-sm">Duration: {phase.duration}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h5 className="font-bold text-blue-300 mb-3">📋 Tasks:</h5>
                            <ul className="space-y-2">
                              {phase.tasks.map((task, taskIdx) => (
                                <li key={taskIdx} className="text-blue-200 text-sm flex items-start gap-2">
                                  <CheckCircle size={12} className="text-blue-400 mt-1 flex-shrink-0" />
                                  {task}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-bold text-purple-300 mb-3">🔗 Dependencies:</h5>
                            <ul className="space-y-2">
                              {phase.dependencies.map((dep, depIdx) => (
                                <li key={depIdx} className="text-purple-200 text-sm flex items-start gap-2">
                                  <ArrowRight size={12} className="text-purple-400 mt-1 flex-shrink-0" />
                                  {dep}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div>
                            <h5 className="font-bold text-green-300 mb-3">✅ Success Criteria:</h5>
                            <ul className="space-y-2">
                              {phase.successCriteria.map((criteria, criteriaIdx) => (
                                <li key={criteriaIdx} className="text-green-200 text-sm flex items-start gap-2">
                                  <Target size={12} className="text-green-400 mt-1 flex-shrink-0" />
                                  {criteria}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Resources and Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-6 rounded-xl border border-yellow-400/30">
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="text-yellow-400" />
                        Required Resources
                      </h4>
                      <ul className="space-y-3">
                        {analysisReport.executionPlan.resources.map((resource, idx) => (
                          <li key={idx} className="text-yellow-200 text-sm flex items-start gap-2">
                            <Zap size={12} className="text-yellow-400 mt-1 flex-shrink-0" />
                            {resource}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 p-6 rounded-xl border border-red-400/30">
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-400" />
                        Risk Management
                      </h4>
                      <div className="space-y-4">
                        {analysisReport.executionPlan.risks.map((riskItem, idx) => (
                          <div key={idx} className="bg-black/20 p-3 rounded-lg">
                            <h5 className="font-bold text-red-300 text-sm mb-1">Risk:</h5>
                            <p className="text-red-200 text-sm mb-2">{riskItem.risk}</p>
                            <h5 className="font-bold text-red-300 text-sm mb-1">Mitigation:</h5>
                            <p className="text-red-200 text-sm">{riskItem.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }
      `}</style>
    </div>
  );
};

export default ShakeUpAnalyzer;