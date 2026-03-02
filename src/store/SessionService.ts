import { useSessionStore } from './useSessionStore';

// Pour l'instant on ne gère que le Shell, mais ce service 
// collectera plus tard les données de tous les modules (Combat, Music, etc.)
export const SessionService = {
    async saveFullSession() {
        const sessionState = useSessionStore.getState();

        // Structure de la session complète (façon v3 mais typée)
        const fullData = {
            version: '5.0.0',
            timestamp: new Date().toISOString(),
            global: {
                theme: sessionState.theme,
                isSessionMode: sessionState.isSessionMode,
                activeModule: sessionState.activeModule,
            },
            // Les modules seront ajoutés ici au fur et à mesure de leur migration
            modules: {
                dice: {}, // Dice OS est déjà là mais son état est local pour l'instant
            }
        };

        try {
            // @ts-expect-error - ipcRenderer est exposé via preload.ts
            const success = await window.ipcRenderer.invoke('save-session', fullData);
            if (success) {
                console.log('Session sauvegardée avec succès');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    },

    async loadFullSession() {
        try {
            // @ts-expect-error - ipcRenderer is exposed globally via preload script
            const data = await window.ipcRenderer.invoke('load-session');
            if (data) {
                const { setTheme, toggleSessionMode, setActiveModule } = useSessionStore.getState();

                if (data.global) {
                    if (data.global.theme) setTheme(data.global.theme);
                    if (data.global.isSessionMode !== undefined) toggleSessionMode(data.global.isSessionMode);
                    if (data.global.activeModule) setActiveModule(data.global.activeModule);
                }

                // Distribution des données aux modules
                console.log('Session chargée:', data);
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        }
    }
};
