@echo off
echo ========================================
echo Deploying Advanced Scrapers to Supabase
echo ========================================
echo.

echo Step 1: Checking Supabase CLI...
supabase --version
if %errorlevel% neq 0 (
    echo ERROR: Supabase CLI not found
    exit /b 1
)
echo.

echo Step 2: Logging in to Supabase...
echo Please complete the login in your browser...
supabase login
if %errorlevel% neq 0 (
    echo ERROR: Login failed
    exit /b 1
)
echo.

echo Step 3: Linking to project...
supabase link --project-ref kiztaihzanqnrcrqaxsv
if %errorlevel% neq 0 (
    echo ERROR: Project link failed
    exit /b 1
)
echo.

echo Step 4: Setting environment variables...
supabase secrets set FIRECRAWL_API_KEY=fc-7f04517bc6ef43d68c06316d5f69b91e
if %errorlevel% neq 0 (
    echo WARNING: Secret setting failed - may need manual configuration
)
echo.

echo Step 5: Deploying Edge Functions...
echo Deploying unified-scraper...
supabase functions deploy unified-scraper
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed
    exit /b 1
)
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Test the deployment with: deploy-test.bat
echo 2. Check logs with: supabase functions logs unified-scraper
echo 3. Visit: https://chathogs.com to test in UI
echo.
pause
