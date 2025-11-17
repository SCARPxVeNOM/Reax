#!/bin/bash
# Simple Startup Script - Just run ./start.sh

echo "🚀 Starting LineraTrade AI..."
echo ""

# Make sure we're using the right npm (WSL npm, not Windows npm)
export PATH="/usr/bin:/usr/local/bin:$PATH"

# Step 1: Check Docker
echo "📦 Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi
echo "✅ Docker is running"
echo ""

# Step 2: Start Docker services
echo "🐳 Starting database services..."
docker-compose -f docker-compose.yml down 2>/dev/null || true
# Remove network if it exists and recreate it
docker network rm lineratrade-network 2>/dev/null || true
sleep 2
docker-compose -f docker-compose.yml up -d postgres redis

# Step 2.5: Start Linera (required for blockchain features)
echo "🔗 Starting Linera network..."
echo "   Pulling Linera image (this may take a few minutes on first run)..."
docker-compose -f docker-compose.yml pull linera-node 2>&1 | grep -v "Downloading\|Extracting\|Pulling" || true

if docker-compose -f docker-compose.yml up -d linera-node; then
    echo "⏳ Waiting for Linera to initialize (this may take 30-60 seconds)..."
    sleep 10
    # Check if Linera is responding
    LINERA_READY=false
    for i in {1..15}; do
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            echo "✅ Linera network is ready!"
            LINERA_READY=true
            break
        fi
        if [ $i -eq 15 ]; then
            echo "⚠️  Linera is taking longer than expected to start"
            echo "   Checking container status..."
            docker ps --filter "name=linera" --format "{{.Status}}"
            echo "   View logs with: docker logs lineratrade-linera"
            echo "   Linera will continue starting in the background"
        else
            echo "   Waiting for Linera... ($i/15)"
sleep 5
        fi
    done
    
    if [ "$LINERA_READY" = false ]; then
        echo ""
        echo "🔍 Troubleshooting Linera startup..."
        echo "   Container status:"
        docker ps -a --filter "name=linera" --format "table {{.Names}}\t{{.Status}}"
        echo ""
        echo "   Recent logs:"
        docker logs lineratrade-linera --tail 10 2>&1 | head -5
        echo ""
        echo "   Try manually: docker-compose -f docker-compose.yml restart linera-node"
    fi
else
    echo "❌ Failed to start Linera container"
    echo "   This is usually due to Docker image registry access issues"
    echo ""
    
    # Check if local Linera is already running
    echo "🔍 Checking if Linera is running locally..."
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✅ Found Linera running locally on port 8080!"
        echo "   Services will connect to your local Linera instance"
        echo ""
else
        echo "⚠️  Linera is not running locally"
        echo ""
        echo "🔧 SOLUTION: Run Linera locally in a separate terminal"
        echo "   1. Install Linera CLI: cargo install linera-service"
        echo "   2. In a separate terminal, run: ./start-linera-local.sh"
        echo "   3. Or use the buildathon setup: docker compose up --force-recreate"
        echo ""
        echo "   The system will continue without Linera"
        echo "   (Linera features will be disabled until you start it)"
        echo ""
fi
fi
echo ""

sleep 5
echo "✅ Database services started"
echo ""

# Step 3: Check and fix node_modules (WSL compatibility)
if [ -f /proc/version ] && grep -qi microsoft /proc/version; then
    # Check for corrupted or Windows-installed modules
    if [ -d "node_modules" ] && ([ -d "node_modules/@esbuild/win32-x64" ] || [ ! -f "node_modules/date-fns/addMilliseconds/index.js" ]); then
        echo "🔧 Fixing corrupted dependencies..."
        rm -rf node_modules backend/node_modules frontend/node_modules ingestion/node_modules relayer/node_modules parser/node_modules 2>/dev/null
        rm -f package-lock.json
        echo "📥 Reinstalling dependencies for Linux..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install dependencies"
    exit 1
fi
        echo "✅ Dependencies fixed"
        echo ""
    fi
fi

# Step 4: Install if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies (first time only)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Step 5: Verify critical dependencies
if [ ! -f "node_modules/date-fns/addMilliseconds/index.js" ]; then
    echo "🔧 Fixing date-fns dependency..."
    npm install date-fns --force
    echo ""
fi

# Step 6: Check .env (non-blocking)
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Create .env file with GEMINI_API_KEY and TWITTER_BEARER_TOKEN"
    echo ""
fi

# Step 7: Start services
echo "🎯 Starting services..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Use npx to ensure we use local concurrently
npx concurrently --names "INGESTION,BACKEND,RELAYER,FRONTEND" --prefix-colors "cyan,blue,yellow,magenta" \
  "cd ingestion && npm run dev" \
  "cd backend && npm run dev" \
  "cd relayer && npm run dev" \
  "cd frontend && npm run dev"
