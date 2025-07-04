import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import EnhancedLLMMarket from './components/EnhancedLLMMarket';
import NPMPlayground from './components/NPMPlayground';
import NPMMarketplace from './components/NPMMarketplace';
import LLMPlayground from './components/LLMPlayground';
import EnhancedUnifiedPlayground from './components/EnhancedUnifiedPlayground';
import WorkflowExecutionPlayground from './components/WorkflowExecutionPlayground';
import IntegratedPlaygroundHub from './components/IntegratedPlaygroundHub';
import { PlaygroundProvider, usePlayground } from './context/PlaygroundContext';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/auth/AuthModal';
import UserMenu from './components/auth/UserMenu';
import UserProfile from './components/auth/UserProfile';
import { Code, Brain, Package, User } from 'lucide-react';

function AppContent() {
  const { state, actions } = usePlayground();
  const { user, loading: authLoading } = useAuth();
  const [initialPlaygroundPackage, setInitialPlaygroundPackage] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <nav className="nav">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-primary">
              🎪 LLM & NPM Playground
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Navigation buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => actions.setCurrentView('integrated-hub')}
                className={`nav-item ${state.currentView === 'integrated-hub' ? 'active' : ''}`}
              >
                <span>🎮</span>
                Integrated Hub
              </button>
              <button
                onClick={() => actions.setCurrentView('llm-market')}
                className={`nav-item ${state.currentView === 'llm-market' ? 'active' : ''}`}
              >
                <Brain size={14} />
                LLM Market
              </button>
              <button
                onClick={() => actions.setCurrentView('llm-playground')}
                className={`nav-item ${state.currentView === 'llm-playground' ? 'active' : ''}`}
              >
                <Brain size={14} />
                LLM Playground
              </button>
              <button
                onClick={() => actions.setCurrentView('npm-market')}
                className={`nav-item ${state.currentView === 'npm-market' ? 'active' : ''}`}
              >
                <Package size={14} />
                NPM Market
              </button>
              <button
                onClick={() => actions.setCurrentView('npm-playground')}
                className={`nav-item ${state.currentView === 'npm-playground' ? 'active' : ''}`}
              >
                <Code size={14} />
                NPM Playground
              </button>
              <button
                onClick={() => actions.setCurrentView('unified-playground')}
                className={`nav-item ${state.currentView === 'unified-playground' ? 'active' : ''}`}
              >
                <span>🚀</span>
                Enhanced Playground
              </button>
              <button
                onClick={() => actions.setCurrentView('workflow-execution')}
                className={`nav-item ${state.currentView === 'workflow-execution' ? 'active' : ''}`}
              >
                <span>⚡</span>
                Live Demo
              </button>
            </div>

            {/* User authentication */}
            {authLoading ? (
              <div className="w-8 h-8 bg-secondary rounded-full loading"></div>
            ) : user ? (
              <UserMenu 
                onOpenProfile={() => setShowUserProfile(true)}
                onOpenSettings={() => {}}
              />
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn btn-primary"
              >
                <User size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="p-6 bg-primary">
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

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <UserProfile 
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <PlaygroundProvider>
        <AppContent />
      </PlaygroundProvider>
    </AuthProvider>
  );
}

export default App;