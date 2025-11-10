import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ScrapingResult {
  url: string;
  title?: string;
  content: string;
  markdown?: string;
  source: 'firecrawl' | 'puppeteer' | 'edge-function';
  timestamp: Date;
  links?: string[];
  images?: string[];
  metadata?: {
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
}

export default function WebScraperDemo() {
  const [url, setUrl] = useState('https://example.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<'edge-function' | 'client'>('edge-function');

  const handleScrape = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (method === 'edge-function') {
        // Use production scrape-orchestrator Edge Function
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

        const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            source: 'custom',
            strategy: 'firecrawl',
            options: {
              url: url
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          // Transform production response to match display format
          setResult({
            url: url,
            title: data.data?.metadata?.title || 'N/A',
            content: data.data?.content || data.data?.markdown || '',
            markdown: data.data?.markdown,
            source: 'edge-function',
            timestamp: new Date(data.timestamp),
            metadata: data.data?.metadata
          });
        } else {
          throw new Error(data.error || 'Scraping failed');
        }
      } else {
        // Client-side scraping (will show error message about browser compatibility)
        setError(
          'Client-side scraping is disabled in the browser. Puppeteer and Firecrawl require Node.js/Deno environment. Please use the "Edge Function" method instead, or use the MCP servers via Claude Code.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMCP = () => {
    alert(
      'To test MCP servers:\n\n' +
      '1. Use Claude Code and ask: "Use Firecrawl to scrape https://example.com"\n' +
      '2. Or ask: "Use Puppeteer to take a screenshot of https://example.com"\n' +
      '3. Or ask: "Open https://example.com in Chrome DevTools"\n\n' +
      'MCP servers are configured in .claude/settings.local.json'
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Web Scraper
          </h1>
          <p className="text-gray-400">
            Production scraping with Firecrawl via Edge Function
          </p>
        </div>

        {/* Scraping Interface */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Scraping Method
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="edge-function"
                    checked={method === 'edge-function'}
                    onChange={(e) => setMethod(e.target.value as 'edge-function')}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Edge Function (Server-side)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="client"
                    checked={method === 'client'}
                    onChange={(e) => setMethod(e.target.value as 'client')}
                    className="mr-2"
                  />
                  <span className="text-gray-300">Client-side (Disabled)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL to Scrape
              </label>
              <Input
                type="url"
                value={url}
                onChange={(value) => setUrl(value)}
                placeholder="https://example.com"
                className="w-full bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleScrape}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Scraping...' : 'Scrape URL'}
              </Button>
              <Button
                onClick={handleTestMCP}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Test MCP Servers
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-900/20 border-red-700 p-4">
            <div className="flex items-start gap-3">
              <div className="text-red-400 font-mono text-sm">⚠️</div>
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-1">Error</h3>
                <p className="text-red-300 text-sm whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
            {/* Metadata */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">
                Scraping Results
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">URL:</span>
                  <p className="text-gray-200 break-all">{result.url}</p>
                </div>
                <div>
                  <span className="text-gray-400">Title:</span>
                  <p className="text-gray-200">{result.title || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Source:</span>
                  <p className="text-gray-200 capitalize">{result.source}</p>
                </div>
                <div>
                  <span className="text-gray-400">Timestamp:</span>
                  <p className="text-gray-200">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Metadata */}
            {result.metadata && (
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-3 text-purple-400">
                  Metadata
                </h3>
                <div className="space-y-2 text-sm">
                  {result.metadata.description && (
                    <div>
                      <span className="text-gray-400">Description:</span>
                      <p className="text-gray-200">{result.metadata.description}</p>
                    </div>
                  )}
                  {result.metadata.keywords && (
                    <div>
                      <span className="text-gray-400">Keywords:</span>
                      <p className="text-gray-200">{result.metadata.keywords}</p>
                    </div>
                  )}
                  {result.metadata.ogTitle && (
                    <div>
                      <span className="text-gray-400">OG Title:</span>
                      <p className="text-gray-200">{result.metadata.ogTitle}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Content */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-3 text-green-400">
                Content Preview
              </h3>
              <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono">
                  {result.content.slice(0, 2000)}
                  {result.content.length > 2000 && '\n\n... (truncated)'}
                </pre>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Content length: {result.content.length} characters
              </div>
            </Card>

            {/* Links */}
            {result.links && result.links.length > 0 && (
              <Card className="bg-gray-800 border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-3 text-yellow-400">
                  Links Found ({result.links.length})
                </h3>
                <div className="bg-gray-900 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <ul className="space-y-1 text-sm">
                    {result.links.slice(0, 50).map((link, index) => (
                      <li key={index} className="text-blue-400 hover:text-blue-300">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                    {result.links.length > 50 && (
                      <li className="text-gray-500">
                        ... and {result.links.length - 50} more
                      </li>
                    )}
                  </ul>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Information Card */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">
            Available Scraping Methods
          </h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="bg-gray-900 p-3 rounded">
              <div className="font-semibold text-green-400">✓ Edge Function Method (Production)</div>
              <p className="text-gray-400 mt-1">
                Production server-side scraping using scrape-orchestrator Edge Function.
                Uses Firecrawl for JavaScript rendering and returns structured data.
              </p>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <div className="font-semibold text-purple-400">✓ MCP Servers</div>
              <p className="text-gray-400 mt-1">
                Use Claude Code to access Firecrawl MCP, Puppeteer MCP, and Chrome
                DevTools MCP servers configured in .claude/settings.local.json
              </p>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <div className="font-semibold text-red-400">✗ Client-side Method</div>
              <p className="text-gray-400 mt-1">
                Disabled in browser builds. Puppeteer and Firecrawl require Node.js/Deno
                and cannot run in the browser.
              </p>
            </div>
          </div>
        </Card>

        {/* MCP Configuration */}
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-400">
            MCP Server Configuration
          </h3>
          <div className="bg-gray-900 p-4 rounded-lg">
            <pre className="text-gray-300 text-xs overflow-x-auto">
{`MCP Servers configured in .claude/settings.local.json:

1. Firecrawl MCP
   Command: npx -y @mendableai/firecrawl-mcp-server
   API Key: Configured

2. Puppeteer MCP
   Command: npx -y @modelcontextprotocol/server-puppeteer

3. Chrome DevTools MCP
   Command: npx -y @modelcontextprotocol/server-puppeteer
   Environment: PUPPETEER_HEADLESS=false, PUPPETEER_DEVTOOLS=true

Ask Claude Code:
- "Use Firecrawl to scrape https://example.com"
- "Use Puppeteer to screenshot https://example.com"
- "Open https://example.com in Chrome DevTools"`}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
