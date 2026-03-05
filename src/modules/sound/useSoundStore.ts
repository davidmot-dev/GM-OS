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

interface SoundState {
    pads: Record<string, SoundPad>;
    masterVolume: number; // 0.0 to 1.0
    outputDeviceId: string | 'default';

    // UI State
    isMidiLearnActive: boolean;
    isKeyLearnActive: boolean;
    activePadLearnId: string | null;

    // Actions
    setPadFile: (id: string, filePath: string, title: string) => void;
    setPadVolume: (id: string, volume: number) => void;
    setPadColor: (id: string, color: string) => void;
    setPadActive: (id: string, isActive: boolean) => void;
    setPadMidiMapping: (id: string, midiNote: number | null) => void;
    setPadKeyMapping: (id: string, keyCode: string | null) => void;
    setPadLightLink: (id: string, sceneId: string | null) => void;
    clearPad: (id: string) => void;

    setMasterVolume: (volume: number) => void;
    setOutputDevice: (deviceId: string) => void;

    toggleMidiLearn: () => void;
    toggleKeyLearn: () => void;
    setActiveLearnPad: (id: string | null) => void;

    stopAllPads: () => void;
}

const initializePads = (): Record<string, SoundPad> => {
    const pads: Record<string, SoundPad> = {};
    for (let i = 1; i <= 16; i++) {
        const id = `PAD_${i.toString().padStart(2, '0')}`;
        pads[id] = {
            id,
            title: '',
            filePath: null,
            volume: 1.0,
            color: 'var(--electric-violet)', // Default color from Stitch
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
            pads: initializePads(),
            masterVolume: 1.0,
            outputDeviceId: 'default',

            isMidiLearnActive: false,
            isKeyLearnActive: false,
            activePadLearnId: null,

            setPadFile: (id, filePath, title) => set((state) => ({
                pads: {
                    ...state.pads,
                    [id]: { ...state.pads[id], filePath, title }
                }
            })),

            setPadVolume: (id, volume) => set((state) => ({
                pads: {
                    ...state.pads,
                    [id]: { ...state.pads[id], volume }
                }
            })),

            setPadColor: (id, color) => set((state) => ({
                pads: {
                    ...state.pads,
                    [id]: { ...state.pads[id], color }
                }
            })),

            setPadActive: (id, isActive) => set((state) => ({
                pads: {
                    ...state.pads,
                    [id]: { ...state.pads[id], isActive }
                }
            })),

            setPadMidiMapping: (id, midiNote) => set((state) => ({
                pads: {
                    ...state.pads,
                    [id]: { ...state.pads[id], midiMapping: midiNote }
                }
            })),

            setPadKeyMapping: (id, keyCode) => set((state) => ({
                pads: {
                    ...state.pads,
                    [id]: { ...state.pads[id], keyMapping: keyCode }
                }
            })),

            setPadLightLink: (id, sceneId) => set((state) => ({
                pads: {
                    ...state.pads,
                    [id]: { ...state.pads[id], linkedLightSceneId: sceneId }
                }
            })),

            clearPad: (id) => set((state) => ({
                pads: {
                    ...state.pads,
                    [id]: {
                        ...state.pads[id],
                        title: '',
                        filePath: null,
                        isActive: false
                        // Intentionally keeping mappings and color to allow hot-swapping files into existing colored/mapped pads based on v3 analysis
                    }
                }
            })),

            setMasterVolume: (masterVolume) => set({ masterVolume }),
            setOutputDevice: (outputDeviceId) => set({ outputDeviceId }),

            toggleMidiLearn: () => set((state) => ({ isMidiLearnActive: !state.isMidiLearnActive, isKeyLearnActive: false })),
            toggleKeyLearn: () => set((state) => ({ isKeyLearnActive: !state.isKeyLearnActive, isMidiLearnActive: false })),
            setActiveLearnPad: (id) => set({ activePadLearnId: id }),

            stopAllPads: () => set((state) => {
                const newPads = { ...state.pads };
                Object.keys(newPads).forEach(key => {
                    newPads[key].isActive = false;
                });
                return { pads: newPads };
            })
        }),
        {
            name: 'gm-os-sound-storage',
            partialize: (state) => ({
                pads: state.pads,
                masterVolume: state.masterVolume,
                outputDeviceId: state.outputDeviceId
            })
        }
    )
);
