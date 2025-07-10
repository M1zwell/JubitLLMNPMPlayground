import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug environment variables
console.log('Supabase configuration:', {
  url: supabaseUrl ? `Configured (${supabaseUrl.substring(0, 30)}...)` : 'Missing - click "Connect to Supabase" to configure',
  key: supabaseAnonKey ? `Configured (${supabaseAnonKey.substring(0, 20)}...)` : 'Missing - click "Connect to Supabase" to configure'
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl || 'MISSING',
    key: supabaseAnonKey ? 'PRESENT' : 'MISSING'
  })
  console.warn('🔧 Supabase not configured - Click "Connect to Supabase" in the top right to enable database features')
}

// Only create Supabase client if environment variables are present
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase client not created - missing environment variables');
    return null;
  }
  
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    console.log('Supabase client created successfully');
    return client;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
})();

// Shared admin client configuration (singleton pattern to avoid multiple GoTrueClient instances)
const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.5D9mVu_ssolTEW1ffotXoBFY65DuMvE7ERUHedj0t2E';

let supabaseAdminInstance: any = null;

export const getSupabaseAdmin = () => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false, // Don't persist session for admin client
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    console.log('Shared Supabase admin client created');
  }
  return supabaseAdminInstance;
};

// Export the URL for logging purposes
export const supabaseUrlForLogging = supabaseUrl

export type LLMModel = {
  id: string
  name: string
  provider: string
  creator: string
  model_id: string
  license: 'Open' | 'Proprietary'
  context_window: number
  input_price: number
  output_price: number
  avg_price: number
  output_speed: number
  latency: number
  quality_index: number | null
  category: string
  description: string | null
  features: string[]
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  last_updated: string
  created_at: string
  official_api_docs?: string
  provider_homepage?: string
  model_card_url?: string
  verified_official?: boolean
}

export type NPMPackage = {
  id: string
  name: string
  version: string
  description: string | null
  author: string | null
  homepage: string | null
  repository_url: string | null
  npm_url: string | null
  license: string | null
  keywords: string[]
  categories: string[]
  weekly_downloads: number
  monthly_downloads: number
  total_downloads: number
  file_size: number
  dependencies_count: number
  dev_dependencies_count: number
  last_published: string | null
  created_at: string
  quality_score: number
  popularity_rank: number | null
  maintenance_score: number
  vulnerability_count: number
  bundle_size: number
  tree_shaking: boolean
  typescript_support: boolean
  is_deprecated: boolean
  download_trend: string
  github_stars: number
  github_forks: number
  github_issues: number
  last_commit: string | null
  documentation_url: string | null
  demo_url: string | null
  cdn_url: string | null
  updated_at: string
}

export type NPMCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string
  parent_id: string | null
  package_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

export type NPMImportLog = {
  id: string
  import_type: 'manual' | 'automatic' | 'scheduled'
  status: 'in_progress' | 'success' | 'error' | 'cancelled'
  packages_processed: number
  packages_added: number
  packages_updated: number
  error_message: string | null
  import_source: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}