const fs = require('fs').promises;
const path = require('path');

// Path for persistent settings
const userDataPath = process.app ? process.app.getPath('userData') : './data'; // Use process.app if available, fallback otherwise
const configPath = path.join(userDataPath, 'config.json');

/**
 * Default configuration object structure.
 */
const DEFAULT_CONFIG = {
    url: 'http://localhost:8080',
    appName: 'Open WebUI Shell',
    darkColor: '#00000000', 
    symbolColor: '#FFFFFF', 
    headerPaddingTop: '8px',
    overlayHeight: 40,
    iconPath: path.join(__dirname, 'icon.png'),
    toggleShortcut: 'Alt+Space',
    devToolsShortcut: 'Control+Alt+D', 
    customCSS: \`
        #sidebar-container, .navbar { padding-top: 10px !important; }
        .user-menu-button { margin-right: 140px !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
    \`,
};

/**
 * Loads saved settings from disk or returns defaults if file not found/invalid.
 * @returns {Promise<Object>} The loaded configuration object.
 */
async function loadSavedSettings() {
    try {
        let stats = await fs.stat(configPath);
        if (!stats.isFile()) return DEFAULT_CONFIG; // Not a file, treat as missing

        const data = JSON.parse(await fs.readFile(configPath, 'utf8'));
        // Merge loaded data with default config to ensure all properties exist
        return { ...DEFAULT_CONFIG, ...data }; 
    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log("Config file not found. Using default settings.");
            return DEFAULT_CONFIG;
        } else {
            console.error("Error loading configuration:", e);
            return DEFAULT_CONFIG;
        }
    }
}

/**
 * Saves the provided URL to disk, updating the configuration state.
 * @param {string} newUrl - The URL to save.
 * @returns {Promise<void>}
 */
async function saveSettings(newUrl) {
    try {
        // Only persist the URL in this module's scope for simplicity
        const data = JSON.stringify({ url: newUrl }, null, 4); // Use indentation for readability
        await fs.writeFile(configPath, data);
        console.log("Successfully saved application settings.");
    } catch (e) {
        console.error("Failed to save settings:", e);
    }
}

module.exports = {
    loadSavedSettings,
    saveSettings,
    DEFAULT_CONFIG // Exporting defaults for consumers that might need them
};