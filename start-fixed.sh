#!/bin/bash
# LineraTrade AI - Fixed Startup Script for WSL
# This script fixes esbuild issues and starts all services

echo "🚀 Starting LineraTrade AI (WSL Fixed Version)..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in WSL
if [ -f /proc/version ] && grep -qi microsoft /proc/version; then
    echo -e "${CYAN}🐧 Detected WSL environment${NC}"
    
    # Check if node_modules exists and might have Windows binaries
    if [ -d "node_modules" ] && [ -d "node_modules/@esbuild" ]; then
        if [ -d "node_modules/@esbuild/win32-x64" ] && [ ! -d "node_modules/@esbuild/linux-x64" ]; then
            echo -e "${YELLOW}⚠️  Detected Windows esbuild binaries in WSL${NC}"
            echo -e "${YELLOW}📦 Fixing dependencies for Linux...${NC}"
            
            # Remove node_modules
            rm -rf node_modules
            rm -rf backend/node_modules frontend/node_modules ingestion/node_modules relayer/node_modules parser/node_modules 2>/dev/null
            rm -f package-lock.json
            
            # Reinstall
            echo -e "${CYAN}   Installing dependencies (this may take a few minutes)...${NC}"
            npm install
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Dependencies fixed!${NC}"
            else
                echo -e "${RED}❌ Failed to install dependencies${NC}"
                exit 1
            fi
        fi
    fi
fi

# Check if Docker is running
echo -e "\n${YELLOW}📦 Checking Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Fix Docker network if needed
echo -e "\n${YELLOW}🐳 Setting up Docker services...${NC}"
docker network rm lineratrade-network 2>/dev/null || true
docker-compose up -d postgres redis

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check if services are up
if docker ps | grep -q "lineratrade-postgres" && docker ps | grep -q "lineratrade-redis"; then
    echo -e "${GREEN}✅ Database services are ready${NC}"
else
    echo -e "${YELLOW}⚠️  Services may still be starting...${NC}"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "\n${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file with your configuration.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .env file found${NC}"

# Check if Linera network is running
echo -e "\n${YELLOW}🔗 Checking Linera network...${NC}"
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Linera network is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Linera network not accessible at http://localhost:8080${NC}"
    echo -e "${YELLOW}   (Optional - not required for basic functionality)${NC}"
fi

# Start all Node.js services
echo -e "\n${YELLOW}🎯 Starting Node.js services...${NC}"
echo -e "${CYAN}   Backend: http://localhost:3001${NC}"
echo -e "${CYAN}   Frontend: http://localhost:3000${NC}"
echo -e "${CYAN}   Ingestion: Monitoring @Crypto_Arki and @OverTradess${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Use the existing npm script which uses concurrently
npm run dev

