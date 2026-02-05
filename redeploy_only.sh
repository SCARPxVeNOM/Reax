#!/bin/bash
set -e

# Configuration
LINERA_SERVICE_PORT=8081
BACKEND_PORT=3003
FAUCET_URL="https://faucet.testnet-conway.linera.net/"
LINERA_TMP_DIR="${TMPDIR:-/tmp}/linera_testnet"
LINERA_MAX_PENDING_MESSAGES=100

# Export Path for Cargo
export PATH="$HOME/.cargo/bin:$PWD/target/debug:$PATH"

# Ensure dirs exist
mkdir -p "$LINERA_TMP_DIR"

# Export Wallet Config
export LINERA_WALLET_1="$LINERA_TMP_DIR/wallet_1.json"
export LINERA_STORAGE_1="rocksdb:$LINERA_TMP_DIR/client_1.db"

echo "========================================="
echo "  Redeploying Linera Application"
echo "========================================="

# Helper to kill port
kill_port() {
    local port=$1
    echo "Killing process on port $port..."
    fuser -k ${port}/tcp 2>/dev/null || true
    sleep 2
}

# 1. Stop Linera Service (to unlock DB)
kill_port $LINERA_SERVICE_PORT

# 2. Go to app dir
cd linera-app

echo "Deploying application..."
# Deploy (compiles and publishes)
DEPLOY_OUTPUT=$(linera --with-wallet 1 --wait-for-outgoing-messages project publish-and-create . trade-ai 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Deployment Failed!"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo "Deployment Successful."
# echo "$DEPLOY_OUTPUT" # Too verbose

# Extract App ID
APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP '[0-9a-f]{64}' | head -n 1)

if [ -z "$APP_ID" ]; then
    echo "Error: Could not extract Application ID from output."
    exit 1
fi

echo "✅ App ID: $APP_ID"

# Get Chain ID 
CHAIN_INFO=$(linera --with-wallet 1 wallet show 2>&1)
CHAIN_ID=$(echo "$CHAIN_INFO" | grep -oP '[0-9a-f]{64}' | head -n 1)

if [ -z "$CHAIN_ID" ]; then
    echo "Error: Could not determine Chain ID."
    exit 1
fi

echo "✅ Chain ID: $CHAIN_ID"

cd ..

# 3. Update configuration files
echo "Updating configuration files..."

# Update frontend/.env.local
cat > frontend/.env.local << EOF
NEXT_PUBLIC_LINERA_APP_ID=$APP_ID
NEXT_PUBLIC_LINERA_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
NEXT_PUBLIC_LINERA_NETWORK=testnet-conway
NEXT_PUBLIC_LINERA_FAUCET_URL=$FAUCET_URL
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_WS_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_BACKEND_PORT=$BACKEND_PORT
EOF

# Update backend/.env.local
cat > backend/.env.local << EOF
LINERA_NETWORK=testnet-conway
LINERA_FAUCET_URL=$FAUCET_URL
LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
LINERA_RPC_URL=http://localhost:$LINERA_SERVICE_PORT
LINERA_APP_ID=$APP_ID
LINERA_CHAIN_ID=$CHAIN_ID
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lineratrade
DB_USER=admin
DB_PASSWORD=password
PORT=3003
FRONTEND_URL=http://localhost:3000
RAYDIUM_API_URL=https://transaction-v1.raydium.io
RAYDIUM_PRIORITY_FEE_URL=https://api-v3.raydium.io/main/auto-fee
JUPITER_API_URL=https://api.jup.ag
JUPITER_ULTRA_API_URL=https://api.jup.ag/ultra
JUPITER_API_KEY=
BINANCE_API_URL=https://api.binance.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
EOF

# 4. Restart Linera Service
echo "Restarting Linera Service..."
nohup linera --max-pending-message-bundles $LINERA_MAX_PENDING_MESSAGES --with-wallet 1 service --port $LINERA_SERVICE_PORT > linera-service.log 2>&1 &
LINERA_PID=$!
sleep 3

if ps -p $LINERA_PID > /dev/null; then
    echo "✅ Linera service started (PID: $LINERA_PID)"
else
    echo "❌ Linera service failed to start"
    tail -n 20 linera-service.log
    exit 1
fi

echo "========================================="
echo "✅ REDEPLOYMENT COMPLETE!"
echo "========================================="
echo "IMPORTANT: Please Restart your Frontend and Backend terminals manually."
