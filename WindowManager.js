const { BrowserWindow, shell } = require('electron');
const path = require('path');
const { DEFAULT_CONFIG } = require('./ConfigManager');

/**
 * Manages the creation and lifecycle of the main application window.
 */
class WindowManager {
    constructor(config) {
        this.config = config;
        this.mainWindow = null;
        this.isReadyToShow = false; // Flag to handle initial show state
    }

    /**
     * Creates and initializes the main browser window instance.
     */
    createWindow() {
        const appIcon = require('electron').nativeImage.createFromPath(this.config.iconPath);

        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 1000,
            minWidth: 800,   
            minHeight: 600,
            resizable: true, 
            title: this.config.appName,
            icon: appIcon,
            show: false,
            frame: false,
            titleBarStyle: 'hidden',
            thickFrame: true, 
            titleBarOverlay: {
                color: this.config.darkColor,
                symbolColor: this.config.symbolColor,
                height: this.config.overlayHeight 
            },
            backgroundMaterial: 'acrylic', 
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                spellcheck: true,
                backgroundThrottling: true 
            }
        });

        // Setup initial handlers
        this.setupInitialHandlers();
    }

    /**
     * Sets up event listeners for the window (closing, zoom, content loading).
     */
    setupInitialHandlers() {
        const win = this.mainWindow;
        if (!win) return;

        // Handle Zoom Levels
        win.webContents.on('before-input-event', (event, input) => {
            if (input.control && input.key === '=') win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5);
            if (input.control && input.key === '-') win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5);
            if (input.control && input.key === '0') win.webContents.setZoomLevel(0);
        });

        // Handle URL loading and security check
        win.webContents.setWindowOpenHandler(({ url }) => {
            try {
                const targetOrigin = new URL(url).origin;
                const appOrigin = new URL(this.config.url).origin;
                if (targetOrigin !== appOrigin) {
                    shell.openExternal(url); // Open external link if origin mismatch
                    return { action: 'deny' };
                }
            } catch (e) {
                shell.openExternal(url);
                return { action: 'deny' };
            }
            return { action: 'allow' };
        });

        // Handle Window Closing
        win.on('closed', () => {
            this.mainWindow = null;
            console.log('Main window closed.');
        });

        // Handle Content Loaded (CSS injection)
        win.webContents.on('did-finish-load', () => {
            // Core CSS injections
            win.webContents.insertCSS(`
                html, body { padding: 0 !important; margin: 0 !important; overflow: hidden; border-radius: 0 !important; }
                header, nav, [role="navigation"], .top-nav, [class*="nav"], .header-container {
                    padding-right: 135px !important; 
                    -webkit-app-region: drag !important;
                    box-sizing: border-box !important;
                }
                button, a, input, textarea, [role="button"] { -webkit-app-region: no-drag !important; }
            `);

            // Custom/Modular CSS injection
            if (this.config.customCSS) {
                 win.webContents.insertCSS(sanitizeCSS(this.config.customCSS));
            }

            console.log("Window content loaded and styling applied.");
        });
    }

    /**
     * Loads the initial URL into the window. This should be called after creation.
     * @param {string} url - The URL to load.
     */
    loadURL(url) {
        if (this.mainWindow && !this.isReadyToShow) {
            console.log(`Loading initial URL: ${url}`);
            this.mainWindow.loadURL(url);
        } else if (!this.mainWindow) {
             // If window doesn't exist yet, we can't load it, but we should still track the config change
             this.config.url = url; 
        }
    }

    /**
     * Makes the window visible and focuses on it.
     */
    showWindow() {
        if (this.mainWindow && !this.isReadyToShow) {
            this.mainWindow.show();
            this.mainWindow.focus();
            this.isReadyToShow = true; // Mark as shown after successful call
        } else if (this.mainWindow) {
             this.mainWindow.show();
             this.mainWindow.focus();
        }
    }

    /**
     * Handles the initial window setup logic, including load URL and setting up readiness flag.
     */
    async initialize(configUrl) {
        // 1. Create the window structure first
        this.createWindow();
        
        // 2. Set up specific window handlers (like zoom on input events)
        const win = this.mainWindow;
        win.webContents.on('before-input-event', (event, input) => {
            if (input.control && input.key === '=') win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5);
            if (input.control && input.key === '-') win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5);
            if (input.control && input.key === '0') win.webContents.setZoomLevel(0);
        });

        // Load the URL after window is ready to show, but only if not already done by loadURL call
        this.loadURL(configUrl); 
    }
}

/** Simple utility to clean up CSS strings (basic example) */
function sanitizeCSS(css) {
    return css.replace(/[\r\n]/g, ' ').trim();
}


module.exports = WindowManager;