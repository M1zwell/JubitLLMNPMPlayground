import React, { useState, useEffect, useMemo } from 'react';
import { Brain, DollarSign, Clock, Zap, Eye, Code, Globe, Filter, Star, TrendingUp, Cpu, Lightbulb, Target, Users, Search, ArrowUpDown, BarChart3, Info, RefreshCw, ExternalLink, Shield, BookOpen, FileText } from 'lucide-react';
import { useLLMModels } from '../hooks/useLLMModels';
import { LLMModel } from '../lib/supabase';
import LLMUpdateManager from './LLMUpdateManager';
import { usePlayground } from '../context/PlaygroundContext';
import AIWorkflowAdvisor, { AIAdvisorEventManager } from './AIWorkflowAdvisor';
import { useLanguage } from '../contexts/LanguageContext';

const CATEGORIES = {
  all: { name: 'All Models', icon: Globe, color: 'text-gray-400' },
  reasoning: { name: 'Reasoning', icon: Brain, color: 'text-purple-400' },
  coding: { name: 'Coding', icon: Code, color: 'text-blue-400' },
  multimodal: { name: 'Multimodal', icon: Eye, color: 'text-green-400' },
  lightweight: { name: 'Lightweight', icon: Zap, color: 'text-cyan-400' },
  budget: { name: 'Budget', icon: DollarSign, color: 'text-yellow-400' }
};

const PROVIDERS = {
  all: { name: 'All Providers', flag: '🌐' },
  'OpenAI': { 
    name: 'OpenAI', 
    flag: '🇺🇸', 
    homepage: 'https://openai.com',
    apiDocs: 'https://platform.openai.com/docs/overview',
    modelsDocs: 'https://platform.openai.com/docs/models'
  },
  'Anthropic': { 
    name: 'Anthropic', 
    flag: '🇺🇸',
    homepage: 'https://www.anthropic.com',
    apiDocs: 'https://docs.anthropic.com/en/api/overview',
    modelsDocs: 'https://docs.anthropic.com/en/docs/about-claude'
  },
  'Google': { 
    name: 'Google', 
    flag: '🇺🇸',
    homepage: 'https://ai.google.dev',
    apiDocs: 'https://ai.google.dev/api',
    modelsDocs: 'https://ai.google.dev/api/models'
  },
  'Meta': { 
    name: 'Meta', 
    flag: '🇺🇸',
    homepage: 'https://llama.meta.com',
    apiDocs: 'https://llama.meta.com/docs/overview',
    modelsDocs: 'https://llama.meta.com/docs/model-cards'
  },
  'DeepSeek': { 
    name: 'DeepSeek', 
    flag: '🇨🇳',
    homepage: 'https://www.deepseek.com',
    apiDocs: 'https://api-docs.deepseek.com/',
    modelsDocs: 'https://api-docs.deepseek.com/quick_start/pricing'
  },
  'Alibaba': { 
    name: 'Alibaba', 
    flag: '🇨🇳',
    homepage: 'https://qianwen.aliyun.com',
    apiDocs: 'https://help.aliyun.com/zh/dashscope/developer-reference/api-details',
    modelsDocs: 'https://help.aliyun.com/zh/dashscope/developer-reference/model-introduction'
  },
  'Mistral': { 
    name: 'Mistral', 
    flag: '🇫🇷',
    homepage: 'https://mistral.ai',
    apiDocs: 'https://docs.mistral.ai/api/',
    modelsDocs: 'https://docs.mistral.ai/getting-started/models/'
  },
  'xAI': { 
    name: 'xAI', 
    flag: '🇺🇸',
    homepage: 'https://x.ai',
    apiDocs: 'https://docs.x.ai/docs/overview',
    modelsDocs: 'https://docs.x.ai/docs/models'
  },
  'Amazon': { 
    name: 'Amazon', 
    flag: '🇺🇸',
    homepage: 'https://aws.amazon.com/bedrock',
    apiDocs: 'https://docs.aws.amazon.com/bedrock/latest/APIReference/',
    modelsDocs: 'https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters.html'
  },
  'Microsoft': { 
    name: 'Microsoft', 
    flag: '🇺🇸',
    homepage: 'https://azure.microsoft.com/en-us/products/ai-services/openai-service',
    apiDocs: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/reference',
    modelsDocs: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models'
  }
};

const SORT_OPTIONS = [
  { value: 'qualityIndex', label: 'Quality Index', desc: true },
  { value: 'inputPrice', label: 'Input Price', desc: false },
  { value: 'outputPrice', label: 'Output Price', desc: false },
  { value: 'outputSpeed', label: 'Output Speed', desc: true },
  { value: 'latency', label: 'Latency', desc: false },
  { value: 'contextWindow', label: 'Context Window', desc: true },
  { value: 'name', label: 'Name', desc: false }
];

const EnhancedLLMMarket = () => {
  const { models: LLM_MODELS, loading, error } = useLLMModels();
  const { language, t } = useLanguage();
  const { actions } = usePlayground();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('qualityIndex');
  const [sortDesc, setSortDesc] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [qualityRange, setQualityRange] = useState([0, 100]);
  const [showUpdateManager, setShowUpdateManager] = useState(false);

  // Initialize price and quality ranges based on data
  useEffect(() => {
    if (LLM_MODELS.length > 0) {
      const prices = LLM_MODELS.map(m => m.outputPrice || 0);
      const qualities = LLM_MODELS.map(m => m.qualityIndex || 0);
      
      setPriceRange([0, Math.max(...prices)]);
      setQualityRange([Math.min(...qualities), Math.max(...qualities)]);
    }
  }, [LLM_MODELS]);

  // Filter and sort models
  const filteredModels = useMemo(() => {
    let filtered = LLM_MODELS.filter(model => {
      // Search filter
      if (searchTerm && !model.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !model.provider.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const categories = model.categories || [];
        if (!categories.includes(selectedCategory)) {
          return false;
        }
      }

      // Provider filter
      if (selectedProvider !== 'all' && model.provider !== selectedProvider) {
        return false;
      }

      // Price filter
      const price = model.outputPrice || 0;
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }

      // Quality filter
      const quality = model.qualityIndex || 0;
      if (quality < qualityRange[0] || quality > qualityRange[1]) {
        return false;
      }

      return true;
    });

    // Sort models
    filtered.sort((a, b) => {
      let aVal = a[sortBy as keyof LLMModel] || 0;
      let bVal = b[sortBy as keyof LLMModel] || 0;

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (sortDesc) {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [LLM_MODELS, searchTerm, selectedCategory, selectedProvider, sortBy, sortDesc, priceRange, qualityRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredModels.length;
    const avgQuality = filteredModels.reduce((sum, m) => sum + (m.qualityIndex || 0), 0) / total || 0;
    const avgPrice = filteredModels.reduce((sum, m) => sum + (m.outputPrice || 0), 0) / total || 0;
    const openSource = filteredModels.filter(m => m.openSource).length;

    return { total, avgQuality, avgPrice, openSource };
  }, [filteredModels]);

  const renderProviderLink = (provider: string) => {
    const providerInfo = PROVIDERS[provider as keyof typeof PROVIDERS];
    if (!providerInfo || provider === 'all') return null;

    return (
      <a
        href={providerInfo.homepage}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        title={`Visit ${providerInfo.name} homepage`}
      >
        <div className="flex items-center justify-between gap-2">
          <Globe className="icon" />
          <span className="text-sm font-medium">{provider.name}</span>
        </div>
      </a>
    );
  };

  const renderModelCard = (model: LLMModel) => {
    const categoryInfo = CATEGORIES[model.categories?.[0] as keyof typeof CATEGORIES] || CATEGORIES.all;
    const CategoryIcon = categoryInfo.icon;

    return (
      <div key={model.id} className="card hover:shadow-lg transition-all duration-200 group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <CategoryIcon className={`icon ${categoryInfo.color}`} />
            <div>
              <h3 className="font-semibold text-primary group-hover:text-blue-400 transition-colors">
                {model.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <span>{PROVIDERS[model.provider as keyof typeof PROVIDERS]?.flag}</span>
                <span>{model.provider}</span>
                {model.openSource && (
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                    Open Source
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="icon-sm text-yellow-400" />
            <span className="text-sm font-medium">{model.qualityIndex?.toFixed(1) || 'N/A'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xs text-secondary mb-1">Input Price</div>
            <div className="text-sm font-medium text-primary">
              ${model.inputPrice?.toFixed(2) || 'N/A'}/1M
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-secondary mb-1">Output Price</div>
            <div className="text-sm font-medium text-primary">
              ${model.outputPrice?.toFixed(2) || 'N/A'}/1M
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-secondary mb-1">Speed</div>
            <div className="text-sm font-medium text-primary">
              {model.outputSpeed?.toFixed(0) || 'N/A'} tok/s
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-secondary mb-1">Context</div>
            <div className="text-sm font-medium text-primary">
              {model.contextWindow ? `${(model.contextWindow / 1000).toFixed(0)}K` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => actions.setModel(model.name)}
            className="btn btn-primary flex-1"
          >
            <Zap className="icon-sm" />
            Try Model
          </button>
          {renderProviderLink(model.provider)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-secondary">Loading models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-4">Error loading models: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          <RefreshCw className="icon-sm" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-primary mb-2">
          🧠 {language === 'en' ? 'AI Model Marketplace' : 'AI 模型市场'}
        </h1>
        <p className="text-base text-secondary mb-1">
          {language === 'en' 
            ? `Compare ${LLM_MODELS.length} LLM models • Real data from artificialanalysis.ai` 
            : `比较 ${LLM_MODELS.length} 个 LLM 模型 • 来自 artificialanalysis.ai 的真实数据`}
        </p>
        <div className="text-xs text-tertiary">
          {language === 'en' 
            ? 'Quality indices, pricing, and performance metrics updated regularly' 
            : '质量指标、价格和性能指标定期更新'}
        </div>
      </div>

      {/* AI Workflow Advisor */}
      <div className="mb-8">
        <AIWorkflowAdvisor />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card compact text-center">
          <div className="stat">
            <div className="stat-value text-primary">{stats.total}</div>
            <div className="stat-label">{language === 'en' ? 'Models Found' : '找到的模型'}</div>
          </div>
        </div>
        <div className="card compact text-center">
          <div className="stat">
            <div className="stat-value text-success">{stats.avgQuality.toFixed(1)}</div>
            <div className="stat-label">{language === 'en' ? 'Avg Quality' : '平均质量'}</div>
          </div>
        </div>
        <div className="card compact text-center">
          <div className="stat">
            <div className="stat-value text-warning">${stats.avgPrice.toFixed(2)}</div>
            <div className="stat-label">{language === 'en' ? 'Avg Price/1M' : '平均价格/1M'}</div>
          </div>
        </div>
        <div className="card compact text-center">
          <div className="stat">
            <div className="stat-value text-primary">{stats.openSource}</div>
            <div className="stat-label">{language === 'en' ? 'Open Source' : '开源'}</div>
          </div>
        </div>
      </div>

      {/* Data Manager Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowUpdateManager(!showUpdateManager)}
          className="btn btn-primary"
        >
          <RefreshCw className="icon-sm" />
          {language === 'en' ? 'Data Manager' : '数据管理器'}
        </button>
      </div>

      {/* Update Manager */}
      {showUpdateManager && (
        <div className="mb-8">
          <LLMUpdateManager />
        </div>
      )}

      {/* Filters */}
      <div className="card compact-lg mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="icon" />
          <h3 className="text-base font-medium text-primary">{t('filter')}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted icon-sm" />
            <input
              type="text"
              placeholder={language === 'en' ? "Search models..." : "搜索模型..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-8"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input"
          >
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{language === 'en' ? category.name : t(key as any)}</option>
            ))}
          </select>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="input"
          >
            {Object.entries(PROVIDERS).map(([key, provider]) => (
              <option key={key} value={key}>{provider.flag} {provider.name}</option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input flex-1"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {language === 'en' ? option.label : (
                    option.value === 'qualityIndex' ? '质量指数' :
                    option.value === 'inputPrice' ? '输入价格' :
                    option.value === 'outputPrice' ? '输出价格' :
                    option.value === 'outputSpeed' ? '输出速度' :
                    option.value === 'latency' ? '延迟' :
                    option.value === 'contextWindow' ? '上下文窗口' :
                    option.value === 'name' ? '名称' : option.label
                  )}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="btn btn-secondary compact-xs"
            >
              <ArrowUpDown className="icon" />
            </button>
          </div>
        </div>

        {/* Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">
              {language === 'en' ? `Output Price Range: $${priceRange[0]} - $${priceRange[1]}` : `输出价格范围: $${priceRange[0]} - $${priceRange[1]}`}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-secondary">
              {language === 'en' ? `Quality Range: ${qualityRange[0]} - ${qualityRange[1]}` : `质量范围: ${qualityRange[0]} - ${qualityRange[1]}`}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={qualityRange[1]}
              onChange={(e) => setQualityRange([qualityRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map(renderModelCard)}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <div className="text-secondary mb-4">No models found matching your criteria</div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedProvider('all');
            }}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedLLMMarket;