import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MapToken {
    id: string; // Unique ID for the token on the map
    name: string; // Nom affiché ou identifiant du token
    avatar: string;
    x: number;
    y: number;
    size: number; // Taille de base, ex: 1 pour une case, 2 pour un grand monstre
    linkedCombatantId?: string; // Lien avec Combat OS
    linkedSessionPlayerId?: string; // Lien direct avec un joueur Session OS
}

export type FogMode = 'reveal' | 'hide';
export type MapTool = 'brush' | 'rect' | 'circle' | 'move_token';

interface MapState {
    mapUrl: string | null;
    mapName: string | null;
    isVideo: boolean;
    fogDataUrl: string | null; // C'est ici qu'on stockera l'image base64 du brouillard (pour reprendre une session plus tard)
    tokens: MapToken[];
    fogCommand: 'reveal_all' | 'hide_all' | null;

    // UI State (Not persisted)
    currentTool: MapTool;
    fogMode: FogMode;
    brushSize: number;

    // Actions
    setMap: (url: string | null, isVideo?: boolean, name?: string) => void;
    setFogDataUrl: (dataUrl: string | null) => void;
    addToken: (token: Omit<MapToken, 'id'>) => void;
    updateToken: (id: string, updates: Partial<MapToken>) => void;
    removeToken: (id: string) => void;
    clearTokens: () => void;
    triggerFogCommand: (command: 'reveal_all' | 'hide_all' | null) => void;

    setTool: (tool: MapTool) => void;
    setFogMode: (mode: FogMode) => void;
    setBrushSize: (size: number) => void;
}

export const useMapStore = create<MapState>()(
    persist(
        (set) => ({
            mapUrl: null,
            mapName: null,
            isVideo: false,
            fogDataUrl: null,
            tokens: [],

            // UI Defaults
            currentTool: 'brush',
            fogMode: 'reveal',
            brushSize: 50,
            fogCommand: null,

            setMap: (mapUrl, isVideo = false, mapName = 'Sans titre') => set({ mapUrl, isVideo, mapName }),
            setFogDataUrl: (fogDataUrl) => set({ fogDataUrl }),

            addToken: (token) => set(state => ({
                tokens: [...state.tokens, { ...token, id: Math.random().toString(36).substring(2, 9) }]
            })),

            updateToken: (id, updates) => set(state => ({
                tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t)
            })),

            removeToken: (id) => set(state => ({
                tokens: state.tokens.filter(t => t.id !== id)
            })),

            clearTokens: () => set({ tokens: [] }),

            triggerFogCommand: (fogCommand) => set({ fogCommand }),

            setTool: (currentTool) => set({ currentTool }),
            setFogMode: (fogMode) => set({ fogMode }),
            setBrushSize: (brushSize) => set({ brushSize })
        }),
        {
            name: 'gmos-map-storage',
            partialize: (state) => ({
                mapUrl: state.mapUrl,
                mapName: state.mapName,
                isVideo: state.isVideo,
                fogDataUrl: state.fogDataUrl,
                tokens: state.tokens
            }) // On ne sauvegarde pas le currentTool et fogMode
        }
    )
);
