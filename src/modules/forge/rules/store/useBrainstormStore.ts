import { create } from 'zustand';
import type { BrainstormState } from '../types';

/**
 * Brainstorm Store
 * Gère le cycle de vie de l'inventaire, de la forge des fiches et de la
 * passe personas.
 *
 * **La forge et l'écriture sont deux états distincts** (`review` puis `saved`) :
 * rien ne part sur le disque sans passer devant un humain.
 */
export const useBrainstormStore = create<BrainstormState>((set) => ({
  step: 'idle',
  candidates: [],
  activeCard: null,
  personas: null,
  isProcessing: false,
  error: null,
  notebookId: null,
  selectedSourceIds: [],
  customSubject: '',
  forgedCandidateIds: [],
  savedCandidateIds: [],

  setNotebook: (id) => set({ notebookId: id }),
  setSources: (ids) => set({ selectedSourceIds: ids }),
  setCustomSubject: (subject) => set({ customSubject: subject }),
  setStep: (step) => set({ step }),
  setProcessing: (isProcessing) => set({ isProcessing }),

  startDiscovery: () => set({
    step: 'discovery',
    error: null,
    candidates: [],
    activeCard: null,
    personas: null,
  }),

  setCandidates: (candidates) => set({
    candidates,
    isProcessing: false
  }),

  startForging: () => set({
    isProcessing: true,
    step: 'forging',
    activeCard: null,
    error: null
  }),

  // La fiche existe, elle n'est pas écrite. C'est ici que la relecture a lieu.
  reviewCard: (card) => set((state) => ({
    activeCard: card,
    isProcessing: false,
    step: 'review',
    forgedCandidateIds: state.forgedCandidateIds.includes(card.id)
      ? state.forgedCandidateIds
      : [...state.forgedCandidateIds, card.id]
  })),

  markSaved: (candidateId) => set((state) => ({
    step: 'saved',
    isProcessing: false,
    savedCandidateIds: state.savedCandidateIds.includes(candidateId)
      ? state.savedCandidateIds
      : [...state.savedCandidateIds, candidateId]
  })),

  startPersonas: () => set({
    step: 'personas',
    isProcessing: true,
    error: null,
    personas: null
  }),

  setPersonas: (personas) => set({
    personas,
    step: 'personas',
    isProcessing: false
  }),

  setError: (error) => set({
    error,
    isProcessing: false
  }),

  reset: () => set({
    step: 'idle',
    candidates: [],
    activeCard: null,
    personas: null,
    error: null,
    isProcessing: false,
    selectedSourceIds: [],
    customSubject: '',
    forgedCandidateIds: [],
    savedCandidateIds: []
  })
}));
