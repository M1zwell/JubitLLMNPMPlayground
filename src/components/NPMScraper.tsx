import React, { useState } from 'react';
import { Package, Search, Sliders as Spider, Download, Archive, RefreshCw, AlertCircle, CheckCircle, X, Layers, Database, Clock, Server, Globe, Code, FileCode, Users, Zap, Loader } from 'lucide-react';
import { supabaseUrlForLogging } from '../lib/supabase';

interface ScraperState {
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  stats: {
    processed: number;
    added: number;
    updated: number;
  };
}

const NPMScraper: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [searchQuery, setSearchQuery] = useState('keywords:front-end');
  const [startPage, setStartPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [state, setState] = useState<ScraperState>({
    status: 'idle',
    message: '',
    stats: { processed: 0, added: 0, updated: 0 }
  });
  const [scrapeHistory, setScrapeHistory] = useState<{
    timestamp: Date;
    query: string;
    pages: number;
    stats: ScraperState['stats'];
  }[]>([]);

  // Load history from localStorage
  React.useEffect(() => {
    const history = localStorage.getItem('npm-scraper-history');
    if (history) {
      try {
        setScrapeHistory(JSON.parse(history));
      } catch (e) {
        console.error('Failed to parse scraper history:', e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (history: typeof scrapeHistory) => {
    localStorage.setItem('npm-scraper-history', JSON.stringify(history));
    setScrapeHistory(history);
  };

  const runScraper = async () => {
    if (state.status === 'running' || !searchQuery) return;
    
    setState({
      status: 'running',
      message: 'Starting NPM website scraper...',
      stats: { processed: 0, added: 0, updated: 0 }
    });

    try {
      if (!supabaseUrlForLogging) {
        throw new Error('Supabase is not configured. Please connect to Supabase first.');
      }

      const apiUrl = `${supabaseUrlForLogging}/functions/v1/npm-spider`;
      
      setState(prev => ({
        ...prev,
        message: `Scraping npmjs.com for ${searchQuery} (pages: ${startPage} - ${startPage + pages - 1})...`
      }));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery,
          startPage,
          pages,
          importType: 'manual'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scraper failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      setState({
        status: 'success',
        message: `Successfully scraped and imported packages!`,
        stats: { 
          processed: result.packagesProcessed || 0, 
          added: result.packagesAdded || 0, 
          updated: result.packagesUpdated || 0 
        }
      });
      
      // Add to history
      const newHistory = [
        {
          timestamp: new Date(),
          query: searchQuery,
          pages,
          stats: { 
            processed: result.packagesProcessed || 0, 
            added: result.packagesAdded || 0, 
            updated: result.packagesUpdated || 0 
          }
        },
        ...scrapeHistory
      ].slice(0, 10);
      
      saveHistory(newHistory);
      
      // Notify parent
      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
      
    } catch (error) {
      console.error('Scraper error:', error);
      setState({
        status: 'error',
        message: error.message || 'Scraper failed',
        stats: { processed: 0, added: 0, updated: 0 }
      });
    }
  };

  // Predefined queries
  const presetQueries = [
    { name: 'Front-end', query: 'keywords:front-end' },
    { name: 'React Components', query: 'keywords:react-component' },
    { name: 'Vue Components', query: 'keywords:vue-component' },
    { name: 'UI Libraries', query: 'keywords:ui-library' },
    { name: 'CSS Frameworks', query: 'keywords:css-framework' },
    { name: 'Tailwind Plugins', query: 'keywords:tailwind-plugin' },
  ];

  return (
    <div className="card-minimal space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-subheading flex items-center gap-2">
          <Spider className="text-emerald-600" size={18} />
          NPM Website Spider
        </h2>
      </div>
      
      {/* Status Display */}
      {state.status !== 'idle' && (
        <div className={`p-4 rounded-md mb-4 ${
          state.status === 'error' 
            ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800' 
            : state.status === 'success'
            ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
        }`}>
          {state.status === 'running' && (
            <div className="flex items-center gap-3 mb-2">
              <Loader className="animate-spin text-blue-600" size={16} />
              <p className="font-medium text-blue-700 dark:text-blue-300">{state.message}</p>
            </div>
          )}
          
          {state.status === 'success' && (
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={16} />
              <p className="font-medium text-green-700 dark:text-green-300">{state.message}</p>
            </div>
          )}
          
          {state.status === 'error' && (
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-600" size={16} />
              <p className="font-medium text-red-700 dark:text-red-300">{state.message}</p>
            </div>
          )}
          
          {(state.stats.processed > 0 || state.status === 'running') && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                <div className="font-medium">{state.stats.processed}</div>
                <div className="text-caption">Processed</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                <div className="font-medium text-green-600">{state.stats.added}</div>
                <div className="text-caption">Added</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                <div className="font-medium text-blue-600">{state.stats.updated}</div>
                <div className="text-caption">Updated</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preset Queries */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">Quick Scrape Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {presetQueries.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setSearchQuery(preset.query)}
              className={`p-2 rounded-md border text-sm text-left ${
                searchQuery === preset.query 
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Spider Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">NPM Search Query</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Example: keywords:front-end"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
          <p className="text-caption mt-1">
            Use format like 'keywords:css' or combine with 'OR' for multiple categories
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Page</label>
            <input
              type="number"
              min="0"
              value={startPage}
              onChange={(e) => setStartPage(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of Pages</label>
            <input
              type="number"
              min="1"
              max="10"
              value={pages}
              onChange={(e) => setPages(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            />
          </div>
        </div>
        
        <button
          onClick={runScraper}
          disabled={state.status === 'running' || !searchQuery}
          className="w-full btn-minimal btn-primary mt-2"
        >
          {state.status === 'running' ? (
            <>
              <Loader className="animate-spin" size={14} />
              Scraping NPM...
            </>
          ) : (
            <>
              <Spider size={14} />
              Start NPM Spider
            </>
          )}
        </button>
      </div>

      {/* History */}
      {scrapeHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <Clock className="text-gray-600" size={14} />
            Recent Scrapes
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {scrapeHistory.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm"
              >
                <div>
                  <div className="font-medium">{entry.query}</div>
                  <div className="text-caption flex items-center gap-2">
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>{entry.pages} page{entry.pages !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-600">{entry.stats.added} added</div>
                  <div className="text-blue-600">{entry.stats.updated} updated</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="text-sm p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <h4 className="font-semibold mb-2">How NPM Scraper Works:</h4>
        <ol className="list-decimal pl-5 space-y-1 text-gray-700 dark:text-gray-300">
          <li>Scrapes npmjs.com search results pages for package data</li>
          <li>Extracts names, descriptions, download counts, and keywords</li>
          <li>Automatically categorizes packages based on keywords and descriptions</li>
          <li>Updates existing packages or adds new ones to your database</li>
        </ol>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-xs">
          Note: This tool respects npmjs.com's robots.txt and uses appropriate delays between requests.
        </p>
      </div>
    </div>
  );
};

export default NPMScraper;