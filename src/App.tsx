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
import { Brain, Package, User, Workflow, Search } from 'lucide-react';
import AdvancedPlaygroundDemo from './components/AdvancedPlaygroundDemo';
import { MultiModelChat } from './components/MultiModelChat';
import { WebbFinancialIntegration } from './components/WebbFinancialIntegration';
import { WebbDataImporter } from './components/WebbDataImporter';
import { WebbLocalDataProcessor } from './components/WebbLocalDataProcessor';
import { WebbSQLImporter } from './components/WebbSQLImporter';
import WebbDirectSQLImporter from './components/WebbDirectSQLImporter';
import { WebbMySQLMigrator } from './components/WebbMySQLMigrator';
import WebbDirectSQLUploader from './components/WebbDirectSQLUploader';
import EnvironmentChecker from './components/EnvironmentChecker';
import HKFinancialScraper from './components/HKFinancialScraper';
import HKScraperProduction from './components/HKScraperProduction';
import HKScraperModern from './components/HKScraperModern';
import WebScraperDemo from './components/WebScraperDemo';
import HKScraperWithPuppeteer from './components/HKScraperWithPuppeteer';

function AppContent() {
  const { state, actions } = usePlayground();
  const { user, loading: authLoading } = useAuth();
  const [initialPlaygroundPackage, setInitialPlaygroundPackage] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* 极简化导航栏 */}
      <nav className="border-b border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-6">
              <h1 className="text-lg font-semibold text-gray-100">
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
                  onClick={() => actions.setCurrentView('hk-scraper')}
                  className={`btn-minimal ${
                    state.currentView === 'hk-scraper'
                      ? 'btn-primary'
                      : 'btn-ghost'
                  }`}
                  title="HK Data Hub - Modern CCASS, HKSFC, HKEX integration / 香港数据中心"
                >
                  <Search size={14} />
                  HK Data
                </button>
                <button
                  onClick={() => actions.setCurrentView('web-scraper')}
                  className={`btn-minimal ${
                    state.currentView === 'web-scraper'
                      ? 'btn-primary'
                      : 'btn-ghost'
                  }`}
                  title="Web Scraper Demo - Firecrawl & Puppeteer integration"
                >
                  <Search size={14} />
                  Scraper
                </button>
                <button
                  onClick={() => actions.setCurrentView('puppeteer-scraper')}
                  className={`btn-minimal ${
                    state.currentView === 'puppeteer-scraper'
                      ? 'btn-primary'
                      : 'btn-ghost'
                  }`}
                  title="Puppeteer Scraper - CCASS Holdings & Market Stats"
                >
                  <Search size={14} />
                  Puppeteer
                </button>
                {/* Webb SQL Import/Update functions are temporarily disabled */}
                {/* 
                <button
                  onClick={() => actions.setCurrentView('webb-importer')}
                  className={`btn-minimal ${
                    state.currentView === 'webb-importer' 
                      ? 'btn-primary' 
                      : 'btn-ghost'
                  }`}
                  disabled
                  title="SQL Import functions temporarily disabled / SQL导入功能暂时禁用"
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
                  disabled
                  title="SQL Import functions temporarily disabled / SQL导入功能暂时禁用"
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
                  disabled
                  title="SQL Import functions temporarily disabled / SQL导入功能暂时禁用"
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
                  disabled
                  title="SQL Import functions temporarily disabled / SQL导入功能暂时禁用"
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
                  disabled
                  title="SQL Import functions temporarily disabled / SQL导入功能暂时禁用"
                >
                  📤 Upload
                </button>
                */}
              </nav>

              {/* 用户认证 */}
              {authLoading ? (
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
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
        ) : state.currentView === 'hk-scraper' ? (
          <HKScraperModern />
        ) : state.currentView === 'web-scraper' ? (
          <WebScraperDemo />
        ) : state.currentView === 'puppeteer-scraper' ? (
          <HKScraperWithPuppeteer />
        ) : state.currentView === 'webb-importer' ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              🚫 Feature Temporarily Disabled
            </h2>
            <p className="text-gray-300">
              SQL Import functions are temporarily disabled for maintenance.
              <br />
              SQL导入功能因维护而暂时禁用。
            </p>
          </div>
        ) : state.currentView === 'webb-sql' ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              🚫 Feature Temporarily Disabled
            </h2>
            <p className="text-gray-300">
              SQL Import functions are temporarily disabled for maintenance.
              <br />
              SQL导入功能因维护而暂时禁用。
            </p>
          </div>
        ) : state.currentView === 'webb-direct-import' ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              🚫 Feature Temporarily Disabled
            </h2>
            <p className="text-gray-300">
              SQL Import functions are temporarily disabled for maintenance.
              <br />
              SQL导入功能因维护而暂时禁用。
            </p>
          </div>
        ) : state.currentView === 'webb-mysql-migrator' ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              🚫 Feature Temporarily Disabled
            </h2>
            <p className="text-gray-300">
              SQL Import functions are temporarily disabled for maintenance.
              <br />
              SQL导入功能因维护而暂时禁用。
            </p>
          </div>
        ) : state.currentView === 'webb-sql-uploader' ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">
              🚫 Feature Temporarily Disabled
            </h2>
            <p className="text-gray-300">
              SQL Import functions are temporarily disabled for maintenance.
              <br />
              SQL导入功能因维护而暂时禁用。
            </p>
          </div>
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

      {/* Environment Checker (Development Only) */}
      <EnvironmentChecker />
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