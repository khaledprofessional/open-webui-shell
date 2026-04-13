const fs = require('fs').promises;
const path = require('path');

/**
 * Manages application configuration persistence (URL, theme settings).
 */
class ConfigManager {
    constructor() {
        this.userDataPath = null;
        this.configPath = null;
        this.currentConfig = {}; // Will hold the merged config state
        this.defaultConfig = {
            url: 'http://localhost:8080',
            appName: 'Open WebUI Shell',
            darkColor: '#00000000', 
            symbolColor: '#FFFFFF', 
            headerPaddingTop: '8px',
            overlayHeight: 40,
            iconPath: path.join(__dirname, 'icon.png'), // Needs to be adjusted relative to actual location
            toggleShortcut: 'Alt+Space',
            devToolsShortcut: 'Control+Alt+D', 
            customCSS: `
        #sidebar-container, .navbar { padding-top: 10px !important; }
        .user-menu-button { margin-right: 140px !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
            `
        };
    }

    /**
     * Initializes paths and loads settings for the application. Must be called first.
     * @param {ElectronApp} app The Electron application instance.
     */
    initialize(app) {
        this.userDataPath = app.getPath('userData');
        // Adjust path calculation to be relative to where this module is run from, or pass a base directory.
        this.configPath = path.join(this.userDataPath, 'config.json'); 
    }

    /**
     * Loads the saved URL and settings from disk asynchronously.
     */
    async loadSettings() {
        try {
            await fs.stat(this.configPath);
            const data = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
            // Merge loaded data over defaults
            Object.assign(this.currentConfig || {}, this.defaultConfig); 
            if (data.url) {
                this.currentConfig.url = data.url;
            }
        } catch (e) {
            if (e.code !== 'ENOENT') {
                console.error("Failed to load settings:", e);
            } else {
                // File not found, use defaults. This is expected on first run.
            }
        }
    }

    /**
     * Saves the current URL and state to disk asynchronously.
     * @param {string} newUrl The new URL to save.
     */
    async saveSettings(newUrl) {
        try {
            // Ensure we capture the minimal required data structure for saving
            const dataToSave = { url: newUrl }; 
            const dataString = JSON.stringify(dataToSave, null, 4);
            await fs.writeFile(this.configPath, dataString);
        } catch (e) {
            console.error("Failed to save settings:", e);
        }
    }

    /**
     * Returns the complete configuration object.
     */
    getConfig() {
        return this.currentConfig;
    }
}

module.exports = ConfigManager;