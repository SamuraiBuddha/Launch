# 🚀 Launch Dashboard Deployment Guide

## 📋 Prerequisites
- **Node.js 18+** (for Electron 31.0.0)
- **PostgreSQL** with Apache AGE extension
- **SSH keys** configured for MAGI machines
- **Docker** (optional, for easy database setup)

## ⚡ Rapid Setup

### 1. Clone & Setup Project
```bash
# Clone the Launch repo
git clone https://github.com/SamuraiBuddha/Launch.git
cd Launch

# Create project structure 
mkdir -p launch/src/{main,renderer,modules}
mkdir -p launch/assets

# Copy artifacts to proper locations
cp artifacts/package_json.json launch/package.json
cp artifacts/main_js.js launch/src/main.js
cp artifacts/main_html.html launch/src/renderer/main.html
cp artifacts/renderer_js.js launch/src/renderer/renderer.js
cp artifacts/performance_module.html launch/src/renderer/modules/performance.html
cp artifacts/ssh_terminal_grid.html launch/src/renderer/modules/ssh_terminal.html
cp artifacts/skin_selector.html launch/src/renderer/modules/skin_selector.html

cd launch
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup (Apache AGE)
```bash
# Option 1: Docker (Recommended)
docker run -d \
  --name launch-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=launch_memory \
  -p 5432:5432 \
  apache/age

# Option 2: Manual PostgreSQL + AGE extension
# Install PostgreSQL and Apache AGE extension
# Create database: createdb launch_memory
```

### 4. Configure Database Connection
Edit `src/main.js` and update:
```javascript
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'launch_memory',
  password: 'YOUR_POSTGRES_PASSWORD',
  port: 5432,
});
```

### 5. Configure MAGI Machine IPs
Update the `magiMachines` object in `src/main.js`:
```javascript
this.magiMachines = {
  melchior: { host: '192.168.50.30', user: 'jordan', name: 'Melchior (RTX A5000)' },
  balthazar: { host: '192.168.50.31', user: 'jordan', name: 'Balthazar (RTX A4000)' },
  caspar: { host: '192.168.50.32', user: 'jordan', name: 'Caspar (RTX 3090)' },
  adam: { host: '192.168.50.40', user: 'jordan', name: 'Adam (NAS)' },
  lilith: { host: '192.168.50.41', user: 'jordan', name: 'Lilith (Secondary NAS)' }
};
```

### 6. SSH Key Setup
```bash
# Ensure SSH key is available
ls ~/.ssh/id_rsa

# Test connections to MAGI machines
ssh jordan@192.168.50.30  # Melchior
ssh jordan@192.168.50.31  # Balthazar
# etc...
```

## 🎮 Launch Commands

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Build Distributables
```bash
# Windows
npm run build-win

# macOS
npm run build-mac

# Linux
npm run build-linux
```

## 🎨 First Launch Experience

1. **🖥️ Main Interface** - Winamp-style window with green MAGI theme
2. **📡 SSH Grid** - Click "Connect All" to establish terminal connections
3. **🧠 Knowledge Graph** - Toggle to explore Apache AGE database
4. **⚙️ Performance** - Real-time metrics from all MAGI machines
5. **🎭 Skins** - Customize with cyberpunk, matrix, or retro themes

## 🔧 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check AGE extension: `SELECT * FROM pg_extension WHERE extname = 'age';`
- Test connection: `psql -h localhost -U postgres -d launch_memory`

### SSH Connection Problems
- Verify network connectivity: `ping 192.168.50.30`
- Test SSH manually: `ssh -v jordan@192.168.50.30`
- Check SSH key permissions: `chmod 600 ~/.ssh/id_rsa`

### Module Loading Errors
- Clear Electron cache: Delete `%APPDATA%/launch/`
- Check DevTools console for JavaScript errors
- Verify all files are in correct locations

## 🚀 Advanced Features

### Custom Module Development
1. Create HTML file in `src/renderer/modules/`
2. Add module toggle to View menu in `main.js`
3. Implement `createModuleWindow()` call in renderer

### API Integration
- Replace mock functions in `updateMetrics()`
- Add actual API calls to MAGI infrastructure
- Implement WebSocket connections for live updates

### Theme Development
- Create new skin definitions in skin selector
- Add CSS variables for color schemes
- Export/import .wsz skin files

## 📊 System Requirements
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 500MB for app + modules
- **Network:** 1Gbps recommended for real-time monitoring
- **OS:** Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)

---
**Built for Jordan Ehrig's Launch Infrastructure** 🎌  
**Ehrig BIM & IT - 100x Productivity Amplification** ⚡