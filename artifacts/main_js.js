const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { Client } = require('pg');
const { Connection } = require('ssh2');
const Store = require('electron-store');

// Initialize electron-store for persistent settings
const store = new Store();

class MAGICommandCenter {
  constructor() {
    this.mainWindow = null;
    this.modules = new Map();
    this.sshConnections = new Map();
    this.isDev = process.argv.includes('--dev');
    
    // MAGI machine configurations
    this.magiMachines = {
      melchior: { host: '192.168.50.30', user: 'jordan', name: 'Melchior (RTX A5000)' },
      balthazar: { host: '192.168.50.20', user: 'jordan', name: 'Balthazar (RTX A4000)' },
      caspar: { host: '192.168.50.21', user: 'jordan', name: 'Caspar (RTX 3090)' },
      adam: { host: '192.168.50.11', user: 'jordan', name: 'Adam (Business)' },
      lilith: { host: '192.168.50.10', user: 'jordan', name: 'Lilith (Primary AI/Dev)' }
    };
  }

  async init() {
    await app.whenReady();
    this.createMainWindow();
    this.setupMenu();
    this.setupIPC();
    
    if (this.isDev) {
      this.mainWindow.webContents.openDevTools();
    }
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      frame: false, // Frameless for custom Winamp-style chrome
      backgroundColor: '#0c0c0c',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      icon: path.join(__dirname, '../assets/icon.png')
    });

    this.mainWindow.loadFile('src/renderer/main.html');
    
    // Restore window position from store
    const bounds = store.get('windowBounds');
    if (bounds) {
      this.mainWindow.setBounds(bounds);
    }

    // Save window position on close
    this.mainWindow.on('close', () => {
      store.set('windowBounds', this.mainWindow.getBounds());
    });
  }

  createModuleWindow(moduleType, options = {}) {
    const defaultOptions = {
      width: 400,
      height: 300,
      frame: false,
      parent: this.mainWindow,
      modal: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    };

    const moduleWindow = new BrowserWindow({ ...defaultOptions, ...options });
    moduleWindow.loadFile(`src/renderer/modules/${moduleType}.html`);
    
    // Store reference
    this.modules.set(moduleType, moduleWindow);
    
    // Cleanup on close
    moduleWindow.on('closed', () => {
      this.modules.delete(moduleType);
    });

    return moduleWindow;
  }

  setupMenu() {
    const template = [
      {
        label: 'View',
        submenu: [
          {
            label: 'Performance Metrics',
            type: 'checkbox',
            checked: false,
            click: () => this.toggleModule('performance')
          },
          {
            label: 'System Status',
            type: 'checkbox', 
            checked: false,
            click: () => this.toggleModule('status')
          },
          {
            label: 'Live Logs',
            type: 'checkbox',
            checked: false,
            click: () => this.toggleModule('logs')
          },
          {
            label: 'Network Topology',
            type: 'checkbox',
            checked: false,
            click: () => this.toggleModule('network')
          },
          {
            label: 'Control Panel',
            type: 'checkbox',
            checked: false,
            click: () => this.toggleModule('controls')
          },
          { type: 'separator' },
          {
            label: 'Reset Layout',
            click: () => this.resetLayout()
          }
        ]
      },
      {
        label: 'SSH',
        submenu: Object.entries(this.magiMachines).map(([key, machine]) => ({
          label: machine.name,
          click: () => this.connectSSH(key)
        }))
      },
      {
        label: 'Database',
        submenu: [
          {
            label: 'Connect to AGE',
            click: () => this.connectDatabase()
          },
          {
            label: 'Refresh Graph',
            click: () => this.refreshGraph()
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIPC() {
    // Handle module window creation
    ipcMain.handle('create-module', (event, moduleType, options) => {
      return this.createModuleWindow(moduleType, options);
    });

    // Handle SSH connections
    ipcMain.handle('ssh-connect', (event, machineKey) => {
      return this.connectSSH(machineKey);
    });

    // Handle database queries
    ipcMain.handle('db-query', async (event, query) => {
      return this.executeQuery(query);
    });

    // Handle window controls
    ipcMain.handle('window-minimize', () => {
      this.mainWindow.minimize();
    });

    ipcMain.handle('window-maximize', () => {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    });

    ipcMain.handle('window-close', () => {
      this.mainWindow.close();
    });
  }

  toggleModule(moduleType) {
    if (this.modules.has(moduleType)) {
      this.modules.get(moduleType).close();
    } else {
      this.createModuleWindow(moduleType);
    }
  }

  async connectSSH(machineKey) {
    const machine = this.magiMachines[machineKey];
    if (!machine) return null;

    return new Promise((resolve, reject) => {
      const conn = new Connection();
      
      conn.on('ready', () => {
        console.log(`SSH connected to ${machine.name}`);
        this.sshConnections.set(machineKey, conn);
        resolve(conn);
      });

      conn.on('error', (err) => {
        console.error(`SSH error for ${machine.name}:`, err);
        reject(err);
      });

      // Connect with SSH key authentication
      conn.connect({
        host: machine.host,
        username: machine.user,
        privateKey: require('fs').readFileSync(path.join(require('os').homedir(), '.ssh/id_rsa'))
      });
    });
  }

  async connectDatabase() {
    try {
      const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'magi_memory',
        password: process.env.POSTGRES_PASSWORD || 'your_password',
        port: 5432,
      });

      await client.connect();
      this.dbClient = client;
      console.log('Connected to AGE database');
      return client;
    } catch (err) {
      console.error('Database connection error:', err);
      throw err;
    }
  }

  async executeQuery(query) {
    if (!this.dbClient) {
      await this.connectDatabase();
    }
    
    try {
      const result = await this.dbClient.query(query);
      return result.rows;
    } catch (err) {
      console.error('Query error:', err);
      throw err;
    }
  }

  resetLayout() {
    // Close all module windows
    this.modules.forEach(window => window.close());
    this.modules.clear();
    
    // Reset main window position
    this.mainWindow.setBounds({ x: 100, y: 100, width: 1400, height: 900 });
    store.delete('windowBounds');
  }
}

// App lifecycle
const magiApp = new MAGICommandCenter();

app.whenReady().then(() => {
  magiApp.init();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    magiApp.createMainWindow();
  }
});