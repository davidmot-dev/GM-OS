import { createJSONStorage, type PersistOptions } from 'zustand/middleware';
import type { SessionOSStore } from '../store/index';
import { idbStateStorage, onPersistedStateChanged } from './idbStorage';
import { isMainWindow } from '../../../utils/windowRole';

export const SESSION_STORE_KEY = 'gmos-v5-session-os-storage';

/**
 * PersistenceService handles Zustand persistence configuration.
 */
export const PersistenceService: PersistOptions<SessionOSStore> = {
    name: SESSION_STORE_KEY,
    version: 10,

    // IndexedDB plutôt que localStorage : pas de plafond à quelques mégaoctets,
    // pas d'écriture synchrone qui bloque l'interface. La reprise des données
    // déjà présentes dans localStorage est gérée par idbStateStorage.
    storage: createJSONStorage(() => idbStateStorage),
    
    migrate: (persistedState: unknown, version: number) => {
        console.log(`[Store Migration] Migrating from version ${version} to 10`);
        // Add specific migration logic here if needed for future versions
        return persistedState as SessionOSStore;
    },

    // NOTE: on n'appelle volontairement pas sanitizeAllSessions() ici — cela
    // provoquait des boucles de synchronisation sans fin. L'assainissement des
    // sessions se fait à l'ajout, ou explicitement via SessionManager.
    onRehydrateStorage: () => (state) => {
        if (state) {
            // Sanitize stale blob URLs
            (state.atlasMaps || []).forEach(m => {
                if (m.fileUrl?.startsWith('blob:')) m.fileUrl = '';
            });
            
            // Clear volatile state
            state.selectedDeckId = null;

            // Reconcile templates
            if (typeof state.reconcileTemplates === 'function') {
                state.reconcileTemplates();
            }
        }
    },

    partialize: (state) => {
        // On teste le rôle de la fenêtre, pas la présence d'Electron.
        //
        // Le Player Hub et le projecteur tournent dans Electron, sur la même
        // origine que la fenêtre MJ, donc sur la même base IndexedDB. Avec
        // l'ancien test ils persistaient l'état complet — c'est-à-dire les
        // données de campagne telles qu'ils venaient de les recevoir par
        // synchronisation, médias déjà résolus. Les identifiants de médiathèque
        // étaient ainsi remplacés par des base64 ou des URL absolues dans la
        // campagne elle-même, et la fenêtre MJ récupérait la version dégradée à
        // la réhydratation suivante.
        //
        // Ces fenêtres continuent de lire la base partagée et de recevoir la
        // synchronisation ; elles cessent seulement d'y réécrire.
        if (!isMainWindow()) {
            return {
                activeCampaignId: state.activeCampaignId,
                currentView: state.currentView,
                selectedPlayerId: state.selectedPlayerId,
                selectedAtlasMapId: state.selectedAtlasMapId,
                selectedEntityId: state.selectedEntityId,
                isProjecting: state.isProjecting,
            } as SessionOSStore;
        }

        // Fenêtre MJ : seule propriétaire des données de campagne.
        return {
            campaigns: state.campaigns,
            sessions: state.sessions,
            entities: state.entities,
            players: state.players,
            atlasMaps: state.atlasMaps,
            timelineEvents: state.timelineEvents,
            wikiEntries: state.wikiEntries,
            clues: state.clues,
            customSheetTemplates: state.customSheetTemplates,
            customGameDrivers: state.customGameDrivers,
            activeCampaignId: state.activeCampaignId,
            decks: state.decks,
            deckStates: state.deckStates,
            isProjecting: state.isProjecting,
            currentView: state.currentView,
        } as SessionOSStore;
    },
};

/**
 * Global synchronization helper for multiple windows.
 */
export const syncStorageAcrossWindows = (rehydrate: () => Promise<void>) => {
    if (typeof window === 'undefined') return;

    // IndexedDB n'émet pas d'événement `storage` : c'est idbStateStorage qui
    // notifie les autres fenêtres, sur un BroadcastChannel, à chaque écriture
    // réellement différente.
    onPersistedStateChanged(SESSION_STORE_KEY, () => {
        // Prevent rehydration if the current window is currently performing an atomic sync (like Nexus import)
        // This prevents race conditions where storage updates itself while being re-populated.
        const store = (window as any).useSessionOSStore?.getState();
        if (store?.isSystemSyncing) {
            console.log('[PersistenceService] Storage update ignored: system is syncing.');
            return;
        }
        rehydrate();
    });
};
