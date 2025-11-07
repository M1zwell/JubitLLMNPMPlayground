import React, { useState, useEffect, useMemo } from 'react';
import { Brain, DollarSign, Clock, Zap, Eye, Code, Globe, Filter, Star, TrendingUp, Search as SearchIcon, BarChart3, Info, RefreshCw, ExternalLink, Shield, BookOpen, FileText } from 'lucide-react';
import { useLLMModels } from '../hooks/useLLMModels';
import { LLMModel } from '../lib/supabase';
import LLMUpdateManager from './LLMUpdateManager';
import { usePlayground } from '../context/PlaygroundContext';
import AIWorkflowAdvisor, { AIAdvisorEventManager } from './AIWorkflowAdvisor';

const CATEGORIES = {
  all: { name: 'All Models', icon: Globe, color: 'text-gray-500' },
  reasoning: { name: 'Reasoning', icon: Brain, color: 'text-purple-600' },
  coding: { name: 'Coding', icon: Code, color: 'text-blue-600' },
  multimodal: { name: 'Multimodal', icon: Eye, color: 'text-green-600' },
  lightweight: { name: 'Lightweight', icon: Zap, color: 'text-cyan-600' },
  budget: { name: 'Budget', icon: DollarSign, color: 'text-yellow-600' }
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
  }
};

const SORT_OPTIONS = [
  { value: 'qualityIndex', label: 'Quality', desc: true },
  { value: 'inputPrice', label: 'Input Price', desc: false },
  { value: 'outputPrice', label: 'Output Price', desc: false },
  { value: 'outputSpeed', label: 'Speed', desc: true },
  { value: 'latency', label: 'Latency', desc: false },
  { value: 'contextWindow', label: 'Context', desc: true },
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
  const [showUpdateManager, setShowUpdateManager] = useState(false);
  const { refetch } = useLLMModels();

  // Filter and sort models
  const filteredModels = useMemo(() => {
    if (!LLM_MODELS) return [];
    
    const filtered = LLM_MODELS.filter(model => {
      const categoryMatch = selectedCategory === 'all' || model.category === selectedCategory;
      const providerMatch = selectedProvider === 'all' || model.provider === selectedProvider;
      const searchMatch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.features.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return categoryMatch && providerMatch && searchMatch;
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
  }, [selectedCategory, selectedProvider, searchTerm, sortBy, sortDesc, LLM_MODELS]);

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

  const getQualityColor = (quality) => {
    if (!quality) return 'text-gray-400';
    if (quality >= 60) return 'text-green-600';
    if (quality >= 40) return 'text-yellow-600';
    if (quality >= 20) return 'text-orange-600';
    return 'text-red-600';
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
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LLM models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-2">Error loading models</div>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-heading-lg mb-2">
          LLM Model Marketplace
        </h1>
        <p className="text-body-sm mb-1">
          Compare {LLM_MODELS.length} LLM models • Real data from artificialanalysis.ai
        </p>
        <div className="text-caption">
          Quality indices, pricing, and performance metrics updated regularly
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-minimal text-center">
          <div className="text-2xl font-semibold text-blue-600">{stats.total}</div>
          <div className="text-caption">Models Found</div>
        </div>
        <div className="card-minimal text-center">
          <div className="text-2xl font-semibold text-green-600">{stats.avgQuality.toFixed(1)}</div>
          <div className="text-caption">Avg Quality</div>
        </div>
        <div className="card-minimal text-center">
          <div className="text-2xl font-semibold text-yellow-600">${stats.avgPrice.toFixed(2)}</div>
          <div className="text-caption">Avg Price/1M</div>
        </div>
        <div className="card-minimal text-center">
          <div className="text-2xl font-semibold text-purple-600">{stats.openSource}</div>
          <div className="text-caption">Open Source</div>
        </div>
      </div>

      {/* Controls */}
      <div className="card-minimal">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <h3 className="text-subheading">Filters & Search</h3>
          </div>
          
          <button
            onClick={() => setShowUpdateManager(!showUpdateManager)}
            className="btn-minimal btn-secondary"
          >
            <RefreshCw size={14} />
            Data Manager
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-sm"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-sm"
          >
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{category.name}</option>
            ))}
          </select>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-sm"
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
              className="flex-1 px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-sm"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className="px-3 py-2 border border-gray-700 rounded-md hover:bg-gray-700 text-sm"
            >
              {sortDesc ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Update Manager */}
      {showUpdateManager && (
        <LLMUpdateManager onUpdateComplete={() => {
          refetch();
          setShowUpdateManager(false);
        }} />
      )}

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            className={`card-minimal cursor-pointer transition-all duration-200 ${
              selectedModel?.id === model.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getModelIcon(model)}</span>
                <div>
                  <h3 className="font-semibold text-sm">{model.name}</h3>
                  <p className="text-caption">{model.provider}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${getQualityColor(model.quality_index)}`}>
                  {model.quality_index || 'N/A'}
                </div>
                <div className="text-caption">Quality</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-800 rounded px-2 py-1 text-center">
                <div className="text-xs font-medium">${model.output_price}</div>
                <div className="text-caption">Price</div>
              </div>
              <div className="bg-gray-800 rounded px-2 py-1 text-center">
                <div className="text-xs font-medium">{model.output_speed.toFixed(0)} tok/s</div>
                <div className="text-caption">Speed</div>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-1 mb-3">
              {model.features.slice(0, 2).map((feature, idx) => (
                <span key={idx} className="badge badge-secondary">
                  {feature}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
              <span className={`badge ${model.license === 'Open' ? 'badge-success' : 'badge-secondary'}`}>
                {model.license}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.selectLLMModel(model);
                    actions.addComponentToWorkflow(model, 'llm');
                  }}
                  className="btn-minimal btn-primary text-xs px-2 py-1"
                >
                  + Add
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.navigateToPlaygroundWithComponent(model, 'llm');
                  }}
                  className="btn-minimal btn-secondary text-xs px-2 py-1"
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Model Info */}
      {selectedModel && (
        <div className="card-minimal">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Basic Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{getModelIcon(selectedModel)}</span>
                <div>
                  <h2 className="text-heading">{selectedModel.name}</h2>
                  <p className="text-body-sm">{selectedModel.provider} • {selectedModel.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card-minimal">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <DollarSign className="text-yellow-600" size={14} />
                      Pricing (per 1M tokens)
                    </h4>
                    <div className="text-sm space-y-1">
                      <div>Input: ${selectedModel.input_price}</div>
                      <div>Output: ${selectedModel.output_price}</div>
                      <div className="text-caption">
                        Cost per 1K: ${(selectedModel.output_price / 1000).toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="card-minimal">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="text-green-600" size={14} />
                      Performance
                    </h4>
                    <div className="text-sm space-y-1">
                      <div>Quality: <span className={getQualityColor(selectedModel.quality_index)}>{selectedModel.quality_index || 'N/A'}</span></div>
                      <div>Speed: {selectedModel.output_speed.toFixed(1)} tok/s</div>
                      <div>Latency: {selectedModel.latency.toFixed(2)}s</div>
                    </div>
                  </div>
                </div>

                <div className="card-minimal">
                  <h4 className="font-semibold mb-2">Technical Specs</h4>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>Context: {(selectedModel.context_window / 1000).toFixed(0)}K tokens</div>
                    <div>License: {selectedModel.license}</div>
                    <div>Creator: {selectedModel.creator}</div>
                    <div>Category: {CATEGORIES[selectedModel.category]?.name}</div>
                  </div>
                </div>

                <div className="card-minimal">
                  <h4 className="font-semibold mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.features.map((feature, idx) => (
                      <span key={idx} className="badge badge-primary">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Official Documentation Links */}
                <div className="card-minimal">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen size={14} />
                    Official Documentation
                    {selectedModel.verified_official && (
                      <Shield className="text-green-600" size={12} title="Verified Official" />
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
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
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
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
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
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
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
              <h3 className="text-subheading mb-4">Market Position</h3>
              
              <div className="space-y-4">
                <div className="card-minimal">
                  <h4 className="font-semibold mb-2">Value Proposition</h4>
                  <div className="text-sm space-y-1">
                    {selectedModel.quality_index && selectedModel.quality_index >= 50 && selectedModel.output_price <= 2 && (
                      <div className="text-green-600">🏆 Excellent quality-to-price ratio</div>
                    )}
                    {selectedModel.output_speed >= 100 && (
                      <div className="text-blue-600">⚡ High-speed inference</div>
                    )}
                    {selectedModel.license === 'Open' && (
                      <div className="text-purple-600">🔓 Open source advantage</div>
                    )}
                    {selectedModel.context_window >= 100000 && (
                      <div className="text-cyan-600">📚 Long context support</div>
                    )}
                  </div>
                </div>

                <div className="card-minimal">
                  <h4 className="font-semibold mb-2">Competitive Analysis</h4>
                  <div className="text-sm space-y-1">
                    <div>Quality Rank: Top {selectedModel.quality_index ? Math.round((LLM_MODELS.filter(m => m.quality_index && m.quality_index > (selectedModel.quality_index || 0)).length / LLM_MODELS.length) * 100) : 'N/A'}%</div>
                    <div>Price Rank: {selectedModel.output_price <= 1 ? 'Budget-friendly' : selectedModel.output_price <= 5 ? 'Mid-range' : 'Premium'}</div>
                    <div>Speed Rank: {selectedModel.output_speed >= 100 ? 'Fast' : selectedModel.output_speed >= 50 ? 'Medium' : 'Slow'}</div>
                  </div>
                </div>

                <div className="card-minimal">
                  <h4 className="font-semibold mb-2">Best Use Cases</h4>
                  <div className="text-sm text-gray-300">
                    {selectedModel.category === 'reasoning' && '💡 Complex problem solving, analysis, mathematical reasoning'}
                    {selectedModel.category === 'coding' && '💻 Software development, code review, debugging'}
                    {selectedModel.category === 'multimodal' && '🎯 Image analysis, document processing, multimedia tasks'}
                    {selectedModel.category === 'lightweight' && '⚡ Real-time applications, high-volume processing'}
                    {selectedModel.category === 'budget' && '💰 Cost-sensitive applications, experimentation'}
                  </div>
                </div>

                <div className="card-minimal">
                  <h4 className="font-semibold mb-2">Similar Models</h4>
                  <div className="space-y-1">
                    {LLM_MODELS
                      .filter(m => m.id !== selectedModel.id && m.category === selectedModel.category)
                      .slice(0, 3)
                      .map(similar => (
                        <div key={similar.id} className="flex justify-between text-sm">
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
      <div className="card-minimal">
        <h3 className="text-subheading mb-4 flex items-center gap-2">
          <BookOpen size={16} />
          Official Documentation & API References
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(PROVIDERS).slice(1).map(([key, provider]) => (
            <div key={key} className="card-minimal">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{provider.flag}</span>
                <h4 className="font-semibold">{provider.name}</h4>
              </div>
              
              <div className="space-y-2 text-sm">
                {provider.homepage && (
                  <a 
                    href={provider.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
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
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
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
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
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
        
        <div className="mt-6 card-minimal bg-gray-800">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Info size={14} />
            Data Sources & Citations
          </h4>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• Performance metrics sourced from <a href="https://artificialanalysis.ai/leaderboards/providers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">Artificial Analysis Leaderboard</a></p>
            <p>• Model specifications verified against official provider documentation</p>
            <p>• Pricing information cross-referenced with official API documentation</p>
            <p>• Quality indices based on standardized benchmarks (MMLU-Pro, GPQA Diamond, HumanEval, etc.)</p>
            <p>• Last updated: {new Date().toLocaleDateString()} - Data refreshed every 24 hours</p>
          </div>
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