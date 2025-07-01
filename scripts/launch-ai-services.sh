#!/bin/bash
# launch-ai-services.sh - Start LM Studio and ComfyUI

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🤖 Launching AI Services...${NC}"
echo "==========================="

# Check if running on Windows
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    IS_WINDOWS=true
else
    IS_WINDOWS=false
fi

# Function to check if port is in use
check_port() {
    local port=$1
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

# Launch LM Studio
echo -e "${YELLOW}Starting LM Studio...${NC}"
if check_port 1234; then
    echo -e "${GREEN}✓ LM Studio is already running on port 1234${NC}"
else
    if [ "$IS_WINDOWS" = true ]; then
        # Windows path
        LM_STUDIO_PATH="/c/Program Files/LM Studio/LM Studio.exe"
        if [ -f "$LM_STUDIO_PATH" ]; then
            "$LM_STUDIO_PATH" &
            echo -e "${GREEN}✓ LM Studio launched${NC}"
        else
            echo -e "${RED}LM Studio not found at: $LM_STUDIO_PATH${NC}"
        fi
    else
        # macOS/Linux
        if command -v lmstudio &> /dev/null; then
            lmstudio &
            echo -e "${GREEN}✓ LM Studio launched${NC}"
        else
            echo -e "${RED}LM Studio not found in PATH${NC}"
        fi
    fi
fi

# Launch ComfyUI
echo -e "${YELLOW}Starting ComfyUI...${NC}"
if check_port 8188; then
    echo -e "${GREEN}✓ ComfyUI is already running on port 8188${NC}"
else
    COMFYUI_DIR="$HOME/ComfyUI"
    if [ -d "$COMFYUI_DIR" ]; then
        cd "$COMFYUI_DIR"
        if [ "$IS_WINDOWS" = true ]; then
            # Windows - use python directly
            python main.py --listen &
        else
            # Unix-like systems
            python3 main.py --listen &
        fi
        echo -e "${GREEN}✓ ComfyUI launched${NC}"
    else
        echo -e "${RED}ComfyUI not found at: $COMFYUI_DIR${NC}"
    fi
fi

echo ""
echo -e "${BLUE}AI Services Status:${NC}"
echo "  LM Studio: http://localhost:1234"
echo "  ComfyUI: http://localhost:8188"
echo ""
echo -e "${YELLOW}Note: Services may take a moment to fully initialize${NC}"
echo -e "${GREEN}✓ AI Services launch complete!${NC}"