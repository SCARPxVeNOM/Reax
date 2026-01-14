#!/usr/bin/env bash
# LineraTrade AI - Platform Status Check Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  LineraTrade AI Platform Status${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Function to check if process is running
check_process() {
    local pidfile=$1
    local service=$2
    local port=$3
    
    if [ -f "$pidfile" ]; then
        PID=$(cat "$pidfile")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${service}: ${GREEN}✅ Running${NC} (PID: $PID, Port: $port)"
            return 0
        else
            echo -e "${service}: ${RED}❌ Not Running${NC} (Stale PID file)"
            return 1
        fi
    else
        # Check by port
        if command -v lsof >/dev/null 2>&1; then
            PID=$(lsof -ti:${port} 2>/dev/null)
            if [ ! -z "$PID" ]; then
                echo -e "${service}: ${YELLOW}⚠️  Running${NC} (PID: $PID, Port: $port, No PID file)"
                return 0
            fi
        fi
        echo -e "${service}: ${RED}❌ Not Running${NC}"
        return 1
    fi
}

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    
    if command -v curl >/dev/null 2>&1; then
        if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$url" | grep -q "200\|301\|302"; then
            echo -e "${name}: ${GREEN}✅ Accessible${NC} ($url)"
            return 0
        else
            echo -e "${name}: ${RED}❌ Not Accessible${NC} ($url)"
            return 1
        fi
    else
        echo -e "${name}: ${YELLOW}⚠️  Cannot check (curl not installed)${NC}"
        return 1
    fi
}

# Check services
echo -e "${CYAN}📊 Service Status:${NC}"
echo ""

check_process ".linera.pid" "Linera Service" "8081"
LINERA_STATUS=$?

check_process ".backend.pid" "Backend Server" "3001"
BACKEND_STATUS=$?

check_process ".frontend.pid" "Frontend App " "3000"
FRONTEND_STATUS=$?

echo ""

# Check URLs
echo -e "${CYAN}🌐 Endpoint Status:${NC}"
echo ""

check_url "http://localhost:8081" "Linera GraphQL"
check_url "http://localhost:3001" "Backend API   "
check_url "http://localhost:3000" "Frontend UI   "

echo ""

# Check configuration
echo -e "${CYAN}⚙️  Configuration:${NC}"
echo ""

if [ -f "frontend/.env.local" ]; then
    CHAIN_ID=$(grep "NEXT_PUBLIC_LINERA_CHAIN_ID" frontend/.env.local | cut -d'=' -f2)
    APP_ID=$(grep "NEXT_PUBLIC_LINERA_APP_ID" frontend/.env.local | cut -d'=' -f2)
    echo -e "Chain ID:       ${YELLOW}${CHAIN_ID:0:16}...${NC}"
    echo -e "Application ID: ${YELLOW}${APP_ID:0:16}...${NC}"
else
    echo -e "${RED}❌ Configuration files not found${NC}"
fi

echo ""

# Check log files
echo -e "${CYAN}📝 Log Files:${NC}"
echo ""

if [ -f "linera-service.log" ]; then
    SIZE=$(du -h linera-service.log | cut -f1)
    LINES=$(wc -l < linera-service.log)
    echo -e "linera-service.log: ${GREEN}✅ Exists${NC} ($SIZE, $LINES lines)"
else
    echo -e "linera-service.log: ${YELLOW}⚠️  Not found${NC}"
fi

if [ -f "backend.log" ]; then
    SIZE=$(du -h backend.log | cut -f1)
    LINES=$(wc -l < backend.log)
    echo -e "backend.log:        ${GREEN}✅ Exists${NC} ($SIZE, $LINES lines)"
else
    echo -e "backend.log:        ${YELLOW}⚠️  Not found${NC}"
fi

if [ -f "frontend.log" ]; then
    SIZE=$(du -h frontend.log | cut -f1)
    LINES=$(wc -l < frontend.log)
    echo -e "frontend.log:       ${GREEN}✅ Exists${NC} ($SIZE, $LINES lines)"
else
    echo -e "frontend.log:       ${YELLOW}⚠️  Not found${NC}"
fi

echo ""

# Overall status
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $LINERA_STATUS -eq 0 ] && [ $BACKEND_STATUS -eq 0 ] && [ $FRONTEND_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ All services are running${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}🎉 Platform is fully operational!${NC}"
    echo -e "   Access at: ${CYAN}http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Some services are not running${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}To start all services, run:${NC}"
    echo -e "   ${CYAN}bash start-all.sh${NC}"
fi

echo ""
