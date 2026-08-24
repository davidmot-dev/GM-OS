import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';
import { DEFAULT_LANGUAGE } from '../config/languages';
import { PALETTES, type ThemeID } from '../theme/themeDeLInterface';

export type { ThemeID };
export type ModuleID = 'dashboard' | 'music' | 'sound' | 'ambient' | 'combat' | 'npc' | 'clock' | 'light' | 'image' | 'map' | 'table' | 'web' | 'voice' | 'favorite' | 'debug' | 'dice' | 'whiteboard' | 'obsidian' | 'journal' | 'forge';

interface SessionState {
    activeModule: ModuleID;
    theme: ThemeID;
    themeColor: string; // Hex color for global accents
    isSessionMode: boolean; // Mode MJ Focus (masque les outils d'édition)
    isAIPanelOpen: boolean;
    isMessengerOpen: boolean;
    displayCount: number;
    language: string;
    isSystemReady: boolean;

    // Actions
    setActiveModule: (id: ModuleID) => void;
    setTheme: (theme: ThemeID) => void;
    setThemeColor: (color: string) => void;
    toggleSessionMode: (force?: boolean) => void;
    toggleAIPanel: (force?: boolean) => void;
    toggleMessenger: (force?: boolean) => void;
    setDisplayCount: (count: number) => void;
    setLanguage: (lang: string) => void;
    setSystemReady: (ready: boolean) => void;
    getBackupData: () => {
        activeModule: string;
        theme: string;
        themeColor: string;
        isSessionMode: boolean;
        displayCount: number;
    };
}

/**
 * **La table des thèmes a déménagé** vers `theme/themeDeLInterface.ts`, le
 * 2026-08-24 : elle était déclarée ici ET dans `index.css`, et les deux se
 * contredisaient. Cet alias reste pour les appelants qui n'ont besoin que des
 * pastilles de couleur — voir `GlobalSettingsModal`.
 */
export const THEME_PALETTES = PALETTES;


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
            isSystemReady: false,

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
            setSystemReady: (isSystemReady) => set({ isSystemReady }),
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
            partialize: (state) => {
                const { isSystemReady, ...persistedState } = state;
                return persistedState;
            }
        }
    )
);
