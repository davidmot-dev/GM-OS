import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    activeAtmosphereId: string;
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

    setPadFile: (padId: string, filePath: string, title: string) => void;
    setPadVolume: (padId: string, volume: number) => void;
    setPadColor: (padId: string, color: string) => void;
    setPadActive: (padId: string, isActive: boolean) => void;
    setPadMidiMapping: (padId: string, midiNote: number | null) => void;
    setPadKeyMapping: (padId: string, keyCode: string | null) => void;
    setPadLightLink: (padId: string, sceneId: string | null) => void;
    clearPad: (padId: string) => void;

    setMasterVolume: (volume: number) => void;
    setOutputDevice: (deviceId: string) => void;

    toggleMidiLearn: () => void;
    toggleKeyLearn: () => void;
    setActiveLearnPad: (id: string | null) => void;

    isMidiConnected: boolean;
    setMidiConnected: (connected: boolean) => void;

    stopAllPads: () => void;
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
        (set) => ({
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

            setPadFile: (padId, filePath, title) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? { ...a, pads: { ...a.pads, [padId]: { ...a.pads[padId], filePath, title } } }
                        : a
                )
            })),

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

            clearPad: (padId) => set((state) => ({
                atmospheres: state.atmospheres.map(a =>
                    a.id === state.activeAtmosphereId
                        ? {
                            ...a, pads: {
                                ...a.pads, [padId]: {
                                    ...a.pads[padId],
                                    title: '',
                                    filePath: null,
                                    isActive: false
                                }
                            }
                        }
                        : a
                )
            })),

            setMasterVolume: (masterVolume) => set({ masterVolume }),
            setOutputDevice: (outputDeviceId) => set({ outputDeviceId }),

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
            }))
        }),
        {
            name: 'gm-os-sound-storage',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Migrate from single 'pads' to 'atmospheres'
                    if (persistedState.pads && !persistedState.atmospheres) {
                        return {
                            ...persistedState,
                            atmospheres: [
                                { id: 'default', name: 'Exploration', pads: persistedState.pads }
                            ],
                            activeAtmosphereId: 'default',
                            pads: undefined // Remove old key
                        };
                    }
                }
                return persistedState;
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
