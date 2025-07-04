import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Copy, Github, Calendar, Code, Terminal, Globe, RefreshCw, Save, Upload,
  Layers, Target, Users, FileText, Image, Database, Mail, Lock, Filter, Share2,
  TrendingUp, Award, Clock, DollarSign, Cpu, Eye, ExternalLink, AlertTriangle,
  Workflow, CheckCircle, Plus, Minus, PlayCircle,
  Brain, Package, Activity, 
  Zap,
  Play, Search,
  ArrowRight,
  Shield, Download, Star, BarChart3, Settings
} from 'lucide-react';
import { useLLMModels } from '../hooks/useLLMModels';
import { useNPMPackages } from '../hooks/useNPMPackages';
import { LLMModel, NPMPackage } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { WorkflowExecutor } from '../lib/execution/workflow-executor';
import { workflowTemplates } from '../lib/execution/workflow-templates';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';
import WorkflowVisualization from './WorkflowVisualization';

const EnhancedUnifiedPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'llm' | 'npm' | 'workflow'>('llm');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { models, loading: modelsLoading, error: modelsError } = useLLMModels();
  const { packages, loading: packagesLoading, error: packagesError } = useNPMPackages();
  const { t } = useLanguage();

  const tabs = [
    {
      id: 'llm' as const,
      label: t('llmModels'),
      icon: Brain,
      count: models?.length || 0
    },
    {
      id: 'npm' as const,
      label: t('npmPackages'),
      icon: Package,
      count: packages?.length || 0
    },
    {
      id: 'workflow' as const,
      label: t('workflows'),
      icon: Workflow,
      count: workflowTemplates?.length || 0
    }
  ];

  const filteredModels = useMemo(() => {
    if (!models) return [];
    return models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           model.creator.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [models, searchQuery, selectedCategory]);

  const filteredPackages = useMemo(() => {
    if (!packages) return [];
    return packages.filter(pkg => {
      const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (pkg.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesSearch;
    });
  }, [packages, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Enhanced Unified Playground
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Explore LLM models, NPM packages, and create powerful workflows
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
            
            {activeTab === 'llm' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="text">Text</option>
                <option value="code">Code</option>
                <option value="chat">Chat</option>
                <option value="multimodal">Multimodal</option>
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'llm' && (
            <div>
              {modelsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading models...</span>
                </div>
              ) : modelsError ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400">Error loading models: {modelsError}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredModels.map((model) => (
                    <div key={model.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{model.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{model.creator}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          model.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
                          model.rarity === 'epic' ? 'bg-blue-100 text-blue-800' :
                          model.rarity === 'rare' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {model.rarity}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span>Input: ${model.input_price}/1M tokens</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Cpu className="w-4 h-4 text-blue-600" />
                          <span>Context: {model.context_window.toLocaleString()}</span>
                        </div>
                        {model.quality_index && (
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="w-4 h-4 text-yellow-600" />
                            <span>Quality: {model.quality_index}/100</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          <Play className="w-4 h-4 inline mr-1" />
                          Try Model
                        </button>
                        {model.official_api_docs && (
                          <a
                            href={model.official_api_docs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'npm' && (
            <div>
              {packagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading packages...</span>
                </div>
              ) : packagesError ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400">Error loading packages: {packagesError}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPackages.map((pkg) => (
                    <div key={pkg.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{pkg.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{pkg.description}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Download className="w-4 h-4 text-green-600" />
                          <span>{pkg.weekly_downloads?.toLocaleString()} weekly</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-yellow-600" />
                          <span>{pkg.github_stars?.toLocaleString()} stars</span>
                        </div>
                        {pkg.quality_score && (
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <span>Quality: {pkg.quality_score}/5.0</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                          <Terminal className="w-4 h-4 inline mr-1" />
                          Install
                        </button>
                        {pkg.npm_url && (
                          <a
                            href={pkg.npm_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Workflow Templates
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create powerful automation workflows by combining LLM models and NPM packages.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {workflowTemplates?.map((template, index) => (
                    <div key={index} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{template.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                      <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                        <PlayCircle className="w-4 h-4 inline mr-1" />
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <AIWorkflowAdvisor />
              <WorkflowVisualization />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedUnifiedPlayground;