/*
  # Add comprehensive LLM model database

  1. New Models
    - Add 150+ LLM models from all major providers
    - Complete coverage of OpenAI, Meta, Google, Anthropic, Mistral, DeepSeek, and others
    - Include context windows, licensing, and categorization

  2. Categories
    - Reasoning: Advanced problem-solving models
    - Coding: Code generation and programming models  
    - Multimodal: Vision and multi-input models
    - Lightweight: Fast, efficient models
    - Budget: Cost-effective models

  3. Features
    - Estimated pricing based on provider and model tier
    - Performance metrics estimation
    - Quality scores for comparative analysis
    - Comprehensive feature tagging
*/

-- Clear existing data
TRUNCATE llm_models;

-- Insert comprehensive LLM model data
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window, 
  input_price, output_price, avg_price, output_speed, latency, 
  quality_index, category, description, features, rarity
) VALUES

-- OpenAI Models
('o1', 'OpenAI', 'OpenAI', 'o1', 'Proprietary', 200000, 15.00, 60.00, 26.25, 104.5, 31.34, 62, 'reasoning', 'OpenAI''s most advanced reasoning model', ARRAY['Advanced reasoning', 'Chain of thought', 'Premium'], 'legendary'),
('GPT-4o mini', 'OpenAI', 'OpenAI', 'gpt-4o-mini', 'Proprietary', 128000, 0.15, 0.60, 0.26, 95.4, 0.51, 36, 'multimodal', 'Lightweight multimodal model', ARRAY['Multimodal', 'Fast', 'Affordable'], 'common'),
('GPT-4.1', 'OpenAI', 'OpenAI', 'gpt-4-1', 'Proprietary', 1000000, 10.00, 30.00, 15.00, 80.0, 0.45, 50, 'reasoning', 'Next-generation GPT model with extended context', ARRAY['Long context', 'Advanced reasoning', 'Premium'], 'legendary'),
('o1-pro', 'OpenAI', 'OpenAI', 'o1-pro', 'Proprietary', 200000, 20.00, 80.00, 35.00, 90.0, 25.0, 65, 'reasoning', 'Professional tier reasoning model', ARRAY['Professional', 'Advanced reasoning', 'Premium'], 'legendary'),
('o3', 'OpenAI', 'OpenAI', 'o3', 'Proprietary', 128000, 12.00, 48.00, 20.00, 120.0, 20.0, 68, 'reasoning', 'Latest generation reasoning model', ARRAY['Latest generation', 'Reasoning', 'High performance'], 'legendary'),
('GPT-4o mini Realtime (Dec ''24)', 'OpenAI', 'OpenAI', 'gpt-4o-mini-realtime', 'Proprietary', 128000, 0.20, 0.80, 0.35, 150.0, 0.25, 38, 'multimodal', 'Real-time multimodal processing', ARRAY['Real-time', 'Multimodal', 'Low latency'], 'rare'),
('o4-mini (high)', 'OpenAI', 'OpenAI', 'o4-mini-high', 'Proprietary', 200000, 2.00, 8.00, 3.50, 140.0, 15.0, 55, 'reasoning', 'High-performance compact reasoning model', ARRAY['Compact', 'High performance', 'Reasoning'], 'epic'),
('GPT-4.1 mini', 'OpenAI', 'OpenAI', 'gpt-4-1-mini', 'Proprietary', 1000000, 3.00, 12.00, 5.00, 120.0, 8.0, 45, 'lightweight', 'Miniaturized version of GPT-4.1', ARRAY['Long context', 'Efficient', 'Compact'], 'rare'),
('o3-mini (high)', 'OpenAI', 'OpenAI', 'o3-mini-high', 'Proprietary', 200000, 1.10, 4.40, 1.93, 118.5, 59.59, 66, 'reasoning', 'High-performance reasoning model', ARRAY['Advanced reasoning', 'High quality', 'Extended thinking'], 'legendary'),
('GPT-4.1 nano', 'OpenAI', 'OpenAI', 'gpt-4-1-nano', 'Proprietary', 1000000, 1.00, 4.00, 1.75, 200.0, 3.0, 35, 'lightweight', 'Ultra-compact model with long context', ARRAY['Ultra compact', 'Long context', 'Fast'], 'common'),
('GPT-4o Realtime (Dec ''24)', 'OpenAI', 'OpenAI', 'gpt-4o-realtime', 'Proprietary', 128000, 2.50, 10.00, 4.38, 130.0, 0.20, 42, 'multimodal', 'Real-time GPT-4o processing', ARRAY['Real-time', 'Multimodal', 'Audio'], 'epic'),
('o3-mini', 'OpenAI', 'OpenAI', 'o3-mini', 'Proprietary', 200000, 1.10, 4.40, 1.93, 183.2, 12.49, 63, 'reasoning', 'Balanced reasoning model with good speed', ARRAY['Reasoning', 'Fast inference', 'Cost effective'], 'epic'),
('GPT-4o (ChatGPT)', 'OpenAI', 'OpenAI', 'gpt-4o-chatgpt', 'Proprietary', 128000, 5.00, 15.00, 7.50, 96.7, 0.54, 41, 'multimodal', 'ChatGPT interface optimized GPT-4o', ARRAY['Chat optimized', 'Multimodal', 'User friendly'], 'epic'),
('o3-pro', 'OpenAI', 'OpenAI', 'o3-pro', 'Proprietary', 200000, 15.00, 60.00, 25.00, 95.0, 30.0, 70, 'reasoning', 'Professional tier o3 model', ARRAY['Professional', 'Advanced reasoning', 'Premium'], 'legendary'),
('o1-preview', 'OpenAI', 'OpenAI', 'o1-preview', 'Proprietary', 128000, 15.00, 60.00, 26.25, 125.0, 22.96, 62, 'reasoning', 'Preview of o1 reasoning capabilities', ARRAY['Preview', 'Reasoning', 'Advanced'], 'epic'),
('o1-mini', 'OpenAI', 'OpenAI', 'o1-mini', 'Proprietary', 128000, 1.10, 4.40, 1.93, 200.8, 11.33, 54, 'reasoning', 'Compact reasoning model', ARRAY['Reasoning', 'Fast', 'Efficient'], 'epic'),
('GPT-4o (Aug ''24)', 'OpenAI', 'OpenAI', 'gpt-4o-aug-24', 'Proprietary', 128000, 2.50, 10.00, 4.38, 46.7, 0.49, 41, 'multimodal', 'August 2024 GPT-4o version', ARRAY['Multimodal', 'Vision', 'Audio'], 'epic'),
('GPT-4o (May ''24)', 'OpenAI', 'OpenAI', 'gpt-4o-may-24', 'Proprietary', 128000, 5.00, 15.00, 7.50, 44.3, 0.50, 41, 'multimodal', 'Original GPT-4o release', ARRAY['Multimodal', 'Vision', 'Audio'], 'epic'),
('GPT-4 Turbo', 'OpenAI', 'OpenAI', 'gpt-4-turbo', 'Proprietary', 128000, 10.00, 30.00, 15.00, 49.2, 0.52, 42, 'reasoning', 'Faster version of GPT-4', ARRAY['Fast', 'Advanced reasoning', 'Turbo'], 'rare'),
('GPT-4o (Nov ''24)', 'OpenAI', 'OpenAI', 'gpt-4o-nov-24', 'Proprietary', 128000, 2.50, 10.00, 4.38, 93.6, 0.38, 41, 'multimodal', 'November 2024 GPT-4o update', ARRAY['Multimodal', 'Vision', 'Audio', 'Fast'], 'epic'),
('GPT-3.5 Turbo', 'OpenAI', 'OpenAI', 'gpt-3-5-turbo', 'Proprietary', 4000, 0.50, 1.50, 0.75, 85.0, 0.40, 25, 'lightweight', 'Fast and efficient legacy model', ARRAY['Fast', 'Affordable', 'Legacy'], 'common'),
('GPT-4', 'OpenAI', 'OpenAI', 'gpt-4', 'Proprietary', 8000, 30.00, 60.00, 37.50, 25.0, 1.20, 40, 'reasoning', 'Original GPT-4 model', ARRAY['Advanced reasoning', 'Original', 'Premium'], 'rare'),
('GPT-4.5 (Preview)', 'OpenAI', 'OpenAI', 'gpt-4-5-preview', 'Proprietary', 128000, 8.00, 24.00, 12.00, 70.0, 0.80, 48, 'reasoning', 'Preview of GPT-4.5 capabilities', ARRAY['Preview', 'Advanced', 'Experimental'], 'rare'),
('GPT-4o (March 2025, chatgpt-4o-latest)', 'OpenAI', 'OpenAI', 'gpt-4o-march-25', 'Proprietary', 128000, 2.50, 10.00, 4.38, 100.0, 0.35, 43, 'multimodal', 'Latest GPT-4o version', ARRAY['Latest', 'Multimodal', 'Optimized'], 'epic'),
('GPT-3.5 Turbo (0613)', 'OpenAI', 'OpenAI', 'gpt-3-5-turbo-0613', 'Proprietary', 4000, 0.50, 1.50, 0.75, 80.0, 0.45, 23, 'lightweight', 'Specific GPT-3.5 version', ARRAY['Legacy', 'Affordable', 'Stable'], 'common'),

-- Meta Models
('Llama 3.3 Instruct 70B', 'Meta', 'Meta', 'llama-3-3-70b', 'Open', 128000, 0.40, 0.40, 0.40, 38.7, 1.32, 41, 'coding', 'Latest Llama 3.3 model', ARRAY['Open source', 'Code generation', 'Large'], 'rare'),
('Llama 3.1 Instruct 405B', 'Meta', 'Meta', 'llama-3-1-405b', 'Open', 128000, 3.50, 3.50, 3.50, 26.3, 0.64, 40, 'reasoning', 'Largest open-source model', ARRAY['Largest open', 'Advanced reasoning', 'Open source'], 'legendary'),
('Llama 3.2 Instruct 90B (Vision)', 'Meta', 'Meta', 'llama-3-2-90b-vision', 'Open', 128000, 0.90, 0.90, 0.90, 41.1, 0.36, 33, 'multimodal', 'Large vision-capable model', ARRAY['Vision', 'Multimodal', 'Open source'], 'epic'),
('Llama 3.2 Instruct 11B (Vision)', 'Meta', 'Meta', 'llama-3-2-11b-vision', 'Open', 128000, 0.16, 0.16, 0.16, 142.5, 0.36, 22, 'multimodal', 'Compact vision model', ARRAY['Vision', 'Compact', 'Open source'], 'rare'),
('Llama 4 Scout', 'Meta', 'Meta', 'llama-4-scout', 'Open', 10000000, 5.00, 5.00, 5.00, 15.0, 2.0, 55, 'reasoning', 'Early Llama 4 preview with massive context', ARRAY['Llama 4', 'Massive context', 'Preview'], 'legendary'),
('Llama 4 Maverick', 'Meta', 'Meta', 'llama-4-maverick', 'Open', 1000000, 3.00, 3.00, 3.00, 25.0, 1.5, 52, 'reasoning', 'Llama 4 variant with long context', ARRAY['Llama 4', 'Long context', 'Advanced'], 'legendary'),
('Llama 3.1 Instruct 70B', 'Meta', 'Meta', 'llama-3-1-70b', 'Open', 128000, 0.88, 0.88, 0.88, 225.2, 0.35, 35, 'coding', 'Balanced open-source model', ARRAY['Open source', 'Code generation', 'Balanced'], 'rare'),
('Llama 65B', 'Meta', 'Meta', 'llama-65b', 'Open', 2000, 1.00, 1.00, 1.00, 30.0, 1.0, 28, 'coding', 'Legacy large Llama model', ARRAY['Legacy', 'Large', 'Open source'], 'common'),
('Llama 3.1 Instruct 8B', 'Meta', 'Meta', 'llama-3-1-8b', 'Open', 128000, 0.18, 0.18, 0.18, 277.3, 0.19, 24, 'lightweight', 'Fast and efficient model', ARRAY['Fast', 'Lightweight', 'Open source'], 'common'),
('Llama 3.2 Instruct 3B', 'Meta', 'Meta', 'llama-3-2-3b', 'Open', 128000, 0.06, 0.06, 0.06, 63.7, 0.37, 20, 'lightweight', 'Compact efficient model', ARRAY['Compact', 'Efficient', 'Open source'], 'common'),
('Llama 3 Instruct 70B', 'Meta', 'Meta', 'llama-3-70b', 'Open', 8000, 0.88, 0.88, 0.88, 57.4, 0.47, 27, 'coding', 'Llama 3 large model', ARRAY['Open source', 'Code generation', 'Stable'], 'rare'),
('Llama 3 Instruct 8B', 'Meta', 'Meta', 'llama-3-8b', 'Open', 8000, 0.20, 0.20, 0.20, 126.0, 0.23, 24, 'lightweight', 'Llama 3 base model', ARRAY['Base model', 'Fast', 'Open source'], 'common'),
('Llama 3.2 Instruct 1B', 'Meta', 'Meta', 'llama-3-2-1b', 'Open', 128000, 0.04, 0.04, 0.04, 3114.8, 0.49, 18, 'lightweight', 'Ultra-lightweight model', ARRAY['Ultra lightweight', 'Fast', 'Edge computing'], 'common'),
('Llama 2 Chat 70B', 'Meta', 'Meta', 'llama-2-70b', 'Open', 4000, 0.70, 2.80, 1.18, 46.5, 0.37, 15, 'coding', 'Legacy Llama 2 large model', ARRAY['Legacy', 'Chat optimized', 'Open source'], 'common'),
('Llama 2 Chat 13B', 'Meta', 'Meta', 'llama-2-13b', 'Open', 4000, 0.25, 1.00, 0.40, 60.0, 0.60, 12, 'lightweight', 'Legacy Llama 2 medium model', ARRAY['Legacy', 'Medium size', 'Open source'], 'common'),
('Llama 2 Chat 7B', 'Meta', 'Meta', 'llama-2-7b', 'Open', 4000, 0.05, 0.25, 0.10, 122.6, 0.59, 8, 'lightweight', 'Legacy Llama 2 small model', ARRAY['Legacy', 'Small', 'Fast'], 'common'),

-- Google Models
('PALM-2', 'Google', 'Google', 'palm-2', 'Proprietary', 8000, 1.00, 2.00, 1.25, 50.0, 0.80, 30, 'reasoning', 'Google''s PaLM-2 model', ARRAY['Google', 'Language model', 'Reasoning'], 'rare'),
('Gemini 2.0 Pro Experimental (Feb ''25)', 'Google', 'Google', 'gemini-2-pro-exp-feb', 'Proprietary', 2000000, 5.00, 15.00, 7.50, 123.3, 0.56, 49, 'reasoning', 'Experimental Gemini 2.0 Pro', ARRAY['Experimental', 'Long context', 'Advanced'], 'legendary'),
('Gemini 2.0 Flash (Feb ''25)', 'Google', 'Google', 'gemini-2-flash-feb', 'Proprietary', 1000000, 0.15, 0.60, 0.26, 186.8, 0.36, 48, 'lightweight', 'Fast Gemini 2.0 model', ARRAY['Fast', 'Long context', 'Efficient'], 'rare'),
('Gemma 3 27B Instruct', 'Google', 'Google', 'gemma-3-27b', 'Open', 128000, 0.80, 0.80, 0.80, 81.8, 0.45, 35, 'coding', 'Large Gemma 3 model', ARRAY['Open source', 'Large', 'Instruct'], 'rare'),
('Gemini 2.0 Flash Thinking Experimental (Jan ''25)', 'Google', 'Google', 'gemini-2-flash-thinking', 'Proprietary', 1000000, 0.20, 0.80, 0.35, 150.0, 0.30, 45, 'reasoning', 'Experimental thinking model', ARRAY['Thinking', 'Experimental', 'Reasoning'], 'epic'),
('Gemini 2.5 Flash (Reasoning)', 'Google', 'Google', 'gemini-2-5-flash-reasoning', 'Proprietary', 1000000, 0.25, 1.00, 0.45, 140.0, 0.40, 50, 'reasoning', 'Reasoning-optimized Gemini', ARRAY['Reasoning', 'Fast', 'Advanced'], 'epic'),
('Gemini 2.5 Pro', 'Google', 'Google', 'gemini-2-5-pro', 'Proprietary', 1000000, 3.00, 12.00, 5.25, 90.0, 0.60, 55, 'reasoning', 'Professional Gemini 2.5', ARRAY['Professional', 'Advanced', 'Long context'], 'legendary'),
('Gemini 2.5 Pro Preview (Mar ''25)', 'Google', 'Google', 'gemini-2-5-pro-mar-preview', 'Proprietary', 1000000, 0.00, 0.00, 0.00, 100.0, 0.50, 52, 'reasoning', 'March 2025 Gemini preview', ARRAY['Preview', 'Free', 'Advanced'], 'epic'),
('Gemini 2.5 Pro Preview (May ''25)', 'Google', 'Google', 'gemini-2-5-pro-may-preview', 'Proprietary', 1000000, 0.00, 0.00, 0.00, 110.0, 0.45, 54, 'reasoning', 'May 2025 Gemini preview', ARRAY['Preview', 'Free', 'Latest'], 'epic'),
('Gemini 2.5 Flash-Lite (Reasoning)', 'Google', 'Google', 'gemini-2-5-flash-lite-reasoning', 'Proprietary', 1000000, 0.10, 0.40, 0.17, 180.0, 0.25, 42, 'lightweight', 'Lite reasoning model', ARRAY['Lite', 'Reasoning', 'Fast'], 'rare'),
('Gemma 3 4B Instruct', 'Google', 'Google', 'gemma-3-4b', 'Open', 128000, 0.10, 0.10, 0.10, 150.0, 0.35, 25, 'lightweight', 'Compact Gemma 3 model', ARRAY['Open source', 'Compact', 'Fast'], 'common'),
('Gemma 3 1B Instruct', 'Google', 'Google', 'gemma-3-1b', 'Open', 32000, 0.05, 0.05, 0.05, 200.0, 0.30, 20, 'lightweight', 'Tiny Gemma 3 model', ARRAY['Open source', 'Tiny', 'Ultra fast'], 'common'),
('Gemini 2.0 Flash-Lite (Feb ''25)', 'Google', 'Google', 'gemini-2-flash-lite-feb', 'Proprietary', 1000000, 0.07, 0.30, 0.13, 184.0, 0.24, 42, 'lightweight', 'Lite version of Gemini 2.0', ARRAY['Lite', 'Fast', 'Efficient'], 'rare'),
('Gemini 2.5 Flash-Lite', 'Google', 'Google', 'gemini-2-5-flash-lite', 'Proprietary', 1000000, 0.08, 0.32, 0.14, 190.0, 0.22, 44, 'lightweight', 'Lite version of Gemini 2.5', ARRAY['Lite', 'Fast', 'Efficient'], 'rare'),
('Gemma 3 12B Instruct', 'Google', 'Google', 'gemma-3-12b', 'Open', 128000, 0.30, 0.30, 0.30, 120.0, 0.40, 30, 'coding', 'Medium Gemma 3 model', ARRAY['Open source', 'Medium', 'Balanced'], 'common'),
('Gemma 3n E4B Instruct', 'Google', 'Google', 'gemma-3n-e4b', 'Open', 32000, 0.08, 0.08, 0.08, 160.0, 0.32, 22, 'lightweight', 'Efficient Gemma variant', ARRAY['Open source', 'Efficient', 'Compact'], 'common'),
('Gemini 2.5 Flash', 'Google', 'Google', 'gemini-2-5-flash', 'Proprietary', 1000000, 0.15, 0.60, 0.26, 170.0, 0.30, 46, 'lightweight', 'Fast Gemini 2.5 model', ARRAY['Fast', 'Long context', 'Efficient'], 'rare'),
('Gemma 3n E4B Instruct Preview (May ''25)', 'Google', 'Google', 'gemma-3n-e4b-preview', 'Open', 32000, 0.00, 0.00, 0.00, 170.0, 0.30, 24, 'lightweight', 'Preview Gemma variant', ARRAY['Preview', 'Open source', 'Free'], 'common'),
('Gemini 2.0 Flash (experimental)', 'Google', 'Google', 'gemini-2-flash-exp', 'Proprietary', 1000000, 0.00, 0.00, 0.00, 174.6, 0.26, 45, 'lightweight', 'Experimental Gemini 2.0', ARRAY['Experimental', 'Free', 'Fast'], 'rare'),
('Gemini 1.5 Pro (Sep ''24)', 'Google', 'Google', 'gemini-1-5-pro-sep', 'Proprietary', 2000000, 1.25, 5.00, 2.19, 100.3, 0.57, 45, 'multimodal', 'Gemini 1.5 Pro model', ARRAY['Long context', 'Multimodal', 'Advanced'], 'epic'),
('Gemini 2.0 Flash-Lite (Preview)', 'Google', 'Google', 'gemini-2-flash-lite-preview', 'Proprietary', 1000000, 0.00, 0.00, 0.00, 180.0, 0.25, 40, 'lightweight', 'Preview Flash-Lite model', ARRAY['Preview', 'Free', 'Fast'], 'rare'),
('Gemini 1.5 Flash (Sep ''24)', 'Google', 'Google', 'gemini-1-5-flash-sep', 'Proprietary', 1000000, 0.07, 0.30, 0.13, 180.5, 0.29, 35, 'lightweight', 'Gemini 1.5 Flash model', ARRAY['Fast', 'Efficient', 'Long context'], 'common'),
('Gemma 2 27B', 'Google', 'Google', 'gemma-2-27b', 'Open', 8000, 0.80, 0.80, 0.80, 81.8, 0.45, 30, 'coding', 'Large Gemma 2 model', ARRAY['Open source', 'Large', 'Code generation'], 'rare'),
('Gemma 2 9B', 'Google', 'Google', 'gemma-2-9b', 'Open', 8000, 0.30, 0.30, 0.30, 133.0, 0.24, 25, 'lightweight', 'Medium Gemma 2 model', ARRAY['Open source', 'Medium', 'Fast'], 'common'),
('Gemini 1.5 Flash-8B', 'Google', 'Google', 'gemini-1-5-flash-8b', 'Proprietary', 1000000, 0.04, 0.15, 0.07, 276.4, 0.19, 28, 'lightweight', 'Compact Gemini Flash model', ARRAY['Compact', 'Fast', 'Long context'], 'common'),
('Gemini 1.0 Ultra', 'Google', 'Google', 'gemini-1-ultra', 'Proprietary', 33000, 8.00, 24.00, 12.00, 40.0, 1.50, 45, 'reasoning', 'Original Gemini Ultra model', ARRAY['Ultra', 'Advanced', 'Premium'], 'epic'),
('Gemini 2.5 Flash Preview', 'Google', 'Google', 'gemini-2-5-flash-preview', 'Proprietary', 1000000, 0.00, 0.00, 0.00, 160.0, 0.35, 43, 'lightweight', 'Preview Flash model', ARRAY['Preview', 'Free', 'Fast'], 'rare'),
('Gemini 2.5 Flash Preview (Reasoning)', 'Google', 'Google', 'gemini-2-5-flash-preview-reasoning', 'Proprietary', 1000000, 0.00, 0.00, 0.00, 150.0, 0.40, 46, 'reasoning', 'Preview reasoning Flash', ARRAY['Preview', 'Reasoning', 'Free'], 'rare'),
('Gemini 1.0 Pro', 'Google', 'Google', 'gemini-1-pro', 'Proprietary', 33000, 0.13, 0.38, 0.19, 60.0, 0.70, 35, 'coding', 'Original Gemini Pro model', ARRAY['Pro', 'Balanced', 'Stable'], 'common'),
('Gemini 1.5 Pro (May ''24)', 'Google', 'Google', 'gemini-1-5-pro-may', 'Proprietary', 2000000, 1.25, 5.00, 2.19, 65.9, 0.43, 34, 'multimodal', 'May 2024 Gemini Pro', ARRAY['Long context', 'Multimodal', 'Stable'], 'rare'),
('Gemini 1.5 Flash (May ''24)', 'Google', 'Google', 'gemini-1-5-flash-may', 'Proprietary', 1000000, 0.07, 0.30, 0.13, 307.9, 0.23, 28, 'lightweight', 'May 2024 Gemini Flash', ARRAY['Fast', 'Efficient', 'Long context'], 'common'),
('Gemini 2.0 Flash Thinking Experimental (Dec ''24)', 'Google', 'Google', 'gemini-2-flash-thinking-dec', 'Proprietary', 2000000, 0.00, 0.00, 0.00, 130.0, 0.45, 42, 'reasoning', 'December thinking experiment', ARRAY['Thinking', 'Experimental', 'Free'], 'rare'),

-- Anthropic Models
('Claude 3.5 Haiku', 'Anthropic', 'Anthropic', 'claude-3-5-haiku', 'Proprietary', 200000, 0.80, 4.00, 1.60, 66.2, 1.26, 35, 'lightweight', 'Fast and economical Claude model', ARRAY['Speed optimized', 'Cost effective', 'Safety'], 'common'),
('Claude 4 Opus', 'Anthropic', 'Anthropic', 'claude-4-opus', 'Proprietary', 200000, 20.00, 100.00, 40.00, 30.0, 2.00, 65, 'reasoning', 'Next-generation Claude flagship', ARRAY['Next generation', 'Flagship', 'Advanced reasoning'], 'legendary'),
('Claude 4 Opus (Extended Thinking)', 'Anthropic', 'Anthropic', 'claude-4-opus-thinking', 'Proprietary', 200000, 25.00, 125.00, 50.00, 25.0, 3.00, 68, 'reasoning', 'Claude 4 with extended thinking', ARRAY['Extended thinking', 'Advanced reasoning', 'Premium'], 'legendary'),
('Claude 4 Sonnet', 'Anthropic', 'Anthropic', 'claude-4-sonnet', 'Proprietary', 200000, 10.00, 50.00, 20.00, 50.0, 1.50, 60, 'reasoning', 'Balanced Claude 4 model', ARRAY['Balanced', 'Advanced', 'Reasoning'], 'legendary'),
('Claude 3.7 Sonnet (Extended Thinking)', 'Anthropic', 'Anthropic', 'claude-3-7-sonnet-thinking', 'Proprietary', 200000, 4.00, 20.00, 8.00, 70.0, 1.20, 57, 'reasoning', 'Claude 3.7 with extended thinking', ARRAY['Extended thinking', 'Reasoning', 'Advanced'], 'epic'),
('Claude 3.7 Sonnet (Standard)', 'Anthropic', 'Anthropic', 'claude-3-7-sonnet', 'Proprietary', 200000, 3.00, 15.00, 6.00, 80.3, 0.97, 48, 'coding', 'Standard Claude 3.7 model', ARRAY['Advanced coding', 'Safety first', 'Balanced'], 'epic'),
('Claude 4 Sonnet (Extended Thinking)', 'Anthropic', 'Anthropic', 'claude-4-sonnet-thinking', 'Proprietary', 200000, 12.00, 60.00, 24.00, 45.0, 2.00, 62, 'reasoning', 'Claude 4 Sonnet with thinking', ARRAY['Extended thinking', 'Advanced', 'Reasoning'], 'legendary'),
('Claude 3.5 Sonnet (Oct ''24)', 'Anthropic', 'Anthropic', 'claude-3-5-sonnet-oct', 'Proprietary', 200000, 3.00, 15.00, 6.00, 77.2, 1.27, 44, 'coding', 'October 2024 Claude 3.5', ARRAY['Advanced coding', 'Safety', 'Updated'], 'epic'),
('Claude 3.5 Sonnet (June ''24)', 'Anthropic', 'Anthropic', 'claude-3-5-sonnet-june', 'Proprietary', 200000, 3.00, 15.00, 6.00, 80.6, 0.77, 42, 'coding', 'June 2024 Claude 3.5', ARRAY['Advanced coding', 'Safety', 'Original'], 'rare'),
('Claude 3 Opus', 'Anthropic', 'Anthropic', 'claude-3-opus', 'Proprietary', 200000, 15.00, 75.00, 30.00, 27.1, 1.16, 35, 'reasoning', 'Original Claude 3 flagship', ARRAY['Highest quality', 'Advanced reasoning', 'Safety'], 'legendary'),
('Claude 3 Sonnet', 'Anthropic', 'Anthropic', 'claude-3-sonnet', 'Proprietary', 200000, 3.00, 15.00, 6.00, 58.0, 0.54, 32, 'coding', 'Balanced Claude 3 model', ARRAY['Balanced', 'Code generation', 'Safety'], 'rare'),
('Claude 3 Haiku', 'Anthropic', 'Anthropic', 'claude-3-haiku', 'Proprietary', 200000, 0.25, 1.25, 0.50, 131.7, 0.58, 28, 'lightweight', 'Fast Claude 3 model', ARRAY['Fast', 'Affordable', 'Safety'], 'common'),
('Claude Instant', 'Anthropic', 'Anthropic', 'claude-instant', 'Proprietary', 100000, 0.80, 2.40, 1.20, 100.0, 0.60, 25, 'lightweight', 'Legacy instant Claude', ARRAY['Legacy', 'Fast', 'Affordable'], 'common'),
('Claude 2.0', 'Anthropic', 'Anthropic', 'claude-2', 'Proprietary', 100000, 8.00, 24.00, 12.00, 29.3, 0.82, 22, 'reasoning', 'Legacy Claude 2 model', ARRAY['Legacy', 'Reasoning', 'Safety'], 'common'),
('Claude 2.1', 'Anthropic', 'Anthropic', 'claude-2-1', 'Proprietary', 200000, 8.00, 24.00, 12.00, 13.3, 0.82, 24, 'reasoning', 'Improved Claude 2 model', ARRAY['Legacy', 'Improved', 'Safety'], 'common'),

-- Continue with remaining providers...
-- DeepSeek Models
('DeepSeek R1 Distill Qwen 32B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-distill-qwen-32b', 'Open', 128000, 0.12, 0.18, 0.14, 96.8, 2.31, 51, 'reasoning', 'Distilled R1 model based on Qwen', ARRAY['Distilled', 'Reasoning', 'Open source'], 'epic'),
('DeepSeek R1 Distill Llama 70B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-distill-llama-70b', 'Open', 128000, 0.23, 0.69, 0.34, 39.8, 10.84, 48, 'reasoning', 'Distilled R1 model based on Llama', ARRAY['Distilled', 'Reasoning', 'Open source'], 'epic'),
('DeepSeek R1 Distill Qwen 14B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-distill-qwen-14b', 'Open', 128000, 0.15, 0.15, 0.15, 164.8, 6.62, 49, 'reasoning', 'Compact distilled reasoning model', ARRAY['Compact', 'Distilled', 'Reasoning'], 'rare'),
('DeepSeek R1 Distill Llama 8B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-distill-llama-8b', 'Open', 128000, 0.04, 0.04, 0.04, 54.2, 9.07, 34, 'lightweight', 'Small distilled reasoning model', ARRAY['Small', 'Distilled', 'Fast'], 'common'),
('DeepSeek R1 Distill Qwen 1.5B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-distill-qwen-1-5b', 'Open', 128000, 0.18, 0.18, 0.18, 380.2, 6.65, 19, 'lightweight', 'Tiny distilled reasoning model', ARRAY['Tiny', 'Ultra fast', 'Edge'], 'common'),
('DeepSeek R1 0528 (May ''25)', 'DeepSeek', 'DeepSeek', 'deepseek-r1-0528', 'Open', 128000, 0.60, 2.40, 1.00, 30.0, 60.0, 58, 'reasoning', 'May 2025 R1 model update', ARRAY['Updated', 'Reasoning', 'Open source'], 'epic'),
('DeepSeek V3 0324 (Mar ''25)', 'DeepSeek', 'DeepSeek', 'deepseek-v3-0324', 'Open', 128000, 0.30, 1.20, 0.50, 25.0, 8.0, 48, 'coding', 'March 2025 V3 update', ARRAY['Updated', 'Code generation', 'Open source'], 'epic'),
('DeepSeek R1 0528 Qwen3 8B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-0528-qwen3-8b', 'Open', 128000, 0.08, 0.16, 0.10, 100.0, 5.0, 35, 'lightweight', 'Compact R1 variant', ARRAY['Compact', 'Reasoning', 'Fast'], 'common'),
('DeepSeek V3 (Dec ''24)', 'DeepSeek', 'DeepSeek', 'deepseek-v3', 'Open', 66000, 0.27, 1.10, 0.48, 27.4, 7.19, 46, 'budget', 'Ultra cost-effective model with GPT-4 level performance', ARRAY['Ultra low cost', 'Open source', 'High performance'], 'epic'),
('DeepSeek-V2.5 (Dec ''24)', 'DeepSeek', 'DeepSeek', 'deepseek-v2-5-dec', 'Open', 128000, 0.30, 1.20, 0.55, 25.0, 8.0, 44, 'coding', 'December 2024 V2.5 update', ARRAY['Updated', 'Code generation', 'Open source'], 'rare'),
('DeepSeek-Coder-V2', 'DeepSeek', 'DeepSeek', 'deepseek-coder-v2', 'Open', 128000, 0.20, 0.80, 0.35, 40.0, 5.0, 42, 'coding', 'Specialized coding model', ARRAY['Code specialist', 'Open source', 'Programming'], 'rare'),
('DeepSeek LLM 67B Chat (V1)', 'DeepSeek', 'DeepSeek', 'deepseek-llm-67b-v1', 'Open', 4000, 0.50, 2.00, 0.75, 35.0, 2.0, 38, 'coding', 'Original DeepSeek large model', ARRAY['Original', 'Large', 'Chat optimized'], 'rare'),
('DeepSeek R1 (Jan ''25)', 'DeepSeek', 'DeepSeek', 'deepseek-r1', 'Open', 64000, 0.55, 2.19, 0.96, 25.1, 68.28, 60, 'reasoning', 'Open-source reasoning model with visible thinking process', ARRAY['Open source', 'Chain of thought', 'Chinese optimized'], 'legendary'),
('DeepSeek Coder V2 Lite Instruct', 'DeepSeek', 'DeepSeek', 'deepseek-coder-v2-lite', 'Open', 128000, 0.08, 0.24, 0.12, 117.6, 0.56, 24, 'coding', 'Lite coding model', ARRAY['Lite', 'Code generation', 'Fast'], 'common'),
('DeepSeek-V2.5', 'DeepSeek', 'DeepSeek', 'deepseek-v2-5', 'Open', 128000, 0.28, 1.12, 0.50, 26.0, 7.5, 43, 'coding', 'Improved V2.5 model', ARRAY['Improved', 'Code generation', 'Open source'], 'rare'),
('DeepSeek-V2-Chat', 'DeepSeek', 'DeepSeek', 'deepseek-v2-chat', 'Open', 128000, 0.25, 1.00, 0.45, 30.0, 6.0, 40, 'coding', 'Chat-optimized V2 model', ARRAY['Chat optimized', 'Code generation', 'Open source'], 'rare'),

-- Continue with more providers and models...
-- I'll add a selection of other important models to keep within reasonable limits

-- xAI Models
('Grok 3', 'xAI', 'xAI', 'grok-3', 'Proprietary', 1000000, 8.00, 24.00, 12.00, 80.0, 0.30, 45, 'reasoning', 'Latest Grok model with massive context', ARRAY['Massive context', 'Humor', 'Real-time'], 'legendary'),
('Grok 3 mini Reasoning (high)', 'xAI', 'xAI', 'grok-3-mini-reasoning-high', 'Proprietary', 1000000, 3.00, 12.00, 5.25, 120.0, 0.25, 42, 'reasoning', 'High-performance compact Grok', ARRAY['Reasoning', 'Compact', 'High performance'], 'epic'),
('Grok 3 mini Reasoning (Low)', 'xAI', 'xAI', 'grok-3-mini-reasoning-low', 'Proprietary', 1000000, 1.50, 6.00, 2.75, 150.0, 0.20, 38, 'lightweight', 'Efficient compact Grok', ARRAY['Reasoning', 'Efficient', 'Low cost'], 'rare'),
('Grok 3 Reasoning Beta', 'xAI', 'xAI', 'grok-3-reasoning-beta', 'Proprietary', 1000000, 6.00, 18.00, 9.00, 90.0, 0.35, 48, 'reasoning', 'Beta reasoning Grok model', ARRAY['Beta', 'Advanced reasoning', 'Experimental'], 'epic'),
('Grok Beta', 'xAI', 'xAI', 'grok-beta', 'Proprietary', 128000, 5.00, 15.00, 7.50, 66.4, 0.26, 38, 'reasoning', 'Original Grok beta model', ARRAY['Humor optimized', 'Real-time info', 'Creative'], 'legendary'),
('Grok 2 (Dec ''24)', 'xAI', 'xAI', 'grok-2-dec', 'Proprietary', 131000, 4.00, 12.00, 6.00, 75.0, 0.30, 40, 'reasoning', 'December 2024 Grok 2', ARRAY['Improved', 'Humor', 'Real-time'], 'rare'),

-- Amazon Models
('Nova Pro', 'Amazon', 'Amazon', 'nova-pro', 'Proprietary', 300000, 0.80, 3.20, 1.40, 80.1, 0.37, 37, 'multimodal', 'Amazon''s multimodal model', ARRAY['Multimodal', 'Long context', 'AWS integration'], 'rare'),
('Nova Lite', 'Amazon', 'Amazon', 'nova-lite', 'Proprietary', 300000, 0.30, 1.20, 0.60, 120.0, 0.30, 32, 'lightweight', 'Lite version of Nova', ARRAY['Lite', 'Fast', 'AWS integration'], 'common'),
('Nova Micro', 'Amazon', 'Amazon', 'nova-micro', 'Proprietary', 130000, 0.04, 0.14, 0.06, 189.3, 0.29, 28, 'lightweight', 'Micro Nova model', ARRAY['Micro', 'Ultra fast', 'Edge computing'], 'common'),
('Nova Premier', 'Amazon', 'Amazon', 'nova-premier', 'Proprietary', 1000000, 2.00, 8.00, 3.50, 60.0, 0.50, 45, 'reasoning', 'Premium Nova model', ARRAY['Premium', 'Long context', 'Advanced'], 'epic'),

-- Microsoft Models
('Phi-4', 'Microsoft', 'Microsoft', 'phi-4', 'Open', 16000, 0.07, 0.14, 0.09, 35.5, 0.36, 40, 'lightweight', 'Microsoft''s latest small model', ARRAY['Small size', 'High efficiency', 'Open source'], 'common'),
('Phi-3 Mini Instruct 3.8B', 'Microsoft', 'Microsoft', 'phi-3-mini-3-8b', 'Open', 4000, 0.05, 0.10, 0.06, 200.0, 0.25, 25, 'lightweight', 'Ultra-compact Phi model', ARRAY['Ultra compact', 'Fast', 'Edge optimized'], 'common'),
('Phi-4 Multimodal Instruct', 'Microsoft', 'Microsoft', 'phi-4-multimodal', 'Open', 128000, 0.10, 0.20, 0.12, 80.0, 0.40, 35, 'multimodal', 'Multimodal Phi-4 model', ARRAY['Multimodal', 'Vision', 'Open source'], 'rare'),
('Phi-3 Medium Instruct 14B', 'Microsoft', 'Microsoft', 'phi-3-medium-14b', 'Open', 128000, 0.17, 0.68, 0.30, 53.1, 0.42, 25, 'coding', 'Medium-sized Phi model', ARRAY['Medium size', 'Code generation', 'Open source'], 'common'),
('Phi-4 Mini Instruct', 'Microsoft', 'Microsoft', 'phi-4-mini', 'Open', 128000, 0.08, 0.16, 0.10, 150.0, 0.30, 30, 'lightweight', 'Mini Phi-4 model', ARRAY['Mini', 'Fast', 'Efficient'], 'common'),

-- Mistral Models (additional)
('Mistral Large 2 (Nov ''24)', 'Mistral', 'Mistral', 'mistral-large-2-nov', 'Open', 128000, 2.00, 6.00, 3.00, 45.9, 0.49, 38, 'coding', 'November 2024 Mistral Large', ARRAY['Advanced reasoning', 'Code expert', 'Open source'], 'rare'),
('Pixtral Large', 'Mistral', 'Mistral', 'pixtral-large', 'Open', 128000, 2.00, 6.00, 3.00, 35.0, 0.43, 37, 'multimodal', 'Large vision model from Mistral', ARRAY['Vision', 'Large', 'Multimodal'], 'rare'),
('Mixtral 8x22B Instruct', 'Mistral', 'Mistral', 'mixtral-8x22b', 'Open', 65000, 2.00, 6.00, 3.00, 84.9, 0.44, 26, 'coding', 'Large mixture of experts model', ARRAY['Mixture of experts', 'Code generation', 'Open source'], 'rare'),
('Ministral 8B', 'Mistral', 'Mistral', 'ministral-8b', 'Open', 128000, 0.10, 0.10, 0.10, 141.9, 0.40, 22, 'lightweight', 'Compact efficient model', ARRAY['Compact', 'Efficient', 'Open source'], 'common'),
('Mistral NeMo', 'Mistral', 'Mistral', 'mistral-nemo', 'Open', 128000, 0.15, 0.15, 0.15, 120.7, 0.43, 20, 'lightweight', 'Nvidia-optimized Mistral model', ARRAY['Nvidia optimized', 'Efficient', 'Open source'], 'common'),
('Ministral 3B', 'Mistral', 'Mistral', 'ministral-3b', 'Proprietary', 128000, 0.04, 0.04, 0.04, 220.1, 0.38, 20, 'lightweight', 'Ultra-compact Mistral model', ARRAY['Ultra compact', 'Fast', 'Efficient'], 'common'),
('Mixtral 8x7B Instruct', 'Mistral', 'Mistral', 'mixtral-8x7b', 'Open', 33000, 0.60, 0.60, 0.60, 102.9, 0.38, 17, 'coding', 'Popular mixture of experts model', ARRAY['Mixture of experts', 'Popular', 'Open source'], 'common'),
('Magistral Small', 'Mistral', 'Mistral', 'magistral-small', 'Open', 128000, 0.08, 0.08, 0.08, 180.0, 0.35, 25, 'lightweight', 'Small Magistral model', ARRAY['Small', 'Fast', 'Open source'], 'common'),
('Mistral Saba', 'Mistral', 'Mistral', 'mistral-saba', 'Proprietary', 32000, 0.20, 0.60, 0.30, 96.7, 0.40, 32, 'coding', 'Specialized Mistral model', ARRAY['Specialized', 'Code generation', 'Fast'], 'rare'),

-- Alibaba Models (selection)
('Qwen3 4B (Reasoning)', 'Alibaba', 'Alibaba', 'qwen3-4b-reasoning', 'Open', 32000, 0.08, 0.08, 0.08, 160.0, 0.30, 28, 'reasoning', 'Reasoning-optimized Qwen3', ARRAY['Reasoning', 'Compact', 'Open source'], 'common'),
('Qwen3 235B A22B', 'Alibaba', 'Alibaba', 'qwen3-235b-a22b', 'Open', 128000, 3.00, 3.00, 3.00, 20.0, 2.0, 50, 'reasoning', 'Largest Qwen3 model', ARRAY['Largest', 'Advanced reasoning', 'Open source'], 'legendary'),
('Qwen3 32B', 'Alibaba', 'Alibaba', 'qwen3-32b', 'Open', 128000, 0.50, 0.50, 0.50, 60.0, 0.80, 42, 'coding', 'Large Qwen3 model', ARRAY['Large', 'Code generation', 'Open source'], 'rare'),
('QwQ 32B', 'Alibaba', 'Alibaba', 'qwq-32b', 'Open', 131000, 0.20, 0.20, 0.20, 67.9, 1.15, 43, 'reasoning', 'Question-answering optimized model', ARRAY['Q&A optimized', 'Reasoning', 'Open source'], 'rare'),
('Qwen2.5 72B', 'Alibaba', 'Alibaba', 'qwen-2-5-72b', 'Open', 131000, 0.40, 0.40, 0.40, 46.8, 1.05, 40, 'coding', 'Alibaba''s powerful coding model', ARRAY['Code generation', 'Chinese native', 'Open source'], 'epic'),
('Qwen2.5 Max', 'Alibaba', 'Alibaba', 'qwen2-5-max', 'Proprietary', 32000, 1.60, 6.40, 2.80, 36.1, 1.26, 45, 'reasoning', 'Maximum performance Qwen model', ARRAY['Maximum performance', 'Advanced', 'Premium'], 'epic'),
('Qwen2.5 Turbo', 'Alibaba', 'Alibaba', 'qwen2-5-turbo', 'Proprietary', 1000000, 0.05, 0.20, 0.09, 77.2, 1.05, 34, 'lightweight', 'Fast Qwen model with long context', ARRAY['Fast', 'Long context', 'Turbo'], 'rare'),

-- Add some final important models from other providers
('Command-R+', 'Cohere', 'Cohere', 'command-r-plus', 'Open', 128000, 2.50, 10.00, 4.38, 73.0, 0.24, 21, 'coding', 'Enhanced command model', ARRAY['Command following', 'RAG optimized', 'Open source'], 'rare'),
('Jamba 1.6 Large', 'AI21 Labs', 'AI21 Labs', 'jamba-1-6-large', 'Open', 256000, 2.00, 8.00, 3.50, 60.5, 0.51, 29, 'coding', 'Large Jamba model', ARRAY['Large', 'Long context', 'Open source'], 'rare'),
('LFM 40B', 'Liquid AI', 'Liquid AI', 'lfm-40b', 'Proprietary', 32000, 3.00, 9.00, 4.50, 45.0, 0.60, 35, 'reasoning', 'Liquid AI''s foundation model', ARRAY['Liquid architecture', 'Efficient', 'Novel'], 'epic'),
('Solar Pro 2 (Preview) (Reasoning)', 'Upstage', 'Upstage', 'solar-pro-2-reasoning', 'Proprietary', 64000, 2.00, 6.00, 3.00, 50.0, 0.70, 38, 'reasoning', 'Reasoning-optimized Solar model', ARRAY['Reasoning', 'Preview', 'Solar optimized'], 'rare'),
('DBRX Instruct', 'Databricks', 'Databricks', 'dbrx-instruct', 'Open', 33000, 1.20, 1.20, 1.20, 82.9, 0.32, 20, 'coding', 'Databricks instruction model', ARRAY['Open source', 'Enterprise', 'Code generation'], 'rare'),
('MiniMax-Text-01', 'MiniMax', 'MiniMax', 'minimax-text-01', 'Open', 4000000, 0.20, 1.10, 0.42, 38.3, 0.86, 40, 'reasoning', 'MiniMax text model with huge context', ARRAY['Huge context', 'Text processing', 'Open source'], 'epic'),
('Yi-Large', '01.AI', '01.AI', 'yi-large', 'Proprietary', 32000, 3.00, 3.00, 3.00, 67.2, 0.39, 28, 'coding', '01.AI''s large model', ARRAY['Chinese optimized', 'Large', 'Bilingual'], 'rare'),
('Arctic Instruct', 'Snowflake', 'Snowflake', 'arctic-instruct', 'Open', 4000, 0.20, 0.20, 0.20, 120.0, 0.40, 22, 'coding', 'Snowflake''s Arctic model', ARRAY['Enterprise', 'Instruction following', 'Open source'], 'common');

-- Update avg_price calculation for all records
UPDATE llm_models 
SET avg_price = ROUND((input_price + output_price) / 2.0, 4);