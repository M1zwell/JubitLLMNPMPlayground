@echo off
echo ========================================
echo Testing Deployed Scrapers
echo ========================================
echo.

set SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
set ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8

echo Test 1: HKSFC Scraper (V2)...
echo.
curl -X POST %SUPABASE_URL%/functions/v1/unified-scraper ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %ANON_KEY%" ^
  -d "{\"source\": \"hksfc\", \"limit\": 5, \"test_mode\": false, \"use_v2\": true}"
echo.
echo.

timeout /t 3 /nobreak > nul

echo Test 2: CCASS Scraper (V2) - Tencent (00700)...
echo.
curl -X POST %SUPABASE_URL%/functions/v1/unified-scraper ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %ANON_KEY%" ^
  -d "{\"source\": \"ccass\", \"stock_code\": \"00700\", \"limit\": 10, \"test_mode\": false, \"use_v2\": true}"
echo.
echo.

echo ========================================
echo Tests Complete!
echo ========================================
echo.
echo Check the results above for:
echo - success: true
echo - records_inserted: ^> 0
echo - scraper_engine: firecrawl-v2-*
echo.
echo View logs with: supabase functions logs unified-scraper
echo.
pause
