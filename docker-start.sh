#!/usr/bin/env bash
# ================================================
# ReaX Docker Startup Script
# ================================================
# Simple script to build and run the entire platform
# ================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          ReaX Docker Startup               ║${NC}"
echo -e "${CYAN}║     Microchain Social Trading Platform     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Build and start all services
echo -e "${CYAN}📦 Building and starting all services...${NC}"
echo -e "${YELLOW}   Note: First build may take 10-20 minutes (Linera Rust compilation)${NC}"
echo ""

docker compose up --build -d

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 CONTAINERS STARTED!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}🌐 Access Points:${NC}"
echo -e "   Frontend:       ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API:    ${GREEN}http://localhost:3003${NC}"
echo -e "   Linera GraphQL: ${GREEN}http://localhost:8081${NC}"
echo ""
echo -e "${CYAN}📊 View Logs:${NC}"
echo -e "   All services:   ${YELLOW}docker compose logs -f${NC}"
echo -e "   Frontend:       ${YELLOW}docker compose logs -f frontend${NC}"
echo -e "   Backend:        ${YELLOW}docker compose logs -f backend${NC}"
echo -e "   Linera:         ${YELLOW}docker compose logs -f linera${NC}"
echo ""
echo -e "${CYAN}🛑 Stop All:${NC}"
echo -e "   ${YELLOW}docker compose down${NC}"
echo ""
echo -e "${CYAN}🔄 Rebuild:${NC}"
echo -e "   ${YELLOW}docker compose up --build${NC}"
echo ""
