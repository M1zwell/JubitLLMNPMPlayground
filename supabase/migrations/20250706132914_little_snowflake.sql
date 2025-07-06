/*
  # Update npm_categories and add scraper support
  
  1. Create categories matching the npmjs.com homepage
    - Ensure all category slugs match our scraper
    - Set initial counts and relationships
  
  2. Add helper functions
    - Add category detection functions
    - Add update trigger for category counts
    
  3. Security
    - Enable RLS for related tables
    - Set up public read access
*/

-- Make sure the npm_categories table is empty before adding new categories
TRUNCATE npm_categories CASCADE;

-- Insert the predefined categories that match the npmjs.com homepage
INSERT INTO npm_categories (name, slug, description, icon, is_featured) VALUES
('All Packages', 'all-packages', 'All npm packages in the database', 'package', true),
('Front-end', 'front-end', 'Packages for building user interfaces and browser applications', 'globe', true),
('Back-end', 'back-end', 'Packages for server-side development and APIs', 'code', true),
('CLI Tools', 'cli-tools', 'Command line utilities and developer tools', 'terminal', true),
('Documentation', 'documentation', 'Tools for generating and managing documentation', 'book-open', true),
('CSS & Styling', 'css-styling', 'CSS processors, frameworks, and styling utilities', 'palette', true),
('Frameworks', 'frameworks', 'Full-featured frameworks for application development', 'zap', true),
('Testing', 'testing', 'Test runners, assertion libraries, and mocking tools', 'check-circle', true),
('IoT', 'iot', 'Internet of Things libraries and utilities', 'wifi', true),
('Coverage', 'coverage', 'Code coverage and quality reporting tools', 'bar-chart', true),
('Mobile', 'mobile', 'Libraries for mobile app development', 'smartphone', true),
('Robotics', 'robotics', 'Libraries for robotics and hardware control', 'cpu', true),
('Math', 'math', 'Mathematical libraries, calculators, and algorithms', 'calculator', true);

-- Create a function to update package counts in categories
CREATE OR REPLACE FUNCTION update_npm_category_counts() RETURNS TRIGGER AS $$
BEGIN
  -- Update counts for all categories
  UPDATE npm_categories 
  SET package_count = (
    SELECT COUNT(*) 
    FROM npm_packages, unnest(categories) category
    WHERE category = npm_categories.slug
  );
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update category counts whenever packages are added/removed
DROP TRIGGER IF EXISTS update_category_counts_trigger ON npm_packages;

CREATE TRIGGER update_category_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON npm_packages
FOR EACH STATEMENT
EXECUTE FUNCTION update_npm_category_counts();

-- Add helper function for keyword categorization
CREATE OR REPLACE FUNCTION categorize_package(
  package_name text, 
  package_keywords text[], 
  package_description text
) RETURNS text[] AS $$
DECLARE
  categories text[] := '{}';
  name_lower text;
  desc_lower text;
BEGIN
  -- Convert inputs to lowercase for case-insensitive matching
  name_lower := lower(package_name);
  desc_lower := lower(COALESCE(package_description, ''));
  
  -- Always include all-packages category
  categories := array_append(categories, 'all-packages');
  
  -- Front-end detection
  IF array_position(package_keywords, 'react') IS NOT NULL OR
     array_position(package_keywords, 'vue') IS NOT NULL OR
     array_position(package_keywords, 'angular') IS NOT NULL OR
     array_position(package_keywords, 'frontend') IS NOT NULL OR
     array_position(package_keywords, 'ui') IS NOT NULL OR
     array_position(package_keywords, 'dom') IS NOT NULL OR
     array_position(package_keywords, 'browser') IS NOT NULL OR
     position('component' in desc_lower) > 0 OR
     position('frontend' in desc_lower) > 0 OR
     position('ui library' in desc_lower) > 0 THEN
    categories := array_append(categories, 'front-end');
  END IF;
  
  -- Back-end detection
  IF array_position(package_keywords, 'express') IS NOT NULL OR
     array_position(package_keywords, 'server') IS NOT NULL OR
     array_position(package_keywords, 'node') IS NOT NULL OR
     array_position(package_keywords, 'api') IS NOT NULL OR
     array_position(package_keywords, 'backend') IS NOT NULL OR
     array_position(package_keywords, 'database') IS NOT NULL OR
     position('server' in desc_lower) > 0 OR
     position('backend' in desc_lower) > 0 OR
     position('api' in desc_lower) > 0 THEN
    categories := array_append(categories, 'back-end');
  END IF;
  
  -- CLI Tools detection
  IF array_position(package_keywords, 'cli') IS NOT NULL OR
     array_position(package_keywords, 'command') IS NOT NULL OR
     array_position(package_keywords, 'terminal') IS NOT NULL OR
     array_position(package_keywords, 'shell') IS NOT NULL OR
     array_position(package_keywords, 'console') IS NOT NULL OR
     position('command line' in desc_lower) > 0 OR
     position('cli tool' in desc_lower) > 0 THEN
    categories := array_append(categories, 'cli-tools');
  END IF;
  
  -- Documentation detection
  IF array_position(package_keywords, 'documentation') IS NOT NULL OR
     array_position(package_keywords, 'docs') IS NOT NULL OR
     array_position(package_keywords, 'jsdoc') IS NOT NULL OR
     array_position(package_keywords, 'readme') IS NOT NULL OR
     array_position(package_keywords, 'docgen') IS NOT NULL OR
     position('documentation' in desc_lower) > 0 OR
     position('docs generator' in desc_lower) > 0 THEN
    categories := array_append(categories, 'documentation');
  END IF;
  
  -- CSS & Styling detection
  IF array_position(package_keywords, 'css') IS NOT NULL OR
     array_position(package_keywords, 'sass') IS NOT NULL OR
     array_position(package_keywords, 'less') IS NOT NULL OR
     array_position(package_keywords, 'style') IS NOT NULL OR
     array_position(package_keywords, 'styling') IS NOT NULL OR
     array_position(package_keywords, 'postcss') IS NOT NULL OR
     position('css' in desc_lower) > 0 OR
     position('stylesheet' in desc_lower) > 0 OR
     position('styling' in desc_lower) > 0 THEN
    categories := array_append(categories, 'css-styling');
  END IF;
  
  -- Frameworks detection
  IF array_position(package_keywords, 'framework') IS NOT NULL OR
     array_position(package_keywords, 'next') IS NOT NULL OR
     array_position(package_keywords, 'nuxt') IS NOT NULL OR
     array_position(package_keywords, 'gatsby') IS NOT NULL OR
     array_position(package_keywords, 'remix') IS NOT NULL OR
     position('framework' in desc_lower) > 0 OR
     position(' next.js' in desc_lower) > 0 OR
     position(' nuxt.js' in desc_lower) > 0 THEN
    categories := array_append(categories, 'frameworks');
  END IF;
  
  -- Testing detection
  IF array_position(package_keywords, 'test') IS NOT NULL OR
     array_position(package_keywords, 'testing') IS NOT NULL OR
     array_position(package_keywords, 'jest') IS NOT NULL OR
     array_position(package_keywords, 'mocha') IS NOT NULL OR
     array_position(package_keywords, 'jasmine') IS NOT NULL OR
     array_position(package_keywords, 'assertion') IS NOT NULL OR
     position('testing' in desc_lower) > 0 OR
     position('test runner' in desc_lower) > 0 OR
     position('assertion' in desc_lower) > 0 THEN
    categories := array_append(categories, 'testing');
  END IF;
  
  -- IoT detection
  IF array_position(package_keywords, 'iot') IS NOT NULL OR
     array_position(package_keywords, 'internet of things') IS NOT NULL OR
     array_position(package_keywords, 'hardware') IS NOT NULL OR
     array_position(package_keywords, 'raspberry') IS NOT NULL OR
     array_position(package_keywords, 'arduino') IS NOT NULL OR
     array_position(package_keywords, 'sensor') IS NOT NULL OR
     position('iot' in desc_lower) > 0 OR
     position('internet of things' in desc_lower) > 0 OR
     position('hardware' in desc_lower) > 0 THEN
    categories := array_append(categories, 'iot');
  END IF;
  
  -- Coverage detection
  IF array_position(package_keywords, 'coverage') IS NOT NULL OR
     array_position(package_keywords, 'codecov') IS NOT NULL OR
     array_position(package_keywords, 'istanbul') IS NOT NULL OR
     array_position(package_keywords, 'nyc') IS NOT NULL OR
     position('code coverage' in desc_lower) > 0 OR
     position('test coverage' in desc_lower) > 0 THEN
    categories := array_append(categories, 'coverage');
  END IF;
  
  -- Mobile detection
  IF array_position(package_keywords, 'mobile') IS NOT NULL OR
     array_position(package_keywords, 'react-native') IS NOT NULL OR
     array_position(package_keywords, 'ionic') IS NOT NULL OR
     array_position(package_keywords, 'cordova') IS NOT NULL OR
     array_position(package_keywords, 'android') IS NOT NULL OR
     array_position(package_keywords, 'ios') IS NOT NULL OR
     position('mobile app' in desc_lower) > 0 OR
     position('react native' in desc_lower) > 0 OR
     position('ios' in desc_lower) > 0 OR
     position('android' in desc_lower) > 0 THEN
    categories := array_append(categories, 'mobile');
  END IF;
  
  -- Robotics detection
  IF array_position(package_keywords, 'robot') IS NOT NULL OR
     array_position(package_keywords, 'robotics') IS NOT NULL OR
     array_position(package_keywords, 'automation') IS NOT NULL OR
     array_position(package_keywords, 'johnny-five') IS NOT NULL OR
     array_position(package_keywords, 'firmata') IS NOT NULL OR
     position('robot' in desc_lower) > 0 OR
     position('robotics' in desc_lower) > 0 OR
     position('automation' in desc_lower) > 0 THEN
    categories := array_append(categories, 'robotics');
  END IF;
  
  -- Math detection
  IF array_position(package_keywords, 'math') IS NOT NULL OR
     array_position(package_keywords, 'mathematics') IS NOT NULL OR
     array_position(package_keywords, 'calculation') IS NOT NULL OR
     array_position(package_keywords, 'numeric') IS NOT NULL OR
     array_position(package_keywords, 'statistics') IS NOT NULL OR
     array_position(package_keywords, 'algebra') IS NOT NULL OR
     position('math' in desc_lower) > 0 OR
     position('mathematical' in desc_lower) > 0 OR
     position('calculation' in desc_lower) > 0 THEN
    categories := array_append(categories, 'math');
  END IF;
  
  RETURN categories;
END;
$$ LANGUAGE plpgsql;

-- Make sure RLS is enabled for npm-related tables
ALTER TABLE npm_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE npm_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE npm_import_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public read access for npm_packages" ON npm_packages;
DROP POLICY IF EXISTS "Public read access for npm_categories" ON npm_categories;
DROP POLICY IF EXISTS "Public read access for npm_import_logs" ON npm_import_logs;

-- Create policies for public read access
CREATE POLICY "Public read access for npm_packages"
  ON npm_packages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for npm_categories"
  ON npm_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for npm_import_logs"
  ON npm_import_logs FOR SELECT
  TO public
  USING (true);

-- Fix for npm search and filter
CREATE INDEX IF NOT EXISTS idx_npm_packages_categories
  ON npm_packages USING gin (categories);

-- Update existing packages to include all-packages category if they don't already have it
UPDATE npm_packages 
SET categories = array_append(categories, 'all-packages')
WHERE NOT ('all-packages' = ANY(categories));

-- Seed a few sample packages if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM npm_packages LIMIT 1) THEN
    INSERT INTO npm_packages (
      name, version, description, author,
      repository_url, npm_url, license, keywords, categories,
      weekly_downloads, github_stars, typescript_support,
      quality_score, download_trend
    ) VALUES 
      ('react', '18.2.0', 'React is a JavaScript library for building user interfaces.', 'Facebook',
       'https://github.com/facebook/react', 'https://www.npmjs.com/package/react', 'MIT', 
       ARRAY['react', 'javascript', 'library', 'ui'], 
       ARRAY['front-end', 'frameworks', 'all-packages'],
       15000000, 200000, true, 95, 'rising'),
       
      ('lodash', '4.17.21', 'A modern JavaScript utility library delivering modularity, performance & extras.', 'John-David Dalton',
       'https://github.com/lodash/lodash', 'https://www.npmjs.com/package/lodash', 'MIT',
       ARRAY['modules', 'utilities', 'library'], 
       ARRAY['all-packages'],
       20000000, 50000, false, 90, 'stable'),
       
      ('axios', '1.4.0', 'Promise based HTTP client for the browser and node.js', 'Matt Zabriskie',
       'https://github.com/axios/axios', 'https://www.npmjs.com/package/axios', 'MIT',
       ARRAY['http', 'ajax', 'request', 'client'], 
       ARRAY['all-packages', 'front-end', 'back-end'],
       18000000, 90000, true, 92, 'rising');
  END IF;
END $$;