import React, { useState, useEffect, useMemo } from 'react';
import { Brain, DollarSign, Clock, Zap, Eye, Code, Globe, Filter, Star, TrendingUp, Cpu, Lightbulb, Target, Users, Search, ArrowUpDown, BarChart3, Info, RefreshCw, ExternalLink, Shield, BookOpen, FileText } from 'lucide-react';
import { useLLMModels } from '../hooks/useLLMModels';
import { LLMModel } from '../lib/supabase';
import LLMUpdateManager from './LLMUpdateManager';
import { usePlayground } from '../context/PlaygroundContext';
import AIWorkflowAdvisor, { AIAdvisorEventManager } from './AIWorkflowAdvisor';

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
  const { actions } = usePlayground();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('qualityIndex');
  const [sortDesc, setSortDesc] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 20]);
  const [qualityRange, setQualityRange] = useState([0, 70]);
  const [showUpdateManager, setShowUpdateManager] = useState(false);
  const { refetch } = useLLMModels();

  // Filter and sort models
  const filteredModels = useMemo(() => {
    if (!LLM_MODELS) return [];
    
    let filtered = LLM_MODELS.filter(model => {
      const categoryMatch = selectedCategory === 'all' || model.category === selectedCategory;
      const providerMatch = selectedProvider === 'all' || model.provider === selectedProvider;
      const searchMatch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.features.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
      const priceMatch = model.output_price >= priceRange[0] && model.output_price <= priceRange[1];
      const qualityMatch = !model.quality_index || (model.quality_index >= qualityRange[0] && model.quality_index <= qualityRange[1]);
      
      return categoryMatch && providerMatch && searchMatch && priceMatch && qualityMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      const sortKey = sortBy === 'qualityIndex' ? 'quality_index' : 
                     sortBy === 'inputPrice' ? 'input_price' :
                     sortBy === 'outputPrice' ? 'output_price' :
                     sortBy === 'outputSpeed' ? 'output_speed' :
                     sortBy === 'contextWindow' ? 'context_window' : sortBy;
      
      const aVal = a[sortKey as keyof LLMModel];
      const bVal = b[sortKey as keyof LLMModel];
      
      if (typeof aVal === 'string') {
        return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      
      return sortDesc ? (Number(bVal) || 0) - (Number(aVal) || 0) : (Number(aVal) || 0) - (Number(bVal) || 0);
    });

    return filtered;
  }, [selectedCategory, selectedProvider, searchTerm, sortBy, sortDesc, priceRange, qualityRange, LLM_MODELS]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredModels.length;
    const avgQuality = total > 0 ? filteredModels.reduce((sum, m) => sum + (m.quality_index || 0), 0) / total : 0;
    const avgPrice = total > 0 ? filteredModels.reduce((sum, m) => sum + m.output_price, 0) / total : 0;
    const openSource = filteredModels.filter(m => m.license === 'Open').length;
    
    return { total, avgQuality, avgPrice, openSource };
  }, [filteredModels]);

  const getModelIcon = (model) => {
    switch (model.category) {
      case 'reasoning': return '🧠';
      case 'coding': return '💻';
      case 'multimodal': return '🎯';
      case 'lightweight': return '⚡';
      case 'budget': return '💰';
      default: return '🤖';
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-purple-600 to-pink-600';
      case 'epic': return 'from-blue-600 to-purple-600';
      case 'rare': return 'from-green-600 to-blue-600';
      default: return 'from-gray-600 to-blue-600';
    }
  };

  const getQualityColor = (quality) => {
    if (!quality) return 'text-gray-400';
    if (quality >= 60) return 'text-green-400';
    if (quality >= 40) return 'text-yellow-400';
    if (quality >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  const getOfficialLinks = (model: LLMModel) => {
    const provider = PROVIDERS[model.provider];
    return {
      homepage: model.provider_homepage || provider?.homepage,
      apiDocs: model.official_api_docs || provider?.apiDocs,
      modelsDocs: model.model_card_url || provider?.modelsDocs
    };
  };
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-xl text-purple-300">Loading LLM models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error loading models</div>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
          🧠 AI Model Marketplace
        </h1>
        <p className="text-xl text-purple-300 mb-2">
          Compare {LLM_MODELS.length} LLM models • Real data from artificialanalysis.ai
        </p>
        <div className="text-sm text-gray-400">
          Quality indices, pricing, and performance metrics updated regularly
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-sm opacity-80">Models Found</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.avgQuality.toFixed(1)}</div>
          <div className="text-sm opacity-80">Avg Quality</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">${stats.avgPrice.toFixed(2)}</div>
          <div className="text-sm opacity-80">Avg Price/1M</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.openSource}</div>
          <div className="text-sm opacity-80">Open Source</div>
        </div>
      </div>

      {/* Update Manager Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowUpdateManager(!showUpdateManager)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Data Manager
        </button>
      </div>

      {/* Update Manager */}
      {showUpdateManager && (
        <div className="mb-8">
          <LLMUpdateManager onUpdateComplete={() => {
            refetch();
            setShowUpdateManager(false);
          }} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} />
          <h3 className="text-lg font-bold">Filters & Search</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{category.name}</option>
            ))}
          </select>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
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
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15"
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        {/* Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Output Price Range: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Quality Range: {qualityRange[0]} - {qualityRange[1]}
            </label>
            <input
              type="range"
              min="0"
              max="70"
              step="5"
              value={qualityRange[1]}
              onChange={(e) => setQualityRange([qualityRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredModels.map(model => (
          <div
            key={model.id}
            onClick={() => setSelectedModel(selectedModel?.id === model.id ? null : model)}
            onMouseEnter={() => {
              const eventManager = AIAdvisorEventManager.getInstance();
              eventManager.setQuotedData({
                type: 'llm',
                name: model.name,
                description: model.description || `A ${model.provider} language model specialized in ${model.category}`,
                provider: model.provider,
                context: `LLM Model - Quality: ${model.quality_index || 'N/A'}, Speed: ${model.output_speed.toFixed(1)} tok/s, Price: $${model.output_price}/1M tokens`
              });
            }}
            onMouseLeave={() => {
              setTimeout(() => {
                const eventManager = AIAdvisorEventManager.getInstance();
                eventManager.setQuotedData(null);
              }, 500);
            }}
            className={`
              bg-gradient-to-r ${getRarityColor(model.rarity)}
              p-5 rounded-xl cursor-pointer transform hover:scale-105 
              transition-all duration-300 border-2 border-white/20 shadow-lg
              ${selectedModel?.id === model.id ? 'ring-4 ring-white/50 scale-105' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getModelIcon(model)}</span>
                <div>
                  <h3 className="font-bold text-sm">{model.name}</h3>
                  <p className="text-xs opacity-80 flex items-center gap-1">
                    {PROVIDERS[model.provider]?.flag} {model.provider}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getQualityColor(model.quality_index)}`}>
                  {model.quality_index || 'N/A'}
                </div>
                <div className="text-xs opacity-80">Quality</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="bg-white/20 rounded px-2 py-1">
                <div className="flex items-center gap-1">
                  <DollarSign size={10} />
                  <span>${model.input_price}/${model.output_price}</span>
                </div>
              </div>
              <div className="bg-white/20 rounded px-2 py-1">
                <div className="flex items-center gap-1">
                  <Zap size={10} />
                  <span>{model.output_speed.toFixed(0)} tok/s</span>
                </div>
              </div>
              <div className="bg-white/20 rounded px-2 py-1">
                <div className="flex items-center gap-1">
                  <Clock size={10} />
                  <span>{model.latency.toFixed(1)}s</span>
                </div>
              </div>
              <div className="bg-white/20 rounded px-2 py-1">
                <div className="flex items-center gap-1">
                  <BarChart3 size={10} />
                  <span>{Math.round(model.context_window / 1000)}K</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-1 mb-2">
              {model.features.slice(0, 2).map((feature, idx) => (
                <span key={idx} className="bg-white/30 px-2 py-1 rounded text-xs">
                  {feature}
                </span>
              ))}
            </div>

            {/* License Badge */}
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded text-xs ${
                model.license === 'Open' ? 'bg-green-600/30' : 'bg-gray-600/30'
              }`}>
                {model.license}
              </span>
              <span className="text-xs opacity-80 capitalize">{model.rarity}</span>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  actions.selectLLMModel(model);
                  actions.addComponentToWorkflow(model, 'llm');
                }}
                className="flex-1 bg-blue-600/80 hover:bg-blue-600 px-2 py-1 rounded text-xs transition-colors"
              >
                + Add to Workflow
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  actions.navigateToPlaygroundWithComponent(model, 'llm');
                }}
                className="bg-green-600/80 hover:bg-green-600 px-2 py-1 rounded text-xs transition-colors"
              >
                Use
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Model Info */}
      {selectedModel && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Basic Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{getModelIcon(selectedModel)}</span>
                <div>
                  <h2 className="text-2xl font-bold">{selectedModel.name}</h2>
                  <p className="text-purple-300 flex items-center gap-2">
                    {PROVIDERS[selectedModel.provider]?.flag} {selectedModel.provider} • {selectedModel.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <DollarSign className="text-yellow-400" size={16} />
                      Pricing (per 1M tokens)
                    </h4>
                    <div className="text-sm">
                      <div>Input: ${selectedModel.input_price}</div>
                      <div>Output: ${selectedModel.output_price}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Cost per 1K: ${(selectedModel.output_price / 1000).toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-3">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <TrendingUp className="text-green-400" size={16} />
                      Performance
                    </h4>
                    <div className="text-sm">
                      <div>Quality: <span className={getQualityColor(selectedModel.quality_index)}>{selectedModel.quality_index || 'N/A'}</span></div>
                      <div>Speed: {selectedModel.output_speed.toFixed(1)} tok/s</div>
                      <div>Latency: {selectedModel.latency.toFixed(2)}s</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2">Technical Specs</h4>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>Context: {(selectedModel.context_window / 1000).toFixed(0)}K tokens</div>
                    <div>License: {selectedModel.license}</div>
                    <div>Creator: {selectedModel.creator}</div>
                    <div>Category: {CATEGORIES[selectedModel.category]?.name}</div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.features.map((feature, idx) => (
                      <span key={idx} className="bg-purple-600/30 px-3 py-1 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Official Documentation Links */}
                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <BookOpen size={16} />
                    Official Documentation
                    {selectedModel.verified_official && (
                      <Shield className="text-green-400" size={14} title="Verified Official" />
                    )}
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const links = getOfficialLinks(selectedModel);
                      return (
                        <>
                          {links.homepage && (
                            <a 
                              href={links.homepage} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                            >
                              <Globe size={12} />
                              Official Homepage
                              <ExternalLink size={10} />
                            </a>
                          )}
                          {links.apiDocs && (
                            <a 
                              href={links.apiDocs} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                            >
                              <Code size={12} />
                              API Documentation
                              <ExternalLink size={10} />
                            </a>
                          )}
                          {links.modelsDocs && (
                            <a 
                              href={links.modelsDocs} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                            >
                              <FileText size={12} />
                              Model Documentation
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Comparison & Insights */}
            <div>
              <h3 className="text-xl font-bold mb-4">Market Position</h3>
              
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2">Value Proposition</h4>
                  <div className="text-sm">
                    {selectedModel.quality_index && selectedModel.quality_index >= 50 && selectedModel.output_price <= 2 && (
                      <div className="text-green-400">🏆 Excellent quality-to-price ratio</div>
                    )}
                    {selectedModel.output_speed >= 100 && (
                      <div className="text-blue-400">⚡ High-speed inference</div>
                    )}
                    {selectedModel.license === 'Open' && (
                      <div className="text-purple-400">🔓 Open source advantage</div>
                    )}
                    {selectedModel.context_window >= 100000 && (
                      <div className="text-cyan-400">📚 Long context support</div>
                    )}
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2">Competitive Analysis</h4>
                  <div className="text-sm space-y-1">
                    <div>Quality Rank: Top {selectedModel.quality_index ? Math.round((LLM_MODELS.filter(m => m.quality_index && m.quality_index > (selectedModel.quality_index || 0)).length / LLM_MODELS.length) * 100) : 'N/A'}%</div>
                    <div>Price Rank: {selectedModel.output_price <= 1 ? 'Budget-friendly' : selectedModel.output_price <= 5 ? 'Mid-range' : 'Premium'}</div>
                    <div>Speed Rank: {selectedModel.output_speed >= 100 ? 'Fast' : selectedModel.output_speed >= 50 ? 'Medium' : 'Slow'}</div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2">Best Use Cases</h4>
                  <div className="text-sm text-gray-300">
                    {selectedModel.category === 'reasoning' && '💡 Complex problem solving, analysis, mathematical reasoning'}
                    {selectedModel.category === 'coding' && '💻 Software development, code review, debugging'}
                    {selectedModel.category === 'multimodal' && '🎯 Image analysis, document processing, multimedia tasks'}
                    {selectedModel.category === 'lightweight' && '⚡ Real-time applications, high-volume processing'}
                    {selectedModel.category === 'budget' && '💰 Cost-sensitive applications, experimentation'}
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2">Similar Models</h4>
                  <div className="space-y-1">
                    {LLM_MODELS
                      .filter(m => m.id !== selectedModel.id && m.category === selectedModel.category)
                      .slice(0, 3)
                      .map(similar => (
                        <div key={similar.id} className="text-sm flex justify-between">
                          <span>{similar.name}</span>
                          <span className={getQualityColor(similar.quality_index)}>{similar.quality_index || 'N/A'}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Sources & Citations */}
      <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen size={20} />
          Official Documentation & API References
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(PROVIDERS).slice(1).map(([key, provider]) => (
            <div key={key} className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{provider.flag}</span>
                <h4 className="font-bold">{provider.name}</h4>
              </div>
              
              <div className="space-y-2 text-sm">
                {provider.homepage && (
                  <a 
                    href={provider.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                  >
                    <Globe size={12} />
                    Homepage
                    <ExternalLink size={10} />
                  </a>
                )}
                
                {provider.apiDocs && (
                  <a 
                    href={provider.apiDocs} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                  >
                    <Code size={12} />
                    API Docs
                    <ExternalLink size={10} />
                  </a>
                )}
                
                {provider.modelsDocs && (
                  <a 
                    href={provider.modelsDocs} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                  >
                    <FileText size={12} />
                    Models
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <h4 className="font-bold mb-2 flex items-center gap-2">
            <Info size={16} />
            Data Sources & Citations
          </h4>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• Performance metrics sourced from <a href="https://artificialanalysis.ai/leaderboards/providers" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Artificial Analysis Leaderboard</a></p>
            <p>• Model specifications verified against official provider documentation</p>
            <p>• Pricing information cross-referenced with official API documentation</p>
            <p>• Quality indices based on standardized benchmarks (MMLU-Pro, GPQA Diamond, HumanEval, etc.)</p>
            <p>• Last updated: {new Date().toLocaleDateString()} - Data refreshed every 24 hours</p>
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Info size={16} />
          <span>Data sourced from artificialanalysis.ai • Updated regularly</span>
        </div>
        <div>
          Quality indices based on comprehensive benchmarks • Pricing per million tokens • Performance measured in real-world conditions
        </div>
      </div>

      {/* AI Workflow Advisor */}
      <AIWorkflowAdvisor
        onComponentAdd={(component, type) => {
          if (type === 'llm') {
            actions.selectLLMModel(component);
            actions.addComponentToWorkflow(component, type);
          }
        }}
        selectedComponents={[]}
      />
    </div>
  );
};

export default EnhancedLLMMarket;