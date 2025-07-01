#!/bin/bash
# health-check.sh - System health verification

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🏥 MAGI Infrastructure Health Check${NC}"
echo "==================================="
echo ""

# Function to check service
check_service() {
    local name=$1
    local port=$2
    local url=$3
    
    echo -ne "Checking $name... "
    
    if command -v nc &> /dev/null; then
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✓ ONLINE${NC} (port $port)"
            return 0
        fi
    elif command -v curl &> /dev/null && [ -n "$url" ]; then
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ ONLINE${NC} (port $port)"
            return 0
        fi
    fi
    
    echo -e "${RED}✗ OFFLINE${NC} (port $port)"
    return 1
}

# Check Docker
echo -e "${YELLOW}[Docker Status]${NC}"
if command -v docker &> /dev/null; then
    echo -e "Docker: ${GREEN}✓ Installed${NC}"
    if docker ps > /dev/null 2>&1; then
        echo -e "Docker Daemon: ${GREEN}✓ Running${NC}"
        
        # List cognitive containers
        echo -e "\nCognitive Containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}" | grep cognitive || echo "  No cognitive containers running"
    else
        echo -e "Docker Daemon: ${RED}✗ Not running${NC}"
    fi
else
    echo -e "Docker: ${RED}✗ Not installed${NC}"
fi
echo ""

# Check Hybrid Memory Services
echo -e "${YELLOW}[Hybrid Memory System]${NC}"
check_service "PostgreSQL" 5432
check_service "Redis" 6379
check_service "Qdrant" 6333 "http://localhost:6333/collections"
echo ""

# Check AI Services
echo -e "${YELLOW}[AI Services]${NC}"
check_service "LM Studio" 1234 "http://localhost:1234/v1/models"
check_service "ComfyUI" 8188 "http://localhost:8188"
check_service "n8n" 5678 "http://localhost:5678"
echo ""

# Check VLLM Shadow Clones
echo -e "${YELLOW}[VLLM Shadow Clones]${NC}"
check_service "Melchior VLLM" 8000 "http://localhost:8000/v1/models"
check_service "Caspar VLLM" 8001 "http://localhost:8001/v1/models"
check_service "Balthazar VLLM" 8002 "http://localhost:8002/v1/models"
echo ""

# Check GPU
echo -e "${YELLOW}[GPU Status]${NC}"
if command -v nvidia-smi &> /dev/null; then
    echo -e "NVIDIA Driver: ${GREEN}✓ Installed${NC}"
    nvidia-smi --query-gpu=name,memory.total,memory.used,temperature.gpu --format=csv,noheader || echo "Unable to query GPU"
else
    echo -e "NVIDIA Driver: ${RED}✗ Not detected${NC}"
fi
echo ""

# Check Network
echo -e "${YELLOW}[Network Status]${NC}"
# Check if MAGI nodes are reachable
for node in "Melchior:192.168.50.30" "Balthazar:192.168.50.20" "Caspar:192.168.50.21" "Lilith:192.168.50.10" "Adam:192.168.50.11"; do
    IFS=':' read -r name ip <<< "$node"
    echo -ne "$name ($ip): "
    if ping -c 1 -W 1 $ip > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Reachable${NC}"
    else
        echo -e "${RED}✗ Unreachable${NC}"
    fi
done
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════${NC}"
echo -e "${BLUE}Health Check Complete!${NC}"
echo -e "${BLUE}════════════════════════════════${NC}"