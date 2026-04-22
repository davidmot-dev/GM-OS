/**
 * Brainstorm Module Types
 * Zero-Any policy enforced.
 */

export type BrainstormCategory = 'rule' | 'decision' | 'memory' | 'scenario';

export interface BrainstormCandidate {
  id: string; // Slug unique pour le nom de fichier
  title: string;
  category: BrainstormCategory;
  summary: string; // Courte description pour la sélection
  tags: string[];
}

export interface BrainstormCard extends BrainstormCandidate {
  content: string; // Contenu Markdown complet généré
  systemId: string; // Pour le classement dans docs/systems/[systemId]
  forgedAt: number; // Timestamp de création
}

export type BrainstormStep = 'idle' | 'discovery' | 'listing' | 'forging' | 'completed';

export interface BrainstormState {
  step: BrainstormStep;
  candidates: BrainstormCandidate[];
  activeCard: BrainstormCard | null;
  isProcessing: boolean;
  error: string | null;
  notebookId: string | null;
  selectedSourceIds: string[];
  customSubject: string;
  
  // Actions
  setNotebook: (id: string) => void;
  setSources: (ids: string[]) => void;
  setCustomSubject: (subject: string) => void;
  setStep: (step: BrainstormStep) => void;
  setProcessing: (isProcessing: boolean) => void;
  setSubject: (subject: string) => void;
  setCandidates: (candidates: BrainstormCandidate[]) => void;
  startDiscovery: () => void;
  startForging: (candidateId: string) => void;
  completeForge: (card: BrainstormCard) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
