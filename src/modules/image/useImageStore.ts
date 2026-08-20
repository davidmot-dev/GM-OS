import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImageMedia, ProjectionTarget, DisplayInfo, ImageFolder, ProjectedEntity } from './types';
// L'import direct fermerait un cycle ; on passe donc par le global. **Mais on
// le type** : c'est un `(window as any)` qui a laissé partir un événement sans
// titre et avec un champ `severity` qui n'existe pas, sans que rien ne le dise.
import type { JournalEvent } from '../journal/types';

const journal = () =>
    (window as unknown as {
        useJournalStore?: {
            getState: () => { addEvent: (e: Omit<JournalEvent, 'id' | 'timestamp'>) => void };
        };
    }).useJournalStore?.getState();
import { gmToast } from '../../stores/useToastStore';
import i18n from '../../i18n';
// import { ImageService } from './logic/ImageService'; // Broken by circular dependency

/**
 * Représente l'état global du Image-OS.
 */
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

    /** Projette un média (Optimistic) */
    projectSolo: (media: ImageMedia) => Promise<void>;
    /** Projette une URL (Optimistic) */
    projectUrl: (url: string) => Promise<void>;
    /** Projette une entité (Optimistic) */
    projectEntity: (entity: ProjectedEntity | null) => Promise<void>;
    
    projectSequence: () => void;
    blackout: () => void;
    blackoutAll: () => void;
    blackoutAllHub: () => void;
    navigateSequence: (direction: -1 | 1) => void;
    clearAll: () => void;
    applySnapshot: (snapshot: {
        projections?: Record<string, string | null>;
        mediaList?: ImageMedia[];
        folders?: ImageFolder[];
    }) => void;
    reset: () => void;
    clearActiveProjections: () => void;
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
                const bridge = window.appBridge;
                if (bridge?.image?.getDisplays) {
                    const displays = await bridge.image.getDisplays();
                    set({ displays });
                    if (get().projectionTarget !== 'hub' && !displays.find(d => d.id === get().projectionTarget)) {
                        set({ projectionTarget: 'hub' });
                    }
                }

                // 📡 Réponse au signal AUTO-SYNC des projecteurs
                if (bridge?.on) {
                    bridge.on('image:sync-hub-data', (_event: unknown, type: string, targetId: string) => {
                        if (type === 'projector-ready') {
                            const currentMediaPath = get().projections[targetId];
                            if (currentMediaPath) {
                                console.log(`[useImageStore] Auto-Syncing projector ${targetId} with ${currentMediaPath}`);
                                // On cherche par chemin (path) car currentMediaPath contient m-127..., pas l'UUID
                                const media = get().mediaList.find(m => m.path === currentMediaPath);
                                if (media) {
                                    import('./logic/ImageService').then(({ ImageService }) => {
                                        ImageService.projectMedia(media.path, targetId as any);
                                    });
                                }
                            }
                        }
                    });
                }
            },

            addMedia: (mediaData) => {
                const newMedia: ImageMedia = { ...mediaData, id: crypto.randomUUID(), active: true, isFavorite: false, folderId: get().activeFolderId };
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
            addFolder: (name, parentId = null) => set((s) => ({ folders: [...s.folders, { id: crypto.randomUUID(), name, parentId }] })),
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
                
                // 🔌 Appel Service (arrière-plan)
                // Le service ImageService se charge de :
                // 1. Envoyer les ordres IPC
                // 2. Mettre à jour le store global via setProjection(target, path)
                console.log(`[useImageStore] Proj. ${media.path} -> ${target}`);
                const { ImageService } = await import('./logic/ImageService');
                const success = await ImageService.projectMedia(media.path, target as any);
                
                if (success) {
                    /*
                      **Il n'avait pas de titre, et il parlait français en dur.**
                      `title` est pourtant obligatoire sur un `JournalEvent` : le
                      `(window as any)` éteignait la vérification, et le fil
                      affichait une ligne vide. `severity: 'info'` n'existe sur
                      aucun événement et n'était lu par personne.

                      Les deux messages employés ici **existaient déjà, traduits
                      dans les deux langues** — `image.events.imageProjected` —
                      et n'étaient appelés de nulle part. *Une branche prête à
                      recevoir une donnée que personne ne lui passe ne se
                      distingue pas d'une branche morte.*
                    */
                    journal()?.addEvent({
                        type: 'SYSTEM',
                        title: i18n.t('modules:image.events.imageProjected.title'),
                        content: i18n.t('modules:image.events.imageProjected.content', {
                            name: media.name, target,
                        }),
                    });
                } else {
                    gmToast(i18n.t('modules:image.notifications.projectionFailed'));
                }
            },

            projectUrl: async (url) => {
                const target = get().projectionTarget as string;
                if (get().projections[target] === url) {
                    get().blackout();
                    return;
                }

                set((state) => ({ projections: { ...state.projections, [target]: url } }));
                import('./logic/ImageService').then(({ ImageService }) => {
                    ImageService.projectMedia(url, target as any).then(() => {
                        /*
                          **Projeter une URL ne laissait aucune trace**, alors
                          que projeter un fichier en laissait une : le même geste
                          du meneur, consigné une fois sur deux selon la
                          provenance du média. `image.events.urlProjected`
                          attendait ici depuis toujours, traduit et jamais appelé.
                        */
                        journal()?.addEvent({
                            type: 'SYSTEM',
                            title: i18n.t('modules:image.events.urlProjected.title'),
                            content: i18n.t('modules:image.events.urlProjected.content', { url, target }),
                        });
                    }).catch(() => {
                        set((state) => ({ projections: { ...state.projections, [target]: null } }));
                    });
                });
            },

            projectEntity: async (entity) => {
                const target = get().projectionTarget as string;
                if (get().projectedEntity?.id === entity?.id && entity !== null) {
                    get().blackout();
                    return;
                }

                // Optimiste : On pose l'entité
                set({ projectedEntity: entity });
                if (entity) {
                    set((s) => ({ projections: { ...s.projections, [target]: entity.id } }));
                }

                import('./logic/ImageService').then(({ ImageService }) => {
                    ImageService.projectEntity(entity as any, target as any).then((avatar: any) => {
                        if (!avatar && entity !== null) {
                            get().blackout();
                            gmToast(i18n.t('modules:image.notifications.projectionFailed'));
                        } else if (entity) {
                            journal()?.addEvent({
                                type: 'NPC',
                                title: i18n.t('modules:image.events.entityProjected.title'),
                                content: i18n.t('modules:image.events.entityProjected.content', { name: entity.name, subtitle: entity.subtitle || '...' })
                            });
                        }
                    });
                });
            },

            projectSequence: () => {
                const activeMedia = get().mediaList.filter(m => m.active);
                if (activeMedia.length === 0) return;
                const currentId = get().projections[get().projectionTarget as string];
                let targetMedia = activeMedia[0];
                if (currentId) {
                    const idx = get().mediaList.findIndex(m => m.id === currentId);
                    const next = get().mediaList.find((m, i) => i > idx && m.active);
                    if (next) targetMedia = next;
                }
                get().projectSolo(targetMedia);
            },

            navigateSequence: (direction) => {
                const activeMedia = get().mediaList.filter(m => m.active);
                if (activeMedia.length === 0) return;
                const currentId = get().projections[get().projectionTarget as string];
                if (!currentId) { get().projectSolo(activeMedia[0]); return; }
                const mediaIds = get().mediaList.map(m => m.id);
                activeMedia.sort((a, b) => mediaIds.indexOf(a.id) - mediaIds.indexOf(b.id));
                const idx = activeMedia.findIndex(m => m.id === currentId);
                let nextIdx = (idx + direction + activeMedia.length) % activeMedia.length;
                get().projectSolo(activeMedia[nextIdx]);
            },

            blackout: () => {
                const target = get().projectionTarget as string;
                set((s) => ({ projections: { ...s.projections, [target]: null }, projectedEntity: target === 'hub' ? null : s.projectedEntity }));
                import('./logic/ImageService').then(({ ImageService }) => {
                    ImageService.blackout(target as any);
                });
            },

            blackoutAll: () => {
                const targets = Object.keys(get().projections);
                set({ projections: {}, projectedEntity: null });
                import('./logic/ImageService').then(({ ImageService }) => {
                    ImageService.blackoutAll(targets);
                });
            },

            blackoutAllHub: () => {
                set({ projectedEntity: null });
                import('./logic/ImageService').then(({ ImageService }) => {
                    ImageService.blackout('hub');
                });
            },

            clearAll: () => { if (confirm(i18n.t('modules:image.dashboard.resetConfirm'))) set({ mediaList: [] }); },

            applySnapshot: (snapshot) => {
                if (!snapshot) return;
                if (snapshot.mediaList) set({ mediaList: snapshot.mediaList });
                if (snapshot.folders) set({ folders: snapshot.folders });
                if (snapshot.projections) {
                    set({ projections: snapshot.projections });
                    Object.entries(snapshot.projections).forEach(([target, id]) => {
                        if (id) {
                            const media = get().mediaList.find(m => m.id === id);
                            if (media) {
                                import('./logic/ImageService').then(({ ImageService }) => {
                                    ImageService.projectMedia(media.path, target as any);
                                });
                            }
                        }
                    });
                }
            },

            reset: () => { get().blackoutAll(); set({ mediaList: [], projections: {}, folders: [], activeFolderId: null, projectedEntity: null }); },
            clearActiveProjections: () => {
                set({ projections: {}, projectedEntity: null });
            }
        }),
        {
            name: 'gmos-image-storage',
            partialize: (s) => ({ mediaList: s.mediaList, projectionTarget: s.projectionTarget, folders: s.folders, projections: s.projections }),
            onRehydrateStorage: () => (s) => {
                if (!s) return;
                // On vérifie dorénavant par "path" (m-127...) car les projections stockent les chemins
                const validPaths = new Set(s.mediaList.map(m => m.path));
                const cleaned = Object.fromEntries(
                    Object.entries(s.projections).map(([t, v]) => [
                        t, 
                        (v && v.startsWith('m-') && !validPaths.has(v)) ? null : v
                    ])
                );
                s.projections = cleaned;
            }
        }
    )
);

if (typeof window !== 'undefined') { (window as any).useImageStore = useImageStore; }
