import { openDB } from 'idb';
import { withTimeout } from './promiseUtils';

const mediaCache = new Map<string, string>();

/**
 * Médias déjà déposés dans le cache disque du poste MJ pour cette session.
 *
 * Le dossier temp-media est vidé au démarrage de l'application, et ce module
 * vit dans le même processus : les deux durées de vie coïncident.
 */
const publishedToServer = new Set<string>();

interface ConnectionInfo { ip: string; port: number; mediaPort?: number }

/** Base des URL de médias : toujours le port du SyncServer, jamais celui de Vite. */
function mediaOrigin(conn: ConnectionInfo): string {
    return `http://${conn.ip}:${conn.mediaPort ?? conn.port}`;
}

/** Adresse du poste MJ sur le réseau local, ou null s'il n'y en a pas. */
async function getLanConnection(): Promise<ConnectionInfo | null> {
    if (!window.appBridge?.remote?.getConnectionInfo) return null;
    try {
        const conn = await window.appBridge.remote.getConnectionInfo();
        if (!conn?.ip || !conn.port) return null;
        if (conn.ip === '127.0.0.1' || conn.ip === 'localhost') return null;
        return conn;
    } catch (e) {
        console.error('[MediaResolver] Error getting connection info:', e);
        return null;
    }
}

/**
 * Dépose un média dans le cache disque du poste MJ et retourne son URL.
 *
 * Sans cela, chaque image part en base64 **dans le payload de synchronisation** :
 * un avatar de 200 Ko en pèse 267 une fois encodé, et il est retransmis à chaque
 * diffusion. Une référence coûte quelques dizaines d'octets, et la tablette va
 * chercher l'octet une seule fois.
 */
async function publishToServer(id: string, blob: Blob, conn: ConnectionInfo): Promise<string | null> {
    const cacheMedia = window.appBridge?.remote?.cacheMedia;
    if (!cacheMedia) return null;

    if (!publishedToServer.has(id)) {
        try {
            const buffer = await blob.arrayBuffer();
            const ok = await cacheMedia(buffer, id);
            if (!ok) return null;
            publishedToServer.add(id);
        } catch (e) {
            console.error(`[MediaResolver] Dépôt de ${id} impossible:`, e);
            return null;
        }
    }

    return `${mediaOrigin(conn)}/temp/${encodeURIComponent(id)}`;
}

/**
 * Resolves a media source (m-xxx ID or path) to a sendable URL.
 * 
 * 🛡️ RESTAURATION STABLE v5 (Base64 Method)
 * Note: Les Blobs sont désactivés car instables dans Electron entre fenêtres.
 */
export async function resolveToSendableUrl(src: string | undefined): Promise<string> {
    if (!src) return '';
    
    // Déjà résolu (DataURL ou Remote)
    if (src.startsWith('blob:') || src.startsWith('data:') || (src.startsWith('http') && !src.includes('127.0.0.1') && !src.includes('localhost'))) {
        return src;
    }

    // Gestion des IDs médias (m-xxx ou UUID standard)
    const isMediaId = src.startsWith('m-') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(src);
    
    if (isMediaId) {
        if (mediaCache.has(src)) return mediaCache.get(src)!;
        
        console.log(`[MediaResolver] Resolving potential MediaID: ${src}`);

        try {
            const db = await withTimeout(openDB('gmos-media-db', 5), 4000, 'DB_OPEN_TIMEOUT');
            const item = await withTimeout(db.get('media', src), 2000, 'DB_READ_TIMEOUT');
            
            if (!item || !item.blob) {
                console.warn(`[MediaResolver] Media ID ${src} not found in IndexedDB.`);
                return ''; // Arrêt net : on ne veut pas que cet ID soit traité comme un fichier disque
            }
            
            const blob = item.blob as Blob;

            // Voie préférée : déposer l'octet une fois et n'envoyer qu'une
            // référence. On ne retombe sur le base64 que sans réseau local
            // utilisable — poste isolé, ou pont applicatif absent.
            const conn = await getLanConnection();
            if (conn) {
                const url = await publishToServer(src, blob, conn);
                if (url) {
                    mediaCache.set(src, url);
                    return url;
                }
                console.warn(`[MediaResolver] Dépôt de ${src} échoué, repli sur base64.`);
            }

            const result = await withTimeout(new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve('');
                reader.readAsDataURL(blob);
            }), 10000, 'BASE64_TIMEOUT');
            
            if (result) {
                mediaCache.set(src, result);
                return result;
            }
        } catch (e) {
            console.error(`[MediaResolver] Error resolving ${src}:`, e);
        }
        return ''; // Échec de résolution IndexedDB -> Pas d'image
    }
    // Uniquement pour les vrais chemins de fichiers (contenant des séparateurs de dossiers)
    const isPath = src.includes('/') || src.includes('\\');
    if (isPath) {
        const conn = await getLanConnection();
        if (conn) {
            const normalized = src.replace(/\\/g, '/');
            return `${mediaOrigin(conn)}/media/${encodeURIComponent(normalized)}`;
        }
        if (window.appBridge?.utils?.formatFileUrl) {
            return window.appBridge.utils.formatFileUrl(src);
        }
    }
    
    return src;
}
