#!/bin/bash
# HK Scraping System - Production Deployment Commands
# Copy and paste these commands one by one

echo "=================================================="
echo "HK Scraping System - Production Deployment"
echo "=================================================="
echo ""

# Step 1: Set your Supabase access token
# Get it from: https://supabase.com/dashboard/account/tokens
echo "Step 1: Set Supabase Access Token"
echo "Run one of these (depending on your shell):"
echo ""
echo "PowerShell:"
echo '  $env:SUPABASE_ACCESS_TOKEN = "sbp_YOUR_TOKEN_HERE"'
echo ""
echo "Bash/Linux/Mac:"
echo '  export SUPABASE_ACCESS_TOKEN=sbp_YOUR_TOKEN_HERE'
echo ""
read -p "Press Enter after setting token..."

# Step 2: Link to project
echo ""
echo "Step 2: Linking to Supabase project..."
supabase link --project-ref kiztaihzanqnrcrqaxsv

# Verify link
echo ""
echo "Verifying link..."
supabase projects list

# Step 3: Deploy edge functions
echo ""
echo "Step 3: Deploying edge functions..."
echo ""

echo "Deploying hksfc-rss-sync..."
supabase functions deploy hksfc-rss-sync

echo ""
echo "Deploying sfc-statistics-sync..."
supabase functions deploy sfc-statistics-sync

echo ""
echo "Deploying hkex-disclosure-scraper..."
supabase functions deploy hkex-disclosure-scraper

# Step 4: Configure secrets
echo ""
echo "Step 4: Configure Firecrawl API Key"
echo "Get your API key from: https://firecrawl.dev"
echo ""
read -p "Enter your Firecrawl API key (fc-...): " FIRECRAWL_KEY

if [ -n "$FIRECRAWL_KEY" ]; then
  supabase secrets set FIRECRAWL_API_KEY=$FIRECRAWL_KEY
  echo "Firecrawl API key set successfully!"
else
  echo "Skipping Firecrawl API key configuration"
fi

# Step 5: Verify deployment
echo ""
echo "Step 5: Verifying deployment..."
echo ""

echo "Listing deployed functions:"
supabase functions list

echo ""
echo "Listing secrets:"
supabase secrets list

# Final verification
echo ""
echo "=================================================="
echo "Deployment Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Test via dashboard: http://localhost:8084/hk-admin"
echo "2. Click a trigger button and verify job completes"
echo "3. Check database tables for scraped data"
echo ""
echo "See PRODUCTION-DEPLOYMENT-GUIDE.md for detailed instructions"
echo "See COMPLETION-SUMMARY.md for system overview"
echo ""
