/*
  # LLM Update Logs Table

  1. New Tables
    - `llm_update_logs`
      - `id` (uuid, primary key)
      - `update_type` (text) - manual, automatic, scheduled
      - `status` (text) - in_progress, success, error
      - `models_processed` (integer)
      - `models_added` (integer)
      - `models_updated` (integer)
      - `providers_updated` (text array)
      - `error_message` (text, nullable)
      - `started_at` (timestamp)
      - `completed_at` (timestamp, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `llm_update_logs` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS llm_update_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_type text NOT NULL CHECK (update_type IN ('manual', 'automatic', 'scheduled')),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'success', 'error')),
  models_processed integer DEFAULT 0,
  models_added integer DEFAULT 0,
  models_updated integer DEFAULT 0,
  providers_updated text[] DEFAULT '{}',
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE llm_update_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for llm_update_logs"
  ON llm_update_logs
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_llm_update_logs_status ON llm_update_logs(status);
CREATE INDEX IF NOT EXISTS idx_llm_update_logs_started_at ON llm_update_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_update_logs_update_type ON llm_update_logs(update_type);

-- Add last_updated column to llm_models if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'llm_models' AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE llm_models ADD COLUMN last_updated timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index on last_updated for efficient queries
CREATE INDEX IF NOT EXISTS idx_llm_models_last_updated ON llm_models(last_updated DESC);