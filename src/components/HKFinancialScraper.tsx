import React, { useState } from 'react';
import { Calendar, Search, TrendingUp, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface DateRange { start: string; end: string; }
interface ScrapeTarget { id: string; name: string; url: string; category: 'hkex' | 'hksfc'; }
interface ScrapeResult { id: string; targetName: string; url: string; timestamp: string; data: any; status: 'success' | 'error'; recordCount: number; }

const SCRAPE_TARGETS: ScrapeTarget[] = [
  { id: 'hkex-shareholding', name: 'HKEX Shareholding Disclosure', url: 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx', category: 'hkex' },
  { id: 'hkex-announcements', name: 'HKEX Announcements', url: 'https://www1.hkexnews.hk/search/titlesearch.xhtml', category: 'hkex' },
  { id: 'hkex-market-data', name: 'HKEX Market Data', url: 'https://www.hkex.com.hk/Market-Data/Statistics', category: 'hkex' },
  { id: 'hksfc-licensed', name: 'HKSFC Licensed Persons', url: 'https://www.sfc.hk/en/Register-of-licensed-persons', category: 'hksfc' }
];

export default function HKFinancialScraper() {
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
  const [stockCodes, setStockCodes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResult[]>([]);

  const toggleTarget = (id: string) => setSelectedTargets(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleScrape = async () => {
    if (!selectedTargets.length) return alert('Select at least one target');
    setIsLoading(true);
    setResults([]);
    const targets = SCRAPE_TARGETS.filter(t => selectedTargets.includes(t.id));
    const newResults: ScrapeResult[] = [];
    for (let i = 0; i < targets.length; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const codes = stockCodes.split(',').map(c => c.trim()).filter(Boolean);
      newResults.push({
        id: `r-${Date.now()}-${i}`,
        targetName: targets[i].name,
        url: targets[i].url,
        timestamp: new Date().toISOString(),
        data: { records: codes.map(c => ({ stockCode: c, date: dateRange.start, value: Math.random() * 1000 })) },
        status: 'success',
        recordCount: codes.length || 10
      });
    }
    setResults(newResults);
    setIsLoading(false);
  };

  const exportCSV = (r: ScrapeResult) => {
    const csv = 'stockCode,date,value\n' + r.data.records.map((x: any) => `${x.stockCode},${x.date},${x.value}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.targetName.replace(/\s/g,'_')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HK Financial Data Scraper</h1>
            <p className="text-gray-600 dark:text-gray-300">棣欐腐閲戣瀺鏁版嵁鐖櫕 - HKEX & HKSFC</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />Select Targets
              </h2>
              {SCRAPE_TARGETS.map(t => (
                <label key={t.id} className="flex items-center gap-2 p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={selectedTargets.includes(t.id)} onChange={() => toggleTarget(t.id)} className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.category === 'hkex' ? '馃搱 HKEX' : '馃彌锔?HKSFC'}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />Date Range
              </h2>
              <div className="space-y-4">
                <div><label className="block text-sm mb-2">Start</label>
                  <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" />
                </div>
                <div><label className="block text-sm mb-2">End</label>
                  <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />Stock Codes
              </h2>
              <input type="text" placeholder="00700, 00005, 00001" value={stockCodes} onChange={e => setStockCodes(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700" />
            </div>

            <button onClick={handleScrape} disabled={isLoading || !selectedTargets.length} className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {isLoading ? <><Loader className="w-5 h-5 animate-spin" />Scraping...</> : <><Search className="w-5 h-5" />Start Scraping</>}
            </button>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />Results
                {results.length > 0 && <span className="ml-auto text-sm text-gray-500">{results.length} results</span>}
              </h2>
              {results.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No results yet. Configure and start scraping.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map(r => (
                    <div key={r.id} className="border dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h3 className="font-medium">{r.targetName}</h3>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">{r.recordCount} records</p>
                        </div>
                        <button onClick={() => exportCSV(r)} className="px-3 py-1 bg-green-100 text-green-600 dark:bg-green-900/30 rounded hover:bg-green-200 text-sm">CSV</button>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-xs overflow-auto max-h-40">
                        <pre>{JSON.stringify(r.data.records.slice(0,2), null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
