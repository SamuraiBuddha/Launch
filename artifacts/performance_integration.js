// MAGI Performance Integration Hooks
// Connects hardware monitoring to the performance dashboard

const MAGIHardwareMonitor = require('./hardware_monitor.js');
const { ipcMain, BrowserWindow } = require('electron');

class MAGIPerformanceIntegration {
    constructor() {
        this.hardwareMonitor = new MAGIHardwareMonitor();
        this.performanceWindow = null;
        this.sshGridWindow = null;
        this.realTimeData = new Map();
        this.isMonitoring = false;
        
        this.setupIPC();
        this.initializeMachines();
    }

    setupIPC() {
        // Handle performance module requests
        ipcMain.handle('performance-start-monitoring', async () => {
            return await this.startMonitoring();
        });

        ipcMain.handle('performance-stop-monitoring', async () => {
            return await this.stopMonitoring();
        });

        ipcMain.handle('performance-get-metrics', async () => {
            return this.getAllCurrentMetrics();
        });

        ipcMain.handle('performance-get-machine-detail', async (event, machineName) => {
            return await this.getMachineDetailedMetrics(machineName);
        });

        // SSH Terminal integration
        ipcMain.handle('ssh-connect', async (event, machineName) => {
            return await this.connectSSH(machineName);
        });

        ipcMain.handle('ssh-execute-command', async (event, machineName, command) => {
            return await this.executeSSHCommand(machineName, command);
        });

        ipcMain.handle('ssh-get-terminal-history', async (event, machineName) => {
            return this.getTerminalHistory(machineName);
        });

        // Real-time updates for UI
        ipcMain.handle('performance-subscribe-updates', (event) => {
            this.setupRealTimeUpdates(event.sender);
        });
    }

    initializeMachines() {
        // Define the MAGI fleet configuration
        this.magiMachines = [
            {
                name: 'Melchior',
                host: '192.168.50.30',
                user: 'jordan',
                os: 'linux',
                gpu: 'RTX A5000',
                role: 'Primary AI Workstation',
                specs: {
                    cpu: 'AMD EPYC 7713 64-Core',
                    memory: '256GB DDR4',
                    storage: '2TB NVMe SSD'
                }
            },
            {
                name: 'Balthasar',
                host: '192.168.50.31',
                user: 'jordan',
                os: 'linux',
                gpu: 'RTX A4000',
                role: 'Development & Testing',
                specs: {
                    cpu: 'Intel Core i9-13900K',
                    memory: '128GB DDR5',
                    storage: '1TB NVMe SSD'
                }
            },
            {
                name: 'Caspar',
                host: '192.168.50.32',
                user: 'jordan',
                os: 'linux',
                gpu: 'RTX 3090',
                role: 'Training & Inference',
                specs: {
                    cpu: 'AMD Ryzen 9 7950X',
                    memory: '64GB DDR5',
                    storage: '2TB NVMe SSD'
                }
            },
            {
                name: 'Adam',
                host: '192.168.50.40',
                user: 'jordan',
                os: 'linux',
                type: 'nas',
                role: 'Storage & Backup',
                specs: {
                    cpu: 'Intel Xeon E-2278G',
                    memory: '32GB ECC',
                    storage: '48TB RAID-Z2'
                }
            },
            {
                name: 'Lilith',
                host: '192.168.50.41',
                user: 'jordan',
                os: 'linux',
                type: 'nas',
                role: 'Secondary Storage',
                specs: {
                    cpu: 'AMD Ryzen 7 5700G',
                    memory: '64GB ECC',
                    storage: '96TB RAID-Z3'
                }
            }
        ];

        // Terminal history storage
        this.terminalHistory = new Map();
        this.magiMachines.forEach(machine => {
            this.terminalHistory.set(machine.name, []);
        });
    }

    async startMonitoring() {
        try {
            if (this.isMonitoring) {
                return { success: true, message: 'Monitoring already active' };
            }

            console.log('🚀 Starting MAGI fleet monitoring...');
            
            // Start hardware monitoring for all machines
            await this.hardwareMonitor.startHybridMonitoring(this.magiMachines);
            
            this.isMonitoring = true;
            
            // Set up periodic data collection
            this.monitoringInterval = setInterval(() => {
                this.updateRealTimeMetrics();
            }, 3000); // Update every 3 seconds

            // Notify all connected windows
            this.broadcastToWindows('monitoring-started', { 
                machines: this.magiMachines,
                timestamp: Date.now()
            });

            return { 
                success: true, 
                message: 'MAGI monitoring started successfully',
                machines: this.magiMachines.length
            };

        } catch (error) {
            console.error('Failed to start monitoring:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async stopMonitoring() {
        try {
            if (!this.isMonitoring) {
                return { success: true, message: 'Monitoring not active' };
            }

            console.log('🛑 Stopping MAGI fleet monitoring...');
            
            // Stop monitoring intervals
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }

            // Stop hardware monitoring for all machines
            this.magiMachines.forEach(machine => {
                this.hardwareMonitor.stopMonitoring(machine.name);
            });

            this.isMonitoring = false;
            this.realTimeData.clear();

            // Notify all connected windows
            this.broadcastToWindows('monitoring-stopped', { 
                timestamp: Date.now()
            });

            return { 
                success: true, 
                message: 'MAGI monitoring stopped successfully' 
            };

        } catch (error) {
            console.error('Failed to stop monitoring:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async updateRealTimeMetrics() {
        for (const machine of this.magiMachines) {
            try {
                // Get real-time metrics from monitoring agent
                const metrics = await this.hardwareMonitor.getRealTimeMetrics(machine);
                
                if (metrics) {
                    // Process and enhance the metrics
                    const processedMetrics = this.processMetrics(machine, metrics);
                    
                    // Store for retrieval
                    this.realTimeData.set(machine.name, {
                        machine: machine,
                        metrics: processedMetrics,
                        timestamp: Date.now(),
                        status: 'online'
                    });

                    // Broadcast to all listening windows
                    this.broadcastToWindows('metrics-update', {
                        machine: machine.name,
                        data: processedMetrics
                    });
                }
            } catch (error) {
                console.error(`Metrics update failed for ${machine.name}:`, error.message);
                
                // Store error state
                this.realTimeData.set(machine.name, {
                    machine: machine,
                    metrics: null,
                    timestamp: Date.now(),
                    status: 'offline',
                    error: error.message
                });

                // Broadcast error state
                this.broadcastToWindows('metrics-error', {
                    machine: machine.name,
                    error: error.message
                });
            }
        }
    }

    processMetrics(machine, rawMetrics) {
        // Enhanced metrics processing for dashboard
        const processed = {
            machine: machine.name,
            timestamp: Date.now(),
            cpu: {
                usage: rawMetrics.cpu?.usage || 0,
                temperature: rawMetrics.cpu?.temp || 0,
                cores: machine.specs?.cpu || 'Unknown'
            },
            gpu: Array.isArray(rawMetrics.gpu) ? rawMetrics.gpu[0] : rawMetrics.gpu || {},
            memory: {
                total: rawMetrics.memory?.total || 0,
                used: rawMetrics.memory?.used || 0,
                available: rawMetrics.memory?.available || 0,
                usage_percent: rawMetrics.memory?.total ? 
                    ((rawMetrics.memory.used / rawMetrics.memory.total) * 100).toFixed(1) : 0
            },
            network: {
                interface: 'eth0',
                speed: '10Gbps',
                status: 'connected'
            },
            system: {
                uptime: rawMetrics.uptime || 'Unknown',
                load: rawMetrics.load || [0, 0, 0],
                processes: rawMetrics.processes || 0
            },
            // Calculate derived metrics
            performance_score: this.calculatePerformanceScore(rawMetrics),
            health_status: this.determineHealthStatus(rawMetrics),
            amplification_rate: this.calculateAmplificationRate(machine, rawMetrics)
        };

        return processed;
    }

    calculatePerformanceScore(metrics) {
        // Performance scoring algorithm
        let score = 100;
        
        if (metrics.cpu?.usage > 90) score -= 20;
        else if (metrics.cpu?.usage > 70) score -= 10;
        
        if (metrics.cpu?.temp > 80) score -= 15;
        else if (metrics.cpu?.temp > 70) score -= 5;
        
        if (metrics.gpu?.temperature > 85) score -= 15;
        else if (metrics.gpu?.temperature > 75) score -= 5;
        
        if (metrics.memory?.usage_percent > 90) score -= 10;
        
        return Math.max(0, score);
    }

    determineHealthStatus(metrics) {
        const cpuOk = (metrics.cpu?.usage || 0) < 95 && (metrics.cpu?.temp || 0) < 85;
        const gpuOk = (metrics.gpu?.temperature || 0) < 90 && (metrics.gpu?.utilization || 0) < 100;
        const memOk = (metrics.memory?.usage_percent || 0) < 95;
        
        if (cpuOk && gpuOk && memOk) return 'healthy';
        if ((metrics.cpu?.temp || 0) > 85 || (metrics.gpu?.temperature || 0) > 90) return 'warning';
        return 'critical';
    }

    calculateAmplificationRate(machine, metrics) {
        // Calculate AI amplification rate based on machine role and performance
        const baseRate = machine.role === 'Primary AI Workstation' ? 1000 : 
                         machine.role === 'Training & Inference' ? 850 :
                         machine.role === 'Development & Testing' ? 600 : 100;
        
        const efficiency = (100 - (metrics.cpu?.usage || 0)) / 100;
        return Math.floor(baseRate * efficiency);
    }

    getAllCurrentMetrics() {
        const result = {};
        for (const [machineName, data] of this.realTimeData.entries()) {
            result[machineName] = data;
        }
        return result;
    }

    async getMachineDetailedMetrics(machineName) {
        try {
            const machine = this.magiMachines.find(m => m.name === machineName);
            if (!machine) {
                throw new Error(`Machine ${machineName} not found`);
            }

            // Get detailed metrics including hardware tool data
            let detailedMetrics;
            if (machine.os === 'windows') {
                detailedMetrics = await this.hardwareMonitor.monitorWindowsSystem(machine);
            } else {
                detailedMetrics = await this.hardwareMonitor.monitorLinuxSystem(machine);
            }

            return {
                machine: machine,
                detailed: detailedMetrics,
                realTime: this.realTimeData.get(machineName)?.metrics || null,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error(`Failed to get detailed metrics for ${machineName}:`, error);
            return {
                error: error.message,
                machine: machineName,
                timestamp: Date.now()
            };
        }
    }

    // SSH Terminal Integration
    async connectSSH(machineName) {
        try {
            const machine = this.magiMachines.find(m => m.name === machineName);
            if (!machine) {
                throw new Error(`Machine ${machineName} not found`);
            }

            // Test SSH connection
            const testCommand = 'echo "Connection test successful"';
            const result = await this.hardwareMonitor.executeSSHCommand(machine, testCommand);
            
            // Initialize terminal history if not exists
            if (!this.terminalHistory.has(machineName)) {
                this.terminalHistory.set(machineName, []);
            }

            // Add connection message to history
            this.addToTerminalHistory(machineName, `Connected to ${machine.name} (${machine.host})`);
            this.addToTerminalHistory(machineName, result);

            return {
                success: true,
                machine: machine,
                message: 'SSH connection established'
            };

        } catch (error) {
            console.error(`SSH connection failed for ${machineName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async executeSSHCommand(machineName, command) {
        try {
            const machine = this.magiMachines.find(m => m.name === machineName);
            if (!machine) {
                throw new Error(`Machine ${machineName} not found`);
            }

            // Add command to history
            this.addToTerminalHistory(machineName, `${machine.user}@${machine.name}:~$ ${command}`);

            // Execute command
            const result = await this.hardwareMonitor.executeSSHCommand(machine, command);
            
            // Add result to history
            this.addToTerminalHistory(machineName, result);

            return {
                success: true,
                output: result,
                command: command,
                machine: machineName
            };

        } catch (error) {
            const errorMsg = `Error: ${error.message}`;
            this.addToTerminalHistory(machineName, errorMsg);
            
            return {
                success: false,
                error: error.message,
                command: command,
                machine: machineName
            };
        }
    }

    getTerminalHistory(machineName) {
        return this.terminalHistory.get(machineName) || [];
    }

    addToTerminalHistory(machineName, message) {
        const history = this.terminalHistory.get(machineName) || [];
        history.push({
            timestamp: Date.now(),
            message: message
        });
        
        // Keep only last 1000 entries
        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }
        
        this.terminalHistory.set(machineName, history);
    }

    // Window management and broadcasting
    setupRealTimeUpdates(webContents) {
        // Store reference to web contents for broadcasting
        if (!this.connectedWindows) {
            this.connectedWindows = new Set();
        }
        this.connectedWindows.add(webContents);

        // Clean up when window closes
        webContents.once('destroyed', () => {
            this.connectedWindows.delete(webContents);
        });
    }

    broadcastToWindows(channel, data) {
        if (!this.connectedWindows) return;
        
        for (const webContents of this.connectedWindows) {
            try {
                if (!webContents.isDestroyed()) {
                    webContents.send(channel, data);
                }
            } catch (error) {
                console.error('Failed to broadcast to window:', error);
                this.connectedWindows.delete(webContents);
            }
        }
    }

    // Utility methods
    getMachineByName(name) {
        return this.magiMachines.find(m => m.name === name);
    }

    getAllMachines() {
        return this.magiMachines;
    }

    getMonitoringStatus() {
        return {
            isActive: this.isMonitoring,
            machineCount: this.magiMachines.length,
            connectedMachines: Array.from(this.realTimeData.keys()),
            uptime: this.monitoringStartTime ? Date.now() - this.monitoringStartTime : 0
        };
    }
}

module.exports = MAGIPerformanceIntegration;