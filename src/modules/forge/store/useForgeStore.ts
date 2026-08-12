import { create } from 'zustand';
import type { ForgeContextItem, ForgeSystemResult } from '../ForgeService';

/** D'où vient le pilote affiché : des documents déposés, ou des fiches du corpus. */
export type SourceDeForge = 'documents' | 'corpus';

/** Un groupe de champs qu'aucune fiche n'a pu remplir. */
export interface LacuneDuPilote {
  groupe: string;
  raison: string;
}

interface ForgeState {
  step: 'idle' | 'analyzing' | 'review' | 'completed';
  contextItems: ForgeContextItem[];
  analysisResult: ForgeSystemResult | null;
  isProcessing: boolean;
  error: string | null;
  targetSystemName: string;
  userInstructions: string;

  /** Ce qui tourne, ou ce qui a produit le résultat affiché. */
  source: SourceDeForge | null;
  /**
   * Où en est la dérivation, groupe par groupe.
   *
   * Huit groupes à deux minutes trente font un quart d'heure : sans compteur,
   * l'écran ne distingue pas « ça avance » de « c'est mort ».
   */
  progression: { label: string; rang: number; total: number } | null;
  /**
   * Les groupes qu'aucune fiche n'a couverts — **le journal des lacunes du
   * pilote**. Il survit à la forge : c'est lui qui dit ce que l'Atelier doit
   * documenter avant de reforger.
   */
  lacunes: LacuneDuPilote[];
  /** Vrai quand on a demandé l'arrêt ; la boucle s'arrête au groupe suivant. */
  arretDemande: boolean;

  // Actions
  addContextItem: (item: ForgeContextItem) => void;
  removeContextItem: (index: number) => void;
  setInstructions: (text: string) => void;
  setTargetName: (name: string) => void;
  setAnalysisResult: (result: ForgeSystemResult | null) => void;
  startAnalysis: (source?: SourceDeForge) => void;
  setProgression: (progression: ForgeState['progression']) => void;
  demanderArret: () => void;
  completeAnalysis: (result: ForgeSystemResult, lacunes?: LacuneDuPilote[]) => void;
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
  source: null,
  progression: null,
  lacunes: [],
  arretDemande: false,

  addContextItem: (item) => set((state) => ({
    contextItems: [...state.contextItems, item]
  })),

  removeContextItem: (index) => set((state) => ({
    contextItems: state.contextItems.filter((_, i) => i !== index)
  })),

  setInstructions: (text) => set({ userInstructions: text }),

  setTargetName: (name) => set({ targetSystemName: name }),

  setAnalysisResult: (result) => set({ analysisResult: result }),

  startAnalysis: (source = 'documents') => set({
    isProcessing: true,
    step: 'analyzing',
    error: null,
    source,
    progression: null,
    lacunes: [],
    arretDemande: false,
  }),

  setProgression: (progression) => set({ progression }),

  demanderArret: () => set({ arretDemande: true }),

  // Les lacunes ne sont pas remplacées par défaut : une forge par documents n'en
  // produit aucune, et elle ne doit pas effacer celles d'une dérivation.
  completeAnalysis: (result, lacunes) => set((state) => ({
    analysisResult: result,
    isProcessing: false,
    step: 'review',
    progression: null,
    arretDemande: false,
    lacunes: lacunes ?? state.lacunes,
  })),

  setError: (error) => set({
    error,
    isProcessing: false,
    progression: null,
    arretDemande: false,
  }),

  /**
   * Vide la forge après l'enregistrement — **sauf le journal des lacunes**.
   *
   * C'est la seule trace de ce que le corpus ne couvrait pas, et elle sert
   * précisément *après* l'enregistrement : elle dit quelles fiches l'Atelier
   * doit produire avant de reforger. Une nouvelle dérivation la remplace.
   */
  reset: () => set({
    step: 'idle',
    contextItems: [],
    analysisResult: null,
    isProcessing: false,
    error: null,
    targetSystemName: '',
    userInstructions: '',
    source: null,
    progression: null,
    arretDemande: false,
  }),

  stopAnalysis: () => set({
    isProcessing: false,
    step: 'idle',
    progression: null,
    arretDemande: false,
  })
}));
