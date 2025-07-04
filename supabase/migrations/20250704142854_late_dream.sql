/*
  # Add Official Documentation Fields to LLM Models

  1. New Columns
    - `official_api_docs` (text, nullable) - URL to official API documentation
    - `provider_homepage` (text, nullable) - URL to provider's homepage
    - `model_card_url` (text, nullable) - URL to specific model documentation/card
    - `verified_official` (boolean, default false) - Whether the information is verified from official sources

  2. Security
    - No additional RLS policies needed as this extends existing table
*/

-- Add official documentation fields to llm_models table
ALTER TABLE llm_models ADD COLUMN IF NOT EXISTS official_api_docs text;
ALTER TABLE llm_models ADD COLUMN IF NOT EXISTS provider_homepage text;
ALTER TABLE llm_models ADD COLUMN IF NOT EXISTS model_card_url text;
ALTER TABLE llm_models ADD COLUMN IF NOT EXISTS verified_official boolean DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_llm_models_verified_official ON llm_models (verified_official);

-- Update existing models with official documentation links where known
UPDATE llm_models SET 
  official_api_docs = CASE 
    WHEN provider = 'OpenAI' THEN 'https://platform.openai.com/docs/overview'
    WHEN provider = 'Anthropic' THEN 'https://docs.anthropic.com/en/api/overview'
    WHEN provider = 'Google' THEN 'https://ai.google.dev/api'
    WHEN provider = 'Meta' THEN 'https://llama.meta.com/docs/overview'
    WHEN provider = 'DeepSeek' THEN 'https://api-docs.deepseek.com/'
    WHEN provider = 'Alibaba' THEN 'https://help.aliyun.com/zh/dashscope/developer-reference/api-details'
    WHEN provider = 'Mistral' THEN 'https://docs.mistral.ai/api/'
    WHEN provider = 'xAI' THEN 'https://docs.x.ai/docs/overview'
    WHEN provider = 'Amazon' THEN 'https://docs.aws.amazon.com/bedrock/latest/APIReference/'
    WHEN provider = 'Microsoft' THEN 'https://learn.microsoft.com/en-us/azure/ai-services/openai/reference'
    ELSE NULL
  END,
  provider_homepage = CASE 
    WHEN provider = 'OpenAI' THEN 'https://openai.com'
    WHEN provider = 'Anthropic' THEN 'https://www.anthropic.com'
    WHEN provider = 'Google' THEN 'https://ai.google.dev'
    WHEN provider = 'Meta' THEN 'https://llama.meta.com'
    WHEN provider = 'DeepSeek' THEN 'https://www.deepseek.com'
    WHEN provider = 'Alibaba' THEN 'https://qianwen.aliyun.com'
    WHEN provider = 'Mistral' THEN 'https://mistral.ai'
    WHEN provider = 'xAI' THEN 'https://x.ai'
    WHEN provider = 'Amazon' THEN 'https://aws.amazon.com/bedrock'
    WHEN provider = 'Microsoft' THEN 'https://azure.microsoft.com/en-us/products/ai-services/openai-service'
    ELSE NULL
  END,
  model_card_url = CASE 
    WHEN provider = 'OpenAI' THEN 'https://platform.openai.com/docs/models'
    WHEN provider = 'Anthropic' THEN 'https://docs.anthropic.com/en/docs/about-claude'
    WHEN provider = 'Google' THEN 'https://ai.google.dev/api/models'
    WHEN provider = 'Meta' THEN 'https://llama.meta.com/docs/model-cards'
    WHEN provider = 'DeepSeek' THEN 'https://api-docs.deepseek.com/quick_start/pricing'
    WHEN provider = 'Alibaba' THEN 'https://help.aliyun.com/zh/dashscope/developer-reference/model-introduction'
    WHEN provider = 'Mistral' THEN 'https://docs.mistral.ai/getting-started/models/'
    WHEN provider = 'xAI' THEN 'https://docs.x.ai/docs/models'
    WHEN provider = 'Amazon' THEN 'https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters.html'
    WHEN provider = 'Microsoft' THEN 'https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models'
    ELSE NULL
  END,
  verified_official = true
WHERE provider IN ('OpenAI', 'Anthropic', 'Google', 'Meta', 'DeepSeek', 'Alibaba', 'Mistral', 'xAI', 'Amazon', 'Microsoft');