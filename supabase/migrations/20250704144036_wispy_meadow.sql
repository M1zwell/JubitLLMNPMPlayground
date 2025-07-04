/*
  # Enhanced NPM Package Database Structure
  
  1. Data Management
    - Clear existing package data for fresh import
    - Reset category counts
  
  2. Performance Indexes
    - Full-text search index for package discovery
    - Download trend indexing for sorting
    - Popularity and maintenance score indexes
  
  3. Preparation for Large Dataset
    - Structure ready for 200+ packages
    - Optimized for import operations
*/

-- Clear existing data for fresh import
DELETE FROM npm_packages;

-- Insert comprehensive package dataset (200+ packages)
-- This will be populated by the enhanced import function
-- The migration ensures proper structure for large-scale package data

-- Add indexes for better performance with large dataset
CREATE INDEX IF NOT EXISTS idx_npm_packages_search_vector ON npm_packages USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_npm_packages_download_trend ON npm_packages (download_trend);
CREATE INDEX IF NOT EXISTS idx_npm_packages_popularity_rank ON npm_packages (popularity_rank);
CREATE INDEX IF NOT EXISTS idx_npm_packages_maintenance_score ON npm_packages (maintenance_score DESC);

-- Update category counts (will be updated after import)
UPDATE npm_categories SET package_count = 0;