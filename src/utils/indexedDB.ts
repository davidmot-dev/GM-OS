/**
 * Service de stockage IndexedDB pour les données lourdes (Fog of War, etc.)
 */
class IndexedDBService {
    private dbName = 'gmos-fog-data';
    private storeName = 'fog-blobs';
    private version = 1;
    private db: IDBDatabase | null = null;
    private memoryFallback = new Map<string, string>();
    private isSupported = typeof indexedDB !== 'undefined';

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            if (!this.isSupported) {
                return reject(new Error('IndexedDB is not supported/defined in this environment.'));
            }
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Enregistre une donnée (DataURL ou Blob) pour une clé donnée (ex: mapUrl)
     */
    public async setItem(key: string, value: string): Promise<void> {
        if (!this.isSupported) {
            this.memoryFallback.set(key, value);
            return;
        }
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.put(value, key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.warn('[IndexedDB] Fallback to memory due to error:', err);
            this.memoryFallback.set(key, value);
        }
    }

    /**
     * Récupère une donnée pour une clé donnée
     */
    public async getItem(key: string): Promise<string | null> {
        if (!this.isSupported) {
            return this.memoryFallback.get(key) || null;
        }
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.warn('[IndexedDB] Fallback to memory due to error:', err);
            return this.memoryFallback.get(key) || null;
        }
    }

    /**
     * Supprime une donnée
     */
    public async removeItem(key: string): Promise<void> {
        if (!this.isSupported) {
            this.memoryFallback.delete(key);
            return;
        }
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.warn('[IndexedDB] Fallback to memory due to error:', err);
            this.memoryFallback.delete(key);
        }
    }

    /**
     * **Tout le brouillard, clé par clé — pour le miroir de sauvegarde.**
     *
     * `gmos-fog-data` était la troisième base que personne ne sauvegardait.
     * Ajoutée au miroir le 2026-08-29, à la demande de David : le brouillard
     * peint carte par carte est du travail de préparation, et il se perdait avec
     * le reste sur un profil neuf.
     *
     * Rend un objet vide plutôt que de lever — l'appelant est la sauvegarde
     * automatique, et *rien ne doit pouvoir l'empêcher d'écrire l'état de
     * session*, qui est la partie irremplaçable.
     */
    public async exporterTout(): Promise<Record<string, string>> {
        if (!this.isSupported) return Object.fromEntries(this.memoryFallback);
        try {
            const db = await this.getDB();
            return await new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readonly');
                const store = transaction.objectStore(this.storeName);
                const cles = store.getAllKeys();
                const valeurs = store.getAll();
                transaction.oncomplete = () => {
                    const sortie: Record<string, string> = {};
                    (cles.result ?? []).forEach((cle, i) => {
                        sortie[String(cle)] = valeurs.result?.[i];
                    });
                    resolve(sortie);
                };
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (err) {
            console.warn('[IndexedDB] Export du brouillard impossible :', err);
            return {};
        }
    }
}

export const fogDB = new IndexedDBService();
