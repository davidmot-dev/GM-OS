import { ipcMain, BrowserWindow, app } from 'electron';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { servirVideoDuModule } from './modulesDuJeu/video';
import { ENTETE_MEDIA_PRIVE, lireFichierMedia, projeterMedias, servirMediaPrive } from './modulesDuJeu/medias';
import type { LecteurDeModule } from './modulesDuJeu/registre';
import { ServiceDesModules } from './modulesDuJeu/service';
import { stockageDesModules } from './modulesDuJeu/stockage';
import type { StockageDesModules } from './modulesDuJeu/stockage';
import { objetSimple, identifiantDeTable } from '../src/modules/modulesDuJeu/protocole';
import type { ContexteDesModules, RequeteDeModule, SauvegardeDesModules } from '../src/modules/modulesDuJeu/protocole';
import http from 'node:http';
import type { Socket } from 'node:net';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'node:path';
import fs from 'fs-extra';
import { sessionManager } from './SessionManager';
import { filtrerAstrologieDistante } from '../src/modules/session/logic/astrologiePartagee';
import { caviarderPourLesJoueurs } from '../src/modules/remote/logic/caviardageDesJoueurs';
import { mediaAccess } from './MediaAccess';
import { pairingManager } from './PairingManager';
import { evaluateAction, retirerCeQuiRevientAuMeneur } from './actionPolicy';
import { auditDenied } from './auditLog';
import { lecteurDuRole, messagePourLeLecteur, type MessageAchemine } from './destinatairesDesMessages';
import {
    lireLAppui, ENTETE_DU_JETON, TAILLE_MAX_DU_CORPS,
} from './boutonsDeLUlanzi';

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
    /** Champ du transport ws lu uniquement pour l'adresse, absent des types publics. */
    _socket?: Pick<Socket, 'remoteAddress'>;
    isAlive?: boolean;
    deviceId?: string;
    role?: ClientRole;
    identiteModules?: { appareilId: string; personnageId: string | null };
    remoteAddress?: string;
}

/** Ce que l'acheminement lit d'un message ; le reste voyage tel quel. */
function estUnMessage(valeur: unknown): valeur is MessageAchemine {
    if (!valeur || typeof valeur !== 'object') return false;
    const m = valeur as Record<string, unknown>;
    return typeof m.fromId === 'string' && (m.toId === undefined || typeof m.toId === 'string');
}

/** Enveloppe attendue sur le fil ; la charge reste opaque pour ce relais. */
interface MessageRecu {
    type: string;
    payload?: unknown;
    [champ: string]: unknown;
}

type ArgumentsDuRegistre = Parameters<typeof sessionManager.registerClient>;

/** Champs attendus à l'inscription, sans présumer du rôle ni du jeton reçus. */
interface InscriptionRecue {
    deviceId?: unknown;
    pseudo?: ArgumentsDuRegistre[1];
    role?: unknown;
    playerName?: ArgumentsDuRegistre[3];
    characterId?: ArgumentsDuRegistre[4];
    repriseModules?: unknown;
    token?: unknown;
}

export class SyncServer {
    private wss: WebSocketServer | null = null;
    private server: http.Server | null = null;
    private port: number;
    private mainWindow: BrowserWindow;
    private tempMediaDir: string;
    private deviceSocketMap = new Map<string, Set<WebSocket>>();
    /** Dernier segment public d'apparence, pour le client qui s'enregistre après la diffusion initiale. */
    private derniereApparence: unknown = null;
    private instanceDesModules?: ServiceDesModules;
    private stockageDesInstances?: StockageDesModules;
    // Le constructeur peut être appelé avant le verrou du profil : résoudre au premier besoin.
    private get modulesDuJeu(): ServiceDesModules {
        return this.instanceDesModules ??= new ServiceDesModules(this.stockageDesInstances
            ?? stockageDesModules(path.join(app.getPath('userData'), 'modules-du-jeu', 'instances.json')),
        () => { void this.diffuserLesModules(); });
    }
    private reprisesDesModules = new Map<string, string>();
    private jetonMediasMJ = randomBytes(32).toString('hex');
    private sessionsMedia = new WeakMap<WebSocket, { identite: NonNullable<ExtendedWebSocket['identiteModules']>; jeton: string }>();
    private sessionMedia(ws: ExtendedWebSocket, identite: NonNullable<ExtendedWebSocket['identiteModules']>) {
        let session = this.sessionsMedia.get(ws);
        if (session?.identite !== identite) { session = { identite, jeton: randomBytes(32).toString('hex') }; this.sessionsMedia.set(ws, session); }
        return session;
    }
    private projeterRessources<T extends { campagneId: string | null; modules: { id: string; vue: unknown }[] }>(vue: T, jeton: string, mj = false): T {
        if (!vue.campagneId) return vue;
        return { ...vue, modules: vue.modules.map(m => this.modulesDuJeu.utiliseMediasPrives(m.id) ? { ...m,
            vue: projeterMedias(m.vue, vue.campagneId!, m.id, { jeton, port: this.port, ...(mj ? { base: `http://127.0.0.1:${this.port}` } : {}) }) } : m) };
    }
    private async traiterMediaPrive(req: http.IncomingMessage, res: http.ServerResponse, url: string) {
        // Aucun jeton dans l'URL, aucun cache partagé ou service worker.
        res.setHeader('Cache-Control', 'no-store, private, max-age=0'); res.setHeader('Vary', 'Origin, x-gmos-module-session');
        res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', `${ENTETE_MEDIA_PRIVE}, Range`);
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
        if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
        const jeton = req.headers[ENTETE_MEDIA_PRIVE];
        const egal = (s: string) => typeof jeton === 'string' && /^[a-f0-9]{64}$/.test(jeton) && timingSafeEqual(Buffer.from(s), Buffer.from(jeton));
        const identifier = (): LecteurDeModule | null => {
            if (egal(this.jetonMediasMJ) && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress || '') && !this.mainWindow.isDestroyed()) return { role: 'mj', appareilId: 'poste-mj' };
            for (const client of this.wss?.clients ?? []) {
                const ws = client as ExtendedWebSocket, session = this.sessionsMedia.get(ws);
                if (ws.readyState === WebSocket.OPEN && ws.identiteModules?.personnageId && session?.identite === ws.identiteModules && egal(session.jeton))
                    return { role: 'joueur', personnageId: ws.identiteModules.personnageId, appareilId: ws.identiteModules.appareilId };
            }
            return null;
        };
        try {
            const r = /^\/modules-prives\/([^/]+)\/([a-z0-9-]+)\/([a-f0-9]{64})$/.exec(url), lecteur = identifier();
            if (!r || !lecteur) throw new Error();
            const campagne = decodeURIComponent(r[1]), media = await this.modulesDuJeu.mediaPour(campagne, r[2], r[3], lecteur);
            const fichier = await lireFichierMedia(path.join(app.getPath('userData'), 'modules-du-jeu', 'medias-prives'), media);
            const actuel = identifier();
            if (!actuel || actuel.personnageId !== lecteur.personnageId || actuel.appareilId !== lecteur.appareilId) throw new Error();
            // Droits revérifiés après les accès disque asynchrones.
            await this.modulesDuJeu.mediaPour(campagne, r[2], r[3], actuel);
            if (!res.destroyed) servirMediaPrive(req, res, fichier.octets, fichier.mime);
        } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
    }

    constructor(mainWindow: BrowserWindow, port: number, tempMediaDir: string, stockage?: StockageDesModules) {
        this.mainWindow = mainWindow;
        this.port = port;
        this.tempMediaDir = tempMediaDir;
        this.stockageDesInstances = stockage;
    }

    public start() {
        try {
            this.server = http.createServer((req, res) => this.handleHttpRequest(req, res));
            this.wss = new WebSocketServer({ server: this.server });

            this.wss.on('connection', (ws: ExtendedWebSocket) => {
                this.handleConnection(ws);
            });

            /*
              ⛔ **Un port occupé ne doit pas tuer GM-OS.**

              `listen` signale l'échec par un événement `error` **asynchrone** : le
              `try/catch` qui entoure ce bloc ne l'attrape pas, et un `error` sans
              écouteur est une exception non gérée qui emporte le processus
              principal. *Lancer GM-OS une seconde fois le faisait donc crasher*,
              et c'est ce qui interdisait d'exécuter les tests de bout en bout en
              parallèle.

              Le voisin le savait déjà : `ServeurDesFiches` porte cette garde
              depuis sa création, avec sa raison — « les fiches ne s'afficheront
              pas sur les tablettes, le reste marche ». Ici c'est la
              synchronisation des tablettes qui manquera, et le meneur gardera son
              cockpit. *Perdre une fonction vaut mieux que perdre l'application.*

              ⚠️ **C'EST SUR `wss` QU'IL FAUT ÉCOUTER, ET C'EST CONTRE-INTUITIF.**
              `new WebSocketServer({ server })` pose ses propres écouteurs sur le
              serveur HTTP, dont un `error` qu'il **ré-émet sur lui-même**.
              L'erreur est donc déjà « gérée » côté HTTP — poser la garde
              uniquement là ne change rien — et c'est `wss`, sans écouteur, qui
              lève. *Mesuré : une garde posée sur le serveur HTTP seul laissait le
              processus tomber exactement comme avant.*

              On garde les deux : `wss` est celle qui mord, et celle du serveur
              couvre le cas où le WebSocket ne serait pas encore attaché.
            */
            const surErreur = (err: NodeJS.ErrnoException) => {
                const pourquoi = err.code === 'EADDRINUSE'
                    ? `le port ${this.port} est déjà pris — une autre instance de GM-OS tourne-t-elle ?`
                    : err.message;
                console.error(`[Nexus Sync] Serveur non démarré : ${pourquoi}`);
                this.server = null;
            };
            this.wss.on('error', surErreur);
            this.server.on('error', surErreur);

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

    /**
     * **Un appui sur un bouton de l'afficheur, relayé par Home Assistant.**
     *
     * ⛔ **Le jeton est jugé AVANT que le corps ne soit lu**, et c'est la seule
     * façon de ne rien accumuler pour un inconnu. Le secret voyage dans un
     * en-tête : il est donc disponible tout de suite, alors que le corps
     * arrive en morceaux.
     *
     * ⭐ **Le pré-vol n'est pas un second contrôle, c'est le même.** On appelle
     * `lireLAppui` avec un corps **vide** : si elle refuse pour la méthode ou
     * pour le jeton, on s'arrête là. Un `400` signifie au contraire que ces
     * deux-là sont bons — il ne reste qu'à lire ce qui suit. *Deux écrivains
     * pour une même décision finissent toujours par diverger ; ici il n'y en a
     * qu'un, appelé deux fois.*
     */
    private traiterLAppui(req: http.IncomingMessage, res: http.ServerResponse) {
        const repondre = (code: number, charge: object) => {
            res.writeHead(code, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(charge));
        };

        const entree = {
            methode: req.method,
            jeton: req.headers[ENTETE_DU_JETON] as string | undefined,
            leSecretEstBon: (jeton: unknown) => pairingManager.verify(jeton),
        };

        const preVol = lireLAppui({ ...entree, corps: '' });
        if (!preVol.ok && preVol.code !== 400) {
            /* Refus sur la méthode ou le jeton : rien n'a été lu, rien ne le sera. */
            auditDenied('[Ulanzi] appui refuse : ' + preVol.motif);
            repondre(preVol.code, { erreur: preVol.motif });
            req.destroy();
            return;
        }

        let corps = '';
        let coupe = false;

        req.on('data', (morceau: Buffer) => {
            if (coupe) return;
            corps += morceau.toString('utf8');

            /*
              ⚠️ On coupe la ligne au lieu d'accumuler pour refuser à la fin :
              *attendre la fin d'un flux qu'on a déjà décidé de rejeter, c'est
              accepter un flux sans fin.* L'appelant est authentifié à ce
              stade — il apprend donc légitimement la borne.
            */
            if (corps.length > TAILLE_MAX_DU_CORPS) {
                coupe = true;
                repondre(413, { erreur: 'corps trop volumineux' });
                req.destroy();
            }
        });

        req.on('end', () => {
            if (coupe) return;

            const verdict = lireLAppui({ ...entree, corps });
            if (!verdict.ok) {
                repondre(verdict.code, { erreur: verdict.motif });
                return;
            }

            /*
              ⛔ **On transmet l'appui, jamais une action.** Le geste associé vit
              dans les réglages du meneur, et c'est sa propre fenêtre qui le
              construit. Home Assistant n'a donc aucune prise sur le registre
              des actions — voir l'en-tête de `boutonsDeLUlanzi.ts`.
            */
            this.mainWindow?.webContents.send('ulanzi:bouton', verdict.bouton);
            repondre(200, { recu: verdict.bouton });
        });

        req.on('error', () => { /* client parti en cours de route : rien à faire */ });
    }

    private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        if (!req.url) return;

        // Le serveur écoute sur 0.0.0.0 : tout chemin venant d'un client est hostile
        // par défaut. On coupe la query string avant décodage, sinon `?x=..` passe.
        const urlPath = req.url.split('?')[0];
        if (urlPath.startsWith('/modules-prives/')) { void this.traiterMediaPrive(req, res, urlPath); return; }

        /*
          **Les trois boutons de l'afficheur, poussés par Home Assistant.**

          En tête du routeur parce que c'est la seule route qui ÉCRIT : la
          laisser tomber dans le service de fichiers statiques la rendrait
          dépendante de l'ordre des `if`, et *une garde qui ne tient que par sa
          position finit par bouger.*
        */
        if (urlPath === '/bouton') {
            this.traiterLAppui(req, res);
            return;
        }

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
                'Access-Control-Allow-Origin': '*',
                // Le type declare fait foi : pas de reniflage, pas de surprise.
                // Le proxy sert du .svg, que le navigateur executerait s'il le
                // prenait pour du HTML. Meme geste que dans serveurDesFiches.
                'X-Content-Type-Options': 'nosniff',
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
                    'Access-Control-Allow-Origin': '*',
                    'X-Content-Type-Options': 'nosniff',
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
            if (ext === '.webm' || ext === '.mp4') { servirVideoDuModule(req, res, filePath, ext === '.webm' ? 'video/webm' : 'video/mp4'); return; }
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
        const remoteAddress = ws._socket?.remoteAddress;
        ws.remoteAddress = remoteAddress;
        console.log(`[Nexus Sync] New device connected from ${remoteAddress}`);

        // Pas de demande d'état complet ici : voir `handleRegister` (§ 130).

        ws.on('message', (message: string) => {
            try {
                // Contrat attendu, pas une validation du JSON : le relais conserve la charge brute.
                const data = JSON.parse(message) as MessageRecu;
                
                if (data.type === 'remote:register') {
                    this.handleRegister(ws, data.payload);
                } else if (data.type === 'remote:ping') {
                    ws.send(JSON.stringify({ type: 'remote:pong', payload: data.payload }));
                } else if (typeof data.type === 'string' && data.type.startsWith('modules:')) {
                    void this.traiterCommandeDeModule(ws, data);
                } else {
                    this.forwardToGM(ws, data);
                }
            } catch (err) {
                console.error('[Nexus Sync] Failed to parse message:', err);
            }
        });

        ws.on('close', () => {
            ws.identiteModules = undefined;
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
                void this.diffuserLesModules();
            }
        });
    }

    private handleRegister(ws: ExtendedWebSocket, payload: unknown) {
        const { deviceId, pseudo: nomRecu, role, playerName: joueurRecu, characterId: personnageRecu, token, repriseModules } = (payload || {}) as InscriptionRecue;
        const pseudo = typeof nomRecu === 'string' ? nomRecu.slice(0, 80) : 'Unknown';
        const playerName = typeof joueurRecu === 'string' ? joueurRecu.slice(0, 80) : undefined;
        const characterId = identifiantDeTable(personnageRecu) ? personnageRecu : undefined;
        const actualDeviceId = identifiantDeTable(deviceId)
            ? deviceId
            : `remote-${Math.random().toString(36).substring(2, 9)}`;

        // Un rôle non reconnu ne doit pas se retrouver tel quel dans le routage des
        // broadcasts : on retombe sur le rôle le moins privilégié.
        let claimedRole: ClientRole = ALLOWED_ROLES.includes(role as ClientRole) ? role as ClientRole : 'player';

        // Les rôles privilégiés reçoivent le flux non caviardé (notes privées,
        // gmSecretInfo). Le rôle étant déclaré par le client, seul le secret
        // d'appairage permet de l'accorder.
        if (PRIVILEGED_ROLES.includes(claimedRole) && !pairingManager.verify(token)) {
            auditDenied(`Rôle '${claimedRole}' refusé à ${ws.remoteAddress} (appareil '${actualDeviceId}') : appairage absent ou invalide`);
            claimedRole = 'player';
            ws.send(JSON.stringify({
                type: 'remote:error',
                payload: {
                    code: 'pairing_required',
                    message: 'Appareil non appairé : accès en mode joueur. Scannez le QR code d\'appairage du poste MJ.'
                }
            }));
        }

        const repriseConnue = this.reprisesDesModules.get(actualDeviceId);
        const repriseValide = typeof repriseModules === 'string' && /^[a-f0-9]{64}$/.test(repriseModules)
            && !!repriseConnue && timingSafeEqual(Buffer.from(repriseModules, 'hex'), Buffer.from(repriseConnue, 'hex'));
        if (repriseConnue && ws.deviceId !== actualDeviceId && !repriseValide && !PRIVILEGED_ROLES.includes(claimedRole)) {
            ws.send(JSON.stringify({ type: 'remote:error', payload: { code: 'reprise_refusee', message: 'Cet appareil est déjà enregistré. Reprends sa session d’origine ou utilise un nouvel appareil.' } }));
            return;
        }
        if (characterId && sessionManager.getAllClients().some(client => client.characterId === characterId
            && client.deviceId !== actualDeviceId && (client.status === 'active' || client.status === 'ghost'))) {
            // Une adresse IP partagée (Wi-Fi/NAT) ne prouve pas l'identité d'une tablette.
            ws.send(JSON.stringify({ type: 'remote:error', payload: { code: 'character_taken', message: 'Ce personnage est déjà réservé par un autre appareil.' } }));
            return;
        }

        try {
            // claimedRole, pas le rôle brut du payload : le registre de session ne
            // doit jamais mémoriser un privilège qui vient d'être refusé.
            sessionManager.registerClient(actualDeviceId, pseudo || 'Unknown', claimedRole, playerName, characterId, ws.remoteAddress);
            // L'identité privée est portée par la socket qui a réussi son inscription.
            // Une collision ne laisse donc ni rôle, ni personnage utilisable pour les modules.
            if (ws.deviceId && ws.deviceId !== actualDeviceId) this.deviceSocketMap.get(ws.deviceId)?.delete(ws);
            ws.deviceId = actualDeviceId; ws.role = claimedRole;
            if (!this.deviceSocketMap.has(actualDeviceId)) this.deviceSocketMap.set(actualDeviceId, new Set());
            for (const autre of this.deviceSocketMap.get(actualDeviceId) ?? []) {
                const socket = autre as ExtendedWebSocket;
                if (socket !== ws && socket.identiteModules?.personnageId !== (characterId || null)) {
                    socket.identiteModules = undefined;
                    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'modules:fermes' }));
                }
            }
            this.deviceSocketMap.get(actualDeviceId)!.add(ws);
            ws.identiteModules = { appareilId: actualDeviceId, personnageId: typeof characterId === 'string' && characterId ? characterId : null };
            const nouveauJeton = repriseConnue ?? randomBytes(32).toString('hex');
            this.reprisesDesModules.set(actualDeviceId, nouveauJeton);
            this.updateGMClients();
            
            // Confirm registration and send role back
            ws.send(JSON.stringify({ type: 'remote:registered', payload: { deviceId: actualDeviceId, role: ws.role, repriseModules: nouveauJeton } }));
            void this.diffuserLesModules();
            if (this.derniereApparence) {
                ws.send(JSON.stringify({ type: 'sync', payload: { apparence: this.derniereApparence } }));
            }

            /*
              **L'état complet se demande une fois le rôle connu**, pas à la
              connexion (2026-10-09, § 130 du registre). Le meneur diffuse par
              rôle et `broadcastAction` ne remet qu'aux sockets dont le rôle
              correspond : demandé dès `handleConnection`, l'état complet
              pouvait partir avant `remote:register` et n'atteindre personne.
              Les diffusions suivantes ne portent que ce qui change — les pads
              d'une tablette du meneur restaient donc absents jusqu'à une
              nouvelle connexion (constat T0 du 05/10 : trois essais vides sur
              quatre). Une réinscription redemande l'état, et c'est voulu : le
              rôle ou le personnage, donc le caviardage, peut avoir changé. Le
              plancher de `useNexusSynchronizer` fond les rafales.
            */
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('remote:request-sync');
                /*
                  **Et son fil de messages, à elle seule** (2026-10-12, M3). Une
                  tablette rechargée — veille de l'iPad, Vite en développement —
                  repartait d'un fil vide : le meneur ne rendait rien. La tablette
                  du meneur, elle, reçoit son fil dans l'état complet.
                */
                if (!PRIVILEGED_ROLES.includes(claimedRole)) {
                    this.mainWindow.webContents.send('remote:demande-du-fil', {
                        deviceId: actualDeviceId,
                        role: claimedRole,
                        characterId: sessionManager.getClient(actualDeviceId)?.characterId,
                    });
                }
            }
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'message' in err && err.message === 'character_taken') {
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
    private async rendreLesModules(ws: ExtendedWebSocket) {
        const identite = ws.identiteModules;
        if (!identite || ws.readyState !== WebSocket.OPEN) return;
        const vue = this.projeterRessources(await this.modulesDuJeu.vueJoueur(identite.personnageId, identite.appareilId), this.sessionMedia(ws, identite).jeton);
        if (ws.identiteModules === identite && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'modules:vue', payload: vue }));
    }

    private async diffuserLesModules() {
        const vueMJ = this.projeterRessources(await this.modulesDuJeu.vueMJ(), this.jetonMediasMJ, true);
        vueMJ.appareils = this.appareilsDesModules();
        if (!this.mainWindow.isDestroyed()) this.mainWindow.webContents.send('modules:changement', vueMJ);
        if (this.wss) await Promise.all([...this.wss.clients].map(ws => this.rendreLesModules(ws as ExtendedWebSocket)));
    }
    private appareilsDesModules() {
        const appareils = new Map<string, { id: string; libelle: string; personnageId: string }>();
        for (const client of this.wss?.clients ?? []) {
            const ws = client as ExtendedWebSocket, identite = ws.identiteModules;
            if (ws.readyState === WebSocket.OPEN && identite?.personnageId) appareils.set(identite.appareilId, {
                id: identite.appareilId, personnageId: identite.personnageId,
                libelle: String(sessionManager.getClient(identite.appareilId)?.pseudo || identite.appareilId).slice(0, 80),
            });
        }
        return [...appareils.values()];
    }

    private commandesDesModules = new WeakMap<WebSocket, { instant: number; nombre: number; dejaVues: Set<string> }>();
    private async traiterCommandeDeModule(ws: ExtendedWebSocket, message: MessageRecu) {
        if (!ws.identiteModules || ws.readyState !== WebSocket.OPEN) return;
        if (message.type === 'modules:consulter') { await this.rendreLesModules(ws); return; }
        if (message.type !== 'modules:commander' || !objetSimple(message.payload)) return;
        const charge = message.payload, identite = ws.identiteModules;
        if (typeof charge.requeteId !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(charge.requeteId)) return;
        const requeteId = charge.requeteId;
        const repondre = (ok: boolean, erreur?: string) => {
            if (ws.readyState === WebSocket.OPEN && ws.identiteModules === identite) ws.send(JSON.stringify({ type: 'modules:resultat', payload: { requeteId, ok, erreur } }));
        };
        const compteur = this.commandesDesModules.get(ws) ?? { instant: Date.now(), nombre: 0, dejaVues: new Set<string>() };
        if (Date.now() - compteur.instant > 10000) { compteur.instant = Date.now(); compteur.nombre = 0; }
        if (++compteur.nombre > 30 || compteur.dejaVues.has(requeteId) || JSON.stringify(charge).length > 64000) { repondre(false, 'Commande refusée. Attends un instant avant de réessayer.'); return; }
        compteur.dejaVues.add(requeteId);
        if (compteur.dejaVues.size > 128) compteur.dejaVues.delete(compteur.dejaVues.values().next().value!);
        this.commandesDesModules.set(ws, compteur);
        try {
            await this.modulesDuJeu.commander(charge as unknown as RequeteDeModule, { role: 'joueur', personnageId: identite.personnageId ?? undefined, appareilId: identite.appareilId },
                () => ws.identiteModules === identite && ws.readyState === WebSocket.OPEN);
            repondre(true);
        } catch { repondre(false, 'La commande a été refusée ou n’a pas pu être enregistrée. Vérifie l’accès et l’état de la table.'); }
    }

    private isActionAuthorized(ws: ExtendedWebSocket, data: MessageRecu): boolean {
        const client = ws.deviceId ? sessionManager.getClient(ws.deviceId) : undefined;
        const verdict = evaluateAction(data?.type, data?.payload, ws.role, client?.characterId);

        if (!verdict.allowed) {
            auditDenied(
                `Action '${data?.type}' refusée (${verdict.reason}) — ` +
                `rôle '${ws.role}', appareil '${ws.deviceId}', adresse ${ws.remoteAddress} : ${verdict.detail}`
            );
            return false;
        }
        return true;
    }

    private forwardToGM(ws: ExtendedWebSocket, data: MessageRecu) {
        // Contrôle avant tout effet : la branche P2P ci-dessous rediffuse aux
        // autres clients sans repasser par le renderer.
        if (!this.isActionAuthorized(ws, data)) return;

        /*
          ⛔ **Un message de séance est ACHEMINÉ, plus diffusé** (2026-10-12).
          Le relais partait vers toutes les sockets, et le message de joueur à
          joueur n'atteignait jamais le meneur. Désormais : remis à ses seuls
          lecteurs, et **toujours** transmis au meneur, qui le garde avec la
          campagne pour le rendre à une tablette rechargée — même ce qu'il ne
          montre pas (décision de David : gardés mais cachés).
        */
        if (data.type === 'session:send-message' && estUnMessage(data.payload)) {
            this.acheminerLeMessage({ ...data, type: 'session:receive-message' }, data.payload, ws);
        }

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            // Les notes du meneur ne s'écrivent pas depuis une tablette de joueur (S4, 2026-10-22).
            const permis = retirerCeQuiRevientAuMeneur(data.type, data.payload, ws.role);
            this.mainWindow.webContents.send('remote:action', permis === data.payload ? data : { ...data, payload: permis });
        }
    }

    /**
     * **Rend son fil à UN appareil** — celui qui vient de s'inscrire.
     *
     * Le meneur a déjà choisi les messages de cette tablette (`filDuLecteur`) ;
     * le serveur **refiltre** quand même avec le personnage qu'il connaît, lui :
     * c'est la seule porte vers l'appareil, et une erreur du côté meneur ne doit
     * pas pouvoir y faire passer le message d'un autre.
     */
    private rendreLeFil(deviceId: unknown, messages: unknown) {
        if (typeof deviceId !== 'string' || !Array.isArray(messages)) return;
        const sockets = this.deviceSocketMap.get(deviceId);
        if (!sockets) return;
        const lecteur = lecteurDuRole(
            sessionManager.getClient(deviceId)?.role, sessionManager.getClient(deviceId)?.characterId);
        const siens = messages.filter(m => estUnMessage(m) && messagePourLeLecteur(m, lecteur));
        const brut = JSON.stringify({ type: 'session:fil-de-messages', payload: siens });
        sockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) ws.send(brut);
        });
    }

    /**
     * **Remet un message à ses seuls lecteurs** : la règle de
     * `destinatairesDesMessages`, appliquée à chaque socket inscrite. Une
     * socket qui ne s'est pas encore inscrite n'a ni rôle ni personnage : elle
     * ne reçoit rien.
     */
    private acheminerLeMessage(envoi: unknown, message: MessageAchemine, sender?: WebSocket) {
        if (!this.wss) return;
        const brut = JSON.stringify(envoi);
        this.wss.clients.forEach((client: ExtendedWebSocket) => {
            if (client === sender || client.readyState !== WebSocket.OPEN || !client.role) return;
            const characterId = client.deviceId ? sessionManager.getClient(client.deviceId)?.characterId : undefined;
            if (messagePourLeLecteur(message, lecteurDuRole(client.role, characterId))) {
                client.send(brut);
            }
        });
    }

    private broadcastAction(action: unknown, sender?: WebSocket, targetRole?: string) {
        if (!this.wss) return;
        const message = JSON.stringify(action);
        this.wss.clients.forEach((client: ExtendedWebSocket) => {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                if (!targetRole || client.role === targetRole) {
                    const a = action as {type?:string;payload?:unknown};
                    if (a?.type === 'sync' && (client.role === 'player' || client.role === 'hub')) {
                        /*
                          **Le dernier rempart avant la tablette d'un joueur** (S1, S2
                          de l'audit du 2026-10-22). Le renderer caviarde déjà ce qu'il
                          adresse aux joueurs, mais une diffusion partie SANS rôle — celle
                          du combat — arrivait ici telle quelle, secrets des combattants
                          compris. Le même caviardage, quoi qu'on ait reçu.
                        */
                        const personnage = client.deviceId ? sessionManager.getClient(client.deviceId)?.characterId ?? null : null;
                        client.send(JSON.stringify({...a,payload:caviarderPourLesJoueurs(filtrerAstrologieDistante(a.payload,personnage))}));
                    } else client.send(message);
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
        // Ces méthodes sont réservées à la fenêtre MJ native, jamais au rôle déclaré par un renderer.
        const proteger = <Charge>(action: (charge: Charge) => Promise<unknown>) => async (event: Electron.IpcMainInvokeEvent, charge: Charge) => {
            if (this.mainWindow.isDestroyed() || event.sender !== this.mainWindow.webContents) return { ok: false, erreur: 'Accès MJ requis.' };
            try { await action(charge); return { ok: true }; }
            catch (e) { return { ok: false, erreur: e instanceof Error ? e.message : 'Commande du module refusée.' }; }
        };
        ipcMain.handle('modules:contexte', proteger((charge: ContexteDesModules) => this.modulesDuJeu.changerContexte(charge)));
        ipcMain.handle('modules:commander', proteger((charge: RequeteDeModule) => this.modulesDuJeu.commander(charge, { role: 'mj', appareilId: 'poste-mj' })));
        ipcMain.handle('modules:acquitter-fiche', proteger((charge: import('../src/modules/modulesDuJeu/protocole').AccuseFicheDeModule) => this.modulesDuJeu.acquitterFiche(charge)));
        ipcMain.handle('modules:autoriser', proteger((charge: Parameters<ServiceDesModules['autoriser']>[0]) => this.modulesDuJeu.autoriser(charge)));
        ipcMain.handle('modules:tout-couper', proteger((charge: Parameters<ServiceDesModules['toutCouper']>[0]) => this.modulesDuJeu.toutCouper(charge)));
        ipcMain.handle('modules:diffusion', proteger(async (charge: { campagneId: string; moduleId: string; appareilId: string; contexte: number }) => {
            const appareil = charge.appareilId === 'poste-mj' ? { id: 'poste-mj' } : this.appareilsDesModules().find(a => a.id === charge.appareilId);
            if (!appareil) throw new Error('Cet appareil n’est plus connecté.');
            await this.modulesDuJeu.choisirDiffusion(charge, appareil);
        }));
        ipcMain.handle('modules:importer', proteger((charge: SauvegardeDesModules) => this.modulesDuJeu.importer(charge)));
        ipcMain.handle('modules:lire', async event => {
            if (this.mainWindow.isDestroyed() || event.sender !== this.mainWindow.webContents) throw new Error('Accès MJ requis.');
            return { ...this.projeterRessources(await this.modulesDuJeu.vueMJ(), this.jetonMediasMJ, true), appareils: this.appareilsDesModules() };
        });
        ipcMain.on('remote:broadcast-sync', (_event, data, role?: string) => {
            if (data?.apparence && (role === 'player' || role === 'remote')) {
                this.derniereApparence = data.apparence;
            }
            this.broadcastAction({ type: 'sync', payload: data }, undefined, role);
        });

        ipcMain.on('remote:broadcast-ui-action', (_event, action, role?: string) => {
            this.broadcastAction(action, undefined, role);
        });

        ipcMain.on('remote:rendre-le-fil', (_event, deviceId: unknown, messages: unknown) => {
            this.rendreLeFil(deviceId, messages);
        });

        ipcMain.on('remote:acheminer-un-message', (_event, message: unknown) => {
            if (!estUnMessage(message)) return;
            this.acheminerLeMessage({ type: 'session:receive-message', payload: message }, message);
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
            this.reprisesDesModules.clear();
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
