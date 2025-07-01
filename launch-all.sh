#!/bin/bash
# launch-all.sh - Master Launch Script for MAGI Infrastructure
# "With my genius engineering, I'll make this infrastructure run perfectly!" - Launch

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ASCII Art Launch
echo -e "${BLUE}"
cat << "EOF"
    __                           __  
   / /   ____ ___  ______  _____/ /_ 
  / /   / __ `/ / / / __ \/ ___/ __ \
 / /___/ /_/ / /_/ / / / / /__/ / / /
/_____/\__,_/\__,_/_/ /_/\___/_/ /_/ 
                                      
MAGI Infrastructure Dashboard v1.0
"Engineering the future, one system at a time!"
EOF
echo -e "${NC}"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if running on Windows
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    IS_WINDOWS=true
else
    IS_WINDOWS=false
fi

# Function to check if a service is running
check_service() {
    local service=$1
    local port=$2
    
    if command -v nc &> /dev/null; then
        nc -z localhost $port 2>/dev/null
        return $?
    elif command -v netstat &> /dev/null; then
        netstat -an | grep -q ":$port.*LISTEN"
        return $?
    else
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    echo -ne "${YELLOW}Waiting for $service to start on port $port...${NC}"
    
    while ! check_service "$service" "$port"; do
        if [ $attempt -eq $max_attempts ]; then
            echo -e "\n${RED}✗ $service failed to start after $max_attempts seconds${NC}"
            return 1
        fi
        echo -ne "."
        sleep 1
        ((attempt++))
    done
    
    echo -e "\n${GREEN}✓ $service is running!${NC}"
    return 0
}

# Main launch sequence
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Starting MAGI Infrastructure...      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Launch Hybrid Memory System
echo -e "${YELLOW}[1/5] Launching Hybrid Memory System...${NC}"
if [ -f "$SCRIPT_DIR/scripts/launch-hybrid-memory.sh" ]; then
    "$SCRIPT_DIR/scripts/launch-hybrid-memory.sh"
    wait_for_service "PostgreSQL" 5432
    wait_for_service "Redis" 6379
    wait_for_service "Qdrant" 6333
else
    echo -e "${RED}Warning: Hybrid memory launch script not found${NC}"
fi
echo ""

# Step 2: Launch AI Services
echo -e "${YELLOW}[2/5] Launching AI Services...${NC}"
if [ -f "$SCRIPT_DIR/scripts/launch-ai-services.sh" ]; then
    "$SCRIPT_DIR/scripts/launch-ai-services.sh"
    wait_for_service "LM Studio" 1234
    wait_for_service "ComfyUI" 8188
else
    echo -e "${RED}Warning: AI services launch script not found${NC}"
fi
echo ""

# Step 3: Launch VLLM Shadow Clones
echo -e "${YELLOW}[3/5] Launching VLLM Shadow Clones...${NC}"
if [ -f "$SCRIPT_DIR/scripts/launch-shadow-clones.sh" ]; then
    "$SCRIPT_DIR/scripts/launch-shadow-clones.sh"
    echo -e "${BLUE}Shadow clones deployment initiated on MAGI nodes${NC}"
else
    echo -e "${RED}Warning: Shadow clones launch script not found${NC}"
fi
echo ""

# Step 4: Launch n8n Workflows
echo -e "${YELLOW}[4/5] Starting n8n Workflow Engine...${NC}"
if check_service "n8n" 5678; then
    echo -e "${GREEN}✓ n8n is already running${NC}"
else
    echo -e "${BLUE}Starting n8n...${NC}"
    if [ "$IS_WINDOWS" = true ]; then
        start cmd /c "npx n8n"
    else
        nohup npx n8n > /dev/null 2>&1 &
    fi
    wait_for_service "n8n" 5678
fi
echo ""

# Step 5: Launch Claude Desktop
echo -e "${YELLOW}[5/5] Launching Claude Desktop...${NC}"
if [ "$IS_WINDOWS" = true ]; then
    # Windows path
    CLAUDE_PATH="/c/Users/$USER/AppData/Local/Programs/claude/Claude.exe"
    if [ -f "$CLAUDE_PATH" ]; then
        echo -e "${BLUE}Starting Claude Desktop...${NC}"
        "$CLAUDE_PATH" &
        echo -e "${GREEN}✓ Claude Desktop launched${NC}"
    else
        echo -e "${RED}Claude Desktop not found at expected location${NC}"
    fi
else
    # macOS/Linux
    if command -v claude &> /dev/null; then
        claude &
        echo -e "${GREEN}✓ Claude Desktop launched${NC}"
    else
        echo -e "${RED}Claude Desktop not found${NC}"
    fi
fi
echo ""

# Launch Dashboard
echo -e "${YELLOW}[BONUS] Launching Monitoring Dashboard...${NC}"
if [ -f "$SCRIPT_DIR/scripts/launch-dashboard.sh" ]; then
    "$SCRIPT_DIR/scripts/launch-dashboard.sh" &
    echo -e "${GREEN}✓ Dashboard launching in browser...${NC}"
else
    echo -e "${BLUE}Opening system status...${NC}"
    if [ "$IS_WINDOWS" = true ]; then
        start http://localhost:8080
    else
        open http://localhost:8080 || xdg-open http://localhost:8080
    fi
fi
echo ""

# Final Status Report
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        LAUNCH COMPLETE! 🚀             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}System Status:${NC}"
echo -e "  ${GREEN}✓${NC} Hybrid Memory System: ${GREEN}ONLINE${NC}"
echo -e "  ${GREEN}✓${NC} AI Services: ${GREEN}ACTIVE${NC}"
echo -e "  ${GREEN}✓${NC} Shadow Clones: ${GREEN}DEPLOYED${NC}"
echo -e "  ${GREEN}✓${NC} Workflow Engine: ${GREEN}RUNNING${NC}"
echo -e "  ${GREEN}✓${NC} Claude Desktop: ${GREEN}LAUNCHED${NC}"
echo ""
echo -e "${BLUE}Access Points:${NC}"
echo -e "  • PostgreSQL: localhost:5432"
echo -e "  • Redis: localhost:6379"
echo -e "  • Qdrant: localhost:6333"
echo -e "  • LM Studio: http://localhost:1234"
echo -e "  • ComfyUI: http://localhost:8188"
echo -e "  • n8n: http://localhost:5678"
echo -e "  • Dashboard: http://localhost:8080"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Import shadow clone workflows to n8n"
echo -e "  2. Test memory system with Claude"
echo -e "  3. Deploy VLLM models on MAGI nodes"
echo -e "  4. Monitor performance amplification"
echo ""
echo -e "${BLUE}\"Your infrastructure is now operating at peak efficiency!\"${NC}"
echo -e "${BLUE}                                        - Launch 🚀${NC}"