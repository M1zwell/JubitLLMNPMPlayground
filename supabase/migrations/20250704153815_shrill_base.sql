/*
  # Create workflow analyses table

  1. New Tables
    - `workflow_analyses`
      - `id` (uuid, primary key)
      - `analysis_id` (text, unique identifier for analysis)
      - `workflow_data` (jsonb, stores the workflow configuration)
      - `analysis_report` (jsonb, stores the complete analysis report)
      - `performance_score` (integer, performance score 0-100)
      - `cost_efficiency` (integer, cost efficiency score 0-100)
      - `complexity` (text, workflow complexity level)
      - `recommendations_count` (integer, number of recommendations)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `workflow_analyses` table
    - Add policy for public read access to analyses
    - Add policy for public insert access for new analyses
*/

CREATE TABLE IF NOT EXISTS workflow_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id text UNIQUE NOT NULL,
  workflow_data jsonb NOT NULL,
  analysis_report jsonb NOT NULL,
  performance_score integer CHECK (performance_score >= 0 AND performance_score <= 100),
  cost_efficiency integer CHECK (cost_efficiency >= 0 AND cost_efficiency <= 100),
  complexity text CHECK (complexity IN ('Simple', 'Moderate', 'Complex')),
  recommendations_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE workflow_analyses ENABLE ROW LEVEL SECURITY;

-- Allow public read access to workflow analyses
CREATE POLICY "Public read access for workflow_analyses"
  ON workflow_analyses
  FOR SELECT
  TO public
  USING (true);

-- Allow public insert access for new analyses
CREATE POLICY "Public insert access for workflow_analyses"
  ON workflow_analyses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public update access for existing analyses
CREATE POLICY "Public update access for workflow_analyses"
  ON workflow_analyses
  FOR UPDATE
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflow_analyses_analysis_id ON workflow_analyses(analysis_id);
CREATE INDEX IF NOT EXISTS idx_workflow_analyses_performance_score ON workflow_analyses(performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_analyses_cost_efficiency ON workflow_analyses(cost_efficiency DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_analyses_complexity ON workflow_analyses(complexity);
CREATE INDEX IF NOT EXISTS idx_workflow_analyses_created_at ON workflow_analyses(created_at DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at field
CREATE TRIGGER workflow_analyses_updated_at
  BEFORE UPDATE ON workflow_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_analyses_updated_at();