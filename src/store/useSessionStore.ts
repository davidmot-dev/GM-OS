import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';
import { DEFAULT_LANGUAGE } from '../config/languages';
import { PALETTES, type ThemeID } from '../theme/themeDeLInterface';
import type { MomentDeJeu } from '../modules/ai/budgetsDeTemps';

export type { ThemeID };
export type ModuleID = 'dashboard' | 'music' | 'sound' | 'ambient' | 'combat' | 'npc' | 'clock' | 'light' | 'image' | 'map' | 'table' | 'web' | 'voice' | 'favorite' | 'debug' | 'dice' | 'whiteboard' | 'obsidian' | 'journal' | 'forge' | 'aide';

interface SessionState {
    activeModule: ModuleID;
    theme: ThemeID;
    themeColor: string; // Hex color for global accents
    /**
     * **Le régime d'interface forcé à la main, ou `null` pour suivre la séance.**
     *
     * ⛔ Ce champ remplace `isSessionMode`, qui portait le commentaire « Mode MJ
     * Focus (masque les outils d'édition) » — **écrit, mis dans une sauvegarde,
     * et lu par aucun écran**. Rien n'était masqué.
     *
     * Le mode existait pourtant déjà, ailleurs et sous un autre nom : le régime
     * `aLaTable` de l'axe N.3, dérivé de `momentDeJeu`. *Brancher `isSessionMode`
     * aurait créé un second écrivain pour le même fait* — le motif que ce dépôt
     * paie le plus souvent. On garde donc la source unique, et on lui ajoute la
     * seule chose qui lui manquait : **le moyen de passer outre.**
     *
     * ⚠️ **Non persisté, volontairement.** Un forçage est un geste « pour
     * maintenant » : le restaurer au lancement mettrait l'écran dans un régime
     * que personne n'a demandé ce jour-là, sans rien pour l'expliquer. C'est la
     * même règle que `suivreLaVoix` de Light-OS.
     */
    surchargeDuRegime: MomentDeJeu | null;
    isAIPanelOpen: boolean;
    isMessengerOpen: boolean;
    displayCount: number;
    language: string;
    isSystemReady: boolean;

    // Actions
    setActiveModule: (id: ModuleID) => void;
    setTheme: (theme: ThemeID) => void;
    setThemeColor: (color: string) => void;
    /** Force un régime d'interface, ou rend la main à la séance avec `null`. */
    forcerLeRegime: (regime: MomentDeJeu | null) => void;
    toggleAIPanel: (force?: boolean) => void;
    toggleMessenger: (force?: boolean) => void;
    setDisplayCount: (count: number) => void;
    setLanguage: (lang: string) => void;
    setSystemReady: (ready: boolean) => void;
    getBackupData: () => {
        activeModule: string;
        theme: string;
        themeColor: string;
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
            surchargeDuRegime: null,
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
            forcerLeRegime: (surchargeDuRegime) => set({ surchargeDuRegime }),
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
                displayCount: get().displayCount,
            }),
        }),
        {
            name: 'gmos-session-storage',
            partialize: (state) => {
                /*
                  `surchargeDuRegime` sort d'ici avec `isSystemReady` : **un
                  forçage est un geste « pour maintenant »**. Le restaurer au
                  lancement mettrait l'écran dans un régime que personne n'a
                  demandé ce jour-là, sans rien pour l'expliquer.
                */
                const persistedState = { ...state } as Partial<SessionState>;
                delete persistedState.isSystemReady;
                delete persistedState.surchargeDuRegime;
                return persistedState;
            }
        }
    )
);
