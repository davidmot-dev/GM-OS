import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionOSState } from './types';

export const useSessionOSStore = create<SessionOSState>()(
    persist(
        (set, get) => ({
            activeCampaignId: null,
            campaigns: [],
            players: [],
            entities: [],
            customGameDrivers: [],
            currentView: 'cockpit',
            messages: [],
            sessions: [],
            clues: [],
            atlasMaps: [],
            customSheetTemplates: [],
            activeCampaignWallpaper: null,
            connectedCharacters: {},
            isSystemSyncing: false,

            updateCharacterHP: (playerId, charId, hp) => {
                set((state) => ({
                    players: state.players.map(p => p.id === playerId ? {
                        ...p,
                        characters: p.characters.map(c => c.id === charId ? { ...c, hp } : c)
                    } : p)
                }));
            },

            updateEntityHP: (entityId, hp) => {
                set((state) => ({
                    entities: state.entities.map(e => e.id === entityId ? { ...e, hp } : e)
                }));
            },

            updateEntity: (entityId, updates) => {
                set((state) => ({
                    entities: state.entities.map(e => e.id === entityId ? { ...e, ...updates } : e)
                }));
            },

            updateCampaign: (id, updates) => {
                set((state) => ({
                    campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
                }));
            },

            setCurrentView: (view) => set({ currentView: view }),

            getActiveDriver: () => {
                const { activeCampaignId, campaigns, customGameDrivers } = get();
                const campaign = campaigns.find((c) => c.id === activeCampaignId);
                if (!campaign) return null;
                return (
                    customGameDrivers.find((d) => d.id === campaign.system) ??
                    null
                );
            },

            updateCharacterNarrative: () => {},
            addSessionMessage: () => {},
            requestItemTransfer: () => {},
            approveItemTransfer: () => {},
            rejectItemTransfer: () => {},
            removeInventoryItem: () => {},
            setCharacterLocks: () => {},
            saveMessageToJournal: () => {},
        }),
        {
            name: 'gm-os-session-storage',
        }
    )
);

if (typeof window !== 'undefined') {
    (window as any).useSessionOSStore = useSessionOSStore;
}
