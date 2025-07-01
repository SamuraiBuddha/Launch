#!/bin/bash
# launch-dashboard.sh - Start monitoring dashboard

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 Launching Monitoring Dashboard...${NC}"
echo "==================================="

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DASHBOARD_DIR="$SCRIPT_DIR/../dashboard"

# Create dashboard directory if it doesn't exist
mkdir -p "$DASHBOARD_DIR"

# Check if dashboard HTML exists
if [ ! -f "$DASHBOARD_DIR/index.html" ]; then
    echo -e "${YELLOW}Creating dashboard...${NC}"
    # Create a simple dashboard if it doesn't exist
    cat > "$DASHBOARD_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Launch - MAGI Infrastructure Dashboard</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #1a1a1a; 
            color: #fff;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .status-card {
            background: #2a2a2a;
            border-radius: 10px;
            padding: 20px;
            border: 2px solid #444;
        }
        .online { border-color: #4CAF50; }
        .offline { border-color: #f44336; }
        .warning { border-color: #ff9800; }
        h1 { color: #4CAF50; }
        h3 { margin-top: 0; }
        .metric { 
            display: flex; 
            justify-content: space-between;
            margin: 10px 0;
        }
        .value { color: #4CAF50; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Launch Dashboard</h1>
        <p>MAGI Infrastructure Control Center</p>
    </div>
    
    <div class="status-grid">
        <div class="status-card online">
            <h3>🧠 Hybrid Memory</h3>
            <div class="metric">
                <span>PostgreSQL</span>
                <span class="value">ONLINE</span>
            </div>
            <div class="metric">
                <span>Redis</span>
                <span class="value">ONLINE</span>
            </div>
            <div class="metric">
                <span>Qdrant</span>
                <span class="value">ONLINE</span>
            </div>
        </div>
        
        <div class="status-card online">
            <h3>🤖 AI Services</h3>
            <div class="metric">
                <span>LM Studio</span>
                <span class="value">Port 1234</span>
            </div>
            <div class="metric">
                <span>ComfyUI</span>
                <span class="value">Port 8188</span>
            </div>
            <div class="metric">
                <span>Claude Desktop</span>
                <span class="value">ACTIVE</span>
            </div>
        </div>
        
        <div class="status-card warning">
            <h3>🥷 Shadow Clones</h3>
            <div class="metric">
                <span>Melchior</span>
                <span class="value">Llama-70B</span>
            </div>
            <div class="metric">
                <span>Caspar</span>
                <span class="value">DeepSeek-V3</span>
            </div>
            <div class="metric">
                <span>Balthazar</span>
                <span class="value">Mistral-7B</span>
            </div>
        </div>
        
        <div class="status-card online">
            <h3>📡 Network Status</h3>
            <div class="metric">
                <span>10GbE Backbone</span>
                <span class="value">ACTIVE</span>
            </div>
            <div class="metric">
                <span>n8n Workflows</span>
                <span class="value">Port 5678</span>
            </div>
            <div class="metric">
                <span>Amplification</span>
                <span class="value">100x</span>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 5 seconds
        setTimeout(() => location.reload(), 5000);
    </script>
</body>
</html>
EOF
fi

# Start simple HTTP server
cd "$DASHBOARD_DIR"

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo -e "${BLUE}Starting dashboard server on port 8080...${NC}"
    python3 -m http.server 8080 &
    SERVER_PID=$!
    echo $SERVER_PID > /tmp/launch-dashboard.pid
elif command -v python &> /dev/null; then
    echo -e "${BLUE}Starting dashboard server on port 8080...${NC}"
    python -m SimpleHTTPServer 8080 &
    SERVER_PID=$!
    echo $SERVER_PID > /tmp/launch-dashboard.pid
else
    echo -e "${RED}Python not found. Cannot start dashboard server.${NC}"
    exit 1
fi

# Wait a moment for server to start
sleep 2

# Open in browser
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    start http://localhost:8080
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8080
else
    xdg-open http://localhost:8080 2>/dev/null || echo "Please open http://localhost:8080 in your browser"
fi

echo ""
echo -e "${GREEN}✓ Dashboard is running at http://localhost:8080${NC}"
echo -e "${YELLOW}Note: Dashboard auto-refreshes every 5 seconds${NC}"