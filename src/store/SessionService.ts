import { useSessionStore } from './useSessionStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useNPCStore } from '../modules/npc/useNPCStore';
import { useWebStore } from '../modules/web/useWebStore';
import { useAmbientStore } from '../modules/ambient/useAmbientStore';
import { useClockStore } from './useClockStore';
import { useWhiteboardStore } from '../modules/whiteboard/useWhiteboardStore';
import { gmToast } from '../stores/useToastStore';
import { validateSession, type FullSession } from '../types/schemas';
import { useLoadingStore } from '../stores/useLoadingStore';
import { Logger } from '../utils/logger';
import { lesDonneesDeLaSession } from '../modules/session/logic/donneesDeLaSession';
import { useBibliothequeDesFiches } from '../modules/fiches/useBibliothequeDesFiches';
import { useMusicStore } from '../modules/music/useMusicStore';
import { useBestiaireStore } from '../modules/combat/useBestiaireStore';
import { useMapStore } from '../modules/map/useMapStore';
import { useFavoriteStore } from '../modules/favorite/useFavoriteStore';

/**
 * **Ce qu'une sauvegarde contient — construit une fois, écrit par deux chemins.**
 *
 * La sauvegarde manuelle (avec son dialogue) et la sauvegarde automatique (sans)
 * doivent porter exactement la même chose. Deux constructions donneraient deux
 * idées de ce qu'est une session, et l'écart ne se verrait **que le jour où l'on
 * relit** — c'est déjà arrivé, voir `donneesDeLaSession.ts`.
 */
export function construireLaSauvegarde() {
    const sessionState = useSessionStore.getState();
    const osState = useSessionOSStore.getState();
    const npcState = useNPCStore.getState();
    const webState = useWebStore.getState();
    const ambientState = useAmbientStore.getState();
    const clockState = useClockStore.getState();
    const whiteboardState = useWhiteboardStore.getState();
    const musicState = useMusicStore.getState();
    const bestiaireState = useBestiaireStore.getState();
    const bibliotheque = useBibliothequeDesFiches.getState().instantane;
    const mapState = useMapStore.getState();
    const favoriteState = useFavoriteStore.getState();

    return {
        version: '5.1.0',
        timestamp: new Date().toISOString(),
        global: {
            theme: sessionState.theme,
            themeColor: sessionState.themeColor,
            activeModule: sessionState.activeModule,
        },
        modules: {
            // Une seule liste de ce qu'une session contient, partagée avec
            // la persistance vivante : voir `donneesDeLaSession.ts`. Elle
            // était recopiée ici, et il y manquait `entities`, `clues` et
            // `sessions` — les PNJ, les indices et l'historique des séances
            // n'étaient donc dans aucune sauvegarde.
            sessionOS: lesDonneesDeLaSession(osState),
            npc: {
                savedEntities: npcState.savedEntities,
            },
            web: {
                links: webState.links,
            },
            ambient: {
                tracks: ambientState.tracks,
            },
            clock: {
                timestamp: clockState.timestamp,
            },
            whiteboard: {
                paths: whiteboardState.paths,
            },
            /*
              **Music-OS n'était dans aucune sauvegarde** — ni la manuelle, ni
              l'automatique. Trouvé le 2026-08-30 en cherchant où rattacher les
              atmosphères à une campagne.

              Une playlist n'est pas un réglage : ce sont des chemins de
              fichiers, des libellés, des points de boucle, des scènes
              lumineuses liées et des raccourcis clavier. Tout cela ne vivait
              que dans le `localStorage` d'une application qui a déjà perdu ses
              données deux fois.

              **Les playlists seulement.** La sortie audio, le volume général
              et la durée de fondu décrivent la pièce où l'on joue, pas
              l'univers : rouvrir une sauvegarde d'il y a six mois ne doit pas
              renvoyer le son sur la mauvaise carte au milieu d'une séance.
            */
            music: {
                playlists: musicState.playlists,
            },
            /*
              **Le bestiaire suit, et il fallait y penser tout de suite.**

              Music-OS n'etait dans AUCUNE sauvegarde jusqu'au 2026-08-30, et
              personne ne s'en etait apercu pendant des mois : une donnee qu'on
              cree sans y penser est une donnee qu'on oublie de proteger. Les
              gabarits d'adversaires sont exactement de cette famille — quelques
              minutes de travail chacun, aucune trace ailleurs.

              Les repartitions de champs suivent aussi : c'est ce que David a
              corrige a la main, jeu par jeu, et le reperdre lui reposerait les
              memes questions.
            */
            bestiaire: {
                gabarits: bestiaireState.gabarits,
                repartitions: bestiaireState.repartitions,
            },
            /*
              **Map-OS n'etait dans aucune sauvegarde** — releve le 2026-09-04
              en ecrivant son guide. Ni les configurations de carte, ni les
              modeles de zones de danger, ni le brouillard.

              **Ce qui entre ici est ce qui est de la preparation** : un preset
              de carte et un modele de zone sont du travail fait a froid, qui ne
              se retrouve nulle part ailleurs. Les pions poses, le zoom et
              l'etat des calques decrivent la seance en cours et se refont en
              trois clics.

              **Le brouillard n'y est pas, et c'est delibere** : c'est une image
              par carte, dans une base a part. Il releve du miroir des medias —
              115 images, 261 Mo mesures le 29/08 — et non d'un instantane JSON
              qu'on prend toutes les deux minutes.
            */
            map: {
                mapPresets: mapState.mapPresets,
                dangerZonePresets: mapState.dangerZonePresets,
            },
            /*
              **Favorite-OS non plus** — et son guide affirmait qu'une pastille
              verte « confirme que vos donnees sont en securite ». Elles ne
              l'etaient pas.
            */
            favorite: {
                favorites: favoriteState.favorites,
            },
            /*
              **La bibliothèque du moteur de fiches — chantier n° 5.**

              Elle vit dans l'IndexedDB de l'origine `gmos://`, que rien d'autre
              ne sauvegarde : *le magasin qui détient la vérité d'une fiche
              serait le seul non protégé.* La copie est prise quand une fiche est
              ouverte sur l'écran du meneur, et `priseLe` voyage avec elle — une
              sauvegarde dont on ignore la fraîcheur est pire qu'une sauvegarde
              absente.

              Absente quand aucune fiche n'a jamais été ouverte : c'est le cas
              normal, et une clé vide dirait la même chose en occupant de la place.
            */
            ...(bibliotheque ? { fiches: bibliotheque } : {}),
        }
    };
}

export const SessionService = {
    async saveFullSession(silent = false) {
        const fullData = construireLaSauvegarde();

        const { setLoading } = useLoadingStore.getState();
        setLoading(true, 'Sauvegarde de la session en cours...');

        try {
            if (window.appBridge?.session?.saveSession) {
                if (!silent) Logger.info('[Session] Starting save session');
                /*
                  **Aucun minuteur ici : cet appel contient une décision humaine.**

                  `save-session` ouvre le sélecteur de fichier **puis** écrit —
                  un seul aller-retour. Le chronomètre de trente secondes courait
                  donc pendant que David cherchait son dossier, et c'est la seule
                  chose qu'il ait jamais attrapée : le 2026-08-30, il a fait
                  échouer une **restauration**, au moment précis où l'on croyait
                  les campagnes perdues.

                  Il ne protégeait de rien : un dialogue Electron se termine
                  toujours — annuler rend `null`. *Un garde-fou qui n'attrape que
                  des humains n'est pas un garde-fou, c'est un piège.*
                */
                const success = await window.appBridge.session.saveSession(fullData as Record<string, unknown>);

                if (success) {
                    if (!silent) {
                        Logger.info('[Session] Session saved successfully');
                        gmToast('Session sauvegardée avec succès 💾');
                    }
                }
            } else {
                // Fallback or development
                Logger.warn('[Session] Save skipped (Bridge not available)');
                console.log('Save (Dev Mode):', fullData);
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate IO
                gmToast('Sauvegarde simulée (Mode Dev)');
            }
        } catch (error) {
            if (!silent) {
                Logger.error('[Session] Save error', error);
                console.error('Erreur lors de la sauvegarde:', error);
                gmToast(`Erreur: ${error instanceof Error ? error.message : 'Échec de la sauvegarde'} ❌`);
            }
        } finally {
            // `setLoading(true)` est posé sans condition plus haut : ne le retirer
            // que si `!silent` laissait le voile de chargement collé à l'écran
            // pour toujours dès qu'une sauvegarde était silencieuse.
            setLoading(false);
        }
    },

    async loadFullSession() {
        const { setLoading } = useLoadingStore.getState();
        setLoading(true, 'Chargement de la session...');

        try {
            if (window.appBridge?.session?.loadSession) {
                Logger.info('[Session] Starting load session');
                // Même raison qu'à la sauvegarde : le sélecteur de fichier est
                // dans l'appel, et on ne met pas un chronomètre sur quelqu'un
                // qui cherche un fichier — surtout pas celui qui restaure.
                const data = await window.appBridge.session.loadSession();

                if (data) {
                    const validatedData = validateSession(data);
                    this.distributeData(validatedData);
                    Logger.info('[Session] Session loaded and validated');
                    gmToast('Session chargée et vérifiée 📂');
                }
            } else {
                 Logger.warn('[Session] Load skipped (Bridge not available)');
                 gmToast('Bridge non disponible pour le chargement');
            }
        } catch (error) {
            Logger.error('[Session] Load error', error);
            console.error('Erreur lors du chargement:', error);
            gmToast(`Erreur: ${error instanceof Error ? error.message : 'Échec du chargement'} ❌`);
        } finally {
            setLoading(false);
        }
    },

    distributeData(data: FullSession) {
        if (!data) return;

        // Global
        if (data.global) {
            const { setTheme, setThemeColor, setActiveModule } = useSessionStore.getState();
            if (data.global.theme) setTheme(data.global.theme);
            if (data.global.themeColor) setThemeColor(data.global.themeColor);
            if (data.global.activeModule) setActiveModule(data.global.activeModule);
        }

        // Modules
        if (data.modules) {
            if (data.modules.sessionOS) {
                const sessionOS = data.modules.sessionOS as any;
                
                // Deduplicate Players and their Characters
                if (sessionOS.players) {
                    sessionOS.players = sessionOS.players.map((p: any) => ({
                        ...p,
                        characters: Array.from(new Map((p.characters || []).map((c: any) => [c.id, c])).values())
                    }));
                    sessionOS.players = Array.from(new Map(sessionOS.players.map((p: any) => [p.id, p])).values());
                }

                // Deduplicate Global Entities (NPCs)
                if (sessionOS.entities) {
                    sessionOS.entities = Array.from(new Map(sessionOS.entities.map((e: any) => [e.id, e])).values());
                }

                // Hydrate custom drivers and templates
                if (sessionOS.customGameDrivers) {
                    useSessionOSStore.getState().customGameDrivers = sessionOS.customGameDrivers;
                }
                if (sessionOS.customSheetTemplates) {
                    useSessionOSStore.getState().customSheetTemplates = sessionOS.customSheetTemplates;
                }

                useSessionOSStore.setState(sessionOS);
            }
            if (data.modules.npc) useNPCStore.setState(data.modules.npc as any);
            if (data.modules.web) useWebStore.setState(data.modules.web as any);
            if (data.modules.clock) {
                useClockStore.setState(data.modules.clock as any);
            }
            /*
              **Une bibliothèque vide n'en remplace jamais une pleine.** Une
              sauvegarde antérieure au 2026-08-30 n'a pas de clé `music` du
              tout — c'est le `if` qui l'écarte. Mais une sauvegarde prise
              avant que le magasin n'ait fini de se réhydrater en porterait
              une, vide, et l'appliquer effacerait le travail du meneur en
              silence. La leçon est payée : voir `SessionBackupManager`.

              Seules les playlists reviennent. Le reste de Music-OS décrit la
              pièce où l'on joue, pas la campagne.
            */
            const music = (data.modules as { music?: { playlists?: unknown[] } }).music;
            if (music?.playlists?.length) {
                useMusicStore.setState({ playlists: music.playlists as never });
                Logger.info(`[Session] ${music.playlists.length} atmosphères restaurées`);
            }
            /*
              Meme prudence que pour les playlists : un bestiaire vide ne
              remplace jamais un bestiaire plein.
            */
            const bestiaire = (data.modules as {
                bestiaire?: { gabarits?: unknown[]; repartitions?: Record<string, unknown> };
            }).bestiaire;
            if (bestiaire?.gabarits?.length) {
                useBestiaireStore.setState({
                    gabarits: bestiaire.gabarits as never,
                    repartitions: (bestiaire.repartitions ?? {}) as never,
                });
                Logger.info(`[Session] ${bestiaire.gabarits.length} gabarit(s) d'adversaire restaure(s)`);
            }
            /*
              Meme prudence que partout ailleurs ici : **une liste vide ne
              remplace jamais une liste pleine**. Une sauvegarde anterieure au
              2026-09-04 n'a pas ces cles du tout, et le `?.length` l'ecarte.
            */
            const carte = (data.modules as {
                map?: { mapPresets?: unknown[]; dangerZonePresets?: unknown[] };
            }).map;
            if (carte?.mapPresets?.length || carte?.dangerZonePresets?.length) {
                useMapStore.setState({
                    ...(carte.mapPresets?.length ? { mapPresets: carte.mapPresets as never } : {}),
                    ...(carte.dangerZonePresets?.length
                        ? { dangerZonePresets: carte.dangerZonePresets as never }
                        : {}),
                });
                Logger.info(
                    `[Session] ${carte.mapPresets?.length ?? 0} configuration(s) de carte et `
                    + `${carte.dangerZonePresets?.length ?? 0} modele(s) de zone restaures`,
                );
            }

            const favoris = (data.modules as { favorite?: { favorites?: unknown[] } }).favorite;
            if (favoris?.favorites?.length) {
                useFavoriteStore.setState({ favorites: favoris.favorites as never });
                Logger.info(`[Session] ${favoris.favorites.length} favori(s) restaure(s)`);
            }
            // Ambient and Whiteboard might need more careful hydration if they have active engines
        }
    }
};
