import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeID = 'cyberpunk' | 'medieval' | 'modern';
export type ModuleID = 'dashboard' | 'music' | 'sound' | 'ambient' | 'combat' | 'npc' | 'clock' | 'light' | 'image' | 'map' | 'table' | 'web' | 'voice' | 'favorite' | 'debug' | 'dice' | 'whiteboard';

interface SessionState {
    activeModule: ModuleID;
    theme: ThemeID;
    themeColor: string; // Hex color for global accents
    isSessionMode: boolean; // Mode MJ Focus (masque les outils d'édition)

    // Actions
    setActiveModule: (id: ModuleID) => void;
    setTheme: (theme: ThemeID) => void;
    setThemeColor: (color: string) => void;
    toggleSessionMode: (force?: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            activeModule: 'dashboard',
            theme: 'cyberpunk',
            themeColor: '#06b6d4', // Cyan by default for cyberpunk

            setActiveModule: (activeModule) => set({ activeModule }),
            setTheme: (theme) => set({ 
                theme,
                // Apply default accent colors based on theme
                themeColor: theme === 'cyberpunk' ? '#06b6d4' : (theme === 'medieval' ? '#10b981' : '#3b82f6')
            }),
            setThemeColor: (themeColor) => set({ themeColor }),
            toggleSessionMode: (force) => set((state) => ({
                isSessionMode: force !== undefined ? force : !state.isSessionMode
            })),
        }),
        {
            name: 'gmos-session-storage',
        }
    )
);
