import { openDB, type IDBPDatabase } from 'idb';
import type { StateStorage } from 'zustand/middleware';

/**
 * Stockage IndexedDB pour la persistance Zustand.
 *
 * localStorage plafonne autour de 5 Mo par origine, écrit de façon synchrone
 * (donc bloque le thread d'interface) et échoue brutalement au dépassement.
 * IndexedDB n'a aucune de ces trois limites.
 *
 * En revanche il ne propose pas d'équivalent à l'événement `storage`, sur
 * lequel reposait la synchronisation entre fenêtres. Ce module émet donc
 * lui-même une notification sur un BroadcastChannel à chaque écriture réelle.
 */

const DB_NAME = 'gmos-state-db';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';
const CHANNEL_NAME = 'gmos-persisted-state';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });
    }
    return dbPromise;
}

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
    if (typeof BroadcastChannel === 'undefined') return null;
    if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
    return channel;
}

/**
 * Dernière valeur vue pour chaque clé, en lecture comme en écriture.
 *
 * Sert à reproduire une propriété de localStorage dont dépendait la
 * synchronisation : un `setItem` qui réécrit la valeur identique ne déclenchait
 * pas d'événement `storage`. Sans cette garde, une fenêtre qui se réhydrate
 * réécrirait aussitôt la même valeur, notifierait les autres, et le cycle
 * repartirait sans fin.
 */
const lastSeen = new Map<string, string>();

/** Abonne un rappel aux écritures faites par les *autres* fenêtres. */
export function onPersistedStateChanged(key: string, callback: () => void): () => void {
    const ch = getChannel();
    if (!ch) return () => { /* pas de BroadcastChannel disponible */ };

    const listener = (event: MessageEvent) => {
        if (event.data?.key === key) callback();
    };

    ch.addEventListener('message', listener);
    return () => ch.removeEventListener('message', listener);
}

/**
 * Reprend une valeur laissée dans localStorage par la version précédente.
 * La copie n'est retirée de localStorage qu'après relecture vérifiée depuis
 * IndexedDB — perdre une base de campagne pour libérer du quota serait un
 * échange perdant.
 */
async function migrateFromLocalStorage(name: string): Promise<string | null> {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    let legacy: string | null = null;
    try {
        legacy = window.localStorage.getItem(name);
    } catch {
        return null;
    }
    if (legacy === null) return null;

    console.log(`[IdbStorage] Reprise de "${name}" depuis localStorage (${legacy.length} caractères)`);

    try {
        const db = await getDB();
        await db.put(STORE_NAME, legacy, name);

        const readBack = await db.get(STORE_NAME, name);
        if (readBack !== legacy) {
            console.error(`[IdbStorage] Relecture divergente pour "${name}" : localStorage est conservé.`);
            return legacy;
        }

        window.localStorage.removeItem(name);
        console.log(`[IdbStorage] "${name}" migré vers IndexedDB, quota localStorage libéré.`);
    } catch (err) {
        console.error(`[IdbStorage] Migration de "${name}" impossible, localStorage conservé:`, err);
    }

    return legacy;
}

export const idbStateStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            const db = await getDB();
            const value = await db.get(STORE_NAME, name);

            if (value === undefined) {
                const migrated = await migrateFromLocalStorage(name);
                if (migrated !== null) lastSeen.set(name, migrated);
                return migrated;
            }

            // On mémorise ce qui vient d'être lu : la réécriture identique qui
            // suit une réhydratation ne doit pas renotifier les autres fenêtres.
            lastSeen.set(name, value as string);
            return value as string;
        } catch (err) {
            /*
              **On remonte l'échec au lieu de l'avaler.**

              Rendre `null` disait « cette clé n'existe pas » — exactement ce que
              répond un premier démarrage. L'appelant ne pouvait donc pas
              distinguer *une base vide* d'*une base illisible*, et dans le second
              cas il repartait sur les mocks, qu'il persistait ensuite par-dessus
              la vraie base. **Une lecture ratée qui se fait passer pour une base
              vide est un effacement à retardement.**

              La clé absente, elle, continue de rendre `null` : c'est un fait, pas
              une erreur. Qui décide quoi faire de l'échec, c'est
              `PersistenceService` — il referme l'écriture.
            */
            console.error(`[IdbStorage] Lecture de "${name}" impossible:`, err);
            throw err;
        }
    },

    setItem: async (name: string, value: string): Promise<void> => {
        if (lastSeen.get(name) === value) return; // rien n'a changé

        try {
            const db = await getDB();
            await db.put(STORE_NAME, value, name);
            lastSeen.set(name, value);
            getChannel()?.postMessage({ key: name });
        } catch (err) {
            console.error(`[IdbStorage] Écriture de "${name}" impossible:`, err);
        }
    },

    removeItem: async (name: string): Promise<void> => {
        try {
            const db = await getDB();
            await db.delete(STORE_NAME, name);
            lastSeen.delete(name);
            getChannel()?.postMessage({ key: name });
        } catch (err) {
            console.error(`[IdbStorage] Suppression de "${name}" impossible:`, err);
        }
    },
};

/** Réservé aux tests : remet à zéro l'état de module. */
export function __resetIdbStorageForTests() {
    dbPromise = null;
    channel = null;
    lastSeen.clear();
}
