#!/bin/bash

# 🚀 Launch Dashboard Rapid Deployment Script
# Jordan Ehrig - Ehrig BIM & IT

set -e

echo "🎌 Launch Dashboard Deployment Starting..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm found: ${NPM_VERSION}${NC}"
else
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

# Check git
if command -v git >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Git found${NC}"
else
    echo -e "${RED}❌ Git not found${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🏗️  Setting up project structure...${NC}"

# Create project directory
PROJECT_DIR="launch"
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}⚠️  Directory $PROJECT_DIR already exists. Remove it? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_DIR"
    else
        echo "Exiting..."
        exit 1
    fi
fi

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Create directory structure
mkdir -p src/{main,renderer,modules}
mkdir -p assets
mkdir -p dist

echo -e "${GREEN}✅ Project structure created${NC}"

# Clone artifacts from GitHub (if not already present)
echo -e "${BLUE}📥 Fetching Launch artifacts...${NC}"

# Download key files from Launch repo
GITHUB_RAW="https://raw.githubusercontent.com/SamuraiBuddha/Launch/main/artifacts"

curl -s "${GITHUB_RAW}/package_json.json" | base64 -d > package.json
curl -s "${GITHUB_RAW}/main_js.js" | base64 -d > src/main.js
curl -s "${GITHUB_RAW}/main_html.html" | base64 -d > src/renderer/main.html
curl -s "${GITHUB_RAW}/renderer_js.js" | base64 -d > src/renderer/renderer.js
curl -s "${GITHUB_RAW}/performance_module.html" | base64 -d > src/renderer/modules/performance.html
curl -s "${GITHUB_RAW}/ssh_terminal_grid.html" | base64 -d > src/renderer/modules/ssh_terminal.html
curl -s "${GITHUB_RAW}/skin_selector.html" | base64 -d > src/renderer/modules/skin_selector.html

echo -e "${GREEN}✅ Artifacts downloaded${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Create configuration file template
echo -e "${BLUE}⚙️  Creating configuration...${NC}"

cat > config.json << EOF
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "database": "launch_memory",
    "user": "postgres",
    "password": "CHANGE_ME"
  },
  "machines": {
    "melchior": {
      "host": "192.168.50.30",
      "user": "jordan",
      "name": "Melchior (RTX A5000)"
    },
    "balthazar": {
      "host": "192.168.50.31", 
      "user": "jordan",
      "name": "Balthazar (RTX A4000)"
    },
    "caspar": {
      "host": "192.168.50.32",
      "user": "jordan", 
      "name": "Caspar (RTX 3090)"
    },
    "adam": {
      "host": "192.168.50.40",
      "user": "jordan",
      "name": "Adam (NAS)"
    },
    "lilith": {
      "host": "192.168.50.41",
      "user": "jordan",
      "name": "Lilith (Secondary NAS)"
    }
  }
}
EOF

echo -e "${GREEN}✅ Configuration template created${NC}"

# Create launch scripts
echo -e "${BLUE}🚀 Creating launch scripts...${NC}"

# Dev launch script
cat > dev.sh << 'EOF'
#!/bin/bash
echo "🎮 Starting Launch Dashboard in development mode..."
npm run dev
EOF

# Production launch script 
cat > launch.sh << 'EOF'
#!/bin/bash
echo "🚀 Launching Launch Dashboard..."
npm start
EOF

chmod +x dev.sh launch.sh

echo -e "${GREEN}✅ Launch scripts created${NC}"

# Create icon placeholder
echo -e "${BLUE}🎨 Setting up assets...${NC}"

# Create a simple PNG icon placeholder (you'll replace this with actual Launch icon)
cat > assets/icon.png << 'EOF'
# Placeholder for Launch icon - replace with actual icon file
EOF

echo -e "${GREEN}✅ Assets setup complete${NC}"

echo ""
echo -e "${GREEN}🎉 Launch Dashboard setup complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Edit config.json with your database password and machine IPs"
echo "2. Ensure PostgreSQL with Apache AGE is running"
echo "3. Verify SSH key access to MAGI machines"
echo "4. Run: ./dev.sh (development) or ./launch.sh (production)"
echo ""
echo -e "${BLUE}🔧 Optional Database Setup:${NC}"
echo "docker run -d --name launch-postgres -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=launch_memory -p 5432:5432 apache/age"
echo ""
echo -e "${GREEN}Ready to amplify your productivity 100x! 🎌⚡${NC}"