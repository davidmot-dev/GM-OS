import { create } from 'zustand';

interface SyncVolatileState {
    voiceLevel: number;
    setVoiceLevel: (level: number) => void;
}

export const useSyncStore = create<SyncVolatileState>((set) => ({
    voiceLevel: 0,
    setVoiceLevel: (voiceLevel) => set({ voiceLevel }),
}));

if (typeof window !== 'undefined') {
    (window as any).useSyncStore = useSyncStore;
}
