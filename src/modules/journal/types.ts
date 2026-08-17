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
  /**
   * Le résumé narratif, **artefact dérivé du journal et non événement dedans**.
   *
   * **Le défaut qu'il corrige** (§ 4.2 du plan de trame narrative, 2026-08-08,
   * corrigé le 2026-08-17) : le résumé était enregistré par `addEvent`, donc il
   * rejoignait `journal.events` — et `summarizeSession` prend `journal.events`
   * en entrée. **Régénérer le résumé lui réinjectait le résumé précédent**,
   * contamination récursive qui s'aggrave à chaque passe. Il était de surcroît
   * typé `SYSTEM`, donc destiné à être écarté par le futur filtre trace/récit :
   * il se serait exclu lui-même.
   *
   * **Pourquoi ici et non sur `GameSession.publicSummary`**, que le plan
   * suggérait : ce champ-là est écrit par le meneur et relu au démarrage de la
   * séance suivante comme synopsis. Y verser le résumé de l'IA écraserait le
   * texte du meneur, puis se réinjecterait comme point de départ de la suite —
   * la même boucle, déplacée d'un cran. Un résumé dérive du journal ; il vit
   * donc sur le journal.
   *
   * Les journaux d'avant n'en portent pas, et **on ne migre rien** : leur
   * « résumé » était la phrase d'excuse d'un fournisseur non géré. Les
   * régénérer est le seul geste qui ait un sens.
   */
  resumeIA?: string;
  /** Quand ce résumé a été produit — un résumé plus vieux que la séance se voit. */
  resumeGenereLe?: number;
}

/**
 * Données capturées lors de la fin d'une session pour archivage.
 */
export interface SessionSnapshot {
  notes?: string;
  /**
   * État des PJs présents.
   *
   * **`hp` et `maxHp` sont facultatifs depuis le 2026-08-14** : tous les jeux
   * ne comptent pas la santé en points, et le compte rendu écrivait `12/20 HP`
   * pour des personnages qui n'en ont pas — sur Alien, `undefined/undefined`.
   * Facultatifs plutôt que remplacés, pour que les séances déjà archivées
   * restent lisibles telles quelles.
   */
  presentPCs?: Array<{ name: string; hp?: number; maxHp?: number; state: string }>;
  /** État des PNJs et monstres en combat. Même règle sur les points de vie. */
  sessionEntities?: Array<{ name: string; hp?: number; maxHp?: number; status: string }>;
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
