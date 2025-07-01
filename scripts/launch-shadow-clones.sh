#!/bin/bash
# launch-shadow-clones.sh - Deploy VLLM on MAGI nodes

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🥷 Deploying VLLM Shadow Clones...${NC}"
echo "================================="

# MAGI node configuration
MELCHIOR_IP="192.168.50.30"
BALTHAZAR_IP="192.168.50.20"
CASPAR_IP="192.168.50.21"

# Function to deploy to remote node
deploy_to_node() {
    local NODE_NAME=$1
    local NODE_IP=$2
    local MODEL=$3
    local PORT=$4
    
    echo -e "${YELLOW}Deploying to $NODE_NAME ($NODE_IP)...${NC}"
    
    # Check if we can connect
    if ping -c 1 -W 1 $NODE_IP > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $NODE_NAME is reachable${NC}"
        
        # Check if VLLM is already running
        if curl -s http://$NODE_IP:$PORT/v1/models > /dev/null 2>&1; then
            echo -e "${GREEN}✓ VLLM already running on $NODE_NAME${NC}"
        else
            echo -e "${BLUE}Starting VLLM container on $NODE_NAME...${NC}"
            echo "Run this command on $NODE_NAME:"
            echo ""
            echo "docker run -d \\"
            echo "  --name vllm-$NODE_NAME \\"
            echo "  --runtime nvidia \\"
            echo "  --gpus all \\"
            echo "  -v ~/.cache/huggingface:/root/.cache/huggingface \\"
            echo "  -p $PORT:8000 \\"
            echo "  --restart unless-stopped \\"
            echo "  vllm/vllm-openai:latest \\"
            echo "  --model $MODEL \\"
            echo "  --host 0.0.0.0"
            echo ""
        fi
    else
        echo -e "${RED}✗ Cannot reach $NODE_NAME at $NODE_IP${NC}"
        echo "  Please ensure the node is online and accessible"
    fi
    echo ""
}

# Deploy to each MAGI node
deploy_to_node "melchior" $MELCHIOR_IP "meta-llama/Llama-3.1-70B-Instruct" 8000
deploy_to_node "balthazar" $BALTHAZAR_IP "mistralai/Mistral-7B-Instruct-v0.3" 8002
deploy_to_node "caspar" $CASPAR_IP "deepseek-ai/DeepSeek-V3" 8001

echo -e "${BLUE}Shadow Clone Deployment Summary:${NC}"
echo "  Melchior: http://$MELCHIOR_IP:8000 (Llama-70B)"
echo "  Caspar: http://$CASPAR_IP:8001 (DeepSeek-V3)"
echo "  Balthazar: http://$BALTHAZAR_IP:8002 (Mistral-7B)"
echo ""
echo -e "${YELLOW}Note: Manual deployment may be required on each node${NC}"
echo -e "${GREEN}✓ Shadow Clone deployment initiated!${NC}"