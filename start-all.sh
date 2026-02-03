#!/usr/bin/env bash
# LineraTrade AI - Complete Platform Startup Script
# This script handles everything: wallet init, deployment, and service startup


set -eu

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Port Configuration
LINERA_SERVICE_PORT=8081
BACKEND_PORT=3003
FRONTEND_PORT=3000
LINERA_MAX_PENDING_MESSAGES=100

# Add cargo bin directory to PATH (where linera is installed)
export PATH="$HOME/.cargo/bin:$PWD/target/debug:$PATH"

# -----------------------------------------------------------------------------------------------------------------
# Connect to Testnet Conway 
# -----------------------------------------------------------------------------------------------------------------

# Use Testnet Conway faucet
FAUCET_URL="https://faucet.testnet-conway.linera.net/"
GRAPHQL_URL="http://localhost:$LINERA_SERVICE_PORT"

# Set temporary directory for wallets and storage 
if [ -z "${LINERA_TMP_DIR:-}" ]; then
  export LINERA_TMP_DIR="${TMPDIR:-/tmp}/linera_testnet"
  mkdir -p "$LINERA_TMP_DIR"
fi

# Export wallet variables for wallet 1 
export LINERA_WALLET_1="$LINERA_TMP_DIR/wallet_1.json"
export LINERA_KEYSTORE_1="$LINERA_TMP_DIR/keystore_1.json"
export LINERA_STORAGE_1="rocksdb:$LINERA_TMP_DIR/client_1.db"

echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  LineraTrade AI - Complete Startup${NC}"
echo -e "${CYAN}  Network: Testnet Conway${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "${CYAN}Connecting to Testnet Conway at $FAUCET_URL${NC}"
echo -e "${CYAN}Using temporary directory: $LINERA_TMP_DIR${NC}"
echo ""

# ----------------------------------------------------------
# [FUNCTION] Check if a command exists
# ----------------------------------------------------------
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ----------------------------------------------------------
# [FUNCTION] Check if a port is in use
# ----------------------------------------------------------
port_in_use() {
    netstat -tuln 2>/dev/null | grep -q ":$1 " || lsof -i ":$1" >/dev/null 2>&1
}

# ----------------------------------------------------------
# [FUNCTION] Kill process on port
# ----------------------------------------------------------
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing process on port $port...${NC}"
    fuser -k ${port}/tcp 2>/dev/null || lsof -ti:${port} | xargs kill -9 2>/dev/null || true
    sleep 1
}

# ----------------------------------------------------------
# [FUNCTION] Initiate New Wallet from Faucet 
# ----------------------------------------------------------
initiate_new_wallet_from_faucet() {
  # Ensure Wallet_Number is passed as the first argument
  if [ -z "$1" ]; then
    echo "Error: Missing required parameter <Wallet_Number>. Usage: initiate_new_wallet_from_faucet <Wallet_Number>"
    exit 1
  fi

  # Check if keystore already exists
  WALLET_VAR="LINERA_KEYSTORE_$1"
  KEYSTORE_PATH="${!WALLET_VAR}"
  
  if [ -f "$KEYSTORE_PATH" ]; then
    echo -e "${GREEN}Keystore for wallet $1 already exists at $KEYSTORE_PATH${NC}"
    echo -e "${GREEN}Skipping wallet initialization (using existing wallet)${NC}"
    return 0
  fi

  linera --with-wallet "$1" wallet init --faucet "$FAUCET_URL"
  if [ $? -ne 0 ]; then
      echo -e "${RED}Initiate New Wallet from Faucet failed. Exiting...${NC}"
      exit 1
  fi
  echo -e "${GREEN}✅ Wallet $1 initialized successfully${NC}"
}

# ----------------------------------------------------------
# [FUNCTION] Open Chain from Faucet 
# ----------------------------------------------------------
open_chain_from_faucet() {
  # Ensure Wallet_Number is passed as the first argument
  if [ -z "$1" ]; then
    echo "Error: Missing required parameter <Wallet_Number>. Usage: open_chain_from_faucet <Wallet_Number>"
    exit 1
  fi

  linera --with-wallet "$1" wallet request-chain --faucet "$FAUCET_URL"
  if [ $? -ne 0 ]; then
      echo -e "${RED}Open Chain from Faucet failed. Exiting...${NC}"
      exit 1
  fi
}

# -----------------------------------------------------------------------------------------------------------------
# Check prerequisites
# -----------------------------------------------------------------------------------------------------------------
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verify linera is available 
if ! command_exists linera; then
    echo -e "${RED}❌ Linera CLI not found${NC}"
    echo "Please install Linera CLI first:"
    echo "  cargo install --locked linera-service@0.15.8"
    echo "  cargo install --locked linera-storage-service@0.15.8"
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

# Version compatibility check
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1.5: Version Compatibility Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Checking Linera CLI version...${NC}"
linera --version 2>/dev/null || echo -e "${RED}Warning: Could not determine linera version${NC}"
echo ""
echo -e "${YELLOW}⏰ Important: Ensure your system clock is synchronized for testnet operations.${NC}"
echo -e "   If you encounter timestamp errors, run: ${CYAN}sudo ntpdate pool.ntp.org${NC}"
echo ""
echo -e "${YELLOW}📍 Wallet Configuration:${NC}"
echo -e "   LINERA_TMP_DIR:    ${CYAN}$LINERA_TMP_DIR${NC}"
echo -e "   LINERA_WALLET_1:   ${CYAN}$LINERA_WALLET_1${NC}"
echo -e "   LINERA_KEYSTORE_1: ${CYAN}$LINERA_KEYSTORE_1${NC}"
echo -e "   LINERA_STORAGE_1:  ${CYAN}$LINERA_STORAGE_1${NC}"
echo ""

# -----------------------------------------------------------------------------------------------------------------
# Wallet Initialization 
# -----------------------------------------------------------------------------------------------------------------
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Wallet Initialization${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Initialize wallet 1
INITIATE_WALLET_1=$(initiate_new_wallet_from_faucet 1)
echo "$INITIATE_WALLET_1"

echo ""

# -----------------------------------------------------------------------------------------------------------------
# Chain Setup 
# -----------------------------------------------------------------------------------------------------------------
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Chain Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Request default chain 
echo -e "${YELLOW}Requesting default chain from Testnet Conway faucet...${NC}"
OPEN_NEW_DEFAULT_CHAIN=$(open_chain_from_faucet 1)
mapfile -t StringArray <<< "$OPEN_NEW_DEFAULT_CHAIN"
CHAIN_ID=${StringArray[0]}

echo -e "${GREEN}✅ Default chain created: $CHAIN_ID${NC}"
echo ""

# Sync and check balance 
linera --with-wallet 1 sync && linera --with-wallet 1 query-balance
sleep 1

echo ""

# -----------------------------------------------------------------------------------------------------------------
# Build and Deploy Application ( uses project publish-and-create)
# -----------------------------------------------------------------------------------------------------------------
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: Deploying Application${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd linera-app

echo -e "${YELLOW}Deploying Trade AI application to Testnet Conway...${NC}"
echo -e "${CYAN}(Using 'project publish-and-create' which auto-builds )${NC}"
echo -e "${CYAN}(This may take 5-15 minutes)${NC}"
echo ""

# Deploy using  pattern: project publish-and-create (auto-builds and deploys)
DEPLOY_OUTPUT=$(linera --with-wallet 1 --wait-for-outgoing-messages project publish-and-create . trade-ai 2>&1)

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
    echo "$DEPLOY_OUTPUT"
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
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
NEXT_PUBLIC_LINERA_NETWORK=testnet-conway
NEXT_PUBLIC_LINERA_FAUCET_URL=$FAUCET_URL
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_WS_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_BACKEND_PORT=$BACKEND_PORT
EOF

echo -e "${GREEN}✅ Frontend config updated${NC}"

# Update backend config
cat > backend/.env.local << EOF
# Linera Configuration - Testnet Conway
LINERA_NETWORK=testnet-conway
LINERA_FAUCET_URL=$FAUCET_URL
LINERA_SERVICE_URL=http://localhost:$LINERA_SERVICE_PORT
LINERA_RPC_URL=http://localhost:$LINERA_SERVICE_PORT
LINERA_APP_ID=$APP_ID
LINERA_CHAIN_ID=$CHAIN_ID

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lineratrade
DB_USER=admin
DB_PASSWORD=password

# API Configuration
PORT=3003
FRONTEND_URL=http://localhost:3000

# DEX Configuration
RAYDIUM_API_URL=https://transaction-v1.raydium.io
RAYDIUM_PRIORITY_FEE_URL=https://api-v3.raydium.io/main/auto-fee
JUPITER_API_URL=https://api.jup.ag
JUPITER_ULTRA_API_URL=https://api.jup.ag/ultra
JUPITER_API_KEY=
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

if port_in_use 3003; then
    kill_port 3003
    echo -e "${GREEN}✅ Cleaned port 3003${NC}"
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

# Start Linera service in background (--with-wallet 1)
echo -e "${YELLOW}Starting Linera service on port $LINERA_SERVICE_PORT...${NC}"
nohup linera --max-pending-message-bundles $LINERA_MAX_PENDING_MESSAGES --with-wallet 1 service --port $LINERA_SERVICE_PORT > linera-service.log 2>&1 &
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
echo -e "${YELLOW}Starting backend on port $BACKEND_PORT...${NC}"
SCRIPT_DIR="$(pwd)"
touch /tmp/backend.log
cd backend
nohup npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > /tmp/.backend.pid
cd ..
sleep 5

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    cat /tmp/backend.log
    exit 1
fi

# Start frontend in background
echo -e "${YELLOW}Starting frontend on port 3000...${NC}"
touch /tmp/frontend.log
cd frontend
nohup npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/.frontend.pid
cd ..
sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    cat /tmp/frontend.log
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
echo -e "   Backend API:    ${GREEN}http://localhost:$BACKEND_PORT${NC}"
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
