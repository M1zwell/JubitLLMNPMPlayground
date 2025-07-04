/*
  # LLM Models Database Schema

  1. New Tables
    - `llm_models` - Core model information
      - `id` (uuid, primary key)
      - `name` (text) - Model name
      - `provider` (text) - API provider 
      - `creator` (text) - Model creator/developer
      - `model_id` (text) - Internal model identifier
      - `license` (text) - License type (Open/Proprietary)
      - `context_window` (integer) - Context window size in tokens
      - `input_price` (decimal) - Input price per million tokens
      - `output_price` (decimal) - Output price per million tokens
      - `avg_price` (decimal) - Average price per million tokens
      - `output_speed` (decimal) - Output speed in tokens/second
      - `latency` (decimal) - Latency in seconds
      - `quality_index` (integer) - Quality index score
      - `category` (text) - Model category
      - `description` (text) - Model description
      - `features` (text[]) - Array of feature tags
      - `rarity` (text) - Rarity level
      - `last_updated` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
*/

-- Create the llm_models table
CREATE TABLE IF NOT EXISTS llm_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  creator text NOT NULL,
  model_id text NOT NULL,
  license text NOT NULL CHECK (license IN ('Open', 'Proprietary')),
  context_window integer NOT NULL,
  input_price decimal(10,4) NOT NULL DEFAULT 0,
  output_price decimal(10,4) NOT NULL DEFAULT 0,
  avg_price decimal(10,4) NOT NULL DEFAULT 0,
  output_speed decimal(10,2) NOT NULL DEFAULT 0,
  latency decimal(10,2) NOT NULL DEFAULT 0,
  quality_index integer,
  category text NOT NULL,
  description text,
  features text[] DEFAULT '{}',
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access for llm_models"
  ON llm_models
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_llm_models_provider ON llm_models(provider);
CREATE INDEX IF NOT EXISTS idx_llm_models_creator ON llm_models(creator);
CREATE INDEX IF NOT EXISTS idx_llm_models_category ON llm_models(category);
CREATE INDEX IF NOT EXISTS idx_llm_models_license ON llm_models(license);
CREATE INDEX IF NOT EXISTS idx_llm_models_quality_index ON llm_models(quality_index);
CREATE INDEX IF NOT EXISTS idx_llm_models_output_price ON llm_models(output_price);
CREATE INDEX IF NOT EXISTS idx_llm_models_rarity ON llm_models(rarity);