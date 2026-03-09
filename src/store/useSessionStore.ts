import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeID = 'cyberpunk' | 'medieval' | 'modern';
export type ModuleID = 'dashboard' | 'music' | 'sound' | 'ambient' | 'combat' | 'npc' | 'clock' | 'light' | 'image' | 'map' | 'table' | 'web' | 'voice' | 'favorite' | 'debug' | 'dice' | 'whiteboard';

interface SessionState {
    activeModule: ModuleID;
    theme: ThemeID;
    isSessionMode: boolean; // Mode MJ Focus (masque les outils d'édition)

    // Actions
    setActiveModule: (id: ModuleID) => void;
    setTheme: (theme: ThemeID) => void;
    toggleSessionMode: (force?: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            activeModule: 'dashboard',
            theme: 'cyberpunk',
            isSessionMode: false,

            setActiveModule: (activeModule) => set({ activeModule }),
            setTheme: (theme) => set({ theme }),
            toggleSessionMode: (force) => set((state) => ({
                isSessionMode: force !== undefined ? force : !state.isSessionMode
            })),
        }),
        {
            name: 'gmos-session-storage',
        }
    )
);
