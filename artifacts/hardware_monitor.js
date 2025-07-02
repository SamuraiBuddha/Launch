// MAGI Hardware Monitoring Integration System
// Supports multiple approaches for gathering system metrics

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

class MAGIHardwareMonitor {
    constructor() {
        this.sshConnections = new Map();
        this.monitoringData = new Map();
        this.updateInterval = 5000; // 5 seconds
        this.setupMonitoringTools();
    }

    setupMonitoringTools() {
        // Define monitoring tool configurations for each OS
        this.monitoringTools = {
            windows: {
                cpu: {
                    cpuz: 'cpuz.exe -txt=cpu_report.txt',
                    wmic: 'wmic cpu get name,maxclockspeed,numberofcores,loadpercentage /format:csv',
                    powershell: 'Get-WmiObject Win32_Processor | Select-Object Name,MaxClockSpeed,NumberOfCores,LoadPercentage | ConvertTo-Json'
                },
                gpu: {
                    gpuz: 'GPU-Z.exe -dump',
                    nvidiasmi: 'nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw --format=csv,noheader,nounits',
                    nvml: 'nvidia-ml-py --query-gpu --format=json'
                },
                system: {
                    aida64: 'aida64.exe /R report.xml /XML',
                    systeminfo: 'systeminfo',
                    perfmon: 'typeperf "\\Processor(_Total)\\% Processor Time" "\\Memory\\Available MBytes" -sc 1'
                },
                network: {
                    iperf3: 'iperf3 -c TARGET_HOST -J',
                    netstat: 'netstat -e',
                    perfmon_net: 'typeperf "\\Network Interface(*)\\Bytes Total/sec" -sc 1'
                }
            },
            linux: {
                cpu: {
                    cpuinfo: 'cat /proc/cpuinfo',
                    lscpu: 'lscpu -J',
                    top: 'top -bn1 | grep "Cpu(s)"',
                    htop: 'htop -d 1 -n 1 --print-only',
                    sensors: 'sensors -A -j'
                },
                gpu: {
                    nvidiasmi: 'nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw --format=csv,noheader,nounits',
                    nvidiasmi_json: 'nvidia-smi -q -x',
                    rocm: 'rocm-smi --showtemp --showpower --showuse --json'
                },
                system: {
                    meminfo: 'cat /proc/meminfo',
                    vmstat: 'vmstat 1 2 | tail -1',
                    iostat: 'iostat -x 1 1',
                    free: 'free -h',
                    uptime: 'uptime',
                    lshw: 'lshw -json'
                },
                network: {
                    iperf3: 'iperf3 -c TARGET_HOST -J',
                    ss: 'ss -tuln',
                    iftop: 'iftop -t -s 10',
                    nethogs: 'nethogs -t -d 5',
                    vnstat: 'vnstat -i eth0 --json'
                }
            }
        };
    }

    // SSH-based monitoring approach
    async executeSSHCommand(machine, command) {
        try {
            const sshCommand = `ssh ${machine.user}@${machine.host} "${command}"`;
            const { stdout, stderr } = await execAsync(sshCommand);
            
            if (stderr && !stderr.includes('Warning')) {
                throw new Error(stderr);
            }
            
            return stdout.trim();
        } catch (error) {
            console.error(`SSH command failed for ${machine.name}:`, error.message);
            throw error;
        }
    }

    // Windows-specific monitoring via SSH
    async monitorWindowsSystem(machine) {
        const metrics = {};
        
        try {
            // CPU-Z data (if installed)
            try {
                await this.executeSSHCommand(machine, this.monitoringTools.windows.cpu.cpuz);
                const cpuzData = await this.executeSSHCommand(machine, 'type cpu_report.txt');
                metrics.cpu = this.parseCPUZOutput(cpuzData);
            } catch (e) {
                // Fallback to WMIC
                const wmicData = await this.executeSSHCommand(machine, this.monitoringTools.windows.cpu.wmic);
                metrics.cpu = this.parseWMICOutput(wmicData);
            }

            // GPU-Z data (if installed)
            try {
                await this.executeSSHCommand(machine, this.monitoringTools.windows.gpu.gpuz);
                const gpuzData = await this.executeSSHCommand(machine, 'type GPUZ_dump.txt');
                metrics.gpu = this.parseGPUZOutput(gpuzData);
            } catch (e) {
                // Fallback to nvidia-smi
                const nvidiaSmiData = await this.executeSSHCommand(machine, this.monitoringTools.windows.gpu.nvidiasmi);
                metrics.gpu = this.parseNvidiaSmiOutput(nvidiaSmiData);
            }

            // AIDA64 data (if installed)
            try {
                await this.executeSSHCommand(machine, this.monitoringTools.windows.system.aida64);
                const aida64Data = await this.executeSSHCommand(machine, 'type report.xml');
                metrics.system = this.parseAIDA64Output(aida64Data);
            } catch (e) {
                // Fallback to systeminfo
                const systeminfoData = await this.executeSSHCommand(machine, this.monitoringTools.windows.system.systeminfo);
                metrics.system = this.parseSystemInfoOutput(systeminfoData);
            }

            // Network performance
            const iperf3Data = await this.executeSSHCommand(machine, 
                this.monitoringTools.windows.network.iperf3.replace('TARGET_HOST', '192.168.50.1'));
            metrics.network = JSON.parse(iperf3Data);

        } catch (error) {
            console.error(`Windows monitoring failed for ${machine.name}:`, error.message);
            metrics.error = error.message;
        }

        return metrics;
    }

    // Linux-specific monitoring via SSH  
    async monitorLinuxSystem(machine) {
        const metrics = {};
        
        try {
            // CPU metrics
            const cpuData = await this.executeSSHCommand(machine, this.monitoringTools.linux.cpu.lscpu);
            const topData = await this.executeSSHCommand(machine, this.monitoringTools.linux.cpu.top);
            const sensorsData = await this.executeSSHCommand(machine, this.monitoringTools.linux.cpu.sensors);
            
            metrics.cpu = {
                info: JSON.parse(cpuData),
                usage: this.parseTopOutput(topData),
                temperature: JSON.parse(sensorsData)
            };

            // GPU metrics (NVIDIA)
            try {
                const nvidiaSmiData = await this.executeSSHCommand(machine, this.monitoringTools.linux.gpu.nvidiasmi);
                metrics.gpu = this.parseNvidiaSmiOutput(nvidiaSmiData);
            } catch (e) {
                metrics.gpu = { error: 'NVIDIA GPU not found or nvidia-smi not available' };
            }

            // System metrics
            const meminfoData = await this.executeSSHCommand(machine, this.monitoringTools.linux.system.meminfo);
            const vmstatData = await this.executeSSHCommand(machine, this.monitoringTools.linux.system.vmstat);
            const uptimeData = await this.executeSSHCommand(machine, this.monitoringTools.linux.system.uptime);
            
            metrics.system = {
                memory: this.parseMeminfoOutput(meminfoData),
                performance: this.parseVmstatOutput(vmstatData),
                uptime: this.parseUptimeOutput(uptimeData)
            };

            // Network performance
            const iperf3Data = await this.executeSSHCommand(machine, 
                this.monitoringTools.linux.network.iperf3.replace('TARGET_HOST', '192.168.50.1'));
            metrics.network = JSON.parse(iperf3Data);

        } catch (error) {
            console.error(`Linux monitoring failed for ${machine.name}:`, error.message);
            metrics.error = error.message;
        }

        return metrics;
    }

    // Alternative: Agent-based monitoring approach
    async deployMonitoringAgent(machine) {
        const agentScript = `
#!/bin/bash
# MAGI Monitoring Agent
while true; do
    echo "{\\"timestamp\\": $(date +%s),"
    echo "\\"cpu\\": {"
    echo "  \\"usage\\": $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1),"
    echo "  \\"temp\\": $(sensors | grep 'Core 0' | awk '{print $3}' | cut -d'+' -f2 | cut -d'°' -f1)"
    echo "},"
    echo "\\"gpu\\": {"
    nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total,power.draw --format=csv,noheader,nounits | awk -F',' '{
        print "  \\"temperature\\": " $1 ","
        print "  \\"utilization\\": " $2 ","
        print "  \\"memory_used\\": " $3 ","
        print "  \\"memory_total\\": " $4 ","
        print "  \\"power_draw\\": " $5
    }'
    echo "},"
    echo "\\"memory\\": {"
    free | grep Mem | awk '{print "  \\"total\\": " $2 ", \\"used\\": " $3 ", \\"available\\": " $7}'
    echo "}}"
    sleep 5
done > /tmp/magi_metrics.json
        `;

        try {
            // Deploy agent script
            await this.executeSSHCommand(machine, `cat > /tmp/magi_agent.sh << 'EOF'${agentScript}EOF`);
            await this.executeSSHCommand(machine, 'chmod +x /tmp/magi_agent.sh');
            
            // Start agent in background
            await this.executeSSHCommand(machine, 'nohup /tmp/magi_agent.sh &');
            
            console.log(`Monitoring agent deployed to ${machine.name}`);
            return true;
        } catch (error) {
            console.error(`Failed to deploy agent to ${machine.name}:`, error.message);
            return false;
        }
    }

    // Hybrid approach: Real-time monitoring with periodic tool execution
    async startHybridMonitoring(machines) {
        for (const machine of machines) {
            // Deploy lightweight agent for continuous metrics
            await this.deployMonitoringAgent(machine);
            
            // Schedule periodic detailed scans
            setInterval(async () => {
                try {
                    let metrics;
                    if (machine.os === 'windows') {
                        metrics = await this.monitorWindowsSystem(machine);
                    } else {
                        metrics = await this.monitorLinuxSystem(machine);
                    }
                    
                    // Store in monitoring data map
                    this.monitoringData.set(machine.name, {
                        timestamp: Date.now(),
                        detailed: metrics,
                        machine: machine
                    });
                    
                    // Emit update event for UI
                    this.emitMetricsUpdate(machine.name, metrics);
                    
                } catch (error) {
                    console.error(`Monitoring update failed for ${machine.name}:`, error.message);
                }
            }, this.updateInterval);
        }
    }

    // Get real-time metrics from agent
    async getRealTimeMetrics(machine) {
        try {
            const metricsData = await this.executeSSHCommand(machine, 'tail -1 /tmp/magi_metrics.json');
            return JSON.parse(metricsData);
        } catch (error) {
            console.error(`Failed to get real-time metrics from ${machine.name}:`, error.message);
            return null;
        }
    }

    // Parser functions for different tool outputs
    parseCPUZOutput(data) {
        const lines = data.split('\n');
        const cpu = {};
        
        lines.forEach(line => {
            if (line.includes('Processor')) cpu.name = line.split(':')[1]?.trim();
            if (line.includes('Cores')) cpu.cores = line.split(':')[1]?.trim();
            if (line.includes('Base Clock')) cpu.baseClock = line.split(':')[1]?.trim();
            if (line.includes('Boost')) cpu.boostClock = line.split(':')[1]?.trim();
        });
        
        return cpu;
    }

    parseNvidiaSmiOutput(data) {
        const lines = data.split('\n').filter(line => line.trim());
        const gpus = [];
        
        lines.forEach(line => {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 6) {
                gpus.push({
                    name: parts[0],
                    temperature: parseInt(parts[1]),
                    utilization: parseInt(parts[2]),
                    memoryUsed: parseInt(parts[3]),
                    memoryTotal: parseInt(parts[4]),
                    powerDraw: parseFloat(parts[5])
                });
            }
        });
        
        return gpus;
    }

    parseAIDA64Output(xmlData) {
        // Parse XML data from AIDA64 - simplified version
        const system = {};
        
        if (xmlData.includes('<motherboard>')) {
            system.motherboard = xmlData.match(/<motherboard>(.*?)<\/motherboard>/s)?.[1]?.trim();
        }
        if (xmlData.includes('<memory>')) {
            system.memory = xmlData.match(/<memory>(.*?)<\/memory>/s)?.[1]?.trim();
        }
        
        return system;
    }

    parseTopOutput(data) {
        const match = data.match(/(\d+\.\d+)%?\s*us/);
        return match ? parseFloat(match[1]) : 0;
    }

    parseMeminfoOutput(data) {
        const lines = data.split('\n');
        const memory = {};
        
        lines.forEach(line => {
            if (line.includes('MemTotal:')) {
                memory.total = parseInt(line.split(':')[1].trim().split(' ')[0]);
            }
            if (line.includes('MemAvailable:')) {
                memory.available = parseInt(line.split(':')[1].trim().split(' ')[0]);
            }
        });
        
        return memory;
    }

    parseVmstatOutput(data) {
        const parts = data.trim().split(/\s+/);
        return {
            cpu_user: parseInt(parts[12]),
            cpu_system: parseInt(parts[13]),
            cpu_idle: parseInt(parts[14]),
            cpu_wait: parseInt(parts[15])
        };
    }

    parseUptimeOutput(data) {
        const match = data.match(/up\s+(.+?),/);
        return match ? match[1].trim() : 'unknown';
    }

    // Event emitter for UI updates
    emitMetricsUpdate(machineName, metrics) {
        // This would integrate with your Electron IPC system
        if (typeof window !== 'undefined' && window.ipcRenderer) {
            window.ipcRenderer.send('metrics-update', { machine: machineName, data: metrics });
        }
    }

    // Get all current monitoring data
    getAllMetrics() {
        const result = {};
        for (const [machine, data] of this.monitoringData.entries()) {
            result[machine] = data;
        }
        return result;
    }

    // Stop monitoring for a specific machine
    stopMonitoring(machineName) {
        const machine = Array.from(this.monitoringData.values())
            .find(data => data.machine.name === machineName)?.machine;
            
        if (machine) {
            this.executeSSHCommand(machine, 'pkill -f magi_agent.sh');
            this.monitoringData.delete(machineName);
        }
    }
}

module.exports = MAGIHardwareMonitor;