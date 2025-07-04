import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
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
import ThemeToggle from './components/ui/ThemeToggle';
import LanguageSelector from './components/ui/LanguageSelector';
import { Code, Brain, Package, User, Settings } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';

function AppContent() {
  const { state, actions } = usePlayground();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [initialPlaygroundPackage, setInitialPlaygroundPackage] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <nav className="nav">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-primary">
              🎪 {t('appName')}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Navigation buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => actions.setCurrentView('integrated-hub')}
                className={`nav-item ${state.currentView === 'integrated-hub' ? 'active' : ''}`}
              >
                <span>🎮</span>
                {t('integratedHub')}
              </button>
              <button
                onClick={() => actions.setCurrentView('llm-market')}
                className={`nav-item ${state.currentView === 'llm-market' ? 'active' : ''}`}
              >
                <Brain size={14} />
                {t('llmMarket')}
              </button>
              <button
                onClick={() => actions.setCurrentView('llm-playground')}
                className={`nav-item ${state.currentView === 'llm-playground' ? 'active' : ''}`}
              >
                <Brain size={14} />
                {t('llmPlayground')}
              </button>
              <button
                onClick={() => actions.setCurrentView('npm-market')}
                className={`nav-item ${state.currentView === 'npm-market' ? 'active' : ''}`}
              >
                <Package size={14} />
                {t('npmMarket')}
              </button>
              <button
                onClick={() => actions.setCurrentView('npm-playground')}
                className={`nav-item ${state.currentView === 'npm-playground' ? 'active' : ''}`}
              >
                <Code size={14} />
                {t('npmPlayground')}
              </button>
              <button
                onClick={() => actions.setCurrentView('unified-playground')}
                className={`nav-item ${state.currentView === 'unified-playground' ? 'active' : ''}`}
              >
                <span>🚀</span>
                {t('enhancedPlayground')}
              </button>
              <button
                onClick={() => actions.setCurrentView('workflow-execution')}
                className={`nav-item ${state.currentView === 'workflow-execution' ? 'active' : ''}`}
              >
                <span>⚡</span>
                {t('liveDemo')}
              </button>
            </div>

            {/* Theme and language toggles */}
            <div className="flex items-center gap-2 ml-2">
              <ThemeToggle className="btn btn-ghost compact-xs" />
              <LanguageSelector className="btn btn-ghost compact-xs" />
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
                {t('signIn')}
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
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <PlaygroundProvider>
            <AppContent />
          </PlaygroundProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;