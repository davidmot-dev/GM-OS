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
import { withTimeout } from '../utils/promiseUtils';
import { Logger } from '../utils/logger';
import { lesDonneesDeLaSession } from '../modules/session/logic/donneesDeLaSession';
import { useBibliothequeDesFiches } from '../modules/fiches/useBibliothequeDesFiches';
import { useMusicStore } from '../modules/music/useMusicStore';

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
    const bibliotheque = useBibliothequeDesFiches.getState().instantane;

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
                const savePromise = window.appBridge.session.saveSession(fullData as Record<string, unknown>);
                const success = await withTimeout(savePromise, 30000, 'La sauvegarde a pris trop de temps');
                
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
                const loadPromise = window.appBridge.session.loadSession();
                const data = await withTimeout(loadPromise, 30000, 'Le chargement a pris trop de temps');
                
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
            // Ambient and Whiteboard might need more careful hydration if they have active engines
        }
    }
};
