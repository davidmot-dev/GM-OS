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
  content: string; // Fichier complet : frontmatter converti localement + corps
  systemId: string; // Pour le classement dans docs/systems/[systemId]
  forgedAt: number; // Timestamp de création
  slug: string; // Nom de fichier, tiré de la clé canonique du sujet
  sections: string[]; // Titres cités, entrée du résolveur titre → page
  /** Ce que la conversion n'a pas su faire — à lever avant d'enregistrer. */
  avertissements: string[];
}

/**
 * Les étapes de l'atelier.
 *
 * **`review` s'intercale entre la forge et l'écriture, et ce n'est pas un
 * confort.** Les artefacts qui portent le plus d'autorité sont ceux qui ont le
 * moins de revue : une fiche écrite dans `rules/` est aussitôt lue par le RAG et
 * citée en séance. Elle doit donc passer sous les yeux d'un humain avant, pas
 * après.
 */
export type BrainstormStep =
  | 'idle'
  | 'discovery'  // l'inventaire tourne, puis la liste des sujets du canevas
  | 'forging'    // une fiche en cours de rédaction
  | 'review'     // la fiche est là, rien n'est encore écrit sur le disque
  | 'saved'      // écrite dans docs/
  | 'personas';  // la passe personas : fiche de voix, puis les huit gemmes

/** Résultat de la passe personas, en attente de relecture. */
export interface PersonasEnRevue {
  voix: string;
  personas: Record<string, string>;
  avertissements: string[];
}

export interface BrainstormState {
  step: BrainstormStep;
  candidates: BrainstormCandidate[];
  activeCard: BrainstormCard | null;
  personas: PersonasEnRevue | null;
  isProcessing: boolean;
  error: string | null;
  notebookId: string | null;
  selectedSourceIds: string[];
  customSubject: string;
  /** Sujets dont une fiche a été rédigée, écrite ou non. */
  forgedCandidateIds: string[];
  /** Sujets dont la fiche est réellement sur le disque. */
  savedCandidateIds: string[];

  // Actions
  setNotebook: (id: string) => void;
  setSources: (ids: string[]) => void;
  setCustomSubject: (subject: string) => void;
  setStep: (step: BrainstormStep) => void;
  setProcessing: (isProcessing: boolean) => void;
  setCandidates: (candidates: BrainstormCandidate[]) => void;
  startDiscovery: () => void;
  startForging: () => void;
  reviewCard: (card: BrainstormCard) => void;
  markSaved: (candidateId: string) => void;
  startPersonas: () => void;
  setPersonas: (personas: PersonasEnRevue) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
