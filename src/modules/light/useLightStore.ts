import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ----------------------
// Types & Interfaces
// ----------------------

export type ConnectionStatus = 'disconnected' | 'discovering' | 'pairing' | 'connected' | 'mock';

export interface HueLightState {
    on: boolean;
    bri: number; // 0-254
    xy?: [number, number]; // CIE color space
    ct?: number; // Color temperature
    effect?: string; // Software effect (e.g., 'none', 'candle', 'warp', 'police')
}

export interface HueLight {
    id: string;
    name: string;
    type: string;
    state: HueLightState;
}

export interface LightScene {
    id: string; // SCENE_01 to SCENE_18
    name: string;
    icon: string;
    color: string; // Tailwind hex or class for UI glow
    lightStates: Record<string, HueLightState>; // Snapshot of light states
    keyCode?: string; // For Key Learn
}

interface LightState {
    // Connection
    bridgeIp: string | null;
    username: string | null;
    status: ConnectionStatus;

    // Devices
    lights: Record<string, HueLight>;

    // Global Control
    globalBrightness: number; // 0 to 100%
    transitionTimeMs: number; // Transition time for scenes

    // Scenes
    scenes: Record<string, LightScene>;
    activeSceneId: string | null;
    lastManualSceneId: string | null;

    // Actions - Connection
    setConnection: (status: ConnectionStatus, ip?: string | null, username?: string | null) => void;

    // Actions - Devices
    setLights: (lights: Record<string, HueLight>) => void;
    updateLightState: (id: string, state: Partial<HueLightState>) => void;

    // Actions - Global
    setGlobalBrightness: (val: number) => void;
    setTransitionTime: (ms: number) => void;

    // Actions - Scenes
    saveSceneSnapshot: (sceneId: string, currentLights: Record<string, HueLight>) => void;
    updateSceneMetadata: (sceneId: string, name: string, icon: string, color: string) => void;
    setActiveScene: (sceneId: string | null, isAutomatic?: boolean) => void;
    clearScene: (sceneId: string) => void;
    isSyncEnabled: boolean;
    setSyncEnabled: (val: boolean) => void;
    applySnapshot: (snapshot: {
        activeSceneId?: string | null;
        globalBrightness?: number;
        scenes?: Record<string, LightScene>;
    }) => void;
    forgetBridge: () => void;
    reset: () => void;
}


// ----------------------
// Initial State
// ----------------------

const createDefaultScenes = (): Record<string, LightScene> => {
    const scenes: Record<string, LightScene> = {};
    for (let i = 1; i <= 18; i++) {
        const id = `SCENE_${i.toString().padStart(2, '0')}`;
        scenes[id] = {
            id,
            name: `Scene ${i}`,
            icon: 'wb_incandescent',
            color: '#334155', // slate-700
            lightStates: {}
        };
    }
    return scenes;
};

export const useLightStore = create<LightState>()(
    persist(
        (set) => ({
            bridgeIp: null,
            username: null,
            status: 'disconnected',

            lights: {},

            globalBrightness: 100,
            transitionTimeMs: 5000,

            scenes: createDefaultScenes(),
            activeSceneId: null,
            lastManualSceneId: null,
            isSyncEnabled: true, // Enabled by default

            setConnection: (status, ip, username) => set((state) => ({
                status,
                bridgeIp: ip !== undefined ? ip : state.bridgeIp,
                username: username !== undefined ? username : state.username
            })),

            setLights: (lights) => set({ lights }),

            updateLightState: (id, newState) => set((state) => {
                if (!state.lights[id]) return state;
                return {
                    lights: {
                        ...state.lights,
                        [id]: {
                            ...state.lights[id],
                            state: { ...state.lights[id].state, ...newState }
                        }
                    }
                };
            }),

            setGlobalBrightness: (val) => set({ globalBrightness: Math.max(0, Math.min(100, val)) }),

            setTransitionTime: (ms) => set({ transitionTimeMs: ms }),

            saveSceneSnapshot: (sceneId, currentLights) => set((state) => {
                const snapshot: Record<string, HueLightState> = {};
                Object.keys(currentLights).forEach(id => {
                    snapshot[id] = { ...currentLights[id].state };
                });
                return {
                    scenes: {
                        ...state.scenes,
                        [sceneId]: {
                            ...state.scenes[sceneId],
                            lightStates: snapshot
                        }
                    }
                };
            }),

            updateSceneMetadata: (sceneId, name, icon, color) => set((state) => ({
                scenes: {
                    ...state.scenes,
                    [sceneId]: {
                        ...state.scenes[sceneId],
                        name, icon, color
                    }
                }
            })),

            setActiveScene: (sceneId: string | null, isAutomatic = false) => set((state) => ({ 
                activeSceneId: sceneId,
                lastManualSceneId: isAutomatic ? state.lastManualSceneId : sceneId
            })),

            clearScene: (sceneId: string) => set((state) => ({
                scenes: {
                    ...state.scenes,
                    [sceneId]: {
                        ...state.scenes[sceneId],
                        name: `Scene ${parseInt(sceneId.split('_')[1])}`,
                        icon: 'wb_incandescent',
                        color: '#334155',
                        lightStates: {}
                    }
                }
            })),

            setSyncEnabled: (val: boolean) => set({ isSyncEnabled: val }),

            forgetBridge: () => set({
                bridgeIp: null,
                username: null,
                status: 'disconnected',
                lights: {}
            }),

            applySnapshot: (snapshot) => {

                if (!snapshot) return;

                // 1. Restore the structures (all 18 scenes metadata and light states)
                if (snapshot.scenes) {
                    set({ scenes: snapshot.scenes });
                }

                if (snapshot.globalBrightness !== undefined) {
                    set({ globalBrightness: snapshot.globalBrightness });
                }

                if (snapshot.activeSceneId) {
                    // We don't call HueEngine here directly to avoid circular deps or complex logic in store
                    // But we set the active scene which UI will reflect
                    set({ activeSceneId: snapshot.activeSceneId });
                }
            },

            reset: () => {
                set({
                    scenes: createDefaultScenes(),
                    activeSceneId: null,
                    lastManualSceneId: null,
                    globalBrightness: 100,
                    transitionTimeMs: 5000,
                    isSyncEnabled: true
                });
            }
        }),
        {
            name: 'gm-os-light-storage-v1',
            partialize: (state) => ({
                bridgeIp: state.bridgeIp,
                username: state.username,
                scenes: state.scenes,
                globalBrightness: state.globalBrightness,
                transitionTimeMs: state.transitionTimeMs,
                isSyncEnabled: state.isSyncEnabled,
                lastManualSceneId: state.lastManualSceneId
            })
        }
    )
);

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as { useLightStore: typeof useLightStore }).useLightStore = useLightStore;
}
