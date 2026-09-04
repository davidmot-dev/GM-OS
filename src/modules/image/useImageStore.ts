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
 * **Le portrait d'une entité, cherché dans les trois champs qui le portent.**
 *
 * Ce n'est pas de la tolérance gratuite : les onze appelants de `projectEntity`
 * ne remplissent pas tous le même champ. Dix posent `avatar` (PNJ, PJ, indices
 * de `CluesManager`, cartes des paquets), et `SessionClueDeck` pose `imageUrl`.
 * *Le type les déclare tous les trois depuis toujours ; lire un seul d'entre eux
 * ferait taire un appelant sur onze, en silence.*
 */
export function portraitDeLEntite(entite: ProjectedEntity): string | undefined {
    return entite.avatar || entite.imageUrl || entite.portraitUrl || undefined;
}

/**
 * Représente l'état global du Image-OS.
 */
interface ImageState {
    mediaList: ImageMedia[];
    folders: ImageFolder[];
    projectedEntity: ProjectedEntity | null;
    projectionTarget: ProjectionTarget;
    projections: Record<string, string | null>;
    /**
     * **Le décor, mis de côté pendant qu'une fiche passe devant.**
     *
     * *Demandé par David le 2026-08-31 :* « quand je projette un PNJ et qu'il y
     * avait une image avant, lorsque j'arrête de projeter le PNJ, l'image
     * précédente doit revenir ».
     *
     * **On ne retient qu'une image, jamais une fiche** — décision de David le
     * même jour. Deux fiches montrées coup sur coup ne s'empilent pas : *l'image
     * est le décor de la scène, les fiches passent devant*, et arrêter une fiche
     * ramène toujours le décor. Une pile aurait demandé deux gestes pour revenir
     * à ce qui était affiché depuis le début.
     *
     * Une par cible : le hub et un projecteur ne montrent pas la même chose.
     */
    imagePrecedente: Record<string, string | null>;
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

    /**
     * Projette un média (Optimistic).
     *
     * `cible` **choisit l'écran pour cette projection-là**, sans changer celui
     * qu'Image-OS a sélectionné : c'est ce qui permet à un moment de storyboard
     * de viser un moniteur nommé. Absente, on projette là où le meneur pointe.
     */
    projectSolo: (media: ImageMedia, cible?: string) => Promise<void>;
    /** Projette une URL (Optimistic) */
    projectUrl: (url: string) => Promise<void>;
    /**
     * Projette une entité (Optimistic).
     *
     * `forcer` **rejoue la projection au lieu de la basculer**, quand l'entité
     * affichée est celle qu'on repasse. C'est ce dont a besoin qui *modifie* une
     * fiche déjà à l'écran : sans lui, enregistrer un changement l'efface.
     */
    projectEntity: (entity: ProjectedEntity | null, options?: { forcer?: boolean }) => Promise<void>;
    /**
     * Termine la projection d'une fiche : **le décor revient**, ou le noir s'il
     * n'y en avait pas. C'est ce que fait la bascule du bouton, et c'est ce qui
     * distingue « j'ai fini avec cette fiche » de « je veux du noir ».
     */
    terminerLaFiche: () => Promise<void>;

    projectSequence: () => void;
    blackout: () => void;
    blackoutAll: () => void;
    blackoutAllHub: () => void;
    navigateSequence: (direction: -1 | 1) => void;
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
            imagePrecedente: {},
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

            projectSolo: async (media, cible) => {
                const target = (cible || get().projectionTarget) as string;
                
                // 🔌 Appel Service (arrière-plan)
                // Le service ImageService se charge de :
                // 1. Envoyer les ordres IPC
                // 2. Mettre à jour le store global via setProjection(target, path)
                console.log(`[useImageStore] Proj. ${media.path} -> ${target}`);
                const { ImageService } = await import('./logic/ImageService');
                const success = await ImageService.projectMedia(media.path, target as any);
                
                if (success) {
                    /*
                      **Une image choisie à la main devient le nouveau décor.** La
                      fiche ne tient plus la cible — la laisser « projetée » ferait
                      mentir les écrans qui la surlignent — et le décor mis de côté
                      n'a plus de sens : celui qui vient d'être choisi le remplace.
                    */
                    set((s) => ({
                        projectedEntity: null,
                        imagePrecedente: { ...s.imagePrecedente, [target]: null },
                    }));

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

                // Même règle que pour un média de la bibliothèque : l'URL posée à
                // la main devient le décor, et remplace celui qu'on gardait.
                set((state) => ({
                    projections: { ...state.projections, [target]: url },
                    imagePrecedente: { ...state.imagePrecedente, [target]: null },
                    projectedEntity: null,
                }));
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

            projectEntity: async (entity, options) => {
                const target = get().projectionTarget as string;
                /*
                  Rappuyer sur la fiche affichée, ou passer `null` : dans les deux
                  cas la fiche s'en va, et le décor revient s'il y en avait un.

                  **Sauf quand l'appelant force**, et c'est un vrai geste, pas une
                  échappatoire : `useFavoriteStore` rejoue la projection d'un
                  favori qu'on vient de **modifier**, pour que le nouveau portrait
                  parte à l'écran. Le même identifiant y signifie « la même fiche,
                  en mieux » et non « on a fini avec elle » — sans cette
                  distinction, enregistrer une retouche coupait la projection.
                */
                if (entity === null || (!options?.forcer && get().projectedEntity?.id === entity.id)) {
                    await get().terminerLaFiche();
                    return;
                }

                /*
                  ⛔ **Le défaut trouvé par David en pleine partie, le 2026-08-31 :**
                  *« lorsque je veux projeter l'image d'un PNJ, rien n'apparaît sur
                  le Player Hub »*.

                  On passait ici **l'entité entière et la cible** à une fonction qui
                  attend **un portrait et un nom**. L'objet arrivait là où une chaîne
                  était attendue, le service levait, son `catch` avalait tout : rien
                  ne partait au hub, et rien ne le disait. Depuis le 2026-04-26.

                  *Deux `as any` suffisaient à faire passer la compilation sur deux
                  signatures qui n'avaient rien en commun.* Ils sont retirés — c'est
                  eux, et non la faute de frappe, qui ont coûté quatre mois.
                */
                const portrait = entity ? portraitDeLEntite(entity) : undefined;

                /*
                  **Sans portrait, on le dit — et on ne touche à rien.** Éteindre la
                  projection en cours parce qu'un PNJ n'a pas d'image punirait le
                  meneur pour un geste qui n'a rien cassé, et le message d'échec
                  générique ne lui aurait pas appris ce qui manque.
                */
                if (entity && !portrait) {
                    gmToast(i18n.t('modules:image.notifications.noPortrait', { name: entity.name }), 'warning');
                    return;
                }

                /*
                  **Le décor est mis de côté avant que la fiche passe devant.**

                  On ne retient que ce qui n'est pas une fiche : si une fiche
                  occupe déjà la cible, c'est qu'elle est elle-même passée devant
                  le décor, et **c'est ce décor-là qu'il faut garder**. Sans cette
                  condition, montrer deux PNJ de suite effacerait l'image de la
                  scène au profit du premier PNJ.
                */
                const occupant = get().projections[target];
                if (occupant && occupant !== get().projectedEntity?.id) {
                    set((s) => ({ imagePrecedente: { ...s.imagePrecedente, [target]: occupant } }));
                }

                // Optimiste : On pose l'entité
                set({ projectedEntity: entity });
                if (entity) {
                    set((s) => ({ projections: { ...s.projections, [target]: entity.id } }));
                }

                import('./logic/ImageService').then(({ ImageService }) => {
                    ImageService.projectEntity(portrait, entity?.name ?? '', entity?.id).then((projete) => {
                        if (!projete && entity !== null) {
                            get().blackout();
                            gmToast(i18n.t('modules:image.notifications.projectionFailed'));
                        } else if (entity) {
                            /*
                              **La chronique garde cette marque — décision de
                              David du 2026-08-21.**

                              La question était ouverte depuis la revue des
                              émetteurs : projeter la fiche d'un PNJ est de la
                              `chronique` pendant que projeter un média est une
                              `trace`. Le déséquilibre était réel, et il aurait
                              pu se trancher dans l'autre sens — projeter est un
                              geste de meneur. Il a été tranché ainsi parce que
                              **projeter la fiche d'un PNJ, c'est l'instant où
                              ce PNJ entre en scène**, et c'est ce que la
                              chronique retient.

                              **Mais la phrase, elle, a dû changer.** Elle disait
                              « Fiche de "X" envoyée au Player Hub » : du
                              vocabulaire de table, parti au modèle comme matière
                              de récit. Un événement narratif qui ne raconte rien
                              coûte deux fois — il occupe le budget et il apprend
                              au modèle qu'il existe un Player Hub. Le type reste
                              `NPC`, donc `chronique` par défaut ; c'est le
                              CONTENU qui a été mis d'accord avec sa nature.
                            */
                            journal()?.addEvent({
                                type: 'NPC',
                                title: i18n.t('modules:image.events.entityProjected.title', { name: entity.name }),
                                content: i18n.t('modules:image.events.entityProjected.content', {
                                    name: entity.name,
                                    // Le sous-titre ne s'annonce que s'il existe.
                                    // Le repli valait « ... », qui se lisait comme
                                    // une hésitation du meneur dans la chronique.
                                    subtitle: entity.subtitle ? `, ${entity.subtitle}` : '',
                                }),
                            });
                        }
                    });
                });
            },

            /**
             * **La fiche s'en va, le décor revient.**
             *
             * *Demandé par David le 2026-08-31, en séance.* Avant, la bascule
             * appelait `blackout` : montrer un PNJ par-dessus le plan d'un lieu
             * coûtait donc le plan, et il fallait le reprojeter à la main. *Le
             * geste « j'ai fini avec cette fiche » n'est pas le geste « je veux
             * du noir »* — et c'est toute la raison d'être de cette action.
             *
             * Le noir reste le repli, et il reste **volontaire** : sans décor mis
             * de côté, on éteint comme avant.
             */
            terminerLaFiche: async () => {
                const target = get().projectionTarget as string;
                const decor = get().imagePrecedente[target];

                if (!decor) {
                    get().blackout();
                    return;
                }

                // Le décor est repris **avant** d'être renvoyé à l'écran : le
                // rendre deux fois de suite reviendrait à le laisser en réserve
                // pour une fiche qu'on n'a pas encore montrée.
                set((s) => ({
                    projectedEntity: null,
                    imagePrecedente: { ...s.imagePrecedente, [target]: null },
                }));

                const { ImageService } = await import('./logic/ImageService');
                const revenu = await ImageService.projectMedia(decor, target as ProjectionTarget);
                // Un décor devenu introuvable — média supprimé entre-temps — ne
                // doit pas laisser la fiche à l'écran : on retombe sur le noir.
                if (!revenu) get().blackout();
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
                /*
                  **Le noir voulu efface aussi le décor mis de côté.** Sinon une
                  image éteinte à la main ressusciterait à la fin de la prochaine
                  fiche, des heures plus tard — un fantôme que personne ne
                  rattacherait à son geste.
                */
                set((s) => ({
                    projections: { ...s.projections, [target]: null },
                    imagePrecedente: { ...s.imagePrecedente, [target]: null },
                    projectedEntity: target === 'hub' ? null : s.projectedEntity,
                }));
                import('./logic/ImageService').then(({ ImageService }) => {
                    ImageService.blackout(target as any);
                });
            },

            blackoutAll: () => {
                const targets = Object.keys(get().projections);
                set({ projections: {}, imagePrecedente: {}, projectedEntity: null });
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

            reset: () => { get().blackoutAll(); set({ mediaList: [], projections: {}, imagePrecedente: {}, folders: [], activeFolderId: null, projectedEntity: null }); },
            clearActiveProjections: () => {
                set({ projections: {}, imagePrecedente: {}, projectedEntity: null });
            }
        }),
        {
            name: 'gmos-image-storage',
            // `imagePrecedente` accompagne `projections` : garder l'un sans
            // l'autre ferait revenir un décor sur un écran qui a changé, ou
            // perdre le décor d'une projection qui, elle, a survécu.
            partialize: (s) => ({ mediaList: s.mediaList, projectionTarget: s.projectionTarget, folders: s.folders, projections: s.projections, imagePrecedente: s.imagePrecedente }),
            onRehydrateStorage: () => (s) => {
                if (!s) return;
                // On vérifie dorénavant par "path" (m-127...) car les projections stockent les chemins
                const validPaths = new Set(s.mediaList.map(m => m.path));
                const nettoyer = (table: Record<string, string | null>) => Object.fromEntries(
                    Object.entries(table ?? {}).map(([t, v]) => [
                        t,
                        (v && v.startsWith('m-') && !validPaths.has(v)) ? null : v
                    ])
                );
                s.projections = nettoyer(s.projections);
                // Un décor dont le média a disparu ne doit pas être proposé au
                // retour : il rendrait la fin d'une fiche indistincte d'une panne.
                s.imagePrecedente = nettoyer(s.imagePrecedente);
            }
        }
    )
);

if (typeof window !== 'undefined') { (window as any).useImageStore = useImageStore; }
