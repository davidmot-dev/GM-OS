import { openDB } from 'idb';
import { withTimeout } from './promiseUtils';

const mediaCache = new Map<string, string>();

/**
 * Médias déjà déposés dans le cache disque du poste MJ.
 *
 * Cette mémoire ne vaut que pour un contenu donné de `temp-media`, que le
 * process principal vide à chaque démarrage. Les deux durées de vie ne
 * coïncident pas forcément — croire le contraire fait publier des références
 * vers des fichiers effacés, qui répondent 404 sur les tablettes.
 * `mediaEpoch` sert de témoin : quand il change, on repart de zéro.
 */
const publishedToServer = new Set<string>();
let knownMediaEpoch: string | null = null;

interface ConnectionInfo { ip: string; port: number; mediaPort?: number; mediaEpoch?: string }

/** Oublie ce qu'on croyait déposé si le cache disque a été vidé entre-temps. */
function syncMediaEpoch(conn: ConnectionInfo) {
    const epoch = conn.mediaEpoch ?? null;
    if (epoch === knownMediaEpoch) return;

    if (knownMediaEpoch !== null) {
        console.log('[MediaResolver] Cache disque du MJ renouvelé, redépôt des médias.');
        publishedToServer.clear();
        // Les URL mémorisées pointent vers des fichiers qui n'existent plus.
        for (const [key, value] of mediaCache) {
            if (value.includes('/temp/')) mediaCache.delete(key);
        }
    }
    knownMediaEpoch = epoch;
}

/** Base des URL de médias : toujours le port du SyncServer, jamais celui de Vite. */
function mediaOrigin(conn: ConnectionInfo): string {
    return `http://${conn.ip}:${conn.mediaPort ?? conn.port}`;
}

/** Adresse du poste MJ sur le réseau local, ou null s'il n'y en a pas. */
/**
 * **Combien de temps on garde la réponse du processus principal.**
 *
 * ⛔ **Le défaut trouvé le 2026-09-22** : David, tablette connectée, *« j'ai
 * encore des saccades dans l'ambiance »*, puis *« la vidéo aussi lag »*. Les
 * deux ensemble disaient que ce n'était pas l'audio, mais **le fil principal qui
 * sature**.
 *
 * `getLanConnection` fait un **aller-retour IPC**, et il était attendu à chaque
 * appel de `resolveToSendableUrl` — **même sur un cache plein**. Or la
 * synchronisation de la tablette résout dix familles de médias (avatars,
 * portraits, cartes, indices, pads…) **en séquence**, jusqu'à deux fois par
 * seconde. Sur une campagne de 43 PNJ, cela dépasse **cent allers-retours par
 * seconde** : le rendu vidéo et le fil audio se partagent ce qui reste.
 *
 * ⭐ **L'ordre reste le bon** — interroger avant de croire le cache, parce que le
 * dossier temporaire du meneur a pu être vidé — mais il n'a pas à être payé
 * *par média* : **une fois par diffusion suffit.** *Le dossier ne se vide pas
 * entre deux avatars du même envoi.*
 */
const DUREE_DE_LA_CONNEXION_MS = 900;

let connexionRetenue: { valeur: ConnectionInfo | null; quand: number } | null = null;

/**
 * ⛔ **La demande EN COURS, et pas seulement la réponse.**
 *
 * La synchronisation résout plusieurs médias **en parallèle** (`Promise.all`) :
 * sans ça, les dix partent avant que le premier aller-retour ne réponde, et le
 * cache n'épargne rien du tout. *Un cache qui ne se remplit qu'après la rafale
 * ne sert pas la rafale.*
 */
let demandeEnCours: Promise<ConnectionInfo | null> | null = null;

/** Oublie la réponse retenue — pour les essais, et pour une reconnexion. */
export function oublierLaConnexionRetenue(): void {
    connexionRetenue = null;
    demandeEnCours = null;
}

function getLanConnection(): Promise<ConnectionInfo | null> {
    if (!window.appBridge?.remote?.getConnectionInfo) return Promise.resolve(null);

    const maintenant = Date.now();
    if (connexionRetenue && maintenant - connexionRetenue.quand < DUREE_DE_LA_CONNEXION_MS) {
        return Promise.resolve(connexionRetenue.valeur);
    }
    if (demandeEnCours) return demandeEnCours;

    demandeEnCours = demanderLaConnexion().finally(() => { demandeEnCours = null; });
    return demandeEnCours;
}

async function demanderLaConnexion(): Promise<ConnectionInfo | null> {
    /* Regardé une seconde fois : la garde vit chez l'appelant, et l'attente qui
       sépare les deux laisse au pont le temps de disparaître. */
    const demander = window.appBridge?.remote?.getConnectionInfo;
    if (!demander) return null;
    try {
        const conn = await demander();
        /* On retient aussi les réponses négatives : sans ça, une machine sans
           réseau local paierait l'aller-retour à chaque média, pour rien. */
        const retenir = (valeur: ConnectionInfo | null) => {
            connexionRetenue = { valeur, quand: Date.now() };
            return valeur;
        };
        if (!conn?.ip || !conn.port) return retenir(null);
        syncMediaEpoch(conn);
        if (conn.ip === '127.0.0.1' || conn.ip === 'localhost') return retenir(null);
        return retenir(conn);
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
        // Avant de consulter le cache : si le poste MJ a vidé son dossier
        // temporaire depuis, les URL mémorisées pointent vers du vide. C'est
        // exactement le cas qu'un cache consulté trop tôt laisserait passer.
        const conn = await getLanConnection();

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
