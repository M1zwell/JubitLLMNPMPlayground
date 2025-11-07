import React from 'react';
import { usePlayground } from '../context/PlaygroundContext';
import { 
  Brain, Package, Code, Workflow, Activity, 
  Zap, Target, Users, TrendingUp, Globe,
  RefreshCw, Play, Plus, Search as SearchIcon, Filter,
  ArrowRight, CheckCircle, Clock, Database
} from 'lucide-react';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';

const IntegratedPlaygroundHub: React.FC = () => {
  const { state, actions } = usePlayground();

  // Safe defaults for undefined state properties
  const safeState = {
    llmModels: state.llmModels || [],
    npmPackages: state.npmPackages || [],
    workflowComponents: state.workflowComponents || [],
    executionResults: state.executionResults || {},
    connectionStatus: state.connectionStatus || 'disconnected',
    lastUpdate: state.lastUpdate || new Date().toISOString(),
    searchTerms: state.searchTerms || { llm: '', npm: '' },
    selectedLLMModel: state.selectedLLMModel || null,
    selectedNPMPackage: state.selectedNPMPackage || null,
  };

  // Safe actions with defaults
  const safeActions = {
    setCurrentView: actions.setCurrentView || (() => {}),
    refreshLLMModels: actions.refreshLLMModels || (() => {}),
    refreshNPMPackages: actions.refreshNPMPackages || (() => {}),
    setLLMSearch: actions.setLLMSearch || (() => {}),
    setNPMSearch: actions.setNPMSearch || (() => {}),
    selectLLMModel: actions.selectLLMModel || (() => {}),
    selectNPMPackage: actions.selectNPMPackage || (() => {}),
    addComponentToWorkflow: actions.addComponentToWorkflow || (() => {}),
    clearWorkflow: actions.clearWorkflow || (() => {}),
  };

  const getConnectionStatusColor = () => {
    switch (safeState.connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const formatNumber = (num: number): string => {
    if (!num || num === 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getRecentComponents = () => {
    const recent = [];
    if (safeState.selectedLLMModel) recent.push({ ...safeState.selectedLLMModel, type: 'llm' });
    if (safeState.selectedNPMPackage) recent.push({ ...safeState.selectedNPMPackage, type: 'npm' });
    return recent.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          Integrated AI+NPM Playground
        </h1>
        <p className="text-gray-400 mb-1">
          Unified access to {safeState.llmModels.length} LLM models & {safeState.npmPackages.length} NPM packages
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${safeState.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>Supabase: {safeState.connectionStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={14} />
            <span>Last sync: {new Date(safeState.lastUpdate).toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => {
              safeActions.refreshLLMModels();
              safeActions.refreshNPMPackages();
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Sync Data
          </button>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg shadow border text-center">
          <Brain className="mx-auto mb-2 text-purple-600" size={20} />
          <div className="text-xl font-semibold text-purple-600">{safeState.llmModels.length}</div>
          <div className="text-sm text-gray-400">LLM Models</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow border text-center">
          <Package className="mx-auto mb-2 text-blue-600" size={20} />
          <div className="text-xl font-semibold text-blue-600">{safeState.npmPackages.length}</div>
          <div className="text-sm text-gray-400">NPM Packages</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow border text-center">
          <Workflow className="mx-auto mb-2 text-green-600" size={20} />
          <div className="text-xl font-semibold text-green-600">{safeState.workflowComponents.length}</div>
          <div className="text-sm text-gray-400">Workflow Items</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow border text-center">
          <Activity className="mx-auto mb-2 text-yellow-600" size={20} />
          <div className="text-xl font-semibold text-yellow-600">
            {Object.keys(safeState.executionResults).length}
          </div>
          <div className="text-sm text-gray-400">Executed</div>
        </div>
      </div>

      {/* Main Integration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LLM Models Panel */}
        <div className="bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="text-purple-600" size={16} />
              LLM Models
            </h3>
            <button
              onClick={() => safeActions.setCurrentView('llm-market')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Browse All <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search LLM models..."
                value={safeState.searchTerms.llm}
                onChange={(e) => safeActions.setLLMSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-100"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {safeState.llmModels.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Brain className="mx-auto mb-2" size={24} />
                <p>No LLM models available</p>
                <p className="text-sm">Connect to Supabase to load models</p>
              </div>
            ) : (
              safeState.llmModels
                .filter(model =>
                  model.name?.toLowerCase().includes(safeState.searchTerms.llm.toLowerCase()) ||
                  model.provider?.toLowerCase().includes(safeState.searchTerms.llm.toLowerCase())
                )
                .slice(0, 6)
                .map(model => (
                <div
                  key={model.id}
                  onClick={() => {
                    safeActions.selectLLMModel(model);
                    safeActions.addComponentToWorkflow(model, 'llm');
                  }}
                  className={`p-3 rounded-md cursor-pointer transition-all hover:bg-gray-700 border ${
                    safeState.selectedLLMModel?.id === model.id
                      ? 'border-purple-600 bg-purple-900'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{model.name}</h4>
                      <p className="text-xs text-gray-400">{model.provider}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600">${model.output_price || 'N/A'}</div>
                      <div className="text-xs text-gray-400">{model.quality_index || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NPM Packages Panel */}
        <div className="bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="text-blue-600" size={16} />
              NPM Packages
            </h3>
            <button
              onClick={() => safeActions.setCurrentView('npm-market')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Browse All <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search NPM packages..."
                value={safeState.searchTerms.npm}
                onChange={(e) => safeActions.setNPMSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-100"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {safeState.npmPackages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="mx-auto mb-2" size={24} />
                <p>No NPM packages available</p>
                <p className="text-sm">Connect to Supabase to load packages</p>
              </div>
            ) : (
              safeState.npmPackages
                .filter(pkg =>
                  pkg.name?.toLowerCase().includes(safeState.searchTerms.npm.toLowerCase()) ||
                  pkg.description?.toLowerCase().includes(safeState.searchTerms.npm.toLowerCase())
                )
                .slice(0, 6)
                .map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => {
                    safeActions.selectNPMPackage(pkg);
                    safeActions.addComponentToWorkflow(pkg, 'npm');
                  }}
                  className={`p-3 rounded-md cursor-pointer transition-all hover:bg-gray-700 border ${
                    safeState.selectedNPMPackage?.id === pkg.id
                      ? 'border-blue-600 bg-blue-900'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{pkg.name}</h4>
                      <p className="text-xs text-gray-400">{pkg.description?.substring(0, 30)}...</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600">{formatNumber(pkg.weekly_downloads || 0)}</div>
                      <div className="text-xs text-gray-400">⭐ {formatNumber(pkg.github_stars || 0)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Workflow Builder Panel */}
        <div className="bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Workflow className="text-green-600" size={16} />
              Workflow Builder
            </h3>
            {safeState.workflowComponents.length > 0 && (
              <button
                onClick={safeActions.clearWorkflow}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear
              </button>
            )}
          </div>
          
          {safeState.workflowComponents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Workflow className="mx-auto mb-2" size={24} />
              <p>No workflow components</p>
              <p className="text-sm">Select models and packages to build workflows</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeState.workflowComponents.map((component, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-700 rounded-md">
                  {component.type === 'llm' ? <Brain size={16} /> : <Package size={16} />}
                  <span className="text-sm">{component.name}</span>
                </div>
              ))}
              <button 
                className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Execute Workflow
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Workflow Advisor */}
      <div className="mt-8">
        <AIWorkflowAdvisor />
      </div>
    </div>
  );
};

export default IntegratedPlaygroundHub;