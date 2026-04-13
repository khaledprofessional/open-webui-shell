const { BrowserWindow, shell } = require('electron');
const ConfigManager = require('./ConfigManager');
const sanitizeCSS = require('../utils/sanitizeCSS'); // Assuming sanitization helper will live here or be imported

/**
 * Manages the main application window lifecycle and content injection.
 */
class WindowManager {
    static mainWindow = null;
    static configManager = null;

    /**
     * Creates and displays the primary application window.
     */
    createWindow() {
        if (WindowManager.mainWindow) return; // Already exists
        
        const config = ConfigManager.getConfig();
        const appIcon = nativeImage.createFromPath(config.iconPath);

        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 1000,
            minWidth: 800,   
            minHeight: 600,
            resizable: true, 
            title: config.appName,
            icon: appIcon,
            show: false,
            frame: false,
            titleBarStyle: 'hidden',
            thickFrame: true, 
            titleBarOverlay: {
                color: config.darkColor,
                symbolColor: config.symbolColor,
                height: config.overlayHeight 
            },
            backgroundMaterial: 'acrylic', 
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                spellcheck: true,
                backgroundThrottling: true 
            }
        });

        this.mainWindow.loadURL(config.url);

        this.setupListeners();
    }

    /**
     * Sets up event handlers for the window (Zoom, URL handler, CSS injection).
     */
    setupListeners() {
        // Zoom Level Handlers
        this.mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.control && input.key === '=') this.mainWindow.webContents.setZoomLevel(this.mainWindow.webContents.getZoomLevel() + 0.5);
            if (input.control && input.key === '-') this.mainWindow.webContents.setZoomLevel(this.mainWindow.webContents.getZoomLevel() - 0.5);
            if (input.control && input.key === '0') this.mainWindow.webContents.setZoomLevel(0);
        });

        // Window Open Handler
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            const config = ConfigManager.getConfig();
            if (!url.startsWith(config.url)) {
                shell.openExternal(url);
                return { action: 'deny' };
            }
            return { action: 'allow' };
        });

        // CSS Injection on load
        this.mainWindow.webContents.on('did-finish-load', () => {
            let css = `
            html, body { padding: 0 !important; margin: 0 !important; overflow: hidden; border-radius: 0 !important; }
            header, nav, [role="navigation"], .top-nav, [class*="nav"], .header-container {
                padding-right: 135px !important; 
                -webkit-app-region: drag !important;
                box-sizing: border-box !important;
            }
            button, a, input, textarea, [role="button"] { -webkit-app-region: no-drag !important; }
        `;
            if (config.customCSS) {
                // Use the sanitized CSS here
                css += `\n/* Custom User CSS */ ${sanitizeCSS(config.customCSS)}`; 
            }

            this.mainWindow.webContents.insertCSS(css);
        });
    }

    /**
     * Handles window visibility state changes.
     */
    showWindow() {
        if (this.mainWindow) {
            this.mainWindow.show();
            this.mainWindow.focus();
        }
    }

    hideWindow() {
        if (this.mainWindow) {
            this.mainWindow.hide();
        }
    }

    /**
     * Prompts the user for a new URL via a modal window.
     */
    static async promptForUrl(configManager) {
        const promptWin = new BrowserWindow({
            width: 420,
            height: 200,
            resizable: false,
            frame: false,
            alwaysOnTop: true,
            backgroundColor: '#111111',
            webPreferences: {
                nodeIntegration: true, // Necessary for the embedded script
                contextIsolation: false  // Security trade-off needed for embedded HTML/IPC communication
            }
        });

        const promptHtml = `... (HTML content remains the same) ...`; // Placeholder - assume full logic is copied

        promptWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(promptHtml)}`);

        // This requires setting up IPC listener on the main process side
        ipcMain.on('update-url', async (event, newUrl) => {
            await configManager.saveSettings(newUrl); 
            if (WindowManager.mainWindow) WindowManager.mainWindow.loadURL(configManager.getCurrentConfig().url);
        });
    }

    /**
     * Loads the initial state and displays the main window after application is ready.
     */
    static async initializeWindow(app, configManager) {
        await configManager.loadSettings(); // Load before creating window
        this.createWindow();
        console.log("WindowManager initialized successfully.");
    }
}

module.exports = WindowManager;