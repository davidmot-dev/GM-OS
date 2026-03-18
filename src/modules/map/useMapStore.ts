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

export interface MapPing {
    id: string;
    x: number;
    y: number;
    color: string;
    createdAt: number;
}

export type FogMode = 'reveal' | 'hide';
export type MapTool = 'brush' | 'rect' | 'circle' | 'move_token' | 'ping';
export type WeatherType = 'none' | 'rain' | 'snow' | 'smoke';

interface MapState {
    mapUrl: string | null;
    mapName: string | null;
    isVideo: boolean;
    fogDataUrl: string | null; // C'est ici qu'on stockera l'image base64 du brouillard (pour reprendre une session plus tard)
    tokens: MapToken[];
    pings: MapPing[];
    fogCommand: 'reveal_all' | 'hide_all' | null;

    // Weather State
    weatherType: WeatherType;
    weatherIntensity: number; // 0 to 1

    // Map Dimensions
    mapWidth: number;
    mapHeight: number;

    // Grid State
    isGridEnabled: boolean;
    gridSize: number;
    gridColor: string;
    gridOpacity: number;

    // View State (Zoom/Pan)
    zoom: number;
    panX: number;
    panY: number;
    viewResetCounter: number;

    // UI State (Not persisted)
    currentTool: MapTool;
    fogMode: FogMode;
    brushSize: number;
    isDraggingToken: boolean;
    selectedTokenId: string | null;

    // Actions
    setMap: (url: string | null, isVideo?: boolean, name?: string) => void;
    setFogDataUrl: (dataUrl: string | null) => void;
    addToken: (token: Omit<MapToken, 'id'>) => void;
    updateToken: (id: string, updates: Partial<MapToken>) => void;
    updateProjectedToken: (id: string, updates: Partial<MapToken>) => void;
    removeToken: (id: string) => void;
    clearTokens: () => void;
    
    // Pings
    addPing: (x: number, y: number, color: string) => void;
    removePing: (id: string) => void;

    triggerFogCommand: (command: 'reveal_all' | 'hide_all' | null) => void;

    setTool: (tool: MapTool) => void;
    setFogMode: (mode: FogMode) => void;
    setBrushSize: (size: number) => void;

    // Weather Actions
    setWeather: (type: WeatherType, intensity?: number) => void;

    // Grid Actions
    setGridEnabled: (enabled: boolean) => void;
    setGridSize: (size: number) => void;
    setGridColor: (color: string) => void;
    setGridOpacity: (opacity: number) => void;

    // View Actions
    setViewState: (zoom: number, panX: number, panY: number) => void;
    setMapDimensions: (width: number, height: number) => void;
    resetView: () => void;
    
    projectedMapUrl: string | null;
    projectedIsVideo: boolean;
    projectedFogDataUrl: string | null;
    projectedTokens: MapToken[];
    projectedPings: MapPing[];
    projectedWeatherType: WeatherType;
    projectedWeatherIntensity: number;
    projectedMapWidth: number;
    projectedMapHeight: number;
    projectedIsGridEnabled: boolean;
    projectedGridSize: number;
    projectedGridColor: string;
    projectedGridOpacity: number;

    // Projection Action
    projectionTarget: 'hub' | 'monitor' | null;
    syncToPlayers: () => void;
    clearProjectedState: () => void;
    setIsDraggingToken: (val: boolean) => void;
    setSelectedTokenId: (id: string | null) => void;
}

export const useMapStore = create<MapState>()(
    persist(
        (set, get) => ({
            mapUrl: null,
            mapName: null,
            isVideo: false,
            fogDataUrl: null,
            tokens: [],
            pings: [],

            // UI Defaults
            currentTool: 'brush',
            fogMode: 'reveal',
            brushSize: 50,
            fogCommand: null,
            isDraggingToken: false,
            selectedTokenId: null,

            // Weather Defaults
            weatherType: 'none',
            weatherIntensity: 0.5,

            // Map Dimensions Defaults
            mapWidth: 2000,
            mapHeight: 2000,

            // Grid Defaults
            isGridEnabled: false,
            gridSize: 50,
            gridColor: '#ffffff',
            gridOpacity: 0.2,

            // View Defaults
            zoom: 1,
            panX: 0,
            panY: 0,
            viewResetCounter: 0,

            // Projected Defaults
            projectedMapUrl: null,
            projectedIsVideo: false,
            projectedFogDataUrl: null,
            projectedTokens: [],
            projectedPings: [],
            projectedWeatherType: 'none',
            projectedWeatherIntensity: 0.5,
            projectedMapWidth: 2000,
            projectedMapHeight: 2000,
            projectedIsGridEnabled: false,
            projectedGridSize: 50,
            projectedGridColor: '#ffffff',
            projectedGridOpacity: 0.2,

            setMap: (mapUrl, isVideo = false, mapName = 'Sans titre') => {
                set({ mapUrl, isVideo, mapName });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setFogDataUrl: (fogDataUrl) => {
                set({ fogDataUrl });
                if (get().projectionTarget) get().syncToPlayers();
            },

            addToken: (token) => {
                const id = Math.random().toString(36).substring(2, 9);
                set(state => ({
                    tokens: [...state.tokens, { ...token, id }]
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            updateToken: (id, updates) => {
                set(state => ({
                    tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t)
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            updateProjectedToken: (id, updates) => set(state => ({
                // Update player Hub/Monitor state
                projectedTokens: state.projectedTokens.map(t => t.id === id ? { ...t, ...updates } : t),
                // Replicate to GM main state so it's not lost on next Sync
                tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t)
            })),

            removeToken: (id) => {
                set(state => ({
                    tokens: state.tokens.filter(t => t.id !== id)
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            clearTokens: () => {
                set({ tokens: [] });
                if (get().projectionTarget) get().syncToPlayers();
            },

            addPing: (x, y, color) => {
                const id = Math.random().toString(36).substring(2, 9);
                const ping: MapPing = { id, x, y, color, createdAt: Date.now() };
                
                set(state => ({
                    pings: [...state.pings, ping]
                }));
                // Real-time bypass to replicate immediately
                set(state => ({
                    projectedPings: [...state.pings]
                }));

                // Auto-cleanup after 3 seconds
                setTimeout(() => {
                    get().removePing(id);
                }, 3000);
            },

            removePing: (id) => {
                set(state => ({
                    pings: state.pings.filter(p => p.id !== id),
                    projectedPings: state.projectedPings.filter(p => p.id !== id)
                }));
            },

            triggerFogCommand: (fogCommand) => {
                set({ fogCommand });
                if (get().projectionTarget) get().syncToPlayers();
            },

            projectionTarget: null,

            setTool: (currentTool) => set({ currentTool }),
            setFogMode: (fogMode) => set({ fogMode }),
            setBrushSize: (brushSize) => set({ brushSize }),

            setWeather: (weatherType, weatherIntensity) => {
                set(state => ({ 
                    weatherType, 
                    weatherIntensity: weatherIntensity ?? state.weatherIntensity 
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            setGridEnabled: (isGridEnabled) => {
                set({ isGridEnabled });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setGridSize: (gridSize) => {
                set({ gridSize });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setGridColor: (gridColor) => {
                set({ gridColor });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setGridOpacity: (gridOpacity) => {
                set({ gridOpacity });
                if (get().projectionTarget) get().syncToPlayers();
            },

            setViewState: (zoom, panX, panY) => set({ zoom, panX, panY }),
            setMapDimensions: (mapWidth, mapHeight) => set({ mapWidth, mapHeight }),
            resetView: () => {
                set(state => ({ viewResetCounter: state.viewResetCounter + 1 }));
            },

            syncToPlayers: () => {
                // Clone current GM state to projected state
                set(state => ({
                    projectionTarget: state.projectionTarget || 'hub',
                    projectedMapUrl: state.mapUrl,
                    projectedIsVideo: state.isVideo,
                    projectedFogDataUrl: state.fogDataUrl,
                    projectedTokens: [...state.tokens],
                    projectedPings: [...state.pings],
                    projectedWeatherType: state.weatherType,
                    projectedWeatherIntensity: state.weatherIntensity,
                    projectedMapWidth: state.mapWidth,
                    projectedMapHeight: state.mapHeight,
                    projectedIsGridEnabled: state.isGridEnabled,
                    projectedGridSize: state.gridSize,
                    projectedGridColor: state.gridColor,
                    projectedGridOpacity: state.gridOpacity,
                }));
            },

            clearProjectedState: () => set({
                projectionTarget: null,
                projectedMapUrl: null,
                projectedIsVideo: false,
                projectedFogDataUrl: null,
                projectedTokens: [],
                projectedPings: [],
                projectedWeatherType: 'none',
                projectedWeatherIntensity: 0.5,
                projectedMapWidth: 2000,
                projectedMapHeight: 2000,
                projectedIsGridEnabled: false,
                projectedGridSize: 50,
                projectedGridColor: '#ffffff',
                projectedGridOpacity: 0.2,
            }),

            setIsDraggingToken: (isDraggingToken) => set({ isDraggingToken }),
            setSelectedTokenId: (selectedTokenId) => set({ selectedTokenId })
        }),
        {
            name: 'gmos-map-storage',
            partialize: (state) => ({
                mapUrl: state.mapUrl,
                mapName: state.mapName,
                isVideo: state.isVideo,
                fogDataUrl: state.fogDataUrl,
                tokens: state.tokens,
                weatherType: state.weatherType,
                weatherIntensity: state.weatherIntensity,
                mapWidth: state.mapWidth,
                mapHeight: state.mapHeight,
                isGridEnabled: state.isGridEnabled,
                gridSize: state.gridSize,
                gridColor: state.gridColor,
                gridOpacity: state.gridOpacity,
                zoom: state.zoom,
                panX: state.panX,
                panY: state.panY,
                projectionTarget: state.projectionTarget,
                projectedMapUrl: state.projectedMapUrl,
                projectedIsVideo: state.projectedIsVideo,
                projectedFogDataUrl: state.projectedFogDataUrl,
                projectedTokens: state.projectedTokens,
                projectedWeatherType: state.projectedWeatherType,
                projectedWeatherIntensity: state.projectedWeatherIntensity,
                projectedMapWidth: state.projectedMapWidth,
                projectedMapHeight: state.projectedMapHeight,
                projectedIsGridEnabled: state.projectedIsGridEnabled,
                projectedGridSize: state.projectedGridSize,
                projectedGridColor: state.projectedGridColor,
                projectedGridOpacity: state.projectedGridOpacity
            })
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as any).useMapStore = useMapStore;
}
