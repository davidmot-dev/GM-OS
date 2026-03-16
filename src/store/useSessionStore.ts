import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeID = 'cyberpunk' | 'medieval' | 'modern' | 'claire';
export type ModuleID = 'dashboard' | 'music' | 'sound' | 'ambient' | 'combat' | 'npc' | 'clock' | 'light' | 'image' | 'map' | 'table' | 'web' | 'voice' | 'favorite' | 'debug' | 'dice' | 'whiteboard' | 'obsidian';

interface SessionState {
    activeModule: ModuleID;
    theme: ThemeID;
    themeColor: string; // Hex color for global accents
    isSessionMode: boolean; // Mode MJ Focus (masque les outils d'édition)
    isAIPanelOpen: boolean;

    // Actions
    setActiveModule: (id: ModuleID) => void;
    setTheme: (theme: ThemeID) => void;
    setThemeColor: (color: string) => void;
    toggleSessionMode: (force?: boolean) => void;
    toggleAIPanel: (force?: boolean) => void;
}

export const THEME_PALETTES = {
    'cyberpunk': {
        accent: '#06b6d4',
        bg: '#020617',
        surface: '#0f172a',
        border: '#1e293b',
        palettes: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444']
    },
    'medieval': {
        accent: '#10b981',
        bg: '#1a120b',
        surface: '#2d241d',
        border: '#3f352c',
        palettes: ['#10b981', '#d4af37', '#7c2d12', '#4c1d95', '#1e40af']
    },
    'modern': {
        accent: '#3b82f6',
        bg: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        palettes: ['#3b82f6', '#6366f1', '#14b8a6', '#f43f5e', '#64748b']
    },
    'claire': {
        accent: '#eca413',
        bg: '#fdfbf7',
        surface: '#ffffff',
        border: '#e9e4d9',
        palettes: ['#7fb3d5', '#a2d9ce', '#f1b6a7', '#eca413', '#6b615a']
    }
};

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            activeModule: 'dashboard',
            theme: 'cyberpunk',
            themeColor: THEME_PALETTES['cyberpunk'].accent,
            isSessionMode: false,
            isAIPanelOpen: false,

            setActiveModule: (activeModule) => set({ activeModule }),
            setTheme: (theme) => set({ 
                theme,
                themeColor: THEME_PALETTES[theme]?.accent || '#3b82f6'
            }),
            setThemeColor: (themeColor) => set({ themeColor }),
            toggleSessionMode: (force) => set((state) => ({
                isSessionMode: force !== undefined ? force : !state.isSessionMode
            })),
            toggleAIPanel: (force) => set((state) => ({
                isAIPanelOpen: force !== undefined ? force : !state.isAIPanelOpen
            })),
        }),
        {
            name: 'gmos-session-storage',
        }
    )
);
