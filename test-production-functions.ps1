# Test Production Edge Functions
# Run this script after deploying functions via Dashboard

Write-Host "🧪 Testing Production Edge Functions" -ForegroundColor Cyan
Write-Host "Base URL: https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1" -ForegroundColor Gray
Write-Host ""

$baseUrl = "https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1"
$testsPass = 0
$testsFail = 0

# Test 1: scrape-url
Write-Host "Test 1: scrape-url..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/scrape-url" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"url":"https://example.com"}' `
        -ErrorAction Stop

    if ($response.success) {
        Write-Host "✅ PASS: scrape-url working" -ForegroundColor Green
        $testsPass++
    } else {
        Write-Host "⚠️  PARTIAL: scrape-url returned error: $($response.error)" -ForegroundColor Yellow
        $testsFail++
    }
} catch {
    Write-Host "❌ FAIL: scrape-url not deployed or error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFail++
}
Write-Host ""

# Test 2: scrape-custom
Write-Host "Test 2: scrape-custom..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/scrape-custom" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"type":"seo","url":"https://example.com"}' `
        -ErrorAction Stop

    if ($response.success) {
        Write-Host "✅ PASS: scrape-custom working" -ForegroundColor Green
        $testsPass++
    } else {
        Write-Host "⚠️  PARTIAL: scrape-custom returned error: $($response.error)" -ForegroundColor Yellow
        $testsFail++
    }
} catch {
    Write-Host "❌ FAIL: scrape-custom not deployed or error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFail++
}
Write-Host ""

# Test 3: llm-update
Write-Host "Test 3: llm-update..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/llm-update" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"update_type":"manual"}' `
        -ErrorAction Stop

    if ($response.success -or $response.modelsProcessed -ge 0) {
        Write-Host "✅ PASS: llm-update working ($($response.modelsProcessed) models)" -ForegroundColor Green
        $testsPass++
    } else {
        Write-Host "⚠️  PARTIAL: llm-update returned unexpected response" -ForegroundColor Yellow
        $testsFail++
    }
} catch {
    Write-Host "❌ FAIL: llm-update not deployed or error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFail++
}
Write-Host ""

# Test 4: npm-import
Write-Host "Test 4: npm-import..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/npm-import" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"searchQuery":"react","limit":5}' `
        -ErrorAction Stop

    if ($response.success -or $response.packagesProcessed -ge 0) {
        Write-Host "✅ PASS: npm-import working ($($response.packagesProcessed) packages)" -ForegroundColor Green
        $testsPass++
    } else {
        Write-Host "⚠️  PARTIAL: npm-import returned unexpected response" -ForegroundColor Yellow
        $testsFail++
    }
} catch {
    Write-Host "❌ FAIL: npm-import not deployed or error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFail++
}
Write-Host ""

# Test 5: hk-scraper
Write-Host "Test 5: hk-scraper..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/hk-scraper" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"source":"hksfc","category":"news","limit":3}' `
        -ErrorAction Stop

    if ($response.success -or $response.records) {
        Write-Host "✅ PASS: hk-scraper working" -ForegroundColor Green
        $testsPass++
    } else {
        Write-Host "⚠️  PARTIAL: hk-scraper returned unexpected response" -ForegroundColor Yellow
        $testsFail++
    }
} catch {
    Write-Host "❌ FAIL: hk-scraper not deployed or error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFail++
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 Test Results:" -ForegroundColor Cyan
Write-Host "   ✅ Passed: $testsPass" -ForegroundColor Green
Write-Host "   ❌ Failed: $testsFail" -ForegroundColor Red
Write-Host ""

if ($testsFail -eq 0) {
    Write-Host "🎉 All tests passed! Functions are deployed and working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test in your app at http://localhost:8080" -ForegroundColor Gray
    Write-Host "2. Check function logs in Dashboard" -ForegroundColor Gray
    Write-Host "3. (Optional) Deploy frontend to Netlify" -ForegroundColor Gray
} elseif ($testsPass -gt 0) {
    Write-Host "⚠️  Some tests failed. Check function logs in Dashboard:" -ForegroundColor Yellow
    Write-Host "   https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions" -ForegroundColor Gray
} else {
    Write-Host "❌ All tests failed. Verify functions are deployed:" -ForegroundColor Red
    Write-Host "   https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions" -ForegroundColor Gray
}
Write-Host ""
