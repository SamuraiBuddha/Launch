#!/bin/bash
# launch-hybrid-memory.sh - Start Hybrid Memory System
# PostgreSQL + pgvector + Apache AGE + Redis + Qdrant

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧠 Launching Hybrid Memory System...${NC}"
echo "===================================="

# Navigate to tool-combo-chains directory
TOOL_COMBO_DIR="$HOME/Documents/GitHub/tool-combo-chains"

if [ ! -d "$TOOL_COMBO_DIR" ]; then
    echo -e "${RED}Error: tool-combo-chains directory not found${NC}"
    echo "Expected location: $TOOL_COMBO_DIR"
    exit 1
fi

cd "$TOOL_COMBO_DIR"

# Check if containers are already running
if docker ps | grep -q "cognitive-postgres"; then
    echo -e "${YELLOW}Hybrid memory containers already running${NC}"
    echo "Use 'docker-compose down' to stop them first if needed"
else
    echo -e "${BLUE}Starting Docker containers...${NC}"
    docker-compose up -d
    
    # Wait for services to be ready
    echo -e "${YELLOW}Waiting for services to initialize...${NC}"
    sleep 10
    
    # Check PostgreSQL
    if docker exec cognitive-postgres pg_isready -U cognitive > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
    else
        echo -e "${RED}✗ PostgreSQL failed to start${NC}"
    fi
    
    # Check Redis
    if docker exec cognitive-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is ready${NC}"
    else
        echo -e "${RED}✗ Redis failed to start${NC}"
    fi
    
    # Check Qdrant
    if curl -s http://localhost:6333/collections > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Qdrant is ready${NC}"
    else
        echo -e "${RED}✗ Qdrant failed to start${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Hybrid Memory System Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep cognitive || true

echo ""
echo -e "${BLUE}Connection Details:${NC}"
echo "  PostgreSQL: postgresql://cognitive:cognitive_secure_password@localhost:5432/cognitive"
echo "  Redis: redis://localhost:6379"
echo "  Qdrant: http://localhost:6333"
echo ""
echo -e "${GREEN}✓ Hybrid Memory System is ready!${NC}"