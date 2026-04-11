import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';
import { DEFAULT_LANGUAGE } from '../config/languages';

export type ThemeID = 'cyberpunk' | 'medieval' | 'modern' | 'claire';
export type ModuleID = 'dashboard' | 'music' | 'sound' | 'ambient' | 'combat' | 'npc' | 'clock' | 'light' | 'image' | 'map' | 'table' | 'web' | 'voice' | 'favorite' | 'debug' | 'dice' | 'whiteboard' | 'obsidian' | 'journal';

interface ThemePalette {
    accent: string;
    bg: string;
    surface: string;
    border: string;
    fonts: string;
    palettes: string[];
}

interface SessionState {
    activeModule: ModuleID;
    theme: ThemeID;
    themeColor: string; // Hex color for global accents
    isSessionMode: boolean; // Mode MJ Focus (masque les outils d'édition)
    isAIPanelOpen: boolean;
    isMessengerOpen: boolean;
    displayCount: number;
    language: string;

    // Actions
    setActiveModule: (id: ModuleID) => void;
    setTheme: (theme: ThemeID) => void;
    setThemeColor: (color: string) => void;
    toggleSessionMode: (force?: boolean) => void;
    toggleAIPanel: (force?: boolean) => void;
    toggleMessenger: (force?: boolean) => void;
    setDisplayCount: (count: number) => void;
    setLanguage: (lang: string) => void;
    getBackupData: () => {
        activeModule: string;
        theme: string;
        themeColor: string;
        isSessionMode: boolean;
        displayCount: number;
    };
}

export const THEME_PALETTES: Record<ThemeID, ThemePalette> = {

    'cyberpunk': {
        accent: '#06b6d4',
        bg: '#020617',
        surface: '#0f172a',
        border: '#1e293b',
        fonts: '"Orbitron", "JetBrains Mono", sans-serif',
        palettes: ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444']
    },
    'medieval': {
        accent: '#d4af37',
        bg: '#181411', // Slightly lighter brown
        surface: '#24201c',
        border: '#332c26',
        fonts: '"Cinzel", "MedievalSharp", serif',
        palettes: ['#d4af37', '#b91c1c', '#7c2d12', '#4c1d95', '#1e40af']
    },

    'modern': {
        accent: '#3b82f6',
        bg: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        fonts: '"Outfit", "Inter", sans-serif',
        palettes: ['#3b82f6', '#6366f1', '#14b8a6', '#f43f5e', '#64748b']
    },
    'claire': {
        accent: '#c2410c',
        bg: '#fbfbf9',
        surface: '#ffffff',
        border: '#e7e5e4',
        fonts: '"Inter", sans-serif',
        palettes: ['#c2410c', '#0369a1', '#15803d', '#a21caf', '#374151']
    }
};


export const useSessionStore = create<SessionState>()(
    persist(
        (set, get) => ({
            activeModule: 'dashboard',
            theme: 'cyberpunk',
            themeColor: THEME_PALETTES['cyberpunk'].accent,
            isSessionMode: false,
            isAIPanelOpen: false,
            isMessengerOpen: false,
            displayCount: 1,
            language: localStorage.getItem('gmos-language') || DEFAULT_LANGUAGE,

            setActiveModule: (activeModule) => set({ activeModule }),
            setTheme: (theme) => set({ 
                theme,
                themeColor: THEME_PALETTES[theme]?.accent || '#3b82f6'
            }),
            setThemeColor: (themeColor) => set({ themeColor }),
            toggleSessionMode: (force?: boolean) => set((state) => ({
                isSessionMode: force !== undefined ? force : !state.isSessionMode
            })),
            toggleAIPanel: (force?: boolean) => set((state) => ({
                isAIPanelOpen: force !== undefined ? force : !state.isAIPanelOpen
            })),
            toggleMessenger: (force?: boolean) => set((state) => ({
                isMessengerOpen: force !== undefined ? force : !state.isMessengerOpen
            })),
            setDisplayCount: (displayCount) => set({ displayCount }),
            setLanguage: (language) => {
                set({ language });
                i18n.changeLanguage(language);
                localStorage.setItem('gmos-language', language);
            },
            getBackupData: () => ({
                activeModule: get().activeModule,
                theme: get().theme,
                themeColor: get().themeColor,
                isSessionMode: get().isSessionMode,
                displayCount: get().displayCount,
            }),
        }),
        {
            name: 'gmos-session-storage',
        }
    )
);
