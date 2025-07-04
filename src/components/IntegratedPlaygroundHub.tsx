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
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Real-time Status */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
            🎮 Integrated AI+NPM Playground
          </h1>
          <p className="text-xl text-purple-300 mb-4">
            Unified access to {state.llmModels.length} LLM models & {state.npmPackages.length} NPM packages
          </p>
          
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Database className={getConnectionStatusColor()} size={16} />
              <span className="text-sm">Supabase: {state.connectionStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-blue-400" size={16} />
              <span className="text-sm">Last sync: {new Date(state.lastUpdate).toLocaleTimeString()}</span>
            </div>
            <button
              onClick={() => {
                actions.refreshLLMModels();
                actions.refreshNPMPackages();
              }}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors text-sm"
            >
              <RefreshCw size={14} />
              Sync Data
            </button>
          </div>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Brain className="mx-auto mb-2 text-purple-400" size={24} />
            <div className="text-2xl font-bold text-purple-400">{state.llmModels.length}</div>
            <div className="text-sm opacity-80">LLM Models</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Package className="mx-auto mb-2 text-blue-400" size={24} />
            <div className="text-2xl font-bold text-blue-400">{state.npmPackages.length}</div>
            <div className="text-sm opacity-80">NPM Packages</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Workflow className="mx-auto mb-2 text-green-400" size={24} />
            <div className="text-2xl font-bold text-green-400">{state.workflowComponents.length}</div>
            <div className="text-sm opacity-80">Workflow Items</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Activity className="mx-auto mb-2 text-yellow-400" size={24} />
            <div className="text-2xl font-bold text-yellow-400">
              {Object.keys(state.executionResults).length}
            </div>
            <div className="text-sm opacity-80">Executed</div>
          </div>
        </div>

        {/* Main Integration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* LLM Models Panel */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Brain className="text-purple-400" />
                LLM Models
              </h3>
              <button
                onClick={() => actions.setCurrentView('llm-market')}
                className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
              >
                Browse All <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search LLM models..."
                  value={state.searchTerms.llm}
                  onChange={(e) => actions.setLLMSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
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
                  className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-white/20 border ${
                    state.selectedLLMModel?.id === model.id 
                      ? 'border-purple-400 bg-purple-600/20' 
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{model.name}</h4>
                      <p className="text-xs text-gray-400">{model.provider}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-400">${model.output_price}</div>
                      <div className="text-xs text-gray-400">{model.quality_index || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NPM Packages Panel */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Package className="text-blue-400" />
                NPM Packages
              </h3>
              <button
                onClick={() => actions.setCurrentView('npm-market')}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                Browse All <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search NPM packages..."
                  value={state.searchTerms.npm}
                  onChange={(e) => actions.setNPMSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
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
                  className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-white/20 border ${
                    state.selectedNPMPackage?.id === pkg.id 
                      ? 'border-blue-400 bg-blue-600/20' 
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{pkg.name}</h4>
                      <p className="text-xs text-gray-400">{pkg.description?.substring(0, 30)}...</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-400">{formatNumber(pkg.weekly_downloads)}</div>
                      <div className="text-xs text-gray-400">⭐ {formatNumber(pkg.github_stars)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Builder Panel */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Workflow className="text-green-400" />
                Workflow Builder
              </h3>
              {state.workflowComponents.length > 0 && (
                <button
                  onClick={actions.clearWorkflow}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Clear
                </button>
              )}
            </div>

            {state.workflowComponents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Workflow size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Add LLM models and NPM packages to build your workflow</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {state.workflowComponents.map((component, index) => (
                  <div
                    key={component.id}
                    className={`p-3 rounded-lg border transition-all ${
                      component.status === 'running' ? 'border-yellow-400 bg-yellow-600/20 animate-pulse' :
                      component.status === 'completed' ? 'border-green-400 bg-green-600/20' :
                      component.status === 'error' ? 'border-red-400 bg-red-600/20' :
                      'border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{index + 1}.</span>
                        {component.type === 'llm' ? <Brain size={16} /> : <Package size={16} />}
                        <div>
                          <div className="text-sm font-medium">{component.data.name}</div>
                          <div className="text-xs text-gray-400">
                            {component.type === 'llm' 
                              ? (component.data as any).provider 
                              : (component.data as any).version
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {component.status === 'completed' && <CheckCircle className="text-green-400" size={14} />}
                        {component.status === 'running' && (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-400 border-t-transparent"></div>
                        )}
                        <button
                          onClick={() => actions.removeComponentFromWorkflow(component.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    {state.executionResults[component.id] && (
                      <div className="mt-2 p-2 bg-black/30 rounded text-xs">
                        <div className="text-green-300 mb-1">Output:</div>
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
                className={`w-full py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                  state.isExecuting 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {state.isExecuting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Executing...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Execute Workflow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Recent Activity & Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-yellow-400" />
              Recent Components
            </h3>
            
            {getRecentComponents().length === 0 ? (
              <p className="text-gray-500 text-sm">No recent components selected</p>
            ) : (
              <div className="space-y-3">
                {getRecentComponents().map((component: any) => (
                  <div
                    key={component.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      {component.type === 'llm' ? <Brain size={16} /> : <Package size={16} />}
                      <div>
                        <div className="text-sm font-medium">{component.name}</div>
                        <div className="text-xs text-gray-400">
                          {component.type === 'llm' ? component.provider : `v${component.version}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => actions.addComponentToWorkflow(component, component.type)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="text-pink-400" />
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => actions.setCurrentView('llm-market')}
                className="p-4 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors text-center"
              >
                <Brain className="mx-auto mb-2" size={24} />
                <div className="text-sm">Browse LLMs</div>
              </button>
              
              <button
                onClick={() => actions.setCurrentView('npm-market')}
                className="p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors text-center"
              >
                <Package className="mx-auto mb-2" size={24} />
                <div className="text-sm">Browse NPM</div>
              </button>
              
              <button
                onClick={() => actions.setCurrentView('unified-playground')}
                className="p-4 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors text-center"
              >
                <Workflow className="mx-auto mb-2" size={24} />
                <div className="text-sm">Playground</div>
              </button>
              
              <button
                onClick={() => actions.setCurrentView('workflow-execution')}
                className="p-4 bg-pink-600/20 hover:bg-pink-600/30 rounded-lg transition-colors text-center"
              >
                <Zap className="mx-auto mb-2" size={24} />
                <div className="text-sm">Live Demo</div>
              </button>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-400/30 text-center">
          <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
            <Globe className="text-blue-400" />
            🔗 Real-time Supabase Integration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Database className="mx-auto mb-2 text-green-400" size={32} />
              <h4 className="font-bold mb-2">Live Data Sync</h4>
              <p className="text-sm text-gray-300">All playgrounds share real-time data from Supabase</p>
            </div>
            <div>
              <RefreshCw className="mx-auto mb-2 text-blue-400" size={32} />
              <h4 className="font-bold mb-2">Auto Updates</h4>
              <p className="text-sm text-gray-300">Changes in one view instantly reflect in all others</p>
            </div>
            <div>
              <CheckCircle className="mx-auto mb-2 text-purple-400" size={32} />
              <h4 className="font-bold mb-2">Seamless Flow</h4>
              <p className="text-sm text-gray-300">Navigate between markets and playgrounds with context</p>
            </div>
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