import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import EnhancedLLMMarket from './components/EnhancedLLMMarket';
import NPMPlayground from './components/NPMPlayground';
import NPMMarketplace from './components/NPMMarketplace';
import NPMIntegratedPlayground from './components/NPMIntegratedPlayground';
import LLMPlayground from './components/LLMPlayground';
import EnhancedUnifiedPlayground from './components/EnhancedUnifiedPlayground';
import WorkflowExecutionPlayground from './components/WorkflowExecutionPlayground';
import IntegratedPlaygroundHub from './components/IntegratedPlaygroundHub';
import { PlaygroundProvider, usePlayground } from './context/PlaygroundContext';
import { useAuth } from './contexts/AuthContext';
import AuthModal from './components/auth/AuthModal';
import UserMenu from './components/auth/UserMenu';
import UserProfile from './components/auth/UserProfile';
import { Brain, Package, User, Workflow } from 'lucide-react';
import AdvancedPlaygroundDemo from './components/AdvancedPlaygroundDemo';
import { MultiModelChat } from './components/MultiModelChat';
import { WebbFinancialIntegration } from './components/WebbFinancialIntegration';
import { WebbDataImporter } from './components/WebbDataImporter';
import { WebbLocalDataProcessor } from './components/WebbLocalDataProcessor';
import { WebbSQLImporter } from './components/WebbSQLImporter';
import WebbDirectSQLImporter from './components/WebbDirectSQLImporter';
import { WebbMySQLMigrator } from './components/WebbMySQLMigrator';
import WebbDirectSQLUploader from './components/WebbDirectSQLUploader';

function AppContent() {
  const { state, actions } = usePlayground();
  const { user, loading: authLoading } = useAuth();
  const [initialPlaygroundPackage, setInitialPlaygroundPackage] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* 极简化导航栏 */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-6">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                LLM & NPM Playground
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 导航按钮 - 更加紧凑 */}
              <nav className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => actions.setCurrentView('integrated-hub')}
                  className={`btn-minimal ${
                    state.currentView === 'integrated-hub' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  <Workflow size={14} />
                  Hub
                </button>
                <button
                  onClick={() => actions.setCurrentView('llm-market')}
                  className={`btn-minimal ${
                    state.currentView === 'llm-market' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  <Brain size={14} />
                  LLM
                </button>
               <button
                 onClick={() => actions.setCurrentView('llm-playground')}
                 className={`btn-minimal ${
                   state.currentView === 'llm-playground' 
                     ? 'btn-primary' 
                     : 'btn-ghost'
                 }`}
               >
                 <Brain size={14} />
                 LLM Play
               </button>
                <button
                  onClick={() => actions.setCurrentView('npm-market')}
                  className={`btn-minimal ${
                    state.currentView === 'npm-market' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  <Package size={14} />
                  NPM
                </button>
                <button
                  onClick={() => actions.setCurrentView('npm-playground')}
                  className={`btn-minimal ${
                    state.currentView === 'npm-playground' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  <Package size={14} />
                  NPM Playground
                </button>
                <button
                  onClick={() => actions.setCurrentView('unified-playground')}
                  className={`btn-minimal ${
                    state.currentView === 'unified-playground' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  Enhanced
                </button>
                <button
                  onClick={() => actions.setCurrentView('workflow-execution')}
                  className={`btn-minimal ${
                    state.currentView === 'workflow-execution' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  Demo
                </button>
                <button
                  onClick={() => actions.setCurrentView('advanced-demo')}
                  className={`btn-minimal ${
                    state.currentView === 'advanced-demo' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  <Workflow size={14} />
                  Advanced
                </button>
                <button
                  onClick={() => actions.setCurrentView('multi-model-chat')}
                  className={`btn-minimal ${
                    state.currentView === 'multi-model-chat' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  <Brain size={14} />
                  Multi Chat
                </button>
                <button
                  onClick={() => actions.setCurrentView('webb-financial')}
                  className={`btn-minimal ${
                    state.currentView === 'webb-financial' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  🏦 Webb
                </button>
                <button
                  onClick={() => actions.setCurrentView('webb-importer')}
                  className={`btn-minimal ${
                    state.currentView === 'webb-importer' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  📥 Import
                </button>
                <button
                  onClick={() => actions.setCurrentView('webb-sql')}
                  className={`btn-minimal ${
                    state.currentView === 'webb-sql' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  📁 SQL
                </button>
                <button
                  onClick={() => actions.setCurrentView('webb-direct-import')}
                  className={`btn-minimal ${
                    state.currentView === 'webb-direct-import' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  ⚡ Direct
                </button>
                <button
                  onClick={() => actions.setCurrentView('webb-mysql-migrator')}
                  className={`btn-minimal ${
                    state.currentView === 'webb-mysql-migrator' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  🔄 MySQL
                </button>
                <button
                  onClick={() => actions.setCurrentView('webb-sql-uploader')}
                  className={`btn-minimal ${
                    state.currentView === 'webb-sql-uploader' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                >
                  📤 Upload
                </button>
              </nav>

              {/* 用户认证 */}
              {authLoading ? (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              ) : user ? (
                <UserMenu 
                  onOpenProfile={() => setShowUserProfile(true)}
                  onOpenSettings={() => {}}
                />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-minimal btn-primary"
                >
                  <User size={14} />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {state.currentView === 'integrated-hub' ? (
          <IntegratedPlaygroundHub />
        ) : state.currentView === 'llm-market' ? (
          <EnhancedLLMMarket />
        ) : state.currentView === 'llm-playground' ? (
          <LLMPlayground />
        ) : state.currentView === 'npm-market' ? (
          <NPMMarketplace 
            onNavigateToPlayground={(pkg) => {
              actions.setCurrentView('npm-playground');
              setInitialPlaygroundPackage(pkg);
            }}
          />
        ) : state.currentView === 'npm-playground' ? (
          <NPMIntegratedPlayground 
            onNavigateToMarket={() => actions.setCurrentView('npm-market')}
            initialPackage={initialPlaygroundPackage}
          />
        ) : state.currentView === 'unified-playground' ? (
          <EnhancedUnifiedPlayground />
        ) : state.currentView === 'workflow-execution' ? (
          <WorkflowExecutionPlayground />
        ) : state.currentView === 'advanced-demo' ? (
          <AdvancedPlaygroundDemo />
        ) : state.currentView === 'multi-model-chat' ? (
          <MultiModelChat />
        ) : state.currentView === 'webb-financial' ? (
          <WebbFinancialIntegration />
        ) : state.currentView === 'webb-importer' ? (
          <WebbLocalDataProcessor />
        ) : state.currentView === 'webb-sql' ? (
          <WebbSQLImporter />
        ) : state.currentView === 'webb-direct-import' ? (
          <WebbDirectSQLImporter />
        ) : state.currentView === 'webb-mysql-migrator' ? (
          <WebbMySQLMigrator />
        ) : state.currentView === 'webb-sql-uploader' ? (
          <WebbDirectSQLUploader />
        ) : null}
      </main>

      {/* 模态框 */}
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