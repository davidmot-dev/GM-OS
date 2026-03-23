/**
 * Types d'événements enregistrables dans le journal.
 */
export type JournalEventType = 
  | 'AUDIO' 
  | 'COMBAT' 
  | 'NPC' 
  | 'LOCATION' 
  | 'NOTE' 
  | 'SYSTEM'
  | 'ORACLE';

/**
 * Représente un événement unique dans le journal de session.
 */
export interface JournalEvent {
  id: string;
  /** Timestamp UNIX de l'événement */
  timestamp: number;
  /** Catégorie de l'événement pour le filtrage et les icônes */
  type: JournalEventType;
  /** Titre court de l'événement */
  title: string;
  /** Contenu textuel ou Markdown */
  content: string;
  /** Données additionnelles (ex: URLs d'images, IDs d'entités) */
  metadata?: Record<string, unknown>;
  /** État de favori pour l'affichage rapide */
  isFavorite?: boolean;
}

/**
 * Journal d'une session de jeu complète.
 */
export interface Journal {
  id: string;
  /** Titre généré (ex: "Campagne - Date (Session)") */
  title: string;
  /** Heure de début de l'enregistrement */
  startTimestamp: number;
  /** Heure de fin (si terminée) */
  endTimestamp?: number;
  /** Durée formatée (HH:mm:ss) */
  duration?: string;
  /** Liste chronologique des événements */
  events: JournalEvent[];
  /** Notes finales de conclusion du MJ */
  finalNote?: string; 
}

/**
 * Données capturées lors de la fin d'une session pour archivage.
 */
export interface SessionSnapshot {
  notes?: string;
  /** État des PJs présents */
  presentPCs?: Array<{ name: string; hp: number; maxHp: number; state: string }>;
  /** État des PNJs et monstres en combat */
  sessionEntities?: Array<{ name: string; hp: number; maxHp: number; status: string }>;
  /** Éléments de la checklist non cochés */
  pendingChecklist?: string[];
  /** État des jauges de tension (Clock-OS) */
  clocks?: Array<{ name: string; filled: number; total: number }>;
  /** Données vectorielles du Whiteboard */
  whiteboardSnapshot?: unknown; 
}

/**
 * Données initiales pour le début d'une session.
 */
export interface SessionStartSnapshot {
  presentPlayers?: string[];
  publicSummary?: string;
}

/**
 * Interface d'état globale pour le Journal-OS.
 */
export interface JournalState {
  /** Historique complet des journaux enregistrés */
  journals: Journal[];
  /** ID du journal en cours d'enregistrement ou de consultation */
  activeJournalId: string | null;
  /** Indique si une session est actuellement en cours d'enregistrement */
  isRecording: boolean;
  
  // Actions
  /** Démarre un nouvel enregistrement de session avec snapshot initial */
  startJournal: (campaignName: string, sessionName?: string, startSnapshot?: SessionStartSnapshot) => void;
  /** Termine l'enregistrement en cours et capture l'état final du système */
  stopJournal: (snapshot?: SessionSnapshot) => void;
  /** Crée un journal vide manuellement */
  addJournal: (name: string) => void;
  /** Définit le journal actif pour l'affichage */
  setActiveJournal: (id: string | null) => void;
  /** Supprime définitivement un journal */
  deleteJournal: (id: string) => void;
  /** Ajoute un nouvel événement au journal actif */
  addEvent: (event: Omit<JournalEvent, 'id' | 'timestamp'>) => void;
  /** Supprime un événement spécifique */
  removeEvent: (journalId: string, eventId: string) => void;
  /** Met à jour un événement existant */
  updateEvent: (journalId: string, eventId: string, updates: Partial<JournalEvent>) => void;
  /** Active/Désactive l'état d'enregistrement */
  toggleRecording: (status?: boolean) => void;
  /** Génère un résumé narratif via LLM à partir des événements du journal */
  generateAISummary: (journalId: string) => Promise<void>;
  /** Synchronise le résumé IA vers un notebook externe (NotebookLM) */
  syncToNotebook: (journalId: string) => Promise<void>;
  /** Met à jour la note de fin de session */
  updateJournalNote: (journalId: string, note: string) => void;
  /** Vide tout l'historique des journaux */
  clearJournal: () => void;
}
