import { app, BrowserWindow, ipcMain, dialog, shell, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'
import http from 'node:http'
import https from 'node:https'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ignore certificate errors for local HTTPS requests (like Philips Hue Bridge)
app.commandLine.appendSwitch('ignore-certificate-errors')

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define dev replacement
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            sandbox: false,
            webSecurity: false, // Nécessaire pour charger les fichiers audio locaux via fetch/file://
        },
        width: 1200,
        height: 800,
        backgroundColor: '#000000',
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    // Open DevTools automatically to help debugging the black screen
    win.webContents.openDevTools()

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    }
}

// --- Session Management Handlers ---
ipcMain.handle('save-session', async (_event, data) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Sauvegarder la Session GM-OS',
        defaultPath: path.join(app.getPath('documents') || '', 'gmos-session.json'),
        filters: [{ name: 'GM-OS Session', extensions: ['json'] }]
    });

    if (filePath) {
        await fs.writeJson(filePath, data, { spaces: 2 });
        return true;
    }
    return false;
});

ipcMain.handle('load-session', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Charger une Session GM-OS',
        filters: [{ name: 'GM-OS Session', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        return await fs.readJson(filePaths[0]);
    }
    return null;
});

// --- NPC OS Handlers ---
ipcMain.handle('npc:list-databases', async (_event, category: string) => {
    const appRoot = process.env.APP_ROOT || '';
    const dbPath = path.join(appRoot, 'databases', category);
    if (await fs.pathExists(dbPath)) {
        const files = await fs.readdir(dbPath);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    }
    return [];
});

ipcMain.handle('npc:load-database', async (_event, category: string, name: string) => {
    const appRoot = process.env.APP_ROOT || '';
    const filePath = path.join(appRoot, 'databases', category, `${name}.json`);
    if (await fs.pathExists(filePath)) {
        return await fs.readJson(filePath);
    }
    return null;
});

// --- Table OS Handlers ---
ipcMain.handle('tables:list-universes', async () => {
    const appRoot = process.env.APP_ROOT || '';
    const tablesPath = path.join(appRoot, 'databases', 'tables');
    if (await fs.pathExists(tablesPath)) {
        const dirs = await fs.readdir(tablesPath, { withFileTypes: true });
        return dirs.filter(d => d.isDirectory()).map(d => d.name);
    }
    return [];
});

ipcMain.handle('tables:list-tables', async (_event, universe: string) => {
    const appRoot = process.env.APP_ROOT || '';
    const dbPath = path.join(appRoot, 'databases', 'tables', universe);
    if (await fs.pathExists(dbPath)) {
        const files = await fs.readdir(dbPath);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    }
    return [];
});

ipcMain.handle('tables:load-table', async (_event, universe: string, tableName: string) => {
    const appRoot = process.env.APP_ROOT || '';
    const filePath = path.join(appRoot, 'databases', 'tables', universe, `${tableName}.json`);
    if (await fs.pathExists(filePath)) {
        return await fs.readJson(filePath);
    }
    return null;
});

// --- Clock OS Handlers ---
ipcMain.handle('clock:list-calendars', async () => {
    const appRoot = process.env.APP_ROOT || '';
    const calendarPath = path.join(appRoot, 'databases', 'calendars');
    if (await fs.pathExists(calendarPath)) {
        const files = await fs.readdir(calendarPath);
        return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    }
    return [];
});

ipcMain.handle('clock:load-calendar', async (_event, id: string) => {
    const appRoot = process.env.APP_ROOT || '';
    const filePath = path.join(appRoot, 'databases', 'calendars', `${id}.json`);
    if (await fs.pathExists(filePath)) {
        return await fs.readJson(filePath);
    }
    return null;
});

// --- Web OS Handlers ---
ipcMain.on('web:open-external', (_event, url: string) => {
    shell.openExternal(url);
});

ipcMain.handle('web:save-list', async (_event, data: unknown) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Exporter les marque-pages',
        defaultPath: path.join(app.getPath('documents') || '', 'web-os-bookmarks.json'),
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (filePath) {
        await fs.writeJson(filePath, data, { spaces: 2 });
        return true;
    }
    return false;
});

ipcMain.handle('web:load-list', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Importer des marque-pages',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        return await fs.readJson(filePaths[0]);
    }
    return null;
});

// --- Sound OS Handlers ---
ipcMain.handle('sound:load-audios', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Sélectionner des effets sonores',
        filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg'] }],
        properties: ['openFile', 'multiSelections']
    });
    return filePaths;
});

// --- Light OS Handlers ---
ipcMain.handle('light:request', async (_event, url: string, method: string, body?: unknown) => {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(url);
            const lib = parsedUrl.protocol === 'https:' ? https : http;

            const options: https.RequestOptions = {
                method,
                rejectUnauthorized: false,
                timeout: 5000 // 5 seconds timeout
            };

            const req = lib.request(parsedUrl, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = data ? JSON.parse(data) : null;
                        resolve(parsed);
                    } catch {
                        // Some endpoints might return empty string
                        resolve(data);
                    }
                });
            });

            req.on('error', (err) => {
                console.error(`[Light OS] Node request error for ${url}:`, err.message);
                reject(err);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out'));
            });

            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();

        } catch (error: unknown) {
            console.error(`[Light OS] Request setup failed for ${url}:`, error);
            reject(error);
        }
    });
});

// --- Image OS Handlers ---
const projectorWindows = new Map<string, BrowserWindow>();
let hubWindow: BrowserWindow | null = null;

ipcMain.handle('image:get-displays', () => {
    const displays = screen.getAllDisplays();
    return displays.map((d, index) => ({
        id: d.id.toString(),
        bounds: d.bounds,
        label: `Moniteur ${index + 1}`
    }));
});

ipcMain.on('image:sync-hub-data', (_event, type: string, imagePath: string) => {
    // Broadcast to Hub and all projectors
    if (hubWindow && !hubWindow.isDestroyed()) {
        hubWindow.webContents.send('image:sync-hub-data', type, imagePath);
    }
    for (const [, projWin] of projectorWindows) {
        if (!projWin.isDestroyed()) {
            projWin.webContents.send('image:sync-hub-data', type, imagePath);
        }
    }
});

ipcMain.on('session:launch-hub-window', () => {
    if (hubWindow && !hubWindow.isDestroyed()) {
        hubWindow.focus();
        return;
    }

    const displays = screen.getAllDisplays();
    // Default to a secondary display if available, else primary
    const targetDisplay = displays.length > 1 ? displays[1] : displays[0];

    hubWindow = new BrowserWindow({
        x: targetDisplay.bounds.x + 50,
        y: targetDisplay.bounds.y + 50,
        width: 1280,
        height: 720,
        frame: true, // Allow GM to move it around or fullscreen it manually
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            sandbox: false,
            webSecurity: false,
        },
        backgroundColor: '#000000',
    });

    if (VITE_DEV_SERVER_URL) {
        hubWindow.loadURL(`${VITE_DEV_SERVER_URL}?window=hub`);
    } else {
        hubWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), { query: { window: 'hub' } });
    }

    hubWindow.on('closed', () => {
        hubWindow = null;
    });
});

ipcMain.on('image:launch-display', (_event, paths: string[], target: string) => {
    console.log(`[Image OS] Launch Display -> Target: ${target}, Paths:`, paths);

    if (target === 'hub') {
        // Just trigger the sync logic for local hub window if any
        if (hubWindow && !hubWindow.isDestroyed()) {
            hubWindow.webContents.send('image:update-display', paths);
        }
        return;
    }

    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(d => d.id.toString() === target);

    if (!targetDisplay) {
        console.error(`[Image OS] Target display ${target} not found.`);
        return;
    }

    if (paths && paths.length === 0) {
        // Blackout case: closing the projector window
        const projWin = projectorWindows.get(target);
        if (projWin && !projWin.isDestroyed()) {
            projWin.close();
        }
        projectorWindows.delete(target);
        return;
    }

    let projWin = projectorWindows.get(target);

    if (!projWin || projWin.isDestroyed()) {
        // Create new window on target display
        projWin = new BrowserWindow({
            x: targetDisplay.bounds.x,
            y: targetDisplay.bounds.y,
            fullscreen: true, // We want the projector to be fullscreen on that display
            frame: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.mjs'),
                sandbox: false,
                webSecurity: false,
            },
            backgroundColor: '#000000',
        });

        projectorWindows.set(target, projWin);

        projWin.on('closed', () => {
            projectorWindows.delete(target);
        });

        // Load the projector route
        if (VITE_DEV_SERVER_URL) {
            projWin.loadURL(`${VITE_DEV_SERVER_URL}?window=projector`);
        } else {
            projWin.loadFile(path.join(RENDERER_DIST, 'index.html'), { query: { window: 'projector' } });
        }

        // Wait for finish load before sending image
        projWin.webContents.on('did-finish-load', () => {
            projWin?.webContents.send('image:update-display', paths);
        });
    } else {
        // Window already exists, just update image
        projWin.webContents.send('image:update-display', paths);
    }
});


ipcMain.on('image:close-all-displays', () => {
    console.log('[Image OS] Close All Displays');
    for (const [, projWin] of projectorWindows) {
        if (!projWin.isDestroyed()) {
            projWin.close();
        }
    }
    projectorWindows.clear();
});


ipcMain.handle('npc:select-avatar', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Sélectionner un Avatar',
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'jpeg'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        const rawPath = filePaths[0];
        const normalized = rawPath.replace(/\\/g, '/');
        return `file:///${encodeURI(normalized).replace(/#/g, '%23').replace(/\?/g, '%3F')}`;
    }
    return null;
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(createWindow)
