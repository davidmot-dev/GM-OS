import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImageMedia, ProjectionTarget, DisplayInfo, ImageFolder, ProjectedEntity } from './types';

// AppBridge is now defined globally in src/types/window.d.ts

interface ImageState {
    mediaList: ImageMedia[];
    projectionTarget: ProjectionTarget;
    projections: Record<string, string | null>; // Key: targetId (hub or displayId), Value: mediaId
    displays: DisplayInfo[];
    folders: ImageFolder[];
    activeFolderId: string | null; // null means 'All Media' or 'Root'
    currentView: 'library' | 'favorites' | 'recent';
    projectedEntity: ProjectedEntity | null; // Complex entity (NPC/PC) for Hub windowed display

    addMedia: (media: Omit<ImageMedia, 'id' | 'active' | 'isFavorite'>) => void;
    removeMedia: (id: string) => void;
    toggleMediaActive: (id: string) => void;
    toggleMediaFavorite: (id: string) => void;
    setProjectionTarget: (target: ProjectionTarget) => void;
    setCurrentView: (view: 'library' | 'favorites' | 'recent') => void;
    fetchDisplays: () => Promise<void>;

    // Folder actions
    addFolder: (name: string, parentId?: string | null) => void;
    removeFolder: (id: string) => void;
    renameFolder: (id: string, newName: string) => void;
    setActiveFolderId: (id: string | null) => void;
    moveMediaToFolder: (mediaId: string, folderId: string | null) => void;

    projectSolo: (media: ImageMedia) => void;
    projectUrl: (url: string) => void;
    projectEntity: (entity: ProjectedEntity) => void;
    projectSequence: () => void;
    blackout: () => void;
    blackoutAll: () => void;

    navigateSequence: (direction: -1 | 1) => void;

    clearAll: () => void;
    applySnapshot: (snapshot: {
        projections?: Record<string, string | null>;
        mediaList?: ImageMedia[];
        folders?: ImageFolder[];
    }) => void;
    reset: () => void;
}

export const useImageStore = create<ImageState>()(
    persist(
        (set, get) => ({
            mediaList: [
                // Some dummy data reflecting the design for testing
                { id: '1', name: 'Cursed_Forest_Level3.png', path: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhgj3d6Yg6g_DkXT1uDozfQUUl3hRf11nwnQJvP2_JJsOa7mPboxCz4SrUHYiZ7hw4gkKdWLHXwHl_OG8aUIMVHNua_AIQhrJdrpZNkeC0P2VuZjCYr1wHsSviQ4N8Dx6_aR9lMkzXXZxOAduqI2p4w0HHf3uVh1AP75rMCm8B4vkjb3IddTAnZm659VNUo_TFscYgUT9z6AwcUmLS_rhwx_n2Qdwc7NMoBoz3QoU2G1lwU97uCCl9Zhb6ho8_vHpB_Z06-sr_Fzo', active: true, sizeInfo: '1920x1080 • 2.4MB', isFavorite: true },
                { id: '2', name: 'Dragon_Lair_Entry.jpg', path: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgJngtipLoo7E9XnHlZz5SolJmWmfe3CYiKLzk-S9glx06jl67wkTU1_Ak2x6WlXPf7_VKWk5T-1tAVj7czB6wNJRBOS5iu8zWkh4zPDh4gwBmuEfC91WJQavR94cPfuoH9csDGnIHDjEvQW9WyEhPT0gDuHdY7A4EmnMzJ1xr1W30Acmjgauv9OKiKxKvgH_mJedF7icD_C5otY1_IH9_C9j256aRzig3Hha_JLufJ4TFOdgkuZModqw7QZSUocj_-MsdxNG7bpg', active: false, sizeInfo: '3840x2160 • 5.1MB', isFavorite: false },
                { id: '3', name: 'Old_Oak_Tavern.webp', path: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNaUC_Lv1RSfOXSXEZngmS6LYz68V-vJSp4bBjoTEUPpCMj-lxpLzL_qTY0_FGeLw0ZA63_91RdCSGukQIdLBsEjr4wzMmjUw-aW2dPA_Qcldt14UNHsqn9MYKAWR0a0QJ9wSFcWzX8b81zFG_As2eY-zpJO4eilw6AUuCjAQkhFNbCK4mGk08YCy8p4B8j4NntByGkfYMjahN60jm_VnFnDFKOsa3azr-n-93b_c04IjQHiwVX-TDcrmpgLHdl5VwY35VP9DHE_Q', active: true, sizeInfo: '1920x1080 • 0.8MB', isFavorite: false },
            ],
            projectionTarget: 'hub',
            projections: {},
            displays: [],
            folders: [
                { id: 'f1', name: 'Backgrounds' },
                { id: 'f2', name: 'NPC Portraits' },
                { id: 'f3', name: 'Battlemaps' }
            ],
            activeFolderId: null,
            currentView: 'library',
            projectedEntity: null,

            fetchDisplays: async () => {
                if (window.appBridge?.image?.getDisplays) {
                    const displays = await window.appBridge.image.getDisplays();
                    set({ displays });

                    // If target is invalid, fallback to hub
                    const state = get();
                    if (state.projectionTarget !== 'hub' && !displays.find(d => d.id === state.projectionTarget)) {
                        set({ projectionTarget: 'hub' });
                    }
                }
            },

            addMedia: (mediaData) => {
                const state = get();
                const newMedia: ImageMedia = {
                    ...mediaData,
                    id: crypto.randomUUID(),
                    active: true, // Default to true when added
                    isFavorite: false,
                    folderId: state.activeFolderId // Assign to current folder if any
                };
                set((state) => ({ mediaList: [...state.mediaList, newMedia] }));
            },

            removeMedia: (id) => {
                set((state) => {
                    const newMediaList = state.mediaList.filter(m => m.id !== id);
                    const newProjections = { ...state.projections };

                    // Clear any target that was showing this media
                    Object.keys(newProjections).forEach(target => {
                        if (newProjections[target] === id) {
                            newProjections[target] = null;
                        }
                    });

                    return { mediaList: newMediaList, projections: newProjections };
                });
            },

            toggleMediaActive: (id) => {
                set((state) => ({
                    mediaList: state.mediaList.map(m => m.id === id ? { ...m, active: !m.active } : m)
                }));
            },

            toggleMediaFavorite: (id) => {
                set((state) => ({
                    mediaList: state.mediaList.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m)
                }));
            },

            setProjectionTarget: (target) => set({ projectionTarget: target }),

            setCurrentView: (view) => set({ currentView: view }),

            // --- Folder Actions ---
            addFolder: (name, parentId = null) => {
                const newFolder: ImageFolder = {
                    id: crypto.randomUUID(),
                    name,
                    parentId
                };
                set((state) => ({ folders: [...state.folders, newFolder] }));
            },

            removeFolder: (id) => {
                // Remove folder and move its media to root
                set((state) => ({
                    folders: state.folders.filter(f => f.id !== id),
                    mediaList: state.mediaList.map(m => m.folderId === id ? { ...m, folderId: null } : m),
                    activeFolderId: state.activeFolderId === id ? null : state.activeFolderId
                }));
            },

            renameFolder: (id, newName) => {
                set((state) => ({
                    folders: state.folders.map(f => f.id === id ? { ...f, name: newName } : f)
                }));
            },

            setActiveFolderId: (id) => set({ activeFolderId: id }),

            moveMediaToFolder: (mediaId, folderId) => {
                set((state) => ({
                    mediaList: state.mediaList.map(m => m.id === mediaId ? { ...m, folderId } : m)
                }));
            },

            projectSolo: (media) => {
                const target = get().projectionTarget;

                set((state) => ({
                    projections: { ...state.projections, [target]: media.id }
                }));

                if (target === 'hub') {
                    window.appBridge?.image?.syncHubData('image', media.path);
                } else {
                    window.appBridge?.image?.launchDisplay([media.path], target);
                }
            },

            projectUrl: (url) => {
                const state = get();
                const target = state.projectionTarget;
                const currentProjection = state.projections[target];

                // Toggle logic: if already projecting this URL, blackout instead
                if (currentProjection === url) {
                    get().blackout();
                    return;
                }

                set((state) => ({
                    projections: { ...state.projections, [target]: url }
                }));

                if (target === 'hub') {
                    window.appBridge?.image?.syncHubData('image', url);
                } else {
                    window.appBridge?.image?.launchDisplay([url], target);
                }
            },

            projectEntity: (entity) => {
                const state = get();
                const target = state.projectionTarget;
                
                // Toggle logic: if already projecting THIS entity, blackout
                if (state.projectedEntity?.id === entity.id) {
                    get().blackout();
                    return;
                }

                set({ projectedEntity: entity });

                if (target === 'hub') {
                    // Send to Player Hub
                    window.appBridge?.image?.syncHubData('entity', JSON.stringify(entity));
                } else {
                    // Physical displays still just get the image
                    const avatar = entity.avatar || entity.imageUrl || entity.portraitUrl || '';
                    window.appBridge?.image?.launchDisplay([avatar], target);
                }
            },

            projectSequence: () => {
                const state = get();
                const activeMedia = state.mediaList.filter(m => m.active);
                if (activeMedia.length === 0) return;

                const currentTargetId = state.projections[state.projectionTarget];

                // Start from the first active one, or if there's already one projected, find the next one
                let targetMedia = activeMedia[0];
                if (currentTargetId) {
                    const currentIndex = state.mediaList.findIndex(m => m.id === currentTargetId);
                    // Find first active one AFTER current index
                    const nextActive = state.mediaList.find((m, i) => i > currentIndex && m.active);
                    if (nextActive) {
                        targetMedia = nextActive;
                    }
                    // else it loops back to first active
                }

                get().projectSolo(targetMedia);
            },

            navigateSequence: (direction) => {
                const state = get();
                const activeMedia = state.mediaList.filter(m => m.active);
                if (activeMedia.length === 0) return;

                const currentTargetId = state.projections[state.projectionTarget];

                if (!currentTargetId) {
                    get().projectSolo(activeMedia[0]);
                    return;
                }

                // Sort out the active media list order respecting original array order
                const mediaListIds = state.mediaList.map(m => m.id);
                activeMedia.sort((a, b) => mediaListIds.indexOf(a.id) - mediaListIds.indexOf(b.id));

                const activeIdx = activeMedia.findIndex(m => m.id === currentTargetId);

                if (activeIdx === -1) {
                    // The currently playing item might have been unchecked during play. Just start over
                    get().projectSolo(activeMedia[0]);
                    return;
                }

                let nextIdx = activeIdx + direction;
                if (nextIdx >= activeMedia.length) nextIdx = 0; // wrap to start
                if (nextIdx < 0) nextIdx = activeMedia.length - 1; // wrap to end

                get().projectSolo(activeMedia[nextIdx]);
            },

            blackout: () => {
                const target = get().projectionTarget;

                set((state) => ({
                    projections: { ...state.projections, [target]: null },
                    projectedEntity: target === 'hub' ? null : state.projectedEntity
                }));

                if (target === 'hub') {
                    window.appBridge?.image?.syncHubData('image', '');
                    window.appBridge?.image?.syncHubData('entity', '');
                } else {
                    window.appBridge?.image?.launchDisplay([], target);
                }
            },

            blackoutAll: () => {
                const state = get();
                const allTargets = Object.keys(state.projections);

                set({ projections: {} });

                // Sync Hub
                window.appBridge?.image?.syncHubData('image', '');

                // Sync all other physical displays
                allTargets.forEach(target => {
                    if (target !== 'hub') {
                        window.appBridge?.image?.launchDisplay([], target);
                    }
                });
            },

            clearAll: () => {
                if (confirm('Êtes-vous sûr de vouloir supprimer toutes les images ?')) {
                    set({ mediaList: [] });
                }
            },

            applySnapshot: (snapshot) => {
                if (!snapshot) return;

                // 1. Restore structures (media library and folders)
                if (snapshot.mediaList) {
                    set({ mediaList: snapshot.mediaList });
                }
                if (snapshot.folders) {
                    set({ folders: snapshot.folders });
                }

                // 2. Restore projections
                if (snapshot.projections) {
                    set({ projections: snapshot.projections });
                    
                    // Trigger actual projection logic in the bridges
                    Object.entries(snapshot.projections).forEach(([target, mediaId]) => {
                        if (mediaId) {
                            // Find in the RESTORED mediaList
                            const media = get().mediaList.find(m => m.id === mediaId);
                            if (media) {
                                if (target === 'hub') {
                                    window.appBridge?.image?.syncHubData('image', media.path);
                                } else {
                                    window.appBridge?.image?.launchDisplay([media.path], target);
                                }
                            }
                        }
                    });
                }
            },

            reset: () => {
                get().blackoutAll();
                set({
                    mediaList: [],
                    projections: {},
                    folders: [],
                    activeFolderId: null,
                    projectedEntity: null
                });
            }
        }),
        {
            name: 'gmos-image-storage',
            partialize: (state) => ({
                mediaList: state.mediaList,
                projectionTarget: state.projectionTarget,
                folders: state.folders,
                projections: state.projections
            })
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as { useImageStore: typeof useImageStore }).useImageStore = useImageStore;
}
