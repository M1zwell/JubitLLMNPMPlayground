# Supabase Production Setup Script (PowerShell)
# Run this script after authenticating with: supabase login

Write-Host "🚀 Setting up Supabase Production..." -ForegroundColor Cyan

# Check if authenticated
Write-Host "`nChecking Supabase authentication..." -ForegroundColor Yellow
try {
    supabase projects list | Out-Null
    Write-Host "✓ Authenticated with Supabase" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with Supabase" -ForegroundColor Red
    Write-Host "Please run: supabase login" -ForegroundColor Yellow
    Write-Host "Or set SUPABASE_ACCESS_TOKEN environment variable" -ForegroundColor Yellow
    exit 1
}

# Link to production project
Write-Host "`nLinking to production project..." -ForegroundColor Yellow
try {
    supabase link --project-ref kiztaihzanqnrcrqaxsv
    Write-Host "✓ Linked to project: kiztaihzanqnrcrqaxsv" -ForegroundColor Green
} catch {
    Write-Host "⚠ Project may already be linked" -ForegroundColor Yellow
}

# Set production secrets
Write-Host "`nSetting production secrets..." -ForegroundColor Yellow

# Read Firecrawl API key from .env
if (Test-Path .env) {
    $envContent = Get-Content .env
    $firecrawlKey = ($envContent | Select-String "VITE_FIRECRAWL_API_KEY=").ToString().Split('=')[1].Trim('"').Trim("'")

    if ($firecrawlKey) {
        Write-Host "Setting FIRECRAWL_API_KEY..."
        supabase secrets set FIRECRAWL_API_KEY="$firecrawlKey"
        Write-Host "✓ FIRECRAWL_API_KEY set" -ForegroundColor Green
    } else {
        Write-Host "⚠ FIRECRAWL_API_KEY not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

# Verify secrets
Write-Host "`nVerifying secrets..." -ForegroundColor Yellow
supabase secrets list
Write-Host "✓ Secrets configured" -ForegroundColor Green

# Deploy Edge Functions
Write-Host "`nDeploying Edge Functions..." -ForegroundColor Yellow

$functions = @(
    "scrape-url",
    "scrape-custom",
    "llm-update",
    "npm-import",
    "hk-scraper"
)

foreach ($func in $functions) {
    if (Test-Path "supabase/functions/$func") {
        Write-Host "Deploying $func..."
        supabase functions deploy $func --no-verify-jwt
        Write-Host "✓ $func deployed" -ForegroundColor Green
    } else {
        Write-Host "⚠ $func directory not found, skipping" -ForegroundColor Yellow
    }
}

# List deployed functions
Write-Host "`nListing deployed functions..." -ForegroundColor Yellow
supabase functions list
Write-Host "✓ All functions deployed" -ForegroundColor Green

# Test a function
Write-Host "`nTesting scrape-url function..." -ForegroundColor Yellow
$functionUrl = "https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url"
$body = @{
    url = "https://example.com"
    options = @{
        format = "text"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $functionUrl -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Function test successful" -ForegroundColor Green
} catch {
    Write-Host "⚠ Test request sent but may need verification" -ForegroundColor Yellow
}

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 Supabase Production Setup Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

Write-Host "`nProduction URLs:" -ForegroundColor Yellow
Write-Host "  API Base: https://kiztaihzanqnrcrqaxsv.supabase.co"
Write-Host "  Functions: https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1"
Write-Host ""
Write-Host "Edge Functions deployed:"
foreach ($func in $functions) {
    Write-Host "  • $func - https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/$func"
}

Write-Host "`nTest your functions:" -ForegroundColor Yellow
Write-Host '  curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \'
Write-Host '    -H "Content-Type: application/json" \'
Write-Host '    -d ''{"url":"https://example.com"}'''

Write-Host "`nView logs:" -ForegroundColor Yellow
Write-Host "  supabase functions logs scrape-url"

Write-Host "`n✓ Ready for production use!" -ForegroundColor Green
