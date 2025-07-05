/*
  # Add more LLM Models and NPM categories for demonstration

  1. New Data
    - Add sample LLM models if table is empty
    - Ensure all NPM categories are correctly mapped
  
  2. Function Updates
    - Improve category mapping logic
    
  3. Import Function
    - Add batch import support
*/

-- Make sure we have categories for all the requested types
INSERT INTO npm_categories (name, slug, description, icon, is_featured)
SELECT * FROM (
  VALUES 
    ('All Packages', 'all-packages', 'Complete package collection', 'package', true),
    ('Front-end', 'front-end', 'UI components and browser libraries', 'globe', true),
    ('Back-end', 'back-end', 'Server-side libraries and frameworks', 'code', true),
    ('CLI Tools', 'cli-tools', 'Command-line utilities and tools', 'terminal', true),
    ('Documentation', 'documentation', 'Documentation generators and tools', 'book-open', true),
    ('CSS & Styling', 'css-styling', 'CSS frameworks and styling utilities', 'palette', true),
    ('Frameworks', 'frameworks', 'Application frameworks', 'zap', true),
    ('Testing', 'testing', 'Testing utilities and frameworks', 'check-circle', true),
    ('IoT', 'iot', 'Internet of Things libraries', 'wifi', true),
    ('Coverage', 'coverage', 'Code coverage tools', 'bar-chart', true),
    ('Mobile', 'mobile', 'Mobile development libraries', 'smartphone', true),
    ('Robotics', 'robotics', 'Robotics and hardware control', 'cpu', true),
    ('Math', 'math', 'Mathematical libraries and utilities', 'calculator', true)
) AS new_categories(name, slug, description, icon, is_featured)
WHERE NOT EXISTS (
  SELECT 1 FROM npm_categories WHERE slug = new_categories.slug
);

-- Add some sample LLM models if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM llm_models LIMIT 1) THEN
    INSERT INTO llm_models (
      name, provider, creator, model_id, license, context_window,
      input_price, output_price, avg_price, output_speed, latency,
      quality_index, category, description, features, rarity
    ) VALUES
      ('GPT-4o', 'OpenAI', 'OpenAI', 'gpt-4o', 'Proprietary', 128000, 5.00, 15.00, 12.00, 83.4, 0.56, 69, 'reasoning', 'Advanced reasoning model with multimodal capabilities', ARRAY['text-generation', 'advanced-reasoning', 'multimodal'], 'legendary'),
      ('GPT-4o Mini', 'OpenAI', 'OpenAI', 'gpt-4o-mini', 'Proprietary', 128000, 0.15, 0.60, 0.48, 90.2, 0.31, 60, 'lightweight', 'Cost-efficient model with strong reasoning', ARRAY['text-generation', 'fast-inference'], 'epic'),
      ('Claude 3.5 Sonnet', 'Anthropic', 'Anthropic', 'claude-3-5-sonnet', 'Proprietary', 200000, 3.00, 15.00, 12.00, 79.6, 0.90, 68, 'reasoning', 'Balanced performance with exceptional reasoning', ARRAY['text-generation', 'advanced-reasoning', 'long-context'], 'legendary'),
      ('Claude 3.5 Haiku', 'Anthropic', 'Anthropic', 'claude-3-5-haiku', 'Proprietary', 200000, 0.25, 1.25, 1.00, 92.5, 0.25, 58, 'lightweight', 'Fast and efficient Claude model', ARRAY['text-generation', 'fast-inference'], 'epic'),
      ('DeepSeek Coder', 'DeepSeek', 'DeepSeek', 'deepseek-coder', 'Open', 32768, 0.13, 0.65, 0.52, 105.2, 0.88, 62, 'coding', 'Specialized for code generation and understanding', ARRAY['code-generation', 'debugging'], 'epic'),
      ('DeepSeek V3', 'DeepSeek', 'DeepSeek', 'deepseek-v3', 'Open', 131072, 0.30, 0.90, 0.75, 78.4, 1.20, 65, 'reasoning', 'Advanced Chinese-developed reasoning model', ARRAY['text-generation', 'advanced-reasoning'], 'legendary'),
      ('Gemini 1.5 Pro', 'Google', 'Google', 'gemini-1-5-pro', 'Proprietary', 1000000, 0.00175, 0.00175, 0.00175, 70.6, 1.35, 64, 'multimodal', 'Long-context multimodal model', ARRAY['text-generation', 'multimodal', 'long-context'], 'legendary'),
      ('Gemini 1.5 Flash', 'Google', 'Google', 'gemini-1-5-flash', 'Proprietary', 1000000, 0.00035, 0.00035, 0.00035, 120.3, 0.28, 55, 'lightweight', 'Fast multimodal processing', ARRAY['text-generation', 'multimodal', 'fast-inference'], 'epic'),
      ('Llama 3 70B', 'Meta', 'Meta', 'llama-3-70b', 'Open', 8192, 0.00, 0.00, 0.00, 56.8, 1.50, 63, 'reasoning', 'Open source reasoning model', ARRAY['text-generation', 'open-source'], 'epic'),
      ('Mistral Large', 'Mistral', 'Mistral AI', 'mistral-large', 'Proprietary', 32768, 2.70, 8.00, 6.68, 67.3, 0.95, 66, 'reasoning', 'Advanced reasoning from European AI lab', ARRAY['text-generation', 'advanced-reasoning'], 'legendary'),
      ('Mistral Small', 'Mistral', 'Mistral AI', 'mistral-small', 'Proprietary', 32768, 0.20, 0.60, 0.50, 92.7, 0.38, 54, 'lightweight', 'Cost-effective general purpose model', ARRAY['text-generation', 'fast-inference'], 'rare'),
      ('Yi 1.5 34B', 'Alibaba', 'Alibaba', 'yi-1-5-34b', 'Open', 4096, 0.00, 0.00, 0.00, 45.2, 1.75, 52, 'budget', 'Open source multilingual model', ARRAY['text-generation', 'open-source'], 'rare');
  END IF;
END $$;

-- Add popular packages with proper categorization
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM npm_packages WHERE name = 'react') THEN
    INSERT INTO npm_packages (
      name, version, description, author, homepage,
      repository_url, npm_url, license, keywords, categories,
      weekly_downloads, quality_score, github_stars, typescript_support, 
      download_trend, updated_at
    ) VALUES 
      ('react', '18.2.0', 'React is a JavaScript library for building user interfaces', 'Meta Open Source', 'https://reactjs.org',
       'https://github.com/facebook/react', 'https://www.npmjs.com/package/react', 'MIT', 
       ARRAY['react', 'frontend', 'ui', 'library'], 
       ARRAY['front-end', 'frameworks', 'all-packages'],
       18500000, 95, 221000, true, 'rising', NOW()),
       
      ('lodash', '4.17.21', 'Lodash modular utilities', 'John-David Dalton', 'https://lodash.com/',
       'https://github.com/lodash/lodash', 'https://www.npmjs.com/package/lodash', 'MIT', 
       ARRAY['modules', 'utility', 'performance', 'functional'], 
       ARRAY['all-packages'],
       22300000, 92, 57000, true, 'stable', NOW()),
       
      ('axios', '1.6.0', 'Promise based HTTP client for the browser and node.js', 'Matt Zabriskie', 'https://axios-http.com/',
       'https://github.com/axios/axios', 'https://www.npmjs.com/package/axios', 'MIT', 
       ARRAY['http', 'client', 'request', 'api', 'xhr'], 
       ARRAY['all-packages', 'back-end'],
       20100000, 90, 101000, true, 'rising', NOW()),
       
      ('tailwindcss', '3.3.5', 'A utility-first CSS framework for rapidly building custom user interfaces', 'Adam Wathan', 'https://tailwindcss.com',
       'https://github.com/tailwindlabs/tailwindcss', 'https://www.npmjs.com/package/tailwindcss', 'MIT', 
       ARRAY['css', 'styling', 'utility', 'framework'], 
       ARRAY['css-styling', 'front-end', 'all-packages'],
       4200000, 95, 74500, false, 'rising', NOW()),
       
      ('jest', '29.7.0', 'Delightful JavaScript Testing Framework', 'Meta Open Source', 'https://jestjs.io',
       'https://github.com/facebook/jest', 'https://www.npmjs.com/package/jest', 'MIT', 
       ARRAY['test', 'testing', 'javascript', 'framework'], 
       ARRAY['testing', 'coverage', 'all-packages'],
       12800000, 93, 42500, true, 'stable', NOW()),
       
      ('commander', '11.1.0', 'The complete solution for node.js command-line programs', 'TJ Holowaychuk', 'https://github.com/tj/commander.js',
       'https://github.com/tj/commander.js', 'https://www.npmjs.com/package/commander', 'MIT', 
       ARRAY['cli', 'command-line', 'option', 'parser'], 
       ARRAY['cli-tools', 'all-packages'],
       43500000, 88, 25000, true, 'stable', NOW()),
       
      ('jsdoc', '4.0.2', 'An API documentation generator for JavaScript', 'Michael Mathews', 'https://jsdoc.app',
       'https://github.com/jsdoc/jsdoc', 'https://www.npmjs.com/package/jsdoc', 'Apache-2.0', 
       ARRAY['documentation', 'doc', 'api', 'documentation-tool'], 
       ARRAY['documentation', 'all-packages'],
       3100000, 85, 14200, false, 'stable', NOW()),
       
      ('mathjs', '11.11.1', 'Math.js is an extensive math library for JavaScript and Node.js', 'Jos de Jong', 'https://mathjs.org',
       'https://github.com/josdejong/mathjs', 'https://www.npmjs.com/package/mathjs', 'Apache-2.0', 
       ARRAY['math', 'mathematics', 'algebra', 'parser'], 
       ARRAY['math', 'all-packages'],
       2600000, 89, 13000, true, 'rising', NOW()),
       
      ('express', '4.18.2', 'Fast, unopinionated, minimalist web framework', 'TJ Holowaychuk', 'https://expressjs.com',
       'https://github.com/expressjs/express', 'https://www.npmjs.com/package/express', 'MIT', 
       ARRAY['express', 'framework', 'web', 'server', 'rest', 'api'], 
       ARRAY['back-end', 'frameworks', 'all-packages'],
       21500000, 94, 62000, false, 'stable', NOW()),
       
      ('react-native', '0.72.6', 'A framework for building native apps using React', 'Meta Open Source', 'https://reactnative.dev/',
       'https://github.com/facebook/react-native', 'https://www.npmjs.com/package/react-native', 'MIT', 
       ARRAY['react', 'native', 'mobile', 'ios', 'android'], 
       ARRAY['mobile', 'frameworks', 'all-packages'],
       850000, 88, 112000, true, 'rising', NOW()),
       
      ('johnny-five', '2.1.0', 'JavaScript Robotics Programming Framework', 'Rick Waldron', 'http://johnny-five.io',
       'https://github.com/rwaldron/johnny-five', 'https://www.npmjs.com/package/johnny-five', 'MIT', 
       ARRAY['arduino', 'robotics', 'iot', 'robot', 'hardware'], 
       ARRAY['robotics', 'iot', 'all-packages'],
       27000, 85, 7200, false, 'stable', NOW()),
       
      ('istanbul', '0.4.5', 'Yet another JS code coverage tool that computes statement, line, function and branch coverage', 'Krishnan Anantheswaran', null,
       'https://github.com/gotwarlost/istanbul', 'https://www.npmjs.com/package/istanbul', 'BSD-3-Clause', 
       ARRAY['test', 'coverage', 'code-coverage'], 
       ARRAY['coverage', 'testing', 'all-packages'],
       1400000, 82, 5700, false, 'stable', NOW());
  END IF;
END $$;

-- Update the categorization function if necessary
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