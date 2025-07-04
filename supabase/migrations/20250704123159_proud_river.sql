/*
  # Seed LLM Models Data

  Insert comprehensive LLM model data from artificialanalysis.ai
*/

-- Clear existing data
TRUNCATE llm_models;

-- Insert LLM model data
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window, 
  input_price, output_price, avg_price, output_speed, latency, 
  quality_index, category, description, features, rarity
) VALUES
-- Top tier models with quality scores
('o3-mini (high)', 'OpenAI', 'OpenAI', 'o3-mini-high', 'Proprietary', 200000, 1.10, 4.40, 1.93, 118.5, 59.59, 66, 'reasoning', 'OpenAI''s latest high-performance reasoning model', ARRAY['Advanced reasoning', 'High quality', 'Extended thinking'], 'legendary'),
('o3-mini', 'OpenAI', 'OpenAI', 'o3-mini', 'Proprietary', 200000, 1.10, 4.40, 1.93, 183.2, 12.49, 63, 'reasoning', 'Balanced reasoning model with good speed', ARRAY['Reasoning', 'Fast inference', 'Cost effective'], 'epic'),
('DeepSeek R1', 'DeepSeek', 'DeepSeek', 'deepseek-r1', 'Open', 64000, 0.55, 2.19, 0.96, 25.1, 68.28, 60, 'reasoning', 'Open-source reasoning model with visible thinking process', ARRAY['Open source', 'Chain of thought', 'Chinese optimized'], 'legendary'),
('DeepSeek V3', 'DeepSeek', 'DeepSeek', 'deepseek-v3', 'Open', 66000, 0.27, 1.10, 0.48, 27.4, 7.19, 46, 'budget', 'Ultra cost-effective model with GPT-4 level performance', ARRAY['Ultra low cost', 'Open source', 'High performance'], 'epic'),
('Claude 3.7 Sonnet', 'Anthropic', 'Anthropic', 'claude-3-7-sonnet', 'Proprietary', 200000, 3.00, 15.00, 6.00, 80.3, 0.97, 48, 'coding', 'Latest Claude with enhanced coding capabilities', ARRAY['Advanced coding', 'Safety first', 'Extended thinking'], 'legendary'),
('GPT-4o (Nov ''24)', 'OpenAI', 'OpenAI', 'gpt-4o-nov', 'Proprietary', 128000, 2.50, 10.00, 4.38, 93.6, 0.38, 41, 'multimodal', 'Latest GPT-4o with multimodal capabilities', ARRAY['Multimodal', 'Vision', 'Audio', 'Fast'], 'epic'),
('Llama 3.3 70B', 'Meta', 'Meta', 'llama-3-3-70b', 'Open', 128000, 0.40, 0.40, 0.40, 38.7, 1.32, 41, 'budget', 'Meta''s latest open-source model', ARRAY['Open source', 'Cost effective', 'Large context'], 'rare'),
('GPT-4o mini', 'OpenAI', 'OpenAI', 'gpt-4o-mini', 'Proprietary', 128000, 0.15, 0.60, 0.26, 95.4, 0.51, 36, 'lightweight', 'Lightweight multimodal model', ARRAY['Multimodal', 'Fast', 'Affordable'], 'common'),
('Gemini 2.0 Flash', 'Google', 'Google', 'gemini-2-flash', 'Proprietary', 1000000, 0.10, 0.40, 0.17, 186.8, 0.36, 48, 'lightweight', 'Google''s fastest multimodal model', ARRAY['Ultra fast', 'Long context', 'Multimodal'], 'rare'),
('Claude 3.5 Haiku', 'Anthropic', 'Anthropic', 'claude-3-5-haiku', 'Proprietary', 200000, 0.80, 4.00, 1.60, 66.2, 1.26, 35, 'lightweight', 'Fast and economical Claude model', ARRAY['Speed optimized', 'Cost effective', 'Safety'], 'common'),
('Qwen2.5 72B', 'Alibaba', 'Alibaba', 'qwen-2-5-72b', 'Open', 131000, 0.40, 0.40, 0.40, 46.8, 1.05, 40, 'coding', 'Alibaba''s powerful coding model', ARRAY['Code generation', 'Chinese native', 'Open source'], 'epic'),
('Mistral Large 2', 'Mistral', 'Mistral', 'mistral-large-2', 'Open', 128000, 2.00, 6.00, 3.00, 45.9, 0.49, 38, 'coding', 'Mistral''s flagship model', ARRAY['Advanced reasoning', 'Code expert', 'Open source'], 'rare'),
('Nova Pro', 'Amazon', 'Amazon', 'nova-pro', 'Proprietary', 300000, 0.80, 3.20, 1.40, 80.1, 0.37, 37, 'multimodal', 'Amazon''s multimodal model', ARRAY['Multimodal', 'Long context', 'AWS integration'], 'rare'),
('Grok Beta', 'xAI', 'xAI', 'grok-beta', 'Proprietary', 128000, 5.00, 15.00, 7.50, 66.4, 0.26, 38, 'reasoning', 'xAI''s witty and creative model', ARRAY['Humor optimized', 'Real-time info', 'Creative'], 'legendary'),
('Phi-4', 'Microsoft', 'Microsoft', 'phi-4', 'Open', 16000, 0.07, 0.14, 0.09, 35.5, 0.36, 40, 'lightweight', 'Microsoft''s small but capable model', ARRAY['Small size', 'High efficiency', 'Open source'], 'common'),

-- Additional high-quality models
('o1-mini', 'OpenAI', 'OpenAI', 'o1-mini', 'Proprietary', 128000, 1.10, 4.40, 1.93, 200.8, 11.33, 54, 'reasoning', 'Efficient reasoning model with great speed', ARRAY['Reasoning', 'Fast', 'Efficient'], 'epic'),
('QwQ 32B-Preview', 'Alibaba', 'Alibaba', 'qwq-32b-preview', 'Open', 33000, 0.20, 0.20, 0.20, 67.9, 1.15, 43, 'reasoning', 'Alibaba''s reasoning model preview', ARRAY['Reasoning', 'Open source', 'Preview'], 'rare'),
('Gemini 1.5 Pro', 'Google', 'Google', 'gemini-1-5-pro', 'Proprietary', 2000000, 1.25, 5.00, 2.19, 100.3, 0.57, 45, 'multimodal', 'Google''s advanced multimodal model', ARRAY['Long context', 'Multimodal', 'Advanced'], 'epic'),
('Llama 3.1 405B', 'Meta', 'Meta', 'llama-3-1-405b', 'Open', 128000, 3.50, 3.50, 3.50, 26.3, 0.64, 40, 'reasoning', 'Meta''s largest open model', ARRAY['Largest open model', 'Advanced reasoning', 'Open source'], 'legendary'),
('Mixtral 8x22B', 'Mistral', 'Mistral', 'mixtral-8x22b', 'Open', 65000, 2.00, 6.00, 3.00, 84.9, 0.44, 26, 'coding', 'Mistral''s mixture of experts model', ARRAY['Mixture of experts', 'Code generation', 'Open source'], 'rare'),
('Claude 3 Opus', 'Anthropic', 'Anthropic', 'claude-3-opus', 'Proprietary', 200000, 15.00, 75.00, 30.00, 27.1, 1.16, 35, 'reasoning', 'Anthropic''s most capable model', ARRAY['Highest quality', 'Advanced reasoning', 'Safety'], 'legendary'),
('Llama 3.1 70B', 'Meta', 'Meta', 'llama-3-1-70b', 'Open', 128000, 0.88, 0.88, 0.88, 225.2, 0.35, 35, 'coding', 'Balanced open-source model', ARRAY['Open source', 'Code generation', 'Balanced'], 'rare'),
('Mistral Small 3', 'Mistral', 'Mistral', 'mistral-small-3', 'Open', 32000, 0.10, 0.30, 0.15, 123.4, 0.45, 35, 'lightweight', 'Efficient small model', ARRAY['Lightweight', 'Fast', 'Efficient'], 'common'),
('Llama 3.1 8B', 'Meta', 'Meta', 'llama-3-1-8b', 'Open', 128000, 0.18, 0.18, 0.18, 277.3, 0.19, 24, 'lightweight', 'Fast and efficient small model', ARRAY['Fast', 'Lightweight', 'Open source'], 'common'),
('Pixtral 12B', 'Mistral', 'Mistral', 'pixtral-12b', 'Open', 128000, 0.15, 0.15, 0.15, 102.3, 0.43, 23, 'multimodal', 'Mistral''s vision model', ARRAY['Vision', 'Multimodal', 'Open source'], 'rare'),
('Command-R+', 'Cohere', 'Cohere', 'command-r-plus', 'Open', 128000, 2.50, 10.00, 4.38, 73.0, 0.24, 21, 'coding', 'Cohere''s command model', ARRAY['Command following', 'RAG optimized', 'Open source'], 'rare'),
('Ministral 8B', 'Mistral', 'Mistral', 'ministral-8b', 'Open', 128000, 0.10, 0.10, 0.10, 141.9, 0.40, 22, 'lightweight', 'Compact efficient model', ARRAY['Compact', 'Efficient', 'Open source'], 'common'),
('DBRX', 'Databricks', 'Databricks', 'dbrx', 'Open', 33000, 1.20, 1.20, 1.20, 82.9, 0.32, 20, 'coding', 'Databricks'' open model', ARRAY['Open source', 'Enterprise', 'Code generation'], 'rare'),
('Mixtral 8x7B', 'Mistral', 'Mistral', 'mixtral-8x7b', 'Open', 33000, 0.60, 0.60, 0.60, 102.9, 0.38, 17, 'coding', 'Popular mixture of experts model', ARRAY['Mixture of experts', 'Popular', 'Open source'], 'common'),
('Command-R', 'Cohere', 'Cohere', 'command-r', 'Open', 128000, 0.15, 0.60, 0.26, 75.9, 0.19, 15, 'lightweight', 'Cohere''s efficient model', ARRAY['RAG optimized', 'Efficient', 'Open source'], 'common');

-- Update avg_price calculation for all records
UPDATE llm_models 
SET avg_price = ROUND((input_price + output_price) / 2.0, 4);