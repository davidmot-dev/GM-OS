import { openDB } from 'idb';
import { withTimeout } from './promiseUtils';

const mediaCache = new Map<string, string>();

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
        if (window.appBridge?.remote?.getConnectionInfo) {
            try {
                const conn = await window.appBridge.remote.getConnectionInfo();
                if (conn && conn.ip && conn.ip !== '127.0.0.1' && conn.ip !== 'localhost' && conn.port) {
                    const normalized = src.replace(/\\/g, '/');
                    return `http://${conn.ip}:${conn.port}/media/${encodeURIComponent(normalized)}`;
                }
            } catch (e) {
                console.error('[MediaResolver] Error getting connection info:', e);
            }
        }
        if (window.appBridge?.utils?.formatFileUrl) {
            return window.appBridge.utils.formatFileUrl(src);
        }
    }
    
    return src;
}
