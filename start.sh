#!/bin/bash
# LineraTrade AI - Unified Startup Script for Linux/WSL
# This script starts all services with one command

echo "🚀 Starting LineraTrade AI..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "\n${YELLOW}📦 Checking Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Start Docker services (PostgreSQL, Redis)
echo -e "\n${YELLOW}🐳 Starting PostgreSQL and Redis...${NC}"
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
    echo -e "${YELLOW}   Starting Linera network in background...${NC}"
    # Start Linera network in background
    (cd /mnt/c/Users/aryan/Desktop/MCP && linera net up --with-faucet --faucet-port 8080 > /tmp/linera.log 2>&1 &)
    echo -e "${CYAN}   Linera network starting... (check /tmp/linera.log for logs)${NC}"
    sleep 10
fi

# Install dependencies if node_modules don't exist
if [ ! -d "node_modules" ]; then
    echo -e "\n${YELLOW}📥 Installing dependencies...${NC}"
    npm install
fi

# Start all Node.js services
echo -e "\n${YELLOW}🎯 Starting Node.js services...${NC}"
echo -e "${CYAN}   Backend: http://localhost:3001${NC}"
echo -e "${CYAN}   Frontend: http://localhost:3000${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Use the existing npm script which uses concurrently
npm run dev

