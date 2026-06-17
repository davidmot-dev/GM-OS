import { create } from 'zustand';
import type { ForgeContextItem, ForgeSystemResult } from '../ForgeService';

interface ForgeState {
  step: 'idle' | 'analyzing' | 'review' | 'completed';
  contextItems: ForgeContextItem[];
  analysisResult: ForgeSystemResult | null;
  isProcessing: boolean;
  error: string | null;
  targetSystemName: string;
  userInstructions: string;

  // Actions
  addContextItem: (item: ForgeContextItem) => void;
  removeContextItem: (index: number) => void;
  setInstructions: (text: string) => void;
  setTargetName: (name: string) => void;
  setAnalysisResult: (result: ForgeSystemResult | null) => void;
  startAnalysis: () => void;
  completeAnalysis: (result: ForgeSystemResult) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  stopAnalysis: () => void;
}

export const useForgeStore = create<ForgeState>((set) => ({
  step: 'idle',
  contextItems: [],
  analysisResult: null,
  isProcessing: false,
  error: null,
  targetSystemName: '',
  userInstructions: '',

  addContextItem: (item) => set((state) => ({ 
    contextItems: [...state.contextItems, item] 
  })),

  removeContextItem: (index) => set((state) => ({ 
    contextItems: state.contextItems.filter((_, i) => i !== index) 
  })),

  setInstructions: (text) => set({ userInstructions: text }),
  
  setTargetName: (name) => set({ targetSystemName: name }),

  setAnalysisResult: (result) => set({ analysisResult: result }),

  startAnalysis: () => set({ 
    isProcessing: true, 
    step: 'analyzing', 
    error: null 
  }),

  completeAnalysis: (result) => set({ 
    analysisResult: result, 
    isProcessing: false, 
    step: 'review' 
  }),

  setError: (error) => set({ 
    error, 
    isProcessing: false 
  }),

  reset: () => set({
    step: 'idle',
    contextItems: [],
    analysisResult: null,
    isProcessing: false,
    error: null,
    targetSystemName: '',
    userInstructions: ''
  }),

  stopAnalysis: () => set({
    isProcessing: false,
    step: 'idle'
  })
}));
