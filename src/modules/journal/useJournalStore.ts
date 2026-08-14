import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decrireLaSante } from '../combat/logic/SanteDuCombattant';
import type { JournalState, JournalEvent, Journal } from './types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import i18next from 'i18next';

const formatDuration = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      journals: [],
      activeJournalId: null,
      isRecording: false,

      startJournal: (campaignName, sessionName, startSnapshot) => {
        const id = uuidv4();
        const now = Date.now();
        const actualSessionName = sessionName || i18next.t('modules:journal.dashboard.new_session');
        const title = `${campaignName} - ${format(now, 'dd/MM HH:mm')} (${actualSessionName})`;

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

        // Initial SYSTEM events
        get().setActiveJournal(id); // Ensure we're targeting the new one
        
        get().addEvent({
          type: 'SYSTEM',
          title: i18next.t('modules:journal.events.session_start'),
          content: i18next.t('modules:journal.events.session_start_content', { 
            name: actualSessionName, 
            date: format(now, 'dd/MM/yyyy à HH:mm:ss') 
          })
        });

        if (startSnapshot) {
          if (startSnapshot.presentPlayers && startSnapshot.presentPlayers.length > 0) {
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.players_present'),
              content: i18next.t('modules:journal.events.players_present_content', { 
                players: startSnapshot.presentPlayers.map(p => `- ${p}`).join('\n')
              })
            });
          }

          if (startSnapshot.publicSummary) {
            get().addEvent({
              type: 'NOTE',
              title: i18next.t('modules:journal.events.synopsis'),
              content: startSnapshot.publicSummary
            });
          }
        }
      },

      stopJournal: (snapshot) => {
        const { activeJournalId, journals, isRecording } = get();
        if (!activeJournalId || !isRecording) return;

        const now = Date.now();
        const journal = journals.find(j => j.id === activeJournalId);
        if (!journal) return;

        const durationMs = now - journal.startTimestamp;
        const durationStr = formatDuration(durationMs);

        // Add termination events before stopping recording
        get().addEvent({
          type: 'SYSTEM',
          title: i18next.t('modules:journal.events.session_end'),
          content: i18next.t('modules:journal.events.session_end_content', { 
            date: format(now, 'dd/MM/yyyy à HH:mm:ss') 
          })
        });

        get().addEvent({
          type: 'SYSTEM',
          title: i18next.t('modules:journal.events.session_duration'),
          content: i18next.t('modules:journal.events.session_duration_content', { duration: durationStr })
        });

        // Process Snapshot Data
        if (snapshot) {
          if (snapshot.notes) {
            get().addEvent({
              type: 'NOTE',
              title: i18next.t('modules:journal.events.end_session_notes'),
              content: snapshot.notes
            });
          }

          if (snapshot.presentPCs && snapshot.presentPCs.length > 0) {
            const pcContent = snapshot.presentPCs
              // Le compte rendu n'annonce des points de vie que si le jeu en a.
              // Il écrivait « undefined/undefined HP » sur un jeu sans jauge.
              .map(pc => {
                const vie = decrireLaSante(pc);
                return `- **${pc.name}**${vie ? ` : ${vie}` : ''} (${pc.state})`;
              })
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.pc_status'),
              content: i18next.t('modules:journal.events.pc_status_content', { pcContent })
            });
          }

          if (snapshot.sessionEntities && snapshot.sessionEntities.length > 0) {
            const npcContent = snapshot.sessionEntities
              .map(npc => {
                const vie = decrireLaSante(npc);
                return `- **${npc.name}**${vie ? ` : ${vie}` : ''} (${npc.status})`;
              })
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.npc_status'),
              content: i18next.t('modules:journal.events.npc_status_content', { npcContent })
            });
          }

          if (snapshot.pendingChecklist && snapshot.pendingChecklist.length > 0) {
            const checklistContent = snapshot.pendingChecklist
              .map(item => `- [ ] ${item}`)
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.checklist_remaining'),
              content: i18next.t('modules:journal.events.checklist_remaining_content', { 
                checklist: checklistContent 
              })
            });
          }

          if (snapshot.clocks && snapshot.clocks.length > 0) {
            const clockContent = snapshot.clocks
              .map(c => `- **${c.name}**: ${c.filled}/${c.total} segments`)
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.clock_status'),
              content: i18next.t('modules:journal.events.clock_status_content', { clockContent })
            });
          }

          if (snapshot.whiteboardSnapshot) {
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.whiteboard_save'),
              content: i18next.t('modules:journal.events.whiteboard_save_content'),
              metadata: { whiteboardPaths: snapshot.whiteboardSnapshot }
            });
          }
        }

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
        if (!state.activeJournalId || (!state.isRecording && eventData.type !== 'NOTE' && eventData.type !== 'SYSTEM')) {
          return state;
        }

        const newEvent: JournalEvent = {
          ...eventData,
          id: uuidv4(),
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
        const journal = get().journals.find(j => j.id === journalId);
        if (!journal || journal.events.length === 0) return;

        try {
          const { aiService } = await import('../ai/AIService');
          const summary = await aiService.summarizeSession(journal.events);

          get().addEvent({
            type: 'SYSTEM',
            title: i18next.t('modules:journal.events.ai_summary'),
            content: summary
          });
        } catch (err) {
          console.error("[JournalStore] AI Summary failed:", err);
          get().addEvent({
            type: 'SYSTEM',
            title: i18next.t('modules:journal.events.ai_summary_failed'),
            content: i18next.t('modules:journal.events.ai_summary_error')
          });
        }
      },

      syncToNotebook: async (journalId) => {
        const journal = get().journals.find(j => j.id === journalId);
        if (!journal) return;

        // Find the AI summary event
        const summaryEvent = journal.events.find(e => e.title === i18next.t('modules:journal.events.ai_summary'));
        if (!summaryEvent) {
          throw new Error(i18next.t('modules:journal.messages.no_ai_summary'));
        }

        // Get notebook URL from SessionOS
        try {
          const { useSessionOSStore } = await import('../session/useSessionOSStore');
          const { campaigns, activeCampaignId } = useSessionOSStore.getState();
          const campaign = campaigns.find(c => c.id === activeCampaignId);

          if (!campaign?.notebookUrl) {
            throw new Error(i18next.t('modules:journal.messages.no_notebook'));
          }

          // Extract ID from URL: https://notebooklm.google.com/notebook/ID
          const notebookIdMatch = campaign.notebookUrl.match(/notebook\/([a-zA-Z0-9-]+)/);
          const notebookId = notebookIdMatch ? notebookIdMatch[1] : null;

          if (!notebookId) {
            throw new Error(i18next.t('modules:journal.messages.invalid_notebook_url'));
          }

          console.log(`[JournalStore] Syncing to Notebook: ${notebookId}`);
          
          if (window.appBridge?.mcp?.callTool) {
            // `source_add` remplace `notebook_add_text` depuis la bascule vers
            // le client Gemini Notebook, et prend ses arguments à plat plutôt
            // qu'enveloppés dans `request`.
            await window.appBridge.mcp.callTool('notebooklm-mcp-server', 'source_add', {
              notebook_id: notebookId,
              source_type: 'text',
              text: summaryEvent.content,
              title: `Résumé Session: ${journal.title}`
            });
          } else {
            throw new Error(i18next.t('modules:journal.messages.notebook_not_available'));
          }

        } catch (err: any) {
          console.error("[JournalStore] Sync failed:", err);
          throw err;
        }
      },

      updateJournalNote: (journalId, note) => set((state) => ({
        journals: state.journals.map((j) => j.id === journalId ? { ...j, finalNote: note } : j)
      })),

      addJournal: (name) => {
        const id = uuidv4();
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
      name: 'journal-os-storage-v2', // Versioned storage to avoid conflicts with previous schema
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).useJournalStore = useJournalStore;
}
