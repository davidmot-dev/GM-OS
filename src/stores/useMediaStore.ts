import { create } from 'zustand';
import { openDB, type IDBPDatabase } from 'idb';

export type MediaType = 'image' | 'audio' | 'video' | 'document';

export interface MediaItem {
    id: string;
    name: string;
    type: MediaType;
    size: number;
    createdAt: number;
    tags: string[];
    campaignIds: string[];
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
    deleteMedia: (id: string) => Promise<void>;
    updateMediaTags: (id: string, tags: string[]) => Promise<void>;
    renameMedia: (id: string, newName: string) => Promise<void>;
    updateMediaCampaigns: (id: string, campaignIds: string[]) => Promise<void>;
    getMediaBlob: (id: string) => Promise<Blob | undefined>;
    
    // Collections
    addCollection: (name: string) => Promise<void>;
    deleteCollection: (id: string) => Promise<void>;
    renameCollection: (id: string, name: string) => Promise<void>;
    toggleMediaInCollection: (collectionId: string, mediaId: string) => Promise<void>;
}

const DB_NAME = 'gmos-media-db';
const STORE_NAME = 'media';
const COLLECTIONS_STORE = 'collections';
const DB_VERSION = 2; // Incremented for new store

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
                campaignIds: item.campaignIds || []
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

            let type: MediaType = 'image';
            if (file.type.startsWith('audio/')) type = 'audio';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (
                file.type === 'application/pdf' ||
                file.type === 'application/msword' ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/vnd.oasis.opendocument.text' ||
                file.type === 'text/plain' ||
                file.type === 'application/rtf' ||
                file.name.match(/\.(pdf|doc|docx|odt|txt|rtf|md)$/i)
            ) type = 'document';

            const item = {
                id,
                name: file.name,
                type,
                size: file.size,
                blob: file, // Store the File object directly as Blob
                createdAt: Date.now(),
                tags,
                campaignIds
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
                campaignIds: item.campaignIds
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

    getMediaBlob: async (id: string) => {
        try {
            console.log(`[MediaStore] getMediaBlob called for ID: ${id}`);
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const item = await store.get(id);
            if (!item) {
                console.warn(`[MediaStore] Item not found in DB: ${id}`);
                return undefined;
            }
            if (!item.blob) {
                console.warn(`[MediaStore] Item found but has no Blob: ${id}`);
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
    }
}));
