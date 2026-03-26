import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { soundEngine } from './SoundEngine';

export interface SoundPad {
    id: string; // PAD_01 to PAD_16
    title: string;
    filePath: string | null;
    volume: number; // 0.0 to 1.5
    color: string;
    midiMapping: number | null; // e.g., 36 for C1
    keyMapping: string | null; // e.g., 'KeyA'
    isActive: boolean;
    linkedLightSceneId: string | null;
}

export interface Atmosphere {
    id: string;
    name: string;
    pads: Record<string, SoundPad>;
}

interface SoundState {
    atmospheres: Atmosphere[];
    activeAtmosphereId: string | null;
    masterVolume: number; // 0.0 to 1.0
    outputDeviceId: string | 'default';

    // UI State
    isMidiLearnActive: boolean;
    isKeyLearnActive: boolean;
    activePadLearnId: string | null;

    // Actions
    addAtmosphere: (name: string) => void;
    removeAtmosphere: (id: string) => void;
    setActiveAtmosphereId: (id: string) => void;
    renameAtmosphere: (id: string, name: string) => void;

    setPadFile: (padId: string, filePath: string, title: string, atmosphereId?: string) => void;
    setPadVolume: (padId: string, volume: number) => void;
    setPadColor: (padId: string, color: string) => void;
    setPadActive: (padId: string, isActive: boolean) => void;
    setPadMidiMapping: (padId: string, midiNote: number | null) => void;
    setPadKeyMapping: (padId: string, keyCode: string | null) => void;
    setPadLightLink: (padId: string, sceneId: string | null) => void;
    renamePad: (padId: string, title: string) => void;
    clearPad: (padId: string) => void;
    triggerPad: (padId: string) => Promise<void>;

    setMasterVolume: (volume: number) => void;
    setOutputDevice: (deviceId: string) => void;

    toggleMidiLearn: () => void;
    toggleKeyLearn: () => void;
    setActiveLearnPad: (id: string | null) => void;

    isMidiConnected: boolean;
    setMidiConnected: (connected: boolean) => void;

    stopAllPads: () => void;
    applySnapshot: (snapshot: {
        activeAtmosphereId?: string | null;
        masterVolume?: number;
        activePadIds?: string[];
        atmospheres?: Atmosphere[];
    }) => Promise<void>;
    reset: () => void;
}

const createEmptyPads = (): Record<string, SoundPad> => {
    const pads: Record<string, SoundPad> = {};
    for (let i = 1; i <= 16; i++) {
        const id = `PAD_${i.toString().padStart(2, '0')}`;
        pads[id] = {
            id,
            title: '',
            filePath: null,
            volume: 1.0,
            color: 'var(--electric-violet)',
            midiMapping: null,
            keyMapping: null,
            isActive: false,
            linkedLightSceneId: null
        };
    }
    return pads;
};

export const useSoundStore = create<SoundState>()(
    persist(
        (set, get) => ({
            atmospheres: [
                { id: 'default', name: 'Exploration', pads: createEmptyPads() }
            ],
            activeAtmosphereId: 'default',
            masterVolume: 1.0,
            outputDeviceId: 'default',

            isMidiLearnActive: false,
            isKeyLearnActive: false,
            activePadLearnId: null,

            addAtmosphere: (name) => set((state) => ({
                atmospheres: [
                    ...state.atmospheres,
                    { id: crypto.randomUUID(), name, pads: createEmptyPads() }
                ]
            })),

            removeAtmosphere: (id) => set((state) => {
                const newAtmos = state.atmospheres.filter(a => a.id !== id);
                if (newAtmos.length === 0) {
                    newAtmos.push({ id: 'default', name: 'Exploration', pads: createEmptyPads() });
                }
                return {
                    atmospheres: newAtmos,
                    activeAtmosphereId: state.activeAtmosphereId === id ? newAtmos[0].id : state.activeAtmosphereId
                };
            }),

            setActiveAtmosphereId: (id) => set({ activeAtmosphereId: id }),

            renameAtmosphere: (id, name) => set((state) => ({
                atmospheres: state.atmospheres.map(a => a.id === id ? { ...a, name } : a)
            })),

            setPadFile: (padId, filePath, title, atmosphereId) => set((state) => {
                const targetAtmosId = atmosphereId || state.activeAtmosphereId;
                const atmosExists = state.atmospheres.some(a => a.id === targetAtmosId);
                
                // Fallback to first atmosphere if target doesn't exist
                const finalAtmosId = atmosExists ? (targetAtmosId as string) : state.atmospheres[0].id;

                return {
                    atmospheres: state.atmospheres.map(a =>
                        a.id === finalAtmosId
                            ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], filePath, title } } }
                            : a
                    )
                };
            }),

            setPadVolume: (padId, volume) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], volume } } }
                        : a
                )
            })),

            setPadColor: (padId, color) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], color } } }
                        : a
                )
            })),

            setPadActive: (padId, isActive) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], isActive } } }
                        : a
                )
            })),

            setPadMidiMapping: (padId, midiNote) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], midiMapping: midiNote } } }
                        : a
                )
            })),

            setPadKeyMapping: (padId, keyCode) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], keyMapping: keyCode } } }
                        : a
                )
            })),

            setPadLightLink: (padId, sceneId) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], linkedLightSceneId: sceneId } } }
                        : a
                )
            })),

            renamePad: (padId, title) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], title } } }
                        : a
                )
            })),

            clearPad: (padId) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? {
                            ...a, pads: {
                                ...a.pads, [padId]: {
                                    ...a.pads[padId],
                                    title: '',
                                    filePath: null,
                                    isActive: false,
                                    linkedLightSceneId: null,
                                    keyMapping: null,
                                    midiMapping: null,
                                    volume: 1.0
                                }
                            }
                        }
                        : a
                )
            })),

            triggerPad: async (padId) => {
                const atmosId = get().activeAtmosphereId;
                const activeAtmos = get().atmospheres.find(a => a.id === atmosId);
                const pad = activeAtmos?.pads[padId];

                if (pad && pad.filePath) {
                    try {
                        // Mark as active in store
                        get().setPadActive(padId, true);
                        // Load and Play
                        await soundEngine.loadAudio(padId, pad.filePath);
                        soundEngine.play(padId, pad.volume);
                    } catch (err) {
                        console.error(`[SoundStore] Trigger failed for pad ${padId}:`, err);
                    }
                }
            },

            setMasterVolume: (masterVolume) => set({ masterVolume }),
            setOutputDevice: (outputDeviceId) => {
                soundEngine.setOutputDevice(outputDeviceId);
                set({ outputDeviceId });
            },

            toggleMidiLearn: () => set((state) => ({ isMidiLearnActive: !state.isMidiLearnActive, isKeyLearnActive: false })),
            toggleKeyLearn: () => set((state) => ({ isKeyLearnActive: !state.isKeyLearnActive, isMidiLearnActive: false })),
            setActiveLearnPad: (id) => set({ activePadLearnId: id }),

            isMidiConnected: false,
            setMidiConnected: (isMidiConnected) => set({ isMidiConnected }),
            stopAllPads: () => set((state) => ({
                atmospheres: state.atmospheres.map(a => ({
                    ...a,
                    pads: Object.fromEntries(
                        Object.entries(a.pads).map(([key, pad]) => [key, { ...pad, isActive: false }])
                    )
                }))
            })),

            applySnapshot: async (snapshot) => {
                if (!snapshot) return;

                if (snapshot.masterVolume !== undefined) get().setMasterVolume(snapshot.masterVolume);
                
                // 1. Restore the structures (atmospheres and pads)
                if (snapshot.atmospheres) {
                    set({ atmospheres: snapshot.atmospheres });
                }

                if (snapshot.activeAtmosphereId !== undefined) {
                    set({ activeAtmosphereId: snapshot.activeAtmosphereId });
                }
                const atmosId = get().activeAtmosphereId;

                // 2. Trigger Playback for active pads in the snapshot
                if (snapshot.activePadIds) {
                    const activeAtmos = get().atmospheres.find(a => a.id === atmosId);
                    if (activeAtmos) {
                        for (const padId of snapshot.activePadIds) {
                            const pad = activeAtmos.pads[padId];
                            if (pad && pad.filePath) {
                                try {
                                    // Ensure the pad is marked active in store
                                    set((state) => ({
                                        atmospheres: state.atmospheres.map(a =>
                                            a.id === atmosId
                                                ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], isActive: true } } }
                                                : a
                                        )
                                    }));
                                    // Load and play
                                    await soundEngine.loadAudio(padId, pad.filePath);
                                    soundEngine.play(padId, pad.volume);
                                } catch (e) {
                                    console.error(`[SoundStore] Failed to restore pad ${padId}:`, e);
                                }
                            }
                        }
                    }
                }
            },

            reset: () => {
                get().stopAllPads();
                set({
                    atmospheres: [
                        { id: 'default', name: 'Exploration', pads: createEmptyPads() }
                    ],
                    activeAtmosphereId: 'default',
                    masterVolume: 1.0,
                    isMidiLearnActive: false,
                    isKeyLearnActive: false,
                    activePadLearnId: null
                });
            }
        }),
        {
            name: 'gm-os-sound-storage',
            migrate: (persistedState: unknown, version: number) => {
                const state = persistedState as Record<string, unknown>;
                if (version === 0) {
                    // Migrate from single 'pads' to 'atmospheres'
                    if (state.pads && !state.atmospheres) {
                        return {
                            ...state,
                            atmospheres: [
                                { id: 'default', name: 'Exploration', pads: state.pads }
                            ],
                            activeAtmosphereId: 'default',
                            pads: undefined // Remove old key
                        };
                    }
                }
                return state;
            },
            version: 1,
            partialize: (state) => ({
                atmospheres: state.atmospheres,
                activeAtmosphereId: state.activeAtmosphereId,
                masterVolume: state.masterVolume,
                outputDeviceId: state.outputDeviceId
            })
        }
    )
);
// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as { useSoundStore: typeof useSoundStore }).useSoundStore = useSoundStore;
}
