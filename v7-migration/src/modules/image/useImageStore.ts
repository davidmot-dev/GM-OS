import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImageMedia, ProjectionTarget, DisplayInfo, ImageFolder, ProjectedEntity } from './types';
import { ImageService } from './logic/ImageService';

interface ImageState {
    mediaList: ImageMedia[];
    folders: ImageFolder[];
    projectedEntity: ProjectedEntity | null;
    projectionTarget: ProjectionTarget;
    projections: Record<string, string | null>; 
    displays: DisplayInfo[];
    activeFolderId: string | null; 
    currentView: 'library' | 'favorites' | 'recent';

    addMedia: (media: Omit<ImageMedia, 'id' | 'active' | 'isFavorite'>) => void;
    removeMedia: (id: string) => void;
    toggleMediaActive: (id: string) => void;
    renameMedia: (id: string, newName: string) => void;
    toggleMediaFavorite: (id: string) => void;
    setProjectionTarget: (target: ProjectionTarget) => void;
    setProjection: (target: string, path: string | null) => void;
    setCurrentView: (view: 'library' | 'favorites' | 'recent') => void;
    fetchDisplays: () => Promise<void>;

    addFolder: (name: string, parentId?: string | null) => void;
    removeFolder: (id: string) => void;
    renameFolder: (id: string, newName: string) => void;
    setActiveFolderId: (id: string | null) => void;
    moveMediaToFolder: (mediaId: string, folderId: string | null) => void;

    projectSolo: (media: ImageMedia) => Promise<void>;
    projectUrl: (url: string) => Promise<void>;
    projectEntity: (entity: ProjectedEntity | null) => Promise<void>;
    
    blackout: () => void;
    blackoutAll: () => void;
    clearActiveProjections: () => void;
    broadcastSync: () => void;
}

export const useImageStore = create<ImageState>()(
    persist(
        (set, get) => ({
            mediaList: [],
            projectionTarget: 'hub',
            projections: {},
            displays: [],
            folders: [],
            activeFolderId: null,
            currentView: 'library',
            projectedEntity: null,

            fetchDisplays: async () => {
                const bridge = (window as any).appBridge;
                if (bridge?.image?.getDisplays) {
                    const displays = await bridge.image.getDisplays();
                    set({ displays });
                }
            },

            addMedia: (mediaData) => {
                const id = Math.random().toString(36).substring(2, 11);
                const newMedia: ImageMedia = { ...mediaData, id, active: true, isFavorite: false, folderId: get().activeFolderId };
                set((state) => ({ mediaList: [...state.mediaList, newMedia] }));
            },

            removeMedia: (id) => {
                set((state) => ({
                    mediaList: state.mediaList.filter(m => m.id !== id),
                    projections: Object.fromEntries(Object.entries(state.projections).map(([t, v]) => [t, v === id ? null : v]))
                }));
            },

            toggleMediaActive: (id) => set((s) => ({ mediaList: s.mediaList.map(m => m.id === id ? { ...m, active: !m.active } : m) })),
            renameMedia: (id, name) => set((s) => ({ mediaList: s.mediaList.map(m => m.id === id ? { ...m, name } : m) })),
            toggleMediaFavorite: (id) => set((s) => ({ mediaList: s.mediaList.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m) })),
            setProjectionTarget: (projectionTarget) => set({ projectionTarget }),
            setProjection: (target, path) => set((state) => ({ 
                projections: { ...state.projections, [target]: path } 
            })),
            setCurrentView: (currentView) => set({ currentView }),
            addFolder: (name, parentId = null) => set((s) => ({ 
                folders: [...s.folders, { id: Math.random().toString(36).substring(2, 11), name, parentId }] 
            })),
            removeFolder: (id) => set((s) => ({
                folders: s.folders.filter(f => f.id !== id),
                mediaList: s.mediaList.map(m => m.folderId === id ? { ...m, folderId: null } : m),
                activeFolderId: s.activeFolderId === id ? null : s.activeFolderId
            })),
            renameFolder: (id, name) => set((s) => ({ folders: s.folders.map(f => f.id === id ? { ...f, name } : f) })),
            setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
            moveMediaToFolder: (mediaId, folderId) => set((s) => ({ mediaList: s.mediaList.map(m => m.id === mediaId ? { ...m, folderId } : m) })),

            projectSolo: async (media) => {
                const target = get().projectionTarget as string;
                await ImageService.projectMedia(media.path, target as any);
            },

            projectUrl: async (url) => {
                const target = get().projectionTarget as string;
                ImageService.projectMedia(url, target as any);
            },

            projectEntity: async (entity) => {
                const target = get().projectionTarget as string;
                set({ projectedEntity: entity });
                ImageService.projectEntity(entity, target as any);
            },

            blackout: () => {
                const target = get().projectionTarget as string;
                ImageService.blackout(target as any);
            },

            blackoutAll: () => {
                const targets = Object.keys(get().projections);
                ImageService.blackoutAll(targets);
            },

            clearActiveProjections: () => {
                set({ projections: {}, projectedEntity: null });
            },

            broadcastSync: () => {
                const { projections } = get();
                const imageChannel = new BroadcastChannel('gmos-image-sync');
                Object.entries(projections).forEach(([target, mediaPath]) => {
                    if (mediaPath) {
                        imageChannel.postMessage({ type: 'image:sync', target, mediaPath });
                    }
                });
                imageChannel.close();
            }
        }),
        {
            name: 'gmos-image-storage',
            partialize: (s) => ({ mediaList: s.mediaList, projectionTarget: s.projectionTarget, folders: s.folders, projections: s.projections })
        }
    )
);
