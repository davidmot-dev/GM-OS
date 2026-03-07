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
}

interface MediaStoreState {
    mediaList: MediaItem[];
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    initDB: () => Promise<void>;
    clearDB: () => Promise<void>;
    addMedia: (file: File) => Promise<string>;
    deleteMedia: (id: string) => Promise<void>;
    updateMediaTags: (id: string, tags: string[]) => Promise<void>;
    getMediaBlob: (id: string) => Promise<Blob | undefined>;
}

const DB_NAME = 'gmos-media-db';
const STORE_NAME = 'media';
const DB_VERSION = 1;

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
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const allItems = await store.getAll();
            console.log('[MediaHub] initDB: Retrieved all items, count:', allItems.length);

            // Extract metadata for the list (exclude blobs to save memory)
            const mediaList: MediaItem[] = allItems.map((item) => ({
                id: item.id,
                name: item.name,
                type: item.type,
                size: item.size,
                createdAt: item.createdAt,
                tags: item.tags || []
            })).sort((a, b) => b.createdAt - a.createdAt); // Newest first

            set({ mediaList, isLoading: false, isInitialized: true });
        } catch (err) {
            console.error('Failed to init Media DB:', err);
            set({ error: 'Failed to initialize Media Database.', isLoading: false, isInitialized: true });
        }
    },

    clearDB: async () => {
        try {
            set({ isLoading: true });
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            await tx.objectStore(STORE_NAME).clear();
            await tx.done;
            set({ mediaList: [], isLoading: false });
        } catch (err) {
            console.error('Failed to clear Media DB:', err);
            set({ error: 'Failed to clear Media Database.', isLoading: false });
        }
    },

    addMedia: async (file: File) => {
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
                tags: []
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
                tags: item.tags
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

    getMediaBlob: async (id: string) => {
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const item = await store.get(id);
            return item?.blob as Blob | undefined;
        } catch (err) {
            console.error('Failed to get media blob:', err);
            return undefined;
        }
    }
}));
