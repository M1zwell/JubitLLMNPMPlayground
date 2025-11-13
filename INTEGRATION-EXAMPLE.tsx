/**
 * 快速集成示例
 * 展示如何在 App.tsx 中使用新的 HKScraperModern 组件
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HKScraperModern from './components/HKScraperModern';
import HKScraperProduction from './components/HKScraperProduction'; // 保留旧版本对比

// ============================================
// 方案 1: 完全替换（最简单）
// ============================================

export function App_Replacement() {
  return (
    <Router>
      <Routes>
        {/* 直接替换旧组件 */}
        <Route path="/hk-scraper" element={<HKScraperModern />} />

        {/* 其他路由保持不变 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Router>
  );
}

// ============================================
// 方案 2: 并行使用（推荐测试期间）
// ============================================

export function App_Parallel() {
  return (
    <Router>
      <div>
        {/* 导航栏 */}
        <nav className="bg-white shadow-lg p-4">
          <div className="max-w-7xl mx-auto flex gap-4">
            <Link
              to="/hk-scraper-modern"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              🚀 Modern Version (New!)
            </Link>
            <Link
              to="/hk-scraper-legacy"
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              📄 Legacy Version
            </Link>
          </div>
        </nav>

        {/* 路由 */}
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* 新版本 - 现代化UI */}
          <Route path="/hk-scraper-modern" element={<HKScraperModern />} />

          {/* 旧版本 - 保留对比 */}
          <Route path="/hk-scraper-legacy" element={<HKScraperProduction />} />
        </Routes>
      </div>
    </Router>
  );
}

// ============================================
// 方案 3: 带导航的完整示例
// ============================================

export function App_Complete() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航栏 */}
        <Header />

        {/* 主内容区 */}
        <main className="max-w-7xl mx-auto py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* 香港数据中心 - 新版 */}
            <Route path="/data-hub" element={<HKScraperModern />} />

            {/* 其他页面 */}
            <Route path="/llm-market" element={<LLMMarketPage />} />
            <Route path="/npm-market" element={<NPMMarketPage />} />
          </Routes>
        </main>

        {/* 页脚 */}
        <Footer />
      </div>
    </Router>
  );
}

// ============================================
// 辅助组件
// ============================================

function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">JubitLLM Playground</h1>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">v2.0</span>
          </div>

          <nav className="flex gap-4">
            <Link
              to="/"
              className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              to="/data-hub"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-semibold"
            >
              📊 Data Hub
            </Link>
            <Link
              to="/llm-market"
              className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              LLM Market
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-bold mb-2">JubitLLM Playground</h3>
            <p className="text-gray-400 text-sm">
              Unified platform for LLM models and HK market data
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">Data Sources</h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>✓ HKEX CCASS Holdings</li>
              <li>✓ HKSFC Filings</li>
              <li>✓ HKEX Announcements</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2">Quick Links</h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>
                <Link to="/data-hub" className="hover:text-white">
                  Data Hub
                </Link>
              </li>
              <li>
                <a href="https://github.com" className="hover:text-white">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400 text-sm">
          © 2025 JubitLLM Playground. Powered by Supabase & Claude Code.
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-5xl font-bold mb-4">
        Welcome to JubitLLM Playground
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Explore LLM models and Hong Kong market data
      </p>

      <div className="flex justify-center gap-4">
        <Link
          to="/data-hub"
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          🚀 Launch Data Hub
        </Link>
      </div>

      {/* 特性卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
        <FeatureCard
          icon="📊"
          title="CCASS Holdings"
          description="View and analyze shareholding data from HKEX CCASS"
        />
        <FeatureCard
          icon="📈"
          title="Real-time Stats"
          description="Live concentration analysis and shareholder insights"
        />
        <FeatureCard
          icon="💾"
          title="Export Data"
          description="Export to JSON, CSV and more formats"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function LLMMarketPage() {
  return <div className="p-8 text-center">LLM Market Page</div>;
}

function NPMMarketPage() {
  return <div className="p-8 text-center">NPM Market Page</div>;
}

function AboutPage() {
  return <div className="p-8 text-center">About Page</div>;
}

// ============================================
// 导出默认配置（选择一个方案）
// ============================================

// 选择您想要的集成方案：
export default App_Complete; // 推荐：完整示例
// export default App_Parallel; // 或：并行测试
// export default App_Replacement; // 或：直接替换
