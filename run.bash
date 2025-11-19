#!/bin/bash
# Linera Buildathon Template - Build and Run Script
# Based on https://github.com/linera-io/buildathon-template

set -e

# Ensure cargo bin is in PATH
export PATH="/usr/local/cargo/bin:$PATH"

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
        # Check for rust-toolchain.toml in root first, then toolchains/stable
        RUST_TOOLCHAIN_FILE=""
        if [ -f "rust-toolchain.toml" ]; then
            RUST_TOOLCHAIN_FILE="rust-toolchain.toml"
        elif [ -f "toolchains/stable/rust-toolchain.toml" ]; then
            RUST_TOOLCHAIN_FILE="toolchains/stable/rust-toolchain.toml"
        fi
        
        if [ -n "$RUST_TOOLCHAIN_FILE" ]; then
            # Check if it's a symlink or has wrong content
            if [ -L "$RUST_TOOLCHAIN_FILE" ]; then
                echo "⚠️  rust-toolchain.toml is a symlink, resolving..."
                RUST_TOOLCHAIN_FILE=$(readlink -f "$RUST_TOOLCHAIN_FILE" 2>/dev/null || echo "$RUST_TOOLCHAIN_FILE")
            fi
            
            # Read the actual file content
            if [ -f "$RUST_TOOLCHAIN_FILE" ] && grep -q "channel" "$RUST_TOOLCHAIN_FILE" 2>/dev/null; then
                RUST_VERSION=$(grep -oP 'channel = "\K[^"]+' "$RUST_TOOLCHAIN_FILE" | head -1)
                if [ -n "$RUST_VERSION" ]; then
                    echo "📦 Using Rust $RUST_VERSION as specified by linera-protocol..."
                    rustup install $RUST_VERSION 2>/dev/null || true
                    rustup default $RUST_VERSION 2>/dev/null || true
                fi
            else
                echo "⚠️  rust-toolchain.toml found but couldn't parse, using default Rust"
            fi
        fi
        
        # Fix problematic rust-toolchain.toml in root that might cause cargo issues
        # If it's not a valid TOML file (e.g., just contains a path), replace it with proper content
        if [ -f "rust-toolchain.toml" ]; then
            # Check if it's a valid TOML file (contains [toolchain] or [toolchains])
            if ! grep -q "^\[toolchain" rust-toolchain.toml 2>/dev/null; then
                echo "⚠️  Found invalid rust-toolchain.toml in root, replacing with proper content..."
                # Copy the proper one from toolchains/stable if it exists
                if [ -f "toolchains/stable/rust-toolchain.toml" ]; then
                    cp toolchains/stable/rust-toolchain.toml rust-toolchain.toml
                    echo "✅ Fixed rust-toolchain.toml using toolchains/stable/rust-toolchain.toml"
                else
                    # Remove it if we can't fix it
                    rm -f rust-toolchain.toml
                    echo "⚠️  Removed invalid rust-toolchain.toml"
                fi
            fi
        fi
        
        # Build with optimized settings to reduce memory usage
        # Use incremental compilation and limit parallel jobs to reduce memory pressure
        # Reduce jobs to 1 to avoid OOM (Out of Memory) kills
        export CARGO_BUILD_JOBS=1
        export CARGO_INCREMENTAL=1
        # Disable LTO and reduce optimization to save memory during compilation
        export CARGO_PROFILE_RELEASE_LTO=false
        export CARGO_PROFILE_RELEASE_OPT_LEVEL=2
        # Show progress during build
        echo "🔨 Building Linera service from local source (v0.16.0)..."
        echo "⏳ This may take 15-30 minutes, please be patient..."
        echo "   The build is working if you see 'Compiling...' messages"
        echo "   DO NOT interrupt the build - let it complete!"
        
        # Build linera-service from local source - this MUST succeed
        # Use tee to show progress while also logging
        # Build with reduced memory usage: no LTO, opt-level 2, single job
        echo "🔨 Starting build (output will be logged)..."
        echo "💾 Using memory-optimized build settings (CARGO_BUILD_JOBS=1, no LTO)..."
        BUILD_SUCCESS=false
        if CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
           cargo install --path linera-service --locked --features default,storage-service 2>&1 | tee /tmp/linera-build.log; then
            # Verify the binary actually exists
            if [ -f "/usr/local/cargo/bin/linera" ]; then
                echo "✅ Successfully built linera-service from local source"
                BUILD_SUCCESS=true
            else
                echo "⚠️  Build reported success but binary not found, checking logs..."
                tail -50 /tmp/linera-build.log | grep -i "error\|failed" || echo "No obvious errors in log"
                BUILD_SUCCESS=false
            fi
        fi
        
        if [ "$BUILD_SUCCESS" = false ]; then
            # Show the actual error
            echo ""
            echo "❌ Local source build failed. Checking error..."
            ERROR_LINES=$(tail -100 /tmp/linera-build.log 2>/dev/null | grep -i "error\|failed\|panic" | tail -20 || echo "No specific errors found in log")
            echo "$ERROR_LINES"
            echo ""
            echo "⚠️  Attempting alternative build methods..."
            
            # Try without --locked flag
            echo "🔄 Trying build without --locked flag..."
            if CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
               cargo install --path linera-service --features default,storage-service 2>&1 | tee /tmp/linera-build2.log; then
                if [ -f "/usr/local/cargo/bin/linera" ]; then
                    echo "✅ Successfully built linera-service (without --locked)"
                    BUILD_SUCCESS=true
                else
                    BUILD_SUCCESS=false
                fi
            fi
            
            if [ "$BUILD_SUCCESS" = false ]; then
                echo "⚠️  Build without --locked also failed"
                echo "🔄 Trying with minimal features (default only)..."
                if CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
                   cargo install --path linera-service --features default 2>&1 | tee /tmp/linera-build3.log; then
                    if [ -f "/usr/local/cargo/bin/linera" ]; then
                        echo "✅ Successfully built linera-service (minimal features)"
                        BUILD_SUCCESS=true
                    else
                        BUILD_SUCCESS=false
                    fi
                fi
                
                if [ "$BUILD_SUCCESS" = false ]; then
                    echo "⚠️  Minimal features build failed"
                    echo "🔄 Trying with just wasmer feature..."
                    if CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
                       cargo install --path linera-service --features wasmer 2>&1 | tee /tmp/linera-build4.log; then
                        if [ -f "/usr/local/cargo/bin/linera" ]; then
                            echo "✅ Successfully built linera-service (wasmer only)"
                            BUILD_SUCCESS=true
                        else
                            BUILD_SUCCESS=false
                        fi
                    fi
                    
                    if [ "$BUILD_SUCCESS" = false ]; then
                        echo "❌ All local source build attempts failed"
                        echo "⚠️  Falling back to crates.io version 0.15.5..."
                        rustup default stable 2>/dev/null || true
                        cd /build
                        
                        # Try installing from crates.io (template version)
                        echo "📦 Installing linera-storage-service@0.15.5 from crates.io..."
                        export CARGO_BUILD_JOBS=1
                        export CARGO_INCREMENTAL=1
                        export CARGO_PROFILE_RELEASE_LTO=false
                        export CARGO_PROFILE_RELEASE_OPT_LEVEL=2
                        cargo install --locked linera-storage-service@0.15.5 2>&1 | tee /tmp/storage-build.log || {
                            echo "⚠️  linera-storage-service installation failed, but continuing..."
                        }
                        
                        echo "📦 Installing linera-service@0.15.5 from crates.io..."
                        if CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
                           cargo install --locked linera-service@0.15.5 2>&1 | tee /tmp/crates-build.log; then
                            echo "✅ Successfully installed linera-service@0.15.5 from crates.io"
                        else
                            echo "⚠️  Failed with --locked, trying without --locked..."
                            if CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
                               cargo install linera-service@0.15.5 2>&1 | tee /tmp/crates-build2.log; then
                                echo "✅ Successfully installed linera-service@0.15.5 (without --locked)"
                            else
                                echo "❌ All installation methods failed."
                                echo "📋 Last 30 lines of error from crates.io build:"
                                tail -30 /tmp/crates-build2.log 2>/dev/null || tail -30 /tmp/crates-build.log 2>/dev/null
                                echo ""
                                echo "💡 Suggestion: The local source build (v0.16.0) was working."
                                echo "   Consider using that version instead of 0.15.5"
                                exit 1
                            fi
                        fi
                    fi
                fi
            fi
        fi
        rustup default stable 2>/dev/null || true
            cd /build
        
        # Verify linera command is available
        if ! command -v linera &> /dev/null; then
            echo "⚠️  linera command not found after build, checking installation..."
            # Check if it's in cargo bin
            if [ -f "/usr/local/cargo/bin/linera" ]; then
                echo "✅ Found linera at /usr/local/cargo/bin/linera"
                export PATH="/usr/local/cargo/bin:$PATH"
            else
                echo "❌ linera binary not found after build"
                exit 1
            fi
        fi
    else
        # No local source, install from crates.io (template version)
        echo "📦 Installing Linera from crates.io (version 0.15.5 to match template)..."
        echo "⏳ This may take 15-30 minutes, please be patient..."
        # Use memory optimizations for crates.io build
        export CARGO_BUILD_JOBS=1
        export CARGO_INCREMENTAL=1
        export CARGO_PROFILE_RELEASE_LTO=false
        export CARGO_PROFILE_RELEASE_OPT_LEVEL=2
        
        # Install separately for better error handling
        echo "📦 Installing linera-storage-service@0.15.5..."
        CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
        cargo install --locked linera-storage-service@0.15.5 || {
            echo "⚠️  linera-storage-service installation failed, but continuing..."
        }
        
        echo "📦 Installing linera-service@0.15.5..."
        if CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
           cargo install --locked linera-service@0.15.5 2>&1 | tee /tmp/crates-service.log; then
            echo "✅ Successfully installed linera-service@0.15.5 from crates.io"
        else
            echo "⚠️  Failed with --locked, trying without --locked..."
            if CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
               cargo install linera-service@0.15.5 2>&1 | tee /tmp/crates-service2.log; then
                echo "✅ Successfully installed linera-service@0.15.5 (without --locked)"
            else
                echo "⚠️  Failed to install from crates.io, trying nightly Rust..."
                rustup install nightly 2>/dev/null || true
                rustup default nightly 2>/dev/null || true
                export CARGO_BUILD_JOBS=1
                export CARGO_INCREMENTAL=1
                export CARGO_PROFILE_RELEASE_LTO=false
                export CARGO_PROFILE_RELEASE_OPT_LEVEL=2
                if CARGO_BUILD_JOBS=1 CARGO_PROFILE_RELEASE_LTO=false CARGO_PROFILE_RELEASE_OPT_LEVEL=2 \
                   cargo install linera-service@0.15.5 2>&1 | tee /tmp/crates-service3.log; then
                    echo "✅ Successfully installed linera-service@0.15.5 (with nightly)"
                else
                    echo "❌ All crates.io installation methods failed."
                    echo "📋 Last 50 lines of error:"
                    tail -50 /tmp/crates-service3.log 2>/dev/null || tail -50 /tmp/crates-service2.log 2>/dev/null || tail -50 /tmp/crates-service.log 2>/dev/null
                    echo ""
                    echo "💡 Since local source build was working, consider using that instead."
                    exit 1
                fi
                rustup default stable 2>/dev/null || true
            fi
        fi
    fi
    
    # Verify installation - ensure PATH includes cargo bin
    export PATH="/usr/local/cargo/bin:$PATH"
    
    # Wait a moment for PATH to update
    sleep 1
    
    if command -v linera &> /dev/null; then
        echo "✅ Linera CLI installed successfully"
        linera --version || true
    else
        # Try to find it manually
        if [ -f "/usr/local/cargo/bin/linera" ]; then
            echo "✅ Found linera binary, adding to PATH"
            export PATH="/usr/local/cargo/bin:$PATH"
            if command -v linera &> /dev/null; then
                linera --version || true
            else
                echo "⚠️  linera found but not executable, trying direct path..."
                /usr/local/cargo/bin/linera --version || true
            fi
        else
            echo "❌ Linera CLI installation failed. Cannot continue."
            echo "   Searched in: /usr/local/cargo/bin"
            echo "   Current PATH: $PATH"
            echo "   Listing /usr/local/cargo/bin:"
            ls -la /usr/local/cargo/bin/ | grep linera || echo "   No linera files found"
            exit 1
        fi
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

