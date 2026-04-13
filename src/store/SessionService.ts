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

export const SessionService = {
    async saveFullSession(silent = false) {
        const sessionState = useSessionStore.getState();
        const osState = useSessionOSStore.getState();
        const npcState = useNPCStore.getState();
        const webState = useWebStore.getState();
        const ambientState = useAmbientStore.getState();
        const clockState = useClockStore.getState();
        const whiteboardState = useWhiteboardStore.getState();

        const fullData = {
            version: '5.1.0',
            timestamp: new Date().toISOString(),
            global: {
                theme: sessionState.theme,
                themeColor: sessionState.themeColor,
                activeModule: sessionState.activeModule,
            },
            modules: {
                sessionOS: {
                    campaigns: osState.campaigns,
                    activeCampaignId: osState.activeCampaignId,
                    players: osState.players,
                    timelineEvents: osState.timelineEvents,
                    wikiEntries: osState.wikiEntries,
                    atlasMaps: osState.atlasMaps,
                },
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
                }
            }
        };

        const { setLoading } = useLoadingStore.getState();
        setLoading(true, 'Sauvegarde de la session en cours...');

        try {
            if (window.appBridge?.session?.saveSession) {
                if (!silent) Logger.info('[Session] Starting save session');
                const savePromise = window.appBridge.session.saveSession(fullData as Record<string, unknown>);
                const success = await withTimeout(savePromise, 5000, 'La sauvegarde a pris trop de temps');
                
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
            if (!silent) setLoading(false);
        }
    },

    async loadFullSession() {
        const { setLoading } = useLoadingStore.getState();
        setLoading(true, 'Chargement de la session...');

        try {
            if (window.appBridge?.session?.loadSession) {
                Logger.info('[Session] Starting load session');
                const loadPromise = window.appBridge.session.loadSession();
                const data = await withTimeout(loadPromise, 5000, 'Le chargement a pris trop de temps');
                
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
                // Use type assertion to bridge between Zod-validated data and Zustand state
                useSessionOSStore.setState(data.modules.sessionOS as any);
            }
            if (data.modules.npc) useNPCStore.setState(data.modules.npc as any);
            if (data.modules.web) useWebStore.setState(data.modules.web as any);
            if (data.modules.clock) {
                useClockStore.setState(data.modules.clock as any);
            }
            // Ambient and Whiteboard might need more careful hydration if they have active engines
        }
    }
};
