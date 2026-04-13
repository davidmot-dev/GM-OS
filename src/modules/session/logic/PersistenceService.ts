import type { PersistOptions } from 'zustand/middleware';
import type { SessionOSStore } from '../store/index';

/**
 * PersistenceService handles Zustand persistence configuration.
 */
export const PersistenceService: PersistOptions<SessionOSStore> = {
    name: 'gmos-v5-session-os-storage',
    version: 10,
    
    migrate: (persistedState: unknown, version: number) => {
        console.log(`[Store Migration] Migrating from version ${version} to 10`);
        // Add specific migration logic here if needed for future versions
        return persistedState as SessionOSStore;
    },

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
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', (event) => {
            if (event.key === 'gmos-v5-session-os-storage') {
                rehydrate();
            }
        });
    }
};
