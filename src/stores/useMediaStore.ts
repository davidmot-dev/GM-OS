import { create } from 'zustand';
import { openDB, type IDBPDatabase } from 'idb';
import { typeDuFichier } from './typesDeMedia';

export type MediaType = 'image' | 'audio' | 'video' | 'document';

export interface MediaItem {
    id: string;
    name: string;
    type: MediaType;
    size: number;
    createdAt: number;
    tags: string[];
    campaignIds: string[];
    isPersistent?: boolean;
    /**
     * **Cette vidéo boucle-t-elle ?** Absent = oui — le comportement de tout ce
     * qui a été importé avant ce réglage, et celui qu'on veut pour une
     * ambiance. La règle vit dans `components/media/boucleDeLaVideo.ts`, parce
     * que **deux lecteurs** la posent.
     */
    boucler?: boolean;
}

export interface MediaCollection {
    id: string;
    name: string;
    mediaIds: string[];
}

interface MediaStoreState {
    mediaList: MediaItem[];
    collections: MediaCollection[];
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    initDB: () => Promise<void>;
    clearDB: () => Promise<void>;
    addMedia: (file: File, tags?: string[], campaignIds?: string[]) => Promise<string>;
    /** Remet un média du miroir, sous son identifiant d'origine. Rend `false` s'il existe déjà. */
    restaurerUnMedia: (metadata: MediaItem, blob: Blob) => Promise<boolean>;
    deleteMedia: (id: string) => Promise<void>;
    updateMediaTags: (id: string, tags: string[]) => Promise<void>;
    /**
     * **Écrire plusieurs listes d'étiquettes d'un seul geste.**
     *
     * Employée par l'étiquetage en lot et par le renommage d'une étiquette dans
     * toute la bibliothèque. Elle rend le **nombre de médias touchés** —
     * l'écran le dit, et *un geste qui ne dit pas ce qu'il a fait sur deux cents
     * fichiers ne se vérifie pas.*
     */
    appliquerDesTags: (changements: { id: string; tags: string[] }[]) => Promise<number>;
    renameMedia: (id: string, newName: string) => Promise<void>;
    updateMediaCampaigns: (id: string, campaignIds: string[]) => Promise<void>;
    removeCampaignReference: (campaignId: string) => Promise<void>;
    getMediaBlob: (id: string) => Promise<Blob | undefined>;
    
    // Collections
    addCollection: (name: string) => Promise<void>;
    deleteCollection: (id: string) => Promise<void>;
    renameCollection: (id: string, name: string) => Promise<void>;
    toggleMediaInCollection: (collectionId: string, mediaId: string) => Promise<void>;
    toggleMediaPersistence: (id: string) => Promise<void>;
    /** Fait basculer une vidéo entre « boucle » et « joue une fois ». */
    basculerLaBoucle: (id: string) => Promise<void>;
}

const DB_NAME = 'gmos-media-db';
const STORE_NAME = 'media';
const COLLECTIONS_STORE = 'collections';
const DB_VERSION = 5; // Incremented to match existing database on disk (VersionError fix)

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
    if (!dbPromise) {
        console.log('[MediaHub] Opening DB...');
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                console.log('[MediaHub] Upgrading DB...', db.version);
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    console.log('[MediaHub] Created object store', STORE_NAME);
                }
                if (!db.objectStoreNames.contains(COLLECTIONS_STORE)) {
                    db.createObjectStore(COLLECTIONS_STORE, { keyPath: 'id' });
                    console.log('[MediaHub] Created object store', COLLECTIONS_STORE);
                }
            },
            blocked(currentVersion, blockedVersion) {
                console.warn('[MediaHub] DB upgrade blocked!', currentVersion, blockedVersion);
            },
            blocking(currentVersion, blockedVersion) {
                console.warn('[MediaHub] DB blocking upgrade!', currentVersion, blockedVersion);
                dbPromise?.then(db => db.close());
            },
            terminated() {
                console.error('[MediaHub] DB terminated!');
            }
        });
        dbPromise.then(db => {
            console.log('[MediaHub] DB opened successfully:', db.name);
        }).catch(err => {
            console.error('[MediaHub] Failed to open DB in getDB:', err);
            dbPromise = null;
        });
    }
    return dbPromise;
};

export const useMediaStore = create<MediaStoreState>((set, get) => ({
    mediaList: [],
    collections: [],
    isLoading: false,
    isInitialized: false,
    error: null,

    initDB: async () => {
        if (get().isInitialized) return;
        try {
            console.log('[MediaHub] initDB started');
            set({ isLoading: true, error: null });
            const db = await getDB();
            console.log('[MediaHub] initDB: DB acquired, starting transaction');
            const tx = db.transaction([STORE_NAME, COLLECTIONS_STORE], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const collStore = tx.objectStore(COLLECTIONS_STORE);
            
            const [allItems, allCollections] = await Promise.all([
                store.getAll(),
                collStore.getAll()
            ]);
            console.log('[MediaHub] initDB: Retrieved all items, count:', allItems.length);

            // Extract metadata for the list (exclude blobs to save memory)
            const mediaList: MediaItem[] = allItems.map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
                size: item.size,
                createdAt: item.createdAt,
                tags: item.tags || [],
                campaignIds: item.campaignIds || [],
                isPersistent: !!item.isPersistent,
                boucler: item.boucler
            })).sort((a, b) => b.createdAt - a.createdAt); // Newest first

            const collections: MediaCollection[] = allCollections.map(c => ({
                id: c.id,
                name: c.name,
                mediaIds: c.mediaIds || []
            }));
            
            set({ mediaList, collections, isLoading: false, isInitialized: true });
        } catch (err) {
            console.error('Failed to init Media DB:', err);
            set({ error: 'Failed to initialize Media Database.', isLoading: false, isInitialized: true });
        }
    },

    clearDB: async () => {
        try {
            set({ isLoading: true });
            const db = await getDB();
            const tx = db.transaction([STORE_NAME, COLLECTIONS_STORE], 'readwrite');
            await tx.objectStore(STORE_NAME).clear();
            await tx.objectStore(COLLECTIONS_STORE).clear();
            await tx.done;
            set({ mediaList: [], collections: [], isLoading: false });
        } catch (err) {
            console.error('Failed to clear Media DB:', err);
            set({ error: 'Failed to clear Media Database.', isLoading: false });
        }
    },

    addMedia: async (file: File, tags: string[] = [], campaignIds: string[] = []) => {
        try {
            const db = await getDB();
            const id = `m-${crypto.randomUUID()}`;

            /*
              Le classement vit dans `typesDeMedia.ts`, avec le filtre du
              sélecteur de fichiers : les deux se contredisaient, l'un rangeant
              par extension et l'autre demandant `document/*`, qui n'existe pas.
            */
            const type: MediaType = typeDuFichier(file);

            const item = {
                id,
                name: file.name,
                type,
                size: file.size,
                blob: file, // Store the File object directly as Blob
                createdAt: Date.now(),
                tags,
                campaignIds,
                isPersistent: false
            };

            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            await store.put(item);
            await tx.done;

            // Update local state without the blob
            const metadata: MediaItem = {
                id: item.id,
                name: item.name,
                type: item.type,
                size: item.size,
                createdAt: item.createdAt,
                tags: item.tags,
                campaignIds: item.campaignIds,
                isPersistent: item.isPersistent,
                /* Un média neuf ne porte pas le réglage : l'absence vaut boucle,
                   et c'est ce qu'on veut pour une ambiance. */
            };

            set((state) => ({
                mediaList: [metadata, ...state.mediaList]
            }));

            return id;
        } catch (err) {
            console.error('Failed to add media:', err);
            throw new Error('Failed to save media file.');
        }
    },

    /**
     * **Remet un média en base SOUS SON IDENTIFIANT D'ORIGINE.**
     *
     * `addMedia` en fabrique un neuf (`m-${crypto.randomUUID()}`), ce qui est
     * juste pour un ajout et **ruineux pour une restauration** : une carte de
     * l'atlas porte `"fileUrl": "m-<uuid>"`, et remettre les octets sous un autre
     * identifiant rendrait des images présentes et des cartes toujours mortes.
     * *Le pire des résultats : le disque est plein et rien ne s'affiche.*
     *
     * **Ne remplace jamais un média existant.** Le vivant est plus récent que la
     * copie ; écraser reviendrait à faire du filet un mécanisme de perte. Rend
     * `false` quand l'identifiant est déjà pris.
     */
    restaurerUnMedia: async (metadata: MediaItem, blob: Blob) => {
        const db = await getDB();
        const existant = await db.get(STORE_NAME, metadata.id);
        if (existant) return false;

        await db.put(STORE_NAME, { ...metadata, blob });
        set((state) => ({ mediaList: [metadata, ...state.mediaList] }));
        return true;
    },

    deleteMedia: async (id: string) => {
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            await store.delete(id);
            await tx.done;

            set((state) => ({
                mediaList: state.mediaList.filter(m => m.id !== id)
            }));
        } catch (err) {
            console.error('Failed to delete media:', err);
            throw new Error('Failed to delete media file.');
        }
    },
    
    updateMediaTags: async (id: string, tags: string[]) => {
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            const item = await store.get(id);
            if (!item) throw new Error('Media not found');
            
            item.tags = tags;
            await store.put(item);
            await tx.done;
            
            set((state) => ({
                mediaList: state.mediaList.map(m => 
                    m.id === id ? { ...m, tags } : m
                )
            }));
        } catch (err) {
            console.error('Failed to update media tags:', err);
            throw new Error('Failed to update tags.');
        }
    },

    /*
      ⚠️ **Une seule transaction, et un seul `set`.** Écrire deux cents médias
      un par un, c'est deux cents transactions IndexedDB et deux cents rendus de
      la grille — la même leçon que l'import multiple du Media Hub, où trente
      écritures lancées ensemble étaient déjà la course qu'on a payée.

      ⛔ **Un échec sur un média n'arrête pas les autres**, et le compte rendu
      porte sur ce qui a réellement été écrit : *un geste de masse qui s'arrête
      au milieu sans le dire laisse une bibliothèque à moitié renommée, ce qui
      est pire que pas de renommage du tout.*
    */
    appliquerDesTags: async (changements) => {
        if (changements.length === 0) return 0;

        const ecrits: { id: string; tags: string[] }[] = [];
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            for (const changement of changements) {
                const item = await store.get(changement.id);
                if (!item) continue;
                item.tags = changement.tags;
                await store.put(item);
                ecrits.push(changement);
            }
            await tx.done;
        } catch (err) {
            console.error('[Media] Écriture des étiquettes interrompue :', err);
        }

        if (ecrits.length > 0) {
            const parId = new Map(ecrits.map(c => [c.id, c.tags]));
            set((state) => ({
                mediaList: state.mediaList.map(
                    m => (parId.has(m.id) ? { ...m, tags: parId.get(m.id)! } : m),
                ),
            }));
        }
        return ecrits.length;
    },

    renameMedia: async (id: string, newName: string) => {
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            const item = await store.get(id);
            if (!item) throw new Error('Media not found');
            
            item.name = newName;
            await store.put(item);
            await tx.done;
            
            set((state) => ({
                mediaList: state.mediaList.map(m => 
                    m.id === id ? { ...m, name: newName } : m
                )
            }));
        } catch (err) {
            console.error('Failed to rename media:', err);
            throw new Error('Failed to rename media.');
        }
    },

    updateMediaCampaigns: async (id: string, campaignIds: string[]) => {
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            const item = await store.get(id);
            if (!item) throw new Error('Media not found');
            
            item.campaignIds = campaignIds;
            await store.put(item);
            await tx.done;
            
            set((state) => ({
                mediaList: state.mediaList.map(m => 
                    m.id === id ? { ...m, campaignIds } : m
                )
            }));
        } catch (err) {
            console.error('Failed to update media campaigns:', err);
            throw new Error('Failed to update campaigns.');
        }
    },

    removeCampaignReference: async (campaignId: string) => {
        try {
            console.log(`[MediaStore] removeCampaignReference for: ${campaignId}`);
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            const allItems = await store.getAll();
            let updatedCount = 0;

            for (const item of allItems) {
                if (item.campaignIds?.includes(campaignId)) {
                    item.campaignIds = item.campaignIds.filter((id: string) => id !== campaignId);
                    await store.put(item);
                    updatedCount++;
                }
            }
            
            await tx.done;
            console.log(`[MediaStore] Cleanup complete. ${updatedCount} media items updated.`);

            if (updatedCount > 0) {
                set((state) => ({
                    mediaList: state.mediaList.map(m => ({
                        ...m,
                        campaignIds: m.campaignIds.filter(id => id !== campaignId)
                    }))
                }));
            }
        } catch (err) {
            console.error('Failed to remove campaign reference in MediaStore:', err);
        }
    },

    getMediaBlob: async (id: string) => {
        try {
            console.log(`[MediaStore] getMediaBlob called for ID: ${id}`);
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const item = await store.get(id);
            if (!item) {
                return undefined;
            }
            if (!item.blob) {
                return undefined;
            }
            console.log(`[MediaStore] Blob successfully retrieved for ID: ${id} (${item.blob.size} bytes)`);
            return item.blob as Blob | undefined;
        } catch (err) {
            console.error(`[MediaStore] Error getting media blob for ID: ${id}:`, err);
            return undefined;
        }
    },

    addCollection: async (name: string) => {
        try {
            const id = `coll-${crypto.randomUUID()}`;
            const newColl: MediaCollection = { id, name, mediaIds: [] };
            
            const db = await getDB();
            const tx = db.transaction(COLLECTIONS_STORE, 'readwrite');
            await tx.objectStore(COLLECTIONS_STORE).put(newColl);
            await tx.done;
            
            set(state => ({ collections: [...state.collections, newColl] }));
        } catch (err) {
            console.error('Failed to add collection:', err);
        }
    },

    deleteCollection: async (id: string) => {
        try {
            const db = await getDB();
            const tx = db.transaction(COLLECTIONS_STORE, 'readwrite');
            await tx.objectStore(COLLECTIONS_STORE).delete(id);
            await tx.done;
            
            set(state => ({ collections: state.collections.filter(c => c.id !== id) }));
        } catch (err) {
            console.error('Failed to delete collection:', err);
        }
    },

    renameCollection: async (id: string, name: string) => {
        try {
            const db = await getDB();
            const tx = db.transaction(COLLECTIONS_STORE, 'readwrite');
            const store = tx.objectStore(COLLECTIONS_STORE);
            const coll = await store.get(id);
            if (!coll) return;
            
            coll.name = name;
            await store.put(coll);
            await tx.done;
            
            set(state => ({
                collections: state.collections.map(c => c.id === id ? { ...c, name } : c)
            }));
        } catch (err) {
            console.error('Failed to rename collection:', err);
        }
    },

    toggleMediaInCollection: async (collectionId: string, mediaId: string) => {
        try {
            const db = await getDB();
            const tx = db.transaction(COLLECTIONS_STORE, 'readwrite');
            const store = tx.objectStore(COLLECTIONS_STORE);
            const coll = await store.get(collectionId);
            if (!coll) return;
            
            const mediaIds = coll.mediaIds || [];
            const nextMediaIds = mediaIds.includes(mediaId)
                ? mediaIds.filter((id: string) => id !== mediaId)
                : [...mediaIds, mediaId];
            
            coll.mediaIds = nextMediaIds;
            await store.put(coll);
            await tx.done;
            
            set(state => ({
                collections: state.collections.map(c => 
                    c.id === collectionId ? { ...c, mediaIds: nextMediaIds } : c
                )
            }));
        } catch (err) {
            console.error('Failed to toggle media in collection:', err);
        }
    },
    
    /*
      ⭐ **Le réglage vit sur le MÉDIA, pas sur la pastille.** Une même vidéo se
      déclenche depuis Image-OS, depuis un moment de storyboard et depuis une
      tablette : *un réglage posé sur un seul de ces chemins serait un réglage
      qu'on croit avoir posé.*
    */
    basculerLaBoucle: async (id: string) => {
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            const item = await store.get(id);
            if (!item) throw new Error('Media not found');

            /* L'absence vaut boucle : le premier clic arrête donc la boucle. */
            item.boucler = item.boucler === false;
            await store.put(item);
            await tx.done;

            set((state) => ({
                mediaList: state.mediaList.map(
                    m => (m.id === id ? { ...m, boucler: item.boucler } : m),
                ),
            }));
        } catch (err) {
            console.error('[Media] Bascule de la boucle impossible :', err);
        }
    },

    toggleMediaPersistence: async (id: string) => {
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            const item = await store.get(id);
            if (!item) throw new Error('Media not found');
            
            item.isPersistent = !item.isPersistent;
            await store.put(item);
            await tx.done;
            
            set((state) => ({
                mediaList: state.mediaList.map(m => 
                    m.id === id ? { ...m, isPersistent: item.isPersistent } : m
                )
            }));
        } catch (err) {
            console.error('Failed to toggle media persistence:', err);
            throw new Error('Failed to update persistence.');
        }
    }
}));
