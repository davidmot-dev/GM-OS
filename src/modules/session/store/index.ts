import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionOSState } from './types';

export const useSessionOSStore = create<SessionOSState>()(
    persist(
        (set, get) => ({
            campaigns: [],
            activeCampaignId: null,
            players: [],
            entities: [],

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
            }
        }),
        {
            name: 'gm-os-session-storage',
        }
    )
);

if (typeof window !== 'undefined') {
    (window as any).useSessionOSStore = useSessionOSStore;
}
