#!/usr/bin/env bash
# LineraTrade AI - Complete Platform Startup Script
# Testnet Conway Configuration
set -eu

# Port Configuration
FAUCET_PORT=8080
LINERA_SERVICE_PORT=8081
BACKEND_PORT=3001
FRONTEND_PORT=3000
LINERA_MAX_PENDING_MESSAGES=100

# Testnet Conway Configuration
LINERA_NETWORK="testnet-conway"
TESTNET_FAUCET_URL="https://faucet.testnet-conway.linera.net/"

echo "========================================="
echo "  LineraTrade AI Platform Startup"
echo "  Network: Testnet Conway"
echo "========================================="
echo ""

# Setup PATH
export PATH="$PWD/target/debug:$PATH"

# Start Linera Network (Local for development)
echo "🚀 Starting local Linera network..."
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

# Publish and create the application (match start-all.sh behaviour)
echo "🚀 Publishing Trade AI application..."

CONTRACT_WASM="target/wasm32-unknown-unknown/release/linera_trade_ai.wasm"
SERVICE_WASM="target/wasm32-unknown-unknown/release/linera_trade_ai.wasm"

if [ ! -f "$CONTRACT_WASM" ]; then
    echo "❌ WASM file not found at $CONTRACT_WASM"
    exit 1
fi

DEPLOY_OUTPUT=$(linera --wait-for-outgoing-messages publish-and-create \
  "$CONTRACT_WASM" \
  "$SERVICE_WASM" 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Application deployment failed"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

# Prefer the hash on a line mentioning "application" (app id), falling back
# to the last 64-char hash if format changes.
TRADE_AI_APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -i "application" | grep -oE '[0-9a-f]{64}' | head -n 1 || true)
if [ -z "$TRADE_AI_APP_ID" ]; then
  TRADE_AI_APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -oE '[0-9a-f]{64}' | tail -n 1)
fi

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
# Linera Configuration - Testnet Conway
LINERA_NETWORK=$LINERA_NETWORK
LINERA_FAUCET_URL=$TESTNET_FAUCET_URL
LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
LINERA_RPC_URL=http://localhost:$LINERA_SERVICE_PORT
LINERA_APP_ID=$TRADE_AI_APP_ID
LINERA_CHAIN_ID=$DEFAULT_CHAIN_ID

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lineratrade
DB_USER=admin
DB_PASSWORD=password

# API Configuration
PORT=$BACKEND_PORT
FRONTEND_URL=http://localhost:$FRONTEND_PORT

# DEX Configuration
RAYDIUM_API_URL=https://transaction-v1.raydium.io
RAYDIUM_PRIORITY_FEE_URL=https://api-v3.raydium.io/main/auto-fee
JUPITER_API_URL=https://quote-api.jup.ag/v6
JUPITER_API_KEY=bcdb9c6b-a590-4fad-b4d4-06990836d9f0
BINANCE_API_URL=https://api.binance.com

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
EOF

echo "✅ Backend environment configured"
echo ""

# Configure Frontend Environment
echo "⚙️  Configuring frontend environment..."
cat > frontend/.env.local << EOF
NEXT_PUBLIC_LINERA_APP_ID=$TRADE_AI_APP_ID
NEXT_PUBLIC_LINERA_CHAIN_ID=$DEFAULT_CHAIN_ID
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
NEXT_PUBLIC_LINERA_NETWORK=$LINERA_NETWORK
NEXT_PUBLIC_LINERA_FAUCET_URL=$TESTNET_FAUCET_URL
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_WS_URL=http://localhost:$BACKEND_PORT
EOF

echo "✅ Frontend environment configured"
echo ""

# Detect if running inside WSL; if so, skip Node install/dev servers and
# let Windows host run frontend/backend using the generated .env files.
IS_WSL=0
if grep -qi microsoft /proc/version 2>/dev/null; then
  IS_WSL=1
fi

if [ "$IS_WSL" -eq 1 ]; then
  echo "ℹ️ Detected WSL environment."
  echo "   Skipping Node dependency install and dev servers to avoid"
  echo "   cross-OS node_modules issues."
  echo ""
  echo "Next steps (run in Windows PowerShell):"
  echo "  1) cd backend  && npm run dev"
  echo "  2) cd frontend && npm run dev"
  echo ""
  echo "Configuration:"
  echo "  Chain ID:  $DEFAULT_CHAIN_ID"
  echo "  App ID:    $TRADE_AI_APP_ID"
  echo "  Linera GraphQL: http://localhost:$LINERA_SERVICE_PORT"
  echo "  Faucet:         http://localhost:$FAUCET_PORT"
  exit 0
fi

# Native Linux flow: install deps and start dev servers here

echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

echo "🚀 Starting backend server on port $BACKEND_PORT..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend server started with PID $BACKEND_PID"
cd ..
sleep 5

echo "🚀 Starting frontend server on port $FRONTEND_PORT..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend server started with PID $FRONTEND_PID"
cd ..
sleep 10

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
