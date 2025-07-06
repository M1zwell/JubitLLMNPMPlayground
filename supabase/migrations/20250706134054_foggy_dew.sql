-- Add web scraping support
-- Make sure npm-spider edge function has required data structure

-- Update category detection function to better handle npm website data
CREATE OR REPLACE FUNCTION categorize_npm_from_website(
  package_name text, 
  package_keywords text[], 
  package_description text
) RETURNS text[] AS $$
DECLARE
  categories text[] := '{}';
  name_lower text;
  desc_lower text;
  keywords_text text;
BEGIN
  -- Convert inputs to lowercase for case-insensitive matching
  name_lower := lower(package_name);
  desc_lower := lower(COALESCE(package_description, ''));
  keywords_text := lower(array_to_string(package_keywords, ' '));
  
  -- Always include all-packages category
  categories := array_append(categories, 'all-packages');
  
  -- Front-end detection
  IF keywords_text ~ 'react|vue|angular|frontend|front-end|ui|component|browser|dom' OR
     desc_lower ~ 'component|frontend|front-end|ui library' THEN
    categories := array_append(categories, 'front-end');
  END IF;
  
  -- Back-end detection
  IF keywords_text ~ 'express|server|backend|back-end|api|node' OR
     desc_lower ~ 'server|backend|back-end|api' THEN
    categories := array_append(categories, 'back-end');
  END IF;
  
  -- CLI tools detection
  IF keywords_text ~ 'cli|command|terminal|shell|console' OR
     desc_lower ~ 'command line|cli tool' THEN
    categories := array_append(categories, 'cli-tools');
  END IF;
  
  -- Documentation detection
  IF keywords_text ~ 'documentation|docs|jsdoc|doc|readme' OR
     desc_lower ~ 'documentation|docs generator' THEN
    categories := array_append(categories, 'documentation');
  END IF;
  
  -- CSS & Styling detection
  IF keywords_text ~ 'css|style|sass|less|styling|postcss|tailwind' OR
     desc_lower ~ 'css|stylesheet|styling' THEN
    categories := array_append(categories, 'css-styling');
  END IF;
  
  -- Frameworks detection
  IF keywords_text ~ 'framework|next|nuxt|gatsby|remix' OR
     desc_lower ~ 'framework|next.js|nuxt.js' THEN
    categories := array_append(categories, 'frameworks');
  END IF;
  
  -- Testing detection
  IF keywords_text ~ 'test|testing|jest|mocha|jasmine|assertion' OR
     desc_lower ~ 'testing|test runner|assertion' THEN
    categories := array_append(categories, 'testing');
  END IF;
  
  -- IoT detection
  IF keywords_text ~ 'iot|arduino|raspberry|hardware|sensor' OR
     desc_lower ~ 'iot|internet of things|hardware' THEN
    categories := array_append(categories, 'iot');
  END IF;
  
  -- Coverage detection
  IF keywords_text ~ 'coverage|codecov|istanbul|nyc' OR
     desc_lower ~ 'code coverage|test coverage' THEN
    categories := array_append(categories, 'coverage');
  END IF;
  
  -- Mobile detection
  IF keywords_text ~ 'mobile|react-native|ionic|cordova|ios|android' OR
     desc_lower ~ 'mobile|react native|ios|android' THEN
    categories := array_append(categories, 'mobile');
  END IF;
  
  -- Robotics detection
  IF keywords_text ~ 'robot|robotics|automation|johnny-five|firmata' OR
     desc_lower ~ 'robot|robotics|automation' THEN
    categories := array_append(categories, 'robotics');
  END IF;
  
  -- Math detection
  IF keywords_text ~ 'math|mathematics|calculation|numeric|statistics|algebra' OR
     desc_lower ~ 'math|mathematical|calculation' THEN
    categories := array_append(categories, 'math');
  END IF;
  
  RETURN categories;
END;
$$ LANGUAGE plpgsql;

-- Create indexes to speed up queries for scraped packages
CREATE INDEX IF NOT EXISTS idx_npm_packages_name ON npm_packages (name);
CREATE INDEX IF NOT EXISTS idx_npm_packages_weekly_downloads ON npm_packages (weekly_downloads DESC);

-- Add an additional policy for web scraping function
INSERT INTO npm_categories (name, slug, description, icon, is_featured)
SELECT * FROM (
  VALUES 
    ('Popular Packages', 'popular', 'Most downloaded npm packages', 'star', true)
) AS v(name, slug, description, icon, is_featured)
WHERE NOT EXISTS (
  SELECT 1 FROM npm_categories WHERE slug = 'popular'
);

-- Update npm_import_logs table to support web scraper
ALTER TABLE npm_import_logs ADD COLUMN IF NOT EXISTS scraper_source text;
ALTER TABLE npm_import_logs ADD COLUMN IF NOT EXISTS scraper_pages integer DEFAULT 0;

-- Set up additional metadata columns for better package info
ALTER TABLE npm_packages ADD COLUMN IF NOT EXISTS has_typescript boolean DEFAULT false;
ALTER TABLE npm_packages ADD COLUMN IF NOT EXISTS has_documentation boolean DEFAULT false;
ALTER TABLE npm_packages ADD COLUMN IF NOT EXISTS dependencies_list text[] DEFAULT '{}'::text[];