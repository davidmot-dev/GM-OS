import { app, BrowserWindow, ipcMain, dialog, shell, screen, protocol, net } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'
import http from 'node:http'
import https from 'node:https'
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const { WebSocketServer } = require('ws');
import os from 'node:os';
import type { WebSocket } from 'ws';
import log from 'electron-log';

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
import { sessionManager } from './SessionManager'
import { OllamaService } from './OllamaService'

const ollamaService = new OllamaService();

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Register heavy AI/RAG engine
registerRagHandlers();
// Register MCP Bridge for AI Oracle
registerMcpHandlers();
// Register Obsidian Bridge
registerObsidianHandlers();

// Register gmos protocol as privileged
protocol.registerSchemesAsPrivileged([
    { scheme: 'gmos', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, stream: true } }
]);

// Ignore certificate errors for local HTTPS requests (like Philips Hue Bridge)
app.commandLine.appendSwitch('ignore-certificate-errors')

process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define dev replacement
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let wss: import('ws').WebSocketServer | null = null;
const REMOTE_PORT = 3001;
const TEMP_MEDIA_DIR = path.join(app.getPath('userData'), 'temp-media');

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

    // NEW: Broadcast to WebSockets for Tablet/Remote devices
    if (wss) {
        const message = JSON.stringify({ 
            type: 'hub-projection', 
            payload: { type, data: imagePath } 
        });
        wss.clients.forEach((client: ExtendedWebSocket) => {
            if (client.readyState === 1) { // 1 = OPEN
                client.send(message);
            }
        });
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

// --- Remote Control Server ---
function startRemoteServer() {
    try {
        // Create an HTTP server to serve media files and handle the websocket
        const server = http.createServer((req, res) => {
            console.log(`[Remote Proxy] Request: ${req.url}`);
            
            // Support serving local files via /media/path-to-file
            if (req.url && req.url.startsWith('/media/')) {
                const encodedPath = req.url.substring(7); // Remove /media/
                const filePath = decodeURIComponent(encodedPath);
                console.log(`[Remote Proxy] Attempting to serve: ${filePath}`);
                
                // Security check or simple existence check
                if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                    const ext = path.extname(filePath).toLowerCase();
                    const mimeTypes: Record<string, string> = {
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.gif': 'image/gif',
                        '.webp': 'image/webp',
                        '.svg': 'image/svg+xml',
                        '.mp3': 'audio/mpeg',
                        '.wav': 'audio/wav'
                    };
                    res.writeHead(200, { 
                        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                        'Access-Control-Allow-Origin': '*' 
                    });
                    fs.createReadStream(filePath).pipe(res);
                } else {
                    console.warn(`[Remote Proxy] File NOT FOUND: ${filePath}`);
                    res.writeHead(404);
                    res.end('Media not found');
                }
                return;
            }

            // NEW: Support serving temp media files from IndexedDB cache
            if (req.url && req.url.startsWith('/temp/')) {
                const fileName = req.url.substring(6); // Remove /temp/
                const filePath = path.join(TEMP_MEDIA_DIR, fileName);
                
                if (fs.existsSync(filePath)) {
                    res.writeHead(200, { 
                        'Content-Type': 'image/webp', // Default to webp or guess by extension if needed
                        'Access-Control-Allow-Origin': '*' 
                    });
                    fs.createReadStream(filePath).pipe(res);
                } else {
                    res.writeHead(404);
                    res.end('Temp Media not found');
                }
                return;
            }
            res.writeHead(404);
            res.end();
        });

        wss = new WebSocketServer({ server });
        console.log(`[Remote] Server + Media started on port ${REMOTE_PORT}`);

        if (wss) {
            wss.on('connection', (ws: import('ws').WebSocket) => {
                let currentDeviceId: string | null = null;
                console.log('[Remote] New device connected');
                
                // Send initial sync data
                if (win && !win.isDestroyed()) {
                    win.webContents.send('remote:request-sync');
                }
                
                ws.on('message', (message: string) => {
                    try {
                        const data = JSON.parse(message);
                        // console.log('[Remote] message received:', data);
                        
                        if (data.type === 'remote:register') {
                            const { deviceId, pseudo, role } = data.payload;
                            currentDeviceId = deviceId;
                            console.log(`[Remote] Registering client: ${pseudo} (${role})`);
                            sessionManager.registerClient(deviceId, pseudo, role);
                            
                            // Immediately broadcast updated client list to MJ
                            if (win && !win.isDestroyed()) {
                                win.webContents.send('remote:sync-clients', sessionManager.getAllClients());
                            }
                        } else if (data.type === 'remote:hello') {
                            console.log('[Remote] Handshake received');
                        } else {
                            // Forward action to renderer process
                            if (win && !win.isDestroyed()) {
                                win.webContents.send('remote:action', data);
                            }
                        }
                    } catch (err) {
                        console.error('[Remote] Failed to parse message:', err);
                    }
                });

                ws.on('close', () => {
                    if (currentDeviceId) {
                        console.log(`[Remote] Client went ghost: ${currentDeviceId}`);
                        sessionManager.ghostClient(currentDeviceId);
                        // Broadcast ghost status to MJ
                        if (win && !win.isDestroyed()) {
                            win.webContents.send('remote:sync-clients', sessionManager.getAllClients());
                        }
                    } else {
                        console.log('[Remote] Anonymous device disconnected');
                    }
                });
            });
        }

        // Use 0.0.0.0 to ensure it's accessible from other devices on the LAN
        server.listen(REMOTE_PORT, '0.0.0.0', () => {
            console.log(`[Remote] Server + Media proxy listening on 0.0.0.0:${REMOTE_PORT}`);
        });

    } catch (err) {
        console.error('[Remote] Failed to start server:', err);
    }
}

ipcMain.handle('remote:cache-media', async (_event, buffer: Buffer, id: string) => {
    try {
        await fs.ensureDir(TEMP_MEDIA_DIR);
        const filePath = path.join(TEMP_MEDIA_DIR, id);
        await fs.writeFile(filePath, buffer);
        return true;
    } catch (error) {
        console.error('[Main] Error caching media:', error);
        return false;
    }
});

// Broadcast data to all connected remote devices
ipcMain.on('remote:broadcast-sync', (_event, data) => {
    if (wss) {
        const message = JSON.stringify({ type: 'sync', payload: data });
        wss.clients.forEach((client: ExtendedWebSocket) => {
            if (client.readyState === 1) { // 1 = OPEN
                client.send(message);
            }
        });
    }
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
    return {
        ip: getLocalIP(),
        port: REMOTE_PORT
    };
});

ipcMain.on('remote:request-client-sync', (event) => {
    event.reply('remote:sync-clients', sessionManager.getAllClients());
});

const APP_ROOT = process.env.APP_ROOT || '';

// --- AI RAG Handlers ---
ipcMain.handle('ai:list-docs', async () => {
    const docsPath = path.join(APP_ROOT, 'docs');
    if (!fs.existsSync(docsPath)) return [];
    
    async function getFiles(dir: string): Promise<unknown[]> {
      const items = await fs.readdir(dir, { withFileTypes: true });
      const result = await Promise.all(items.map(async item => {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(docsPath, fullPath);
        
        if (item.isDirectory()) {
          return {
            name: item.name,
            path: relativePath,
            type: 'directory',
            children: await getFiles(fullPath)
          };
        }
        
        return {
          name: item.name,
          path: relativePath,
          type: 'file',
          extension: path.extname(item.name).toLowerCase()
        };
      }));
      return result;
    }

    return getFiles(docsPath);
  });

ipcMain.handle('ai:read-doc', async (_event, relativePath: string) => {
    const fullPath = path.join(APP_ROOT, 'docs', relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf-8');
  });

// --- Ollama Local AI Handlers ---
ipcMain.handle('ai:ollama-status', async () => {
    return await ollamaService.checkStatus();
});

ipcMain.handle('ai:ollama-chat', async (_event, model: string, messages: { role: string; content: string }[]) => {
    return await ollamaService.chat(model, messages);
});

ipcMain.handle('ai:ollama-generate-image', async (_event, model: string, prompt: string) => {
    return await ollamaService.generateImage(model, prompt);
});

ipcMain.handle('ai:ollama-list-models', async () => {
    return await ollamaService.listModels();
});

ipcMain.handle('ai:ollama-pull', async (_event, model: string) => {
    return await ollamaService.pullModel(model);
});

ipcMain.handle('ai:extract-pdf', async (_event, relativePath: string) => {
    const fullPath = path.join(APP_ROOT, 'docs', relativePath);
    console.log(`[AI Main] Extracting PDF: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`[AI Main] PDF file not found: ${fullPath}`);
      return "Fichier introuvable.";
    }
    
    try {
      const dataBuffer = fs.readFileSync(fullPath);
      console.log(`[AI Main] Buffer read, size: ${dataBuffer.length} bytes. Parsing...`);
      
      const data = await pdf(dataBuffer);
      console.log(`[AI Main] PDF parsed successfully. Text length: ${data.text?.length || 0}`);
      return data.text || "PDF vide ou illisible.";
    } catch (error) {
      console.error("[AI Main] PDF Extraction Error:", error);
      return `Erreur lors de l'extraction du PDF : ${error instanceof Error ? error.message : String(error)}`;
    }
  });

ipcMain.handle('ai:proxy-request', async (_event, url: string, method: string, headers: Record<string, string>, body: unknown): Promise<AIProxyResponse> => {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(url);
            const lib = parsedUrl.protocol === 'https:' ? https : http;

            const options: https.RequestOptions = {
                method,
                headers,
                rejectUnauthorized: false,
                timeout: 120000 // 120 seconds (2 minutes) for heavy AI analysis (PDFs, etc.)
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

ipcMain.handle('npc:select-avatar', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Sélectionner un Avatar',
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'jpeg'] }],
        properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
        const rawPath = filePaths[0];
        const normalized = rawPath.replace(/\\/g, '/');
        return `gmos://media/${normalized}`;
    }
    return null;
});

ipcMain.handle('npc:save-avatar', async (_event, buffer: Buffer, fileName: string) => {
    try {
        const avatarsDir = path.join(process.env.APP_ROOT || '', 'public', 'assets', 'avatars', 'npc');
        await fs.ensureDir(avatarsDir);
        
        const filePath = path.join(avatarsDir, fileName);
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
        const url = request.url.replace(/^gmos:\/\/media\//, '');
        const decodedPath = decodeURIComponent(url);
        // On Windows, the path might start with C:/, net.fetch handles it well if it's a file:// URL or absolute path
        const absolutePath = path.isAbsolute(decodedPath) ? decodedPath : path.join(process.env.APP_ROOT || '', decodedPath);
        return net.fetch(`file:///${absolutePath}`);
    });

    createWindow();
    startRemoteServer();

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
