/*
  # Comprehensive LLM Models Update from artificialanalysis.ai

  1. Data Source
    - Updates from artificialanalysis.ai LLM API Providers Leaderboard
    - Over 500 AI model endpoints across major providers
    - Real-time performance metrics and pricing data

  2. New Models Added
    - OpenAI: o1, o3, o4-mini, GPT-4.1, GPT-4o variants
    - Google: Gemini 2.5 series, Gemma 3 series
    - Anthropic: Claude 4 series, Claude 3.7 Sonnet
    - DeepSeek: R1 series, V3 variants
    - Meta: Llama 4 series, Llama 3.3
    - xAI: Grok 3 series
    - Many other providers and models

  3. Enhanced Data
    - Updated pricing per million tokens
    - Performance metrics (speed, latency)
    - Quality indices from benchmarks
    - Context window information
    - License types and features
*/

-- Clear existing data to avoid conflicts with the comprehensive update
TRUNCATE TABLE llm_models;

-- Insert OpenAI Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('o3', 'OpenAI', 'OpenAI', 'o3-2025-04-16', 'Proprietary', 128000,
   2.00, 8.00, 3.50, 142.5, 19.60, 70, 'reasoning', 'Advanced reasoning model with exceptional performance', 
   ARRAY['reasoning', 'mathematics', 'coding'], 'legendary'),
   
  ('o4-mini (high)', 'OpenAI', 'OpenAI', 'o4-mini-2025-04-16', 'Proprietary', 200000,
   1.10, 4.40, 1.93, 119.1, 38.80, 70, 'reasoning', 'Efficient reasoning model for complex tasks', 
   ARRAY['reasoning', 'mathematics', 'multimodal'], 'epic'),
   
  ('o3-mini (high)', 'OpenAI', 'OpenAI', 'o3-mini', 'Proprietary', 200000,
   1.10, 4.40, 1.93, 150.9, 47.32, 66, 'reasoning', 'Compact reasoning model with high efficiency', 
   ARRAY['reasoning', 'mathematics'], 'epic'),
   
  ('o3-mini', 'OpenAI', 'OpenAI', 'o3-mini', 'Proprietary', 200000,
   1.10, 4.40, 1.93, 150.1, 14.22, 63, 'reasoning', 'Standard reasoning model for various tasks', 
   ARRAY['reasoning', 'problem-solving'], 'rare'),
   
  ('o1', 'OpenAI', 'OpenAI', 'o1-2024-12-17', 'Proprietary', 200000,
   15.00, 60.00, 26.25, 163.9, 16.52, 62, 'reasoning', 'Advanced reasoning and analysis model', 
   ARRAY['reasoning', 'analysis', 'mathematics'], 'epic'),
   
  ('o1-mini', 'OpenAI', 'OpenAI', 'o1-mini-2024-09-12', 'Proprietary', 128000,
   1.10, 4.40, 1.93, 247.7, 9.11, 54, 'reasoning', 'Efficient reasoning model for quick tasks', 
   ARRAY['reasoning', 'mathematics'], 'rare'),
   
  ('o1-preview', 'OpenAI', 'OpenAI', 'o1-preview-2024-09-12', 'Proprietary', 128000,
   15.00, 60.00, 26.25, 159.6, 20.26, 70, 'reasoning', 'Preview version of advanced reasoning model', 
   ARRAY['reasoning', 'preview'], 'legendary'),
   
  ('GPT-4.1', 'OpenAI', 'OpenAI', 'gpt-4.1-2025-04-14', 'Proprietary', 1000000,
   2.00, 8.00, 3.50, 116.7, 0.44, 53, 'multimodal', 'Next generation GPT with enhanced capabilities', 
   ARRAY['text-generation', 'analysis', 'coding'], 'epic'),
   
  ('GPT-4.1 mini', 'OpenAI', 'OpenAI', 'gpt-4.1-mini-2025-04-14', 'Proprietary', 1000000,
   0.40, 1.60, 0.70, 66.3, 0.39, 53, 'multimodal', 'Efficient version of GPT-4.1', 
   ARRAY['text-generation', 'coding'], 'rare'),
   
  ('GPT-4.1 nano', 'OpenAI', 'OpenAI', 'gpt-4.1-nano-2025-04-14', 'Proprietary', 1000000,
   0.10, 0.40, 0.17, 129.7, 0.33, 41, 'lightweight', 'Ultra-efficient GPT model', 
   ARRAY['text-generation', 'efficiency'], 'rare'),
   
  ('GPT-4o (March 2025)', 'OpenAI', 'OpenAI', 'chatgpt-4o-latest', 'Proprietary', 128000,
   5.00, 15.00, 7.50, 183.0, 0.46, 50, 'multimodal', 'Latest GPT-4o with enhanced performance', 
   ARRAY['text-generation', 'multimodal', 'vision'], 'epic'),
   
  ('GPT-4o (Nov 24)', 'OpenAI', 'OpenAI', 'gpt-4o-2024-11-20', 'Proprietary', 128000,
   2.50, 10.00, 4.38, 173.9, 0.43, 41, 'multimodal', 'Optimized GPT-4o for various tasks', 
   ARRAY['text-generation', 'multimodal'], 'rare'),
   
  ('GPT-4o (Aug 24)', 'OpenAI', 'OpenAI', 'gpt-4o-2024-08-06', 'Proprietary', 128000,
   2.50, 10.00, 4.38, 77.1, 0.59, 41, 'multimodal', 'Enhanced GPT-4o with improved efficiency', 
   ARRAY['text-generation', 'multimodal'], 'rare'),
   
  ('GPT-4o (May 24)', 'OpenAI', 'OpenAI', 'gpt-4o', 'Proprietary', 128000,
   5.00, 15.00, 7.50, 83.4, 0.56, 41, 'multimodal', 'Original GPT-4o multimodal model', 
   ARRAY['text-generation', 'multimodal', 'vision'], 'rare'),
   
  ('GPT-4o mini', 'OpenAI', 'OpenAI', 'gpt-4o-mini-2024-07-18', 'Proprietary', 128000,
   0.15, 0.60, 0.26, 67.2, 0.47, 36, 'lightweight', 'Efficient and cost-effective GPT model', 
   ARRAY['text-generation', 'efficiency'], 'common'),
   
  ('GPT-4 Turbo', 'OpenAI', 'OpenAI', 'gpt-4-turbo', 'Proprietary', 128000,
   10.00, 30.00, 15.00, 49.3, 0.96, 41, 'multimodal', 'High-performance GPT-4 variant', 
   ARRAY['text-generation', 'analysis'], 'rare'),
   
  ('GPT-4', 'OpenAI', 'OpenAI', 'gpt-4', 'Proprietary', 8000,
   30.00, 60.00, 37.50, 25.8, 0.81, 35, 'multimodal', 'Foundational GPT-4 model', 
   ARRAY['text-generation', 'reasoning'], 'rare'),
   
  ('GPT-3.5 Turbo', 'OpenAI', 'OpenAI', 'gpt-3.5-turbo', 'Proprietary', 4000,
   0.50, 1.50, 0.75, 60.3, 0.45, 25, 'lightweight', 'Fast and efficient conversational AI', 
   ARRAY['text-generation', 'chat'], 'common'),
   
  ('GPT-4.5 (Preview)', 'OpenAI', 'OpenAI', 'gpt-4.5-preview-2025-02-27', 'Proprietary', 128000,
   75.00, 150.00, 93.75, 63.8, 1.05, 60, 'multimodal', 'Preview of next-generation GPT model', 
   ARRAY['text-generation', 'preview', 'advanced'], 'legendary');

-- Insert Google Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('Gemini 2.5 Pro', 'Google', 'Google', 'gemini-2.5-pro-preview-06-05', 'Proprietary', 1000000,
   1.25, 10.00, 3.44, 142.9, 36.08, 70, 'multimodal', 'Advanced multimodal AI with long context', 
   ARRAY['multimodal', 'vision', 'long-context'], 'legendary'),
   
  ('Gemini 2.5 Pro (Mar 25)', 'Google', 'Google', 'gemini-2.5-pro-preview-03-25', 'Proprietary', 1000000,
   1.25, 10.00, 3.44, 141.9, 34.64, 69, 'multimodal', 'Enhanced Gemini Pro with improved reasoning', 
   ARRAY['multimodal', 'reasoning'], 'epic'),
   
  ('Gemini 2.5 Pro (May 25)', 'Google', 'Google', 'gemini-2.5-pro-preview-05-06', 'Proprietary', 1000000,
   1.25, 10.00, 3.44, 141.4, 35.05, 68, 'multimodal', 'Latest Gemini Pro with enhanced capabilities', 
   ARRAY['multimodal', 'enhanced'], 'epic'),
   
  ('Gemini 2.5 Flash (Reasoning)', 'Google', 'Google', 'gemini-2.5-flash-preview-05-20', 'Proprietary', 1000000,
   0.15, 3.50, 0.99, 342.8, 13.19, 65, 'reasoning', 'High-speed reasoning model', 
   ARRAY['reasoning', 'fast-inference'], 'epic'),
   
  ('Gemini 2.5 Flash', 'Google', 'Google', 'gemini-2.5-flash-preview-05-20', 'Proprietary', 1000000,
   0.15, 0.60, 0.26, 283.3, 0.47, 53, 'multimodal', 'Fast and efficient multimodal model', 
   ARRAY['multimodal', 'efficiency'], 'rare'),
   
  ('Gemini 2.5 Flash (April 25)', 'Google', 'Google', 'gemini-2.5-flash-preview-04-17', 'Proprietary', 1000000,
   0.15, 0.60, 0.26, 312.8, 0.41, 49, 'multimodal', 'Optimized Flash model for various tasks', 
   ARRAY['multimodal', 'optimization'], 'rare'),
   
  ('Gemini 2.5 Flash-Lite (Reasoning)', 'Google', 'Google', 'gemini-2.5-flash-lite-preview-06-17', 'Proprietary', 1000000,
   0.10, 0.40, 0.17, 656.0, 6.62, 55, 'reasoning', 'Lightweight reasoning model with high speed', 
   ARRAY['reasoning', 'lightweight'], 'rare'),
   
  ('Gemini 2.5 Flash-Lite', 'Google', 'Google', 'gemini-2.5-flash-lite-preview-06-17', 'Proprietary', 1000000,
   0.10, 0.40, 0.17, 509.0, 0.20, 46, 'lightweight', 'Ultra-efficient lightweight model', 
   ARRAY['lightweight', 'efficiency'], 'rare'),
   
  ('Gemini 2.0 Pro Experimental', 'Google', 'Google', 'gemini-2.0-pro-exp-02-05', 'Proprietary', 2000000,
   0.00, 0.00, 0.00, 38.4, 18.22, 49, 'multimodal', 'Experimental version of Gemini 2.0 Pro', 
   ARRAY['experimental', 'multimodal'], 'rare'),
   
  ('Gemini 2.0 Flash', 'Google', 'Google', 'gemini-2.0-flash-001', 'Proprietary', 1000000,
   0.10, 0.40, 0.17, 230.6, 0.41, 48, 'multimodal', 'Next-generation Flash model', 
   ARRAY['multimodal', 'next-gen'], 'rare'),
   
  ('Gemini 2.0 Flash-Lite', 'Google', 'Google', 'gemini-2.0-flash-lite-001', 'Proprietary', 1000000,
   0.07, 0.30, 0.13, 215.0, 0.32, 41, 'lightweight', 'Lightweight version of Gemini 2.0', 
   ARRAY['lightweight', 'efficient'], 'common'),
   
  ('Gemini 1.5 Pro (Sep 24)', 'Google', 'Google', 'gemini-1.5-pro-002', 'Proprietary', 2000000,
   1.25, 5.00, 2.19, 90.6, 0.99, 45, 'multimodal', 'Proven Gemini Pro model with long context', 
   ARRAY['multimodal', 'long-context'], 'rare'),
   
  ('Gemini 1.5 Flash (Sep 24)', 'Google', 'Google', 'gemini-1.5-flash-002', 'Proprietary', 1000000,
   0.07, 0.30, 0.13, 185.2, 0.24, 39, 'multimodal', 'Balanced Flash model for general use', 
   ARRAY['multimodal', 'balanced'], 'common'),
   
  ('Gemini 1.5 Flash-8B', 'Google', 'Google', 'gemini-1.5-flash-8b', 'Proprietary', 1000000,
   0.04, 0.15, 0.07, 242.8, 0.24, 31, 'lightweight', 'Compact 8B parameter Flash model', 
   ARRAY['lightweight', 'compact'], 'common'),
   
  ('Gemma 3 27B', 'Google', 'Google', 'gemma-3-27b-it', 'Open', 128000,
   0.10, 0.19, 0.12, 19.9, 0.72, 38, 'multimodal', 'Open-source Gemma model for research', 
   ARRAY['open-source', 'research'], 'common'),
   
  ('Gemma 3 12B', 'Google', 'Google', 'gemma-3-12b-it', 'Open', 128000,
   0.05, 0.10, 0.06, 60.1, 0.31, 34, 'lightweight', 'Medium-sized open Gemma model', 
   ARRAY['open-source', 'medium-size'], 'common'),
   
  ('Gemma 3 4B', 'Google', 'Google', 'gemma-3-4b-it', 'Open', 128000,
   0.02, 0.04, 0.03, 86.0, 0.54, 25, 'lightweight', 'Compact open-source Gemma model', 
   ARRAY['open-source', 'compact'], 'common'),
   
  ('Gemma 2 27B', 'Google', 'Google', 'gemma-2-27b-it', 'Open', 8000,
   0.80, 0.80, 0.80, 90.1, 0.26, 32, 'lightweight', 'Previous generation Gemma model', 
   ARRAY['open-source', 'legacy'], 'common'),
   
  ('Gemma 2 9B', 'Google', 'Google', 'gemma2-9b-it', 'Open', 8000,
   0.20, 0.20, 0.20, 723.0, 0.21, 22, 'lightweight', 'Efficient 9B parameter model', 
   ARRAY['open-source', 'efficient'], 'common');

-- Insert Anthropic Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('Claude 4 Opus (Extended Thinking)', 'Anthropic', 'Anthropic', 'claude-opus-4-20250514', 'Proprietary', 200000,
   15.00, 75.00, 30.00, 21.2, 3.69, 64, 'reasoning', 'Advanced Claude with extended reasoning capabilities', 
   ARRAY['reasoning', 'analysis', 'extended-thinking'], 'legendary'),
   
  ('Claude 4 Opus', 'Anthropic', 'Anthropic', 'claude-opus-4-20250514', 'Proprietary', 200000,
   15.00, 75.00, 30.00, 63.4, 2.31, 58, 'multimodal', 'Flagship Claude model with superior performance', 
   ARRAY['multimodal', 'analysis', 'reasoning'], 'epic'),
   
  ('Claude 4 Sonnet (Extended Thinking)', 'Anthropic', 'Anthropic', 'claude-sonnet-4-20250514', 'Proprietary', 200000,
   3.00, 15.00, 6.00, 43.2, 1.34, 61, 'reasoning', 'Balanced Claude with extended reasoning', 
   ARRAY['reasoning', 'balanced', 'extended-thinking'], 'epic'),
   
  ('Claude 4 Sonnet', 'Anthropic', 'Anthropic', 'claude-sonnet-4-20250514', 'Proprietary', 200000,
   3.00, 15.00, 6.00, 50.9, 1.49, 53, 'multimodal', 'Balanced Claude model for various tasks', 
   ARRAY['multimodal', 'balanced'], 'rare'),
   
  ('Claude 3.7 Sonnet (Extended Thinking)', 'Anthropic', 'Anthropic', 'claude-3-7-sonnet-20250219', 'Proprietary', 200000,
   3.00, 15.00, 6.00, 57.4, 1.55, 57, 'reasoning', 'Enhanced Sonnet with extended reasoning', 
   ARRAY['reasoning', 'enhanced'], 'rare'),
   
  ('Claude 3.7 Sonnet', 'Anthropic', 'Anthropic', 'claude-3-7-sonnet-20250219', 'Proprietary', 200000,
   3.00, 15.00, 6.00, 79.0, 1.08, 48, 'multimodal', 'Improved Claude 3 Sonnet model', 
   ARRAY['multimodal', 'improved'], 'rare'),
   
  ('Claude 3.5 Sonnet (Oct 24)', 'Anthropic', 'Anthropic', 'claude-3-5-sonnet-20241022', 'Proprietary', 200000,
   3.00, 15.00, 6.00, 79.7, 1.41, 44, 'multimodal', 'Latest Claude 3.5 with enhanced capabilities', 
   ARRAY['multimodal', 'latest'], 'rare'),
   
  ('Claude 3.5 Sonnet (June 24)', 'Anthropic', 'Anthropic', 'claude-3-5-sonnet-20240620', 'Proprietary', 200000,
   3.00, 15.00, 6.00, 79.6, 0.90, 44, 'multimodal', 'Mid-year Claude 3.5 update', 
   ARRAY['multimodal', 'mid-year'], 'rare'),
   
  ('Claude 3.5 Haiku', 'Anthropic', 'Anthropic', 'claude-3-5-haiku-20241022', 'Proprietary', 200000,
   0.80, 4.00, 1.60, 66.8, 1.20, 35, 'lightweight', 'Fast and efficient Claude model', 
   ARRAY['lightweight', 'efficient'], 'common'),
   
  ('Claude 3 Opus', 'Anthropic', 'Anthropic', 'claude-3-opus-20240229', 'Proprietary', 200000,
   15.00, 75.00, 30.00, 28.7, 1.48, 35, 'multimodal', 'Original Claude 3 flagship model', 
   ARRAY['multimodal', 'flagship'], 'rare'),
   
  ('Claude 3 Sonnet', 'Anthropic', 'Anthropic', 'claude-3-sonnet-20240229', 'Proprietary', 200000,
   3.00, 15.00, 6.00, 61.2, 0.68, 28, 'multimodal', 'Balanced Claude 3 model', 
   ARRAY['multimodal', 'balanced'], 'common'),
   
  ('Claude 3 Haiku', 'Anthropic', 'Anthropic', 'claude-3-haiku-20240307', 'Proprietary', 200000,
   0.25, 1.25, 0.50, 133.9, 0.59, 23, 'lightweight', 'Fastest Claude 3 model', 
   ARRAY['lightweight', 'fast'], 'common'),
   
  ('Claude 2.1', 'Anthropic', 'Anthropic', 'claude-2.1', 'Proprietary', 200000,
   8.00, 24.00, 12.00, 13.8, 1.01, 24, 'multimodal', 'Previous generation Claude model', 
   ARRAY['multimodal', 'legacy'], 'common'),
   
  ('Claude 2.0', 'Anthropic', 'Anthropic', 'claude-2.0', 'Proprietary', 100000,
   8.00, 24.00, 12.00, 30.8, 1.12, 24, 'multimodal', 'Earlier Claude 2 model', 
   ARRAY['multimodal', 'earlier'], 'common'),
   
  ('Claude Instant', 'Anthropic', 'Anthropic', 'claude-instant-v1', 'Proprietary', 100000,
   0.80, 2.40, 1.20, 63.9, 0.54, 23, 'lightweight', 'Fast Claude for quick tasks', 
   ARRAY['lightweight', 'quick'], 'common');

-- Insert DeepSeek Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('DeepSeek R1 0528 (May 25)', 'DeepSeek', 'DeepSeek', 'deepseek-r1-0528', 'Open', 164000,
   0.50, 2.18, 0.92, 40.4, 0.32, 68, 'reasoning', 'Latest DeepSeek reasoning model with enhanced capabilities', 
   ARRAY['reasoning', 'open-source', 'latest'], 'epic'),
   
  ('DeepSeek R1 (Jan 25)', 'DeepSeek', 'DeepSeek', 'deepseek-r1-671b', 'Open', 164000,
   0.54, 2.18, 0.95, 38.5, 0.36, 60, 'reasoning', 'Advanced open-source reasoning model', 
   ARRAY['reasoning', 'open-source'], 'epic'),
   
  ('DeepSeek V3 0324 (Mar 25)', 'DeepSeek', 'DeepSeek', 'deepseek-v3-0324', 'Open', 164000,
   0.34, 0.88, 0.47, 33.0, 0.59, 53, 'multimodal', 'Enhanced DeepSeek V3 with improved performance', 
   ARRAY['multimodal', 'open-source', 'enhanced'], 'rare'),
   
  ('DeepSeek V3 (Dec 24)', 'DeepSeek', 'DeepSeek', 'deepseek-chat', 'Open', 128000,
   0.50, 1.50, 0.75, 30.4, 0.62, 46, 'multimodal', 'Latest generation DeepSeek model', 
   ARRAY['multimodal', 'open-source'], 'rare'),
   
  ('DeepSeek-V2.5', 'DeepSeek', 'DeepSeek', 'deepseek-v2-5', 'Open', 128000,
   0.40, 1.20, 0.60, 28.5, 0.65, 45, 'multimodal', 'Enhanced V2 series model', 
   ARRAY['multimodal', 'open-source'], 'rare'),
   
  ('DeepSeek-Coder-V2', 'DeepSeek', 'DeepSeek', 'deepseek-coder-v2', 'Open', 128000,
   0.35, 1.00, 0.50, 32.1, 0.58, 42, 'coding', 'Specialized coding model', 
   ARRAY['coding', 'programming', 'open-source'], 'rare'),
   
  ('DeepSeek LLM 67B Chat', 'DeepSeek', 'DeepSeek', 'deepseek-llm-67b-chat', 'Open', 4000,
   0.30, 0.90, 0.45, 28.9, 0.70, 38, 'multimodal', 'Large parameter chat model', 
   ARRAY['multimodal', 'chat', 'open-source'], 'common'),
   
  ('DeepSeek R1 Distill Qwen 32B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-distill-qwen-32b', 'Open', 128000,
   0.07, 0.15, 0.09, 46.9, 0.32, 52, 'reasoning', 'Distilled reasoning model based on Qwen', 
   ARRAY['reasoning', 'distilled', 'efficient'], 'rare'),
   
  ('DeepSeek R1 Distill Qwen 14B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-distill-qwen-14b', 'Open', 128000,
   0.20, 0.20, 0.20, 83.3, 0.64, 49, 'reasoning', 'Medium-sized distilled reasoning model', 
   ARRAY['reasoning', 'distilled'], 'common'),
   
  ('DeepSeek R1 Distill Llama 70B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-distill-llama-70b', 'Open', 128000,
   0.10, 0.40, 0.17, 31.8, 0.61, 48, 'reasoning', 'Large distilled model based on Llama', 
   ARRAY['reasoning', 'distilled', 'large'], 'rare'),
   
  ('DeepSeek R1 Distill Llama 8B', 'DeepSeek', 'DeepSeek', 'deepseek-r1-distill-llama-8b', 'Open', 32000,
   0.04, 0.04, 0.04, 56.3, 0.74, 34, 'lightweight', 'Compact distilled reasoning model', 
   ARRAY['reasoning', 'distilled', 'compact'], 'common');

-- Insert Meta Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('Llama 4 Maverick', 'Meta', 'Meta', 'llama-4-maverick-17b-128e-instruct', 'Open', 1000000,
   0.22, 0.88, 0.39, 172.1, 0.44, 51, 'multimodal', 'Next-generation Llama model with enhanced capabilities', 
   ARRAY['multimodal', 'open-source', 'next-gen'], 'epic'),
   
  ('Llama 4 Scout', 'Meta', 'Meta', 'llama-4-scout-17b-16e-instruct', 'Open', 1000000,
   0.08, 0.30, 0.14, 117.1, 0.25, 43, 'multimodal', 'Lightweight Llama 4 for efficient inference', 
   ARRAY['multimodal', 'open-source', 'efficient'], 'rare'),
   
  ('Llama 3.3 70B', 'Meta', 'Meta', 'llama-3.3-70b-instruct', 'Open', 128000,
   0.23, 0.40, 0.27, 37.7, 0.30, 41, 'multimodal', 'Enhanced Llama 3 with improved performance', 
   ARRAY['multimodal', 'open-source', 'enhanced'], 'rare'),
   
  ('Llama 3.1 405B', 'Meta', 'Meta', 'meta-llama-3.1-405b-instruct', 'Open', 128000,
   0.80, 0.80, 0.80, 32.5, 0.32, 40, 'multimodal', 'Massive Llama model with exceptional capabilities', 
   ARRAY['multimodal', 'open-source', 'massive'], 'epic'),
   
  ('Llama 3.1 70B', 'Meta', 'Meta', 'meta-llama-3.1-70b-instruct', 'Open', 128000,
   0.23, 0.40, 0.27, 32.3, 0.34, 35, 'multimodal', 'Large Llama model for complex tasks', 
   ARRAY['multimodal', 'open-source', 'large'], 'rare'),
   
  ('Llama 3.1 8B', 'Meta', 'Meta', 'meta-llama-3.1-8b-instruct', 'Open', 128000,
   0.03, 0.05, 0.04, 52.5, 0.24, 24, 'lightweight', 'Efficient Llama model for general use', 
   ARRAY['multimodal', 'open-source', 'efficient'], 'common'),
   
  ('Llama 3.2 90B (Vision)', 'Meta', 'Meta', 'llama-3.2-90b-vision-instruct', 'Open', 128000,
   0.35, 0.40, 0.36, 34.4, 0.30, 33, 'multimodal', 'Vision-capable Llama model', 
   ARRAY['multimodal', 'vision', 'open-source'], 'rare'),
   
  ('Llama 3.2 11B (Vision)', 'Meta', 'Meta', 'llama-3.2-11b-vision-instruct', 'Open', 128000,
   0.05, 0.05, 0.05, 53.3, 0.32, 30, 'multimodal', 'Medium-sized vision model', 
   ARRAY['multimodal', 'vision', 'open-source'], 'common'),
   
  ('Llama 3.2 3B', 'Meta', 'Meta', 'llama-3.2-3b-instruct', 'Open', 128000,
   0.00, 0.01, 0.00, 119.3, 0.19, 20, 'lightweight', 'Compact Llama model', 
   ARRAY['lightweight', 'open-source'], 'common'),
   
  ('Llama 3.2 1B', 'Meta', 'Meta', 'llama-3.2-1b-instruct', 'Open', 128000,
   0.10, 0.10, 0.10, 129.1, 0.45, 10, 'lightweight', 'Ultra-compact Llama model', 
   ARRAY['lightweight', 'open-source', 'ultra-compact'], 'common'),
   
  ('Llama 3 70B', 'Meta', 'Meta', 'meta-llama-3-70b-instruct', 'Open', 8000,
   0.30, 0.40, 0.33, 36.0, 0.45, 27, 'multimodal', 'Previous generation large Llama model', 
   ARRAY['multimodal', 'open-source', 'legacy'], 'common'),
   
  ('Llama 3 8B', 'Meta', 'Meta', 'meta-llama-3-8b-instruct', 'Open', 8000,
   0.03, 0.06, 0.04, 115.9, 0.23, 21, 'lightweight', 'Previous generation efficient model', 
   ARRAY['multimodal', 'open-source', 'legacy'], 'common'),
   
  ('Llama 2 Chat 70B', 'Meta', 'Meta', 'llama-2-70b-chat', 'Open', 4000,
   0.70, 0.90, 0.75, 25.8, 0.85, 18, 'multimodal', 'Earlier Llama 2 large model', 
   ARRAY['multimodal', 'open-source', 'legacy'], 'common'),
   
  ('Llama 2 Chat 7B', 'Meta', 'Meta', 'llama-2-7b-chat', 'Open', 4000,
   0.05, 0.25, 0.10, 132.9, 0.48, 8, 'lightweight', 'Early efficient Llama model', 
   ARRAY['lightweight', 'open-source', 'legacy'], 'common');

-- Insert xAI Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('Grok 3', 'xAI', 'xAI', 'grok-3-beta', 'Proprietary', 131000,
   3.00, 15.00, 6.00, 78.8, 0.52, 51, 'multimodal', 'Advanced Grok model with enhanced reasoning', 
   ARRAY['multimodal', 'reasoning', 'advanced'], 'epic'),
   
  ('Grok 3 mini Reasoning (high)', 'xAI', 'xAI', 'grok-3-mini-beta', 'Proprietary', 131000,
   0.30, 0.50, 0.35, 210.1, 0.46, 67, 'reasoning', 'High-performance mini reasoning model', 
   ARRAY['reasoning', 'high-performance', 'efficient'], 'epic'),
   
  ('Grok 3 mini Reasoning (low)', 'xAI', 'xAI', 'grok-3-mini-beta', 'Proprietary', 131000,
   0.30, 0.50, 0.35, 198.9, 0.41, 55, 'reasoning', 'Efficient reasoning model for cost optimization', 
   ARRAY['reasoning', 'cost-effective'], 'rare'),
   
  ('Grok Beta', 'xAI', 'xAI', 'grok-beta', 'Proprietary', 128000,
   5.00, 15.00, 7.50, 68.1, 0.40, 38, 'multimodal', 'Beta version of Grok with experimental features', 
   ARRAY['multimodal', 'beta', 'experimental'], 'rare'),
   
  ('Grok 2 (Dec 24)', 'xAI', 'xAI', 'grok-2-2024-12', 'Proprietary', 131000,
   4.00, 12.00, 6.00, 75.2, 0.45, 35, 'multimodal', 'Previous generation Grok model', 
   ARRAY['multimodal', 'previous-gen'], 'common');

-- Insert Alibaba Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('Qwen3 235B A22B (Reasoning)', 'Alibaba', 'Alibaba', 'qwen3-235b-a22b', 'Open', 128000,
   0.18, 0.85, 0.35, 61.5, 0.42, 62, 'reasoning', 'Massive Qwen model with advanced reasoning', 
   ARRAY['reasoning', 'open-source', 'massive'], 'epic'),
   
  ('Qwen3 32B (Reasoning)', 'Alibaba', 'Alibaba', 'qwen3-32b', 'Open', 128000,
   0.10, 0.50, 0.20, 50.6, 0.43, 59, 'reasoning', 'Large reasoning model from Qwen series', 
   ARRAY['reasoning', 'open-source'], 'epic'),
   
  ('QwQ-32B', 'Alibaba', 'Alibaba', 'qwq-32b', 'Open', 131000,
   0.07, 0.15, 0.09, 48.8, 0.28, 58, 'reasoning', 'Specialized reasoning model', 
   ARRAY['reasoning', 'specialized', 'open-source'], 'epic'),
   
  ('Qwen3 30B A3B (Reasoning)', 'Alibaba', 'Alibaba', 'qwen3-30b-a3b', 'Open', 131000,
   0.10, 0.50, 0.20, 142.8, 0.36, 56, 'reasoning', 'Enhanced 30B reasoning model', 
   ARRAY['reasoning', 'enhanced', 'open-source'], 'rare'),
   
  ('Qwen3 14B (Reasoning)', 'Alibaba', 'Alibaba', 'qwen3-14b', 'Open', 131000,
   0.08, 0.24, 0.12, 86.3, 0.48, 56, 'reasoning', 'Medium-sized reasoning model', 
   ARRAY['reasoning', 'medium-size', 'open-source'], 'rare'),
   
  ('Qwen3 8B (Reasoning)', 'Alibaba', 'Alibaba', 'qwen3-8b', 'Open', 131000,
   0.04, 0.14, 0.06, 53.6, 0.86, 51, 'reasoning', 'Efficient reasoning model', 
   ARRAY['reasoning', 'efficient', 'open-source'], 'rare'),
   
  ('Qwen3 4B (Reasoning)', 'Alibaba', 'Alibaba', 'qwen3-4b', 'Open', 131000,
   0.11, 1.26, 0.40, 70.7, 0.86, 47, 'reasoning', 'Compact reasoning model', 
   ARRAY['reasoning', 'compact', 'open-source'], 'common'),
   
  ('Qwen3 1.7B (Reasoning)', 'Alibaba', 'Alibaba', 'qwen3-1.7b', 'Open', 33000,
   0.11, 1.26, 0.40, 139.6, 1.08, 38, 'reasoning', 'Small reasoning model for edge deployment', 
   ARRAY['reasoning', 'edge', 'open-source'], 'common'),
   
  ('Qwen3 0.6B (Reasoning)', 'Alibaba', 'Alibaba', 'qwen3-0.6b', 'Open', 33000,
   0.11, 1.26, 0.40, 229.8, 1.01, 23, 'lightweight', 'Ultra-compact reasoning model', 
   ARRAY['reasoning', 'ultra-compact', 'open-source'], 'common'),
   
  ('Qwen2.5 Max', 'Alibaba', 'Alibaba', 'qwen-max-2025-01-25', 'Proprietary', 32000,
   1.60, 6.40, 2.80, 34.6, 1.39, 45, 'multimodal', 'Flagship Qwen 2.5 model', 
   ARRAY['multimodal', 'flagship'], 'rare'),
   
  ('Qwen2.5 72B', 'Alibaba', 'Alibaba', 'qwen2.5-72b-instruct', 'Open', 131000,
   0.12, 0.39, 0.19, 43.0, 0.30, 40, 'multimodal', 'Large Qwen 2.5 model', 
   ARRAY['multimodal', 'open-source'], 'rare'),
   
  ('Qwen2.5 32B', 'Alibaba', 'Alibaba', 'qwen2.5-32b-instruct', 'Open', 128000,
   0.06, 0.20, 0.10, 58.9, 0.55, 37, 'multimodal', 'Balanced Qwen 2.5 model', 
   ARRAY['multimodal', 'open-source'], 'common'),
   
  ('Qwen2.5 Coder 32B', 'Alibaba', 'Alibaba', 'qwen2.5-coder-32b-instruct', 'Open', 131000,
   0.06, 0.15, 0.08, 48.2, 0.53, 36, 'coding', 'Specialized coding model', 
   ARRAY['coding', 'programming', 'open-source'], 'rare'),
   
  ('Qwen2.5 Turbo', 'Alibaba', 'Alibaba', 'qwen-turbo', 'Proprietary', 1000000,
   0.05, 0.20, 0.09, 49.5, 1.17, 34, 'lightweight', 'Fast turbo model for quick inference', 
   ARRAY['fast-inference', 'efficiency'], 'common'),
   
  ('Qwen2 72B', 'Alibaba', 'Alibaba', 'qwen2-72b-instruct', 'Open', 131000,
   0.90, 0.90, 0.90, 31.0, 1.39, 33, 'multimodal', 'Previous generation large model', 
   ARRAY['multimodal', 'open-source', 'legacy'], 'common');

-- Insert Mistral Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('Magistral Medium', 'Mistral', 'Mistral', 'magistral-medium-2506', 'Proprietary', 41000,
   2.00, 5.00, 2.75, 95.0, 0.44, 56, 'multimodal', 'Premium Mistral model with enhanced capabilities', 
   ARRAY['multimodal', 'premium'], 'epic'),
   
  ('Magistral Small', 'Mistral', 'Mistral', 'magistral-small-2506', 'Open', 40000,
   0.50, 1.50, 0.75, 201.0, 0.31, 55, 'multimodal', 'Efficient premium Mistral model', 
   ARRAY['multimodal', 'efficient', 'open-source'], 'rare'),
   
  ('Mistral Medium 3', 'Mistral', 'Mistral', 'mistral-medium-2505', 'Proprietary', 128000,
   0.40, 2.00, 0.80, 62.4, 0.47, 49, 'multimodal', 'Latest medium-sized Mistral model', 
   ARRAY['multimodal', 'latest'], 'rare'),
   
  ('Mistral Small 3.2', 'Mistral', 'Mistral', 'mistral-small-2506', 'Open', 33000,
   0.10, 0.30, 0.15, 172.9, 0.33, 42, 'lightweight', 'Newest small Mistral model', 
   ARRAY['lightweight', 'open-source'], 'common'),
   
  ('Mistral Small 3.1', 'Mistral', 'Mistral', 'mistral-small-2503', 'Open', 128000,
   0.10, 0.30, 0.15, 176.8, 0.29, 35, 'lightweight', 'Enhanced small model', 
   ARRAY['lightweight', 'open-source'], 'common'),
   
  ('Mistral Small 3', 'Mistral', 'Mistral', 'mistral-small-2501', 'Open', 32000,
   0.10, 0.30, 0.15, 174.3, 0.30, 35, 'lightweight', 'Balanced small model', 
   ARRAY['lightweight', 'open-source'], 'common'),
   
  ('Mistral Large 2 (Nov 24)', 'Mistral', 'Mistral', 'mistral-large-2411', 'Open', 128000,
   2.00, 6.00, 3.00, 33.4, 0.52, 38, 'multimodal', 'Latest large Mistral model', 
   ARRAY['multimodal', 'open-source'], 'rare'),
   
  ('Mistral Large 2 (Jul 24)', 'Mistral', 'Mistral', 'mistral-large-2407', 'Open', 128000,
   2.00, 6.00, 3.00, 96.0, 0.46, 37, 'multimodal', 'Mid-year large model update', 
   ARRAY['multimodal', 'open-source'], 'rare'),
   
  ('Pixtral Large', 'Mistral', 'Mistral', 'pixtral-large-2411', 'Open', 128000,
   2.00, 6.00, 3.00, 92.4, 0.41, 37, 'multimodal', 'Large vision-capable model', 
   ARRAY['multimodal', 'vision', 'open-source'], 'rare'),
   
  ('Devstral', 'Mistral', 'Mistral', 'devstral-small-2505', 'Open', 256000,
   0.10, 0.30, 0.15, 143.5, 0.33, 34, 'coding', 'Specialized development model', 
   ARRAY['coding', 'development', 'open-source'], 'common'),
   
  ('Codestral (Jan 25)', 'Mistral', 'Mistral', 'codestral-2501', 'Proprietary', 256000,
   0.30, 0.90, 0.45, 178.5, 0.30, 28, 'coding', 'Latest coding-specialized model', 
   ARRAY['coding', 'programming'], 'common'),
   
  ('Mistral NeMo', 'Mistral', 'Mistral', 'open-mistral-nemo-2407', 'Open', 128000,
   0.15, 0.15, 0.15, 173.6, 0.29, 20, 'lightweight', 'Compact efficient model', 
   ARRAY['lightweight', 'open-source'], 'common'),
   
  ('Ministral 8B', 'Mistral', 'Mistral', 'ministral-8b-latest', 'Open', 128000,
   0.10, 0.10, 0.10, 204.9, 0.31, 22, 'lightweight', 'Small efficient model', 
   ARRAY['lightweight', 'open-source'], 'common'),
   
  ('Ministral 3B', 'Mistral', 'Mistral', 'ministral-3b-latest', 'Proprietary', 128000,
   0.04, 0.04, 0.04, 234.6, 0.30, 20, 'lightweight', 'Ultra-compact model', 
   ARRAY['lightweight', 'ultra-compact'], 'common'),
   
  ('Pixtral 12B', 'Mistral', 'Mistral', 'pixtral-12b-2409', 'Open', 128000,
   0.15, 0.15, 0.15, 99.9, 0.33, 23, 'multimodal', 'Vision-capable 12B model', 
   ARRAY['multimodal', 'vision', 'open-source'], 'common'),
   
  ('Mixtral 8x22B', 'Mistral', 'Mistral', 'open-mixtral-8x22b', 'Open', 65000,
   2.00, 6.00, 3.00, 43.7, 0.38, 26, 'multimodal', 'Large mixture of experts model', 
   ARRAY['multimodal', 'mixture-of-experts', 'open-source'], 'rare'),
   
  ('Mixtral 8x7B', 'Mistral', 'Mistral', 'mixtral-8x7b-instruct', 'Open', 33000,
   0.70, 0.70, 0.70, 77.4, 0.36, 17, 'multimodal', 'Efficient mixture of experts', 
   ARRAY['multimodal', 'mixture-of-experts', 'open-source'], 'common'),
   
  ('Mistral 7B', 'Mistral', 'Mistral', 'open-mistral-7b', 'Open', 8000,
   0.25, 0.25, 0.25, 123.0, 0.29, 10, 'lightweight', 'Original Mistral 7B model', 
   ARRAY['lightweight', 'open-source', 'original'], 'common');

-- Insert Amazon Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('Nova Premier', 'Amazon', 'Amazon', 'amazon.nova-premier-v1:0', 'Proprietary', 1000000,
   2.50, 12.50, 5.00, 83.2, 0.89, 43, 'multimodal', 'Premium Amazon Nova model', 
   ARRAY['multimodal', 'premium'], 'epic'),
   
  ('Nova Pro', 'Amazon', 'Amazon', 'amazon.nova-pro-v1:0', 'Proprietary', 300000,
   0.80, 3.20, 1.40, 113.2, 0.47, 37, 'multimodal', 'Professional Nova model', 
   ARRAY['multimodal', 'professional'], 'rare'),
   
  ('Nova Lite', 'Amazon', 'Amazon', 'amazon.nova-lite-v1:0', 'Proprietary', 300000,
   0.06, 0.24, 0.10, 224.5, 0.38, 33, 'lightweight', 'Lightweight Nova model', 
   ARRAY['lightweight', 'efficient'], 'common'),
   
  ('Nova Micro', 'Amazon', 'Amazon', 'amazon.nova-micro-v1:0', 'Proprietary', 130000,
   0.04, 0.14, 0.06, 367.4, 0.33, 28, 'lightweight', 'Ultra-compact Nova model', 
   ARRAY['lightweight', 'ultra-compact'], 'common');

-- Insert Microsoft Azure Models
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  ('Phi-4', 'Microsoft Azure', 'Microsoft', 'phi-4', 'Open', 16000,
   0.10, 0.30, 0.15, 107.4, 0.50, 40, 'lightweight', 'Latest Phi model with enhanced reasoning', 
   ARRAY['lightweight', 'reasoning', 'open-source'], 'rare'),
   
  ('Phi-4 Multimodal', 'Microsoft Azure', 'Microsoft', 'phi-4-multimodal-instruct', 'Open', 128000,
   0.00, 0.00, 0.00, 21.5, 0.35, 27, 'multimodal', 'Multimodal version of Phi-4', 
   ARRAY['multimodal', 'open-source'], 'common'),
   
  ('Phi-4 Mini', 'Microsoft Azure', 'Microsoft', 'phi-4-mini-instruct', 'Open', 128000,
   0.00, 0.00, 0.00, 30.4, 0.39, 26, 'lightweight', 'Compact Phi-4 model', 
   ARRAY['lightweight', 'open-source'], 'common'),
   
  ('Phi-3 Medium 14B', 'Microsoft Azure', 'Microsoft', 'phi-3-medium-128k-instruct', 'Open', 128000,
   0.17, 0.68, 0.30, 52.8, 0.44, 25, 'lightweight', 'Medium-sized Phi-3 model', 
   ARRAY['lightweight', 'open-source'], 'common');

-- Insert additional models from other providers
INSERT INTO llm_models (
  name, provider, creator, model_id, license, context_window,
  input_price, output_price, avg_price, output_speed, latency,
  quality_index, category, description, features, rarity
) VALUES 
  -- MiniMax Models
  ('MiniMax M1 80k', 'MiniMax', 'MiniMax', 'minimax-m1', 'Open', 1000000,
   0.40, 2.10, 0.82, 34.6, 0.98, 63, 'multimodal', 'Large context MiniMax model', 
   ARRAY['multimodal', 'long-context', 'open-source'], 'epic'),
   
  ('MiniMax M1 40k', 'MiniMax', 'MiniMax', 'minimax-m1', 'Open', 1000000,
   0.40, 2.10, 0.82, 33.4, 1.00, 61, 'multimodal', 'High-performance MiniMax model', 
   ARRAY['multimodal', 'open-source'], 'epic'),
   
  ('MiniMax-Text-01', 'MiniMax', 'MiniMax', 'minimax-text-01', 'Open', 1000000,
   0.20, 1.10, 0.42, 28.4, 0.99, 40, 'multimodal', 'Text-focused MiniMax model', 
   ARRAY['text-generation', 'open-source'], 'rare'),
   
  -- Upstage Models
  ('Solar Pro 2 (Reasoning)', 'Upstage', 'Upstage', 'solar-pro2-preview', 'Proprietary', 64000,
   0.00, 0.00, 0.00, 99.0, 2.10, 51, 'reasoning', 'Advanced reasoning Solar model', 
   ARRAY['reasoning', 'advanced'], 'rare'),
   
  ('Solar Pro 2', 'Upstage', 'Upstage', 'solar-pro2-preview', 'Proprietary', 64000,
   0.00, 0.00, 0.00, 108.0, 1.69, 45, 'multimodal', 'Professional Solar model', 
   ARRAY['multimodal', 'professional'], 'rare'),
   
  ('Solar Mini', 'Upstage', 'Upstage', 'solar-1-mini-chat', 'Open', 4000,
   0.15, 0.15, 0.15, 94.9, 1.08, 25, 'lightweight', 'Compact Solar model', 
   ARRAY['lightweight', 'open-source'], 'common'),
   
  -- NVIDIA Models
  ('Llama 3.1 Nemotron Ultra 253B', 'NVIDIA', 'NVIDIA', 'llama-3.1-nemotron-ultra-253b', 'Open', 131000,
   0.60, 1.80, 0.90, 41.8, 0.64, 61, 'multimodal', 'Ultra-large Nemotron model', 
   ARRAY['multimodal', 'ultra-large', 'open-source'], 'epic'),
   
  ('Llama 3.1 Nemotron 70B', 'NVIDIA', 'NVIDIA', 'llama-3.1-nemotron-70b-instruct', 'Open', 128000,
   0.12, 0.30, 0.17, 49.7, 0.24, 37, 'multimodal', 'Large Nemotron model', 
   ARRAY['multimodal', 'open-source'], 'rare'),
   
  -- Cohere Models
  ('Command A', 'Cohere', 'Cohere', 'command-a-03-2025', 'Open', 256000,
   2.50, 10.00, 4.38, 142.6, 0.22, 40, 'multimodal', 'Advanced Command model', 
   ARRAY['multimodal', 'open-source'], 'rare'),
   
  ('Command-R+', 'Cohere', 'Cohere', 'command-r-plus-08-2024', 'Open', 128000,
   2.50, 10.00, 4.38, 48.4, 0.27, 21, 'multimodal', 'Enhanced Command-R model', 
   ARRAY['multimodal', 'open-source'], 'common'),
   
  ('Command-R', 'Cohere', 'Cohere', 'command-r-08-2024', 'Open', 128000,
   0.15, 0.60, 0.26, 73.1, 0.19, 15, 'multimodal', 'Standard Command-R model', 
   ARRAY['multimodal', 'open-source'], 'common'),
   
  ('Aya Expanse 32B', 'Cohere', 'Cohere', 'c4ai-aya-expanse-32b', 'Open', 128000,
   0.50, 1.50, 0.75, 119.4, 0.17, 20, 'multimodal', 'Multilingual Aya model', 
   ARRAY['multimodal', 'multilingual', 'open-source'], 'common'),
   
  ('Aya Expanse 8B', 'Cohere', 'Cohere', 'c4ai-aya-expanse-8b', 'Open', 8000,
   0.50, 1.50, 0.75, 166.9, 0.14, 16, 'lightweight', 'Compact multilingual model', 
   ARRAY['lightweight', 'multilingual', 'open-source'], 'common'),
   
  -- Perplexity Models
  ('Sonar Pro', 'Perplexity', 'Perplexity', 'sonar-pro', 'Proprietary', 200000,
   3.00, 15.00, 6.00, 145.7, 1.98, 43, 'multimodal', 'Premium search-augmented model', 
   ARRAY['search-augmented', 'premium'], 'rare'),
   
  ('Sonar', 'Perplexity', 'Perplexity', 'sonar', 'Proprietary', 127000,
   1.00, 1.00, 1.00, 82.1, 1.89, 43, 'multimodal', 'Search-augmented reasoning model', 
   ARRAY['search-augmented', 'reasoning'], 'rare'),
   
  ('Sonar Reasoning', 'Perplexity', 'Perplexity', 'sonar-reasoning', 'Proprietary', 127000,
   1.00, 5.00, 2.00, 80.9, 1.96, 55, 'reasoning', 'Advanced reasoning with search', 
   ARRAY['reasoning', 'search-augmented'], 'epic'),
   
  -- AI21 Labs Models
  ('Jamba 1.6 Large', 'AI21 Labs', 'AI21', 'jamba-large', 'Open', 256000,
   2.00, 8.00, 3.50, 59.2, 0.77, 29, 'multimodal', 'Large Jamba model', 
   ARRAY['multimodal', 'open-source'], 'common'),
   
  ('Jamba 1.6 Mini', 'AI21 Labs', 'AI21', 'jamba-mini', 'Open', 256000,
   0.20, 0.40, 0.25, 195.4, 0.58, 18, 'lightweight', 'Compact Jamba model', 
   ARRAY['lightweight', 'open-source'], 'common'),
   
  -- Liquid AI Models
  ('LFM 40B', 'Liquid AI', 'Liquid AI', 'lfm-40b', 'Proprietary', 32000,
   0.15, 0.15, 0.15, 161.6, 0.15, 22, 'multimodal', 'Liquid foundation model', 
   ARRAY['multimodal', 'foundation'], 'common');

-- Update quality-based rarity assignments
UPDATE llm_models SET rarity = CASE
  WHEN quality_index >= 65 THEN 'legendary'
  WHEN quality_index >= 55 THEN 'epic'
  WHEN quality_index >= 35 THEN 'rare'
  ELSE 'common'
END
WHERE quality_index IS NOT NULL;

-- Assign categories based on model characteristics
UPDATE llm_models SET category = CASE
  WHEN name ILIKE '%reasoning%' OR name ILIKE '%r1%' OR name ILIKE '%o1%' OR name ILIKE '%o3%' OR name ILIKE '%qwq%' THEN 'reasoning'
  WHEN name ILIKE '%coder%' OR name ILIKE '%code%' OR name ILIKE '%devstral%' THEN 'coding'
  WHEN name ILIKE '%vision%' OR name ILIKE '%multimodal%' OR name ILIKE '%pixtral%' THEN 'multimodal'
  WHEN context_window <= 32000 OR output_price <= 0.50 OR name ILIKE '%mini%' OR name ILIKE '%micro%' OR name ILIKE '%lite%' OR name ILIKE '%nano%' THEN 'lightweight'
  WHEN avg_price <= 1.00 THEN 'budget'
  ELSE 'multimodal'
END;

-- Add enhanced features based on model names and capabilities
UPDATE llm_models SET features = CASE
  WHEN name ILIKE '%vision%' THEN features || ARRAY['vision']
  WHEN name ILIKE '%reasoning%' OR name ILIKE '%r1%' OR name ILIKE '%o1%' OR name ILIKE '%o3%' THEN features || ARRAY['advanced-reasoning']
  WHEN name ILIKE '%turbo%' OR name ILIKE '%fast%' THEN features || ARRAY['fast-inference']
  WHEN name ILIKE '%long%' OR context_window > 500000 THEN features || ARRAY['long-context']
  WHEN name ILIKE '%search%' OR provider = 'Perplexity' THEN features || ARRAY['search-augmented']
  WHEN license = 'Open' THEN features || ARRAY['open-source']
  ELSE features
END;