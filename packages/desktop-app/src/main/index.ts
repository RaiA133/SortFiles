import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { registerIPCHandlers } from './ipc';

/**
 * Main Electron Process
 */
class Application {
  private mainWindow: BrowserWindow | null = null;
  private isDev = process.env.NODE_ENV === 'development';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Handle creating/removing shortcuts on Windows when installing/uninstalling
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      if (require('electron-squirrel-startup')) {
        app.quit();
        return;
      }
    } catch {
      // electron-squirrel-startup may not be available
    }

    // App event listeners
    app.on('ready', this.onReady.bind(this));
    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', this.onBeforeQuit.bind(this));
  }

  private async onReady(): Promise<void> {
    // Register IPC handlers
    await registerIPCHandlers();

    // Create main window
    this.createMainWindow();

    // Open DevTools in development
    if (this.isDev) {
      this.mainWindow?.webContents.openDevTools();
    }
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      backgroundColor: '#ffffff',
      show: false,
      webPreferences: {
        preload: join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    // Load the app
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private onWindowAllClosed(): void {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate(): void {
    // On macOS, recreate window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }

  private onBeforeQuit(): void {
    // Cleanup before quit
    // Save state, close connections, etc.
  }
}

// Initialize the application
new Application();
