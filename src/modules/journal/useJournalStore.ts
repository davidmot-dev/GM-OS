import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JournalState, JournalEvent, Journal } from './types';

const formatDuration = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      journals: [],
      activeJournalId: null,
      isRecording: false,

      startJournal: (campaignName, sessionName, startSnapshot) => {
        const id = generateId();
        const now = Date.now();
        const actualSessionName = sessionName || 'Nouvelle Session';
        const title = `${campaignName} - ${actualSessionName}`;

        const newJournal: Journal = {
          id,
          title,
          startTimestamp: now,
          events: [],
        };

        set((state) => ({
          journals: [newJournal, ...state.journals],
          activeJournalId: id,
          isRecording: true,
        }));

        get().addEvent({
          type: 'SYSTEM',
          title: 'Début de session',
          content: `Session "${actualSessionName}" démarrée.`
        });
      },

      stopJournal: (snapshot) => {
        const { activeJournalId, journals, isRecording } = get();
        if (!activeJournalId || !isRecording) return;

        const now = Date.now();
        const journal = journals.find(j => j.id === activeJournalId);
        if (!journal) return;

        const durationMs = now - journal.startTimestamp;
        const durationStr = formatDuration(durationMs);

        get().addEvent({
          type: 'SYSTEM',
          title: 'Fin de session',
          content: 'Session terminée.'
        });

        set((state) => ({
          isRecording: false,
          journals: state.journals.map((j) => {
            if (j.id === activeJournalId) {
              return {
                ...j,
                endTimestamp: now,
                duration: durationStr,
              };
            }
            return j;
          }),
        }));
      },

      addEvent: (eventData) => set((state) => {
        if (!state.activeJournalId) return state;

        const newEvent: JournalEvent = {
          ...eventData,
          id: generateId(),
          timestamp: Date.now(),
        };

        return {
          journals: state.journals.map((j) => 
            j.id === state.activeJournalId 
              ? { ...j, events: [newEvent, ...j.events] } 
              : j
          )
        };
      }),

      removeEvent: (journalId, eventId) => set((state) => ({
        journals: state.journals.map((j) => 
          j.id === journalId 
            ? { ...j, events: j.events.filter((e) => e.id !== eventId) } 
            : j
        )
      })),

      updateEvent: (journalId, eventId, updates) => set((state) => ({
        journals: state.journals.map((j) => 
          j.id === journalId 
            ? { ...j, events: j.events.map((e) => e.id === eventId ? { ...e, ...updates } : e) } 
            : j
        )
      })),

      deleteJournal: (id) => set((state) => ({
        journals: state.journals.filter((j) => j.id !== id),
        activeJournalId: state.activeJournalId === id ? null : state.activeJournalId,
        isRecording: state.activeJournalId === id ? false : state.isRecording,
      })),

      setActiveJournal: (id) => set({ activeJournalId: id }),

      toggleRecording: (status) => set((state) => ({
        isRecording: status !== undefined ? status : !state.isRecording
      })),

      generateAISummary: async (journalId) => {
        // Mocked for now
        console.log("AI Summary requested for journal:", journalId);
      },

      syncToNotebook: async (journalId) => {
        // Mocked for now
        console.log("Notebook sync requested for journal:", journalId);
      },

      updateJournalNote: (journalId, note) => set((state) => ({
        journals: state.journals.map((j) => j.id === journalId ? { ...j, finalNote: note } : j)
      })),

      addJournal: (name) => {
        const id = generateId();
        const newJournal: Journal = {
          id,
          title: name,
          startTimestamp: Date.now(),
          events: [],
        };
        set((state) => ({
          journals: [newJournal, ...state.journals],
          activeJournalId: id,
        }));
      },

      clearJournal: () => set({ journals: [], activeJournalId: null, isRecording: false }),
    }),
    {
      name: 'journal-os-storage-v2',
    }
  )
);
