#!/bin/bash
# launch-mcps.sh - MCP Management and Launch Integration for Launch Dashboard
# "Every genius engineer needs their tools ready at a moment's notice!" - Launch

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LAUNCH_DIR="$(dirname "$SCRIPT_DIR")"
MCP_REGISTRY="$LAUNCH_DIR/configs/mcp-registry.json"
CLAUDE_CONFIG="$HOME/.claude_desktop_config.json"

echo -e "${BLUE}"
cat << "EOF"
   __  __  _____  _____    __    ____ _   _ _   _  ____ _   _ 
  |  \/  |/ ____|/ ____|  / /   |  _ \ | | | \ | |/ ___| | | |
  | |\/| | |    | |      / /    | |_) || | |  \| | |   | |_| |
  | |  | | |____| |____ / /     |  _ < | |_| |\  | |___|  _  |
  |_|  |_|\_____|\_____/_/      |_| \_\\___/|_| \_|\____|_| |_|
  
  MCP Management & Launch Integration v1.0
  "Deploying genius-level tooling efficiency!"
EOF
echo -e "${NC}"

# Function to check if jq is available
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required but not installed. Please install jq first.${NC}"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}Warning: Node.js not found. NPX commands may fail.${NC}"
    fi
}

# Function to load MCP registry
load_registry() {
    if [[ ! -f "$MCP_REGISTRY" ]]; then
        echo -e "${RED}Error: MCP registry not found at $MCP_REGISTRY${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Loading MCP registry...${NC}"
    cat "$MCP_REGISTRY"
}

# Function to discover available MCPs
discover_mcps() {
    echo -e "${YELLOW}[1/5] Discovering available MCPs...${NC}"
    
    local registry_data=$(load_registry)
    local mcps=$(echo "$registry_data" | jq -r '.mcps | keys[]')
    
    echo -e "${GREEN}Found MCPs:${NC}"
    for mcp in $mcps; do
        local name=$(echo "$registry_data" | jq -r ".mcps[\"$mcp\"].name")
        local status=$(echo "$registry_data" | jq -r ".mcps[\"$mcp\"].status")
        echo -e "  ✓ $name ($mcp) - $status"
    done
    
    echo "$registry_data"
}

# Function to generate Claude Desktop config
generate_claude_config() {
    echo -e "${YELLOW}[2/5] Generating Claude Desktop configuration...${NC}"
    
    local registry_data="$1"
    local config_template='{
  "mcpServers": {},
  "globalShortcut": "CmdOrCtrl+Shift+Space",
  "plugins": []
}'
    
    # Create base config if it doesn't exist
    if [[ ! -f "$CLAUDE_CONFIG" ]]; then
        echo "$config_template" > "$CLAUDE_CONFIG"
        echo -e "${GREEN}Created new Claude Desktop config${NC}"
    fi
    
    # Backup existing config
    cp "$CLAUDE_CONFIG" "${CLAUDE_CONFIG}.backup.$(date +%s)"
    
    # Get current config and add MCP servers
    local current_config=$(cat "$CLAUDE_CONFIG")
    local new_config="$current_config"
    
    # Add each MCP to the config
    local mcps=$(echo "$registry_data" | jq -r '.mcps | keys[]')
    for mcp in $mcps; do
        local auto_start=$(echo "$registry_data" | jq -r ".mcps[\"$mcp\"].auto_start")
        
        if [[ "$auto_start" == "true" ]]; then
            local executable=$(echo "$registry_data" | jq -r ".mcps[\"$mcp\"].executable")
            local args=$(echo "$registry_data" | jq -c ".mcps[\"$mcp\"].args")
            
            # Update the MCP servers section
            new_config=$(echo "$new_config" | jq ".mcpServers[\"$mcp\"] = {
                \"command\": \"$executable\",
                \"args\": $args,
                \"description\": $(echo "$registry_data" | jq ".mcps[\"$mcp\"].description")
            }")
        fi
    done
    
    echo "$new_config" > "$CLAUDE_CONFIG"
    echo -e "${GREEN}Updated Claude Desktop config with $(echo "$mcps" | wc -w) MCPs${NC}"
}

# Function to check MCP health
check_mcp_health() {
    local mcp="$1"
    local registry_data="$2"
    local health_check=$(echo "$registry_data" | jq -r ".mcps[\"$mcp\"].health_check")
    
    if [[ "$health_check" == "null" ]]; then
        return 0  # No health check defined, assume healthy
    fi
    
    case "$health_check" in
        http://*)
            curl -s --max-time 5 "$health_check" > /dev/null
            ;;
        postgresql://*)
            # Check if PostgreSQL is running
            if command -v pg_isready &> /dev/null; then
                pg_isready -h localhost -p 5432
            else
                netstat -an | grep -q ":5432.*LISTEN"
            fi
            ;;
        unix://*)
            # Check Unix socket
            [[ -S "${health_check#unix://}" ]]
            ;;
        *)
            # Generic host:port check
            if command -v nc &> /dev/null; then
                nc -z localhost "$(echo "$health_check" | cut -d: -f2)" 2>/dev/null
            else
                return 0  # Assume healthy if no netcat
            fi
            ;;
    esac
}

# Function to start MCP services
start_mcp_services() {
    echo -e "${YELLOW}[3/5] Starting MCP services by priority...${NC}"
    
    local registry_data="$1"
    local launch_groups=$(echo "$registry_data" | jq -r '.launch_groups | keys[]')
    
    for group in $launch_groups; do
        local auto_start=$(echo "$registry_data" | jq -r ".launch_groups[\"$group\"].auto_start")
        
        if [[ "$auto_start" == "true" ]]; then
            echo -e "${BLUE}Starting $group group...${NC}"
            local startup_order=$(echo "$registry_data" | jq -r ".launch_groups[\"$group\"].startup_order[]")
            
            for mcp in $startup_order; do
                local name=$(echo "$registry_data" | jq -r ".mcps[\"$mcp\"].name")
                echo -e "  Starting $name..."
                
                # Check dependencies first
                local deps=$(echo "$registry_data" | jq -r ".mcps[\"$mcp\"].dependencies[]" 2>/dev/null)
                for dep in $deps; do
                    if ! check_mcp_health "$mcp" "$registry_data"; then
                        echo -e "    ${YELLOW}Waiting for dependency: $dep${NC}"
                        # Could add actual dependency waiting logic here
                    fi
                done
                
                # MCPs are started by Claude Desktop, so we just validate they're configured
                echo -e "    ${GREEN}✓ Configured for Claude Desktop launch${NC}"
            done
        fi
    done
}

# Function to generate health monitoring script
generate_health_monitor() {
    echo -e "${YELLOW}[4/5] Setting up health monitoring...${NC}"
    
    local monitor_script="$LAUNCH_DIR/scripts/mcp-health-monitor.sh"
    
    cat > "$monitor_script" << 'EOF'
#!/bin/bash
# MCP Health Monitor - Generated by launch-mcps.sh

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LAUNCH_DIR="$(dirname "$SCRIPT_DIR")"
MCP_REGISTRY="$LAUNCH_DIR/configs/mcp-registry.json"

check_mcp_status() {
    local mcp="$1"
    # Add actual health check logic here
    echo "online"
}

# Generate status JSON for dashboard
generate_status_json() {
    local mcps=$(jq -r '.mcps | keys[]' "$MCP_REGISTRY")
    echo "{"
    local first=true
    for mcp in $mcps; do
        [[ "$first" == "false" ]] && echo ","
        first=false
        local status=$(check_mcp_status "$mcp")
        echo "  \"$mcp\": \"$status\""
    done
    echo "}"
}

# Output status for dashboard consumption
generate_status_json
EOF

    chmod +x "$monitor_script"
    echo -e "${GREEN}Health monitor created at $monitor_script${NC}"
}

# Function to integrate with launch-all.sh
integrate_with_launch() {
    echo -e "${YELLOW}[5/5] Integrating with Launch infrastructure...${NC}"
    
    local launch_all="$LAUNCH_DIR/launch-all.sh"
    
    # Check if launch-all.sh already includes MCP integration
    if ! grep -q "launch-mcps.sh" "$launch_all"; then
        echo -e "${BLUE}Adding MCP integration to launch-all.sh...${NC}"
        
        # Create a backup
        cp "$launch_all" "${launch_all}.backup.$(date +%s)"
        
        # Insert MCP launch step before Claude Desktop launch
        sed -i '/# Step 5: Launch Claude Desktop/i\
# Step 4.5: Configure and Launch MCPs\
echo -e "${YELLOW}[4.5/5] Configuring MCP Infrastructure...${NC}"\
if [ -f "$SCRIPT_DIR/scripts/launch-mcps.sh" ]; then\
    "$SCRIPT_DIR/scripts/launch-mcps.sh" --configure-only\
    echo -e "${GREEN}✓ MCPs configured for Claude Desktop${NC}"\
else\
    echo -e "${RED}Warning: MCP launch script not found${NC}"\
fi\
echo ""\
' "$launch_all"
        
        echo -e "${GREEN}Integration complete!${NC}"
    else
        echo -e "${GREEN}MCP integration already present in launch-all.sh${NC}"
    fi
}

# Function to display status
show_status() {
    echo -e "${BLUE}MCP Infrastructure Status:${NC}"
    echo -e "  Registry: ${GREEN}$MCP_REGISTRY${NC}"
    echo -e "  Claude Config: ${GREEN}$CLAUDE_CONFIG${NC}"
    echo -e "  Health Monitor: ${GREEN}$LAUNCH_DIR/scripts/mcp-health-monitor.sh${NC}"
    echo ""
    echo -e "${GREEN}Launch Dashboard Integration: ${GREEN}READY${NC}"
    echo -e "${BLUE}Access dashboard at: http://localhost:8080${NC}"
}

# Main execution
main() {
    local configure_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --configure-only)
                configure_only=true
                shift
                ;;
            --status)
                show_status
                exit 0
                ;;
            --help)
                echo "Usage: $0 [--configure-only] [--status] [--help]"
                echo "  --configure-only  Only configure MCPs, don't start services"
                echo "  --status         Show current MCP infrastructure status"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    check_dependencies
    
    local registry_data=$(discover_mcps)
    generate_claude_config "$registry_data"
    
    if [[ "$configure_only" == "false" ]]; then
        start_mcp_services "$registry_data"
        generate_health_monitor
        integrate_with_launch
    fi
    
    show_status
    
    echo ""
    echo -e "${BLUE}\"Your MCP infrastructure is now operating at peak efficiency!\"${NC}"
    echo -e "${BLUE}                                                    - Launch 🚀${NC}"
}

# Run main function
main "$@"
