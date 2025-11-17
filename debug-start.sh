#!/bin/bash
# Debug version - shows what's happening

echo "🔍 Debug Mode - Starting LineraTrade AI..."
echo ""

# Check Docker
echo "Step 1: Checking Docker..."
if docker ps > /dev/null 2>&1; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is not running"
    exit 1
fi
echo ""

# Check Docker services
echo "Step 2: Checking Docker services..."
docker-compose ps
echo ""

# Check node_modules
echo "Step 3: Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
    if [ -d "node_modules/@esbuild" ]; then
        echo "   Checking esbuild..."
        ls -la node_modules/@esbuild/ | head -5
    fi
else
    echo "❌ node_modules missing - will install"
fi
echo ""

# Check .env
echo "Step 4: Checking .env file..."
if [ -f ".env" ]; then
    echo "✅ .env exists"
    if grep -q "GEMINI_API_KEY" .env; then
        echo "✅ GEMINI_API_KEY found"
    else
        echo "⚠️  GEMINI_API_KEY not found"
    fi
    if grep -q "TWITTER_BEARER_TOKEN" .env; then
        echo "✅ TWITTER_BEARER_TOKEN found"
    else
        echo "⚠️  TWITTER_BEARER_TOKEN not found"
    fi
else
    echo "❌ .env file missing"
fi
echo ""

# Check ports
echo "Step 5: Checking ports..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is in use"
    lsof -i :3000
else
    echo "✅ Port 3000 is free"
fi

if lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Port 3001 is in use"
    lsof -i :3001
else
    echo "✅ Port 3001 is free"
fi
echo ""

# Try to start
echo "Step 6: Attempting to start services..."
echo ""
npm run dev

