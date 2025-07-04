import React from 'react';
import { usePlayground } from '../context/PlaygroundContext';
import { 
  Brain, Package, Code, Workflow, Activity, 
  Zap, Target, Users, TrendingUp, Globe,
  RefreshCw, Play, Plus, Search, Filter,
  ArrowRight, CheckCircle, Clock, Database
} from 'lucide-react';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';

const IntegratedPlaygroundHub: React.FC = () => {
  const { state, actions } = usePlayground();

  const getConnectionStatusColor = () => {
    switch (state.connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getRecentComponents = () => {
    const recent = [];
    if (state.selectedLLMModel) recent.push({ ...state.selectedLLMModel, type: 'llm' });
    if (state.selectedNPMPackage) recent.push({ ...state.selectedNPMPackage, type: 'npm' });
    return recent.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="text-center">
        <h1 className="text-heading-lg mb-2">
          Integrated AI+NPM Playground
        </h1>
        <p className="text-body-sm mb-1">
          Unified access to {state.llmModels.length} LLM models & {state.npmPackages.length} NPM packages
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`status-dot ${state.connectionStatus === 'connected' ? 'success' : 'warning'}`}></div>
            <span>Supabase: {state.connectionStatus}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={14} />
            <span>Last sync: {new Date(state.lastUpdate).toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => {
              actions.refreshLLMModels();
              actions.refreshNPMPackages();
            }}
            className="btn-minimal btn-ghost"
          >
            <RefreshCw size={14} />
            Sync Data
          </button>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-minimal text-center">
          <Brain className="mx-auto mb-2 text-purple-600" size={20} />
          <div className="text-xl font-semibold text-purple-600">{state.llmModels.length}</div>
          <div className="text-caption">LLM Models</div>
        </div>
        <div className="card-minimal text-center">
          <Package className="mx-auto mb-2 text-blue-600" size={20} />
          <div className="text-xl font-semibold text-blue-600">{state.npmPackages.length}</div>
          <div className="text-caption">NPM Packages</div>
        </div>
        <div className="card-minimal text-center">
          <Workflow className="mx-auto mb-2 text-green-600" size={20} />
          <div className="text-xl font-semibold text-green-600">{state.workflowComponents.length}</div>
          <div className="text-caption">Workflow Items</div>
        </div>
        <div className="card-minimal text-center">
          <Activity className="mx-auto mb-2 text-yellow-600" size={20} />
          <div className="text-xl font-semibold text-yellow-600">
            {Object.keys(state.executionResults).length}
          </div>
          <div className="text-caption">Executed</div>
        </div>
      </div>

      {/* Main Integration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LLM Models Panel */}
        <div className="card-minimal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-subheading flex items-center gap-2">
              <Brain className="text-purple-600" size={16} />
              LLM Models
            </h3>
            <button
              onClick={() => actions.setCurrentView('llm-market')}
              className="btn-minimal btn-ghost text-sm"
            >
              Browse All <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search LLM models..."
                value={state.searchTerms.llm}
                onChange={(e) => actions.setLLMSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {state.llmModels
              .filter(model => 
                model.name.toLowerCase().includes(state.searchTerms.llm.toLowerCase()) ||
                model.provider.toLowerCase().includes(state.searchTerms.llm.toLowerCase())
              )
              .slice(0, 6)
              .map(model => (
              <div
                key={model.id}
                onClick={() => {
                  actions.selectLLMModel(model);
                  actions.addComponentToWorkflow(model, 'llm');
                }}
                className={`p-3 rounded-md cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border ${
                  state.selectedLLMModel?.id === model.id 
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{model.name}</h4>
                    <p className="text-caption">{model.provider}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-green-600">${model.output_price}</div>
                    <div className="text-caption">{model.quality_index || 'N/A'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NPM Packages Panel */}
        <div className="card-minimal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-subheading flex items-center gap-2">
              <Package className="text-blue-600" size={16} />
              NPM Packages
            </h3>
            <button
              onClick={() => actions.setCurrentView('npm-market')}
              className="btn-minimal btn-ghost text-sm"
            >
              Browse All <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search NPM packages..."
                value={state.searchTerms.npm}
                onChange={(e) => actions.setNPMSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {state.npmPackages
              .filter(pkg => 
                pkg.name.toLowerCase().includes(state.searchTerms.npm.toLowerCase()) ||
                pkg.description?.toLowerCase().includes(state.searchTerms.npm.toLowerCase())
              )
              .slice(0, 6)
              .map(pkg => (
              <div
                key={pkg.id}
                onClick={() => {
                  actions.selectNPMPackage(pkg);
                  actions.addComponentToWorkflow(pkg, 'npm');
                }}
                className={`p-3 rounded-md cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border ${
                  state.selectedNPMPackage?.id === pkg.id 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{pkg.name}</h4>
                    <p className="text-caption">{pkg.description?.substring(0, 30)}...</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-green-600">{formatNumber(pkg.weekly_downloads)}</div>
                    <div className="text-caption">⭐ {formatNumber(pkg.github_stars)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Builder Panel */}
        <div className="card-minimal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-subheading flex items-center gap-2">
              <Workflow className="text-green-600" size={16} />
              Workflow Builder
            </h3>
            {state.workflowComponents.length > 0 && (
              <button
                onClick={actions.clearWorkflow}
                className="btn-minimal btn-ghost text-sm text-red-600"
              >
                Clear
              </button>
            )}
          </div>

          {state.workflowComponents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Workflow size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Add LLM models and NPM packages to build your workflow</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
              {state.workflowComponents.map((component, index) => (
                <div
                  key={component.id}
                  className={`p-3 rounded-md border transition-all ${
                    component.status === 'running' ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' :
                    component.status === 'completed' ? 'border-green-600 bg-green-50 dark:bg-green-900/20' :
                    component.status === 'error' ? 'border-red-600 bg-red-50 dark:bg-red-900/20' :
                    'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-caption">{index + 1}.</span>
                      {component.type === 'llm' ? <Brain size={14} /> : <Package size={14} />}
                      <div>
                        <div className="text-sm font-medium">{component.data.name}</div>
                        <div className="text-caption">
                          {component.type === 'llm' 
                            ? (component.data as any).provider 
                            : (component.data as any).version
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {component.status === 'completed' && <CheckCircle className="text-green-600" size={14} />}
                      {component.status === 'running' && (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-600 border-t-transparent"></div>
                      )}
                      <button
                        onClick={() => actions.removeComponentFromWorkflow(component.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {state.executionResults[component.id] && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      <div className="text-green-600 mb-1">Output:</div>
                      <div className="max-h-16 overflow-y-auto">
                        {String(state.executionResults[component.id]).substring(0, 100)}...
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {state.workflowComponents.length > 0 && (
            <button
              onClick={actions.executeWorkflow}
              disabled={state.isExecuting}
              className={`w-full btn-minimal ${
                state.isExecuting 
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' 
                  : 'btn-primary'
              }`}
            >
              {state.isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Executing...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Execute Workflow
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Recent Activity & Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-minimal">
          <h3 className="text-subheading mb-4 flex items-center gap-2">
            <TrendingUp className="text-yellow-600" size={16} />
            Recent Components
          </h3>
          
          {getRecentComponents().length === 0 ? (
            <p className="text-gray-500 text-sm">No recent components selected</p>
          ) : (
            <div className="space-y-2">
              {getRecentComponents().map((component: any) => (
                <div
                  key={component.id}
                  className="flex items-center justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2">
                    {component.type === 'llm' ? <Brain size={14} /> : <Package size={14} />}
                    <div>
                      <div className="text-sm font-medium">{component.name}</div>
                      <div className="text-caption">
                        {component.type === 'llm' ? component.provider : `v${component.version}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => actions.addComponentToWorkflow(component, component.type)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-minimal">
          <h3 className="text-subheading mb-4 flex items-center gap-2">
            <Target className="text-pink-600" size={16} />
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => actions.setCurrentView('llm-market')}
              className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md transition-colors text-center"
            >
              <Brain className="mx-auto mb-2" size={20} />
              <div className="text-sm">Browse LLMs</div>
            </button>
            
            <button
              onClick={() => actions.setCurrentView('npm-market')}
              className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors text-center"
            >
              <Package className="mx-auto mb-2" size={20} />
              <div className="text-sm">Browse NPM</div>
            </button>
            
            <button
              onClick={() => actions.setCurrentView('unified-playground')}
              className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors text-center"
            >
              <Workflow className="mx-auto mb-2" size={20} />
              <div className="text-sm">Playground</div>
            </button>
            
            <button
              onClick={() => actions.setCurrentView('workflow-execution')}
              className="p-4 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-md transition-colors text-center"
            >
              <Zap className="mx-auto mb-2" size={20} />
              <div className="text-sm">Live Demo</div>
            </button>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="card-minimal bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-subheading mb-4 text-center flex items-center justify-center gap-2">
          <Globe className="text-blue-600" />
          Real-time Supabase Integration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Database className="mx-auto mb-2 text-green-600" size={20} />
            <h4 className="font-semibold mb-1">Live Data Sync</h4>
            <p className="text-caption">All playgrounds share real-time data from Supabase</p>
          </div>
          <div className="text-center">
            <RefreshCw className="mx-auto mb-2 text-blue-600" size={20} />
            <h4 className="font-semibold mb-1">Auto Updates</h4>
            <p className="text-caption">Changes in one view instantly reflect in all others</p>
          </div>
          <div className="text-center">
            <CheckCircle className="mx-auto mb-2 text-purple-600" size={20} />
            <h4 className="font-semibold mb-1">Seamless Flow</h4>
            <p className="text-caption">Navigate between markets and playgrounds with context</p>
          </div>
        </div>
      </div>

      {/* AI Workflow Advisor */}
      <AIWorkflowAdvisor
        onComponentAdd={(component, type) => {
          if (type === 'llm') {
            actions.selectLLMModel(component);
            actions.addComponentToWorkflow(component, type);
          } else {
            actions.selectNPMPackage(component);
            actions.addComponentToWorkflow(component, type);
          }
        }}
        selectedComponents={state.workflowComponents}
      />
    </div>
  );
};

export default IntegratedPlaygroundHub;