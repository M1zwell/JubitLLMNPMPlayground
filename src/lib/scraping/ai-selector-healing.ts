/**
 * AI-Powered Selector Healing
 *
 * Experimental feature that uses LLM to auto-fix broken CSS selectors
 * when website structure changes.
 *
 * Concept:
 * 1. Extractor fails with "selector not found"
 * 2. Send HTML snapshot + intent to LLM
 * 3. LLM suggests alternative selectors
 * 4. Test suggestions and update extractor
 * 5. Log successful healing for future reference
 */

export interface SelectorHealingRequest {
  htmlSnapshot: string;           // Page HTML
  intent: string;                  // What we're trying to extract
  brokenSelector: string;          // Selector that stopped working
  expectedDataType: 'text' | 'number' | 'date' | 'url';
  sampleData?: string;             // Example of expected output
  contextDescription?: string;     // Human description of the element
}

export interface SelectorHealingSuggestion {
  selector: string;
  confidence: number;              // 0-100
  reasoning: string;
  fallbackSelectors: string[];     // Alternative selectors to try
  estimatedReliability: 'high' | 'medium' | 'low';
}

export interface HealingResult {
  success: boolean;
  newSelector?: string;
  suggestions: SelectorHealingSuggestion[];
  error?: string;
}

// ============================================================================
// AI Selector Healer (Concept Implementation)
// ============================================================================

export class AISelectorHealer {
  private llmEndpoint: string;
  private apiKey: string;
  private healingHistory: Map<string, string[]> = new Map(); // site -> successful selectors

  constructor(llmEndpoint?: string, apiKey?: string) {
    // Could use OpenAI, Anthropic Claude, or local LLM
    this.llmEndpoint = llmEndpoint || 'https://api.openai.com/v1/chat/completions';
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  /**
   * Attempt to heal a broken selector using LLM
   */
  async healSelector(request: SelectorHealingRequest): Promise<HealingResult> {
    if (!this.apiKey) {
      return {
        success: false,
        suggestions: [],
        error: 'AI healing requires LLM API key (VITE_OPENAI_API_KEY)',
      };
    }

    try {
      // Generate LLM prompt
      const prompt = this.buildHealingPrompt(request);

      // Call LLM
      const suggestions = await this.callLLM(prompt);

      // Test suggestions against HTML
      const testedSuggestions = this.testSelectors(
        suggestions,
        request.htmlSnapshot,
        request.expectedDataType
      );

      // Find best working selector
      const bestSelector = testedSuggestions.find(s => s.confidence > 80);

      if (bestSelector) {
        // Log successful healing
        this.logHealingSuccess(request, bestSelector.selector);

        return {
          success: true,
          newSelector: bestSelector.selector,
          suggestions: testedSuggestions,
        };
      }

      return {
        success: false,
        suggestions: testedSuggestions,
        error: 'No high-confidence selectors found',
      };
    } catch (error) {
      return {
        success: false,
        suggestions: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Build LLM prompt for selector healing
   */
  private buildHealingPrompt(request: SelectorHealingRequest): string {
    return `You are a web scraping expert. A CSS selector has stopped working due to website changes.

**Task**: Find a new CSS selector that extracts the same data.

**Context**:
- Intent: ${request.intent}
- Broken Selector: ${request.brokenSelector}
- Expected Data Type: ${request.expectedDataType}
${request.sampleData ? `- Sample Expected Output: ${request.sampleData}` : ''}
${request.contextDescription ? `- Element Description: ${request.contextDescription}` : ''}

**HTML Snapshot** (first 5000 chars):
\`\`\`html
${request.htmlSnapshot.substring(0, 5000)}
\`\`\`

**Instructions**:
1. Analyze the HTML structure
2. Find the element that contains: "${request.intent}"
3. Suggest 3-5 CSS selectors, ordered by reliability
4. For each selector, explain your reasoning
5. Prefer semantic HTML5 tags and stable attributes (id, data-* attributes)
6. Avoid fragile selectors (nth-child, long class chains)

**Output Format** (JSON):
\`\`\`json
{
  "suggestions": [
    {
      "selector": "article.news h2",
      "confidence": 90,
      "reasoning": "Uses semantic article tag + heading",
      "fallbackSelectors": [".news-title", "h2.headline"],
      "estimatedReliability": "high"
    }
  ]
}
\`\`\``;
  }

  /**
   * Call LLM API to get selector suggestions
   */
  private async callLLM(prompt: string): Promise<SelectorHealingSuggestion[]> {
    try {
      const response = await fetch(this.llmEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a web scraping expert specializing in robust CSS selector design.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent output
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed.suggestions || [];
      }

      // Try parsing the whole response as JSON
      try {
        const parsed = JSON.parse(content);
        return parsed.suggestions || [];
      } catch {
        throw new Error('Failed to parse LLM response as JSON');
      }
    } catch (error) {
      console.error('LLM call failed:', error);
      return [];
    }
  }

  /**
   * Test selectors against HTML to verify they work
   */
  private testSelectors(
    suggestions: SelectorHealingSuggestion[],
    html: string,
    expectedDataType: string
  ): SelectorHealingSuggestion[] {
    // In browser environment, test with DOMParser
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      return suggestions.map(suggestion => {
        try {
          const element = doc.querySelector(suggestion.selector);

          if (element) {
            // Boost confidence if selector finds element
            suggestion.confidence = Math.min(100, suggestion.confidence + 10);

            // Further boost if data type matches
            const textContent = element.textContent?.trim() || '';
            if (this.matchesDataType(textContent, expectedDataType)) {
              suggestion.confidence = Math.min(100, suggestion.confidence + 10);
            }
          } else {
            // Reduce confidence if selector doesn't work
            suggestion.confidence = Math.max(0, suggestion.confidence - 30);
          }
        } catch (error) {
          // Invalid selector
          suggestion.confidence = 0;
          suggestion.estimatedReliability = 'low';
        }

        return suggestion;
      });
    }

    // If not in browser, return as-is
    return suggestions;
  }

  /**
   * Check if extracted text matches expected data type
   */
  private matchesDataType(text: string, expectedType: string): boolean {
    switch (expectedType) {
      case 'number':
        return /\d/.test(text);
      case 'date':
        return /\d{4}/.test(text) || /\d{1,2}\/\d{1,2}/.test(text);
      case 'url':
        return text.startsWith('http') || text.startsWith('//');
      case 'text':
      default:
        return text.length > 0;
    }
  }

  /**
   * Log successful healing for future reference
   */
  private logHealingSuccess(request: SelectorHealingRequest, newSelector: string): void {
    const url = new URL(request.htmlSnapshot.match(/https?:\/\/[^\s"]+/)?.[0] || 'unknown');
    const site = url.hostname;

    if (!this.healingHistory.has(site)) {
      this.healingHistory.set(site, []);
    }

    this.healingHistory.get(site)!.push(newSelector);

    console.log(`[AI Healing] Success for ${site}: ${request.brokenSelector} → ${newSelector}`);
  }

  /**
   * Get healing success rate for a site
   */
  getHealingStats(site: string): { healingCount: number; selectors: string[] } {
    const selectors = this.healingHistory.get(site) || [];
    return {
      healingCount: selectors.length,
      selectors,
    };
  }
}

// ============================================================================
// Fallback Chain Builder
// ============================================================================

/**
 * Build a fallback chain of selectors for resilience
 *
 * Example:
 * [
 *   '#specific-id',              // Most specific, most fragile
 *   '[data-testid="news"]',      // Data attribute (stable)
 *   'article.news h2',           // Semantic HTML
 *   '.news-container .title',    // Class-based
 *   'h2'                         // Most general, least specific
 * ]
 */
export function buildFallbackChain(primarySelector: string): string[] {
  const chain: string[] = [primarySelector];

  // Add variations
  if (primarySelector.includes('#')) {
    // ID-based → add class fallback
    const classSelector = primarySelector.replace(/#[\w-]+/, '[class*=""]');
    chain.push(classSelector);
  }

  if (primarySelector.includes('.')) {
    // Class-based → add tag fallback
    const tagMatch = primarySelector.match(/^(\w+)/);
    if (tagMatch) {
      chain.push(tagMatch[1]);
    }
  }

  return chain;
}

// ============================================================================
// Integration with Extractors
// ============================================================================

/**
 * Auto-healing extractor wrapper
 *
 * Wraps any extractor with AI healing capability.
 */
export class SelfHealingExtractor<TInput, TOutput> {
  private healer: AISelectorHealer;
  private baseExtractor: any;

  constructor(baseExtractor: any) {
    this.baseExtractor = baseExtractor;
    this.healer = new AISelectorHealer();
  }

  async extract(input: TInput): Promise<TOutput> {
    try {
      // Try normal extraction
      return await this.baseExtractor.extract(input);
    } catch (error) {
      // If extraction fails, attempt AI healing
      console.warn('[Self-Healing] Extraction failed, attempting AI healing...');

      // TODO: Implement healing logic
      // 1. Detect which selector failed
      // 2. Build healing request
      // 3. Call AI healer
      // 4. Update extractor with new selector
      // 5. Retry extraction

      throw error; // For now, rethrow
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export { AISelectorHealer };
