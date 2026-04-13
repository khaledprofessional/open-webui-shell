const { ipcMain } = require('electron');
const ConfigManager = require('./ConfigManager');

/**
 * Manages global hotkeys and ensures proper registration/deregistration of shortcuts.
 */
class ShortcutManager {
    constructor(configManager) {
        this.configManager = configManager;
    }

    registerAll() {
        const config = this.configManager.getConfig();
        // Register toggle shortcut (Alt+Space)
        globalShortcut.register(config.toggleShortcut, () => {
            if (WindowManager.mainWindow && WindowManager.mainWindow.isVisible() && WindowManager.mainWindow.isFocused()) {
                WindowManager.hideWindow();
            } else {
                WindowManager.showWindow();
            }
        });

        // Register devTools shortcut (Control+Alt+D)
        globalShortcut.register(config.devToolsShortcut, () => {
            if (WindowManager.mainWindow && WindowManager.mainWindow.webContents.isDevToolsOpened()) {
                WindowManager.mainWindow.webContents.closeDevTools();
            } else {
                WindowManager.mainWindow.webContents.openDevTools({ mode: 'detach' });
            }
        });
    }

    unregisterAll() {
        globalShortcut.unregisterAll();
    }
}

module.exports = ShortcutManager;