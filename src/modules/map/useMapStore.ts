import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
    MapToken, MapPing, MagicEffect, DangerZone, 
    WeatherType, TimeOfDay, LayerId, LayerVisibility, FogRegistry, MapPreset, DangerZonePreset 
} from './types';
import { useJournalStore } from '../journal/useJournalStore';
import { fogDB } from '../../utils/indexedDB';

interface MapState {
    mapUrl: string | null;
    mapName: string | null;
    isVideo: boolean;
    fogDataUrl: string | null;
    fogRegistry: FogRegistry;
    layerVisibility: LayerVisibility;

    tokens: MapToken[];
    pings: MapPing[];
    magicEffects: MagicEffect[];
    dangerZones: DangerZone[];
    dangerZonePresets: DangerZonePreset[];

    // Environment
    weatherType: WeatherType;
    weatherIntensity: number;
    timeOfDay: TimeOfDay;

    // Grid
    isGridEnabled: boolean;
    gridSize: number;
    gridColor: string;
    gridOpacity: number;

    // View
    zoom: number;
    panX: number;
    panY: number;
    viewResetCounter: number;

    // Audio (Persistent for projection)
    isMapMuted: boolean;
    mapVolume: number;
    mapOutputDeviceId: string;

    // Actions
    setMap: (url: string | null, isVideo?: boolean, name?: string, narrativeDescription?: string) => void;
    setFogDataUrl: (dataUrl: string | null) => void;
    addToken: (token: Omit<MapToken, 'id'>) => void;
    updateToken: (id: string, updates: Partial<MapToken>) => void;
    updateProjectedToken: (id: string, updates: Partial<MapToken>) => void;
    removeToken: (id: string) => void;
    clearTokens: () => void;
    
    addPing: (x: number, y: number, color: string) => void;
    removePing: (id: string) => void;

    addMagicEffect: (effect: Omit<MagicEffect, 'id'>) => void;
    removeMagicEffect: (id: string) => void;
    clearMagicEffects: () => void;

    addDangerZone: (zone: Omit<DangerZone, 'id' | 'activeTokenIds'>) => void;
    updateDangerZone: (id: string, updates: Partial<DangerZone>) => void;
    removeDangerZone: (id: string) => void;
    clearDangerZones: () => void;
    attachZoneToToken: (zoneId: string, tokenId: string | null) => void;
    
    addDangerZonePreset: (preset: Omit<DangerZonePreset, 'id'>) => DangerZonePreset;
    removeDangerZonePreset: (id: string) => void;
    updateDangerZonePreset: (id: string, updates: Partial<DangerZonePreset>) => void;

    triggerFogCommand: (command: 'reveal_all' | 'hide_all' | null) => void;
    fogCommand: 'reveal_all' | 'hide_all' | null;

    toggleLayer: (layerId: LayerId) => void;

    setWeather: (type: WeatherType, intensity?: number) => void;
    setTimeOfDay: (time: TimeOfDay) => void;

    setGridEnabled: (enabled: boolean) => void;
    setGridSize: (size: number) => void;
    setGridColor: (color: string) => void;
    setGridOpacity: (opacity: number) => void;

    setMapMuted: (muted: boolean) => void;
    setMapVolume: (volume: number) => void;
    setMapOutputDevice: (deviceId: string) => void;

    setViewState: (zoom: number, panX: number, panY: number) => void;
    setMapDimensions: (width: number, height: number) => void;
    resetView: () => void;
    mapWidth: number;
    mapHeight: number;
    
    // Projected state
    projectedMapUrl: string | null;
    projectedIsVideo: boolean;
    projectedFogDataUrl: string | null;
    projectedTokens: MapToken[];
    projectedPings: MapPing[];
    projectedMagicEffects: MagicEffect[];
    projectedDangerZones: DangerZone[];

    projectedWeatherType: WeatherType;
    projectedWeatherIntensity: number;
    projectedTimeOfDay: TimeOfDay;
    projectedMapWidth: number;
    projectedMapHeight: number;
    projectedIsGridEnabled: boolean;
    projectedGridSize: number;
    projectedGridColor: string;
    projectedGridOpacity: number;
    projectedIsMapMuted: boolean;
    projectedMapVolume: number;

    projectionTarget: 'hub' | 'monitor' | null;
    syncToPlayers: () => void;
    clearProjectedState: () => void;

    // Map Presets
    mapPresets: MapPreset[];
    saveCurrentAsPreset: (name: string) => void;
    loadPreset: (id: string) => void;
    deletePreset: (id: string) => void;

    // These specific UI-related fields are kept in MapStore for projection parity but edited via UIStore usually
    dangerShape: 'circle' | 'rect' | 'line' | 'cone';
    setDangerShape: (shape: 'circle' | 'rect' | 'line' | 'cone') => void;
    auraOverride: boolean;
    setAuraOverride: (val: boolean) => void;
    difficultTerrainOverride: boolean;
    setDifficultTerrainOverride: (val: boolean) => void;
    movementCostOverride: number;
    setMovementCostOverride: (val: number) => void;
    dangerRotation: number;
    setDangerRotation: (val: number) => void;
}

export const useMapStore = create<MapState>()(
    persist(
        (set, get) => ({
            mapUrl: null,
            mapName: null,
            isVideo: false,
            fogDataUrl: null,
            fogRegistry: {},
            layerVisibility: {
                fog: true,
                grid: true,
                tokens: true,
                magic: true,
                danger: true,
                weather: true,
                ambiance: true
            },
            tokens: [],
            pings: [],
            magicEffects: [],
            dangerZones: [],
            dangerZonePresets: [
                { id: 'preset-fire', name: 'Zone de Feu', color: '#ef4444', hueSceneId: 'fire-scene-id', audioAtmosphereId: 'fire-ambience-id' },
                { id: 'preset-poison', name: 'Nuage Toxique', color: '#10b981', hueSceneId: 'poison-scene-id', audioAtmosphereId: 'poison-ambience-id' },
                { id: 'preset-cold', name: 'Zone de Givre', color: '#3b82f6', hueSceneId: 'cold-scene-id', audioAtmosphereId: 'cold-ambience-id' }
            ],

            weatherType: 'none',
            weatherIntensity: 0.5,
            timeOfDay: 'day',
            mapWidth: 0,
            mapHeight: 0,

            isGridEnabled: false,
            gridSize: 50,
            gridColor: '#ffffff',
            gridOpacity: 0.2,

            zoom: 1,
            panX: 0,
            panY: 0,
            viewResetCounter: 0,

            isMapMuted: false,
            mapVolume: 0.5,
            mapOutputDeviceId: 'default',

            projectionTarget: null,
            projectedMapUrl: null,
            projectedIsVideo: false,
            projectedFogDataUrl: null,
            projectedTokens: [],
            projectedPings: [],
            projectedMagicEffects: [],
            projectedDangerZones: [],
            projectedWeatherType: 'none',
            projectedWeatherIntensity: 0.5,
            projectedTimeOfDay: 'day',
            projectedMapWidth: 0,
            projectedMapHeight: 0,
            projectedIsGridEnabled: false,
            projectedGridSize: 50,
            projectedGridColor: '#ffffff',
            projectedGridOpacity: 0.2,
            projectedIsMapMuted: false,
            projectedMapVolume: 0.5,

            setMap: async (mapUrl: string | null, isVideo = false, mapName = 'Sans titre', narrativeDescription?: string) => {
                const state = get();
                
                // Load fog from IndexedDB instead of memory registry primarily
                let savedFog: string | null = null;
                if (mapUrl) {
                    savedFog = await fogDB.getItem(mapUrl);
                    // Fallback to memory registry for legacy transition
                    if (!savedFog) savedFog = state.fogRegistry[mapUrl];
                }

                set({ mapUrl, isVideo, mapName, fogDataUrl: savedFog || null });
                
                if (mapUrl) {
                    useJournalStore.getState().addEvent({
                        type: 'LOCATION',
                        title: `🗺️ Carte chargée: ${mapName}`,
                        content: narrativeDescription || `Le MJ a chargé la carte "${mapName}".`
                    });
                }
                if (get().projectionTarget) get().syncToPlayers();
            },

            setFogDataUrl: async (fogDataUrl: string | null) => {
                const mapUrl = get().mapUrl;
                if (!mapUrl) return;

                const updatedRegistry = { ...get().fogRegistry };
                if (fogDataUrl) {
                    updatedRegistry[mapUrl] = fogDataUrl;
                    // Persist to IndexedDB
                    await fogDB.setItem(mapUrl, fogDataUrl);
                } else {
                    delete updatedRegistry[mapUrl];
                    await fogDB.removeItem(mapUrl);
                }

                set({ fogDataUrl, fogRegistry: updatedRegistry });
                if (get().projectionTarget) get().syncToPlayers();
            },

            addToken: (token: Omit<MapToken, 'id'>) => {
                const id = Math.random().toString(36).substring(2, 9);
                set(state => ({ tokens: [...state.tokens, { ...token, id, isVisible: true }] }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            updateToken: (id: string, updates: Partial<MapToken>) => {
                const oldToken = get().tokens.find(t => t.id === id);
                set(state => ({ tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t) }));
                if (oldToken && (updates.x !== undefined || updates.y !== undefined)) {
                    const dx = (updates.x ?? oldToken.x) - oldToken.x;
                    const dy = (updates.y ?? oldToken.y) - oldToken.y;
                    if (dx !== 0 || dy !== 0) {
                        set(state => ({
                            dangerZones: state.dangerZones.map(z => z.parentTokenId === id ? { ...z, x: z.x + dx, y: z.y + dy } : z)
                        }));
                    }
                }
                if (get().projectionTarget) get().syncToPlayers();
            },

            updateProjectedToken: (id: string, updates: Partial<MapToken>) => {
                set(state => ({
                    projectedTokens: state.projectedTokens.map(t => t.id === id ? { ...t, ...updates } : t),
                    tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t)
                }));
            },

            removeToken: (id: string) => {
                set(state => ({ tokens: state.tokens.filter(t => t.id !== id) }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            clearTokens: () => {
                set({ tokens: [] });
                if (get().projectionTarget) get().syncToPlayers();
            },

            addPing: (x: number, y: number, color: string) => {
                const id = Math.random().toString(36).substring(2, 9);
                const ping = { id, x, y, color, createdAt: Date.now() };
                set(state => ({ pings: [...state.pings, ping], projectedPings: [...state.projectedPings, ping] }));
                setTimeout(() => get().removePing(id), 3000);
            },

            removePing: (id: string) => set(state => ({
                pings: state.pings.filter(p => p.id !== id),
                projectedPings: state.projectedPings.filter(p => p.id !== id)
            })),

            addMagicEffect: (effect: Omit<MagicEffect, 'id'>) => {
                const id = Math.random().toString(36).substring(2, 9);
                set(state => ({ magicEffects: [...state.magicEffects, { ...effect, id }] }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            removeMagicEffect: (id: string) => {
                set(state => ({ magicEffects: state.magicEffects.filter(e => e.id !== id) }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            clearMagicEffects: () => {
                set({ magicEffects: [] });
                if (get().projectionTarget) get().syncToPlayers();
            },

            fogCommand: null,
            triggerFogCommand: (command: 'reveal_all' | 'hide_all' | null) => {
                set({ fogCommand: command });
                if (get().projectionTarget) get().syncToPlayers();
            },

            setMapMuted: (isMapMuted: boolean) => {
                set({ isMapMuted });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setMapVolume: (mapVolume: number) => {
                set({ mapVolume: Math.max(0, Math.min(1, mapVolume)) });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setMapOutputDevice: (mapOutputDeviceId: string) => set({ mapOutputDeviceId }),

            setWeather: (weatherType: WeatherType, weatherIntensity?: number) => {
                set(state => ({ weatherType, weatherIntensity: weatherIntensity ?? state.weatherIntensity }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            setTimeOfDay: (timeOfDay: TimeOfDay) => {
                const updates: Partial<MapState> = { timeOfDay };
                
                // Logic: Overcast increases weather intensity if not already high
                if (timeOfDay === 'overcast') {
                    updates.weatherIntensity = Math.max(0.7, get().weatherIntensity);
                }

                set(updates);
                if (get().projectionTarget) get().syncToPlayers();
            },

            setGridEnabled: (isGridEnabled: boolean) => {
                set({ isGridEnabled });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setGridSize: (gridSize: number) => {
                set({ gridSize });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setGridColor: (gridColor: string) => {
                set({ gridColor });
                if (get().projectionTarget) get().syncToPlayers();
            },
            setGridOpacity: (gridOpacity: number) => {
                set({ gridOpacity });
                if (get().projectionTarget) get().syncToPlayers();
            },

            setViewState: (zoom: number, panX: number, panY: number) => set({ zoom, panX, panY }),
            setMapDimensions: (mapWidth: number, mapHeight: number) => {
                set(state => ({ mapWidth, mapHeight, ...(state.projectionTarget ? { projectedMapWidth: mapWidth, projectedMapHeight: mapHeight } : {}) }));
            },

            resetView: () => set(state => ({ viewResetCounter: state.viewResetCounter + 1 })),

            syncToPlayers: () => {
                set(state => ({
                    projectionTarget: 'hub',
                    projectedMapUrl: state.mapUrl,
                    projectedIsVideo: state.isVideo,
                    projectedFogDataUrl: state.fogDataUrl,
                    projectedTokens: [...state.tokens],
                    projectedPings: [...state.pings],
                    projectedMagicEffects: [...state.magicEffects],
                    projectedWeatherType: state.weatherType,
                    projectedWeatherIntensity: state.weatherIntensity,
                    projectedTimeOfDay: state.timeOfDay,
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
            }),

            addDangerZone: (zone: Omit<DangerZone, 'id' | 'activeTokenIds'>) => {
                const id = Math.random().toString(36).substring(2, 9);
                set(state => ({ dangerZones: [...state.dangerZones, { ...zone, id, activeTokenIds: [] }] }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            updateDangerZone: (id: string, updates: Partial<DangerZone>) => {
                set(state => ({ dangerZones: state.dangerZones.map(z => z.id === id ? { ...z, ...updates } : z) }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            removeDangerZone: (id: string) => {
                set(state => ({ dangerZones: state.dangerZones.filter(z => z.id !== id) }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            clearDangerZones: () => {
                set({ dangerZones: [] });
                if (get().projectionTarget) get().syncToPlayers();
            },

            attachZoneToToken: (zoneId: string, tokenId: string | null) => {
                set(state => ({ dangerZones: state.dangerZones.map(z => z.id === zoneId ? { ...z, parentTokenId: tokenId || undefined, isAura: !!tokenId } : z) }));
                if (get().projectionTarget) get().syncToPlayers();
            },

            addDangerZonePreset: (preset: Omit<DangerZonePreset, 'id'>) => {
                const id = Math.random().toString(36).substring(2, 9);
                const newPreset = { ...preset, id };
                set(state => ({ dangerZonePresets: [...state.dangerZonePresets, newPreset] }));
                return newPreset;
            },

            removeDangerZonePreset: (id: string) => set(state => ({ dangerZonePresets: state.dangerZonePresets.filter(p => p.id !== id) })),
            updateDangerZonePreset: (id: string, updates: Partial<DangerZonePreset>) => set(state => ({ dangerZonePresets: state.dangerZonePresets.map(p => p.id === id ? { ...p, ...updates } : p) })),

            toggleLayer: (layerId: LayerId) => set(state => ({
                layerVisibility: { ...state.layerVisibility, [layerId]: !state.layerVisibility[layerId] }
            })),

            mapPresets: [],
            saveCurrentAsPreset: (name: string) => {
                const state = get();
                const newPreset: MapPreset = {
                    id: Math.random().toString(36).substring(2, 9),
                    name,
                    mapUrl: state.mapUrl,
                    mapName: state.mapName,
                    isVideo: state.isVideo,
                    tokens: state.tokens,
                    dangerZones: state.dangerZones,
                    magicEffects: state.magicEffects,
                    weatherType: state.weatherType,
                    weatherIntensity: state.weatherIntensity,
                    timeOfDay: state.timeOfDay,
                    isGridEnabled: state.isGridEnabled,
                    gridSize: state.gridSize,
                    gridColor: state.gridColor,
                    gridOpacity: state.gridOpacity,
                    fogDataUrl: state.fogDataUrl,
                    mapWidth: state.mapWidth,
                    mapHeight: state.mapHeight,
                    zoom: state.zoom,
                    panX: state.panX,
                    panY: state.panY,
                };
                set(state => ({ mapPresets: [...state.mapPresets, newPreset] }));
            },

            loadPreset: async (id: string) => {
                const preset = get().mapPresets.find(p => p.id === id);
                if (!preset) return;

                // Load fog from DB if missing in preset but available in DB for that URL
                let finalFog = preset.fogDataUrl;
                if (!finalFog && preset.mapUrl) {
                    finalFog = await fogDB.getItem(preset.mapUrl);
                }

                set({
                    mapUrl: preset.mapUrl,
                    mapName: preset.mapName,
                    isVideo: preset.isVideo,
                    tokens: preset.tokens,
                    dangerZones: preset.dangerZones,
                    magicEffects: preset.magicEffects,
                    weatherType: preset.weatherType,
                    weatherIntensity: preset.weatherIntensity,
                    timeOfDay: preset.timeOfDay || 'day',
                    isGridEnabled: preset.isGridEnabled,
                    gridSize: preset.gridSize,
                    gridColor: preset.gridColor,
                    gridOpacity: preset.gridOpacity,
                    fogDataUrl: finalFog,
                    mapWidth: preset.mapWidth,
                    mapHeight: preset.mapHeight,
                    zoom: preset.zoom,
                    panX: preset.panX,
                    panY: preset.panY,
                });
                if (get().projectionTarget) get().syncToPlayers();
            },

            deletePreset: (id: string) => set(state => ({ mapPresets: state.mapPresets.filter(p => p.id !== id) })),

            dangerShape: 'circle',
            setDangerShape: (dangerShape: 'circle' | 'rect' | 'line' | 'cone') => set({ dangerShape }),
            auraOverride: false,
            setAuraOverride: (auraOverride: boolean) => set({ auraOverride }),
            difficultTerrainOverride: false,
            setDifficultTerrainOverride: (difficultTerrainOverride: boolean) => set({ difficultTerrainOverride }),
            movementCostOverride: 2,
            setMovementCostOverride: (movementCostOverride: number) => set({ movementCostOverride }),
            dangerRotation: 0,
            setDangerRotation: (dangerRotation: number) => set({ dangerRotation }),
        }),
        {
            name: 'gmos-map-storage',
            version: 1,
            partialize: (state) => ({
                mapUrl: state.mapUrl,
                mapName: state.mapName,
                isVideo: state.isVideo,
                // fogDataUrl: Removed from persistence (Stored in IndexedDB)
                // fogRegistry: Removed from persistence
                layerVisibility: state.layerVisibility,
                tokens: state.tokens,
                weatherType: state.weatherType,
                weatherIntensity: state.weatherIntensity,
                timeOfDay: state.timeOfDay,
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
                projectionTarget: state.projectionTarget,
                mapPresets: state.mapPresets,
                isMapMuted: state.isMapMuted,
                mapVolume: state.mapVolume,
                mapOutputDeviceId: state.mapOutputDeviceId,
                projectedMapUrl: state.projectedMapUrl,
                projectedIsVideo: state.projectedIsVideo,
                projectedFogDataUrl: state.projectedFogDataUrl,
                projectedTokens: state.projectedTokens,
                projectedWeatherType: state.projectedWeatherType,
                projectedWeatherIntensity: state.projectedWeatherIntensity,
                projectedTimeOfDay: state.projectedTimeOfDay,
                projectedMapWidth: state.projectedMapWidth,
                projectedMapHeight: state.projectedMapHeight,
                projectedIsGridEnabled: state.projectedIsGridEnabled,
                projectedGridSize: state.projectedGridSize,
                projectedGridColor: state.projectedGridColor,
                projectedGridOpacity: state.projectedGridOpacity,
                projectedMagicEffects: state.projectedMagicEffects,
                projectedDangerZones: state.projectedDangerZones,
                projectedIsMapMuted: state.projectedIsMapMuted,
                projectedMapVolume: state.projectedMapVolume
            })
        }
    )
);

if (typeof window !== 'undefined') {
    (window as Window & { useMapStore?: any }).useMapStore = useMapStore;
}
