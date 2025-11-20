// Legal Cases Scraper Adapter
// Source: Hong Kong Judiciary - Legal Reference System
// Engine: Firecrawl API

import { fetchWithRetry } from '../utils/http-client.ts';

const LEGAL_REF_URL = 'https://legalref.judiciary.hk/lrs/common/ju/judgment.jsp';

export interface LegalRecord {
  case_title: string;
  case_number?: string;
  case_type?: string;
  court_name?: string;
  judge_name?: string;
  case_facts?: string;
  case_ruling?: string;
  judgment_date?: Date;
  url: string;
  cited_cases?: string[];
}

export async function scrapeLegal(limit: number = 100, testMode: boolean = false): Promise<LegalRecord[]> {
  console.log(`[Legal Adapter] Starting scrape (limit: ${limit}, test_mode: ${testMode})`);

  if (testMode) {
    return generateMockLegalData(limit);
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      console.warn('[Legal Adapter] No Firecrawl API key found, using mock data');
      return generateMockLegalData(limit);
    }

    return await scrapeWithFirecrawl(limit, firecrawlApiKey);
  } catch (error) {
    console.error('[Legal Adapter] Scraping failed:', error);
    return generateMockLegalData(Math.min(limit, 5));
  }
}

async function scrapeWithFirecrawl(limit: number, apiKey: string): Promise<LegalRecord[]> {
  console.log('[Legal Adapter] Scraping via Firecrawl...');

  try {
    // Use Firecrawl to scrape the Recent Judgments page
    // We'll use the LLM extraction feature to parse the unstructured legal text/list
    const response = await fetchWithRetry('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: LEGAL_REF_URL,
        formats: ['markdown', 'json'],
        jsonOptions: {
          prompt: `Extract recent legal judgments from the list.
                   For each case, extract:
                   - case_title: The full title of the case (e.g., "HKSAR v. CHAN TAI MAN")
                   - case_number: The case number (e.g., "HCCC 123/2024")
                   - court_name: The court (e.g., "Court of First Instance")
                   - judgment_date: The date of judgment in YYYY-MM-DD format
                   - url: The link to the full judgment
                   - judge_name: Name of the judge(s) if mentioned
                   - case_type: Type of case (Civil, Criminal, etc.) if mentioned`,
          schema: {
            type: 'object',
            properties: {
              judgments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    case_title: { type: 'string' },
                    case_number: { type: 'string' },
                    court_name: { type: 'string' },
                    judgment_date: { type: 'string' },
                    url: { type: 'string' },
                    judge_name: { type: 'string' },
                    case_type: { type: 'string' }
                  },
                  required: ['case_title', 'url']
                }
              }
            }
          }
        },
        waitFor: 3000
      })
    }, { maxRetries: 2 });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data?.json?.judgments) {
      console.warn('[Legal Adapter] No structured data returned from Firecrawl');
      return [];
    }

    const judgments = data.data.json.judgments;
    console.log(`[Legal Adapter] Extracted ${judgments.length} judgments`);

    return judgments.slice(0, limit).map((j: any) => ({
      case_title: j.case_title,
      case_number: j.case_number,
      case_type: j.case_type || 'Unknown',
      court_name: j.court_name,
      judge_name: j.judge_name,
      judgment_date: j.judgment_date ? new Date(j.judgment_date) : undefined,
      url: j.url?.startsWith('http') ? j.url : `https://legalref.judiciary.hk${j.url}`,
      case_facts: 'Extracted via Firecrawl',
      cited_cases: []
    }));

  } catch (error) {
    console.error('[Legal Adapter] Firecrawl error:', error);
    throw error;
  }
}

function generateMockLegalData(count: number): LegalRecord[] {
  const mockRecords: LegalRecord[] = [];
  const currentDate = new Date();
  const caseTypes = ['civil', 'criminal', 'administrative'];
  const courts = ['Court of First Instance', 'Court of Appeal', 'Court of Final Appeal'];

  for (let i = 0; i < Math.min(count, 10); i++) {
    const caseType = caseTypes[i % caseTypes.length];
    const court = courts[i % courts.length];

    mockRecords.push({
      case_title: `Mock Legal Case ${i + 1}: ${caseType} matter`,
      case_number: `HCMP ${1000 + i}/2024`,
      case_type: caseType,
      court_name: court,
      judge_name: `Hon. Judge ${String.fromCharCode(65 + (i % 26))}`,
      case_facts: `Mock case facts for testing. This is a ${caseType} case heard in ${court}.`,
      case_ruling: `Mock ruling: Case ${i % 2 === 0 ? 'allowed' : 'dismissed'}.`,
      judgment_date: new Date(currentDate.getTime() - i * 7 * 24 * 60 * 60 * 1000),
      url: `https://legalref.judiciary.hk/mock-case-${i + 1}`,
      cited_cases: i % 3 === 0 ? [`HCMP ${900 + i}/2023`, `CACV ${500 + i}/2023`] : []
    });
  }

  console.log(`[Legal Adapter] Generated ${mockRecords.length} mock records`);
  return mockRecords;
}
