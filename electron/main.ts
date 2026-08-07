import { app, BrowserWindow, ipcMain, dialog, shell, screen, protocol, net } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'
import http from 'node:http'
import https from 'node:https'
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { WebSocketServer } = require('ws');
import os from 'node:os';
import dns from 'node:dns';

// Fix pour les échecs de fetch sur Windows vers 127.0.0.1
if (os.platform() === 'win32') {
    dns.setDefaultResultOrder('ipv4first');
}
import type { WebSocket } from 'ws';
import log from 'electron-log';

// Set app name explicitly to gm-os-v5 to lock the storage path before any getPath calls
app.name = 'gm-os-v5';

// Configure electron-log
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.initialize();
console.log('[Main] Logger initialized at:', log.transports.file.getFile().path);

interface ExtendedWebSocket extends WebSocket {
    isAlive?: boolean;
}

interface AIProxyResponse {
    ok: boolean;
    status?: number;
    statusText?: string;
    data: unknown;
}

import { registerRagHandlers } from './RAGEngine'
import { registerMcpHandlers } from './mcp_bridge'
import { registerObsidianHandlers } from './obsidian_bridge'
import { registerNexusHandlers } from './nexus_bridge'
import { registerSecurityHandlers } from './SecurityManager'
import { sessionManager } from './SessionManager'
import { OllamaService } from './OllamaService'
import { SyncServer } from './SyncServer'
import { mediaAccess } from './MediaAccess'
import { registerPairingHandlers } from './PairingManager'
import { shouldRejectUnauthorized } from './netTrust'
import { installWindowRelay, relayToOthers, RELAY_PUBLISH_CHANNEL, type RelayTarget } from './WindowRelay'
import { type RelayRole } from './relayPolicy'
import { auditDenied } from './auditLog'
import { TokenLockRegistry, buildUnlockMessage } from './TokenLockRegistry'
// import { GitBackupService } from './GitBackupService'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.join(__dirname, '..')
process.env.APP_ROOT = APP_ROOT

// Global Error Logger for Main Process
const crashLogPath = path.join(APP_ROOT, 'crash.log');
const logError = (error: unknown, type: string) => {
    const timestamp = new Date().toISOString();
    const stack = error instanceof Error ? error.stack : JSON.stringify(error, null, 2);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logEntry = `[${timestamp}] [${type}] ${errorMessage}\nStack: ${stack}\n${'='.repeat(50)}\n`;
    try {
        fs.appendFileSync(crashLogPath, logEntry);
        console.error(`[Main] ${type} logged to crash.log`);
    } catch (e) {
        console.error('[Main] Failed to write to crash.log:', e);
    }
};

process.on('uncaughtException', (err) => logError(err, 'Uncaught Exception'));
process.on('unhandledRejection', (reason) => logError(reason, 'Unhandled Rejection'));

// Register heavy AI/RAG engine
registerRagHandlers();
// Register MCP Bridge for AI Oracle
registerMcpHandlers();
// Register Obsidian Bridge
registerObsidianHandlers();
// Register Nexus-OS Bridge (Campaign Portability)
registerNexusHandlers();
// Register native Keychain Security
registerSecurityHandlers();
// Register Ollama Local AI Service
OllamaService.registerHandlers();
// Register pairing secret handlers (QR d'appairage des rôles privilégiés)
registerPairingHandlers();

// Register gmos protocol as privileged
protocol.registerSchemesAsPrivileged([
    { scheme: 'gmos', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, stream: true } }
]);

// NOTE: `ignore-certificate-errors` a été retiré ici. Il avait été posé pour le pont
// Philips Hue, mais Hue ne passe jamais par la pile réseau de Chromium dans l'app :
// HueEngine privilégie l'IPC `light:request`, qui fait un https.request côté Node.
// Le switch désactivait donc TLS pour tout le rendu sans servir son objectif.
// La tolérance aux certificats auto-signés est désormais accordée hôte par hôte,
// aux seules adresses privées — voir netTrust.ts.

// const gitBackupService = new GitBackupService(process.env.APP_ROOT);

// 🚧 Use ['ENV_NAME'] avoid vite:define dev replacement
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = __dirname
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let syncServer: SyncServer | null = null;
const REMOTE_PORT = 3001;
const TEMP_MEDIA_DIR = path.join(app.getPath('userData'), 'temp-media');

// Marque le contenu courant de temp-media. Le dossier étant vidé au démarrage,
// une nouvelle valeur signale au renderer que ce qu'il croyait déposé n'existe
// plus. Voir remote:get-connection-info.
const MEDIA_EPOCH = `${Date.now()}`;

// Périmètre des fichiers que le SyncServer accepte d'exposer sur le réseau local.
mediaAccess.init(APP_ROOT, TEMP_MEDIA_DIR);

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#000000',
        icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            sandbox: false,
            // SECURITY NOTE: webSecurity is currently false to allow legacy file:// access.
            // Switch to TRUE once you've verified that all media loads via gmos:// protocol.
            webSecurity: true, 
        },
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    // Open DevTools automatically to help debugging (at User's request)
    win.webContents.openDevTools({ mode: 'detach' })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    }

    // Initialize Nexus Sync Engine
    syncServer = new SyncServer(win, REMOTE_PORT, TEMP_MEDIA_DIR);
    syncServer.start();
}

// --- Session Management Handlers ---
const SESSIONS_DIR = path.join(process.env.APP_ROOT || '', 'sessions');

ipcMain.handle('save-session', async (_event, data) => {
    await fs.ensureDir(SESSIONS_DIR);
    const { filePath } = await dialog.showSaveDialog({
        title: 'Sauvegarder la Session GM-OS',
        defaultPath: path.join(SESSIONS_DIR, 'gmos-session.json'),
        filters: [{ name: 'GM-OS Session', extensions: ['json'] }]
    });
 
    if (filePath) {
        await fs.writeJson(filePath, data, { spaces: 2 });
        return true;
    }
    return false;
});
 
ipcMain.handle('load-session', async () => {
    await fs.ensureDir(SESSIONS_DIR);
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Charger une Session GM-OS',
        defaultPath: SESSIONS_DIR,
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
    // Le MJ a choisi ces fichiers : leur dossier devient servable aux tablettes.
    mediaAccess.allowFiles(filePaths);
    return filePaths;
});

ipcMain.handle('tactical:list-sounds', async () => {
    try {
        const tacticalPath = path.join(process.env.VITE_PUBLIC || '', 'assets/sounds/tactical');
        if (await fs.pathExists(tacticalPath)) {
            const files = await fs.readdir(tacticalPath);
            return files.filter(f => f.match(/\.(mp3|wav|ogg|m4a)$/i));
        }
    } catch (error) {
        console.error('[Main] Error listing tactical sounds:', error);
    }
    return [];
});

// --- Logging Handlers ---
ipcMain.on('log:message', (_event, level: string, message: string, ...args: unknown[]) => {
    switch (level) {
        case 'info': log.info('[Renderer]', message, ...args); break;
        case 'warn': log.warn('[Renderer]', message, ...args); break;
        case 'error': log.error('[Renderer]', message, ...args); break;
        case 'debug': log.debug('[Renderer]', message, ...args); break;
        default: log.info('[Renderer]', message, ...args);
    }
});

// --- Light OS Handlers ---
ipcMain.handle('light:request', async (_event, url: string, method: string, body?: unknown) => {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(url);
            const lib = parsedUrl.protocol === 'https:' ? https : http;

            const options: https.RequestOptions = {
                method,
                // Le pont Hue s'annonce avec un certificat auto-signé, mais ce
                // handler accepte n'importe quelle URL venant du rendu : la
                // tolérance ne vaut que pour le réseau local.
                rejectUnauthorized: shouldRejectUnauthorized(parsedUrl),
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
const currentDisplayPaths = new Map<string, string[]>();
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

    // NEW: Broadcast to WebSockets for Tablet/Remote devices (via SyncServer)
    if (win && !win.isDestroyed()) {
        const action = { 
            type: 'hub-projection', 
            payload: { type, data: imagePath } 
        };
        ipcMain.emit('remote:broadcast-ui-action', null, action);
    }
});

ipcMain.on('remote:broadcast-sync', (_event, data) => {
    if (hubWindow && !hubWindow.isDestroyed()) {
        hubWindow.webContents.send('remote:broadcast-sync', data);
    }
    for (const [, projWin] of projectorWindows) {
        if (!projWin.isDestroyed()) {
            projWin.webContents.send('remote:broadcast-sync', data);
        }
    }
});

ipcMain.on('session:launch-hub-window', (_event, mode = 'hub') => {
    console.log(`[Main] session:launch-hub-window received (mode: ${mode})`);
    if (hubWindow && !hubWindow.isDestroyed()) {
        console.log('[Main] Hub window already exists, restoring and focusing...');
        if (hubWindow.isMinimized()) hubWindow.restore();
        hubWindow.show();
        hubWindow.focus();
        return;
    }

    console.log(`[Main] Creating new ${mode} window...`);
    const displays = screen.getAllDisplays();
    // Default to a secondary display if available, else primary
    const targetDisplay = displays.length > 1 ? displays[1] : displays[0];

    hubWindow = new BrowserWindow({
        x: targetDisplay.bounds.x + 50,
        y: targetDisplay.bounds.y + 50,
        width: mode === 'tablet' ? 1024 : 1280,
        height: mode === 'tablet' ? 768 : 720,
        frame: true, // Allow GM to move it around or fullscreen it manually
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            sandbox: false,
            webSecurity: true,
        },
        backgroundColor: '#000000',
    });

    if (VITE_DEV_SERVER_URL) {
        hubWindow.loadURL(`${VITE_DEV_SERVER_URL}?window=${mode}`);
    } else {
        hubWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), { query: { window: mode } });
    }

    hubWindow.on('closed', () => {
        console.log(`[Main] ${mode} window closed`);
        hubWindow = null;
    });
});

ipcMain.on('image:launch-display', (_event, paths: string[], target: string) => {
    console.log(`[Image OS] Launch Display -> Target: ${target}, Paths:`, paths);
    currentDisplayPaths.set(target, paths);

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
                webSecurity: true,
            },
            backgroundColor: '#000000',
        });

        projectorWindows.set(target, projWin);

        projWin.on('closed', () => {
            projectorWindows.delete(target);
        });

        // Load the projector route
        if (VITE_DEV_SERVER_URL) {
            projWin.loadURL(`${VITE_DEV_SERVER_URL}?window=projector&displayId=${target}`);
        } else {
            projWin.loadFile(path.join(RENDERER_DIST, 'index.html'), { query: { window: 'projector', displayId: target } });
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

ipcMain.on('image:request-current-display', (event, target: string) => {
    const paths = currentDisplayPaths.get(target);
    if (paths && paths.length > 0) {
        event.sender.send('image:update-display', paths);
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

// --- Local IP Helper ---
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const networkInterface = interfaces[name];
        if (!networkInterface) continue;
        
        for (const iface of networkInterface) {
            // family can be 'IPv4' or 4 depending on node version
            if ((iface.family === 'IPv4' || (iface.family as unknown as number) === 4) && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

ipcMain.handle('remote:get-connection-info', () => {
    // En développement, on retourne le port de Vite (5173) pour avoir le Hot-Reloading
    // En production, on retourne le port du SyncServer (3001) qui sert le dossier dist/
    const devPort = VITE_DEV_SERVER_URL ? new URL(VITE_DEV_SERVER_URL).port : null;
    return {
        ip: getLocalIP(),
        // Port pour charger l'application sur la tablette.
        port: devPort ? parseInt(devPort, 10) : REMOTE_PORT,
        // Port du proxy média : toujours celui du SyncServer, jamais celui de
        // Vite, qui ne sert ni /media/ ni /temp/ et répond son index.html à leur
        // place — une image qui arrive en text/html ne s'affiche pas.
        mediaPort: REMOTE_PORT,
        // Identifie le contenu courant de temp-media, vidé à chaque démarrage.
        // Le renderer mémorise les médias qu'il y a déposés ; si cette valeur
        // change, sa mémoire ne vaut plus rien et il doit redéposer, sans quoi
        // il publie des références vers des fichiers effacés.
        mediaEpoch: MEDIA_EPOCH
    };
});

ipcMain.on('remote:request-client-sync', (event) => {
    event.reply('remote:sync-clients', sessionManager.getAllClients());
});

ipcMain.on('remote:clear-disconnected', (event) => {
    console.log('[Remote] MJ requested clearing of non-active clients');
    sessionManager.clearDisconnected();
    event.reply('remote:sync-clients', sessionManager.getAllClients());
});

// --- AI RAG Handlers ---
// AI handlers are now managed in RAGEngine.ts

ipcMain.handle('ai:proxy-request', async (_event, url: string, method: string, headers: Record<string, string>, body: unknown): Promise<AIProxyResponse> => {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(url);
            const lib = parsedUrl.protocol === 'https:' ? https : http;

            const options: https.RequestOptions = {
                method,
                headers,
                // Ces en-têtes portent les clés d'API : un hôte public doit
                // présenter un certificat valide, sans exception. Seul un
                // endpoint d'inférence du réseau local peut être auto-signé.
                rejectUnauthorized: shouldRejectUnauthorized(parsedUrl),
                timeout: 300000 // 300 seconds (5 minutes) for heavy AI analysis (PDFs, etc.)
            };

            const req = lib.request(parsedUrl, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = data ? JSON.parse(data) : null;
                        resolve({
                            ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            data: parsed
                        });
                    } catch {
                        resolve({
                            ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            data: data
                        });
                    }
                });
            });

            req.on('error', (err) => {
                console.error(`[AI Main] Proxy request failed for ${url}:`, err.message);
                reject(err);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('AI Request timed out'));
            });

            if (body) {
                req.write(typeof body === 'string' ? body : JSON.stringify(body));
            }
            req.end();

        } catch (error: unknown) {
            console.error(`[AI Main] Proxy setup failed for ${url}:`, error);
            reject(error);
        }
    });
});

// --- Git Backup Handlers (REMOVED) ---
/*
ipcMain.handle('git:status', async () => {
    return await gitBackupService.checkStatus();
});

ipcMain.handle('git:setup-branch', async (_event, branchName: string) => {
    return await gitBackupService.setupBackupBranch(branchName);
});

ipcMain.handle('git:sync', async (_event, targetDir: string, branchName: string, message: string) => {
    return await gitBackupService.syncData(targetDir, branchName, message);
});
*/

// --- Backup Save Handler (REMOVED) ---
/*
ipcMain.handle('backup:save-data', async (_event, data: unknown) => {
...
});
*/

ipcMain.handle('npc:select-avatar', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Sélectionner un Avatar',
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'jpeg'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0 && typeof filePaths[0] === 'string') {
        const rawPath = filePaths[0];
        // Le MJ a choisi ce fichier : son dossier devient servable aux tablettes.
        mediaAccess.allowFile(rawPath);
        const normalized = rawPath.replace(/\\/g, '/');
        // If it's in public/assets/avatars/npc, use gmos path, else return raw for save-avatar to handle
        return normalized;
    }
    return null;
});

ipcMain.handle('npc:save-avatar', async (_event, buffer: Buffer, fileName: string) => {
    try {
        const avatarsDir = path.join(process.env.APP_ROOT || '', 'public', 'assets', 'avatars', 'npc');
        await fs.ensureDir(avatarsDir);
        
        const filePath = path.join(avatarsDir, fileName);
        if (!filePath || typeof filePath !== 'string') throw new Error('Chemin d\'avatar invalide.');

        await fs.writeFile(filePath, buffer);
        
        const normalized = filePath.replace(/\\/g, '/');
        return `gmos://media/${normalized}`;
    } catch (error) {
        console.error('[Main] Error saving avatar:', error);
        return null;
    }
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

app.whenReady().then(async () => {
    // Clean temp media on startup
    try {
        if (await fs.pathExists(TEMP_MEDIA_DIR)) {
            await fs.emptyDir(TEMP_MEDIA_DIR);
            console.log('[Main] Temp media directory cleared');
        }
    } catch (e) {
        console.warn('[Main] Could not clear temp media directory:', e);
    }

    // Register custom protocol handler for local media
    protocol.handle('gmos', (request) => {
        console.log(`[Protocol:GMOS] Request received: ${request.url}`);
        if (!request || !request.url) {
            console.error('[Protocol:GMOS] Missing request URL');
            return new Response('URL manquante', { status: 400 });
        }
        
        try {
            const rawUrl = String(request.url);
            console.log(`[Protocol:GMOS] Raw URL string: "${rawUrl}"`);
            const url = rawUrl.replace(/^gmos:\/\/media\//, '');
            console.log(`[Protocol:GMOS] Decoded path part: "${url}"`);
            const decodedPath = decodeURIComponent(url);
            // On Windows, the path might start with C:/, net.fetch handles it well if it's a file:// URL or absolute path
            const appRoot = process.env.APP_ROOT || '';
            const absolutePath = path.isAbsolute(decodedPath) ? decodedPath : path.join(appRoot, decodedPath);
            console.log(`[Protocol:GMOS] Final absolute path: "${absolutePath}"`);
            return net.fetch(`file:///${absolutePath}`);
        } catch (error) {
            console.error('[Main] protocol:gmos error:', error);
            const errMsg = error instanceof Error ? error.message : String(error);
            return new Response(`Erreur interne du protocole gmos: ${errMsg}`, { status: 500 });
        }
    });

    // Relais entre fenêtres locales, hébergé par le process principal.
    // La liste des fenêtres est relue à chaque message : le Player Hub et le
    // projecteur vont et viennent.
    const listRelayTargets = (): RelayTarget[] =>
        BrowserWindow.getAllWindows().map(w => ({
            id: w.webContents.id,
            isDestroyed: () => w.isDestroyed() || w.webContents.isDestroyed(),
            send: (channel: string, message: string, senderRole: RelayRole) =>
                w.webContents.send(channel, message, senderRole),
        }));

    /**
     * Rôle d'une fenêtre, déduit de son `webContents.id`.
     *
     * Le process principal est le seul point qui tienne les trois références —
     * `win`, `hubWindow`, `projectorWindows` —, donc le seul à pouvoir établir
     * un rôle que l'émetteur ne choisit pas lui-même.
     *
     * Le Player Hub et la tablette partagent `hubWindow` : ils obéissent aux
     * mêmes règles, celles d'une fenêtre secondaire.
     */
    const resolveRelayRole = (senderId: number): RelayRole => {
        if (win && !win.isDestroyed() && win.webContents.id === senderId) return 'gm';
        if (hubWindow && !hubWindow.isDestroyed() && hubWindow.webContents.id === senderId) return 'hub';

        for (const [, projWin] of projectorWindows) {
            if (!projWin.isDestroyed() && projWin.webContents.id === senderId) return 'projector';
        }

        return 'unknown';
    };

    installWindowRelay(ipcMain, listRelayTargets, {
        resolveRole: resolveRelayRole,
        onDenied: (role, type, detail) =>
            auditDenied(`Message '${type}' refusé au relais — fenêtre '${role}' : ${detail}`),
    });

    // Le registre observe le flux relayé pour savoir quelle fenêtre détient quel
    // jeton. Il n'arbitre pas l'octroi — voir electron/TokenLockRegistry.ts.
    const tokenLocks = new TokenLockRegistry();
    ipcMain.on(RELAY_PUBLISH_CHANNEL, (event, _type, message) => {
        tokenLocks.observe(event.sender.id, message);
    });

    // Une fenêtre fermée en plein glisser-déposer immobilisait le jeton jusqu'à
    // l'expiration de cinq secondes. Le process principal est le seul point qui
    // voit la fenêtre disparaître : il libère à sa place.
    app.on('browser-window-created', (_event, window) => {
        const windowId = window.webContents.id;

        window.once('closed', () => {
            for (const lock of tokenLocks.releaseForWindow(windowId)) {
                // -1 ne correspond à aucune fenêtre : le message part donc à
                // toutes, y compris à celles qui auraient survécu à l'émetteur.
                relayToOthers(listRelayTargets(), -1, buildUnlockMessage(lock));
            }
        });
    });

    // createWindow() démarre déjà le SyncServer (voir syncServer.start()).
    createWindow();

    // --- Display Management ---
    screen.on('display-added', () => {
        console.log('[Main] Display added');
        win?.webContents.send('app:display-changed', screen.getAllDisplays().length);
    });

    screen.on('display-removed', () => {
        console.log('[Main] Display removed');
        win?.webContents.send('app:display-changed', screen.getAllDisplays().length);
    });

    screen.on('display-metrics-changed', () => {
        console.log('[Main] Display metrics changed');
        win?.webContents.send('app:display-changed', screen.getAllDisplays().length);
    });
})
