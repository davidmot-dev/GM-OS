import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImageMedia, ProjectionTarget, DisplayInfo, ImageFolder, ProjectedEntity } from './types';
import { useJournalStore } from '../journal/useJournalStore';
import { gmToast } from '../../stores/useToastStore';

// AppBridge is now defined globally in src/types/window.d.ts

/**
 * Représente l'état global du Image-OS.
 * Gère les médias, les dossiers, les projections et les diaporamas.
 */
interface ImageState {
    /** Liste plate de tous les médias chargés */
    mediaList: ImageMedia[];
    /** Arborescence des dossiers de médias */
    folders: ImageFolder[];
    /** Média projeté sur le Player Hub */
    projectedEntity: ProjectedEntity | null;
    /** Cible actuelle de projection (hub, moniteur externe) */
    projectionTarget: ProjectionTarget;
    /** État des projections par cible (id cible -> id média ou URL) */
    projections: Record<string, string | null>; 
    /** URLs prêtes à être projetées par cible (id cible -> URL HTTP/Data) */
    projectedUrls: Record<string, string | null>; 
    /** Liste des moniteurs physiques détectés */
    displays: DisplayInfo[];
    /** ID du dossier actif dans la bibliothèque */
    activeFolderId: string | null; 
    /** Mode de vue de la bibliothèque */
    currentView: 'library' | 'favorites' | 'recent';

    /** Ajoute un média à la bibliothèque */
    addMedia: (media: Omit<ImageMedia, 'id' | 'active' | 'isFavorite'>) => void;
    /** Supprime un média */
    removeMedia: (id: string) => void;
    /** Active/Désactive un média pour le diaporama */
    toggleMediaActive: (id: string) => void;
    /** Renomme un média */
    renameMedia: (id: string, newName: string) => void;
    /** Ajoute/Retire des favoris */
    toggleMediaFavorite: (id: string) => void;
    /** Définit la cible de projection par défaut */
    setProjectionTarget: (target: ProjectionTarget) => void;
    /** Change la vue active de la bibliothèque */
    setCurrentView: (view: 'library' | 'favorites' | 'recent') => void;
    /** Rafraîchit la liste des moniteurs externes */
    fetchDisplays: () => Promise<void>;

    // Folder actions
    /** Crée un nouveau dossier */
    addFolder: (name: string, parentId?: string | null) => void;
    /** Supprime un dossier et remet ses médias à la racine */
    removeFolder: (id: string) => void;
    /** Renomme un dossier */
    renameFolder: (id: string, newName: string) => void;
    /** Change le dossier actif pour l'affichage */
    setActiveFolderId: (id: string | null) => void;
    /** Déplace un média dans un dossier */
    moveMediaToFolder: (mediaId: string, folderId: string | null) => void;

    /** Projette un média spécifique de la bibliothèque */
    projectSolo: (media: ImageMedia) => void;
    /** Projette une URL (ex: base64 ou lien externe) */
    projectUrl: (url: string) => void;
    /** Projette une entité narrative (PNJ, Lieu) avec ses statistiques et son portrait */
    projectEntity: (entity: ProjectedEntity | null) => Promise<void>;
    /** Déclenche la suite du diaporama (Médias actifs uniquement) */
    projectSequence: () => void;
    /** Coupe la projection sur la cible actuelle */
    blackout: () => void;
    /** Coupe toutes les projections actives */
    blackoutAll: () => void;

    /** Navigue manuellement dans la séquence : -1 (précédent), 1 (suivant) */
    navigateSequence: (direction: -1 | 1) => void;


    /** Supprime tous les médias de la bibliothèque */
    clearAll: () => void;
    /** Applique un instantané de l'état pour la persistance */
    applySnapshot: (snapshot: {
        projections?: Record<string, string | null>;
        mediaList?: ImageMedia[];
        folders?: ImageFolder[];
    }) => void;
    /** Réinitialise tout l'état du Image-OS */
    reset: () => void;
}

export const useImageStore = create<ImageState>()(
    persist(
        (set, get) => ({
            mediaList: [
                { id: '1', name: 'Cursed_Forest_Level3.png', path: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhgj3d6Yg6g_DkXT1uDozfQUUl3hRf11nwnQJvP2_JJsOa7mPboxCz4SrUHYiZ7hw4gkKdWLHXwHl_OG8aUIMVHNua_AIQhrJdrpZNkeC0P2VuZjCYr1wHsSviQ4N8Dx6_aR9lMkzXXZxOAduqI2p4w0HHf3uVh1AP75rMCm8B4vkjb3IddTAnZm659VNUo_TFscYgUT9z6AwcUmLS_rhwx_n2Qdwc7NMoBoz3QoU2G1lwU97uCCl9Zhb6ho8_vHpB_Z06-sr_Fzo', active: true, sizeInfo: '1920x1080 • 2.4MB', isFavorite: true },
                { id: '2', name: 'Dragon_Lair_Entry.jpg', path: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgJngtipLoo7E9XnHlZz5SolJmWmfe3CYiKLzk-S9glx06jl67wkTU1_Ak2x6WlXPf7_VKWk5T-1tAVj7czB6wNJRBOS5iu8zWkh4zPDh4gwBmuEfC91WJQavR94cPfuoH9csDGnIHDjEvQW9WyEhPT0gDuHdY7A4EmnMzJ1xr1W30Acmjgauv9OKiKxKvgH_mJedF7icD_C5otY1_IH9_C9j256aRzig3Hha_JLufJ4TFOdgkuZModqw7QZSUocj_-MsdxNG7bpg', active: false, sizeInfo: '3840x2160 • 5.1MB', isFavorite: false },
                { id: '3', name: 'Old_Oak_Tavern.webp', path: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNaUC_Lv1RSfOXSXEZngmS6LYz68V-vJSp4bBjoTEUPpCMj-lxpLzL_qTY0_FGeLw0ZA63_91RdCSGukQIdLBsEjr4wzMmjUw-aW2dPA_Qcldt14UNHsqn9MYKAWR0a0QJ9wSFcWzX8b81zFG_As2eY-zpJO4eilw6AUuCjAQkhFNbCK4mGk08YCy8p4B8j4NntByGkfYMjahN60jm_VnFnDFKOsa3azr-n-93b_c04IjQHiwVX-TDcrmpgLHdl5VwY35VP9DHE_Q', active: true, sizeInfo: '1920x1080 • 0.8MB', isFavorite: false },
            ],
            projectionTarget: 'hub',
            projections: {},
            projectedUrls: {},
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

                    const state = get();
                    if (state.projectionTarget !== 'hub' && !displays.find(d => d.id === (state.projectionTarget as string))) {
                        set({ projectionTarget: 'hub' });
                    }
                }
            },

            addMedia: (mediaData) => {
                const state = get();
                const newMedia: ImageMedia = {
                    ...mediaData,
                    id: crypto.randomUUID(),
                    active: true,
                    isFavorite: false,
                    folderId: state.activeFolderId
                };
                set((state) => ({ mediaList: [...state.mediaList, newMedia] }));
            },

            removeMedia: (id) => {
                set((state) => {
                    const newMediaList = state.mediaList.filter(m => m.id !== id);
                    const newProjections = { ...state.projections };
                    const newProjectedUrls = { ...state.projectedUrls };

                    Object.keys(newProjections).forEach(target => {
                        if (newProjections[target] === id) {
                            newProjections[target] = null;
                            newProjectedUrls[target] = null;
                        }
                    });

                    return { mediaList: newMediaList, projections: newProjections, projectedUrls: newProjectedUrls };
                });
            },

            toggleMediaActive: (id) => {
                set((state) => ({
                    mediaList: state.mediaList.map(m => m.id === id ? { ...m, active: !m.active } : m)
                }));
            },

            renameMedia: (id, newName) => {
                set((state) => ({
                    mediaList: state.mediaList.map(m => m.id === id ? { ...m, name: newName } : m)
                }));
            },

            toggleMediaFavorite: (id) => {
                set((state) => ({
                    mediaList: state.mediaList.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m)
                }));
            },

            setProjectionTarget: (target) => set({ projectionTarget: target }),

            setCurrentView: (view) => set({ currentView: view }),

            addFolder: (name, parentId = null) => {
                const newFolder: ImageFolder = {
                    id: crypto.randomUUID(),
                    name,
                    parentId
                };
                set((state) => ({ folders: [...state.folders, newFolder] }));
            },

            removeFolder: (id) => {
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
                const target = get().projectionTarget as string;

                set((state) => ({
                    projections: { ...state.projections, [target]: media.id }
                }));

                useJournalStore.getState().addEvent({
                    type: 'SYSTEM',
                    title: 'Image projetée',
                    content: `Média "${media.name}" projeté sur : ${target === 'hub' ? 'Player Hub' : 'Écran externe'}`
                });

                // Always resolve m-xxx IDs to sendable URLs for any target
                import('../../utils/mediaResolver').then(({ resolveToSendableUrl }) => {
                    resolveToSendableUrl(media.path).then(resolvedPath => {
                        const finalPath = resolvedPath || media.path;
                        
                        set(s => ({ projectedUrls: { ...s.projectedUrls, [target]: finalPath } }));

                        if (target === 'hub') {
                            window.appBridge?.image?.syncHubData('image', finalPath);
                        } else {
                            window.appBridge?.image?.launchDisplay([finalPath], target);
                        }
                    });
                });
            },

            projectUrl: (url) => {
                const state = get();
                const target = state.projectionTarget as string;
                const currentProjection = state.projections[target];

                if (currentProjection === url) {
                    get().blackout();
                    return;
                }

                set((state) => ({
                    projections: { ...state.projections, [target]: url }
                }));

                useJournalStore.getState().addEvent({
                    type: 'SYSTEM',
                    title: 'URL projetée',
                    content: `Source "${url}" projetée sur : ${target === 'hub' ? 'Player Hub' : 'Écran externe'}`
                });

                // Always resolve m-xxx IDs to sendable URLs for any target
                import('../../utils/mediaResolver').then(({ resolveToSendableUrl }) => {
                    resolveToSendableUrl(url).then(resolvedUrl => {
                        const finalUrl = resolvedUrl || url;

                        set(s => ({ projectedUrls: { ...s.projectedUrls, [target]: finalUrl } }));

                        if (target === 'hub') {
                            window.appBridge?.image?.syncHubData('image', finalUrl);
                        } else {
                            window.appBridge?.image?.launchDisplay([finalUrl], target);
                        }
                    });
                });
            },

            projectEntity: async (entity) => {
                const state = get();
                const target = state.projectionTarget as string;
                
                if (state.projectedEntity?.id === entity?.id && entity !== null) {
                    set({ projectedEntity: null });
                    window.appBridge?.image?.syncHubData('entity', '');
                    
                    if (target === 'hub') {
                        set((state) => ({ projections: { ...state.projections, hub: null } }));
                        window.appBridge?.image?.syncHubData('image', '');
                    } else if (state.projections[target] === (entity.avatar || entity.imageUrl || entity.portraitUrl)) {
                        set((state) => ({ projections: { ...state.projections, [target]: null } }));
                        window.appBridge?.image?.launchDisplay([], target);
                    }
                    
                    gmToast(`Retrait de ${entity.name} du Player Hub.`);
                    return;
                }

                if (!entity) {
                    set({ projectedEntity: null });
                    // 🔌 Envoyer le signal de clear aux Hubs connectés (IPC + WebSocket)
                    window.appBridge?.image?.syncHubData('entity', '');
                    window.appBridge?.image?.syncHubData('image', '');
                    return;
                }

                set({ projectedEntity: entity });

                useJournalStore.getState().addEvent({
                    type: 'NPC',
                    title: 'Entité projetée',
                    content: `Fiche de "${entity.name}" (${entity.subtitle || 'Entité'}) envoyée au Player Hub.`
                });

                const { resolveToSendableUrl } = await import('../../utils/mediaResolver');

                const avatarSrc = entity.avatar || entity.imageUrl || entity.portraitUrl || '';
                const resolvedAvatar = await resolveToSendableUrl(avatarSrc);

                const entityToSend = resolvedAvatar !== avatarSrc 
                    ? { ...entity, avatar: resolvedAvatar, imageUrl: resolvedAvatar, portraitUrl: resolvedAvatar }
                    : entity;

                window.appBridge?.image?.syncHubData('entity', JSON.stringify(entityToSend));
                
                if (resolvedAvatar) {
                    window.appBridge?.image?.syncHubData('image', resolvedAvatar);
                    set((state) => ({ 
                        projections: { ...state.projections, hub: resolvedAvatar },
                        projectedUrls: { ...state.projectedUrls, hub: resolvedAvatar } 
                    }));
                } else if (avatarSrc && !avatarSrc.startsWith('m-')) {
                    window.appBridge?.image?.syncHubData('image', avatarSrc);
                    set((state) => ({ 
                        projections: { ...state.projections, hub: avatarSrc },
                        projectedUrls: { ...state.projectedUrls, hub: avatarSrc }
                    }));
                }
            },

            projectSequence: () => {
                const state = get();
                const activeMedia = state.mediaList.filter(m => m.active);
                if (activeMedia.length === 0) return;

                const currentTargetId = state.projections[state.projectionTarget as string];

                let targetMedia = activeMedia[0];
                if (currentTargetId) {
                    const currentIndex = state.mediaList.findIndex(m => m.id === currentTargetId || m.path === currentTargetId);
                    const nextActive = state.mediaList.find((m, i) => i > currentIndex && m.active);
                    if (nextActive) {
                        targetMedia = nextActive;
                    }
                }

                get().projectSolo(targetMedia);
            },

            navigateSequence: (direction) => {
                const state = get();
                const activeMedia = state.mediaList.filter(m => m.active);
                if (activeMedia.length === 0) return;

                const currentTargetId = state.projections[state.projectionTarget as string];

                if (!currentTargetId) {
                    get().projectSolo(activeMedia[0]);
                    return;
                }

                const mediaListIds = state.mediaList.map(m => m.id);
                activeMedia.sort((a, b) => mediaListIds.indexOf(a.id) - mediaListIds.indexOf(b.id));

                const activeIdx = activeMedia.findIndex(m => m.id === currentTargetId);

                if (activeIdx === -1) {
                    get().projectSolo(activeMedia[0]);
                    return;
                }

                let nextIdx = activeIdx + direction;
                if (nextIdx >= activeMedia.length) nextIdx = 0; 
                if (nextIdx < 0) nextIdx = activeMedia.length - 1; 

                get().projectSolo(activeMedia[nextIdx]);
            },

            blackout: () => {
                const target = get().projectionTarget as string;

                set((state) => ({
                    projections: { ...state.projections, [target]: null },
                    projectedUrls: { ...state.projectedUrls, [target]: null },
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

                set({ projections: {}, projectedUrls: {}, projectedEntity: null });

                window.appBridge?.image?.syncHubData('image', '');
                window.appBridge?.image?.syncHubData('entity', '');

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

                if (snapshot.mediaList) {
                    set({ mediaList: snapshot.mediaList });
                }
                if (snapshot.folders) {
                    set({ folders: snapshot.folders });
                }

                if (snapshot.projections) {
                    set({ projections: snapshot.projections });
                    
                    Object.entries(snapshot.projections).forEach(([target, mediaId]) => {
                        if (mediaId) {
                            const media = get().mediaList.find(m => m.id === mediaId);
                            if (media) {
                                // Sync back to URLs during snapshot restore
                                import('../../utils/mediaResolver').then(({ resolveToSendableUrl }) => {
                                    resolveToSendableUrl(media.path).then(finalPath => {
                                        set(s => ({ projectedUrls: { ...s.projectedUrls, [target]: finalPath || media.path }}));
                                        if (target === 'hub') {
                                            window.appBridge?.image?.syncHubData('image', finalPath || media.path);
                                        } else {
                                            window.appBridge?.image?.launchDisplay([finalPath || media.path], target);
                                        }
                                    });
                                });
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
                    projectedUrls: {},
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
                projections: state.projections,
                projectedUrls: state.projectedUrls
            }),
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                // Clean up stale projection references: any media ID that no longer
                // exists in the library (e.g. from a deleted campaign) is cleared.
                const existingIds = new Set(state.mediaList.map(m => m.id));
                const cleanedProjections: Record<string, string | null> = {};
                const cleanedProjectedUrls: Record<string, string | null> = { ...state.projectedUrls };
                let hadStale = false;
                for (const [target, value] of Object.entries(state.projections)) {
                    // Keep null, HTTP URLs, data URIs, and media IDs that exist in the library
                    const isStaleMediaId = value && value.startsWith('m-') && !existingIds.has(value);
                    if (isStaleMediaId) {
                        console.warn(`[ImageStore] Stale projection cleared on target "${target}" (ID: ${value})`);
                        cleanedProjections[target] = null;
                        cleanedProjectedUrls[target] = null;
                        hadStale = true;
                    } else {
                        cleanedProjections[target] = value;
                    }
                }
                if (hadStale) {
                    state.projections = cleanedProjections;
                    state.projectedUrls = cleanedProjectedUrls;
                }
            }
        }
    )
);

if (typeof window !== 'undefined') {
    (window as unknown as { useImageStore: typeof useImageStore }).useImageStore = useImageStore;
}
