const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { ipcMain } = require('electron');

class MAGISkinEngine {
    constructor() {
        this.currentSkin = null;
        this.availableSkins = new Map();
        this.skinCache = new Map();
        this.setupIPC();
        this.loadDefaultSkins();
    }

    setupIPC() {
        // Handle skin loading requests
        ipcMain.handle('skin-load', async (event, skinPath) => {
            return await this.loadSkin(skinPath);
        });

        ipcMain.handle('skin-apply', async (event, skinData) => {
            return await this.applySkin(skinData);
        });

        ipcMain.handle('skin-list', () => {
            return Array.from(this.availableSkins.values());
        });

        ipcMain.handle('skin-download', async (event, skinUrl) => {
            return await this.downloadSkin(skinUrl);
        });
    }

    async loadSkin(skinPath) {
        try {
            // Check cache first
            if (this.skinCache.has(skinPath)) {
                return this.skinCache.get(skinPath);
            }

            // Load .wsz file (it's a ZIP archive)
            const skinBuffer = fs.readFileSync(skinPath);
            const zip = await JSZip.loadAsync(skinBuffer);
            
            const skinData = {
                name: path.basename(skinPath, '.wsz'),
                path: skinPath,
                colors: {},
                images: {},
                config: {},
                css: {}
            };

            // Parse main.bmp for color extraction
            const mainBmp = await zip.file('main.bmp')?.async('uint8array');
            if (mainBmp) {
                skinData.colors = this.extractColorsFromBitmap(mainBmp);
                skinData.images.main = this.bitmapToDataUrl(mainBmp);
            }

            // Parse pledit.txt for configuration
            const configText = await zip.file('pledit.txt')?.async('string');
            if (configText) {
                skinData.config = this.parseWinampConfig(configText);
            }

            // Extract additional graphics
            const graphicFiles = ['titlebar.bmp', 'window.bmp', 'button.bmp', 'cbuttons.bmp'];
            for (const filename of graphicFiles) {
                const file = await zip.file(filename)?.async('uint8array');
                if (file) {
                    skinData.images[filename.replace('.bmp', '')] = this.bitmapToDataUrl(file);
                }
            }

            // Generate CSS variables
            skinData.css = this.generateCSSFromSkin(skinData);

            // Cache the processed skin
            this.skinCache.set(skinPath, skinData);
            
            return skinData;

        } catch (error) {
            console.error('Skin loading error:', error);
            throw new Error(`Failed to load skin: ${error.message}`);
        }
    }

    extractColorsFromBitmap(bitmapData) {
        // Simple color extraction from bitmap
        // In a real implementation, you'd parse the BMP header and pixel data
        const colors = {
            primary: '#4CAF50',    // Default green
            secondary: '#2E7D32',  // Dark green
            accent: '#00BCD4',     // Cyan
            background: '#0c0c0c', // Dark background
            text: '#ffffff',       // White text
            warning: '#FF9800',    // Orange
            error: '#f44336'       // Red
        };

        // Analyze pixel data to extract dominant colors
        // This is a simplified version - real implementation would:
        // 1. Parse BMP header to get pixel format
        // 2. Extract RGB values from pixel data
        // 3. Use color clustering to find dominant colors
        // 4. Map colors to semantic meanings (primary, accent, etc.)

        return colors;
    }

    parseWinampConfig(configText) {
        const config = {};
        const lines = configText.split('\n');
        
        lines.forEach(line => {
            if (line.includes('=')) {
                const [key, value] = line.split('=', 2);
                config[key.trim()] = value.trim();
            }
        });

        return config;
    }

    generateCSSFromSkin(skinData) {
        const { colors, images, config } = skinData;
        
        return `
            :root {
                /* Color Scheme */
                --skin-primary: ${colors.primary};
                --skin-secondary: ${colors.secondary};
                --skin-accent: ${colors.accent};
                --skin-background: ${colors.background};
                --skin-text: ${colors.text};
                --skin-warning: ${colors.warning};
                --skin-error: ${colors.error};
                
                /* Gradients */
                --skin-gradient-primary: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
                --skin-gradient-background: linear-gradient(135deg, ${colors.background}, #1a1a2e);
                
                /* Images */
                --skin-titlebar-bg: url('${images.titlebar || ''}');
                --skin-window-bg: url('${images.window || ''}');
                --skin-button-bg: url('${images.button || ''}');
                
                /* Typography */
                --skin-font-family: ${config.font || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"};
                --skin-font-size: ${config.fontSize || '12px'};
                
                /* Effects */
                --skin-border-radius: ${config.borderRadius || '8px'};
                --skin-box-shadow: 0 4px 12px rgba(${this.hexToRgb(colors.primary)}, 0.3);
                --skin-glow-color: ${colors.accent};
            }
            
            /* Apply skin to main elements */
            body {
                background: var(--skin-gradient-background) !important;
                color: var(--skin-text) !important;
                font-family: var(--skin-font-family) !important;
            }
            
            .titlebar {
                background: var(--skin-gradient-primary) !important;
                background-image: var(--skin-titlebar-bg) !important;
            }
            
            .status-card, .control-panel, .sidebar-left, .sidebar-right, .center-panel {
                background: rgba(${this.hexToRgb(colors.background)}, 0.9) !important;
                border: 1px solid var(--skin-primary) !important;
                border-radius: var(--skin-border-radius) !important;
            }
            
            .metric-value.online, .status-value.online {
                background: var(--skin-primary) !important;
            }
            
            .control-btn, .quick-action, .mode-btn {
                background: var(--skin-gradient-primary) !important;
                box-shadow: var(--skin-box-shadow) !important;
            }
            
            .control-btn:hover, .quick-action:hover, .mode-btn:hover {
                box-shadow: 0 6px 20px rgba(${this.hexToRgb(colors.accent)}, 0.5) !important;
                filter: brightness(1.1);
            }
            
            /* Graph visualization colors */
            .graph-node {
                fill: var(--skin-primary) !important;
            }
            
            .graph-link {
                stroke: var(--skin-accent) !important;
            }
            
            /* Terminal styling */
            .terminal-window {
                background: rgba(${this.hexToRgb(colors.background)}, 0.95) !important;
                border: 1px solid var(--skin-primary) !important;
                color: var(--skin-text) !important;
            }
            
            .terminal-header {
                color: var(--skin-accent) !important;
                border-bottom: 1px solid var(--skin-primary) !important;
            }
            
            /* Module windows */
            .module-titlebar {
                background: var(--skin-gradient-primary) !important;
                background-image: var(--skin-titlebar-bg) !important;
            }
            
            .module-content {
                background: var(--skin-gradient-background) !important;
            }
        `;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `${r}, ${g}, ${b}`;
        }
        return '76, 175, 80'; // Default green RGB
    }

    bitmapToDataUrl(bitmapData) {
        // Convert bitmap data to data URL for CSS use
        // This is a simplified version - real implementation would:
        // 1. Parse BMP header properly
        // 2. Convert to PNG or other web-compatible format
        // 3. Return proper data URL
        
        const base64 = Buffer.from(bitmapData).toString('base64');
        return `data:image/bmp;base64,${base64}`;
    }

    async applySkin(skinData) {
        try {
            // Inject CSS into all windows
            const { BrowserWindow } = require('electron');
            const windows = BrowserWindow.getAllWindows();
            
            for (const window of windows) {
                await window.webContents.insertCSS(skinData.css);
            }
            
            this.currentSkin = skinData;
            return { success: true, message: `Applied skin: ${skinData.name}` };
            
        } catch (error) {
            console.error('Skin application error:', error);
            throw new Error(`Failed to apply skin: ${error.message}`);
        }
    }

    async downloadSkin(skinUrl) {
        try {
            // Download skin from URL (like skins.webamp.org)
            const response = await fetch(skinUrl);
            const buffer = await response.arrayBuffer();
            
            // Generate filename from URL
            const urlPath = new URL(skinUrl).pathname;
            const filename = path.basename(urlPath) || 'downloaded_skin.wsz';
            const skinPath = path.join(__dirname, '../skins', filename);
            
            // Ensure skins directory exists
            const skinsDir = path.dirname(skinPath);
            if (!fs.existsSync(skinsDir)) {
                fs.mkdirSync(skinsDir, { recursive: true });
            }
            
            // Save skin file
            fs.writeFileSync(skinPath, Buffer.from(buffer));
            
            // Load and return skin data
            return await this.loadSkin(skinPath);
            
        } catch (error) {
            console.error('Skin download error:', error);
            throw new Error(`Failed to download skin: ${error.message}`);
        }
    }

    loadDefaultSkins() {
        // Load built-in skin collection
        const defaultSkins = [
            {
                name: 'MAGI Matrix',
                colors: {
                    primary: '#00ff41',
                    secondary: '#008f11',
                    accent: '#00ff88',
                    background: '#000000',
                    text: '#00ff41',
                    warning: '#ffff00',
                    error: '#ff0000'
                }
            },
            {
                name: 'Cyberpunk Neon',
                colors: {
                    primary: '#ff0080',
                    secondary: '#8000ff',
                    accent: '#00ffff',
                    background: '#0a0a0a',
                    text: '#ffffff',
                    warning: '#ffff00',
                    error: '#ff4444'
                }
            },
            {
                name: 'MAGI Classic',
                colors: {
                    primary: '#4CAF50',
                    secondary: '#2E7D32',
                    accent: '#00BCD4',
                    background: '#0c0c0c',
                    text: '#ffffff',
                    warning: '#FF9800',
                    error: '#f44336'
                }
            }
        ];

        defaultSkins.forEach(skin => {
            skin.css = this.generateCSSFromSkin(skin);
            this.availableSkins.set(skin.name, skin);
        });
    }

    // Webamp.org integration methods
    async fetchWebampSkins(category = 'all', limit = 50) {
        try {
            // This would integrate with the Webamp skins API if available
            // For now, return mock data structure
            return [
                {
                    name: 'Matrix Digital Rain',
                    author: 'Neo',
                    downloadUrl: 'https://example.com/matrix.wsz',
                    previewUrl: 'https://example.com/matrix_preview.png',
                    category: 'cyberpunk'
                },
                {
                    name: 'Retro Terminal',
                    author: 'CodeMaster',
                    downloadUrl: 'https://example.com/retro.wsz',
                    previewUrl: 'https://example.com/retro_preview.png',
                    category: 'retro'
                }
            ];
        } catch (error) {
            console.error('Failed to fetch Webamp skins:', error);
            return [];
        }
    }
}

module.exports = MAGISkinEngine;