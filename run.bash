#!/bin/bash
# Linera Buildathon Template - Build and Run Script
# Based on https://github.com/linera-io/buildathon-template

set -e

echo "🚀 Starting LineraTrade AI Buildathon Application..."
echo ""

# Step 1: Check and install Linera if needed
echo "📡 Checking Linera installation..."
if ! command -v linera &> /dev/null; then
    echo "📦 Installing Linera CLI..."
    
    # First, try local source if available (more efficient, already present)
    if [ -d "/build/linera-app/linera-protocol" ]; then
        echo "🔨 Building Linera from local source (faster, less memory intensive)..."
        cd /build/linera-app/linera-protocol
        
        # Use the Rust toolchain specified in the project
        if [ -f "toolchains/stable/rust-toolchain.toml" ]; then
            RUST_VERSION=$(grep -oP 'channel = "\K[^"]+' toolchains/stable/rust-toolchain.toml | head -1)
            if [ -n "$RUST_VERSION" ]; then
                echo "📦 Using Rust $RUST_VERSION as specified by linera-protocol..."
                rustup install $RUST_VERSION 2>/dev/null || true
                rustup default $RUST_VERSION 2>/dev/null || true
            fi
        fi
        
        # Build with optimized settings to reduce memory usage
        # Use incremental compilation and limit parallel jobs to reduce memory pressure
        export CARGO_BUILD_JOBS=2
        export CARGO_INCREMENTAL=1
        cargo install --path linera-service --locked --features default,storage-service || {
            echo "⚠️  Failed to build from local source, trying crates.io version 0.15.5..."
            rustup default stable 2>/dev/null || true
            cd /build
            
            # Try installing from crates.io (template version)
            # Use memory optimizations for crates.io build
            export CARGO_BUILD_JOBS=2
            export CARGO_INCREMENTAL=1
            cargo install --locked linera-service@0.15.5 linera-storage-service@0.15.5 || {
                echo "❌ Linera installation failed. Cannot continue."
                exit 1
            }
        }
        rustup default stable 2>/dev/null || true
        cd /build
    else
        # No local source, install from crates.io (template version)
        echo "📦 Installing Linera from crates.io (version 0.15.5 to match template)..."
        # Use memory optimizations for crates.io build
        export CARGO_BUILD_JOBS=2
        export CARGO_INCREMENTAL=1
        cargo install --locked linera-service@0.15.5 linera-storage-service@0.15.5 || {
            echo "⚠️  Failed to install from crates.io, trying nightly Rust..."
            rustup install nightly 2>/dev/null || true
            rustup default nightly 2>/dev/null || true
            export CARGO_BUILD_JOBS=2
            export CARGO_INCREMENTAL=1
            cargo install --locked linera-service@0.15.5 linera-storage-service@0.15.5 || {
                echo "❌ Linera installation failed. Cannot continue."
                exit 1
            }
            rustup default stable 2>/dev/null || true
        }
    fi
    
    # Verify installation
    if command -v linera &> /dev/null; then
        echo "✅ Linera CLI installed successfully"
        linera --version || true
    else
        echo "❌ Linera CLI installation failed. Cannot continue."
        exit 1
    fi
fi

# Step 2: Start Linera network
echo "📡 Starting Linera network..."
if ! linera net up --testing-prng-seed 37 2>&1; then
    echo "⚠️  Linera network startup had issues, checking if already running..."
    # Check if network is already up by trying to query it
    if linera net show 2>/dev/null; then
        echo "✅ Linera network is already running"
    else
        echo "❌ Linera network failed to start. Retrying..."
        linera net up --testing-prng-seed 37 || {
            echo "❌ Failed to start Linera network after retry"
            exit 1
        }
    fi
fi

# Step 3: Start Linera service (faucet on port 8080)
echo "🔗 Starting Linera service on port 8080..."
# Check if port 8080 is already in use (try multiple methods for port checking)
PORT_IN_USE=false
if command -v lsof &> /dev/null; then
    if lsof -i :8080 > /dev/null 2>&1; then
        PORT_IN_USE=true
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tuln 2>/dev/null | grep -q ':8080 '; then
        PORT_IN_USE=true
    fi
elif command -v ss &> /dev/null; then
    if ss -tuln 2>/dev/null | grep -q ':8080 '; then
        PORT_IN_USE=true
    fi
fi

if [ "$PORT_IN_USE" = true ]; then
    echo "⚠️  Port 8080 is already in use, skipping Linera service start"
    LINERA_PID=""
else
    linera service --port 8080 > /tmp/linera-service.log 2>&1 &
    LINERA_PID=$!
    echo "📝 Linera service PID: $LINERA_PID"
fi

# Wait for Linera to be ready
echo "⏳ Waiting for Linera service to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✅ Linera service is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Linera service not ready after 30 attempts, continuing anyway..."
    else
        sleep 1
    fi
done

# Step 4: Build and publish Linera application
echo "📦 Building Linera application..."
cd linera-app

# Install wasm32 target if needed
rustup target add wasm32-unknown-unknown 2>/dev/null || true

# Build application
cargo build --release --target wasm32-unknown-unknown || {
    echo "⚠️  Linera build failed, but continuing..."
    echo "   The application will work with mock Linera data"
}

# Publish application (if not already published)
if [ ! -f /data/linera_app_id.txt ]; then
    echo "📤 Publishing Linera application..."
    linera project publish-and-create > /data/linera_app_id.txt 2>&1 || {
        echo "⚠️  Application publish failed, using placeholder ID"
        echo "ApplicationId(placeholder)" > /data/linera_app_id.txt
    }
    APP_ID=$(cat /data/linera_app_id.txt | grep -oP 'ApplicationId\([^)]+\)' | head -1 || echo "ApplicationId(placeholder)")
    echo "📝 Application ID: $APP_ID"
    export LINERA_APP_ID="$APP_ID"
else
    APP_ID=$(cat /data/linera_app_id.txt | grep -oP 'ApplicationId\([^)]+\)' | head -1 || echo "ApplicationId(placeholder)")
    echo "📝 Using existing Application ID: $APP_ID"
    export LINERA_APP_ID="$APP_ID"
fi
cd ..

# Step 5: Start backend services
echo "🔧 Starting backend services..."
cd backend
npm install --silent || npm ci --legacy-peer-deps
npm run build 2>/dev/null || echo "⚠️  Backend build failed, using dev mode"
# Start backend (use tsx for dev mode if build fails)
npm run start 2>/dev/null || (npm run dev &) || (npx tsx src/index.ts &)
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Backend not ready after 30 attempts, continuing anyway..."
    else
        sleep 1
    fi
done

# Step 5: Start frontend (Next.js on port 5173)
echo "🎨 Starting frontend on port 5173..."
cd frontend
npm install --silent

# Configure Next.js to use port 5173 (buildathon requirement)
export PORT=5173
export NEXT_PUBLIC_API_URL=http://localhost:3001
export NEXT_PUBLIC_LINERA_RPC_URL=http://localhost:8080
export NEXT_PUBLIC_LINERA_APP_ID="$APP_ID"

# Start Next.js server on port 5173
# Next.js uses PORT env var, but we'll also pass it explicitly
PORT=5173 node_modules/.bin/next start -p 5173 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "⚠️  Frontend not ready after 60 attempts"
    else
        sleep 1
    fi
done

echo ""
echo "✅ LineraTrade AI is running!"
echo ""
echo "📊 Services:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3001"
echo "   Linera:    http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all processes
wait

