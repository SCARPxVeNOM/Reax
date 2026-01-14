#!/usr/bin/env bash
# LineraTrade AI - Complete Platform Startup Script
# This script handles everything: wallet init, deployment, and service startup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

TESTNET_FAUCET="https://faucet.testnet-conway.linera.net/"
WALLET_DIR="$HOME/.config/linera"

echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  LineraTrade AI - Complete Startup${NC}"
echo -e "${CYAN}  Network: Testnet Conway${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    netstat -tuln 2>/dev/null | grep -q ":$1 " || lsof -i ":$1" >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing process on port $port...${NC}"
    fuser -k ${port}/tcp 2>/dev/null || lsof -ti:${port} | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Check prerequisites
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if ! command_exists linera; then
    echo -e "${RED}❌ Linera CLI not found${NC}"
    echo "Please install Linera CLI first"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Please install Node.js first"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm not found${NC}"
    echo "Please install npm first"
    exit 1
fi

if ! command_exists cargo; then
    echo -e "${RED}❌ Cargo not found${NC}"
    echo "Please install Rust and Cargo first"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo ""

# Initialize or check wallet
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Wallet Initialization${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "$WALLET_DIR/wallet.json" ]; then
    echo -e "${GREEN}✅ Wallet already exists${NC}"
    WALLET_OUTPUT=$(linera wallet show 2>&1)
    echo "$WALLET_OUTPUT"
else
    echo -e "${YELLOW}Initializing new wallet with Testnet Conway faucet...${NC}"
    linera wallet init --faucet $TESTNET_FAUCET
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Wallet initialized successfully${NC}"
    else
        echo -e "${RED}❌ Wallet initialization failed${NC}"
        exit 1
    fi
fi

echo ""

# Get or request chain
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Chain Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

WALLET_OUTPUT=$(linera wallet show 2>&1)
CHAIN_ID=$(echo "$WALLET_OUTPUT" | grep -B 1 "DEFAULT" | grep "Chain ID:" | grep -oP '[a-f0-9]{64}')

if [ -z "$CHAIN_ID" ]; then
    echo -e "${YELLOW}No default chain found. Requesting new chain...${NC}"
    CHAIN_OUTPUT=$(linera wallet request-chain --faucet $TESTNET_FAUCET 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Chain requested successfully${NC}"
        CHAIN_ID=$(echo "$CHAIN_OUTPUT" | grep -oP '[a-f0-9]{64}' | head -n 1)
        echo -e "${GREEN}Chain ID: $CHAIN_ID${NC}"
    else
        echo -e "${RED}❌ Failed to request chain${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Using existing chain${NC}"
    echo -e "${GREEN}Chain ID: $CHAIN_ID${NC}"
fi

# Check balance
BALANCE=$(linera query-balance 2>&1 | tail -n 1)
echo -e "${GREEN}Balance: $BALANCE${NC}"
echo ""

# Build and deploy application
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Building & Deploying Application${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd linera-app

echo -e "${YELLOW}Building WASM bytecode...${NC}"
cargo build --release --target wasm32-unknown-unknown

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

CONTRACT_WASM="target/wasm32-unknown-unknown/release/linera_trade_ai.wasm"
SERVICE_WASM="target/wasm32-unknown-unknown/release/linera_trade_ai.wasm"

if [ ! -f "$CONTRACT_WASM" ]; then
    echo -e "${RED}❌ WASM file not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Deploying to Testnet Conway...${NC}"
echo -e "${CYAN}(This may take 5-15 minutes)${NC}"
echo ""

DEPLOY_OUTPUT=$(linera --wait-for-outgoing-messages publish-and-create \
    "$CONTRACT_WASM" \
    "$SERVICE_WASM" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -i "application" | grep -oP '[a-f0-9]{64}' | head -n 1)
    
    if [ -z "$APP_ID" ]; then
        APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP '[a-f0-9]{64}' | head -n 1)
    fi
    
    if [ -z "$APP_ID" ]; then
        APP_ID=$CHAIN_ID
    fi
    
    echo -e "${GREEN}Application ID: $APP_ID${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

cd ..
echo ""

# Update configuration files
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5: Updating Configuration Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Update frontend config
cat > frontend/.env.local << EOF
NEXT_PUBLIC_LINERA_APP_ID=$APP_ID
NEXT_PUBLIC_LINERA_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:8081
NEXT_PUBLIC_LINERA_NETWORK=testnet-conway
NEXT_PUBLIC_LINERA_FAUCET_URL=$TESTNET_FAUCET
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
EOF

echo -e "${GREEN}✅ Frontend config updated${NC}"

# Update backend config
cat > backend/.env.local << EOF
# Linera Configuration - Testnet Conway
LINERA_NETWORK=testnet-conway
LINERA_FAUCET_URL=$TESTNET_FAUCET
LINERA_SERVICE_URL=http://localhost:8081
LINERA_RPC_URL=http://localhost:8081
LINERA_APP_ID=$APP_ID
LINERA_CHAIN_ID=$CHAIN_ID

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lineratrade
DB_USER=admin
DB_PASSWORD=password

# API Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# DEX Configuration
RAYDIUM_API_URL=https://transaction-v1.raydium.io
RAYDIUM_PRIORITY_FEE_URL=https://api-v3.raydium.io/main/auto-fee
JUPITER_API_URL=https://quote-api.jup.ag/v6
JUPITER_API_KEY=bcdb9c6b-a590-4fad-b4d4-06990836d9f0
BINANCE_API_URL=https://api.binance.com

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
EOF

echo -e "${GREEN}✅ Backend config updated${NC}"
echo ""

# Clean up any existing processes
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 6: Cleaning Up Existing Processes${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if port_in_use 8081; then
    kill_port 8081
    echo -e "${GREEN}✅ Cleaned port 8081${NC}"
fi

if port_in_use 3001; then
    kill_port 3001
    echo -e "${GREEN}✅ Cleaned port 3001${NC}"
fi

if port_in_use 3000; then
    kill_port 3000
    echo -e "${GREEN}✅ Cleaned port 3000${NC}"
fi

echo ""

# Install dependencies if needed
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 7: Installing Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

echo ""

# Start services
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 8: Starting Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Start Linera service in background
echo -e "${YELLOW}Starting Linera service on port 8081...${NC}"
nohup linera service --port 8081 > linera-service.log 2>&1 &
LINERA_PID=$!
echo $LINERA_PID > .linera.pid
sleep 3

if ps -p $LINERA_PID > /dev/null; then
    echo -e "${GREEN}✅ Linera service started (PID: $LINERA_PID)${NC}"
else
    echo -e "${RED}❌ Linera service failed to start${NC}"
    cat linera-service.log
    exit 1
fi

# Start backend in background
echo -e "${YELLOW}Starting backend on port 3001...${NC}"
cd backend
nohup npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../.backend.pid
cd ..
sleep 5

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    cat backend.log
    exit 1
fi

# Start frontend in background
echo -e "${YELLOW}Starting frontend on port 3000...${NC}"
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid
cd ..
sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    cat frontend.log
    exit 1
fi

echo ""

# Final summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 PLATFORM STARTED SUCCESSFULLY!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📋 Platform Information:${NC}"
echo -e "   Chain ID:       ${YELLOW}$CHAIN_ID${NC}"
echo -e "   Application ID: ${YELLOW}$APP_ID${NC}"
echo -e "   Network:        ${YELLOW}Testnet Conway${NC}"
echo ""
echo -e "${CYAN}🌐 Access Points:${NC}"
echo -e "   Frontend:       ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API:    ${GREEN}http://localhost:3001${NC}"
echo -e "   Linera GraphQL: ${GREEN}http://localhost:8081${NC}"
echo ""
echo -e "${CYAN}📊 Service Status:${NC}"
echo -e "   Linera Service: ${GREEN}Running${NC} (PID: $LINERA_PID)"
echo -e "   Backend:        ${GREEN}Running${NC} (PID: $BACKEND_PID)"
echo -e "   Frontend:       ${GREEN}Running${NC} (PID: $FRONTEND_PID)"
echo ""
echo -e "${CYAN}📝 Log Files:${NC}"
echo -e "   Linera:  ${YELLOW}linera-service.log${NC}"
echo -e "   Backend: ${YELLOW}backend.log${NC}"
echo -e "   Frontend: ${YELLOW}frontend.log${NC}"
echo ""
echo -e "${CYAN}🛑 To Stop All Services:${NC}"
echo -e "   ${YELLOW}bash stop-all.sh${NC}"
echo ""
echo -e "${CYAN}🔍 To View Logs:${NC}"
echo -e "   ${YELLOW}tail -f linera-service.log${NC}"
echo -e "   ${YELLOW}tail -f backend.log${NC}"
echo -e "   ${YELLOW}tail -f frontend.log${NC}"
echo ""
echo -e "${GREEN}✨ Your LineraTrade AI platform is now live!${NC}"
echo ""
