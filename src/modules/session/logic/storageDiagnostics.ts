/**
 * Mesure de l'occupation de localStorage.
 *
 * Le store de session sérialise toute la base de campagne sous une seule clé.
 * Le quota par origine n'est pas dégradable : tant qu'on est dessous tout va
 * bien, et au dépassement `setItem` lève et la sauvegarde échoue — en pleine
 * partie, sans signal visible. Mesurer permet de transformer cette falaise en
 * avertissement.
 */

/** Clé sous laquelle le store de session est persisté. */
export const SESSION_STORAGE_KEY = 'gmos-v5-session-os-storage';

/**
 * Seuil d'alerte, volontairement prudent.
 *
 * Le quota réel dépend de la version de Chromium embarquée (5 Mio dans la
 * spécification, davantage sur certaines builds). On avertit à 4 Mio pour
 * laisser de la marge quelle que soit la build.
 */
export const STORAGE_WARNING_BYTES = 4 * 1024 * 1024;

export interface StorageEntry {
    key: string;
    bytes: number;
}

export interface StorageUsage {
    totalBytes: number;
    /** Occupation de la seule clé du store de session. */
    sessionBytes: number;
    /** Toutes les clés, de la plus lourde à la plus légère. */
    entries: StorageEntry[];
    /** true si l'on dépasse le seuil d'alerte. */
    isNearQuota: boolean;
}

/**
 * Taille occupée par une paire clé/valeur.
 *
 * localStorage stocke en UTF-16 et le quota compte la clé autant que la valeur,
 * d'où les deux octets par unité de code.
 */
export function measureEntryBytes(key: string, value: string): number {
    return (key.length + value.length) * 2;
}

export function measureLocalStorageUsage(storage: Storage = window.localStorage): StorageUsage {
    const entries: StorageEntry[] = [];
    let totalBytes = 0;
    let sessionBytes = 0;

    for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key === null) continue;

        const value = storage.getItem(key) ?? '';
        const bytes = measureEntryBytes(key, value);

        entries.push({ key, bytes });
        totalBytes += bytes;
        if (key === SESSION_STORAGE_KEY) sessionBytes = bytes;
    }

    entries.sort((a, b) => b.bytes - a.bytes);

    return {
        totalBytes,
        sessionBytes,
        entries,
        isNearQuota: totalBytes >= STORAGE_WARNING_BYTES,
    };
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

/**
 * Journalise l'occupation au démarrage, et alerte si l'on approche du quota.
 * Retourne la mesure pour que l'appelant puisse la réutiliser.
 */
export function reportStorageUsage(storage: Storage = window.localStorage): StorageUsage | null {
    try {
        const usage = measureLocalStorageUsage(storage);
        const top = usage.entries.slice(0, 5)
            .map(e => `${e.key} ${formatBytes(e.bytes)}`)
            .join(' | ');

        console.log(
            `[Storage] Total ${formatBytes(usage.totalBytes)} — session ${formatBytes(usage.sessionBytes)} — top: ${top}`
        );

        if (usage.isNearQuota) {
            console.warn(
                `[Storage] ⚠️ ${formatBytes(usage.totalBytes)} occupés : on approche du quota de localStorage. ` +
                `Au dépassement, les sauvegardes échoueront silencieusement.`
            );
        }

        return usage;
    } catch (err) {
        console.warn('[Storage] Mesure impossible:', err);
        return null;
    }
}
