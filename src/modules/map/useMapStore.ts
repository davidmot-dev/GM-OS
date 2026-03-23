import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useJournalStore } from '../journal/useJournalStore';

import type { 
    MapToken, MapPing, MagicShape, MagicStyle, MagicEffect, 
    DangerZonePreset, DangerZone, FogMode, MapTool, WeatherType 
} from './types';

interface MapState {
    /** URL de l'image ou de la vidéo de la carte */
    mapUrl: string | null;
    /** Nom d'affichage de la carte */
    mapName: string | null;
    /** Indique si la carte est un fond vidéo (MP4/WebM) */
    isVideo: boolean;
    /** Image base64 du brouillard de guerre pour la persistance */
    fogDataUrl: string | null; 
    /** Liste des jetons (tokens) actifs sur la carte */
    tokens: MapToken[];
    /** Pings temporaires des joueurs/MJ */
    pings: MapPing[];
    /** Effets visuels magiques persistants */
    magicEffects: MagicEffect[];
    /** Zones de danger (pièges, effets de zone) */
    dangerZones: DangerZone[];
    dangerZonePresets: DangerZonePreset[];
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
    magicStyle: MagicStyle;
    magicShape: MagicShape;
    fogMode: FogMode;
    selectedDangerPresetId: string | null;

    brushSize: number;
    isDraggingToken: boolean;
    selectedTokenId: string | null;

    // Audio State
    isMapMuted: boolean;
    mapVolume: number;
    mapOutputDeviceId: string;

    /** 
     * Définit la carte active et envoie une notification au Journal.
     */
    setMap: (url: string | null, isVideo?: boolean, name?: string, narrativeDescription?: string) => void;
    /** Sauvegarde l'état du brouillard de guerre */
    setFogDataUrl: (dataUrl: string | null) => void;
    /** Ajoute un jeton sur la carte (PNJ, PJ ou Monstre) */
    addToken: (token: Omit<MapToken, 'id'>) => void;
    updateToken: (id: string, updates: Partial<MapToken>) => void;
    updateProjectedToken: (id: string, updates: Partial<MapToken>) => void;
    removeToken: (id: string) => void;
    clearTokens: () => void;
    
    // Pings
    addPing: (x: number, y: number, color: string) => void;
    removePing: (id: string) => void;

    // Magic Effects
    addMagicEffect: (effect: Omit<MagicEffect, 'id'>) => void;
    removeMagicEffect: (id: string) => void;
    clearMagicEffects: () => void;

    // Danger Zones
    addDangerZone: (zone: Omit<DangerZone, 'id' | 'activeTokenIds'>) => void;
    updateDangerZone: (id: string, updates: Partial<DangerZone>) => void;
    removeDangerZone: (id: string) => void;
    clearDangerZones: () => void;
    
    // Danger Zone Presets
    addDangerZonePreset: (preset: Omit<DangerZonePreset, 'id'>) => void;
    removeDangerZonePreset: (id: string) => void;
    updateDangerZonePreset: (id: string, updates: Partial<DangerZonePreset>) => void;
    setSelectedDangerPresetId: (id: string | null) => void;

    triggerFogCommand: (command: 'reveal_all' | 'hide_all' | null) => void;

    setTool: (tool: MapTool) => void;
    setMagicSettings: (style: MagicStyle, shape: MagicShape) => void;
    setFogMode: (mode: FogMode) => void;

    setBrushSize: (size: number) => void;

    // Weather Actions
    setWeather: (type: WeatherType, intensity?: number) => void;

    // Grid Actions
    setGridEnabled: (enabled: boolean) => void;
    setGridSize: (size: number) => void;
    setGridColor: (color: string) => void;
    setGridOpacity: (opacity: number) => void;

    // Audio Actions
    setMapMuted: (muted: boolean) => void;
    setMapVolume: (volume: number) => void;
    setMapOutputDevice: (deviceId: string) => void;

    // View Actions
    setViewState: (zoom: number, panX: number, panY: number) => void;
    setMapDimensions: (width: number, height: number) => void;
    resetView: () => void;
    
    projectedMapUrl: string | null;
    projectedIsVideo: boolean;
    projectedFogDataUrl: string | null;
    projectedTokens: MapToken[];
    projectedPings: MapPing[];
    projectedMagicEffects: MagicEffect[];
    projectedDangerZones: DangerZone[];

    projectedWeatherType: WeatherType;
    projectedWeatherIntensity: number;
    projectedMapWidth: number;
    projectedMapHeight: number;
    projectedIsGridEnabled: boolean;
    projectedGridSize: number;
    projectedGridColor: string;
    projectedGridOpacity: number;
    projectedIsMapMuted: boolean;
    projectedMapVolume: number;

    // Projection Action
    projectionTarget: 'hub' | 'monitor' | null;
    /** 
     * Synchronise l'état local du MJ vers le Player Hub ou l'écran externe.
     * Clone les tokens, le brouillard, la météo et la grille.
     */
    syncToPlayers: () => void;
    /** Efface l'état projeté (Blackout de la carte) */
    clearProjectedState: () => void;
    dangerShape: 'circle' | 'rect' | 'line' | 'cone';
    setDangerShape: (shape: 'circle' | 'rect' | 'line' | 'cone') => void;
    dangerRotation: number;
    setIsDraggingToken: (val: boolean) => void;
    setSelectedTokenId: (id: string | null) => void;
}

export const useMapStore = create<MapState>()(
    persist(
        (set, get) => ({
            mapUrl: null,
            mapName: null,
            isVideo: false,
            isMapMuted: true,
            mapVolume: 0.5,
            mapOutputDeviceId: 'default',
            projectedIsMapMuted: true,
            projectedMapVolume: 0.5,
            fogDataUrl: null,
            tokens: [],
            pings: [],
            magicEffects: [],
            dangerZones: [],
            dangerZonePresets: [
                { 
                    id: 'preset-fire', 
                    name: '🔥 Feu / Incendie', 
                    color: '#ef4444',
                    hueSceneId: 'fire-scene-id', // Exemple
                    audioAtmosphereId: 'fire-ambience-id'
                },
                { 
                    id: 'preset-poison', 
                    name: '🤢 Poison / Acide', 
                    color: '#22c55e',
                    hueSceneId: 'poison-scene-id',
                    audioAtmosphereId: 'poison-ambience-id'
                },
                { 
                    id: 'preset-cold', 
                    name: '❄️ Froid Glacial', 
                    color: '#3b82f6',
                    hueSceneId: 'cold-scene-id',
                    audioAtmosphereId: 'cold-ambience-id'
                }
            ],
            projectedDangerZones: [],
            selectedDangerPresetId: 'preset-fire',
            dangerShape: 'rect',
            setDangerShape: (dangerShape) => set({ dangerShape }),
            dangerRotation: 0,
            setDangerRotation: (dangerRotation) => set({ dangerRotation }),


            // UI Defaults
            currentTool: 'brush',
            magicStyle: 'fire',
            magicShape: 'circle',
            fogMode: 'reveal',

            brushSize: 50,
            fogCommand: null,
            isDraggingToken: false,
            selectedTokenId: null,

            // Weather Defaults
            weatherType: 'none',
            weatherIntensity: 0.5,

            // Map Dimensions Defaults (0 means unknown, will trigger auto-detection)
            mapWidth: 0,
            mapHeight: 0,

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
            projectedMagicEffects: [],

            projectedWeatherType: 'none',
            projectedWeatherIntensity: 0.5,
            projectedMapWidth: 0,
            projectedMapHeight: 0,
            projectedIsGridEnabled: false,
            projectedGridSize: 50,
            projectedGridColor: '#ffffff',
            projectedGridOpacity: 0.2,

            setMap: (mapUrl, isVideo = false, mapName = 'Sans titre', narrativeDescription?: string) => {
                set({ mapUrl, isVideo, mapName });
                
                if (mapUrl) {
                    useJournalStore.getState().addEvent({
                        type: 'LOCATION',
                        title: `🗺️ Carte chargée: ${mapName}`,
                        content: narrativeDescription || `Le MJ a chargé la carte "${mapName}" dans le Map-OS.`
                    });
                }

                if (get().projectionTarget) get().syncToPlayers();
            },
            setFogDataUrl: (fogDataUrl) => {
                set({ fogDataUrl });
                if (get().projectionTarget) get().syncToPlayers();
            },

            addToken: (token) => {
                const id = Math.random().toString(36).substring(2, 9);
                set(state => ({
                    tokens: [...state.tokens, { ...token, id, isVisible: true }]
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            updateToken: (id, updates) => {
                set(state => ({
                    tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t)
                }));
                
                if (get().projectionTarget) get().syncToPlayers();
            },

            updateProjectedToken: (id, updates) => {
                set(state => ({
                    // Update player Hub/Monitor state
                    projectedTokens: state.projectedTokens.map(t => t.id === id ? { ...t, ...updates } : t),
                    // Replicate to GM main state so it's not lost on next Sync
                    tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t)
                }));
            },

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

            addMagicEffect: (effect) => {
                const id = Math.random().toString(36).substring(2, 9);
                set(state => ({
                    magicEffects: [...state.magicEffects, { ...effect, id }]
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            removeMagicEffect: (id) => {
                set(state => ({
                    magicEffects: state.magicEffects.filter(e => e.id !== id)
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            clearMagicEffects: () => {
                set({ magicEffects: [] });
                if (get().projectionTarget) get().syncToPlayers();
            },


            triggerFogCommand: (fogCommand) => {
                set({ fogCommand });
                if (get().projectionTarget) get().syncToPlayers();
            },

            projectionTarget: null,

            setTool: (currentTool) => set({ currentTool }),
            setMagicSettings: (magicStyle, magicShape) => set({ magicStyle, magicShape }),
            setFogMode: (fogMode) => set({ fogMode }),
            setBrushSize: (brushSize) => set({ brushSize }),

            // Audio Actions
            setMapMuted: (isMapMuted) => {
                set({ isMapMuted });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setMapVolume: (mapVolume) => {
                set({ mapVolume: Math.max(0, Math.min(1, mapVolume)) });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setMapOutputDevice: (mapOutputDeviceId) => set({ mapOutputDeviceId }),


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
            setMapDimensions: (mapWidth, mapHeight) => {
                set(state => ({ 
                    mapWidth, 
                    mapHeight,
                    // If projecting, update projected dimensions too
                    ...(state.projectionTarget ? { projectedMapWidth: mapWidth, projectedMapHeight: mapHeight } : {})
                }));
            },

            resetView: () => {
                set(state => ({ viewResetCounter: state.viewResetCounter + 1 }));
            },

            syncToPlayers: () => {
                // Log to journal
                useJournalStore.getState().addEvent({
                    type: 'LOCATION',
                    title: 'Carte synchronisée',
                    content: `La carte "${get().mapName || 'Sans titre'}" a été envoyée aux joueurs (${get().projectionTarget === 'hub' ? 'Player Hub' : 'Écran externe'}).`
                });

                // Clone current GM state to projected state
                set(state => ({
                    projectionTarget: state.projectionTarget || 'hub',
                    projectedMapUrl: state.mapUrl,
                    projectedIsVideo: state.isVideo,
                    projectedFogDataUrl: state.fogDataUrl,
                    projectedTokens: state.tokens.filter(t => {
                        // Simplified: Project all visible tokens. Fog of War now handled via Z-Index on Player Hub.
                        return true;
                    }),
                    projectedPings: [...state.pings],
                    projectedMagicEffects: [...state.magicEffects],
                    projectedWeatherType: state.weatherType,

                    projectedWeatherIntensity: state.weatherIntensity,
                    projectedMapWidth: state.mapWidth,
                    projectedMapHeight: state.mapHeight,
                    projectedIsGridEnabled: state.isGridEnabled,
                    projectedGridSize: state.gridSize,
                    projectedGridColor: state.gridColor,
                    projectedGridOpacity: state.gridOpacity,
                    projectedIsMapMuted: state.isMapMuted,
                    projectedMapVolume: state.mapVolume,
                    projectedDangerZones: [...state.dangerZones],
                }));
            },

            clearProjectedState: () => set({
                projectionTarget: null,
                projectedMapUrl: null,
                projectedIsVideo: false,
                projectedFogDataUrl: null,
                projectedTokens: [],
                projectedPings: [],
                projectedDangerZones: [],
                projectedWeatherType: 'none',
                projectedWeatherIntensity: 0.5,
                projectedMapWidth: 2000,
                projectedMapHeight: 2000,
                projectedIsGridEnabled: false,
                projectedGridSize: 50,
                projectedGridColor: '#ffffff',
                projectedGridOpacity: 0.2,
                projectedIsMapMuted: true,
                projectedMapVolume: 0.5,
            }),

            setIsDraggingToken: (isDraggingToken) => set({ isDraggingToken }),
            setSelectedTokenId: (selectedTokenId) => set({ selectedTokenId }),

            // Danger Zones Actions
            addDangerZone: (zone) => {
                const id = Math.random().toString(36).substring(2, 9);
                console.log("[MapStore] addDangerZone reçu:", zone);
                set(state => ({
                    dangerZones: [...state.dangerZones, { ...zone, id, activeTokenIds: [] }]
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            updateDangerZone: (id, updates) => {
                set(state => ({
                    dangerZones: state.dangerZones.map(z => z.id === id ? { ...z, ...updates } : z)
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            removeDangerZone: (id) => {
                set(state => ({
                    dangerZones: state.dangerZones.filter(z => z.id !== id)
                }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            clearDangerZones: () => {
                set({ dangerZones: [] });
                if (get().projectionTarget) get().syncToPlayers();
            },

            // Presets Actions
            addDangerZonePreset: (preset) => {
                const id = Math.random().toString(36).substring(2, 9);
                set(state => ({
                    dangerZonePresets: [...state.dangerZonePresets, { ...preset, id }]
                }));
            },

            removeDangerZonePreset: (id) => {
                set(state => ({
                    dangerZonePresets: state.dangerZonePresets.filter(p => p.id !== id)
                }));
            },

            updateDangerZonePreset: (id, updates) => {
                set(state => ({
                    dangerZonePresets: state.dangerZonePresets.map(p => p.id === id ? { ...p, ...updates } : p)
                }));
            },

            setSelectedDangerPresetId: (id) => set({ selectedDangerPresetId: id }),
        }),
        {
            name: 'gmos-map-storage',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                const state = persistedState as any;
                if (version === 0) {
                    console.log("[MapStore] Migration vers v1: mise à jour des presets par défaut");
                    const updatedPresets = state.dangerZonePresets?.map((p: any) => {
                        if (p.id === 'preset-fire' && !p.hueSceneId) {
                            return { ...p, hueSceneId: 'fire-scene-id', audioAtmosphereId: 'fire-ambience-id' };
                        }
                        if (p.id === 'preset-poison' && !p.hueSceneId) {
                            return { ...p, hueSceneId: 'poison-scene-id', audioAtmosphereId: 'poison-ambience-id' };
                        }
                        if (p.id === 'preset-cold' && !p.hueSceneId) {
                            return { ...p, hueSceneId: 'cold-scene-id', audioAtmosphereId: 'cold-ambience-id' };
                        }
                        return p;
                    });
                    return { ...state, dangerZonePresets: updatedPresets || state.dangerZonePresets };
                }
                return state;
            },
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
                dangerZones: state.dangerZones,
                dangerZonePresets: state.dangerZonePresets,
                dangerShape: state.dangerShape,
                dangerRotation: state.dangerRotation,
                zoom: state.zoom,
                panX: state.panX,
                panY: state.panY,
                isDraggingToken: state.isDraggingToken,
                selectedTokenId: state.selectedTokenId,
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
                projectedGridOpacity: state.projectedGridOpacity,
                projectedMagicEffects: state.projectedMagicEffects,
                isMapMuted: state.isMapMuted,
                mapVolume: state.mapVolume,
                mapOutputDeviceId: state.mapOutputDeviceId,
                projectedIsMapMuted: state.projectedIsMapMuted,
                projectedMapVolume: state.projectedMapVolume
            })

        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).useMapStore = useMapStore;
}

