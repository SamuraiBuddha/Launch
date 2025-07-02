# 🚀 MAGI Command Center

**Winamp-style modular desktop application for MAGI infrastructure monitoring**

A sophisticated Electron-based control center that provides real-time monitoring, SSH terminal access, and Apache AGE knowledge graph visualization for your entire MAGI fleet.

## ✨ Features

### 🎵 Winamp-Style Modularity
- **Detachable modules** - Performance Metrics, System Logs, Network Topology
- **View menu toggles** - Show/hide modules like Winamp's playlist and equalizer
- **Repositionable windows** - Arrange your workspace however you want
- **Custom Winamp titlebar** - Authentic retro aesthetic with modern functionality

### 🧠 Dual-Mode Center Panel
- **Knowledge Graph Mode** - Live Apache AGE database visualization with D3.js
- **SSH Terminal Grid** - Simultaneous connections to all MAGI machines
- **One-click switching** - Toggle between graph exploration and system control

### 🥷 MAGI Fleet Integration
- **Real-time monitoring** - GPU temps, inference rates, network throughput
- **SSH auto-connect** - Instant terminal access to Melchior, Balthazar, Caspar, Adam, Lilith
- **Performance metrics** - Live amplification rates, response times, system health

### 📊 Advanced Visualizations
- **Interactive graph exploration** - Zoom, pan, drag nodes in your knowledge graph
- **Real-time charts** - Performance trends, GPU utilization, network activity
- **Color-coded status** - Instant visual feedback on system health

## 📁 Project Structure

```
magi-command-center/
├── package.json              # Dependencies and build configuration
├── src/
│   ├── main.js               # Electron main process
│   └── renderer/
│       ├── main.html         # Primary application interface
│       ├── renderer.js       # UI logic and interactions
│       └── modules/
│           └── performance.html  # Performance metrics module
└── assets/
    └── icon.png             # Application icon
```

## 🚀 Quick Start

### 1. Create Project Directory
```bash
mkdir magi-command-center
cd magi-command-center
```

### 2. Setup Files
Copy all the provided artifacts into the appropriate locations:
- `package.json` → root directory
- `main.js` → `src/main.js`
- `main.html` → `src/renderer/main.html`
- `renderer.js` → `src/renderer/renderer.js`
- `performance.html` → `src/renderer/modules/performance.html`

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Database Connection
Edit `src/main.js` and update the database connection settings:
```javascript
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'magi_memory',
  password: 'YOUR_POSTGRES_PASSWORD',
  port: 5432,
});
```

### 5. Setup SSH Keys
Ensure your SSH key is available at `~/.ssh/id_rsa` for passwordless connections to MAGI machines.

### 6. Run the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔧 Advanced Configuration

### SSH Machine Configuration
Edit the `magiMachines` object in `src/main.js`:
```javascript
this.magiMachines = {
  melchior: { host: '192.168.50.30', user: 'jordan', name: 'Melchior (RTX A5000)' },
  // ... add your actual IPs and usernames
};
```

### Database Integration
The app connects to Apache AGE for knowledge graph visualization. Ensure your AGE extension is properly configured:
```sql
-- Create graph if not exists
SELECT * FROM cypher('magi_graph', $$
  CREATE (:Session_Entry {name: 'test'})
$$) as (result agtype);
```

## 📦 Building Distributables

### Windows Executable
```bash
npm run build-win
```

### macOS App
```bash
npm run build-mac
```

### Linux AppImage
```bash
npm run build-linux
```

Built applications will be in the `dist/` directory.

## 🎛️ Module System

### Creating New Modules
1. Create HTML file in `src/renderer/modules/`
2. Add module toggle to View menu in `main.js`
3. Implement `createModuleWindow()` call in renderer

### Example Module Template
```html
<!DOCTYPE html>
<html>
<head>
    <title>New Module</title>
    <!-- Winamp-style titlebar CSS -->
</head>
<body>
    <div class="module-titlebar">
        <div class="module-title">📊 Module Name</div>
        <div class="module-controls">
            <div class="module-btn" onclick="window.close()">×</div>
        </div>
    </div>
    <div class="module-content">
        <!-- Your module content -->
    </div>
</body>
</html>
```

## 🔌 API Integration

### Real-time Metrics
The app includes simulation for metrics. To connect real data:
1. Replace mock functions in `updateMetrics()`
2. Add actual API calls to your MAGI infrastructure
3. Implement WebSocket connections for live updates

### SSH Integration
SSH connections use the `ssh2` library. Extend the `connectSSH()` method to:
- Support different authentication methods
- Handle multiple concurrent sessions
- Implement terminal input/output streaming

## 🎨 Customization

### Theming
- Edit CSS variables in HTML files for color schemes
- Modify gradient backgrounds and accent colors
- Add custom animations and effects

### Layout
- Adjust grid layouts in `main.html`
- Resize module windows in `main.js`
- Create custom arrangement presets

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running and AGE extension is loaded
- Check firewall settings for port 5432
- Confirm database credentials and permissions

### SSH Connection Problems
- Ensure SSH key authentication is configured
- Verify network connectivity to MAGI machines
- Check SSH daemon configuration on target machines

### Module Loading Errors
- Clear Electron cache: Delete `%APPDATA%/magi-command-center/`
- Check DevTools console for JavaScript errors
- Verify all required files are in correct locations

## 📈 Performance Optimization

### Memory Usage
- Limit graph node count in large databases
- Implement lazy loading for modules
- Add cleanup for closed SSH connections

### Responsiveness
- Use Web Workers for heavy computations
- Implement virtual scrolling for large datasets
- Optimize D3.js render cycles

## 🔒 Security Considerations

- Store SSH keys securely
- Implement connection encryption
- Add user authentication for sensitive operations
- Audit network access permissions

## 🎯 Roadmap

- [ ] **Live log streaming** from MAGI machines
- [ ] **Network topology visualization** with real-time status
- [ ] **Custom dashboard widgets** - drag and drop interface
- [ ] **Alert system** - notifications for critical events
- [ ] **Remote control capabilities** - start/stop services remotely
- [ ] **Plugin architecture** - extensible module system
- [ ] **Multi-user support** - team collaboration features

---

**Built for Jordan Ehrig's MAGI Infrastructure** 🥷
*Ehrig BIM & IT - 100x Productivity Amplification*