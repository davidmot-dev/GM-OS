import { createJSONStorage, type PersistOptions, type StateStorage } from 'zustand/middleware';
import type { SessionOSStore } from '../store/index';
import { idbStateStorage, onPersistedStateChanged } from './idbStorage';
import { isMainWindow } from '../../../utils/windowRole';

export const SESSION_STORE_KEY = 'gmos-v5-session-os-storage';

/**
 * Lecture pour toutes les fenêtres, écriture pour la seule fenêtre MJ.
 *
 * Le Player Hub et le projecteur tournent dans Electron, sur la même origine
 * que la fenêtre MJ, donc sur la même base IndexedDB et sous la même clé. Toute
 * écriture de leur part remplace l'état du MJ.
 *
 * Ce n'est pas théorique : c'est la perte de campagnes du 2026-08-07. Une
 * fenêtre secondaire persistait une charge réduite — six champs de sélection,
 * sans `campaigns`. Le dégât ne se voyait pas sur le moment, parce que la
 * fenêtre MJ gardait ses données en mémoire. Il se produisait au démarrage à
 * froid suivant : le store s'initialise sur les mocks, lit une charge sans
 * `campaigns`, et la fusion superficielle de Zustand laisse les mocks en
 * place — que le MJ persiste alors par-dessus les vraies données.
 *
 * L'interdiction est posée ici, au seul point qui écrit, et non dans
 * `partialize` : une charge réduite reste une charge, et c'est la charge
 * elle-même qui détruisait les données.
 */
const gmOnlyStateStorage: StateStorage = {
    getItem: (name) => idbStateStorage.getItem(name),

    setItem: async (name, value) => {
        if (!isMainWindow()) return;
        await idbStateStorage.setItem(name, value);
    },

    removeItem: async (name) => {
        if (!isMainWindow()) return;
        await idbStateStorage.removeItem(name);
    },
};

/**
 * PersistenceService handles Zustand persistence configuration.
 */
export const PersistenceService: PersistOptions<SessionOSStore> = {
    name: SESSION_STORE_KEY,
    version: 10,

    // IndexedDB plutôt que localStorage : pas de plafond à quelques mégaoctets,
    // pas d'écriture synchrone qui bloque l'interface. La reprise des données
    // déjà présentes dans localStorage est gérée par idbStateStorage.
    storage: createJSONStorage(() => gmOnlyStateStorage),
    
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

    // Une seule forme de charge persistée, celle de la fenêtre MJ : elle est la
    // seule à écrire (voir `gmOnlyStateStorage`). Les fenêtres secondaires
    // continuent de lire cette base et de recevoir la synchronisation.
    partialize: (state) => {
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
