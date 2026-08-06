import { ipcMain, BrowserWindow } from 'electron';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'node:path';
import fs from 'fs-extra';
import { sessionManager } from './SessionManager';
import { mediaAccess } from './MediaAccess';
import { pairingManager } from './PairingManager';
import { evaluateAction } from './actionPolicy';

export type ClientRole = 'gm' | 'remote' | 'player' | 'hub';

/** Rôles acceptés sur le fil ; tout le reste retombe sur 'player'. */
const ALLOWED_ROLES: ClientRole[] = ['gm', 'remote', 'player', 'hub'];

/** Rôles qui reçoivent le flux non caviardé — voir useNexusSynchronizer. */
const PRIVILEGED_ROLES: ClientRole[] = ['gm', 'remote'];

/** Types de fichiers que le proxy média accepte de servir. */
const MEDIA_MIME_TYPES: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.avif': 'image/avif', '.bmp': 'image/bmp',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4', '.flac': 'audio/flac',
    '.mp4': 'video/mp4', '.webm': 'video/webm',
};

interface ExtendedWebSocket extends WebSocket {
    isAlive?: boolean;
    deviceId?: string;
    role?: ClientRole;
    remoteAddress?: string;
}

export class SyncServer {
    private wss: WebSocketServer | null = null;
    private server: http.Server | null = null;
    private port: number;
    private mainWindow: BrowserWindow;
    private tempMediaDir: string;
    private deviceSocketMap = new Map<string, Set<WebSocket>>();

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

    /**
     * Décode un segment d'URL en chemin. Retourne null si l'encodage est invalide
     * (`decodeURIComponent` lève sur un `%` isolé) — un client qui envoie ça ne
     * cherche pas un fichier.
     */
    private decodePath(raw: string): string | null {
        try {
            return decodeURIComponent(raw);
        } catch {
            return null;
        }
    }

    private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        if (!req.url) return;

        // Le serveur écoute sur 0.0.0.0 : tout chemin venant d'un client est hostile
        // par défaut. On coupe la query string avant décodage, sinon `?x=..` passe.
        const urlPath = req.url.split('?')[0];

        // Support serving local files via /media/path-to-file
        if (urlPath.startsWith('/media/')) {
            const requestedPath = this.decodePath(urlPath.substring(7));
            if (requestedPath === null) {
                res.writeHead(400);
                res.end('Bad request');
                return;
            }

            const appRoot = process.env.APP_ROOT || process.cwd();
            const filePath = mediaAccess.resolveAllowed(requestedPath, appRoot);

            if (!filePath) {
                // Un 404 plutôt qu'un 403 : inutile de confirmer au réseau
                // qu'un chemin existe mais est hors périmètre.
                console.warn(`[SyncServer] Media refusé ou introuvable: ${requestedPath}`);
                res.writeHead(404);
                res.end('Media not found');
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const mimeType = MEDIA_MIME_TYPES[ext];
            if (!mimeType || !fs.lstatSync(filePath).isFile()) {
                console.warn(`[SyncServer] Media refusé (type non servi): ${filePath}`);
                res.writeHead(404);
                res.end('Media not found');
                return;
            }

            console.log(`[SyncServer] Serving media file: ${filePath}`);
            res.writeHead(200, {
                'Content-Type': mimeType,
                'Access-Control-Allow-Origin': '*'
            });
            fs.createReadStream(filePath).pipe(res);
            return;
        }

        // Support serving temp media files (cache local, noms plats type "m-123")
        if (urlPath.startsWith('/temp/')) {
            const fileName = this.decodePath(urlPath.substring(6));
            if (fileName === null) {
                res.writeHead(400);
                res.end('Bad request');
                return;
            }

            // Confiné au dossier temp : pas de sous-dossier, pas de traversée.
            const filePath = path.resolve(this.tempMediaDir, fileName);
            const rel = path.relative(this.tempMediaDir, filePath);
            if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel) || rel.includes(path.sep)) {
                console.warn(`[SyncServer] Temp asset refusé (hors dossier temp): ${fileName}`);
                res.writeHead(404);
                res.end('Temp Media not found');
                return;
            }

            if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                console.log(`[SyncServer] Serving temp asset: ${fileName}`);
                const ext = path.extname(filePath).toLowerCase();
                res.writeHead(200, {
                    // Les assets mis en cache par remote:cache-media n'ont pas d'extension.
                    'Content-Type': MEDIA_MIME_TYPES[ext] || 'image/webp',
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
        // Serve static Web App (PWA) assets from dist folder
        const appRoot = process.env.APP_ROOT || process.cwd();
        const distPath = path.resolve(appRoot, 'dist');

        const decoded = this.decodePath(urlPath);
        if (decoded === null) {
            res.writeHead(400);
            res.end('Bad request');
            return;
        }
        const requestPath = decoded === '/' || decoded === '' ? '/index.html' : decoded;

        // `path.join` seul laisserait passer "/../electron/main.ts" : on vérifie
        // que le résultat reste bien sous dist/.
        const filePath = path.resolve(distPath, '.' + path.posix.normalize('/' + requestPath.replace(/\\/g, '/')));
        const relToDist = path.relative(distPath, filePath);
        if (relToDist.startsWith('..') || path.isAbsolute(relToDist)) {
            res.writeHead(404);
            res.end();
            return;
        }

        if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes: Record<string, string> = {
                '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
                '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
                '.json': 'application/json', '.ico': 'image/x-icon', '.mjs': 'text/javascript',
                '.webmanifest': 'application/manifest+json'
            };
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            fs.createReadStream(filePath).pipe(res);
            return;
        } else if (fs.existsSync(path.join(distPath, 'index.html'))) {
            // SPA Fallback (React Router)
            res.writeHead(200, { 'Content-Type': 'text/html' });
            fs.createReadStream(path.join(distPath, 'index.html')).pipe(res);
            return;
        }

        res.writeHead(404);
        res.end();
    }

    private handleConnection(ws: ExtendedWebSocket) {
        const remoteAddress = (ws as any)._socket?.remoteAddress;
        ws.remoteAddress = remoteAddress;
        console.log(`[Nexus Sync] New device connected from ${remoteAddress}`);
        
        // Request initial full sync from GM
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('remote:request-sync');
        }

        ws.on('message', (message: string) => {
            try {
                const data = JSON.parse(message);
                
                if (data.type === 'remote:register') {
                    this.handleRegister(ws, data.payload);
                } else if (data.type === 'remote:ping') {
                    ws.send(JSON.stringify({ type: 'remote:pong', payload: data.payload }));
                } else {
                    this.forwardToGM(ws, data);
                }
            } catch (err) {
                console.error('[Nexus Sync] Failed to parse message:', err);
            }
        });

        ws.on('close', () => {
            if (ws.deviceId) {
                console.log(`[Nexus Sync] Socket closed for device: ${ws.deviceId}`);
                const deviceSockets = this.deviceSocketMap.get(ws.deviceId);
                if (deviceSockets) {
                    deviceSockets.delete(ws);
                    if (deviceSockets.size === 0) {
                        console.log(`[Nexus Sync] Last socket closed for device ${ws.deviceId}, entering ghost mode`);
                        sessionManager.ghostClient(ws.deviceId);
                        this.deviceSocketMap.delete(ws.deviceId);
                    }
                }
                this.updateGMClients();
            }
        });
    }

    private handleRegister(ws: ExtendedWebSocket, payload: any) {
        const { deviceId, pseudo, role, playerName, characterId, token } = payload || {};
        const actualDeviceId = typeof deviceId === 'string' && deviceId
            ? deviceId
            : `remote-${Math.random().toString(36).substring(2, 9)}`;

        // Un rôle non reconnu ne doit pas se retrouver tel quel dans le routage des
        // broadcasts : on retombe sur le rôle le moins privilégié.
        let claimedRole: ClientRole = ALLOWED_ROLES.includes(role) ? role : 'player';

        // Les rôles privilégiés reçoivent le flux non caviardé (notes privées,
        // gmSecretInfo). Le rôle étant déclaré par le client, seul le secret
        // d'appairage permet de l'accorder.
        if (PRIVILEGED_ROLES.includes(claimedRole) && !pairingManager.verify(token)) {
            console.warn(`[Nexus Sync] Rôle '${claimedRole}' refusé à ${ws.remoteAddress} : appairage absent ou invalide`);
            claimedRole = 'player';
            ws.send(JSON.stringify({
                type: 'remote:error',
                payload: {
                    code: 'pairing_required',
                    message: 'Appareil non appairé : accès en mode joueur. Scannez le QR code d\'appairage du poste MJ.'
                }
            }));
        }

        ws.deviceId = actualDeviceId;
        ws.role = claimedRole;

        // Track socket for this device
        if (!this.deviceSocketMap.has(actualDeviceId)) {
            this.deviceSocketMap.set(actualDeviceId, new Set());
        }
        this.deviceSocketMap.get(actualDeviceId)!.add(ws);

        try {
            // claimedRole, pas le rôle brut du payload : le registre de session ne
            // doit jamais mémoriser un privilège qui vient d'être refusé.
            sessionManager.registerClient(actualDeviceId, pseudo || 'Unknown', claimedRole, playerName, characterId, ws.remoteAddress);
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

    /**
     * Vérifie qu'un client a le droit de déclencher cette action.
     *
     * Un refus est jeté en silence côté émetteur — inutile de lui apprendre ce
     * qui existe — mais journalisé côté MJ avec de quoi identifier l'appareil.
     */
    private isActionAuthorized(ws: ExtendedWebSocket, data: any): boolean {
        const client = ws.deviceId ? sessionManager.getClient(ws.deviceId) : undefined;
        const verdict = evaluateAction(data?.type, data?.payload, ws.role, client?.characterId);

        if (!verdict.allowed) {
            console.warn(
                `[Nexus Sync] Action '${data?.type}' refusée (${verdict.reason}) — ` +
                `rôle '${ws.role}', appareil '${ws.deviceId}', adresse ${ws.remoteAddress} : ${verdict.detail}`
            );
            return false;
        }
        return true;
    }

    private forwardToGM(ws: ExtendedWebSocket, data: any) {
        // Contrôle avant tout effet : la branche P2P ci-dessous rediffuse aux
        // autres clients sans repasser par le renderer.
        if (!this.isActionAuthorized(ws, data)) return;

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

        ipcMain.on('remote:eject-all', () => {
            console.log('[Nexus Sync] ⚠️ EJECT ALL — Force disconnecting all clients');
            if (this.wss) {
                this.wss.clients.forEach((client: ExtendedWebSocket) => {
                    try {
                        client.send(JSON.stringify({ type: 'remote:ejected', payload: { reason: 'GM initiated full reset' } }));
                        client.close(1000, 'Ejected by GM');
                    } catch { /* ignore errors on already-closing sockets */ }
                });
            }
            sessionManager.clearAll();
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
