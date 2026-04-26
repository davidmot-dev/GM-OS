import { ipcMain, BrowserWindow } from 'electron';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'node:path';
import fs from 'fs-extra';
import { sessionManager } from './SessionManager';

interface ExtendedWebSocket extends WebSocket {
    isAlive?: boolean;
    deviceId?: string;
    role?: 'gm' | 'player' | 'remote' | 'hub';
}

export class SyncServer {
    private wss: WebSocketServer | null = null;
    private server: http.Server | null = null;
    private port: number;
    private mainWindow: BrowserWindow;
    private tempMediaDir: string;

    constructor(mainWindow: BrowserWindow, port: number, tempMediaDir: string) {
        this.mainWindow = mainWindow;
        this.port = port;
        this.tempMediaDir = tempMediaDir;
    }

    public start() {
        try {
            this.server = http.createServer((req, res) => this.handleHttpRequest(req, res));
            this.wss = new WebSocketServer({ server: this.server });

            this.wss.on('connection', (ws: ExtendedWebSocket) => {
                this.handleConnection(ws);
            });

            this.server.listen(this.port, '0.0.0.0', () => {
                console.log(`[Nexus Sync] Server + Media proxy listening on 0.0.0.0:${this.port}`);
            });

            this.registerIpcHandlers();
        } catch (err) {
            console.error('[Nexus Sync] Failed to start server:', err);
        }
    }

    private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        if (!req.url) return;

        // Support serving local files via /media/path-to-file
        if (req.url.startsWith('/media/')) {
            const encodedPath = req.url.substring(7);
            const filePath = decodeURIComponent(encodedPath);
            console.log(`[SyncServer] Requesting media: ${filePath}`);
            
            if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                console.log(`[SyncServer] Serving media file: ${filePath}`);
                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes: Record<string, string> = {
                    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
                    '.mp3': 'audio/mpeg', '.wav': 'audio/wav'
                };
                res.writeHead(200, { 
                    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                    'Access-Control-Allow-Origin': '*' 
                });
                fs.createReadStream(filePath).pipe(res);
            } else {
                console.warn(`[SyncServer] Media file not found: ${filePath}`);
                res.writeHead(404);
                res.end('Media not found');
            }
            return;
        }

        // Support serving temp media files
        if (req.url.startsWith('/temp/')) {
            const fileName = req.url.substring(6);
            const filePath = path.join(this.tempMediaDir, fileName);
            console.log(`[SyncServer] Requesting temp asset: ${fileName} -> ${filePath}`);
            
            if (fs.existsSync(filePath)) {
                console.log(`[SyncServer] Serving temp asset: ${fileName}`);
                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes: Record<string, string> = {
                    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
                    '.mp3': 'audio/mpeg', '.wav': 'audio/wav'
                };
                
                res.writeHead(200, { 
                    'Content-Type': mimeTypes[ext] || 'image/webp', // Default to webp if no ext (historical)
                    'Access-Control-Allow-Origin': '*' 
                });
                fs.createReadStream(filePath).pipe(res);
            } else {
                console.warn(`[SyncServer] Temp asset not found: ${fileName}`);
                res.writeHead(404);
                res.end('Temp Media not found');
            }
            return;
        }

        res.writeHead(404);
        res.end();
    }

    private handleConnection(ws: ExtendedWebSocket) {
        console.log('[Nexus Sync] New device connected');
        
        // Request initial full sync from GM
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('remote:request-sync');
        }

        ws.on('message', (message: string) => {
            try {
                const data = JSON.parse(message);
                
                if (data.type === 'remote:register') {
                    this.handleRegister(ws, data.payload);
                } else if (data.type === 'remote:hello') {
                    console.log('[Nexus Sync] Handshake received');
                } else {
                    this.forwardToGM(ws, data);
                }
            } catch (err) {
                console.error('[Nexus Sync] Failed to parse message:', err);
            }
        });

        ws.on('close', () => {
            if (ws.deviceId) {
                console.log(`[Nexus Sync] Client disconnected: ${ws.deviceId}`);
                sessionManager.ghostClient(ws.deviceId);
                this.updateGMClients();
            }
        });
    }

    private handleRegister(ws: ExtendedWebSocket, payload: any) {
        const { deviceId, pseudo, role, playerName, characterId } = payload || {};
        const actualDeviceId = deviceId || `remote-${Math.random().toString(36).substring(2, 9)}`;
        ws.deviceId = actualDeviceId;
        ws.role = role || 'player';

        try {
            sessionManager.registerClient(actualDeviceId, pseudo || 'Unknown', role || 'remote', playerName, characterId);
            this.updateGMClients();
            
            // Confirm registration and send role back
            ws.send(JSON.stringify({ type: 'remote:registered', payload: { deviceId: actualDeviceId, role: ws.role } }));
        } catch (err: any) {
            if (err.message === 'character_taken') {
                ws.send(JSON.stringify({ 
                    type: 'remote:error', 
                    payload: { 
                        code: 'character_taken', 
                        message: 'Signature biométrique déjà active sur un autre terminal.' 
                    } 
                }));
            }
        }
    }

    private forwardToGM(ws: ExtendedWebSocket, data: any) {
        // P2P Logic: If it's a message for others, broadcast it directly
        if (data.type === 'session:send-message' && data.payload?.toId !== 'GM') {
            this.broadcastAction({ ...data, type: 'session:receive-message' }, ws);
        }

        // Forward to Renderer (GM) unless it's pure P2P (character to character)
        const isStrictP2P = data.type === 'session:send-message' && data.payload?.toId !== 'GM' && data.payload?.toId !== 'all';
        
        if (this.mainWindow && !this.mainWindow.isDestroyed() && !isStrictP2P) {
            this.mainWindow.webContents.send('remote:action', data);
        }
    }

    private broadcastAction(action: any, sender?: WebSocket, targetRole?: string) {
        if (!this.wss) return;
        const message = JSON.stringify(action);
        this.wss.clients.forEach((client: ExtendedWebSocket) => {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                if (!targetRole || client.role === targetRole) {
                    client.send(message);
                }
            }
        });
    }

    private updateGMClients() {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('remote:sync-clients', sessionManager.getAllClients());
        }
    }

    private registerIpcHandlers() {
        ipcMain.on('remote:broadcast-sync', (_event, data, role?: string) => {
            this.broadcastAction({ type: 'sync', payload: data }, undefined, role);
        });

        ipcMain.on('remote:broadcast-ui-action', (_event, action, role?: string) => {
            this.broadcastAction(action, undefined, role);
        });

        ipcMain.on('remote:request-client-sync', () => {
            this.updateGMClients();
        });

        ipcMain.on('remote:clear-disconnected', () => {
            sessionManager.clearDisconnected();
            this.updateGMClients();
        });

        ipcMain.handle('remote:cache-media', async (_event, buffer: ArrayBuffer, id: string) => {
            try {
                if (!this.tempMediaDir) return false;
                await fs.ensureDir(this.tempMediaDir);
                // We keep the ID as the filename (e.g. m-123)
                const filePath = path.join(this.tempMediaDir, id);
                await fs.writeFile(filePath, Buffer.from(buffer));
                console.log(`[Nexus Sync] Media cached: ${id} at ${filePath}`);
                return true;
            } catch (err) {
                console.error(`[Nexus Sync] Failed to cache media ${id}:`, err);
                return false;
            }
        });
    }

    public stop() {
        this.wss?.close();
        this.server?.close();
    }
}
