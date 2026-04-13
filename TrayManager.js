const { Menu, nativeImage } = require('electron');
const path = require('path');
const { DEFAULT_CONFIG } = require('./ConfigManager');

/**
 * Manages the system-level UI elements like the Tray Icon and Context Menu.
 */
class TrayManager {
    constructor(config) {
        this.iconPath = config.iconPath;
        this.tray = null;
    }

    /**
     * Creates and sets up the tray icon and its context menu.
     */
    setupTrayIcon() {
        const appIcon = nativeImage.createFromPath(this.iconPath).resize({ width: 16, height: 16 });
        this.tray = new Menu.Tray(appIcon);
        
        this.contextMenu = this.buildContextMenu();
        this.tray.setContextMenu(this.contextMenu);
        this.tray.setToolTip('Open WebUI Shell');

        // Disable default application menu to avoid conflicts
        Menu.setApplicationMenu(null); 
    }

    /**
     * Builds the context menu structure for the tray icon.
     * @returns {Electron.Menu} The built menu template.
     */
    buildContextMenu() {
        const menu = Menu.buildFromTemplate([
            { label: 'Open Shell', click: () => { /* This should trigger window show/open */ } }, // Actual opening logic handled by app init
            { type: 'separator' },
            { label: 'Connect to Instance...', click: async () => { 
                // Assuming the main module will pass a function for URL prompting here, 
                // but for now, we just log/call a placeholder.
                console.log("Prompting for new instance URL..."); 
            } },
            { 
                label: 'Always on Top', 
                type: 'checkbox', 
                checked: false,
                click: (item) => { /* Logic to set window alwaysOnTop */ }
            },
            { label: 'Reload', click: () => { /* Placeholder for reload logic */ } },
            { type: 'separator' },
            { label: 'Quit', click: async () => { 
                // Need access to global app quit or passing the quit function
            } }
        ]);

        return menu;
    }

    /**
     * Placeholder method for external actions (like opening/quitting).
     * In a real implementation, this class would need references to the main WindowManager and App object.
     */
    attachListeners(windowManager) {
         // Re-wiring click handlers to use actual dependencies:
        const menu = Menu.buildFromTemplate([
            { label: 'Open Shell', click: () => windowManager.showWindow() },
            { type: 'separator' },
            { label: 'Connect to Instance...', click: () => console.log('Needs URL Prompting Logic') }, // Needs ConfigManager access
            // ... other handlers need adjustment based on where they are called in the app
        ]);
        this.tray.setContextMenu(menu);
    }
}

module.exports = TrayManager;