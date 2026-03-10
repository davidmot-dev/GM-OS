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

export const THEME_PALETTES = {
    'cyberpunk': {
        accent: '#06b6d4',
        bg: '#020617',
        surface: '#0f172a',
        border: '#1e293b'
    },
    'medieval': {
        accent: '#10b981',
        bg: '#1a120b',
        surface: '#2d241d',
        border: '#3f352c'
    },
    'modern': {
        accent: '#3b82f6',
        bg: '#0f172a',
        surface: '#1e293b',
        border: '#334155'
    }
};

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            activeModule: 'dashboard',
            theme: 'cyberpunk',
            themeColor: THEME_PALETTES['cyberpunk'].accent,
            isSessionMode: false,

            setActiveModule: (activeModule) => set({ activeModule }),
            setTheme: (theme) => set({ 
                theme,
                themeColor: THEME_PALETTES[theme]?.accent || '#3b82f6'
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
