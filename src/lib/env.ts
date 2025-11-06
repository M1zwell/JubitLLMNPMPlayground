/**
 * Environment Configuration Utility
 * Handles environment detection and configuration for both development and production
 */

export const ENV = {
  // Detect environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,

  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // Application Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'JubitLLM NPM Playground',
    domain: import.meta.env.VITE_APP_DOMAIN || 
      (import.meta.env.DEV ? 'http://localhost:8080' : 'https://chathogs.com'),
    baseUrl: import.meta.env.DEV ? 'http://localhost:8080' : 'https://chathogs.com',
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.DEV 
      ? 'http://localhost:8080/api' 
      : 'https://chathogs.com/api',
    supabaseFunctionsUrl: import.meta.env.DEV
      ? 'http://localhost:8080/api'
      : 'https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1',
  },

  // Feature Flags
  features: {
    multiModelChat: import.meta.env.VITE_ENABLE_MULTI_MODEL_CHAT === 'true',
    analytics: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  },

  // OAuth Configuration
  oauth: {
    github: {
      clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
    },
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    },
    discord: {
      clientId: import.meta.env.VITE_DISCORD_CLIENT_ID || '',
    },
  },

  // Firecrawl Configuration
  firecrawl: {
    apiKey: import.meta.env.VITE_FIRECRAWL_API_KEY || '',
  },
};

/**
 * Get the full URL for a given path
 */
export function getFullUrl(path: string): string {
  const baseUrl = ENV.app.baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get the API endpoint URL
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${ENV.api.baseUrl}/${cleanEndpoint}`;
}

/**
 * Check if all required environment variables are configured
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    { key: 'VITE_SUPABASE_URL', value: ENV.supabase.url },
    { key: 'VITE_SUPABASE_ANON_KEY', value: ENV.supabase.anonKey },
  ];

  const missing = required
    .filter(({ value }) => !value)
    .map(({ key }) => key);

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Log environment configuration (for debugging)
 */
export function logEnvironment(): void {
  if (!ENV.features.debugMode && ENV.isProduction) return;

  console.group('🔧 Environment Configuration');
  console.log('Mode:', ENV.mode);
  console.log('Environment:', ENV.isDevelopment ? 'Development' : 'Production');
  console.log('Base URL:', ENV.app.baseUrl);
  console.log('API URL:', ENV.api.baseUrl);
  console.log('Supabase URL:', ENV.supabase.url ? '✓ Configured' : '✗ Missing');
  console.log('Features:', ENV.features);
  
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.warn('⚠️ Missing environment variables:', validation.missing);
  } else {
    console.log('✓ All required environment variables configured');
  }
  console.groupEnd();
}

// Auto-log on import in development
if (ENV.isDevelopment || ENV.features.debugMode) {
  logEnvironment();
}

export default ENV;

