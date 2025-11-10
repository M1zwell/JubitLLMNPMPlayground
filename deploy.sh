#!/bin/bash

# Deployment Script for JubitLLMNPMPlayground
# This script handles deployment to Netlify and Supabase

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if required CLIs are installed
check_cli() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
    fi
}

echo -e "\n${YELLOW}Checking required CLI tools...${NC}"
check_cli "node"
check_cli "npm"
check_cli "netlify"
check_cli "supabase"
check_cli "gh"

# Check if authenticated
echo -e "\n${YELLOW}Checking authentication...${NC}"

if ! netlify status &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Netlify. Run: netlify login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Netlify authenticated${NC}"

if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Supabase. Run: supabase login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Supabase authenticated${NC}"

# Ask for deployment type
echo -e "\n${YELLOW}Select deployment type:${NC}"
echo "1) Production (full deployment)"
echo "2) Preview (test deployment)"
echo "3) Supabase only (Edge Functions)"
echo "4) Netlify only (Frontend)"
read -p "Enter choice (1-4): " deploy_type

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

# Run linting
echo -e "\n${YELLOW}Running linter...${NC}"
npm run lint || {
    read -p "Linting failed. Continue anyway? (y/n): " continue_deploy
    if [ "$continue_deploy" != "y" ]; then
        exit 1
    fi
}

# Build the project
if [ "$deploy_type" != "3" ]; then
    echo -e "\n${YELLOW}Building project...${NC}"
    npm run build:prod
    echo -e "${GREEN}✓ Build completed${NC}"
fi

# Deploy Supabase Edge Functions
if [ "$deploy_type" = "1" ] || [ "$deploy_type" = "3" ]; then
    echo -e "\n${YELLOW}Deploying Supabase Edge Functions...${NC}"

    # Set environment variables
    echo "Setting Firecrawl API key..."
    if [ -f .env ]; then
        FIRECRAWL_KEY=$(grep VITE_FIRECRAWL_API_KEY .env | cut -d '=' -f2)
        if [ ! -z "$FIRECRAWL_KEY" ]; then
            supabase secrets set FIRECRAWL_API_KEY="$FIRECRAWL_KEY"
        fi
    fi

    # Deploy all functions
    supabase functions deploy scrape-url
    supabase functions deploy scrape-custom
    supabase functions deploy llm-update
    supabase functions deploy npm-import

    echo -e "${GREEN}✓ Edge Functions deployed${NC}"
fi

# Deploy to Netlify
if [ "$deploy_type" = "1" ] || [ "$deploy_type" = "4" ]; then
    echo -e "\n${YELLOW}Deploying to Netlify (Production)...${NC}"
    netlify deploy --prod
    echo -e "${GREEN}✓ Deployed to production${NC}"
elif [ "$deploy_type" = "2" ]; then
    echo -e "\n${YELLOW}Deploying to Netlify (Preview)...${NC}"
    netlify deploy
    echo -e "${GREEN}✓ Preview deployed${NC}"
fi

# Run post-deployment checks
echo -e "\n${YELLOW}Running post-deployment checks...${NC}"

if [ "$deploy_type" = "1" ] || [ "$deploy_type" = "4" ]; then
    echo "Testing production endpoint..."
    curl -s -o /dev/null -w "%{http_code}" https://chathogs.com | grep -q "200" && \
        echo -e "${GREEN}✓ Site is accessible${NC}" || \
        echo -e "${YELLOW}⚠ Site may not be accessible yet${NC}"
fi

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$deploy_type" = "1" ]; then
    echo -e "\n${YELLOW}Production URLs:${NC}"
    echo "  Frontend: https://chathogs.com"
    echo "  API: https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1"
    echo ""
    echo "Edge Functions deployed:"
    echo "  • scrape-url - General web scraping"
    echo "  • scrape-custom - Custom scrapers (product, article, SEO)"
    echo "  • llm-update - LLM model updates"
    echo "  • npm-import - NPM package imports"
fi

echo -e "\n${YELLOW}Next steps:${NC}"
echo "  1. Test your deployment"
echo "  2. Monitor logs: netlify logs"
echo "  3. Check Edge Functions: supabase functions list"
echo "  4. Update DNS if needed"
echo ""
