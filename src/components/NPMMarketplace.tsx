import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Search, Filter, Download, Star, Github, ExternalLink, 
  TrendingUp, Calendar, Code, Shield, Zap, Users, BarChart3,
  RefreshCw, Plus, Import, Clock, CheckCircle, AlertCircle,
  Eye, Copy, Globe, Terminal, Settings, Palette, Database,
  BookOpen, Wifi, Smartphone, Cpu, Calculator
} from 'lucide-react';
import { useNPMPackages, useNPMCategories, importNPMPackages } from '../hooks/useNPMPackages';
import { NPMPackage } from '../lib/supabase';
import { usePlayground } from '../context/PlaygroundContext';
import AIWorkflowAdvisor, { AIAdvisorEventManager } from './AIWorkflowAdvisor';

const CATEGORIES = {
  all: { name: 'All Packages', icon: Package, color: 'text-gray-400' },
  'front-end': { name: 'Front-end', icon: Globe, color: 'text-blue-400' },
  'back-end': { name: 'Back-end', icon: Code, color: 'text-green-400' },
  cli: { name: 'CLI Tools', icon: Terminal, color: 'text-purple-400' },
  documentation: { name: 'Documentation', icon: BookOpen, color: 'text-indigo-400' },
  css: { name: 'CSS & Styling', icon: Palette, color: 'text-pink-400' },
  frameworks: { name: 'Frameworks', icon: Zap, color: 'text-yellow-400' },
  testing: { name: 'Testing', icon: CheckCircle, color: 'text-cyan-400' },
  iot: { name: 'IoT', icon: Wifi, color: 'text-emerald-400' },
  coverage: { name: 'Coverage', icon: BarChart3, color: 'text-orange-400' },
  mobile: { name: 'Mobile', icon: Smartphone, color: 'text-purple-400' },
  robotics: { name: 'Robotics', icon: Cpu, color: 'text-red-400' },
  math: { name: 'Math', icon: Calculator, color: 'text-blue-400' }
};

const SORT_OPTIONS = [
  { value: 'downloads', label: 'Weekly Downloads', desc: true },
  { value: 'stars', label: 'GitHub Stars', desc: true },
  { value: 'quality', label: 'Quality Score', desc: true },
  { value: 'updated', label: 'Last Updated', desc: true },
  { value: 'name', label: 'Name', desc: false }
];

interface NPMMarketplaceProps {
  onNavigateToPlayground?: (pkg: NPMPackage) => void;
}

const NPMMarketplace: React.FC<NPMMarketplaceProps> = ({ onNavigateToPlayground }) => {
  const { actions } = usePlayground();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState<NPMPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('downloads');
  const [sortDesc, setSortDesc] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const { packages, loading, error, refetch } = useNPMPackages({
    category: selectedCategory,
    search: searchTerm,
    sortBy,
    sortDesc,
    limit: 200
  });

  const { categories } = useNPMCategories();

  // Filter packages
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const categoryMatch = selectedCategory === 'all' || pkg.categories.includes(selectedCategory);
      const searchMatch = !searchTerm || 
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return categoryMatch && searchMatch;
    });
  }, [packages, selectedCategory, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredPackages.length;
    const totalDownloads = filteredPackages.reduce((sum, pkg) => sum + pkg.weekly_downloads, 0);
    const avgQuality = total > 0 ? filteredPackages.reduce((sum, pkg) => sum + pkg.quality_score, 0) / total : 0;
    const withTypeScript = filteredPackages.filter(pkg => pkg.typescript_support).length;
    
    return { total, totalDownloads, avgQuality, withTypeScript };
  }, [filteredPackages]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPackageIcon = (pkg: NPMPackage): string => {
    if (pkg.categories.includes('frontend')) return '🌐';
    if (pkg.categories.includes('backend')) return '⚙️';
    if (pkg.categories.includes('cli')) return '💻';
    if (pkg.categories.includes('testing')) return '🧪';
    if (pkg.categories.includes('css')) return '🎨';
    if (pkg.categories.includes('build-tools')) return '🔧';
    return '📦';
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'rising': return 'text-green-400';
      case 'falling': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleImport = async (importData: {
    searchQuery?: string;
    categories?: string[];
    limit?: number;
    pages?: number;
    sortBy?: string;
  }) => {
    try {
      setImporting(true);
      const searchTerm = importData.searchQuery || 'packages';
      const pages = importData.pages || 1;
      setImportStatus(`🔍 Searching NPM registry for ${searchTerm} across ${pages} pages...`);
      
      console.log(`Starting NPM import for "${searchTerm}" (${pages} pages)`);
      
      const result = await importNPMPackages({
        ...importData,
        importType: 'manual'
      });
      
      setImportStatus(`✅ Import completed! Added ${result.packagesAdded} new packages, updated ${result.packagesUpdated} existing packages (${result.packagesProcessed} total processed)`);
      
      // Refresh the package list
      console.log('Import completed, refreshing package list...');
      setTimeout(() => {
        refetch();
        setShowImportModal(false);
        setImporting(false);
        setImportStatus(null);
      }, 2000);
      
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus(`❌ Import failed: ${error.message}`);
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400 mx-auto"></div>
          <p className="mt-4 text-xl text-green-300">Loading NPM packages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error loading packages</div>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-primary mb-2">
          📦 NPM Package Marketplace
        </h1>
        <p className="text-base text-secondary mb-1">
          Discover {packages.length} NPM packages • Real data from npmjs.com
        </p>
        <div className="text-xs text-tertiary">
          Download statistics, quality metrics, and GitHub data updated regularly
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card compact text-center">
          <div className="stat">
            <div className="stat-value text-primary">{stats.total}</div>
            <div className="stat-label">Packages Found</div>
          </div>
        </div>
        <div className="card compact text-center">
          <div className="stat">
            <div className="stat-value text-success">{formatNumber(stats.totalDownloads)}</div>
            <div className="stat-label">Weekly Downloads</div>
          </div>
        </div>
        <div className="card compact text-center">
          <div className="stat">
            <div className="stat-value text-warning">{stats.avgQuality.toFixed(1)}</div>
            <div className="stat-label">Avg Quality</div>
          </div>
        </div>
        <div className="card compact text-center">
          <div className="stat">
            <div className="stat-value text-primary">{stats.withTypeScript}</div>
            <div className="stat-label">TypeScript Ready</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card compact-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="icon" />
            <h3 className="text-base font-medium text-primary">Filters & Search</h3>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-success text-xs"
            >
              <Import className="icon-sm" />
              Import from NPM
            </button>
            <button
              onClick={refetch}
              className="btn btn-primary text-xs"
            >
              <RefreshCw className="icon-sm" />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted icon-sm" />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-8"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input"
          >
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{category.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Sort Direction */}
          <button
            onClick={() => setSortDesc(!sortDesc)}
            className="btn btn-secondary"
          >
            {sortDesc ? '↓' : '↑'} {sortDesc ? 'Desc' : 'Asc'}
          </button>
        </div>
        
        {/* Debug information for Supabase connection */}
        <div className="text-xs text-muted mt-2">
          {error ? (
            <p className="text-warning">Error: {error}</p>
          ) : (
            <p>Connected to Supabase database</p>
          )}
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid-auto-fill">
        {filteredPackages.map(pkg => (
          <div
            key={pkg.id}
            onClick={() => setSelectedPackage(selectedPackage?.id === pkg.id ? null : pkg)}
            onMouseEnter={() => {
              const eventManager = AIAdvisorEventManager.getInstance();
              eventManager.setQuotedData({
                type: 'npm',
                name: pkg.name,
                description: pkg.description || 'A useful NPM package for your projects',
                version: pkg.version,
                context: `NPM Package - Downloads: ${formatNumber(pkg.weekly_downloads)}/week, Stars: ${formatNumber(pkg.github_stars)}, Quality: ${pkg.quality_score}`
              });
            }}
            onMouseLeave={() => {
              setTimeout(() => {
                const eventManager = AIAdvisorEventManager.getInstance();
                eventManager.setQuotedData(null);
              }, 500);
            }}
            className={`
              card compact cursor-pointer transition-all
              ${selectedPackage?.id === pkg.id ? 'border-success shadow-md' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getPackageIcon(pkg)}</span>
                <div>
                  <h3 className="font-medium text-sm text-primary">{pkg.name}</h3>
                  <p className="text-xs text-tertiary">v{pkg.version}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-success">
                  {formatNumber(pkg.weekly_downloads)}
                </div>
                <div className="text-xs text-muted">weekly</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-secondary mb-3 line-clamp-2">
              {pkg.description || 'No description available'}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-1 mb-3 text-xs">
              <div className="badge badge-neutral">⭐ {formatNumber(pkg.github_stars)}</div>
              <div className="badge badge-neutral">📊 {pkg.quality_score}</div>
              <div className="badge badge-neutral">🔒 {pkg.license || 'N/A'}</div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {pkg.keywords.slice(0, 3).map((keyword, idx) => (
                <span key={idx} className="badge badge-primary text-xs">
                  {keyword}
                </span>
              ))}
              {pkg.typescript_support && (
                <span className="badge badge-primary text-xs">TS</span>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted">
                Updated {new Date(pkg.last_published || pkg.updated_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <span className={`${getTrendColor(pkg.download_trend)} text-xs capitalize`}>
                  {pkg.download_trend}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.selectNPMPackage(pkg);
                      actions.addComponentToWorkflow(pkg, 'npm');
                    }}
                    className="btn btn-success text-xs compact-xs"
                    title="Add to Workflow"
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.navigateToPlaygroundWithComponent(pkg, 'npm');
                    }}
                    className="btn btn-primary text-xs compact-xs flex items-center gap-1"
                    title="Use in Playground"
                  >
                    <Code className="icon-sm" />
                    Use
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Package Info */}
      {selectedPackage && (
        <div className="card compact-lg fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Package Details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{getPackageIcon(selectedPackage)}</span>
                <div>
                  <h2 className="text-lg font-semibold text-primary">{selectedPackage.name}</h2>
                  <p className="text-success text-sm">v{selectedPackage.version} • {selectedPackage.author}</p>
                </div>
              </div>

              <p className="text-secondary mb-4 text-sm">{selectedPackage.description}</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card-minimal compact">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-secondary">
                      <Download className="text-success icon-sm" />
                      Downloads
                    </h4>
                    <div className="text-sm text-primary">
                      <div>Weekly: {formatNumber(selectedPackage.weekly_downloads)}</div>
                      <div>Monthly: {formatNumber(selectedPackage.monthly_downloads)}</div>
                    </div>
                  </div>

                  <div className="card-minimal compact">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-secondary">
                      <Star className="text-warning icon-sm" />
                      GitHub
                    </h4>
                    <div className="text-sm text-primary">
                      <div>Stars: {formatNumber(selectedPackage.github_stars)}</div>
                      <div>Forks: {formatNumber(selectedPackage.github_forks)}</div>
                    </div>
                  </div>
                </div>

                <div className="card-minimal compact">
                  <h4 className="font-medium mb-2 text-secondary">Package Info</h4>
                  <div className="text-sm grid grid-cols-2 gap-2 text-primary">
                    <div>License: {selectedPackage.license}</div>
                    <div>Size: {formatNumber(selectedPackage.file_size)} bytes</div>
                    <div>Quality: {selectedPackage.quality_score}/100</div>
                    <div>TypeScript: {selectedPackage.typescript_support ? '✅' : '❌'}</div>
                  </div>
                </div>

                <div className="card-minimal compact">
                  <h4 className="font-medium mb-2 text-secondary">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.keywords.map((keyword, idx) => (
                      <span key={idx} className="badge badge-primary">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Links and Actions */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-primary">Quick Actions</h3>
              
              <div className="space-y-3">
                {selectedPackage.npm_url && (
                  <a 
                    href={selectedPackage.npm_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full card-minimal compact hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="text-warning icon" />
                      <div>
                        <div className="font-medium text-primary">View on NPM</div>
                        <div className="text-xs text-tertiary">Official package page</div>
                      </div>
                      <ExternalLink className="ml-auto icon-sm" />
                    </div>
                  </a>
                )}

                {selectedPackage.repository_url && (
                  <a 
                    href={selectedPackage.repository_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full card-minimal compact hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Github className="text-tertiary icon" />
                      <div>
                        <div className="font-medium text-primary">Source Code</div>
                        <div className="text-xs text-tertiary">GitHub repository</div>
                      </div>
                      <ExternalLink className="ml-auto icon-sm" />
                    </div>
                  </a>
                )}

                {selectedPackage.homepage && (
                  <a 
                    href={selectedPackage.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full card-minimal compact hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="text-primary icon" />
                      <div>
                        <div className="font-medium text-primary">Homepage</div>
                        <div className="text-xs text-tertiary">Official website</div>
                      </div>
                      <ExternalLink className="ml-auto icon-sm" />
                    </div>
                  </a>
                )}

                <div className="card-minimal compact">
                  <h4 className="font-medium mb-2 text-secondary">Install Command</h4>
                  <div className="bg-secondary rounded p-2 text-success font-mono text-xs">
                    npm install {selectedPackage.name}
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`npm install ${selectedPackage.name}`)}
                    className="mt-2 text-xs text-tertiary hover:text-primary flex items-center gap-1"
                  >
                    <Copy className="icon-sm" />
                    Copy command
                  </button>
                </div>
                
                <button
                  onClick={() => onNavigateToPlayground?.(selectedPackage)}
                  className="btn btn-primary w-full"
                >
                  <Code className="icon-sm" />
                  Use in Playground
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card-elevated compact-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4 text-primary">Import NPM Packages</h3>
            
            {importing ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success mx-auto mb-4"></div>
                <p className="text-secondary">{importStatus}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:frontend OR keywords:react OR keywords:vue OR keywords:angular OR keywords:ui OR keywords:component OR keywords:browser', 
                    limit: 100, 
                    pages: 1 
                  })}
                  className="btn btn-success w-full"
                >
                  🌐 Import Front-end Packages (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:backend OR keywords:express OR keywords:server OR keywords:api OR keywords:framework OR keywords:nodejs OR keywords:web', 
                    limit: 100, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  ⚙️ Import Back-end Packages (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:cli OR keywords:command OR keywords:terminal OR keywords:tool OR keywords:bin OR keywords:console', 
                    limit: 80, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  💻 Import CLI Tools (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:testing OR keywords:test OR keywords:jest OR keywords:mocha OR keywords:spec OR keywords:e2e OR keywords:unit', 
                    limit: 70, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  🧪 Import Testing Packages (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:css OR keywords:style OR keywords:sass OR keywords:less OR keywords:postcss OR keywords:styling OR keywords:stylesheet', 
                    limit: 60, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  🎨 Import CSS & Styling (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:documentation OR keywords:docs OR keywords:jsdoc OR keywords:docgen OR keywords:api-docs OR keywords:readme', 
                    limit: 40, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  📚 Import Documentation Tools (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:iot OR keywords:arduino OR keywords:raspberry-pi OR keywords:hardware OR keywords:sensor OR keywords:embedded', 
                    limit: 30, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  📡 Import IoT Packages (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:coverage OR keywords:codecov OR keywords:istanbul OR keywords:nyc OR keywords:code-coverage', 
                    limit: 25, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  📊 Import Coverage Tools (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:mobile OR keywords:react-native OR keywords:ionic OR keywords:cordova OR keywords:phonegap OR keywords:android OR keywords:ios', 
                    limit: 50, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  📱 Import Mobile Packages (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:framework OR keywords:next OR keywords:nuxt OR keywords:gatsby OR keywords:remix OR keywords:sveltekit', 
                    limit: 40, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  🚀 Import Framework Packages (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:robotics OR keywords:robot OR keywords:automation OR keywords:johnny-five OR keywords:firmata', 
                    limit: 20, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  🤖 Import Robotics Packages (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:math OR keywords:mathematics OR keywords:algorithm OR keywords:calculation OR keywords:numeric OR keywords:statistics', 
                    limit: 35, 
                    pages: 1 
                  })}
                  className="btn btn-primary w-full"
                >
                  🧮 Import Math Packages (1 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'popular', 
                    limit: 100, 
                    pages: 1,
                    sortBy: 'popularity' 
                  })}
                  className="btn btn-warning w-full font-medium"
                >
                  ⭐ Import Most Popular Packages (1 pages)
                </button>
                
                <button
                  onClick={() => setShowImportModal(false)}
                  className="btn btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Workflow Advisor */}
      <AIWorkflowAdvisor
        onComponentAdd={(component, type) => {
          if (type === 'npm') {
            actions.selectNPMPackage(component);
            actions.addComponentToWorkflow(component, type);
          }
        }}
        selectedComponents={[]}
      />
    </div>
  );
};

export default NPMMarketplace;