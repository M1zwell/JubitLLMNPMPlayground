@echo off
REM Deploy llm-update function to Supabase
REM Waits for Docker to be ready, then deploys

echo ========================================
echo 🚀 LLM Update Function Deployment
echo ========================================
echo.

echo ⏳ Waiting for Docker Desktop to start...
set MAX_WAIT=120
set /a WAITED=0

:WAIT_LOOP
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Docker is ready!
    goto DEPLOY
)

echo    Waiting... (%WAITED% seconds elapsed^)
timeout /t 5 /nobreak >nul
set /a WAITED=%WAITED%+5

if %WAITED% GEQ %MAX_WAIT% (
    echo ❌ Docker failed to start after %MAX_WAIT% seconds
    echo    Please start Docker Desktop manually and run:
    echo    supabase functions deploy llm-update
    exit /b 1
)

goto WAIT_LOOP

:DEPLOY
echo.
echo 🔑 Setting Supabase access token...
set SUPABASE_ACCESS_TOKEN=sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191

echo.
echo 📦 Deploying llm-update function...
supabase functions deploy llm-update

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Deployment successful!
    echo.
    echo 📋 Next steps:
    echo 1. Test the function: node test-llm-update-fixed.js
    echo 2. Run full test suite: node test-bmad-scraping.js
) else (
    echo.
    echo ❌ Deployment failed!
    echo    Check the error messages above
    exit /b 1
)
