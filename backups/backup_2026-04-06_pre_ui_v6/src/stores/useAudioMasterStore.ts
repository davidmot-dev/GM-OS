import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioMasterState {
    masterVolume: number;
    isFocusMode: boolean;
    focusDuckingRatio: number;
    
    setMasterVolume: (volume: number) => void;
    toggleFocusMode: () => void;
    setFocusDuckingRatio: (ratio: number) => void;
    getBackupData: () => {
        masterVolume: number;
        isFocusMode: boolean;
        focusDuckingRatio: number;
    };
}

export const useAudioMasterStore = create<AudioMasterState>()(
    persist(
        (set, get) => ({
            masterVolume: 1.0,
            isFocusMode: false,
            focusDuckingRatio: 0.1,

            setMasterVolume: (masterVolume) => set({ masterVolume }),
            toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
            setFocusDuckingRatio: (focusDuckingRatio) => set({ focusDuckingRatio }),
            getBackupData: () => ({
                masterVolume: get().masterVolume,
                isFocusMode: get().isFocusMode,
                focusDuckingRatio: get().focusDuckingRatio
            })
        }),
        {
            name: 'gm-os-audio-master-storage',
        }
    )
);
