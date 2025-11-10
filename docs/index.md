# JubitLLMNPMPlayground - Project Documentation

**Generated:** 2025-11-10
**Scan Type:** Quick Scan (Pattern-based analysis)
**Project Type:** Multi-Part (Web Application + Backend Services)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Summary](#architecture-summary)
3. [Part 1: Frontend Web Application](#part-1-frontend-web-application)
4. [Part 2: Backend Services](#part-2-backend-services)
5. [Database Schema](#database-schema)
6. [Technology Stack](#technology-stack)
7. [Key Features](#key-features)
8. [Development Workflows](#development-workflows)
9. [Deployment](#deployment)
10. [Next Steps](#next-steps)

---

## Project Overview

**JubitLLMNPMPlayground** is a unified platform for exploring, testing, and managing LLM models and NPM packages. It combines a React frontend with Supabase backend services to provide an integrated development environment for AI models and JavaScript packages.

### Project Goals

- **LLM Model Management**: Browse, search, and test AI models from various providers
- **NPM Package Exploration**: Discover, analyze, and test JavaScript packages
- **Web Scraping Integration**: Advanced scraping capabilities for financial data and package information
- **Workflow Automation**: Visual workflow creation and execution
- **User Management**: Secure authentication and user preferences

### Project Structure

```
JubitLLMNPMPlayground/
├── src/                    # Frontend React application
├── supabase/              # Backend services
│   ├── functions/        # Edge Functions (11 serverless functions)
│   └── migrations/       # Database schema migrations
├── bmad/                  # BMad Method framework
├── docs/                  # Project documentation (this directory)
├── dist/                  # Production build output
└── scripts/               # Utility scripts
```

---

## Architecture Summary

### Repository Type: **Multi-Part**

The project consists of two main parts that work together:

1. **Frontend (Web Application)**: React + TypeScript SPA
2. **Backend (Serverless Functions)**: Supabase Edge Functions + PostgreSQL Database

### Communication Flow

```
User Browser
    ↓
React Frontend (localhost:8080 / chathogs.com)
    ↓
Supabase Client SDK
    ↓
┌─────────────────────────────────┐
│  Supabase Platform              │
│  ├── PostgreSQL Database        │
│  ├── Authentication             │
│  ├── Edge Functions (11)        │
│  └── Real-time Subscriptions    │
└─────────────────────────────────┘
    ↓
External APIs (Firecrawl, NPM Registry, etc.)
```

---

## Part 1: Frontend Web Application

### Overview

**Technology:** React 18 + TypeScript + Vite
**UI Framework:** Tailwind CSS
**State Management:** React Context API
**Code Editor:** Monaco Editor

### Directory Structure

```
src/
├── components/          # React components (35+ components)
│   ├── auth/           # Authentication components
│   └── ui/             # Reusable UI components
├── contexts/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
│   ├── scraping/      # Web scraping libraries
│   ├── supabase.ts    # Supabase client
│   ├── env.ts         # Environment configuration
│   └── utils.ts       # General utilities
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

### Key Components (35 Total)

#### **Core Features**
- `IntegratedPlaygroundHub.tsx` - Main dashboard
- `EnhancedLLMMarket.tsx` - LLM model marketplace (143+ models)
- `LLMPlayground.tsx` - Interactive LLM testing
- `NPMMarketplace.tsx` - NPM package browser (100+ packages)
- `NPMIntegratedPlayground.tsx` - NPM package testing sandbox
- `MultiModelChat.tsx` - Multi-model chat interface

#### **Web Scraping & Data**
- `HKFinancialScraper.tsx` - Hong Kong financial data scraper
- `DataPreviewModal.tsx` - Data preview with export (CSV/JSON/XLSX)
- `NPMScraper.tsx` - NPM package data scraper
- `WebbFinancialIntegration.tsx` - Webb financial data integration

#### **Workflow & Automation**
- `WorkflowExecutionPlayground.tsx` - Workflow execution engine
- `WorkflowVisualization.tsx` - Visual workflow editor
- `AIWorkflowAdvisor.tsx` - AI-powered workflow recommendations

#### **Authentication & User Management**
- `auth/AuthModal.tsx` - Login/signup modal
- `auth/UserMenu.tsx` - User dropdown menu
- `auth/UserProfile.tsx` - User profile management

#### **Advanced Features**
- `AdvancedPlaygroundDemo.tsx` - Advanced testing playground
- `NPMExecutionSandbox.tsx` - Secure package execution environment
- `ShakeUpAnalyzer.tsx` - Data analysis tool
- `LLMUpdateManager.tsx` - LLM data update management
- `LLMProviderManager.tsx` - LLM provider configuration

### State Management

#### **Contexts**

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - User authentication state
   - User profile data
   - User preferences
   - Activity logging
   - OAuth provider integration (GitHub, Google, Discord)

2. **PlaygroundContext** (`src/context/PlaygroundContext.tsx`)
   - Application-wide view state
   - Navigation
   - Search terms for LLM/NPM
   - Selected models/packages
   - Workflow components

#### **Custom Hooks**

- `useLLMModels.ts` - LLM model data fetching and management
- `useNPMPackages.ts` - NPM package data and search
- `useLLMUpdates.ts` - LLM data update tracking

### Scraping Library (`src/lib/scraping/`)

**Key Files:**
- `hk-financial-scraper.ts` (35KB) - Main scraping engine with dual-engine support
- `firecrawl.ts` - Firecrawl API integration
- `puppeteer.ts` - Puppeteer browser automation
- `examples.ts` - Usage examples
- `README.md` - Documentation

**Features:**
- Dual-engine scraping (Firecrawl + Puppeteer)
- Browser environment detection
- Edge Function integration for production
- Mock data fallback for demo mode
- CSV/JSON/XLSX export support

### Routing & Views

**8 Main Views:**
1. Integrated Hub - Dashboard
2. LLM Market - Browse LLM models
3. LLM Playground - Test LLM models
4. NPM Market - Browse NPM packages
5. NPM Playground - Test NPM packages
6. Multi-Model Chat - Chat with 50+ models
7. Workflow Execution - Create/execute workflows
8. Webb Financial - Financial data integration

---

## Part 2: Backend Services

### Overview

**Platform:** Supabase
**Runtime:** Deno (Edge Functions)
**Database:** PostgreSQL
**Authentication:** Supabase Auth (Email/Password + OAuth)

### Edge Functions (11 Total)

Located in `supabase/functions/`:

#### **1. hk-scraper** (NEW - Production Ready)
- **Purpose**: Real web scraping via Firecrawl API
- **Sources**: NPM packages, HKSFC news, HKEX market data
- **Integration**: Called from browser, returns scraped data as JSON
- **Features**: CORS-enabled, supports multiple source types

#### **2. llm-update**
- **Purpose**: Fetch latest LLM model data from artificialanalysis.ai
- **Features**: Auto-categorization, rarity assignment, fallback data
- **Output**: Updates `llm_models` table

#### **3. npm-import**
- **Purpose**: Import NPM packages from registry
- **Features**: GitHub stats fetching, auto-categorization
- **Output**: Updates `npm_packages` table

#### **4. npm-spider**
- **Purpose**: Web crawler for NPM package discovery
- **Features**: Pattern-based search, bulk import

#### **5-7. Webb Data Import Functions**
- `webb-data-import` - Webb financial data import
- `webb-migration` - MySQL to PostgreSQL migration
- `webb-mysql-migration` - MySQL migration tools
- `webb-sql-processor` - SQL processing utilities

#### **8-9. SQL Execution Functions** (Disabled in Production)
- `exec-sql` - Execute SQL queries
- `execute-sql-batch` - Batch SQL execution

### Database Migrations

Located in `supabase/migrations/` (19 migration files):

**Key Schemas:**
- Webb database schema (financial data)
- Import sessions tracking
- CCASS original schema (Hong Kong stock data)
- Enigma original schema
- LLM models and categories
- NPM packages and categories
- User profiles and preferences
- Workflow definitions and analyses
- Activity logs

---

## Database Schema

### Core Tables

#### **LLM Models**
- `llm_models` - 143+ AI models from various providers
- `llm_update_logs` - Update history and tracking

#### **NPM Packages**
- `npm_packages` - 100+ JavaScript packages
- `npm_categories` - 13 package categories
- `npm_import_logs` - Import operation logs

#### **User Management**
- `user_profiles` - User account information
- `user_preferences` - User settings and configurations
- `user_activity_logs` - User interaction tracking

#### **Workflows**
- `user_workflows` - Saved workflow definitions
- `workflow_analyses` - Workflow execution results

#### **Financial Data (Webb)**
- Webb database schema for Hong Kong market data
- CCASS schema for stock holdings
- Enigma schema for additional data

---

## Technology Stack

### Frontend Dependencies

**Core Framework:**
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2

**UI & Styling:**
- Tailwind CSS 3.4.1
- Lucide React (icons)
- clsx + tailwind-merge (utility classes)

**Data & State:**
- @supabase/supabase-js 2.50.3
- axios 1.6.0
- lodash 4.17.21
- moment 2.29.4

**Code Editor:**
- @monaco-editor/react 4.6.0

**Web Scraping:**
- @mendable/firecrawl-js 4.5.0
- puppeteer 24.28.0
- cheerio 1.1.0 (dev)

**Data Processing:**
- papaparse 5.5.3 (CSV)
- xlsx 0.18.5 (Excel)
- js-yaml 4.1.0 (YAML)

**Development Tools:**
- ESLint 9.9.1
- TypeScript ESLint 8.3.0
- Autoprefixer 10.4.18
- PostCSS 8.4.35

**BMad Method:**
- bmad-method 6.0.0-alpha.7 (dev)

### Backend Dependencies

**Supabase Platform:**
- PostgreSQL Database
- Supabase Auth
- Edge Functions (Deno runtime)
- Real-time Subscriptions

**External APIs:**
- Firecrawl API (web scraping)
- NPM Registry API
- GitHub API (package stats)
- artificialanalysis.ai (LLM data)

---

## Key Features

### 1. LLM Model Management

**Features:**
- 143+ models from major providers (OpenAI, Anthropic, Google, Meta, etc.)
- Real-time data updates from artificialanalysis.ai
- Model categorization (reasoning, coding, multimodal, lightweight, budget)
- Quality-based rarity system (legendary, epic, rare, common)
- Interactive testing playground
- Provider configuration management

**Data Sources:**
- Automated updates via `llm-update` Edge Function
- Fallback to predefined model data
- Manual model addition support

### 2. NPM Package Exploration

**Features:**
- 100+ curated JavaScript packages
- 13 category system (front-end, back-end, CLI tools, testing, etc.)
- GitHub statistics (stars, forks, issues)
- TypeScript support detection
- Interactive sandbox environment
- Package import from NPM registry

**Data Sources:**
- NPM Registry API
- GitHub API
- `npm-import` Edge Function
- `npm-spider` web crawler

### 3. Web Scraping System

**Components:**
- Dual-engine scraping (Firecrawl + Puppeteer)
- Browser + server-side support
- Production Edge Function (`hk-scraper`)
- Data preview modal with table/JSON/raw views
- Export to CSV/JSON/XLSX

**Supported Sources:**
- NPM package search
- HKSFC news and enforcement actions
- HKEX market data (CCASS, announcements, stats)
- Financial data imports

**Architecture:**
- Browser: Calls Edge Function (production) or uses mock data (demo)
- Server: Firecrawl API with Puppeteer fallback
- Data Preview: Search, filter, sort before export

### 4. Multi-Model Chat

**Features:**
- Chat with 50+ AI models simultaneously
- Side-by-side comparison
- Model switching during conversation
- Context preservation

### 5. Workflow Automation

**Features:**
- Visual workflow editor
- Drag-and-drop component library
- Real-time execution engine
- Performance analysis and cost optimization
- Workflow saving and sharing

### 6. User Management

**Authentication Methods:**
- Email/Password
- OAuth (GitHub, Google, Discord)

**Features:**
- User profiles
- Preference management
- Activity tracking
- Session persistence

---

## Development Workflows

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (localhost:8080)
npm run dev

# Start dev server on network
npm run dev:host

# Build for production
npm run build

# Preview production build
npm run preview
```

### Supabase Local Development

```bash
# Start local Supabase
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Check status
npm run supabase:status

# Reset database
npm run supabase:db:reset

# Serve Edge Functions locally
npm run supabase:functions:serve

# Deploy Edge Functions
npm run supabase:functions:deploy
```

### Code Quality

```bash
# Lint code
npm run lint

# Build and test
npm run test:build
```

---

## Deployment

### Netlify Deployment

**Domain:** https://chathogs.com

**Configuration:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 18

**Environment Variables (Required):**
```env
VITE_SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**Features:**
- Auto-deploy on git push
- SPA routing via `netlify.toml`
- CSP headers configured
- CORS enabled

### Supabase Configuration

**Project Details:**
- Project ID: `kiztaihzanqnrcrqaxsv`
- Region: `ap-southeast-2` (Sydney)
- URL: `https://kiztaihzanqnrcrqaxsv.supabase.co`

**Edge Functions Deployment:**
```bash
# Deploy all functions
npm run supabase:functions:deploy

# Deploy specific function
supabase functions deploy hk-scraper
```

---

## Next Steps

### Recommended Actions

1. **Run Deep Scan** for detailed documentation
   - Execute: `document-project` workflow with "Deep Scan" option
   - Reads critical files for comprehensive analysis
   - Recommended before architecture planning

2. **Review Generated Documentation**
   - Read this index for project overview
   - Understand multi-part architecture
   - Familiarize with component structure

3. **Proceed with BMad Method Track**
   - Next workflow: `brainstorm-project` (Discovery Phase)
   - Then: `research` (Technical research)
   - Then: `prd` (Product Requirements Document)
   - Finally: `create-architecture` (Integration design)

### For AI Agents

**Context Available:**
- ✅ Project structure and organization
- ✅ Technology stack and dependencies
- ✅ Component inventory (35 components)
- ✅ Edge Functions inventory (11 functions)
- ✅ Database schema overview
- ✅ Feature list and capabilities

**Missing (requires Deep/Exhaustive Scan):**
- Detailed component implementations
- API endpoint definitions
- Database query patterns
- Business logic details
- Integration points and data flows

---

## Document Metadata

**Scan Details:**
- **Mode:** Initial Scan
- **Level:** Quick (Pattern-based)
- **Duration:** ~3 minutes
- **Files Read:** Config files, manifests, README
- **Files Scanned:** Directory structure, file patterns

**Coverage:**
- ✅ Project structure mapping
- ✅ Technology stack identification
- ✅ Component inventory
- ✅ Feature list
- ⚠️ Limited code analysis (upgrade to Deep Scan for details)

**Generated Files:**
- `docs/index.md` (this file)
- `docs/project-scan-report.json` (scan state)

---

**Last Updated:** 2025-11-10
**BMad Workflow Status:** `bmm-workflow-status.yaml`
**Next Workflow:** brainstorm-project
