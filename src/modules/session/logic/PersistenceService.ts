import { createJSONStorage, type PersistOptions } from 'zustand/middleware';
import type { SessionOSStore } from '../store/index';
import { idbStateStorage, onPersistedStateChanged } from './idbStorage';

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
        const isElectron = typeof window !== 'undefined' && !!(window as any).appBridge;
        
        // Optimization for Tablet/Hub: Persist only the bare minimum to avoid QuotaExceededError
        if (!isElectron) {
            return {
                activeCampaignId: state.activeCampaignId,
                currentView: state.currentView,
                selectedPlayerId: state.selectedPlayerId,
                selectedAtlasMapId: state.selectedAtlasMapId,
                selectedEntityId: state.selectedEntityId,
                isProjecting: state.isProjecting,
            } as SessionOSStore;
        }

        // Master (Electron): Persist full state for offline usage
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
