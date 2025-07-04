import { useState } from 'react';
import EnhancedLLMMarket from './components/EnhancedLLMMarket';
import NPMPlayground from './components/NPMPlayground';
import NPMMarketplace from './components/NPMMarketplace';
import LLMPlayground from './components/LLMPlayground';
import EnhancedUnifiedPlayground from './components/EnhancedUnifiedPlayground';
import WorkflowExecutionPlayground from './components/WorkflowExecutionPlayground';
import IntegratedPlaygroundHub from './components/IntegratedPlaygroundHub';
import { PlaygroundProvider, usePlayground } from './context/PlaygroundContext';
import { Code, Brain, Package } from 'lucide-react';

function AppContent() {
  const { state, actions } = usePlayground();
  const [initialPlaygroundPackage, setInitialPlaygroundPackage] = useState(null);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <nav className="compact-lg border-b border-slate-700">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-100">
              🎪 LLM & NPM Playground
            </h1>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => actions.setCurrentView('integrated-hub')}
              className={`
                compact rounded-md transition-all duration-200 flex items-center gap-2 text-sm
                ${state.currentView === 'integrated-hub' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }
              `}
            >
              <span>🎮</span>
              Integrated Hub
            </button>
            <button
              onClick={() => actions.setCurrentView('llm-market')}
              className={`
                compact rounded-md transition-all duration-200 flex items-center gap-2 text-sm
                ${state.currentView === 'llm-market' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }
              `}
            >
              <Brain size={14} />
              LLM Market
            </button>
            <button
              onClick={() => actions.setCurrentView('llm-playground')}
              className={`
                compact rounded-md transition-all duration-200 flex items-center gap-2 text-sm
                ${state.currentView === 'llm-playground' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }
              `}
            >
              <Brain size={14} />
              LLM Playground
            </button>
            <button
              onClick={() => actions.setCurrentView('npm-market')}
              className={`
                compact rounded-md transition-all duration-200 flex items-center gap-2 text-sm
                ${state.currentView === 'npm-market' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }
              `}
            >
              <Package size={14} />
              NPM Market
            </button>
            <button
              onClick={() => actions.setCurrentView('npm-playground')}
              className={`
                compact rounded-md transition-all duration-200 flex items-center gap-2 text-sm
                ${state.currentView === 'npm-playground' 
                  ? 'bg-sky-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }
              `}
            >
              <Code size={14} />
              NPM Playground
            </button>
            <button
              onClick={() => actions.setCurrentView('unified-playground')}
              className={`
                compact rounded-md transition-all duration-200 flex items-center gap-2 text-sm
                ${state.currentView === 'unified-playground' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }
              `}
            >
              <span>🚀</span>
              Enhanced Playground
            </button>
            <button
              onClick={() => actions.setCurrentView('workflow-execution')}
              className={`
                compact rounded-md transition-all duration-200 flex items-center gap-2 text-sm
                ${state.currentView === 'workflow-execution' 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }
              `}
            >
              <span>⚡</span>
              Live Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="p-4">
        {state.currentView === 'integrated-hub' ? (
          <IntegratedPlaygroundHub />
        ) : state.currentView === 'llm-market' ? (
          <EnhancedLLMMarket />
        ) : state.currentView === 'llm-playground' ? (
          <LLMPlayground />
        ) : state.currentView === 'npm-market' ? (
          <NPMMarketplace 
            onNavigateToPlayground={(pkg) => {
              setInitialPlaygroundPackage(pkg);
              actions.setCurrentView('npm-playground');
            }}
          />
        ) : state.currentView === 'npm-playground' ? (
          <NPMPlayground 
            onNavigateToMarket={() => actions.setCurrentView('npm-market')}
            initialPackage={initialPlaygroundPackage}
          />
        ) : state.currentView === 'unified-playground' ? (
          <EnhancedUnifiedPlayground />
        ) : state.currentView === 'workflow-execution' ? (
          <WorkflowExecutionPlayground />
        ) : null}
      </div>
    </div>
  );
}

function App() {
  return (
    <PlaygroundProvider>
      <AppContent />
    </PlaygroundProvider>
  );
}

export default App;