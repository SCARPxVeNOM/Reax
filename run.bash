#!/usr/bin/env bash
# LineraTrade AI - Complete Platform Startup Script
set -eu

# Port Configuration
FAUCET_PORT=8080
LINERA_SERVICE_PORT=8081
BACKEND_PORT=3001
FRONTEND_PORT=3000
LINERA_MAX_PENDING_MESSAGES=100

echo "========================================="
echo "  LineraTrade AI Platform Startup"
echo "========================================="
echo ""

# Setup PATH
export PATH="$PWD/target/debug:$PATH"

# Start Linera Network
echo "🚀 Starting Linera network..."
source /dev/stdin <<<"$(linera net helper 2>/dev/null)"
linera_spawn linera net up --initial-amount 1000000000000 --with-faucet --faucet-port $FAUCET_PORT --faucet-amount 1000000000

sleep 10

# Configure Linera Wallet
FAUCET_URL=http://localhost:$FAUCET_PORT
GRAPHQL_URL=http://localhost:$LINERA_SERVICE_PORT

export LINERA_WALLET="$LINERA_TMP_DIR/wallet.json"
export LINERA_KEYSTORE="$LINERA_TMP_DIR/keystore.json"
export LINERA_STORAGE="rocksdb:$LINERA_TMP_DIR/client.db"

echo "✅ Linera network started"
echo ""

# Initialize Wallet
echo "💼 Initializing wallet..."
linera wallet init --faucet "$FAUCET_URL"
if [ $? -ne 0 ]; then
    echo "❌ Wallet initialization failed. Exiting..."
    exit 1
fi

# Open Default Chain
echo "⛓️  Opening default chain..."
DEFAULT_CHAIN=$(linera wallet request-chain --faucet "$FAUCET_URL")
mapfile -t StringArray <<< "$DEFAULT_CHAIN"
DEFAULT_CHAIN_ID=${StringArray[0]}

echo "✅ Default chain created: $DEFAULT_CHAIN_ID"
echo ""

# Sync and check balance
linera sync && linera query-balance
sleep 2

# Deploy Trade AI Application
echo "📦 Building and deploying Trade AI application..."
cd linera-app

# Build the application
cargo build --release --target wasm32-unknown-unknown
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Exiting..."
    exit 1
fi

echo "✅ Build successful"
echo ""

# Publish and create the application
echo "🚀 Publishing Trade AI application..."
TRADE_AI_APP=$(linera --wait-for-outgoing-messages project publish-and-create . trade-ai)
if [ $? -ne 0 ]; then
    echo "❌ Application deployment failed. Exiting..."
    exit 1
fi

TRADE_AI_APP_ID=$(echo "$TRADE_AI_APP" | head -n 1)

echo "✅ Trade AI application deployed: $TRADE_AI_APP_ID"
echo ""

cd ..

# Start Linera Service
echo "🌐 Starting Linera GraphQL service on port $LINERA_SERVICE_PORT..."
linera --max-pending-message-bundles $LINERA_MAX_PENDING_MESSAGES service --port $LINERA_SERVICE_PORT &
SERVICE_PID=$!
echo "✅ Linera service started with PID $SERVICE_PID"
sleep 5

# Configure Backend Environment
echo "⚙️  Configuring backend environment..."
cat > backend/.env.local << EOF
LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
LINERA_APP_ID=$TRADE_AI_APP_ID
LINERA_CHAIN_ID=$DEFAULT_CHAIN_ID

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lineratrade
DB_USER=admin
DB_PASSWORD=password

# API Configuration
API_PORT=$BACKEND_PORT
FRONTEND_URL=http://localhost:$FRONTEND_PORT

# DEX Configuration
RAYDIUM_API_URL=https://api.raydium.io
JUPITER_API_URL=https://quote-api.jup.ag/v6
BINANCE_API_URL=https://api.binance.com

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
EOF

echo "✅ Backend environment configured"
echo ""

# Configure Frontend Environment
echo "⚙️  Configuring frontend environment..."
cat > frontend/.env.local << EOF
NEXT_PUBLIC_LINERA_APP_ID=$TRADE_AI_APP_ID
NEXT_PUBLIC_LINERA_CHAIN_ID=$DEFAULT_CHAIN_ID
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
NEXT_PUBLIC_LINERA_NETWORK=local
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_WS_URL=http://localhost:$BACKEND_PORT
EOF

echo "✅ Frontend environment configured"
echo ""

# Install Backend Dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# Install Frontend Dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
fi
cd ..

# Start Backend Server
echo "🚀 Starting backend server on port $BACKEND_PORT..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend server started with PID $BACKEND_PID"
cd ..
sleep 5

# Start Frontend Server
echo "🚀 Starting frontend server on port $FRONTEND_PORT..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend server started with PID $FRONTEND_PID"
cd ..
sleep 10

# Platform Ready
echo ""
echo "========================================="
echo "  ✅ LineraTrade AI Platform READY!"
echo "========================================="
echo ""
echo "🌐 Access Points:"
echo "   Frontend:  http://localhost:$FRONTEND_PORT"
echo "   Backend:   http://localhost:$BACKEND_PORT"
echo "   Linera:    http://localhost:$LINERA_SERVICE_PORT"
echo "   Faucet:    http://localhost:$FAUCET_PORT"
echo ""
echo "📊 Configuration:"
echo "   Chain ID:  $DEFAULT_CHAIN_ID"
echo "   App ID:    $TRADE_AI_APP_ID"
echo ""
echo "🎯 Available Pages:"
echo "   Home:       http://localhost:$FRONTEND_PORT"
echo "   Trading:    http://localhost:$FRONTEND_PORT/trading"
echo "   Strategies: http://localhost:$FRONTEND_PORT/strategies"
echo "   Social:     http://localhost:$FRONTEND_PORT/social"
echo "   Microchains: http://localhost:$FRONTEND_PORT/microchains"
echo "   Analytics:  http://localhost:$FRONTEND_PORT/analytics"
echo ""
echo "========================================="
echo ""

# Keep the script running
wait
