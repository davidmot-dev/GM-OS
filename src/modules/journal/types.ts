export type JournalEventType = 
  | 'AUDIO' 
  | 'COMBAT' 
  | 'NPC' 
  | 'LOCATION' 
  | 'NOTE' 
  | 'SYSTEM'
  | 'ORACLE';

export interface JournalEvent {
  id: string;
  timestamp: number;
  type: JournalEventType;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  isFavorite?: boolean;
}

export interface Journal {
  id: string;
  title: string;
  startTimestamp: number;
  endTimestamp?: number;
  duration?: string;
  events: JournalEvent[];
  finalNote?: string; // New field for user final thoughts
}

export interface SessionSnapshot {
  notes?: string;
  presentPCs?: Array<{ name: string; hp: number; maxHp: number; state: string }>;
  sessionEntities?: Array<{ name: string; hp: number; maxHp: number; status: string }>;
  pendingChecklist?: string[];
  clocks?: Array<{ name: string; filled: number; total: number }>;
  whiteboardSnapshot?: any; // DrawingPath[]
}

export interface SessionStartSnapshot {
  presentPlayers?: string[];
  publicSummary?: string;
}

export interface JournalState {
  journals: Journal[];
  activeJournalId: string | null;
  isRecording: boolean;
  
  // Actions
  startJournal: (campaignName: string, sessionName?: string, startSnapshot?: SessionStartSnapshot) => void;
  stopJournal: (snapshot?: SessionSnapshot) => void;
  addJournal: (name: string) => void;
  setActiveJournal: (id: string | null) => void;
  deleteJournal: (id: string) => void;
  addEvent: (event: Omit<JournalEvent, 'id' | 'timestamp'>) => void;
  removeEvent: (journalId: string, eventId: string) => void;
  updateEvent: (journalId: string, eventId: string, updates: Partial<JournalEvent>) => void;
  toggleRecording: (status?: boolean) => void;
  generateAISummary: (journalId: string) => Promise<void>;
  syncToNotebook: (journalId: string) => Promise<void>;
  updateJournalNote: (journalId: string, note: string) => void;
  clearJournal: () => void;
}
