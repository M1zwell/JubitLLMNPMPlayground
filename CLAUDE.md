# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JubitLLMNPMPlayground is a unified platform for exploring, testing, and managing LLM models and NPM packages. It combines a React frontend with Supabase backend services to provide an integrated development environment for AI models and JavaScript packages.

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start dev server (localhost:8080)
npm run dev

# Start dev server accessible on network
npm run dev:host

# Build for production
npm run build

# Preview production build (localhost:8080)
npm run preview

# Lint code
npm run lint
```

### Supabase Local Development
```bash
# Start local Supabase instance
npm run supabase:start

# Stop local Supabase instance
npm run supabase:stop

# Check Supabase status
npm run supabase:status

# Reset local database
npm run supabase:db:reset

# Serve Edge Functions locally
npm run supabase:functions:serve

# Deploy Edge Functions
npm run supabase:functions:deploy
```

### Deployment
```bash
# Build for Netlify production deployment
npm run build:prod

# Deploy to Netlify production
npm run netlify:deploy

# Deploy preview to Netlify
npm run vercel:preview
```

## Architecture

### Frontend Architecture

The application uses a **multi-view SPA architecture** with centralized state management:

- **App.tsx**: Main application shell with navigation and view routing
- **PlaygroundContext**: Global state management for view switching, data caching, and user interactions
- **AuthContext**: User authentication state and session management via Supabase Auth

### View Structure

The app has 8+ main views accessible via a unified navigation:
1. **Integrated Hub** (`IntegratedPlaygroundHub`): Main dashboard
2. **LLM Market** (`EnhancedLLMMarket`): Browse/search LLM models from database
3. **LLM Playground** (`LLMPlayground`): Interactive testing of LLM models
4. **NPM Market** (`NPMMarketplace`): Browse/search NPM packages
5. **NPM Playground** (`NPMIntegratedPlayground`): Test NPM packages in sandbox
6. **Multi-Model Chat** (`MultiModelChat`): Chat with 50+ AI models simultaneously
7. **Workflow Execution** (`WorkflowExecutionPlayground`): Create and execute workflows
8. **Webb Financial** (`WebbFinancialIntegration`): Financial data integration (MySQL migration features disabled)

### Component Organization

```
src/
├── components/
│   ├── auth/          # Authentication components (AuthModal, UserMenu, UserProfile)
│   ├── ui/            # Reusable UI components (Button, Card, Input, etc.)
│   └── *.tsx          # Feature components (LLMPlayground, NPMMarketplace, etc.)
├── contexts/          # React context providers
│   └── AuthContext.tsx
├── context/           # Legacy context (to be migrated)
│   └── PlaygroundContext.tsx
├── hooks/             # Custom React hooks
│   ├── useLLMModels.ts
│   ├── useNPMPackages.ts
│   └── useLLMUpdates.ts
├── lib/               # Utility functions and configurations
│   ├── supabase.ts    # Supabase client initialization
│   ├── env.ts         # Environment variable management
│   ├── utils.ts       # General utilities
│   └── scraping/      # Web scraping utilities (Puppeteer, Firecrawl)
└── App.tsx            # Main application component
```

### Supabase Backend Architecture

**Database Tables:**
- `llm_models`: LLM model information (143+ models from various providers)
- `npm_packages`: NPM package data (100+ packages with categorization)
- `npm_categories`: Package categorization system (13 categories)
- `user_profiles`: User account information and preferences
- `user_preferences`: User settings and configurations
- `user_workflows`: Saved workflow definitions
- `workflow_analyses`: Workflow execution results
- `user_activity_logs`: User interaction tracking
- `llm_update_logs`: LLM data update history
- `npm_import_logs`: NPM import operation logs

**Edge Functions** (located in `supabase/functions/`):
- `llm-update`: Fetches latest LLM data from artificialanalysis.ai
- `npm-import`: Imports NPM packages from registry with GitHub stats
- `npm-spider`: Web scraper for NPM package discovery
- `webb-data-import`: Webb financial data import
- `exec-sql` / `execute-sql-batch`: SQL execution utilities (disabled in production)
- `webb-migration` / `webb-mysql-migration` / `webb-sql-processor`: MySQL migration tools (disabled)

### State Management Pattern

The app uses a **dual-context pattern**:

1. **PlaygroundContext**: Manages application-wide view state, navigation, and feature data
   - Current view selection
   - Search terms for LLM/NPM
   - Selected models/packages
   - Workflow components
   - Connection status

2. **AuthContext**: Manages user authentication and profile data
   - User session (via Supabase Auth)
   - User profile data
   - User preferences
   - Activity logging
   - OAuth provider integration (GitHub, Google, Discord)

### Supabase Client Pattern

The codebase uses **two Supabase client instances**:

1. **Standard Client** (`supabase` in `lib/supabase.ts`):
   - Created with anon key for frontend operations
   - Handles user authentication and RLS-protected data
   - Returns `null` if environment variables missing (graceful degradation)

2. **Admin Client** (`getSupabaseAdmin()`):
   - Singleton pattern to avoid multiple GoTrueClient instances
   - Uses service role key for privileged operations
   - Used in Edge Functions and admin operations
   - Shared instance prevents auth conflicts

## Important Implementation Details

### Environment Variables

The app uses a centralized environment configuration in `src/lib/env.ts`:

```typescript
ENV.supabase.url        // Supabase project URL
ENV.supabase.anonKey    // Supabase anon key (client-side)
ENV.isDevelopment       // Development mode flag
```

**Critical**: All environment variables for Vite must be prefixed with `VITE_`. Required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Webb SQL Import Features

**IMPORTANT**: Several Webb-related SQL import/migration features are **intentionally disabled** in production:
- WebbDataImporter
- WebbSQLImporter
- WebbDirectSQLImporter
- WebbMySQLMigrator
- WebbDirectSQLUploader

These are commented out in `App.tsx` navigation and show disabled messages. Do NOT re-enable without explicit approval.

### LLM Data Update System

The `llm-update` Edge Function:
- Scrapes artificialanalysis.ai for latest model data
- Falls back to predefined model data if scraping fails
- Categorizes models (reasoning, coding, multimodal, lightweight, budget)
- Assigns rarity based on quality index (legendary, epic, rare, common)
- Updates existing models or inserts new ones
- Logs all operations to `llm_update_logs`

### NPM Import System

The `npm-import` Edge Function:
- Searches NPM registry API
- Fetches package details from registry.npmjs.org
- Retrieves GitHub stats (stars, forks, issues) via GitHub API
- Auto-categorizes packages into 13 categories (front-end, back-end, CLI tools, testing, etc.)
- Detects TypeScript support
- Logs operations to `npm_import_logs`

### Authentication Flow

1. User clicks "Sign In" → Opens `AuthModal`
2. AuthModal offers email/password or OAuth (GitHub, Google, Discord)
3. AuthContext handles Supabase auth operations
4. On success, loads user profile from `user_profiles` table
5. Loads preferences from `user_preferences` table
6. Logs activity to `user_activity_logs`
7. Session persists via Supabase's built-in session management

### Development Server Configuration

The Vite dev server (`vite.config.ts`):
- Runs on port 8080 (both dev and preview)
- Proxies `/api/*` requests to Supabase Edge Functions
- Auto-opens browser on start
- Enables CORS for development

### Build Configuration

Production build settings:
- Output directory: `dist/`
- Manual code splitting: vendor (React), supabase, monaco chunks
- Current bundle size: 1.27MB (consider further optimization)
- Sourcemaps disabled for production

## Common Development Tasks

### Adding a New LLM Model Manually

```typescript
// Query existing models
const { data: models } = await supabase
  .from('llm_models')
  .select('*')
  .eq('provider', 'OpenAI');

// Insert new model
const { error } = await supabase
  .from('llm_models')
  .insert({
    name: 'GPT-5',
    provider: 'OpenAI',
    model_id: 'gpt-5',
    // ... other fields
  });
```

### Adding a New View

1. Create component in `src/components/YourView.tsx`
2. Add view type to `PlaygroundView` union in `src/context/PlaygroundContext.tsx`
3. Add navigation button in `App.tsx` navigation section
4. Add view rendering logic in `App.tsx` main content area
5. Update PlaygroundContext initial state if needed

### Working with Edge Functions

```bash
# Test Edge Function locally
curl -X POST http://localhost:54321/functions/v1/llm-update \
  -H "Content-Type: application/json" \
  -d '{"update_type": "manual"}'

# Deploy single function
supabase functions deploy llm-update

# Deploy all functions
npm run supabase:functions:deploy
```

### Database Queries

Always use Supabase client with proper error handling:

```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value')
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('Database error:', error);
  // Handle error gracefully
}
```

## Security Considerations

1. **Never commit**: `.env` files, service role keys, or sensitive credentials
2. **Supabase RLS**: All tables use Row Level Security policies
3. **CORS Headers**: Configured in Edge Functions for secure API access
4. **CSP Headers**: Content Security Policy configured in `netlify.toml`
5. **Auth Tokens**: Auto-refreshed by Supabase client

## Known Issues

1. **Function Search Path**: 9 database functions need fixed search paths (Supabase security warning)
2. **OTP Expiry**: Consider reducing OTP expiration time to < 1 hour
3. **Bundle Size**: Main bundle is 1.27MB - consider further code splitting
4. **Dual Context**: `context/` and `contexts/` directories should be unified
5. **Disabled Features**: Webb SQL import functions are disabled but code remains

## Deployment

This project deploys to **Netlify** with **Supabase** backend:

- Domain: https://chathogs.com (configured in `netlify.toml`)
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18
- Environment variables must be set in Netlify dashboard
- SPA routing handled via redirects in `netlify.toml`

## Testing

Currently no automated tests are configured. When adding tests:
- Use Jest or Vitest for unit tests
- Consider React Testing Library for component tests
- Test Edge Functions with Deno's built-in test runner
- Add test scripts to `package.json`
