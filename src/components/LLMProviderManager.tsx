import React, { useState, useEffect } from 'react';
import { Brain, Key, Shield, CheckCircle, AlertTriangle, Eye, EyeOff, Plus, X, Globe, Zap } from 'lucide-react';

interface LLMProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  apiKeyRequired: boolean;
  models: string[];
  pricing: {
    input: number;
    output: number;
    unit: string;
  };
  features: string[];
  status: 'connected' | 'disconnected' | 'error';
  apiKey?: string;
}

const AVAILABLE_PROVIDERS: LLMProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    description: 'Advanced GPT models with superior reasoning capabilities',
    apiKeyRequired: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini'],
    pricing: { input: 2.50, output: 10.00, unit: 'per 1M tokens' },
    features: ['Function Calling', 'Vision', 'Code Generation', 'Reasoning'],
    status: 'disconnected'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🧠',
    description: 'Claude models optimized for safety and helpfulness',
    apiKeyRequired: true,
    models: ['claude-3.5-sonnet', 'claude-3.5-haiku', 'claude-3-opus'],
    pricing: { input: 3.00, output: 15.00, unit: 'per 1M tokens' },
    features: ['Long Context', 'Safety First', 'Document Analysis', 'Coding'],
    status: 'disconnected'
  },
  {
    id: 'google',
    name: 'Google AI',
    icon: '⚡',
    description: 'Gemini models with multimodal capabilities',
    apiKeyRequired: true,
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-flash'],
    pricing: { input: 1.25, output: 5.00, unit: 'per 1M tokens' },
    features: ['Multimodal', 'Fast Inference', 'Large Context', 'Cost Effective'],
    status: 'disconnected'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔍',
    description: 'High-performance reasoning models from China',
    apiKeyRequired: true,
    models: ['deepseek-v3', 'deepseek-coder', 'deepseek-r1'],
    pricing: { input: 0.14, output: 0.28, unit: 'per 1M tokens' },
    features: ['Advanced Reasoning', 'Code Generation', 'Cost Efficient', 'Fast'],
    status: 'disconnected'
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    icon: '🏠',
    description: 'Run open-source models locally on your machine',
    apiKeyRequired: false,
    models: ['llama3', 'mistral', 'codellama', 'phi3'],
    pricing: { input: 0, output: 0, unit: 'free local inference' },
    features: ['Privacy First', 'No API Costs', 'Offline Usage', 'Open Source'],
    status: 'disconnected'
  },
  {
    id: 'xai',
    name: 'xAI',
    icon: '❌',
    description: 'Grok models with real-time information access',
    apiKeyRequired: true,
    models: ['grok-beta', 'grok-vision-beta'],
    pricing: { input: 5.00, output: 15.00, unit: 'per 1M tokens' },
    features: ['Real-time Data', 'Humor & Wit', 'Uncensored', 'Twitter Integration'],
    status: 'disconnected'
  }
];

interface LLMProviderManagerProps {
  onProvidersUpdate?: (providers: LLMProvider[]) => void;
}

const LLMProviderManager: React.FC<LLMProviderManagerProps> = ({ onProvidersUpdate }) => {
  const [providers, setProviders] = useState<LLMProvider[]>(AVAILABLE_PROVIDERS);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isTestingConnection, setIsTestingConnection] = useState<Record<string, boolean>>({});

  // Load saved API keys from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('llm-provider-keys');
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys);
        setApiKeys(keys);
        
        // Update provider status based on saved keys
        setProviders(prev => prev.map(provider => ({
          ...provider,
          status: keys[provider.id] ? 'connected' : 'disconnected',
          apiKey: keys[provider.id]
        })));
      } catch (error) {
        console.error('Failed to load saved API keys:', error);
      }
    }
  }, []);

  // Save API keys to localStorage
  const saveApiKeys = (keys: Record<string, string>) => {
    try {
      localStorage.setItem('llm-provider-keys', JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to save API keys:', error);
    }
  };

  // Test provider connection
  const testConnection = async (providerId: string) => {
    setIsTestingConnection(prev => ({ ...prev, [providerId]: true }));
    
    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would make an actual API call
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      setProviders(prev => prev.map(provider =>
        provider.id === providerId
          ? { ...provider, status: success ? 'connected' : 'error' }
          : provider
      ));
      
      if (success) {
        // Save the API key
        const newKeys = { ...apiKeys, [providerId]: apiKeys[providerId] };
        saveApiKeys(newKeys);
      }
      
    } catch (error) {
      setProviders(prev => prev.map(provider =>
        provider.id === providerId
          ? { ...provider, status: 'error' }
          : provider
      ));
    } finally {
      setIsTestingConnection(prev => ({ ...prev, [providerId]: false }));
    }
  };

  // Update API key
  const updateApiKey = (providerId: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: key }));
    
    // Reset provider status when key changes
    setProviders(prev => prev.map(provider =>
      provider.id === providerId
        ? { ...provider, status: 'disconnected', apiKey: key }
        : provider
    ));
  };

  // Remove provider connection
  const disconnectProvider = (providerId: string) => {
    const newKeys = { ...apiKeys };
    delete newKeys[providerId];
    setApiKeys(newKeys);
    saveApiKeys(newKeys);
    
    setProviders(prev => prev.map(provider =>
      provider.id === providerId
        ? { ...provider, status: 'disconnected', apiKey: undefined }
        : provider
    ));
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  // Notify parent component of provider updates
  useEffect(() => {
    if (onProvidersUpdate) {
      onProvidersUpdate(providers);
    }
  }, [providers, onProvidersUpdate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <AlertTriangle className="text-red-500" size={16} />;
      default:
        return <div className="w-4 h-4 bg-gray-400 dark:bg-gray-600 rounded-full"></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'border-green-400/50 dark:border-green-400/50 bg-green-100/50 dark:bg-green-600/10';
      case 'error':
        return 'border-red-400/50 dark:border-red-400/50 bg-red-100/50 dark:bg-red-600/10';
      default:
        return 'border-gray-300/50 dark:border-gray-600/50 bg-gray-100/50 dark:bg-gray-800/30';
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-slate-600">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-900 dark:text-white">
          <Brain className="text-teal-500 dark:text-teal-400" />
          LLM Provider Management
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-600 dark:text-slate-400">
          {providers.filter(p => p.status === 'connected').length} of {providers.length} connected
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {providers.map(provider => (
          <div 
            key={provider.id}
            className={`rounded-lg p-4 border transition-all duration-200 ${getStatusColor(provider.status)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{provider.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400">{provider.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(provider.status)}
                {provider.status === 'connected' && (
                  <button
                    onClick={() => disconnectProvider(provider.id)}
                    className="text-red-400 hover:text-red-300 p-1 rounded"
                    title="Disconnect"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* API Key Input */}
            {provider.apiKeyRequired && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  API Key
                  <Shield className="inline ml-1" size={12} />
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys[provider.id] ? "text" : "password"}
                    value={apiKeys[provider.id] || ''}
                    onChange={(e) => updateApiKey(provider.id, e.target.value)}
                    placeholder={`Enter your ${provider.name} API key...`}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-gray-900 dark:text-white placeholder-slate-400 text-sm pr-10"
                  />
                  <button
                    onClick={() => toggleApiKeyVisibility(provider.id)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-slate-400 hover:text-slate-300"
                  >
                    {showApiKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Models */}
            <div className="mb-3">
              <div className="text-sm font-medium mb-2 text-slate-300">Available Models</div>
              <div className="flex flex-wrap gap-1">
                {provider.models.slice(0, 3).map(model => (
                  <span 
                    key={model}
                    className="bg-slate-700/50 px-2 py-1 rounded text-xs text-slate-300"
                  >
                    {model}
                  </span>
                ))}
                {provider.models.length > 3 && (
                  <span className="text-xs text-gray-600 dark:text-slate-400">
                    +{provider.models.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="mb-3">
              <div className="text-sm font-medium mb-2 text-slate-300">Features</div>
              <div className="flex flex-wrap gap-1">
                {provider.features.slice(0, 3).map(feature => (
                  <span 
                    key={feature}
                    className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2 text-slate-300">Pricing</div>
              <div className="text-xs text-gray-600 dark:text-slate-400">
                {provider.pricing.input > 0 ? (
                  <>Input: ${provider.pricing.input} • Output: ${provider.pricing.output} {provider.pricing.unit}</>
                ) : (
                  <span className="text-green-400">Free (Local Inference)</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {provider.status === 'disconnected' && (
                <button
                  onClick={() => testConnection(provider.id)}
                  disabled={provider.apiKeyRequired && !apiKeys[provider.id] || isTestingConnection[provider.id]}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isTestingConnection[provider.id] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Connect
                    </>
                  )}
                </button>
              )}
              
              {provider.status === 'connected' && (
                <button
                  onClick={() => testConnection(provider.id)}
                  disabled={isTestingConnection[provider.id]}
                  className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={14} />
                  Connected
                </button>
              )}
              
              {provider.status === 'error' && (
                <button
                  onClick={() => testConnection(provider.id)}
                  disabled={isTestingConnection[provider.id]}
                  className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={14} />
                  Retry
                </button>
              )}

              {provider.name === 'Ollama (Local)' && (
                <button className="bg-teal-600/20 hover:bg-teal-600/30 px-3 py-2 rounded text-sm transition-colors flex items-center gap-1">
                  <Globe size={14} />
                  Install
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-slate-600">
        <h3 className="font-bold mb-3 text-slate-300">Connection Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {providers.filter(p => p.status === 'connected').length}
            </div>
            <div className="text-gray-600 dark:text-slate-400">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {providers.filter(p => p.status === 'connected').reduce((sum, p) => sum + p.models.length, 0)}
            </div>
            <div className="text-gray-600 dark:text-slate-400">Models Available</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-teal-400">
              ${providers.filter(p => p.status === 'connected' && p.pricing.input > 0).reduce((min, p) => Math.min(min, p.pricing.input), Infinity).toFixed(2)}
            </div>
            <div className="text-gray-600 dark:text-slate-400">Lowest Cost (1M tokens)</div>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="mt-4 text-xs text-gray-600 dark:text-slate-400">
        <p>💡 <strong>Tip:</strong> API keys are stored securely in your browser's local storage. Connect multiple providers to access more models and features.</p>
      </div>
    </div>
  );
};

export default LLMProviderManager;