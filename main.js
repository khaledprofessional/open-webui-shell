const { app, BrowserWindow, Menu, Tray, nativeImage, shell, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let tray;

// Path for persistent settings
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

// Default Configuration
const CONFIG = {
    url: 'http://localhost:8080',
    appName: 'Open WebUI Shell',
    darkColor: '#00000000', 
    symbolColor: '#FFFFFF', 
    headerPaddingTop: '8px',
    overlayHeight: 40,
    iconPath: path.join(__dirname, 'icon.png'),
    toggleShortcut: 'Alt+Space',
    devToolsShortcut: 'Control+Alt+D', 
    customCSS: `
        #sidebar-container, .navbar { padding-top: 10px !important; }
        .user-menu-button { margin-right: 140px !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
    `
};

// Load saved URL on startup
async function loadSavedSettings() {
    try {
        let stats;
        await fs.stat(configPath);
        const data = JSON.parse(await fs.readFile(configPath, 'utf8'));
        if (data.url) CONFIG.url = data.url;
    } catch (e) {
        // Handle ENOENT error specifically for file not found if needed, 
        // but catching generic error is sufficient for now as per original logic.
        if (e.code !== 'ENOENT') {
            console.error("Failed to load settings", e);
        }
    }
}

// Save URL to disk
async function saveSettings(newUrl) {
    try {
        const data = JSON.stringify({ url: newUrl }, null, 4); // Use indentation for readability
        await fs.writeFile(configPath, data);
    } catch (e) {
        console.error("Failed to save settings", e);
    }
}

function createWindow() {
    const appIcon = nativeImage.createFromPath(CONFIG.iconPath);

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1000,
        minWidth: 800,   
        minHeight: 600,
        resizable: true, 
        title: CONFIG.appName,
        icon: appIcon,
        show: false,
        frame: false,
        titleBarStyle: 'hidden',
        thickFrame: true, 
        titleBarOverlay: {
            color: CONFIG.darkColor,
            symbolColor: CONFIG.symbolColor,
            height: CONFIG.overlayHeight 
        },
        backgroundMaterial: 'acrylic', 
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            spellcheck: true,
            backgroundThrottling: true 
        }
    });

    mainWindow.loadURL(CONFIG.url);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key === '=') mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5);
        if (input.control && input.key === '-') mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5);
        if (input.control && input.key === '0') mainWindow.webContents.setZoomLevel(0);
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!url.startsWith(CONFIG.url)) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.insertCSS(`
            html, body { padding: 0 !important; margin: 0 !important; overflow: hidden; border-radius: 0 !important; }
            header, nav, [role="navigation"], .top-nav, [class*="nav"], .header-container {
                padding-right: 135px !important; 
                -webkit-app-region: drag !important;
                box-sizing: border-box !important;
            }
            button, a, input, textarea, [role="button"] { -webkit-app-region: no-drag !important; }
        `);
        if (CONFIG.customCSS) mainWindow.webContents.insertCSS(sanitizeCSS(CONFIG.customCSS));
    });
}

function promptForUrl() {
    let promptWin = new BrowserWindow({
        width: 420,
        height: 200,
        resizable: false,
        frame: false,
        alwaysOnTop: true,
        backgroundColor: '#111111',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const promptHtml = `
    <body style="background: #111; color: #fff; font-family: sans-serif; padding: 25px; border: 1px solid #333; -webkit-app-region: drag;">
        <h3 style="margin: 0 0 10px 0; font-weight: 500;">Open WebUI Shell Connection</h3>
        <p style="font-size: 12px; color: #888; margin-bottom: 15px;">Enter the address of your instance:</p>
        <input id="urlInput" type="text" value="${CONFIG.url}" style="width: 100%; padding: 10px; background: #222; color: #fff; border: 1px solid #444; border-radius: 6px; outline: none; -webkit-app-region: no-drag;" autofocus />
        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px; -webkit-app-region: no-drag;">
            <button onclick="window.close()" style="background: transparent; color: #888; border: none; cursor: pointer;">Cancel</button>
            <button onclick="submit()" style="background: #3b82f6; color: white; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">Connect</button>
        </div>
        <script>
            const { ipcRenderer } = require('electron');
            function submit() {
                const val = document.getElementById('urlInput').value;
                if (val) {
                    ipcRenderer.send('update-url', val);
                    window.close();
                }
            }
            document.getElementById('urlInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submit();
            });
        </script>
    </body>`;

    promptWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(promptHtml)}`);
}

ipcMain.on('update-url', async (event, newUrl) => {
    let finalUrl = newUrl;
    if (!newUrl.startsWith('http')) finalUrl = 'http://' + newUrl;
    CONFIG.url = finalUrl;
    await saveSettings(finalUrl); // Await the asynchronous save operation
    if (mainWindow) mainWindow.loadURL(CONFIG.url);
});

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        loadSavedSettings(); // Load before creating window
        createWindow();
        
        globalShortcut.register(CONFIG.toggleShortcut, () => {
            if (mainWindow.isVisible() && mainWindow.isFocused()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        globalShortcut.register(CONFIG.devToolsShortcut, () => {
            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools({ mode: 'detach' });
            }
        });

        const trayIcon = nativeImage.createFromPath(CONFIG.iconPath).resize({ width: 16, height: 16 });
        tray = new Tray(trayIcon);
        
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Open Shell', click: () => { mainWindow.show(); mainWindow.focus(); } },
            { type: 'separator' },
            { label: 'Connect to Instance...', click: () => promptForUrl() },
            { 
                label: 'Always on Top', 
                type: 'checkbox', 
                checked: false,
                click: (item) => mainWindow.setAlwaysOnTop(item.checked)
            },
            { label: 'Reload', click: () => mainWindow.reload() },
            { type: 'separator' },
            { label: 'Quit', click: () => app.quit() }
        ]);

        tray.setContextMenu(contextMenu);
        tray.setToolTip('Open WebUI Shell');
        Menu.setApplicationMenu(null);
    });
}

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});