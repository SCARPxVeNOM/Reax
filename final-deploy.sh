#!/usr/bin/env bash
# Final Working Deployment Script for Testnet Conway
set -e

echo "========================================="
echo "  LineraTrade AI - Final Deployment"
echo "  Network: Testnet Conway"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTNET_FAUCET="https://faucet.testnet-conway.linera.net/"

# Get default chain
echo -e "${YELLOW}Step 1: Getting default chain...${NC}"
WALLET_OUTPUT=$(linera wallet show 2>&1)
CHAIN_ID=$(echo "$WALLET_OUTPUT" | grep -B 1 "DEFAULT" | grep "Chain ID:" | grep -oP '[a-f0-9]{64}')

if [ -z "$CHAIN_ID" ]; then
    echo -e "${RED}❌ No default chain found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using chain: $CHAIN_ID${NC}"
echo ""

# Check balance
echo -e "${YELLOW}Step 2: Checking balance...${NC}"
BALANCE=$(linera query-balance 2>&1 | tail -n 1)
echo "Balance: $BALANCE"
echo ""

# Build application
echo -e "${YELLOW}Step 3: Building application...${NC}"
cd linera-app
cargo build --release --target wasm32-unknown-unknown

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Define paths
CONTRACT_WASM="target/wasm32-unknown-unknown/release/linera_trade_ai.wasm"
SERVICE_WASM="target/wasm32-unknown-unknown/release/linera_trade_ai.wasm"

# Verify files exist
if [ ! -f "$CONTRACT_WASM" ]; then
    echo -e "${RED}❌ WASM file not found: $CONTRACT_WASM${NC}"
    exit 1
fi

echo -e "${GREEN}✅ WASM bytecode found${NC}"
echo -e "   Contract: $CONTRACT_WASM"
echo -e "   Service:  $SERVICE_WASM"
echo ""

# Deploy using publish-and-create with explicit paths
echo -e "${YELLOW}Step 4: Deploying to Testnet Conway...${NC}"
echo -e "${BLUE}This may take 5-15 minutes on testnet. Please be patient...${NC}"
echo ""

DEPLOY_OUTPUT=$(linera --wait-for-outgoing-messages publish-and-create \
    "$CONTRACT_WASM" \
    "$SERVICE_WASM" 2>&1 | tee deploy-output.log)

DEPLOY_EXIT_CODE=${PIPESTATUS[0]}

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    # Extract Application ID
    APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -i "application" | grep -oP '[a-f0-9]{64}' | head -n 1)
    
    if [ -z "$APP_ID" ]; then
        # Try alternative patterns
        APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP '(?i)app.*?[a-f0-9]{64}' | grep -oP '[a-f0-9]{64}' | head -n 1)
    fi
    
    if [ -z "$APP_ID" ]; then
        echo -e "${YELLOW}⚠️  Could not auto-extract Application ID${NC}"
        echo -e "${YELLOW}Please check deploy-output.log for the Application ID${NC}"
        echo ""
        echo "Deployment output:"
        cat deploy-output.log
        echo ""
        echo -e "${YELLOW}Please manually extract the Application ID and update config files${NC}"
        exit 0
    fi
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📋 Deployment Details:${NC}"
    echo -e "Chain ID:       ${GREEN}$CHAIN_ID${NC}"
    echo -e "Application ID: ${GREEN}$APP_ID${NC}"
    echo -e "Network:        ${GREEN}Testnet Conway${NC}"
    echo ""
    
    # Update configuration files
    cd ..
    
    echo -e "${YELLOW}⚙️  Updating configuration files...${NC}"
    
    # Update frontend
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_LINERA_APP_ID=$APP_ID
NEXT_PUBLIC_LINERA_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_LINERA_SERVICE_URL=http://localhost:8081
NEXT_PUBLIC_LINERA_NETWORK=testnet-conway
NEXT_PUBLIC_LINERA_FAUCET_URL=$TESTNET_FAUCET
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
EOF
    
    # Update backend
    cat > backend/.env.local << EOF
# Linera Configuration - Testnet Conway
LINERA_NETWORK=testnet-conway
LINERA_FAUCET_URL=$TESTNET_FAUCET
LINERA_SERVICE_URL=http://localhost:8081
LINERA_APP_ID=$APP_ID
LINERA_CHAIN_ID=$CHAIN_ID

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lineratrade
DB_USER=admin
DB_PASSWORD=password

# API Configuration
API_PORT=3001
FRONTEND_URL=http://localhost:3000

# DEX Configuration
RAYDIUM_API_URL=https://api.raydium.io
JUPITER_API_URL=https://quote-api.jup.ag/v6
BINANCE_API_URL=https://api.binance.com

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
EOF
    
    echo -e "${GREEN}✅ Configuration files updated${NC}"
    echo ""
    
    # Create deployment record
    cat > TESTNET_DEPLOYMENT.md << EOF
# 🌐 Testnet Conway Deployment

**Date**: $(date)
**Status**: ✅ Deployed Successfully

## Deployment Details

- **Network**: Testnet Conway
- **Chain ID**: \`$CHAIN_ID\`
- **Application ID**: \`$APP_ID\`
- **Faucet**: $TESTNET_FAUCET

## GraphQL Endpoint

\`\`\`
http://localhost:8081/chains/$CHAIN_ID/applications/$APP_ID
\`\`\`

## Configuration Files Updated

- ✅ \`frontend/.env.local\`
- ✅ \`backend/.env.local\`

## Next Steps

### 1. Start Linera Service

\`\`\`bash
linera service --port 8081
\`\`\`

Keep this terminal open.

### 2. Start Backend (new terminal)

\`\`\`bash
cd backend
npm run dev
\`\`\`

### 3. Start Frontend (new terminal)

\`\`\`bash
cd frontend
npm run dev
\`\`\`

### 4. Access Platform

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Linera GraphQL**: http://localhost:8081

## Verify Deployment

\`\`\`bash
# Check application status
linera query-application $APP_ID

# Check balance
linera query-balance
\`\`\`

## GraphQL Query Example

\`\`\`bash
curl http://localhost:8081/chains/$CHAIN_ID/applications/$APP_ID
\`\`\`

---

**Deployed**: $(date)
**Network**: Testnet Conway
**Status**: ✅ Active
EOF
    
    echo -e "${GREEN}✅ Deployment record saved to TESTNET_DEPLOYMENT.md${NC}"
    echo ""
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 ALL DONE!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo ""
    echo "1. Start Linera Service:"
    echo -e "   ${GREEN}linera service --port 8081${NC}"
    echo ""
    echo "2. Start Backend (new terminal):"
    echo -e "   ${GREEN}cd backend && npm run dev${NC}"
    echo ""
    echo "3. Start Frontend (new terminal):"
    echo -e "   ${GREEN}cd frontend && npm run dev${NC}"
    echo ""
    echo "4. Access your platform:"
    echo -e "   ${GREEN}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}📄 Full details in: TESTNET_DEPLOYMENT.md${NC}"
    echo ""
    
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check deploy-output.log for details:"
    cat deploy-output.log
    exit 1
fi
