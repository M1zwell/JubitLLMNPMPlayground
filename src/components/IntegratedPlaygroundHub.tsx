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
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header with Real-time Status */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-primary mb-2">
            🎮 Integrated AI+NPM Playground
          </h1>
          <p className="text-base text-secondary mb-3">
            Unified access to {state.llmModels.length} LLM models & {state.npmPackages.length} NPM packages
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Database className={`${getConnectionStatusColor()} icon-sm`} />
              <span className="text-xs text-secondary">Supabase: {state.connectionStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-primary icon-sm" />
              <span className="text-xs text-secondary">Last sync: {new Date(state.lastUpdate).toLocaleTimeString()}</span>
            </div>
            <button
              onClick={() => {
                actions.refreshLLMModels();
                actions.refreshNPMPackages();
              }}
              className="btn btn-ghost btn-sm"
            >
              <RefreshCw className="icon-sm" />
              Sync Data
            </button>
          </div>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card compact text-center">
            <div className="stat">
              <Brain className="mx-auto mb-2 text-primary icon-lg" />
              <div className="stat-value text-primary">{state.llmModels.length}</div>
              <div className="stat-label">LLM Models</div>
            </div>
          </div>
          <div className="card compact text-center">
            <div className="stat">
              <Package className="mx-auto mb-2 text-primary icon-lg" />
              <div className="stat-value text-primary">{state.npmPackages.length}</div>
              <div className="stat-label">NPM Packages</div>
            </div>
          </div>
          <div className="card compact text-center">
            <div className="stat">
              <Workflow className="mx-auto mb-2 text-success icon-lg" />
              <div className="stat-value text-success">{state.workflowComponents.length}</div>
              <div className="stat-label">Workflow Items</div>
            </div>
          </div>
          <div className="card compact text-center">
            <div className="stat">
              <Activity className="mx-auto mb-2 text-warning icon-lg" />
              <div className="stat-value text-warning">
              {Object.keys(state.executionResults).length}
            </div>
              <div className="stat-label">Executed</div>
            </div>
          </div>
        </div>

        {/* Main Integration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LLM Models Panel */}
          <div className="card compact-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium flex items-center gap-2 text-primary">
                <Brain className="icon" />
                LLM Models
              </h3>
              <button
                onClick={() => actions.setCurrentView('llm-market')}
                className="btn btn-ghost text-xs"
              >
                Browse All <ArrowRight className="icon-sm" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted icon-sm" />
                <input
                  type="text"
                  placeholder="Search LLM models..."
                  value={state.searchTerms.llm}
                  onChange={(e) => actions.setLLMSearch(e.target.value)}
                  className="input pl-8"
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
                  className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-white/20 border ${
                  className={`card-minimal compact-xs cursor-pointer transition-all ${
                    state.selectedLLMModel?.id === model.id 
                      ? 'border-primary bg-primary/5' 
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm text-primary">{model.name}</h4>
                      <p className="text-xs text-tertiary">{model.provider}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-success">${model.output_price}</div>
                      <div className="text-xs text-muted">{model.quality_index || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NPM Packages Panel */}
          <div className="card compact-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium flex items-center gap-2 text-primary">
                <Package className="icon" />
                NPM Packages
              </h3>
              <button
                onClick={() => actions.setCurrentView('npm-market')}
                className="btn btn-ghost text-xs"
              >
                Browse All <ArrowRight className="icon-sm" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted icon-sm" />
                <input
                  type="text"
                  placeholder="Search NPM packages..."
                  value={state.searchTerms.npm}
                  onChange={(e) => actions.setNPMSearch(e.target.value)}
                  className="input pl-8"
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
                  className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-white/20 border ${
                  className={`card-minimal compact-xs cursor-pointer transition-all ${
                    state.selectedNPMPackage?.id === pkg.id 
                      ? 'border-primary bg-primary/5' 
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm text-primary">{pkg.name}</h4>
                      <p className="text-xs text-tertiary">{pkg.description?.substring(0, 30)}...</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-success">{formatNumber(pkg.weekly_downloads)}</div>
                      <div className="text-xs text-muted">⭐ {formatNumber(pkg.github_stars)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Builder Panel */}
          <div className="card compact-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium flex items-center gap-2 text-primary">
                <Workflow className="icon" />
                Workflow Builder
              </h3>
              {state.workflowComponents.length > 0 && (
                <button
                  onClick={actions.clearWorkflow}
                  className="btn btn-ghost text-xs text-warning"
                >
                  Clear
                </button>
              )}
            </div>

            {state.workflowComponents.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <Workflow className="mx-auto mb-2 opacity-50 icon-lg" />
                <p className="text-sm">Add LLM models and NPM packages to build your workflow</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {state.workflowComponents.map((component, index) => (
                  <div
                    key={component.id}
                    className={`card-minimal compact-xs transition-all ${
                      component.status === 'running' ? 'border-yellow-400 bg-yellow-600/20 animate-pulse' :
                      component.status === 'completed' ? 'border-green-400 bg-green-600/20' :
                      component.status === 'error' ? 'border-red-400 bg-red-600/20' :
                      'border-light'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">{index + 1}.</span>
                        {component.type === 'llm' ? <Brain className="icon-sm" /> : <Package className="icon-sm" />}
                        <div>
                          <div className="text-sm font-medium text-primary">{component.data.name}</div>
                          <div className="text-xs text-tertiary">
                            {component.type === 'llm' 
                              ? (component.data as any).provider 
                              : (component.data as any).version
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {component.status === 'completed' && <CheckCircle className="text-success icon-sm" />}
                        {component.status === 'running' && (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-warning border-t-transparent"></div>
                        )}
                        <button
                          onClick={() => actions.removeComponentFromWorkflow(component.id)}
                          className="text-warning hover:text-warning-light text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    {state.executionResults[component.id] && (
                      <div className="mt-2 p-2 bg-secondary rounded text-xs">
                        <div className="text-success mb-1">Output:</div>
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
                className={`btn w-full ${state.isExecuting ? 'btn-ghost' : 'btn-success'}`}
                disabled={state.isExecuting}
              >
                {state.isExecuting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="icon-sm" />
                    Execute Workflow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Recent Activity & Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card compact-lg">
            <h3 className="text-base font-medium mb-4 flex items-center gap-2 text-primary">
              <TrendingUp className="icon" />
              Recent Components
            </h3>
            
            {getRecentComponents().length === 0 ? (
              <p className="text-muted text-sm">No recent components selected</p>
            ) : (
              <div className="space-y-2">
                {getRecentComponents().map((component: any) => (
                  <div
                    key={component.id}
                    className="flex items-center justify-between card-minimal compact-xs"
                  >
                    <div className="flex items-center gap-2">
                      {component.type === 'llm' ? <Brain className="icon-sm" /> : <Package className="icon-sm" />}
                      <div>
                        <div className="text-sm font-medium text-primary">{component.name}</div>
                        <div className="text-xs text-tertiary">
                          {component.type === 'llm' ? component.provider : `v${component.version}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => actions.addComponentToWorkflow(component, component.type)}
                      className="text-success hover:text-success-light"
                    >
                      <Plus className="icon-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card compact-lg">
            <h3 className="text-base font-medium mb-4 flex items-center gap-2 text-primary">
              <Target className="icon" />
              Quick Actions
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => actions.setCurrentView('llm-market')}
                className="card-minimal compact text-center hover:bg-primary/5 transition-colors"
              >
                <Brain className="mx-auto mb-2 icon-lg text-primary" />
                <div className="text-sm">Browse LLMs</div>
              </button>
              
              <button
                onClick={() => actions.setCurrentView('npm-market')}
                className="card-minimal compact text-center hover:bg-primary/5 transition-colors"
              >
                <Package className="mx-auto mb-2 icon-lg text-primary" />
                <div className="text-sm">Browse NPM</div>
              </button>
              
              <button
                onClick={() => actions.setCurrentView('unified-playground')}
                className="card-minimal compact text-center hover:bg-primary/5 transition-colors"
              >
                <Workflow className="mx-auto mb-2 icon-lg text-success" />
                <div className="text-sm">Playground</div>
              </button>
              
              <button
                onClick={() => actions.setCurrentView('workflow-execution')}
                className="card-minimal compact text-center hover:bg-primary/5 transition-colors"
              >
                <Zap className="mx-auto mb-2 icon-lg text-warning" />
                <div className="text-sm">Live Demo</div>
              </button>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="card compact-lg text-center">
          <h3 className="text-lg font-medium mb-4 flex items-center justify-center gap-2 text-primary">
            <Globe className="icon" />
            🔗 Real-time Supabase Integration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Database className="mx-auto mb-2 text-success icon-lg" />
              <h4 className="font-medium mb-2 text-primary">Live Data Sync</h4>
              <p className="text-sm text-secondary">All playgrounds share real-time data from Supabase</p>
            </div>
            <div>
              <RefreshCw className="mx-auto mb-2 text-primary icon-lg" />
              <h4 className="font-medium mb-2 text-primary">Auto Updates</h4>
              <p className="text-sm text-secondary">Changes in one view instantly reflect in all others</p>
            </div>
            <div>
              <CheckCircle className="mx-auto mb-2 text-primary icon-lg" />
              <h4 className="font-medium mb-2 text-primary">Seamless Flow</h4>
              <p className="text-sm text-secondary">Navigate between markets and playgrounds with context</p>
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