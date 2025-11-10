// Legal Cases Scraper Adapter
// Source: Hong Kong legal databases
// Engine: Firecrawl API - PLACEHOLDER for Phase 1

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

  // Phase 1: Return mock data
  return generateMockLegalData(limit);
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
