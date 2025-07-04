/*
  LLM Models Update Edge Function
  
  This function fetches the latest model data from artificialanalysis.ai
  and updates our database with current pricing, performance metrics,
  and new models.
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
    const { update_type = 'manual', force_refresh = false } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('🚀 Starting LLM models update...');
    
    // Create update log entry
    const logResponse = await fetch(`${supabaseUrl}/rest/v1/llm_update_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        update_type,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
    });
    
    const updateLog = await logResponse.json();
    const logId = updateLog.id;

    let stats: UpdateStats = {
      total_processed: 0,
      models_added: 0,
      models_updated: 0,
      providers_found: [],
      categories_updated: []
    };

    try {
      // Fetch data from artificialanalysis.ai
      console.log('📡 Fetching data from artificialanalysis.ai...');
      const modelsData = await fetchArtificialAnalysisData();
      
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
          
          if (existingModels.length > 0) {
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
      
      console.log('✅ Update completed successfully');
      console.log(`📈 Stats: ${stats.models_added} added, ${stats.models_updated} updated`);
      
    } catch (updateError) {
      console.error('❌ Update failed:', updateError);
      
      // Update log with error
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
        error: error.message,
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

async function fetchArtificialAnalysisData(): Promise<any[]> {
  try {
    // Primary approach: Try to fetch structured data
    const response = await fetch('https://artificialanalysis.ai/leaderboards/providers', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    return parseArtificialAnalysisHTML(html);
    
  } catch (error) {
    console.error('🚫 Failed to fetch from artificialanalysis.ai:', error);
    // Fallback to predefined data if scraping fails
    return getFallbackModelData();
  }
}

function parseArtificialAnalysisHTML(html: string): any[] {
  const models: any[] = [];
  
  try {
    // Look for JSON data in script tags
    const jsonMatches = html.match(/<script[^>]*>[\s\S]*?window\.__NUXT__\s*=\s*({[\s\S]*?});[\s\S]*?<\/script>/);
    if (jsonMatches) {
      const jsonData = JSON.parse(jsonMatches[1]);
      // Extract model data from Nuxt data structure
      if (jsonData.data && jsonData.data.models) {
        return jsonData.data.models;
      }
    }
    
    // Alternative: Look for table data
    const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
    if (tableMatches) {
      for (const table of tableMatches) {
        const rows = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
        if (rows) {
          for (let i = 1; i < rows.length; i++) { // Skip header row
            const cells = rows[i].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
            if (cells && cells.length >= 8) {
              const model = parseTableRow(cells);
              if (model) models.push(model);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('🔍 Error parsing HTML:', error);
  }
  
  return models.length > 0 ? models : getFallbackModelData();
}

function parseTableRow(cells: string[]): any | null {
  try {
    const cleanText = (html: string) => html.replace(/<[^>]*>/g, '').trim();
    
    return {
      name: cleanText(cells[1] || ''),
      provider: cleanText(cells[0] || ''),
      model_id: cleanText(cells[1] || '').toLowerCase().replace(/\s+/g, '-'),
      context_window: parseInt(cleanText(cells[2] || '0').replace(/[^0-9]/g, '')) || 8000,
      input_price: parseFloat(cleanText(cells[4] || '0').replace(/[^0-9.]/g, '')) || 0,
      output_price: parseFloat(cleanText(cells[5] || '0').replace(/[^0-9.]/g, '')) || 0,
      output_speed: parseFloat(cleanText(cells[6] || '0').replace(/[^0-9.]/g, '')) || 0,
      latency: parseFloat(cleanText(cells[7] || '0').replace(/[^0-9.]/g, '')) || 0,
      quality_index: parseInt(cleanText(cells[8] || '0').replace(/[^0-9]/g, '')) || null,
    };
  } catch (error) {
    console.error('🔧 Error parsing table row:', error);
    return null;
  }
}

function getFallbackModelData(): any[] {
  // Return a subset of known models as fallback
  return [
    {
      name: 'GPT-4o',
      provider: 'OpenAI',
      model_id: 'gpt-4o',
      context_window: 128000,
      input_price: 5.00,
      output_price: 15.00,
      output_speed: 83.4,
      latency: 0.56,
      quality_index: 70,
    },
    {
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      model_id: 'claude-3-5-sonnet',
      context_window: 200000,
      input_price: 3.00,
      output_price: 15.00,
      output_speed: 79.6,
      latency: 0.90,
      quality_index: 68,
    },
    {
      name: 'Gemini 1.5 Pro',
      provider: 'Google',
      model_id: 'gemini-1-5-pro',
      context_window: 2000000,
      input_price: 1.25,
      output_price: 5.00,
      output_speed: 90.6,
      latency: 0.99,
      quality_index: 65,
    }
  ];
}

async function processModelData(rawModel: any): Promise<LLMModelData> {
  const avgPrice = ((rawModel.input_price || 0) + (rawModel.output_price || 0) * 3) / 4;
  
  // Determine category based on model characteristics
  let category = 'multimodal';
  if (rawModel.name.toLowerCase().includes('reasoning') || 
      rawModel.name.toLowerCase().includes('r1') || 
      rawModel.name.toLowerCase().includes('o1')) {
    category = 'reasoning';
  } else if (rawModel.name.toLowerCase().includes('code') || 
             rawModel.name.toLowerCase().includes('coder')) {
    category = 'coding';
  } else if (rawModel.name.toLowerCase().includes('vision') || 
             rawModel.name.toLowerCase().includes('multimodal')) {
    category = 'multimodal';
  } else if (avgPrice <= 1.00 || rawModel.name.toLowerCase().includes('mini') || 
             rawModel.name.toLowerCase().includes('lite')) {
    category = 'lightweight';
  } else if (avgPrice <= 2.00) {
    category = 'budget';
  }
  
  // Determine rarity based on quality index
  let rarity = 'common';
  if (rawModel.quality_index) {
    if (rawModel.quality_index >= 65) rarity = 'legendary';
    else if (rawModel.quality_index >= 55) rarity = 'epic';
    else if (rawModel.quality_index >= 35) rarity = 'rare';
  }
  
  // Extract features
  const features: string[] = ['text-generation'];
  if (rawModel.name.toLowerCase().includes('vision')) features.push('vision');
  if (rawModel.name.toLowerCase().includes('reasoning')) features.push('advanced-reasoning');
  if (rawModel.name.toLowerCase().includes('code')) features.push('coding');
  if (rawModel.name.toLowerCase().includes('multimodal')) features.push('multimodal');
  if (rawModel.context_window > 500000) features.push('long-context');
  if (rawModel.output_speed > 200) features.push('fast-inference');
  
  // Determine license (heuristic)
  const license = ['meta', 'google', 'mistral', 'alibaba'].some(p => 
    rawModel.provider.toLowerCase().includes(p)
  ) ? 'Open' : 'Proprietary';
  
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