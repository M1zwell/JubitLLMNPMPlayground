/*
  LLM Models Update Edge Function - FIRECRAWL V2 IMPLEMENTATION

  This function uses Firecrawl v2 API to scrape live data from artificialanalysis.ai
  Features:
  - Extract endpoint with JSON schema for structured data
  - Stealth proxies for anti-bot protection
  - Wait actions for Next.js rendering
  - Fallback to known data if scraping fails
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface LLMModelData {
  name: string;
  provider: string;
  model_id: string;
  context_window: number;
  input_price: number;
  output_price: number;
  avg_price: number;
  output_speed: number;
  latency: number;
  quality_index?: number;
  license: string;
  features: string[];
  category: string;
  rarity: string;
  description: string;
}

interface UpdateStats {
  total_processed: number;
  models_added: number;
  models_updated: number;
  providers_found: string[];
  categories_updated: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request
    let update_type = 'manual';
    let force_refresh = false;
    let use_firecrawl = true;

    try {
      const body = await req.json();
      update_type = body.update_type || 'manual';
      force_refresh = body.force_refresh || false;
      use_firecrawl = body.use_firecrawl !== false; // Default true
    } catch (jsonError) {
      console.log('⚠️ No JSON body provided, using defaults');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    console.log('🚀 Starting LLM models update...');
    console.log(`🔧 Mode: ${use_firecrawl && firecrawlApiKey ? 'Firecrawl scraping' : 'Fallback data'}`);

    // Create update log entry
    const logResponse = await fetch(`${supabaseUrl}/rest/v1/llm_update_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        update_type,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
    });

    if (!logResponse.ok) {
      const errorText = await logResponse.text();
      console.error('Failed to create log entry:', errorText);
    }

    const updateLogData = await logResponse.json();
    const logId = Array.isArray(updateLogData) ? updateLogData[0]?.id : updateLogData?.id;

    const stats: UpdateStats = {
      total_processed: 0,
      models_added: 0,
      models_updated: 0,
      providers_found: [],
      categories_updated: []
    };

    try {
      // Fetch data from artificialanalysis.ai
      console.log('📡 Fetching data from artificialanalysis.ai...');
      const modelsData = use_firecrawl && firecrawlApiKey
        ? await fetchWithFirecrawl(firecrawlApiKey)
        : await getFallbackModelData();

      console.log(`📊 Found ${modelsData.length} models to process`);
      stats.total_processed = modelsData.length;

      // Process each model
      for (const modelData of modelsData) {
        try {
          const processedModel = await processModelData(modelData);

          // Check if model exists
          const existingResponse = await fetch(
            `${supabaseUrl}/rest/v1/llm_models?model_id=eq.${encodeURIComponent(processedModel.model_id)}&select=id,name`,
            {
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
              }
            }
          );

          const existingModels = await existingResponse.json();

          if (existingModels && existingModels.length > 0) {
            // Update existing model
            await fetch(
              `${supabaseUrl}/rest/v1/llm_models?model_id=eq.${encodeURIComponent(processedModel.model_id)}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json',
                  'apikey': supabaseServiceKey,
                },
                body: JSON.stringify({
                  ...processedModel,
                  last_updated: new Date().toISOString()
                })
              }
            );
            stats.models_updated++;
          } else {
            // Insert new model
            await fetch(`${supabaseUrl}/rest/v1/llm_models`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
              },
              body: JSON.stringify({
                ...processedModel,
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString()
              })
            });
            stats.models_added++;
          }

          // Track providers and categories
          if (!stats.providers_found.includes(processedModel.provider)) {
            stats.providers_found.push(processedModel.provider);
          }
          if (!stats.categories_updated.includes(processedModel.category)) {
            stats.categories_updated.push(processedModel.category);
          }

        } catch (modelError) {
          console.error(`❌ Error processing model ${modelData.name}:`, modelError);
        }
      }

      // Update log with success
      if (logId) {
        await fetch(`${supabaseUrl}/rest/v1/llm_update_logs?id=eq.${logId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({
            status: 'success',
            models_processed: stats.total_processed,
            models_added: stats.models_added,
            models_updated: stats.models_updated,
            providers_updated: stats.providers_found,
            completed_at: new Date().toISOString()
          })
        });
      }

      console.log('✅ Update completed successfully');
      console.log(`📈 Stats: ${stats.models_added} added, ${stats.models_updated} updated`);

    } catch (updateError) {
      console.error('❌ Update failed:', updateError);

      // Update log with error
      if (logId) {
        await fetch(`${supabaseUrl}/rest/v1/llm_update_logs?id=eq.${logId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({
            status: 'error',
            error_message: updateError.message,
            models_processed: stats.total_processed,
            models_added: stats.models_added,
            models_updated: stats.models_updated,
            completed_at: new Date().toISOString()
          })
        });
      }

      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        logId,
        message: `Successfully processed ${stats.total_processed} models: ${stats.models_added} added, ${stats.models_updated} updated`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );

  } catch (error) {
    console.error('💥 Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );
  }
});

/**
 * Fetch LLM model data using Firecrawl v2 Extract API
 */
async function fetchWithFirecrawl(apiKey: string): Promise<any[]> {
  console.log('🔥 Using Firecrawl v2 Extract API for live scraping...');

  try {
    // Define schema for structured extraction
    const schema = {
      type: "object",
      properties: {
        models: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Model name (e.g., GPT-4o, Claude 3.5 Sonnet)" },
              provider: { type: "string", description: "Provider name (e.g., OpenAI, Anthropic, Google)" },
              model_id: { type: "string", description: "Unique model identifier" },
              context_window: { type: "number", description: "Context window size in tokens" },
              input_price: { type: "number", description: "Input price per 1M tokens in USD" },
              output_price: { type: "number", description: "Output price per 1M tokens in USD" },
              output_speed: { type: "number", description: "Output speed in tokens/second" },
              latency: { type: "number", description: "Latency in seconds for first token" },
              quality_index: { type: "number", description: "Quality index score (0-100)" }
            },
            required: ["name", "provider"]
          }
        }
      },
      required: ["models"]
    };

    // Use Extract endpoint for structured data
    const extractResponse = await fetch('https://api.firecrawl.dev/v2/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        urls: ['https://artificialanalysis.ai/leaderboards/models'],
        prompt: 'Extract all LLM models with their pricing, performance metrics, and quality scores. Include model name, provider, context window, input/output prices per 1M tokens, speed, latency, and quality index.',
        schema: schema,
        enableWebSearch: false,
        ignoreSitemap: true,
        includeSubdomains: false,
        showSources: false,
        scrapeOptions: {
          formats: ['json'],
          onlyMainContent: true,
          waitFor: 5000, // Wait 5 seconds for Next.js to load
          mobile: false,
          proxy: 'stealth', // Use stealth proxy for anti-bot protection
          blockAds: true,
          timeout: 60000, // 60 second timeout
          actions: [
            // Wait for content to load
            { type: 'wait', milliseconds: 3000 },
            // Scroll to load lazy content
            { type: 'scroll', direction: 'down' },
            { type: 'wait', milliseconds: 2000 },
            { type: 'scroll', direction: 'down' },
            { type: 'wait', milliseconds: 2000 }
          ]
        }
      })
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('❌ Firecrawl Extract failed:', extractResponse.status, errorText);
      throw new Error(`Firecrawl API error: ${extractResponse.status}`);
    }

    const extractData = await extractResponse.json();
    console.log('📊 Firecrawl extraction response:', JSON.stringify(extractData).substring(0, 500));

    // Check if we got an extraction ID (async processing)
    if (extractData.id && !extractData.data) {
      console.log('⏳ Extraction is processing asynchronously, ID:', extractData.id);
      // For now, fall back to static data
      // TODO: Implement polling for async results
      console.log('⚠️ Async extraction not yet implemented, using fallback data');
      return getFallbackModelData();
    }

    // Extract models from response
    const models = extractData.data?.models || extractData.models || [];

    if (models.length === 0) {
      console.log('⚠️ No models extracted, falling back to static data');
      return getFallbackModelData();
    }

    console.log(`✅ Successfully extracted ${models.length} models via Firecrawl`);
    return models;

  } catch (error) {
    console.error('❌ Firecrawl scraping failed:', error);
    console.log('📊 Falling back to static model data');
    return getFallbackModelData();
  }
}

/**
 * Alternative: Use Firecrawl v2 Scrape API with JSON format
 */
async function fetchWithFirecrawlScrape(apiKey: string): Promise<any[]> {
  console.log('🔥 Using Firecrawl v2 Scrape API...');

  try {
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://artificialanalysis.ai/leaderboards/models',
        formats: [
          {
            type: 'json',
            schema: {
              type: "object",
              properties: {
                models: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      provider: { type: "string" },
                      input_price: { type: "number" },
                      output_price: { type: "number" }
                    }
                  }
                }
              }
            },
            prompt: 'Extract all LLM models with their names, providers, and pricing information.'
          },
          'markdown'
        ],
        onlyMainContent: true,
        waitFor: 5000,
        mobile: false,
        proxy: 'stealth',
        blockAds: true,
        timeout: 60000,
        actions: [
          { type: 'wait', milliseconds: 3000 },
          { type: 'scroll', direction: 'down' },
          { type: 'wait', milliseconds: 2000 }
        ]
      })
    });

    if (!scrapeResponse.ok) {
      throw new Error(`Firecrawl Scrape API error: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    const models = scrapeData.data?.json?.models || [];

    if (models.length === 0) {
      console.log('⚠️ No models scraped, falling back to static data');
      return getFallbackModelData();
    }

    console.log(`✅ Successfully scraped ${models.length} models`);
    return models;

  } catch (error) {
    console.error('❌ Firecrawl Scrape failed:', error);
    return getFallbackModelData();
  }
}

function getFallbackModelData(): any[] {
  console.log('📊 Using fallback model data');

  return [
    // OpenAI Models
    { name: 'GPT-4o', provider: 'OpenAI', model_id: 'gpt-4o', context_window: 128000, input_price: 2.50, output_price: 10.00, output_speed: 83.4, latency: 0.56, quality_index: 70 },
    { name: 'GPT-4o Mini', provider: 'OpenAI', model_id: 'gpt-4o-mini', context_window: 128000, input_price: 0.15, output_price: 0.60, output_speed: 150.0, latency: 0.35, quality_index: 65 },
    { name: 'o1', provider: 'OpenAI', model_id: 'o1', context_window: 200000, input_price: 15.00, output_price: 60.00, output_speed: 25.0, latency: 2.50, quality_index: 85 },
    { name: 'o1-mini', provider: 'OpenAI', model_id: 'o1-mini', context_window: 128000, input_price: 3.00, output_price: 12.00, output_speed: 60.0, latency: 1.20, quality_index: 75 },

    // Anthropic Models
    { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', model_id: 'claude-3-5-sonnet', context_window: 200000, input_price: 3.00, output_price: 15.00, output_speed: 79.6, latency: 0.90, quality_index: 72 },
    { name: 'Claude 3.5 Haiku', provider: 'Anthropic', model_id: 'claude-3-5-haiku', context_window: 200000, input_price: 0.80, output_price: 4.00, output_speed: 120.0, latency: 0.45, quality_index: 62 },
    { name: 'Claude 3 Opus', provider: 'Anthropic', model_id: 'claude-3-opus', context_window: 200000, input_price: 15.00, output_price: 75.00, output_speed: 45.0, latency: 1.50, quality_index: 78 },

    // Google Models
    { name: 'Gemini 1.5 Pro', provider: 'Google', model_id: 'gemini-1-5-pro', context_window: 2000000, input_price: 1.25, output_price: 5.00, output_speed: 90.6, latency: 0.99, quality_index: 68 },
    { name: 'Gemini 1.5 Flash', provider: 'Google', model_id: 'gemini-1-5-flash', context_window: 1000000, input_price: 0.075, output_price: 0.30, output_speed: 180.0, latency: 0.30, quality_index: 60 },
    { name: 'Gemini 2.0 Flash', provider: 'Google', model_id: 'gemini-2-0-flash', context_window: 1000000, input_price: 0.10, output_price: 0.40, output_speed: 200.0, latency: 0.25, quality_index: 64 },

    // DeepSeek Models
    { name: 'DeepSeek V3', provider: 'DeepSeek', model_id: 'deepseek-v3', context_window: 128000, input_price: 0.27, output_price: 1.10, output_speed: 100.0, latency: 0.60, quality_index: 66 },
    { name: 'DeepSeek R1', provider: 'DeepSeek', model_id: 'deepseek-r1', context_window: 128000, input_price: 0.55, output_price: 2.19, output_speed: 80.0, latency: 0.85, quality_index: 74 },

    // Meta Models
    { name: 'Llama 3.1 405B', provider: 'Meta', model_id: 'llama-3-1-405b', context_window: 128000, input_price: 2.70, output_price: 2.70, output_speed: 65.0, latency: 1.10, quality_index: 69 },
    { name: 'Llama 3.3 70B', provider: 'Meta', model_id: 'llama-3-3-70b', context_window: 128000, input_price: 0.35, output_price: 0.40, output_speed: 95.0, latency: 0.70, quality_index: 63 },

    // xAI Models
    { name: 'Grok Beta', provider: 'xAI', model_id: 'grok-beta', context_window: 131072, input_price: 5.00, output_price: 15.00, output_speed: 70.0, latency: 1.00, quality_index: 67 },

    // Alibaba Models
    { name: 'Qwen Max', provider: 'Alibaba', model_id: 'qwen-max', context_window: 32000, input_price: 0.40, output_price: 1.20, output_speed: 85.0, latency: 0.75, quality_index: 61 },

    // Mistral Models
    { name: 'Mistral Large', provider: 'Mistral', model_id: 'mistral-large', context_window: 128000, input_price: 2.00, output_price: 6.00, output_speed: 75.0, latency: 0.95, quality_index: 64 },
    { name: 'Mistral Small', provider: 'Mistral', model_id: 'mistral-small', context_window: 32000, input_price: 0.20, output_price: 0.60, output_speed: 110.0, latency: 0.55, quality_index: 58 },
  ];
}

async function processModelData(rawModel: any): Promise<LLMModelData> {
  const avgPrice = ((rawModel.input_price || 0) + (rawModel.output_price || 0) * 3) / 4;

  // Determine category based on model characteristics
  let category = 'multimodal';
  const nameLower = rawModel.name.toLowerCase();

  if (nameLower.includes('reasoning') || nameLower.includes('r1') || nameLower.includes('o1') || nameLower.includes('o3')) {
    category = 'reasoning';
  } else if (nameLower.includes('code') || nameLower.includes('coder')) {
    category = 'coding';
  } else if (nameLower.includes('vision') || nameLower.includes('multimodal')) {
    category = 'multimodal';
  } else if (avgPrice <= 1.00 || nameLower.includes('mini') || nameLower.includes('lite') || nameLower.includes('small') || nameLower.includes('flash')) {
    category = 'lightweight';
  } else if (avgPrice <= 2.00) {
    category = 'budget';
  }

  // Determine rarity based on quality index
  let rarity = 'common';
  if (rawModel.quality_index) {
    if (rawModel.quality_index >= 70) rarity = 'legendary';
    else if (rawModel.quality_index >= 65) rarity = 'epic';
    else if (rawModel.quality_index >= 60) rarity = 'rare';
  }

  // Extract features
  const features: string[] = ['text-generation'];
  if (nameLower.includes('vision') || nameLower.includes('4o')) features.push('vision');
  if (nameLower.includes('reasoning') || nameLower.includes('r1') || nameLower.includes('o1')) features.push('advanced-reasoning');
  if (nameLower.includes('code')) features.push('coding');
  if (nameLower.includes('multimodal')) features.push('multimodal');
  if (rawModel.context_window > 500000) features.push('long-context');
  if (rawModel.output_speed > 150) features.push('fast-inference');

  // Determine license (heuristic)
  const providerLower = rawModel.provider.toLowerCase();
  const license = ['meta', 'mistral', 'alibaba', 'deepseek'].some(p => providerLower.includes(p)) ? 'Open' : 'Proprietary';

  return {
    name: rawModel.name || 'Unknown Model',
    provider: rawModel.provider || 'Unknown',
    model_id: rawModel.model_id || rawModel.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
    context_window: rawModel.context_window || 8000,
    input_price: rawModel.input_price || 0,
    output_price: rawModel.output_price || 0,
    avg_price: avgPrice,
    output_speed: rawModel.output_speed || 0,
    latency: rawModel.latency || 0,
    quality_index: rawModel.quality_index,
    license,
    features,
    category,
    rarity,
    description: generateDescription(rawModel, category)
  };
}

function generateDescription(model: any, category: string): string {
  const providers: Record<string, string> = {
    'OpenAI': 'cutting-edge language model from OpenAI',
    'Anthropic': 'advanced AI assistant from Anthropic',
    'Google': 'powerful multimodal model from Google',
    'Meta': 'open-source model from Meta',
    'Mistral': 'efficient European AI model',
    'DeepSeek': 'innovative open-source reasoning model',
    'xAI': 'advanced model from xAI',
    'Alibaba': 'high-performance Qwen series model'
  };

  const categoryDesc: Record<string, string> = {
    'reasoning': 'with advanced reasoning capabilities',
    'coding': 'specialized for programming tasks',
    'multimodal': 'with vision and text capabilities',
    'lightweight': 'optimized for efficiency',
    'budget': 'cost-effective for various tasks'
  };

  const baseDesc = providers[model.provider] || 'advanced language model';
  const catDesc = categoryDesc[category] || 'for general use';

  return `A ${baseDesc} ${catDesc}`;
}
