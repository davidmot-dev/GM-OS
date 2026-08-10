import { create } from 'zustand';
import type { BrainstormState } from '../types';

/**
 * Le carnet ne tient qu'une conversation à la fois.
 *
 * **Mesuré en réel le 2026-08-10** : trois inventaires identiques partis dans la
 * même milliseconde, et sur six requêtes lancées, quatre ne sont jamais
 * revenues. La cause n'était pas une double exécution d'effet mais un **double
 * montage** — `BrainstormOverlay` était rendu à la fois par `App.tsx` et par
 * `ForgeDashboard`. Deux instances, deux `useRef`, deux effets : aucun garde-fou
 * porté par le composant ne pouvait les départager.
 *
 * D'où un verrou **de module** : il est partagé par toutes les instances, quelle
 * que soit la façon dont l'arbre est monté demain. Et il est posé de façon
 * synchrone — un état de store n'aurait rien protégé, puisqu'il n'est visible
 * qu'au rendu suivant, quand les requêtes concurrentes sont déjà parties.
 *
 * Hors du store proprement dit : ce n'est pas de l'état d'affichage, rien ne
 * doit se redessiner quand il change.
 */
let carnetOccupe = false;

/** Rend `false` si une requête est déjà en vol. À appeler avant tout `await`. */
export function reserverLeCarnet(): boolean {
  if (carnetOccupe) return false;
  carnetOccupe = true;
  return true;
}

export function libererLeCarnet(): void {
  carnetOccupe = false;
}

/** Pour les tests : remet le verrou à zéro sans passer par une requête. */
export function carnetEstOccupe(): boolean {
  return carnetOccupe;
}

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
