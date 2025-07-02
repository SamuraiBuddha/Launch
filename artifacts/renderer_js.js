const { ipcRenderer } = require('electron');
const d3 = require('d3');

class MAGIRenderer {
    constructor() {
        this.currentMode = 'graph';
        this.graphData = null;
        this.sshConnections = new Map();
        this.initializeUI();
        this.startMetricsUpdater();
        this.loadGraph();
    }

    initializeUI() {
        // Titlebar controls
        document.getElementById('minimize-btn').addEventListener('click', () => {
            ipcRenderer.invoke('window-minimize');
        });

        document.getElementById('maximize-btn').addEventListener('click', () => {
            ipcRenderer.invoke('window-maximize');
        });

        document.getElementById('close-btn').addEventListener('click', () => {
            ipcRenderer.invoke('window-close');
        });

        // Mode toggle buttons
        document.getElementById('graph-mode-btn').addEventListener('click', () => {
            this.switchMode('graph');
        });

        document.getElementById('terminal-mode-btn').addEventListener('click', () => {
            this.switchMode('terminal');
        });

        // SSH connection buttons
        document.querySelectorAll('.ssh-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const machine = e.target.dataset.machine;
                this.connectSSH(machine);
            });
        });

        // Quick action buttons
        document.getElementById('open-performance').addEventListener('click', () => {
            this.openModule('performance');
        });

        document.getElementById('open-logs').addEventListener('click', () => {
            this.openModule('logs');
        });

        document.getElementById('open-network').addEventListener('click', () => {
            this.openModule('network');
        });

        document.getElementById('refresh-graph').addEventListener('click', () => {
            this.loadGraph();
        });
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (mode === 'graph') {
            document.getElementById('graph-mode-btn').classList.add('active');
            document.getElementById('graph-view').classList.remove('hidden');
            document.getElementById('terminal-view').classList.add('hidden');
            document.getElementById('ssh-buttons').style.display = 'none';
        } else {
            document.getElementById('terminal-mode-btn').classList.add('active');
            document.getElementById('graph-view').classList.add('hidden');
            document.getElementById('terminal-view').classList.remove('hidden');
            document.getElementById('ssh-buttons').style.display = 'flex';
            this.initializeTerminals();
        }
    }

    async loadGraph() {
        const container = document.getElementById('graph-container');
        const loading = document.querySelector('.graph-loading');
        
        loading.style.display = 'flex';
        container.innerHTML = '';

        try {
            // Query AGE database for graph data
            const query = `
                SELECT * FROM cypher('magi_graph', $$
                    MATCH (n)-[r]->(m)
                    RETURN n, r, m
                    LIMIT 100
                $$) as (source agtype, relation agtype, target agtype);
            `;
            
            const graphData = await ipcRenderer.invoke('db-query', query);
            this.renderGraph(graphData);
            loading.style.display = 'none';
            
        } catch (error) {
            console.error('Graph loading error:', error);
            container.innerHTML = `
                <div style="text-align: center; color: #f44336; padding: 50px;">
                    <h3>⚠️ Graph Connection Failed</h3>
                    <p>Unable to connect to AGE database</p>
                    <p style="font-size: 12px; opacity: 0.7;">${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4CAF50; border: none; border-radius: 5px; color: white; cursor: pointer;">Retry Connection</button>
                </div>
            `;
            loading.style.display = 'none';
        }
    }

    renderGraph(data) {
        const container = document.getElementById('graph-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Create simulation
        const simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Process data into nodes and links
        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        data.forEach(row => {
            const source = JSON.parse(row.source);
            const target = JSON.parse(row.target);
            const relation = JSON.parse(row.relation);

            // Add nodes
            if (!nodeMap.has(source.id)) {
                nodeMap.set(source.id, {
                    id: source.id,
                    label: source.properties?.name || source.label || `Node ${source.id}`,
                    type: source.label,
                    ...source.properties
                });
                nodes.push(nodeMap.get(source.id));
            }

            if (!nodeMap.has(target.id)) {
                nodeMap.set(target.id, {
                    id: target.id,
                    label: target.properties?.name || target.label || `Node ${target.id}`,
                    type: target.label,
                    ...target.properties
                });
                nodes.push(nodeMap.get(target.id));
            }

            // Add link
            links.push({
                source: source.id,
                target: target.id,
                type: relation.type,
                ...relation.properties
            });
        });

        // Create links
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('stroke', '#4CAF50')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);

        // Create nodes
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', 8)
            .attr('fill', d => this.getNodeColor(d.type))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .call(d3.drag()
                .on('start', this.dragstarted)
                .on('drag', this.dragged)
                .on('end', this.dragended));

        // Add labels
        const label = svg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter().append('text')
            .text(d => d.label)
            .attr('font-size', 12)
            .attr('font-family', 'Arial')
            .attr('fill', '#fff')
            .attr('text-anchor', 'middle')
            .attr('dy', 25);

        // Add tooltips
        node.append('title')
            .text(d => `${d.label}\nType: ${d.type}\nID: ${d.id}`);

        // Update simulation
        simulation
            .nodes(nodes)
            .on('tick', ticked);

        simulation.force('link')
            .links(links);

        function ticked() {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        }
    }

    getNodeColor(type) {
        const colors = {
            'Session_Entry': '#4CAF50',
            'Technical_Analysis': '#2196F3',
            'Development_Plan': '#FF9800',
            'Business_Partnership': '#9C27B0',
            'Preference_Update': '#00BCD4',
            'default': '#757575'
        };
        return colors[type] || colors.default;
    }

    dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    async connectSSH(machine) {
        try {
            const connection = await ipcRenderer.invoke('ssh-connect', machine);
            this.sshConnections.set(machine, connection);
            
            const terminalElement = document.getElementById(`${machine}-terminal`);
            terminalElement.innerHTML = `
                <div style="color: #4CAF50;">✅ Connected to ${machine}</div>
                <div style="color: #ccc; margin-top: 10px;">jordan@${machine}:~$ <span class="cursor">|</span></div>
            `;
            
            // Simulate some initial output
            setTimeout(() => {
                terminalElement.innerHTML += `
                    <div style="color: #ccc;">nvidia-smi</div>
                    <div style="color: #00BCD4; font-size: 10px; margin: 5px 0;">
                        GPU 0: RTX A5000 (Driver: 535.104.05, CUDA: 12.2)<br>
                        Memory: 15240MiB / 24564MiB | Temp: 72°C | Power: 180W / 230W
                    </div>
                    <div style="color: #ccc;">jordan@${machine}:~$ <span class="cursor">|</span></div>
                `;
            }, 2000);
            
        } catch (error) {
            console.error(`SSH connection failed for ${machine}:`, error);
            const terminalElement = document.getElementById(`${machine}-terminal`);
            terminalElement.innerHTML = `
                <div style="color: #f44336;">❌ Connection failed</div>
                <div style="color: #888; font-size: 11px;">${error.message}</div>
            `;
        }
    }

    initializeTerminals() {
        // Auto-connect to all MAGI machines when terminal mode is activated
        const machines = ['melchior', 'balthazar', 'caspar', 'adam', 'lilith'];
        machines.forEach(machine => {
            if (!this.sshConnections.has(machine)) {
                this.connectSSH(machine);
            }
        });
    }

    async openModule(moduleType) {
        try {
            await ipcRenderer.invoke('create-module', moduleType);
        } catch (error) {
            console.error(`Failed to open ${moduleType} module:`, error);
        }
    }

    startMetricsUpdater() {
        setInterval(() => {
            this.updateMetrics();
        }, 2000);
    }

    updateMetrics() {
        // Simulate real-time metrics updates
        const elements = {
            'inference-rate': () => Math.floor(120 + Math.random() * 20),
            'amplification': () => Math.floor(800 + Math.random() * 100) + 'x',
            'response-time': () => (2.0 + Math.random() * 0.8).toFixed(1) + 's',
            'melchior-status': () => Math.floor(70 + Math.random() * 8) + '°C',
            'balthazar-status': () => Math.floor(75 + Math.random() * 8) + '°C',
            'caspar-status': () => Math.floor(65 + Math.random() * 8) + '°C'
        };

        Object.entries(elements).forEach(([id, valueFunc]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = valueFunc();
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.magiRenderer = new MAGIRenderer();
});

// Add some CSS for terminal cursor animation
const style = document.createElement('style');
style.textContent = `
    .cursor {
        animation: blink 1s infinite;
    }
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }
`;
document.head.appendChild(style);