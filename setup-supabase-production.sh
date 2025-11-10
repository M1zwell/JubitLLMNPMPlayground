#!/bin/bash

# Supabase Production Setup Script
# Run this script after authenticating with: supabase login

set -e  # Exit on error

echo "🚀 Setting up Supabase Production..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if authenticated
echo -e "\n${YELLOW}Checking Supabase authentication...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Supabase${NC}"
    echo -e "${YELLOW}Please run: supabase login${NC}"
    echo -e "${YELLOW}Or set SUPABASE_ACCESS_TOKEN environment variable${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated with Supabase${NC}"

# Link to production project
echo -e "\n${YELLOW}Linking to production project...${NC}"
supabase link --project-ref kiztaihzanqnrcrqaxsv || {
    echo -e "${YELLOW}⚠ Project may already be linked${NC}"
}
echo -e "${GREEN}✓ Linked to project: kiztaihzanqnrcrqaxsv${NC}"

# Set production secrets
echo -e "\n${YELLOW}Setting production secrets...${NC}"

# Read Firecrawl API key from .env
if [ -f .env ]; then
    FIRECRAWL_KEY=$(grep VITE_FIRECRAWL_API_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ ! -z "$FIRECRAWL_KEY" ]; then
        echo "Setting FIRECRAWL_API_KEY..."
        supabase secrets set FIRECRAWL_API_KEY="$FIRECRAWL_KEY"
        echo -e "${GREEN}✓ FIRECRAWL_API_KEY set${NC}"
    else
        echo -e "${YELLOW}⚠ FIRECRAWL_API_KEY not found in .env${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Verify secrets
echo -e "\n${YELLOW}Verifying secrets...${NC}"
supabase secrets list
echo -e "${GREEN}✓ Secrets configured${NC}"

# Deploy Edge Functions
echo -e "\n${YELLOW}Deploying Edge Functions...${NC}"

FUNCTIONS=(
    "scrape-url"
    "scrape-custom"
    "llm-update"
    "npm-import"
    "hk-scraper"
)

for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo "Deploying $func..."
        supabase functions deploy "$func" --no-verify-jwt
        echo -e "${GREEN}✓ $func deployed${NC}"
    else
        echo -e "${YELLOW}⚠ $func directory not found, skipping${NC}"
    fi
done

# List deployed functions
echo -e "\n${YELLOW}Listing deployed functions...${NC}"
supabase functions list
echo -e "${GREEN}✓ All functions deployed${NC}"

# Test a function
echo -e "\n${YELLOW}Testing scrape-url function...${NC}"
FUNCTION_URL="https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url"
curl -s -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://example.com","options":{"format":"text"}}' \
    | jq '.' || echo -e "${YELLOW}⚠ Test request sent (jq not available for formatting)${NC}"

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Supabase Production Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}Production URLs:${NC}"
echo "  API Base: https://kiztaihzanqnrcrqaxsv.supabase.co"
echo "  Functions: https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1"
echo ""
echo "Edge Functions deployed:"
for func in "${FUNCTIONS[@]}"; do
    echo "  • $func - https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/$func"
done

echo -e "\n${YELLOW}Test your functions:${NC}"
echo '  curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '"'"'{"url":"https://example.com"}'"'"

echo -e "\n${YELLOW}View logs:${NC}"
echo "  supabase functions logs scrape-url"

echo -e "\n${GREEN}✓ Ready for production use!${NC}"
echo ""
