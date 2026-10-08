import { create } from 'zustand';
import { exposerMagasinDuHub } from '../utils/magasinsDuHub';

interface SyncVolatileState {
    voiceLevel: number;
    setVoiceLevel: (level: number) => void;
}

export const useSyncStore = create<SyncVolatileState>((set) => ({
    voiceLevel: 0,
    setVoiceLevel: (voiceLevel) => set({ voiceLevel }),
}));

exposerMagasinDuHub('useSyncStore', useSyncStore);
