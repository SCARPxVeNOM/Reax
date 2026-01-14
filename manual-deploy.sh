#!/usr/bin/env bash
# Manual Deployment Script for Testnet Conway
# Use this if the automated script gets stuck

set -e

echo "========================================="
echo "  Manual Testnet Conway Deployment"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTNET_FAUCET="https://faucet.testnet-conway.linera.net/"

echo -e "${BLUE}This script will guide you through manual deployment${NC}"
echo ""

# Step 1: Get default chain from wallet
echo -e "${YELLOW}Step 1: Getting default chain from wallet...${NC}"
WALLET_OUTPUT=$(linera wallet show 2>&1)

# Extract the default chain (the one with DEFAULT tag)
CHAIN_ID=$(echo "$WALLET_OUTPUT" | grep -B 1 "DEFAULT" | grep "Chain ID:" | grep -oP '[a-f0-9]{64}')

if [ -z "$CHAIN_ID" ]; then
    echo -e "${RED}❌ No default chain found${NC}"
    echo "Please run: linera wallet show"
    echo "And manually set a default chain with: linera wallet set-default-chain CHAIN_ID"
    exit 1
fi

echo -e "${GREEN}✅ Using default chain: $CHAIN_ID${NC}"
echo ""

# Step 2: Verify default chain is set
echo -e "${YELLOW}Step 2: Verifying default chain...${NC}"
if echo "$WALLET_OUTPUT" | grep -q "DEFAULT"; then
    echo -e "${GREEN}✅ Default chain is properly set${NC}"
else
    echo -e "${YELLOW}Setting default chain explicitly...${NC}"
    linera wallet set-default-chain $CHAIN_ID
    echo -e "${GREEN}✅ Default chain set${NC}"
fi
echo ""

# Step 3: Check balance
echo -e "${YELLOW}Step 3: Checking balance...${NC}"
BALANCE=$(linera query-balance 2>&1)
echo "$BALANCE"
echo ""

# Step 4: Build application
echo -e "${YELLOW}Step 4: Building application...${NC}"
cd linera-app

echo "Building for WASM target..."
cargo build --release --target wasm32-unknown-unknown

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""

# Step 5: Deploy with verbose logging
echo -e "${YELLOW}Step 5: Deploying to Testnet Conway...${NC}"
echo -e "${BLUE}This may take 5-15 minutes on testnet. Please be patient...${NC}"
echo ""

# Deploy with timeout and verbose output
timeout 900 linera --wait-for-outgoing-messages project publish-and-create . trade-ai 2>&1 | tee deploy-output.log

DEPLOY_EXIT_CODE=${PIPESTATUS[0]}

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    # Extract Application ID from output
    APP_ID=$(grep -oP '(?<=Application ID: )[a-f0-9]+' deploy-output.log | head -n 1)
    
    if [ -z "$APP_ID" ]; then
        # Try alternative extraction
        APP_ID=$(head -n 1 deploy-output.log | grep -oP '[a-f0-9]{64}')
    fi
    
    if [ -z "$APP_ID" ]; then
        echo -e "${YELLOW}⚠️  Could not auto-extract Application ID${NC}"
        echo -e "${YELLOW}Please check deploy-output.log for the Application ID${NC}"
        echo ""
        echo "Deployment output saved to: deploy-output.log"
        exit 0
    fi
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📋 Configuration Details:${NC}"
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

1. **Start Linera Service**:
   \`\`\`bash
   linera service --port 8081
   \`\`\`

2. **Start Backend** (new terminal):
   \`\`\`bash
   cd backend
   npm run dev
   \`\`\`

3. **Start Frontend** (new terminal):
   \`\`\`bash
   cd frontend
   npm run dev
   \`\`\`

4. **Access Platform**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Linera GraphQL: http://localhost:8081

## Verify Deployment

\`\`\`bash
# Check application
linera query-application $APP_ID

# Check balance
linera query-balance --chain $CHAIN_ID
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
    echo "4. Access platform:"
    echo -e "   ${GREEN}http://localhost:3000${NC}"
    echo ""
    
elif [ $DEPLOY_EXIT_CODE -eq 124 ]; then
    echo ""
    echo -e "${RED}❌ Deployment timed out after 15 minutes${NC}"
    echo -e "${YELLOW}This might be due to testnet congestion${NC}"
    echo ""
    echo "Try again later or check testnet status"
    exit 1
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check deploy-output.log for details"
    exit 1
fi
