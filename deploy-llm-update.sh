#!/bin/bash
# Deploy llm-update function to Supabase
# Waits for Docker to be ready, then deploys

echo "🚀 LLM Update Function Deployment Script"
echo "========================================"

# Wait for Docker to be ready
echo ""
echo "⏳ Waiting for Docker Desktop to start..."
MAX_WAIT=120
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if docker info > /dev/null 2>&1; then
        echo "✅ Docker is ready!"
        break
    fi

    echo "   Waiting... ($WAITED seconds elapsed)"
    sleep 5
    WAITED=$((WAITED + 5))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "❌ Docker failed to start after $MAX_WAIT seconds"
    echo "   Please start Docker Desktop manually and run:"
    echo "   supabase functions deploy llm-update"
    exit 1
fi

# Export access token
echo ""
echo "🔑 Setting Supabase access token..."
export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"

# Deploy function
echo ""
echo "📦 Deploying llm-update function..."
supabase functions deploy llm-update

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Test the function: node test-llm-update-fixed.js"
    echo "2. Run full test suite: node test-bmad-scraping.js"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "   Check the error messages above"
    exit 1
fi
