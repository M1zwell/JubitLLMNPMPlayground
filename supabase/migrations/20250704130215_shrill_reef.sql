/*
  # NPM Package Database Schema

  1. New Tables
    - `npm_packages`
      - `id` (uuid, primary key)
      - `name` (text, unique package name)
      - `version` (text, latest version)
      - `description` (text, package description)
      - `author` (text, package author/maintainer)
      - `homepage` (text, package homepage URL)
      - `repository_url` (text, GitHub/GitLab repository)
      - `npm_url` (text, NPM package page URL)
      - `license` (text, package license)
      - `keywords` (text[], package keywords/tags)
      - `categories` (text[], categorization)
      - `weekly_downloads` (bigint, downloads last week)
      - `monthly_downloads` (bigint, downloads last month)
      - `total_downloads` (bigint, total downloads)
      - `file_size` (integer, package size in bytes)
      - `dependencies_count` (integer, number of dependencies)
      - `dev_dependencies_count` (integer, number of dev dependencies)
      - `last_published` (timestamptz, last publication date)
      - `created_at` (timestamptz, package creation date)
      - `quality_score` (numeric, calculated quality score)
      - `popularity_rank` (integer, popularity ranking)
      - `maintenance_score` (numeric, maintenance quality score)
      - `vulnerability_count` (integer, known vulnerabilities)
      - `bundle_size` (integer, minified bundle size)
      - `tree_shaking` (boolean, supports tree shaking)
      - `typescript_support` (boolean, has TypeScript definitions)
      - `is_deprecated` (boolean, package deprecation status)
      - `download_trend` (text, trending direction)
      - `github_stars` (integer, GitHub stars)
      - `github_forks` (integer, GitHub forks)
      - `github_issues` (integer, open GitHub issues)
      - `last_commit` (timestamptz, last commit date)
      - `documentation_url` (text, documentation link)
      - `demo_url` (text, demo/example URL)
      - `cdn_url` (text, CDN link for browser usage)
      - `updated_at` (timestamptz, last data update)

    - `npm_categories`
      - `id` (uuid, primary key)
      - `name` (text, category name)
      - `slug` (text, URL-friendly slug)
      - `description` (text, category description)
      - `icon` (text, icon identifier)
      - `parent_id` (uuid, for subcategories)
      - `package_count` (integer, number of packages)
      - `is_featured` (boolean, featured category)

    - `npm_import_logs`
      - `id` (uuid, primary key)
      - `import_type` (text, manual/automatic)
      - `status` (text, success/error/in_progress)
      - `packages_processed` (integer, number of packages)
      - `packages_added` (integer, new packages added)
      - `packages_updated` (integer, existing packages updated)
      - `error_message` (text, error details if any)
      - `import_source` (text, data source)
      - `started_at` (timestamptz, import start time)
      - `completed_at` (timestamptz, import completion time)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for admin write access

  3. Indexes
    - Performance indexes on frequently queried columns
    - Full-text search indexes on name and description
    - Category and keyword indexes
*/

-- Create npm_packages table
CREATE TABLE IF NOT EXISTS npm_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  description text,
  author text,
  homepage text,
  repository_url text,
  npm_url text,
  license text,
  keywords text[] DEFAULT '{}',
  categories text[] DEFAULT '{}',
  weekly_downloads bigint DEFAULT 0,
  monthly_downloads bigint DEFAULT 0,
  total_downloads bigint DEFAULT 0,
  file_size integer DEFAULT 0,
  dependencies_count integer DEFAULT 0,
  dev_dependencies_count integer DEFAULT 0,
  last_published timestamptz,
  created_at timestamptz DEFAULT now(),
  quality_score numeric(5,2) DEFAULT 0,
  popularity_rank integer,
  maintenance_score numeric(5,2) DEFAULT 0,
  vulnerability_count integer DEFAULT 0,
  bundle_size integer DEFAULT 0,
  tree_shaking boolean DEFAULT false,
  typescript_support boolean DEFAULT false,
  is_deprecated boolean DEFAULT false,
  download_trend text DEFAULT 'stable',
  github_stars integer DEFAULT 0,
  github_forks integer DEFAULT 0,
  github_issues integer DEFAULT 0,
  last_commit timestamptz,
  documentation_url text,
  demo_url text,
  cdn_url text,
  updated_at timestamptz DEFAULT now()
);

-- Create npm_categories table
CREATE TABLE IF NOT EXISTS npm_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT 'package',
  parent_id uuid REFERENCES npm_categories(id),
  package_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create npm_import_logs table
CREATE TABLE IF NOT EXISTS npm_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type text NOT NULL CHECK (import_type IN ('manual', 'automatic', 'scheduled')),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'success', 'error', 'cancelled')),
  packages_processed integer DEFAULT 0,
  packages_added integer DEFAULT 0,
  packages_updated integer DEFAULT 0,
  error_message text,
  import_source text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE npm_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE npm_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE npm_import_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public read access for npm_packages"
  ON npm_packages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for npm_categories"
  ON npm_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public read access for npm_import_logs"
  ON npm_import_logs
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_npm_packages_name ON npm_packages USING btree (name);
CREATE INDEX IF NOT EXISTS idx_npm_packages_categories ON npm_packages USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_npm_packages_keywords ON npm_packages USING gin (keywords);
CREATE INDEX IF NOT EXISTS idx_npm_packages_weekly_downloads ON npm_packages USING btree (weekly_downloads DESC);
CREATE INDEX IF NOT EXISTS idx_npm_packages_monthly_downloads ON npm_packages USING btree (monthly_downloads DESC);
CREATE INDEX IF NOT EXISTS idx_npm_packages_quality_score ON npm_packages USING btree (quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_npm_packages_popularity_rank ON npm_packages USING btree (popularity_rank);
CREATE INDEX IF NOT EXISTS idx_npm_packages_last_published ON npm_packages USING btree (last_published DESC);
CREATE INDEX IF NOT EXISTS idx_npm_packages_github_stars ON npm_packages USING btree (github_stars DESC);
CREATE INDEX IF NOT EXISTS idx_npm_packages_typescript_support ON npm_packages USING btree (typescript_support);
CREATE INDEX IF NOT EXISTS idx_npm_packages_license ON npm_packages USING btree (license);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_npm_packages_search ON npm_packages USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Category indexes
CREATE INDEX IF NOT EXISTS idx_npm_categories_slug ON npm_categories USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_npm_categories_featured ON npm_categories USING btree (is_featured);

-- Insert default categories
INSERT INTO npm_categories (name, slug, description, icon, is_featured) VALUES
  ('Front-end', 'frontend', 'Client-side frameworks, UI components, and browser tools', 'monitor', true),
  ('Back-end', 'backend', 'Server-side frameworks, APIs, and backend services', 'server', true),
  ('CLI', 'cli', 'Command-line tools and utilities', 'terminal', true),
  ('Documentation', 'documentation', 'Documentation generators and tools', 'book', true),
  ('CSS', 'css', 'Stylesheets, CSS frameworks, and styling tools', 'palette', true),
  ('Testing', 'testing', 'Testing frameworks, runners, and utilities', 'check-circle', true),
  ('IoT', 'iot', 'Internet of Things and embedded systems', 'wifi', false),
  ('Coverage', 'coverage', 'Code coverage and analysis tools', 'pie-chart', false),
  ('Mobile', 'mobile', 'Mobile development frameworks and tools', 'smartphone', true),
  ('Frameworks', 'frameworks', 'Full-stack and application frameworks', 'layers', true),
  ('Robotics', 'robotics', 'Robotics and automation libraries', 'cpu', false),
  ('Math', 'math', 'Mathematical libraries and computational tools', 'calculator', false),
  ('Utility', 'utility', 'General purpose utilities and helper functions', 'tool', true),
  ('Database', 'database', 'Database drivers, ORMs, and data tools', 'database', true),
  ('Security', 'security', 'Security tools and cryptography libraries', 'shield', true),
  ('Build Tools', 'build-tools', 'Build systems, bundlers, and development tools', 'settings', true),
  ('Animation', 'animation', 'Animation libraries and motion graphics', 'zap', false),
  ('Charts', 'charts', 'Data visualization and charting libraries', 'bar-chart', false),
  ('Forms', 'forms', 'Form handling and validation libraries', 'edit', false),
  ('Date & Time', 'datetime', 'Date manipulation and time utilities', 'calendar', false),
  ('Networking', 'networking', 'HTTP clients, WebSocket, and networking tools', 'globe', false),
  ('File System', 'filesystem', 'File manipulation and system utilities', 'folder', false),
  ('Parsing', 'parsing', 'Parsers, compilers, and data transformation', 'code', false),
  ('State Management', 'state-management', 'Application state and data flow libraries', 'git-branch', false),
  ('Performance', 'performance', 'Performance monitoring and optimization tools', 'trending-up', false);

-- Insert popular packages
INSERT INTO npm_packages (
  name, description, author, license, categories, keywords, 
  weekly_downloads, monthly_downloads, quality_score, github_stars,
  typescript_support, homepage, repository_url, npm_url
) VALUES
  (
    'react',
    'React is a JavaScript library for creating user interfaces',
    'React Team',
    'MIT',
    ARRAY['frontend', 'frameworks'],
    ARRAY['react', 'ui', 'frontend', 'library', 'component'],
    21000000,
    84000000,
    95.5,
    228000,
    true,
    'https://react.dev',
    'https://github.com/facebook/react',
    'https://www.npmjs.com/package/react'
  ),
  (
    'react-dom',
    'React package for working with the DOM',
    'React Team',
    'MIT',
    ARRAY['frontend', 'frameworks'],
    ARRAY['react', 'dom', 'frontend', 'rendering'],
    20800000,
    83200000,
    94.8,
    228000,
    true,
    'https://react.dev',
    'https://github.com/facebook/react',
    'https://www.npmjs.com/package/react-dom'
  ),
  (
    'lodash',
    'A modern JavaScript utility library delivering modularity, performance, & extras',
    'John-David Dalton',
    'MIT',
    ARRAY['utility'],
    ARRAY['lodash', 'utility', 'functional', 'modules'],
    19500000,
    78000000,
    89.2,
    59100,
    true,
    'https://lodash.com',
    'https://github.com/lodash/lodash',
    'https://www.npmjs.com/package/lodash'
  ),
  (
    'axios',
    'Promise based HTTP client for the browser and node.js',
    'Matt Zabriskie',
    'MIT',
    ARRAY['networking', 'backend', 'frontend'],
    ARRAY['http', 'promise', 'request', 'client', 'ajax'],
    16200000,
    64800000,
    88.7,
    105000,
    true,
    'https://axios-http.com',
    'https://github.com/axios/axios',
    'https://www.npmjs.com/package/axios'
  ),
  (
    'tslib',
    'Runtime library for TypeScript helper functions',
    'Microsoft',
    'Apache-2.0',
    ARRAY['utility', 'build-tools'],
    ARRAY['typescript', 'runtime', 'helpers'],
    25000000,
    100000000,
    92.1,
    4200,
    true,
    'https://www.typescriptlang.org',
    'https://github.com/Microsoft/tslib',
    'https://www.npmjs.com/package/tslib'
  ),
  (
    'chalk',
    'Terminal string styling done right',
    'Sindre Sorhus',
    'MIT',
    ARRAY['cli', 'utility'],
    ARRAY['color', 'colour', 'colors', 'terminal', 'console', 'cli'],
    12800000,
    51200000,
    91.3,
    21800,
    true,
    'https://github.com/chalk/chalk',
    'https://github.com/chalk/chalk',
    'https://www.npmjs.com/package/chalk'
  ),
  (
    'next',
    'The React Framework for Production',
    'Vercel',
    'MIT',
    ARRAY['frontend', 'frameworks', 'backend'],
    ARRAY['react', 'framework', 'ssr', 'static', 'jamstack'],
    6200000,
    24800000,
    94.7,
    125000,
    true,
    'https://nextjs.org',
    'https://github.com/vercel/next.js',
    'https://www.npmjs.com/package/next'
  ),
  (
    'commander',
    'The complete solution for node.js command-line programs',
    'TJ Holowaychuk',
    'MIT',
    ARRAY['cli'],
    ARRAY['command', 'option', 'parser', 'cli', 'console'],
    8900000,
    35600000,
    87.9,
    26600,
    true,
    'https://github.com/tj/commander.js',
    'https://github.com/tj/commander.js',
    'https://www.npmjs.com/package/commander'
  ),
  (
    'inquirer',
    'A collection of common interactive command line user interfaces',
    'Simon Boudrias',
    'MIT',
    ARRAY['cli'],
    ARRAY['cli', 'prompt', 'stdin', 'interactive', 'command'],
    3200000,
    12800000,
    85.4,
    19900,
    true,
    'https://github.com/SBoudrias/Inquirer.js',
    'https://github.com/SBoudrias/Inquirer.js',
    'https://www.npmjs.com/package/inquirer'
  ),
  (
    'express',
    'Fast, unopinionated, minimalist web framework for node.js',
    'TJ Holowaychuk',
    'MIT',
    ARRAY['backend', 'frameworks'],
    ARRAY['express', 'framework', 'sinatra', 'web', 'rest', 'restful', 'router', 'app', 'api'],
    18900000,
    75600000,
    92.8,
    65000,
    true,
    'https://expressjs.com',
    'https://github.com/expressjs/express',
    'https://www.npmjs.com/package/express'
  ),
  (
    'vue',
    'The Progressive JavaScript Framework',
    'Evan You',
    'MIT',
    ARRAY['frontend', 'frameworks'],
    ARRAY['vue', 'framework', 'frontend', 'reactive', 'component'],
    4100000,
    16400000,
    94.2,
    207000,
    true,
    'https://vuejs.org',
    'https://github.com/vuejs/core',
    'https://www.npmjs.com/package/vue'
  ),
  (
    'typescript',
    'TypeScript is a language for application scale JavaScript development',
    'Microsoft',
    'Apache-2.0',
    ARRAY['build-tools', 'utility'],
    ARRAY['typescript', 'language', 'compiler'],
    7800000,
    31200000,
    96.1,
    100000,
    true,
    'https://www.typescriptlang.org',
    'https://github.com/Microsoft/TypeScript',
    'https://www.npmjs.com/package/typescript'
  ),
  (
    'webpack',
    'Packs CommonJs/AMD modules for the browser',
    'Tobias Koppers',
    'MIT',
    ARRAY['build-tools'],
    ARRAY['webpack', 'browser', 'web', 'bundler', 'module', 'modules', 'tool'],
    5600000,
    22400000,
    88.9,
    64500,
    true,
    'https://webpack.js.org',
    'https://github.com/webpack/webpack',
    'https://www.npmjs.com/package/webpack'
  ),
  (
    'eslint',
    'An AST-based pattern checker for JavaScript',
    'Nicholas C. Zakas',
    'MIT',
    ARRAY['build-tools', 'utility'],
    ARRAY['eslint', 'lint', 'linter', 'jshint', 'jslint', 'es6', 'es2015'],
    9200000,
    36800000,
    93.4,
    24900,
    true,
    'https://eslint.org',
    'https://github.com/eslint/eslint',
    'https://www.npmjs.com/package/eslint'
  ),
  (
    'prettier',
    'Prettier is an opinionated code formatter',
    'James Long',
    'MIT',
    ARRAY['build-tools', 'utility'],
    ARRAY['prettier', 'formatter', 'format', 'code'],
    8700000,
    34800000,
    91.7,
    49000,
    true,
    'https://prettier.io',
    'https://github.com/prettier/prettier',
    'https://www.npmjs.com/package/prettier'
  ),
  (
    'jest',
    'Delightful JavaScript Testing Framework with a focus on simplicity',
    'Meta',
    'MIT',
    ARRAY['testing'],
    ARRAY['jest', 'immersive', 'javascript', 'testing'],
    6800000,
    27200000,
    90.5,
    44000,
    true,
    'https://jestjs.io',
    'https://github.com/jestjs/jest',
    'https://www.npmjs.com/package/jest'
  ),
  (
    'moment',
    'Parse, validate, manipulate, and display dates',
    'Tim Wood',
    'MIT',
    ARRAY['datetime', 'utility'],
    ARRAY['date', 'time', 'parse', 'format', 'validate', 'i18n', 'l10n', 'ender'],
    4500000,
    18000000,
    78.2,
    47900,
    true,
    'https://momentjs.com',
    'https://github.com/moment/moment',
    'https://www.npmjs.com/package/moment'
  ),
  (
    'uuid',
    'RFC4122 (v1, v4, and v5) UUIDs',
    'Multiple Authors',
    'MIT',
    ARRAY['utility'],
    ARRAY['uuid', 'guid', 'rfc4122'],
    15200000,
    60800000,
    87.8,
    14500,
    true,
    'https://github.com/uuidjs/uuid',
    'https://github.com/uuidjs/uuid',
    'https://www.npmjs.com/package/uuid'
  ),
  (
    'socket.io',
    'Real-time bidirectional event-based communication',
    'Guillermo Rauch',
    'MIT',
    ARRAY['networking', 'backend'],
    ARRAY['realtime', 'framework', 'websocket', 'tcp', 'events', 'client', 'server'],
    1800000,
    7200000,
    86.3,
    61000,
    true,
    'https://socket.io',
    'https://github.com/socketio/socket.io',
    'https://www.npmjs.com/package/socket.io'
  ),
  (
    'tailwindcss',
    'A utility-first CSS framework for rapidly building custom designs',
    'Adam Wathan',
    'MIT',
    ARRAY['css', 'frontend'],
    ARRAY['css', 'framework', 'utility', 'design'],
    2900000,
    11600000,
    92.6,
    82000,
    true,
    'https://tailwindcss.com',
    'https://github.com/tailwindlabs/tailwindcss',
    'https://www.npmjs.com/package/tailwindcss'
  );

-- Update category package counts
UPDATE npm_categories SET package_count = (
  SELECT COUNT(*)
  FROM npm_packages
  WHERE categories @> ARRAY[npm_categories.slug]
);