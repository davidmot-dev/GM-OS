import { create } from 'zustand';
import type { BrainstormState, BrainstormStep, BrainstormCandidate, BrainstormCard } from '../types';

/**
 * Brainstorm Store
 * Gère le cycle de vie de la découverte et de la forge des règles.
 */
export const useBrainstormStore = create<BrainstormState>((set) => ({
  step: 'idle',
  candidates: [],
  activeCard: null,
  isProcessing: false,
  error: null,
  notebookId: null,
  selectedSourceIds: [],
  customSubject: '',

  setNotebook: (id) => set({ notebookId: id }),
  setSources: (ids) => set({ selectedSourceIds: ids }),
  setCustomSubject: (subject) => set({ customSubject: subject }),
  setStep: (step) => set({ step }),
  setProcessing: (isProcessing) => set({ isProcessing }),

  startDiscovery: () => set({ 
    step: 'discovery', 
    error: null,
    candidates: [],
    activeCard: null 
  }),

  setSubject: (subject) => set({
    customSubject: subject,
    step: 'listing', 
    isProcessing: false,
    error: null,
    candidates: []
  }),

  setCandidates: (candidates) => set({ 
    candidates, 
    step: 'listing', 
    isProcessing: false 
  }),

  startForging: (candidateId) => set({ 
    isProcessing: true, 
    step: 'forging',
    error: null 
  }),

  completeForge: (card) => set((state) => ({ 
    activeCard: card, 
    isProcessing: false,
    step: 'completed'
  })),

  setError: (error) => set({ 
    error, 
    isProcessing: false 
  }),

  reset: () => set({ 
    step: 'idle', 
    candidates: [], 
    activeCard: null, 
    error: null,
    isProcessing: false,
    selectedSourceIds: [],
    customSubject: ''
  })
}));
