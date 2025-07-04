/*
  # Enhanced NPM Package Management Migration

  1. Performance Improvements
    - Add full-text search index for package names and descriptions
    - Add indexes for download trends and popularity ranking
    - Add index for maintenance scores

  2. Data Preparation
    - Clear existing data for fresh comprehensive import
    - Reset category package counts

  3. Infrastructure
    - Prepare database for large-scale package data (200+ packages)
    - Optimize for frequent updates and searches
*/

-- Clear existing data for fresh import
DELETE FROM npm_packages;

-- Add indexes for better performance with large dataset
CREATE INDEX IF NOT EXISTS idx_npm_packages_search_vector 
  ON npm_packages USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_npm_packages_download_trend 
  ON npm_packages (download_trend);

CREATE INDEX IF NOT EXISTS idx_npm_packages_popularity_rank 
  ON npm_packages (popularity_rank);

CREATE INDEX IF NOT EXISTS idx_npm_packages_maintenance_score 
  ON npm_packages (maintenance_score DESC);

-- Update category counts (will be updated after import)
UPDATE npm_categories SET package_count = 0;