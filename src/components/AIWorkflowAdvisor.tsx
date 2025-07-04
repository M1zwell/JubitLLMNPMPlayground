import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Send, Bot, User, Lightbulb, Zap, 
  Brain, Package, ArrowRight, CheckCircle, X, 
  Sparkles, Target, Clock, TrendingUp, Shield,
  Code, Database, Cpu, Globe, RefreshCw
} from 'lucide-react';
import { usePlayground } from '../context/PlaygroundContext';
import { useLLMModels } from '../hooks/useLLMModels';
import { useNPMPackages } from '../hooks/useNPMPackages';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: WorkflowSuggestion[];
  components?: ComponentSuggestion[];
}

interface WorkflowSuggestion {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  useCase: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  tags: string[];
}

interface WorkflowStep {
  order: number;
  type: 'llm' | 'npm' | 'input' | 'output';
  component: any;
  description: string;
  rationale: string;
}

interface ComponentSuggestion {
  component: any;
  type: 'llm' | 'npm';
  reason: string;
  strength: 'high' | 'medium' | 'low';
  compatibility: string[];
}

const WORKFLOW_PATTERNS = {
  'data-analysis': {
    keywords: ['analyze', 'data', 'csv', 'chart', 'statistics', 'insights', 'report'],
    steps: ['input', 'npm', 'llm', 'output'],
    suggestedNPM: ['papaparse', 'lodash', 'mathjs'],
    suggestedLLM: ['claude-3.5-sonnet', 'gpt-4o', 'deepseek-v3']
  },
  'text-processing': {
    keywords: ['text', 'content', 'write', 'generate', 'translate', 'summarize'],
    steps: ['input', 'llm', 'npm', 'output'],
    suggestedNPM: ['validator', 'joi', 'lodash'],
    suggestedLLM: ['gpt-4o-mini', 'claude-3.5-sonnet', 'gemini-pro']
  },
  'api-integration': {
    keywords: ['api', 'request', 'http', 'fetch', 'integration', 'webhook'],
    steps: ['input', 'npm', 'llm', 'output'],
    suggestedNPM: ['axios', 'joi', 'validator'],
    suggestedLLM: ['deepseek-coder', 'gpt-4o', 'claude-3.5-sonnet']
  },
  'security-validation': {
    keywords: ['security', 'validate', 'hash', 'encrypt', 'auth', 'password'],
    steps: ['input', 'npm', 'npm', 'output'],
    suggestedNPM: ['bcrypt', 'joi', 'validator', 'uuid'],
    suggestedLLM: ['deepseek-coder', 'claude-3.5-sonnet']
  },
  'image-processing': {
    keywords: ['image', 'photo', 'resize', 'convert', 'optimize', 'picture'],
    steps: ['input', 'npm', 'llm', 'output'],
    suggestedNPM: ['sharp', 'qrcode'],
    suggestedLLM: ['gpt-4o', 'gemini-pro-vision']
  }
};

const QUICK_SUGGESTIONS = [
  "I want to analyze CSV data and get insights",
  "Help me build a chatbot workflow",
  "I need to validate and process user input",
  "Create a workflow for image processing",
  "Build an API integration pipeline",
  "I want to generate and format content",
  "Help me create a data visualization workflow",
  "Build a security validation system"
];

interface AIWorkflowAdvisorProps {
  onSuggestionApply?: (suggestion: WorkflowSuggestion) => void;
  onComponentAdd?: (component: any, type: 'llm' | 'npm') => void;
  selectedComponents?: any[];
  className?: string;
}

const AIWorkflowAdvisor: React.FC<AIWorkflowAdvisorProps> = ({ 
  onSuggestionApply, 
  onComponentAdd,
  selectedComponents = [],
  className = ''
}) => {
  const { state, actions } = usePlayground();
  const { models: llmModels } = useLLMModels();
  const { packages: npmPackages } = useNPMPackages({ limit: 100 });
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: "👋 Hi! I'm your AI Workflow Advisor. I can help you build powerful workflows by suggesting the perfect combination of LLM models and NPM packages.\n\nWhat would you like to build today?",
        timestamp: new Date(),
        suggestions: generateQuickStartSuggestions()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Analyze user query and determine workflow pattern
  const analyzeUserIntent = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    for (const [pattern, config] of Object.entries(WORKFLOW_PATTERNS)) {
      if (config.keywords.some(keyword => lowerQuery.includes(keyword))) {
        return pattern;
      }
    }
    
    return 'general';
  };

  // Generate workflow suggestions based on user query
  const generateWorkflowSuggestions = (query: string, pattern: string): WorkflowSuggestion[] => {
    const suggestions: WorkflowSuggestion[] = [];
    
    if (pattern === 'data-analysis') {
      suggestions.push({
        id: 'data-analysis-1',
        title: '📊 Smart Data Analysis Pipeline',
        description: 'Parse CSV data, analyze patterns, and generate AI insights',
        useCase: 'Perfect for business reports, data exploration, and trend analysis',
        difficulty: 'Beginner',
        estimatedTime: '2-3 minutes',
        tags: ['Data', 'CSV', 'Analysis', 'Reports'],
        steps: [
          {
            order: 1,
            type: 'npm',
            component: npmPackages.find(p => p.name === 'papaparse'),
            description: 'Parse CSV data into structured format',
            rationale: 'PapaParse is the most reliable CSV parser with excellent error handling'
          },
          {
            order: 2,
            type: 'npm',
            component: npmPackages.find(p => p.name === 'lodash'),
            description: 'Clean and transform data',
            rationale: 'Lodash provides powerful data manipulation utilities'
          },
          {
            order: 3,
            type: 'llm',
            component: llmModels.find(m => m.name.includes('claude-3.5-sonnet')),
            description: 'Analyze patterns and generate insights',
            rationale: 'Claude excels at analytical reasoning and data interpretation'
          }
        ]
      });
    }
    
    if (pattern === 'text-processing') {
      suggestions.push({
        id: 'text-processing-1',
        title: '✍️ AI Content Generator',
        description: 'Generate, validate, and format high-quality content',
        useCase: 'Content creation, copywriting, and text optimization',
        difficulty: 'Beginner',
        estimatedTime: '1-2 minutes',
        tags: ['Content', 'Writing', 'AI', 'Text'],
        steps: [
          {
            order: 1,
            type: 'llm',
            component: llmModels.find(m => m.name.includes('gpt-4o-mini')),
            description: 'Generate creative content',
            rationale: 'GPT-4o Mini offers excellent creative writing capabilities at low cost'
          },
          {
            order: 2,
            type: 'npm',
            component: npmPackages.find(p => p.name === 'validator'),
            description: 'Validate and clean generated text',
            rationale: 'Ensures output quality and removes unwanted characters'
          },
          {
            order: 3,
            type: 'npm',
            component: npmPackages.find(p => p.name === 'lodash'),
            description: 'Format and structure output',
            rationale: 'Lodash helps organize content into desired formats'
          }
        ]
      });
    }

    if (pattern === 'api-integration') {
      suggestions.push({
        id: 'api-integration-1',
        title: '🌐 Smart API Integration',
        description: 'Fetch data from APIs, validate, and process with AI',
        useCase: 'API data processing, webhook handling, external integrations',
        difficulty: 'Intermediate',
        estimatedTime: '3-4 minutes',
        tags: ['API', 'HTTP', 'Integration', 'Validation'],
        steps: [
          {
            order: 1,
            type: 'npm',
            component: npmPackages.find(p => p.name === 'axios'),
            description: 'Fetch data from external APIs',
            rationale: 'Axios provides robust HTTP client with error handling'
          },
          {
            order: 2,
            type: 'npm',
            component: npmPackages.find(p => p.name === 'joi'),
            description: 'Validate API response structure',
            rationale: 'Joi ensures data integrity and prevents errors'
          },
          {
            order: 3,
            type: 'llm',
            component: llmModels.find(m => m.name.includes('deepseek-coder')),
            description: 'Process and transform API data',
            rationale: 'DeepSeek Coder excels at structured data processing'
          }
        ]
      });
    }

    // Add more pattern-based suggestions...
    return suggestions.filter(s => s.steps.every(step => step.component));
  };

  // Generate component suggestions based on context
  const generateComponentSuggestions = (query: string): ComponentSuggestion[] => {
    const suggestions: ComponentSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Suggest LLM models based on query context
    if (lowerQuery.includes('analyze') || lowerQuery.includes('insight')) {
      const claude = llmModels.find(m => m.name.includes('claude-3.5-sonnet'));
      if (claude) {
        suggestions.push({
          component: claude,
          type: 'llm',
          reason: 'Excellent analytical reasoning capabilities',
          strength: 'high',
          compatibility: ['papaparse', 'lodash', 'mathjs']
        });
      }
    }

    if (lowerQuery.includes('code') || lowerQuery.includes('programming')) {
      const deepseek = llmModels.find(m => m.name.includes('deepseek-coder'));
      if (deepseek) {
        suggestions.push({
          component: deepseek,
          type: 'llm',
          reason: 'Specialized for code generation and programming tasks',
          strength: 'high',
          compatibility: ['joi', 'validator', 'axios']
        });
      }
    }

    // Suggest NPM packages based on query context
    if (lowerQuery.includes('csv') || lowerQuery.includes('data')) {
      const papaparse = npmPackages.find(p => p.name === 'papaparse');
      if (papaparse) {
        suggestions.push({
          component: papaparse,
          type: 'npm',
          reason: 'Best-in-class CSV parsing with error handling',
          strength: 'high',
          compatibility: ['claude-3.5-sonnet', 'gpt-4o']
        });
      }
    }

    if (lowerQuery.includes('validate') || lowerQuery.includes('check')) {
      const joi = npmPackages.find(p => p.name === 'joi');
      if (joi) {
        suggestions.push({
          component: joi,
          type: 'npm',
          reason: 'Powerful schema validation for data integrity',
          strength: 'high',
          compatibility: ['deepseek-coder', 'claude-3.5-sonnet']
        });
      }
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  // Generate quick start suggestions
  const generateQuickStartSuggestions = (): WorkflowSuggestion[] => {
    return [
      {
        id: 'quick-chat',
        title: '🤖 Smart Chatbot',
        description: 'Create an intelligent chatbot that can understand and respond to user queries',
        useCase: 'Customer support, FAQ automation, interactive assistance',
        difficulty: 'Beginner',
        estimatedTime: '1-2 minutes',
        tags: ['Chatbot', 'AI', 'Conversation'],
        steps: [
          {
            order: 1,
            type: 'llm',
            component: llmModels.find(m => m.name.includes('gpt-4o-mini')),
            description: 'Process user input and generate responses',
            rationale: 'Fast, cost-effective, and excellent for conversational AI'
          },
          {
            order: 2,
            type: 'npm',
            component: npmPackages.find(p => p.name === 'validator'),
            description: 'Validate and sanitize user input',
            rationale: 'Ensures safe and clean input processing'
          }
        ]
      },
      {
        id: 'quick-data',
        title: '📊 Data Insights',
        description: 'Transform raw data into actionable insights with AI analysis',
        useCase: 'Business intelligence, data exploration, report generation',
        difficulty: 'Beginner',
        estimatedTime: '2-3 minutes',
        tags: ['Data', 'Analysis', 'Insights'],
        steps: [
          {
            order: 1,
            type: 'npm',
            component: npmPackages.find(p => p.name === 'papaparse'),
            description: 'Parse and structure data',
            rationale: 'Reliable CSV parsing with comprehensive error handling'
          },
          {
            order: 2,
            type: 'llm',
            component: llmModels.find(m => m.name.includes('claude-3.5-sonnet')),
            description: 'Analyze patterns and generate insights',
            rationale: 'Superior analytical reasoning and data interpretation'
          }
        ]
      }
    ];
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing time
    setTimeout(() => {
      const pattern = analyzeUserIntent(inputValue);
      const workflowSuggestions = generateWorkflowSuggestions(inputValue, pattern);
      const componentSuggestions = generateComponentSuggestions(inputValue);

      let responseContent = '';
      
      if (pattern !== 'general') {
        responseContent = `I understand you want to work with ${pattern.replace('-', ' ')}! Based on your request, I've analyzed the best approach and prepared some tailored workflow suggestions.\n\nHere are optimized workflows that combine the most suitable LLM models and NPM packages:`;
      } else {
        responseContent = `I can help you build a custom workflow! Based on your request, I've identified some components that would work well together.\n\nLet me suggest some approaches:`;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        suggestions: workflowSuggestions.length > 0 ? workflowSuggestions : undefined,
        components: componentSuggestions.length > 0 ? componentSuggestions : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Handle quick suggestion clicks
  const handleQuickSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage();
  };

  // Apply workflow suggestion
  const handleApplySuggestion = (suggestion: WorkflowSuggestion) => {
    // Add components to workflow
    suggestion.steps.forEach(step => {
      if (step.component && step.type !== 'input' && step.type !== 'output') {
        onComponentAdd?.(step.component, step.type);
        actions.addComponentToWorkflow(step.component, step.type);
      }
    });

    onSuggestionApply?.(suggestion);
    
    // Add confirmation message
    const confirmationMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `✅ Great choice! I've added the "${suggestion.title}" workflow components. You now have a ${suggestion.steps.length}-step workflow ready to execute.\n\nThe workflow includes:\n${suggestion.steps.map((step, i) => `${i + 1}. ${step.description}`).join('\n')}\n\nYou can now execute this workflow or ask me to suggest modifications!`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, confirmationMessage]);
  };

  // Add individual component
  const handleAddComponent = (component: any, type: 'llm' | 'npm') => {
    onComponentAdd?.(component, type);
    actions.addComponentToWorkflow(component, type);

    const confirmationMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `✅ Added ${component.name} to your workflow! This ${type === 'llm' ? 'LLM model' : 'NPM package'} will help with ${type === 'llm' ? 'AI processing and analysis' : 'data manipulation and utilities'}.\n\nWould you like me to suggest what to add next?`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, confirmationMessage]);
  };

  return (
    <div className={`${className}`}>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
        >
          <Bot className="text-white" size={24} />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles size={12} className="text-white" />
          </div>
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-800 rounded-xl shadow-2xl border border-slate-600 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">AI Workflow Advisor</h3>
                <p className="text-xs text-white/80">Smart LLM & NPM suggestions</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.type === 'user' ? 'bg-blue-600' : 'bg-slate-700'} rounded-lg p-3`}>
                  <div className="flex items-start gap-2 mb-2">
                    {message.type === 'assistant' ? (
                      <Bot size={16} className="text-purple-400 mt-1 flex-shrink-0" />
                    ) : (
                      <User size={16} className="text-blue-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>

                  {/* Workflow Suggestions */}
                  {message.suggestions && (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.map((suggestion) => (
                        <div key={suggestion.id} className="bg-slate-600/50 rounded-lg p-3 border border-slate-500">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-sm text-white">{suggestion.title}</h4>
                              <p className="text-xs text-slate-300">{suggestion.description}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              suggestion.difficulty === 'Beginner' ? 'bg-green-600/30 text-green-300' :
                              suggestion.difficulty === 'Intermediate' ? 'bg-yellow-600/30 text-yellow-300' :
                              'bg-red-600/30 text-red-300'
                            }`}>
                              {suggestion.difficulty}
                            </span>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs text-slate-400 mb-1">Workflow Steps:</div>
                            <div className="space-y-1">
                              {suggestion.steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <span className="w-4 h-4 bg-slate-500 rounded-full flex items-center justify-center text-white text-xs">
                                    {step.order}
                                  </span>
                                  {step.type === 'llm' ? <Brain size={12} className="text-purple-400" /> : <Package size={12} className="text-blue-400" />}
                                  <span className="text-slate-300">{step.component?.name || 'Component'}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {suggestion.estimatedTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target size={10} />
                                {suggestion.steps.length} steps
                              </span>
                            </div>
                            <button
                              onClick={() => handleApplySuggestion(suggestion)}
                              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs transition-colors flex items-center gap-1"
                            >
                              <CheckCircle size={12} />
                              Apply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Component Suggestions */}
                  {message.components && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-slate-400 mb-2">Recommended Components:</div>
                      {message.components.map((comp, index) => (
                        <div key={index} className="bg-slate-600/50 rounded-lg p-2 border border-slate-500 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {comp.type === 'llm' ? <Brain size={14} className="text-purple-400" /> : <Package size={14} className="text-blue-400" />}
                            <div>
                              <div className="text-sm font-medium text-white">{comp.component.name}</div>
                              <div className="text-xs text-slate-400">{comp.reason}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddComponent(comp.component, comp.type)}
                            className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-700 rounded-lg p-3 flex items-center gap-2">
                  <Bot size={16} className="text-purple-400" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-slate-600">
              <div className="text-xs text-slate-400 mb-2">Quick suggestions:</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-xs transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-600">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me about workflows, LLMs, or NPM packages..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWorkflowAdvisor;