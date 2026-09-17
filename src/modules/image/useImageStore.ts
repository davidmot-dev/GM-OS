import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ImageMedia, ProjectionTarget, DisplayInfo, ImageFolder, ProjectedEntity, Diaporama, DiaporamaEnCours } from './types';
import {
    imagesDuDiaporama, indexSuivant, cadenceDuDiaporama, peutTourner,
    CADENCE_PAR_DEFAUT_MS,
} from './logic/deroulementDuDiaporama';
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
    /**
     * **Le niveau des vidéos projetées, 0 à 1 — 2026-09-05.**
     *
     * Il ne remplace pas le volume général : il s'y **multiplie**, comme le
     * curseur d'un module dans une console. *Le meneur doit pouvoir calmer une
     * vidéo trop forte sans toucher à la musique, et couper toute la table d'un
     * seul geste.* Voir [[gainDeLaVideo]].
     */
    volumeVideo: number;
    activeFolderId: string | null; 
    currentView: 'library' | 'favorites' | 'recent' | 'diaporamas';

    /**
     * **Les diaporamas du meneur** — demandés par David le 2026-09-13.
     *
     * Ils appartiennent à la bibliothèque : ils sont persistés et sauvegardés,
     * comme les dossiers. *Un diaporama est un montage qu'on prépare ; ce n'est
     * pas un réglage de la pièce.*
     */
    diaporamas: Diaporama[];
    /** Celui qui tourne, et où. **Jamais persisté** — voir [[DiaporamaEnCours]]. */
    diaporamaEnCours: DiaporamaEnCours | null;

    addMedia: (media: Omit<ImageMedia, 'id' | 'isFavorite'>) => void;
    removeMedia: (id: string) => void;
    renameMedia: (id: string, newName: string) => void;
    toggleMediaFavorite: (id: string) => void;
    setProjectionTarget: (target: ProjectionTarget) => void;
    setProjection: (target: string, path: string | null) => void;
    setCurrentView: (view: 'library' | 'favorites' | 'recent' | 'diaporamas') => void;
    setVolumeVideo: (volume: number) => void;
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

    /*
      **Les gestes du diaporama — 2026-09-13.**

      L'horloge vit **ici**, dans la fenêtre du meneur, et ne fait qu'avancer
      l'image projetée par le chemin habituel. ⭐ *C'est ce qui permet au
      projecteur, au Player Hub, aux tablettes et à la sauvegarde de n'avoir
      rien à apprendre* : ils ne voient qu'une suite de projections d'image,
      comme si le meneur les enchaînait à la main.
    */
    creerDiaporama: (nom: string) => string;
    renommerDiaporama: (id: string, nom: string) => void;
    supprimerDiaporama: (id: string) => void;
    ajouterAuDiaporama: (diaporamaId: string, mediaId: string) => void;
    retirerDuDiaporama: (diaporamaId: string, rang: number) => void;
    deplacerDansLeDiaporama: (diaporamaId: string, rang: number, direction: 1 | -1) => void;
    reglerLaCadence: (diaporamaId: string, dureeParImageMs: number) => void;
    /**
     * Lance un diaporama. `cible` vise un écran pour ce lancement-là, sans
     * changer celui qu'Image-OS pointe — même règle que `projectSolo`, et
     * c'est ce dont un moment de storyboard a besoin.
     */
    lancerLeDiaporama: (id: string, cible?: string) => void;
    /** Arrête l'horloge. **N'éteint pas l'écran** : la dernière image reste. */
    arreterLeDiaporama: () => void;
    /** Feuillette à la main, et **relève le minuteur** : la nouvelle image a droit à son temps plein. */
    avancerLeDiaporama: (direction: 1 | -1) => void;

    blackout: () => void;
    blackoutAll: () => void;
    blackoutAllHub: () => void;
    /**
     * **Le vrai noir sur l'écran cible**, décor de campagne compris.
     *
     * ⚠️ À ne pas confondre avec {@link blackout}, qui depuis le 2026-09-17 rend
     * le Hub à son décor au lieu de l'éteindre. *Deux intentions qui produisent
     * le même pixel sur un écran de télévision n'en produisent pas le même sur le
     * Hub.*
     */
    noirTotal: () => void;
    applySnapshot: (snapshot: {
        projections?: Record<string, string | null>;
        mediaList?: ImageMedia[];
        folders?: ImageFolder[];
    }) => void;
    reset: () => void;
    clearActiveProjections: () => void;
}

/**
 * L'abonnement au signal des projecteurs, posé une seule fois pour la vie du
 * module. Voir `fetchDisplays` pour ce que son absence coûtait.
 */
let abonnementAuxProjecteurs: (() => void) | null = null;

/**
 * **L'horloge du diaporama.**
 *
 * ⛔ **Un `setTimeout` qui se replante, et non un `setInterval`.** Un intervalle
 * **fige sa période à la pose** : changer la cadence d'un diaporama en cours
 * n'aurait rien changé à l'écran, et le meneur aurait réglé un curseur qui ne
 * répond pas. *La leçon est celle des effets de Light-OS, payeé le 2026-09-07 :
 * rendre une période réglable, c'est trouver qui la relit.* Ici, chaque tour
 * relit `cadenceDuDiaporama`.
 */
let minuterieDuDiaporama: ReturnType<typeof setTimeout> | null = null;

function arreterLaMinuterie(): void {
    if (minuterieDuDiaporama === null) return;
    clearTimeout(minuterieDuDiaporama);
    minuterieDuDiaporama = null;
}

/**
 * **Vrai le temps que le diaporama projette sa propre image.**
 *
 * ⛔ Sans cette marque, `projectSolo` ne pourrait pas distinguer *le diaporama
 * qui avance* d'*un meneur qui projette autre chose* — et comme toute
 * projection manuelle sur l'écran du diaporama doit l'arrêter (voir
 * `projectSolo`), le diaporama **s'arrêterait lui-même à sa première image**.
 */
let projectionDuDiaporama = false;

/**
 * **Projette l'image du moment, et programme la suivante.**
 *
 * Une seule fonction pour les deux, parce que c'est un seul fait : *ce qui est
 * à l'écran décide de quand vient la suite.*
 *
 * ⚠️ **Tout est relu à chaque tour** — le diaporama, ses images, sa cadence.
 * Rien n'est capturé dans la fermeture : le meneur peut retirer une image,
 * changer la cadence ou renommer le diaporama pendant qu'il tourne, et le tour
 * suivant en tient compte. *Une horloge qui travaille sur une copie annonce
 * l'état d'il y a six secondes.*
 */
function projeterLImageDuDiaporama(
    get: () => ImageState,
    set: (partiel: Partial<ImageState>) => void,
): void {
    arreterLaMinuterie();

    const etat = get();
    const enCours = etat.diaporamaEnCours;
    if (!enCours) return;

    const diaporama = etat.diaporamas.find(d => d.id === enCours.id);
    if (!diaporama) { set({ diaporamaEnCours: null }); return; }

    const images = imagesDuDiaporama(diaporama, etat.mediaList);
    if (images.length === 0) { set({ diaporamaEnCours: null }); return; }

    /* Une image supprimée raccourcit la liste sous les pieds de l'index : on le
       ramène dans les bornes plutôt que de tomber sur `undefined`. */
    const index = enCours.index % images.length;

    projectionDuDiaporama = true;
    try {
        void etat.projectSolo(images[index], enCours.cible);
    } finally {
        /* Rendu **avant** le premier `await` de `projectSolo` : la garde qui le
           lit s'exécute, elle aussi, avant. */
        projectionDuDiaporama = false;
    }

    /* Une seule image : il n'y a rien à enchaîner, et la reprojeter en boucle
       rejouerait son fondu d'entrée — un décor fixe qui clignote. */
    if (!peutTourner(images)) return;

    minuterieDuDiaporama = setTimeout(() => {
        const frais = get();
        const suite = frais.diaporamaEnCours;
        if (!suite) return;
        const diapoFrais = frais.diaporamas.find(d => d.id === suite.id);
        const listeFraiche = diapoFrais ? imagesDuDiaporama(diapoFrais, frais.mediaList) : [];
        if (listeFraiche.length === 0) { set({ diaporamaEnCours: null }); return; }
        set({ diaporamaEnCours: {
            ...suite,
            index: indexSuivant(suite.index, listeFraiche.length, 1),
        } });
        projeterLImageDuDiaporama(get, set);
    }, cadenceDuDiaporama(diaporama));
}

export const useImageStore = create<ImageState>()(
    persist(
        (set, get) => ({
            mediaList: [],
            projectionTarget: 'hub',
            projections: {},
            imagePrecedente: {},
            displays: [],
            volumeVideo: 1,
            folders: [],
            activeFolderId: null,
            currentView: 'library',
            projectedEntity: null,
            diaporamas: [],
            diaporamaEnCours: null,

            fetchDisplays: async () => {
                const bridge = window.appBridge;
                if (bridge?.image?.getDisplays) {
                    const displays = await bridge.image.getDisplays();
                    set({ displays });
                    if (get().projectionTarget !== 'hub' && !displays.find(d => d.id === get().projectionTarget)) {
                        set({ projectionTarget: 'hub' });
                    }
                }

                /*
                  📡 Réponse au signal AUTO-SYNC des projecteurs.

                  ⛔ **Un seul abonnement, pas un par appel.** `fetchDisplays` est
                  appelée à chaque ouverture d'Image-OS ; cette ligne posait donc
                  un écouteur de plus à chaque fois, et rien ne les retirait — le
                  `off` du pont générique était inerte. Au troisième passage, un
                  `projector-ready` relançait la projection trois fois.
                */
                if (!abonnementAuxProjecteurs && bridge?.image?.onSyncHubData) {
                    abonnementAuxProjecteurs = bridge.image.onSyncHubData((type: string, targetId: string) => {
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
                const newMedia: ImageMedia = { ...mediaData, id: crypto.randomUUID(), isFavorite: false, folderId: get().activeFolderId };
                set((state) => ({ mediaList: [...state.mediaList, newMedia] }));
            },

            removeMedia: (id) => {
                set((state) => ({
                    mediaList: state.mediaList.filter(m => m.id !== id),
                    projections: Object.fromEntries(Object.entries(state.projections).map(([t, v]) => [t, v === id ? null : v]))
                }));
            },

            renameMedia: (id, name) => set((s) => ({ mediaList: s.mediaList.map(m => m.id === id ? { ...m, name } : m) })),
            toggleMediaFavorite: (id) => set((s) => ({ mediaList: s.mediaList.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m) })),
            setProjectionTarget: (projectionTarget) => set({ projectionTarget }),
            setVolumeVideo: (volume) => set({ volumeVideo: Math.min(1, Math.max(0, volume)) }),
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

            /* ───────────────────────── Les diaporamas ─────────────────────────
               Demandés par David le 2026-09-13. Ce qui décide — quelles images,
               laquelle ensuite, combien de temps — vit dans
               `logic/deroulementDuDiaporama.ts` et se teste sans écran. Ce qui
               suit ne fait que **tenir l'horloge** et appeler la projection
               habituelle.                                                      */

            creerDiaporama: (nom) => {
                const id = crypto.randomUUID();
                set(s => ({ diaporamas: [...s.diaporamas, {
                    id, nom, imageIds: [], dureeParImageMs: CADENCE_PAR_DEFAUT_MS,
                }] }));
                return id;
            },

            renommerDiaporama: (id, nom) => set(s => ({
                diaporamas: s.diaporamas.map(d => d.id === id ? { ...d, nom } : d),
            })),

            supprimerDiaporama: (id) => {
                /* Supprimer celui qui tourne arrête l'horloge : sans ça elle
                   chercherait un diaporama absent à chaque tour. */
                if (get().diaporamaEnCours?.id === id) get().arreterLeDiaporama();
                set(s => ({ diaporamas: s.diaporamas.filter(d => d.id !== id) }));
            },

            /*
              **Une image peut figurer deux fois dans un diaporama, exprès.**
              Revenir sur un plan déjà vu est un geste de montage ; l'interdire
              ferait de `imageIds` un ensemble, et un ensemble n'a pas d'ordre.
            */
            ajouterAuDiaporama: (diaporamaId, mediaId) => set(s => ({
                diaporamas: s.diaporamas.map(d =>
                    d.id === diaporamaId ? { ...d, imageIds: [...d.imageIds, mediaId] } : d),
            })),

            /* Par **rang** et non par identifiant — sinon retirer un doublon
               retirerait les deux, ce que le meneur n'a pas demandé. */
            retirerDuDiaporama: (diaporamaId, rang) => set(s => ({
                diaporamas: s.diaporamas.map(d =>
                    d.id === diaporamaId
                        ? { ...d, imageIds: d.imageIds.filter((_, i) => i !== rang) }
                        : d),
            })),

            deplacerDansLeDiaporama: (diaporamaId, rang, direction) => set(s => ({
                diaporamas: s.diaporamas.map(d => {
                    if (d.id !== diaporamaId) return d;
                    const vers = rang + direction;
                    /* Aux extrémités, on ne fait rien — **on n'enroule pas**. Une
                       première image qui sauterait à la fin d'un clic de trop
                       ressemblerait à une perte, pas à un déplacement. */
                    if (vers < 0 || vers >= d.imageIds.length) return d;
                    const imageIds = [...d.imageIds];
                    [imageIds[rang], imageIds[vers]] = [imageIds[vers], imageIds[rang]];
                    return { ...d, imageIds };
                }),
            })),

            reglerLaCadence: (diaporamaId, dureeParImageMs) => set(s => ({
                diaporamas: s.diaporamas.map(d =>
                    d.id === diaporamaId ? { ...d, dureeParImageMs } : d),
            })),

            lancerLeDiaporama: (id, cible) => {
                arreterLaMinuterie();
                const etat = get();
                const diaporama = etat.diaporamas.find(d => d.id === id);
                if (!diaporama) {
                    console.warn(`[Diaporama] ${id} introuvable.`);
                    set({ diaporamaEnCours: null });
                    return;
                }

                const images = imagesDuDiaporama(diaporama, etat.mediaList);
                if (images.length === 0) {
                    /* Rien à montrer : on le **dit**. Un diaporama vidé par des
                       suppressions se lancerait sinon dans un silence complet,
                       et le meneur croirait à une panne de projection. */
                    gmToast(i18n.t('modules:image.diaporama.vide', { nom: diaporama.nom }));
                    set({ diaporamaEnCours: null });
                    return;
                }

                const ecran = cible || (get().projectionTarget as string);
                set({ diaporamaEnCours: { id, index: 0, cible: ecran } });
                projeterLImageDuDiaporama(get, set);
            },

            arreterLeDiaporama: () => {
                arreterLaMinuterie();
                /*
                  **On n'éteint pas l'écran.** Arrêter le défilement et faire le
                  noir sont deux gestes : le meneur qui arrête veut souvent
                  **garder l'image où elle en est**. Le noir a son propre bouton,
                  et un moment de storyboard éteint déjà ce qu'il a posé.
                */
                set({ diaporamaEnCours: null });
            },

            avancerLeDiaporama: (direction) => {
                const enCours = get().diaporamaEnCours;
                if (!enCours) return;
                const diaporama = get().diaporamas.find(d => d.id === enCours.id);
                if (!diaporama) { get().arreterLeDiaporama(); return; }
                const images = imagesDuDiaporama(diaporama, get().mediaList);
                if (images.length === 0) { get().arreterLeDiaporama(); return; }

                set({ diaporamaEnCours: {
                    ...enCours,
                    index: indexSuivant(enCours.index, images.length, direction),
                } });
                /* Le minuteur repart de zéro : une image qu'on vient d'appeler à
                   la main a droit à son temps plein, pas au reste de celui d'avant. */
                projeterLImageDuDiaporama(get, set);
            },

            projectSolo: async (media, cible) => {
                const target = (cible || get().projectionTarget) as string;

                /*
                  ⛔ **Une image projetée à la main arrête le diaporama qui
                  occupait cet écran.**

                  Sans ça, le meneur projette une image, et **six secondes plus
                  tard le diaporama la remplace** — un écran qui change tout seul,
                  au milieu d'une scène, sans que rien ne relie le symptôme au
                  diaporama lancé dix minutes plus tôt. *Le dernier geste du
                  meneur gagne, toujours.*

                  On ne coupe que sur **le même écran** : un diaporama sur le
                  moniteur du fond n'a aucune raison de s'arrêter parce qu'une
                  fiche part au Player Hub.
                */
                const diaporama = get().diaporamaEnCours;
                if (diaporama && !projectionDuDiaporama && diaporama.cible === target) {
                    get().arreterLeDiaporama();
                }

                /*
                  ⛔ **Le journal ne reçoit pas les images d'un diaporama.**

                  Chaque projection réussie écrit une ligne au fil de la séance.
                  À six secondes par image, un diaporama y déverserait **dix
                  lignes par minute** : au bout d'une heure, le fil du meneur ne
                  contiendrait plus que ça, et les véritables événements de la
                  soirée seraient introuvables. *Un journal qu'on ne peut plus
                  lire ne vaut pas mieux qu'un journal absent.*

                  ⚠️ **Lu ici et non plus bas** : la marque est remise à faux
                  avant le premier `await`, donc elle ne dit plus rien au moment
                  où l'écriture a lieu.
                */
                const viaDiaporama = projectionDuDiaporama;
                
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
                    if (!viaDiaporama) journal()?.addEvent({
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



            blackout: () => {
                const target = get().projectionTarget as string;
                /* Le noir voulu sur cet écran arrête ce qui l'occupait : sinon
                   le diaporama le rallumerait à son tour suivant. */
                if (get().diaporamaEnCours?.cible === target) get().arreterLeDiaporama();
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
                /* Tout éteindre éteint aussi ce qui rallumerait. */
                get().arreterLeDiaporama();
                const targets = Object.keys(get().projections);
                set({ projections: {}, imagePrecedente: {}, projectedEntity: null });
                import('./logic/ImageService').then(({ ImageService }) => {
                    ImageService.blackoutAll(targets);
                });
            },

            /*
              ⭐ **Le geste qui tient la promesse du bouton.**

              ⛔ **Première tentative, le 2026-09-17 au soir** : j'avais
              rebranché les deux boutons rouges d'Image-OS sur ce geste, au motif
              que leur infobulle disait « Éteindre l'écran ». Or ce sont ceux que
              David utilise pour **arrêter une projection**. Le lendemain matin :
              *« quand j'arrête de projeter je tombe sur un écran noir »*.

              ⭐ ***Un libellé décrit une intention ; un geste quotidien EST une
              intention.*** Quand les deux se contredisent, c'est le geste qui a
              raison — on corrige le libellé, on ne détourne pas le bouton.

              Le vrai noir a donc désormais **son propre bouton**, et
              `Ctrl+Maj+0`.
            */
            noirTotal: () => {
                const target = get().projectionTarget as string;
                get().blackout();
                if (target === 'hub') {
                    import('./logic/noircirLePlayerHub').then(({ noircirLePlayerHub }) => {
                        noircirLePlayerHub((window as { appBridge?: unknown }).appBridge as never);
                    });
                }
            },


            blackoutAllHub: () => {
                if (get().diaporamaEnCours?.cible === 'hub') get().arreterLeDiaporama();
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

            reset: () => { get().arreterLeDiaporama(); get().blackoutAll(); set({ mediaList: [], projections: {}, imagePrecedente: {}, folders: [], activeFolderId: null, projectedEntity: null }); },
            clearActiveProjections: () => {
                get().arreterLeDiaporama();
                set({ projections: {}, imagePrecedente: {}, projectedEntity: null });
            }
        }),
        {
            name: 'gmos-image-storage',
            // `imagePrecedente` accompagne `projections` : garder l'un sans
            // l'autre ferait revenir un décor sur un écran qui a changé, ou
            // perdre le décor d'une projection qui, elle, a survécu.
            /*
              `volumeVideo` est retenu : c'est un réglage de bibliothèque, pas de
              pièce. Il dit à quel point les vidéos du meneur sont fortes les
              unes par rapport aux autres — au contraire du volume général, qui
              décrit les enceintes d'ici et reste hors des sauvegardes.
            */
            /*
              `diaporamas` est retenu, `diaporamaEnCours` **jamais** : le premier
              est un montage préparé, le second l'état de la pièce à un instant.
              Retrouver au démarrage un diaporama « en cours » dont l'horloge est
              morte avec la fenêtre précédente donnerait un écran qui prétend
              tourner et n'avance jamais.
            */
            partialize: (s) => ({ mediaList: s.mediaList, projectionTarget: s.projectionTarget, folders: s.folders, projections: s.projections, imagePrecedente: s.imagePrecedente, volumeVideo: s.volumeVideo, diaporamas: s.diaporamas }),
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
