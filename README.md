# 🚀 Launch - MAGI Infrastructure Dashboard

<div align="center">
  <img src="https://i.imgur.com/7vQD2Zs.png" alt="Launch from Dragon Ball" width="300">
  
  *"With my genius engineering, I'll make this infrastructure run perfectly!"*
  
  **Launch** - Your one-click deployment and monitoring solution for the entire MAGI AI ecosystem
</div>

## 🎯 Overview

Named after Launch (Bulma's sister) from Dragon Ball - the brilliant engineer who can fix and optimize any technology - this dashboard provides centralized control over your distributed AI infrastructure.

Launch brings together:
- 🧠 **Hybrid Memory System** (PostgreSQL + pgvector + Apache AGE + Redis + Qdrant)
- 🤖 **AI Services** (LM Studio, ComfyUI, VLLM Shadow Clones)
- 🖥️ **MAGI Fleet** (Melchior, Balthazar, Caspar)
- 💾 **NAS Systems** (Lilith, Adam)
- 🔄 **Orchestration** (n8n workflows, Docker containers)
- 📊 **Monitoring** (Real-time status, resource usage, health checks)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     LAUNCH DASHBOARD                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Status    │  │   Deploy    │  │  Monitor    │         │
│  │   Panel     │  │   Center    │  │   Suite     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────┬───────────────────────────────────┘
                          │
    ┌─────────────────────┴─────────────────────┐
    │                                           │
┌───▼────────┐  ┌────────────┐  ┌─────────────▼────┐
│   MAGI     │  │    NAS     │  │    Services      │
│ Melchior   │  │   Lilith   │  │  Hybrid Memory   │
│ Balthazar  │  │   Adam     │  │  LM Studio       │
│ Caspar     │  └────────────┘  │  ComfyUI         │
└────────────┘                   │  VLLM Clones     │
                                 │  n8n Workflows   │
                                 └──────────────────┘
```

## 🚀 Quick Start

### One-Click Launch Everything
```bash
# Clone the repository
git clone https://github.com/SamuraiBuddha/Launch.git
cd Launch

# Make scripts executable
chmod +x scripts/*.sh

# Launch everything!
./launch-all.sh
```

### Individual Components
```bash
# Launch Hybrid Memory Stack
./scripts/launch-hybrid-memory.sh

# Launch AI Services
./scripts/launch-ai-services.sh

# Launch VLLM Shadow Clones
./scripts/launch-shadow-clones.sh

# Launch Monitoring Dashboard
./scripts/launch-dashboard.sh
```

## 📁 Repository Structure

```
Launch/
├── README.md                    # You are here
├── launch-all.sh               # Master launch script
├── scripts/
│   ├── launch-hybrid-memory.sh # Start cognitive stack
│   ├── launch-ai-services.sh   # Start LM Studio, ComfyUI
│   ├── launch-shadow-clones.sh # Deploy VLLM on MAGI
│   ├── launch-dashboard.sh     # Start monitoring
│   └── health-check.sh         # System health verification
├── configs/
│   ├── docker-compose.yml      # Container orchestration
│   ├── nginx.conf              # Load balancer config
│   └── prometheus.yml          # Monitoring config
├── dashboard/
│   ├── index.html              # Web dashboard
│   ├── css/                    # Styling
│   └── js/                     # Interactive elements
├── workflows/
│   ├── memory-gateway.json     # n8n shadow clone workflow
│   ├── health-monitor.json     # System monitoring workflow
│   └── deployment.json         # Auto-deployment workflow
└── docs/
    ├── ARCHITECTURE.md         # Detailed architecture
    ├── DEPLOYMENT.md           # Deployment guide
    └── TROUBLESHOOTING.md      # Common issues
```

## 🎮 Dashboard Features

### 1. **Status Panel** 
Real-time status of all systems:
- 🟢 Hybrid Memory (PostgreSQL, Redis, Qdrant)
- 🟡 MAGI Nodes (GPU temps, memory usage)
- 🔵 AI Services (LM Studio, ComfyUI, VLLM)
- 🟣 Network Health (10GbE throughput)

### 2. **Deploy Center**
One-click deployment:
- Docker containers
- VLLM models
- n8n workflows
- Database initialization
- Service configurations

### 3. **Monitor Suite**
Comprehensive monitoring:
- Resource usage graphs
- Container logs
- Performance metrics
- Shadow clone analytics
- Memory system queries/sec

## 🛠️ Components

### Hybrid Memory System
```bash
# Managed services:
- PostgreSQL 16 with pgvector + Apache AGE
- Redis 7 (caching layer)
- Qdrant (vector search)
- LM Studio (embeddings on port 1234)
```

### AI Services
```bash
# Desktop applications:
- LM Studio (local embeddings)
- ComfyUI (image generation)
- Claude Desktop (with MCP servers)
```

### VLLM Shadow Clones
```bash
# Distributed inference:
- Melchior: Llama-3.1-70B (port 8000)
- Caspar: DeepSeek-V3 (port 8001)
- Balthazar: Mistral-7B (port 8002)
```

### Infrastructure
```bash
# MAGI Fleet:
- Melchior (192.168.50.30) - RTX A5000 24GB
- Balthazar (192.168.50.20) - RTX A4000 16GB
- Caspar (192.168.50.21) - RTX 3090 24GB

# NAS Systems:
- Lilith (192.168.50.10) - Primary AI/Dev
- Adam (192.168.50.11) - Business Storage
```

## 📊 Monitoring Dashboards

### System Overview
- CPU/GPU/Memory usage across all nodes
- Network traffic visualization
- Container health status
- Service availability matrix

### AI Performance
- Inference requests/second
- Model loading times
- Memory usage by model
- Token generation speed

### Shadow Clone Analytics
- Parallel execution timing
- Clone synchronization metrics
- Emergent pattern detection
- Amplification measurements (10x → 10000x)

## 🔧 Configuration

### Environment Variables
```bash
# Edit .env file for your setup
MELCHIOR_IP=192.168.50.30
BALTHAZAR_IP=192.168.50.20
CASPAR_IP=192.168.50.21
LILITH_IP=192.168.50.10
ADAM_IP=192.168.50.11

# Service Ports
POSTGRES_PORT=5432
REDIS_PORT=6379
QDRANT_PORT=6333
LM_STUDIO_PORT=1234
COMFYUI_PORT=8188
N8N_PORT=5678
```

### Claude Desktop Integration
The launch script automatically updates your `claude_desktop_config.json` with all active MCP servers:
- hybrid-memory
- comfyui
- github
- desktop-commander
- docker

## 🎯 Use Cases

### Morning Startup Routine
1. Click Launch shortcut on desktop
2. All services start in correct order
3. Dashboard opens showing system status
4. Claude Desktop launches with full MCP suite
5. Ready for 100x productivity!

### Shadow Clone Deployment
1. Select models for each MAGI node
2. Click "Deploy Shadow Clones"
3. Monitor parallel inference performance
4. Measure amplification metrics

### System Health Check
1. View real-time resource usage
2. Check container logs
3. Verify network connectivity
4. Test memory system queries

## 🚨 Troubleshooting

### Common Issues
- **Service won't start**: Check Docker daemon
- **GPU not detected**: Verify NVIDIA drivers
- **Network timeout**: Check firewall rules
- **Memory errors**: Increase Docker memory limit

### Health Check
```bash
./scripts/health-check.sh
```

This runs comprehensive diagnostics:
- Docker container status
- GPU availability
- Network connectivity
- Database connections
- Service endpoints

## 🎊 Advanced Features

### Auto-Scaling
- Dynamic VLLM model loading based on demand
- Automatic container restart on failure
- Resource-based scaling policies

### Backup & Recovery
- Automated database backups to NAS
- Configuration versioning
- One-click restore functionality

### Integration
- Slack notifications for system events
- GitHub Actions for CI/CD
- Prometheus/Grafana for metrics

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

MIT License - Use Launch to power your AI infrastructure!

---

<div align="center">
  <i>"Just like Launch can turn a simple capsule into a house, we're turning your MAGI nodes into an AI powerhouse!"</i>
  
  🚀 **Launch** - Because every genius engineer needs a control center! 🚀
</div>