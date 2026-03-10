import { useSessionStore } from './useSessionStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useNPCStore } from '../modules/npc/useNPCStore';
import { useWebStore } from '../modules/web/useWebStore';
import { useAmbientStore } from '../modules/ambient/useAmbientStore';
import { useClockStore } from './useClockStore';
import { useWhiteboardStore } from '../modules/whiteboard/useWhiteboardStore';
import { gmToast } from '../stores/useToastStore';

export const SessionService = {
    async saveFullSession() {
        const sessionState = useSessionStore.getState();
        const osState = useSessionOSStore.getState();
        const npcState = useNPCStore.getState();
        const webState = useWebStore.getState();
        const ambientState = useAmbientStore.getState();
        const clockState = useClockStore.getState();
        const whiteboardState = useWhiteboardStore.getState();

        const fullData = {
            version: '5.0.0',
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

        try {
            if (window.appBridge?.session?.saveSession) {
                const success = await window.appBridge.session.saveSession(fullData as Record<string, unknown>);
                if (success) {
                    gmToast('Session sauvegardée avec succès 💾');
                }
            } else {
                // Fallback or development
                console.log('Save (Dev Mode):', fullData);
                gmToast('Sauvegarde simulée (Mode Dev)');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            gmToast('Erreur lors de la sauvegarde ❌');
        }
    },

    async loadFullSession() {
        try {
            if (window.appBridge?.session?.loadSession) {
                const data = await window.appBridge.session.loadSession();
                if (data) {
                    this.distributeData(data);
                    gmToast('Session chargée avec succès 📂');
                }
            } else {
                 gmToast('Bridge non disponible pour le chargement');
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            gmToast('Erreur lors du chargement ❌');
        }
    },

    distributeData(data: any) {
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
                // Assuming useSessionOSStore has a hydrate method or just set manually if exported
                // For now, many stores are persisted via Zustand middleware, but full manual load 
                // is better for cross-device/file portability.
                useSessionOSStore.setState(data.modules.sessionOS);
            }
            if (data.modules.npc) useNPCStore.setState(data.modules.npc);
            if (data.modules.web) useWebStore.setState(data.modules.web);
            if (data.modules.clock) useClockStore.setState(data.modules.clock);
            // Ambient and Whiteboard might need more careful hydration if they have active engines
        }
    }
};
