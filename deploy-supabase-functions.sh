#!/bin/bash

# Quick deployment script for Supabase Edge Functions
# Run this once Docker Desktop is running

echo "🚀 Deploying Supabase Edge Functions..."

# Set access token
export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"

# Check Docker
echo "Checking Docker..."
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi
echo "✅ Docker is running"

# Deploy functions
echo ""
echo "Deploying functions..."

supabase functions deploy scrape-url --no-verify-jwt && echo "✅ scrape-url deployed"
supabase functions deploy scrape-custom --no-verify-jwt && echo "✅ scrape-custom deployed"
supabase functions deploy llm-update --no-verify-jwt && echo "✅ llm-update deployed"
supabase functions deploy npm-import --no-verify-jwt && echo "✅ npm-import deployed"
supabase functions deploy hk-scraper --no-verify-jwt && echo "✅ hk-scraper deployed"

echo ""
echo "🎉 All functions deployed!"
echo ""
echo "Test with:"
echo 'curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"url":"https://example.com"}'"'"
