/**
 * Reprise des médias enregistrés en base64 dans les données de campagne.
 *
 * Certains champs — image d'un lieu, avatar d'un PNJ, portrait de personnage —
 * contiennent l'image elle-même, encodée en `data:`, au lieu d'un renvoi vers
 * la médiathèque. Le champ pèse alors plusieurs centaines de kilo-octets, il
 * est relu et réécrit à chaque sauvegarde, et recopié dans chaque diffusion
 * vers les tablettes.
 *
 * Cette migration range l'image dans la médiathèque et remplace le champ par
 * son identifiant. **Aucune autre donnée n'est touchée** : ni les noms, ni les
 * descriptions, ni la structure. Un champ texte par média, rien d'autre.
 *
 * Le remplacement n'a lieu qu'après relecture vérifiée du média enregistré :
 * une image qu'on ne saurait pas relire est laissée en base64, intacte.
 */

/** Emplacement d'un média inline dans l'état. */
export interface InlinedEntry {
    /** Libellé lisible, pour le rapport présenté au MJ. */
    label: string;
    /** Famille de champ, pour regrouper le rapport. */
    field: string;
    dataUrl: string;
    /** Poids du champ tel qu'il est stocké, en octets. */
    bytes: number;
    /** Nom proposé pour l'entrée de médiathèque. */
    name: string;
    /** Écrit l'identifiant obtenu à la place du base64. */
    apply: (mediaId: string) => void;
}

export interface MigrationReport {
    migrated: number;
    skipped: number;
    failed: number;
    /** Octets retirés des données de campagne. */
    freedBytes: number;
    errors: string[];
}

const MIME_EXTENSIONS: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
};

export function isInlinedMedia(value: unknown): value is string {
    return typeof value === 'string' && value.startsWith('data:');
}

/**
 * Décode une URL `data:` en Blob.
 *
 * Décodage manuel plutôt que `fetch()` : le résultat est ainsi vérifiable hors
 * navigateur, et une chaîne tronquée lève au lieu de produire un blob vide.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
    const comma = dataUrl.indexOf(',');
    if (comma === -1) throw new Error('URL de données sans séparateur');

    const header = dataUrl.slice(5, comma);
    const payload = dataUrl.slice(comma + 1);
    const isBase64 = header.endsWith(';base64');
    const mime = (isBase64 ? header.slice(0, -';base64'.length) : header) || 'application/octet-stream';

    if (!isBase64) {
        return new Blob([decodeURIComponent(payload)], { type: mime });
    }

    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

/** Nom de fichier lisible, dérivé du sujet auquel le média appartient. */
export function suggestFileName(label: string, dataUrl: string): string {
    const mime = dataUrl.slice(5, dataUrl.indexOf(';') === -1 ? dataUrl.indexOf(',') : dataUrl.indexOf(';'));
    const extension = MIME_EXTENSIONS[mime] || 'bin';
    const base = label
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
        .slice(0, 60) || 'media';
    return `${base}.${extension}`;
}

/** Forme minimale des tranches d'état parcourues, pour rester testable. */
export interface ScannableState {
    campaigns?: any[];
    atlasMaps?: any[];
    entities?: any[];
    players?: any[];
    clues?: any[];
}

export interface ScannableFavorites {
    favorites?: any[];
}

/**
 * Relève tous les médias inline. Les `apply` écrivent dans les objets fournis :
 * appeler cette fonction sur une copie permet de préparer la migration sans
 * modifier l'état vivant.
 */
export function scanInlinedMedia(state: ScannableState, favorites: ScannableFavorites = {}): InlinedEntry[] {
    const entries: InlinedEntry[] = [];

    const consider = (
        host: Record<string, any> | undefined | null,
        key: string,
        field: string,
        label: string
    ) => {
        if (!host) return;
        const value = host[key];
        if (!isInlinedMedia(value)) return;
        entries.push({
            label,
            field,
            dataUrl: value,
            bytes: value.length,
            name: suggestFileName(label, value),
            apply: (mediaId: string) => { host[key] = mediaId; },
        });
    };

    for (const campaign of state.campaigns || []) {
        consider(campaign, 'wallpaperUrl', 'Ambiance de campagne', `ambiance ${campaign?.name || campaign?.id || ''}`);
    }
    for (const map of state.atlasMaps || []) {
        consider(map, 'fileUrl', 'Lieu', `lieu ${map?.name || map?.id || ''}`);
    }
    for (const entity of state.entities || []) {
        consider(entity, 'avatar', 'PNJ', `pnj ${entity?.name || entity?.id || ''}`);
    }
    for (const clue of state.clues || []) {
        consider(clue, 'mediaUrl', 'Indice', `indice ${clue?.title || clue?.name || clue?.id || ''}`);
    }
    for (const player of state.players || []) {
        consider(player, 'avatarUrl', 'Joueur', `joueur ${player?.name || player?.id || ''}`);
        for (const character of player?.characters || []) {
            consider(character, 'portraitUrl', 'Personnage', `personnage ${character?.name || character?.id || ''}`);
        }
    }
    for (const favorite of favorites.favorites || []) {
        consider(favorite, 'imageUrl', 'Favori', `favori ${favorite?.name || favorite?.id || ''}`);
        consider(favorite, 'tokenUrl', 'Jeton de favori', `jeton ${favorite?.name || favorite?.id || ''}`);
    }

    return entries;
}

export interface ScanSummary {
    count: number;
    totalBytes: number;
    /** Poids par famille de champ, du plus lourd au plus léger. */
    byField: { field: string; count: number; bytes: number }[];
}

export function summarize(entries: InlinedEntry[]): ScanSummary {
    const byField = new Map<string, { count: number; bytes: number }>();
    let totalBytes = 0;

    for (const entry of entries) {
        totalBytes += entry.bytes;
        const acc = byField.get(entry.field) || { count: 0, bytes: 0 };
        acc.count++;
        acc.bytes += entry.bytes;
        byField.set(entry.field, acc);
    }

    return {
        count: entries.length,
        totalBytes,
        byField: [...byField.entries()]
            .map(([field, v]) => ({ field, ...v }))
            .sort((a, b) => b.bytes - a.bytes),
    };
}

export interface MigrationDeps {
    addMedia: (file: File, tags?: string[], campaignIds?: string[]) => Promise<string>;
    getMediaBlob: (id: string) => Promise<Blob | undefined>;
    onProgress?: (done: number, total: number) => void;
}

/**
 * Enregistre chaque média puis remplace le champ — dans cet ordre, et seulement
 * si la relecture confirme que l'octet est bien en place.
 */
export async function migrateInlinedMedia(
    entries: InlinedEntry[],
    deps: MigrationDeps
): Promise<MigrationReport> {
    const report: MigrationReport = { migrated: 0, skipped: 0, failed: 0, freedBytes: 0, errors: [] };

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        try {
            const blob = dataUrlToBlob(entry.dataUrl);
            if (blob.size === 0) {
                report.skipped++;
                report.errors.push(`${entry.label} : contenu vide, laissé tel quel`);
                continue;
            }

            const file = new File([blob], entry.name, { type: blob.type });
            const mediaId = await deps.addMedia(file, ['migration-base64']);

            // Relecture : sans elle, un échec silencieux d'écriture laisserait
            // un renvoi vers un média absent, donc une image disparue.
            const readBack = await deps.getMediaBlob(mediaId);
            if (!readBack || readBack.size !== blob.size) {
                report.failed++;
                report.errors.push(`${entry.label} : relecture incohérente, base64 conservé`);
                continue;
            }

            entry.apply(mediaId);
            report.migrated++;
            report.freedBytes += entry.bytes;
        } catch (err) {
            report.failed++;
            report.errors.push(`${entry.label} : ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            deps.onProgress?.(i + 1, entries.length);
        }
    }

    return report;
}
