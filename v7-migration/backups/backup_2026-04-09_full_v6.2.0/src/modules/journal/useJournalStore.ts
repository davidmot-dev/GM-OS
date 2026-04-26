import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JournalState, JournalEvent, Journal } from './types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

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

      startJournal: (campaignName, sessionName = 'Nouvelle Session', startSnapshot) => {
        const id = uuidv4();
        const now = Date.now();
        const title = `${campaignName} - ${format(now, 'dd/MM HH:mm')} (${sessionName})`;

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
          title: 'Début de la Session',
          content: `${sessionName} lancée le ${format(now, 'dd/MM/yyyy à HH:mm:ss')}`
        });

        if (startSnapshot) {
          if (startSnapshot.presentPlayers && startSnapshot.presentPlayers.length > 0) {
            get().addEvent({
              type: 'SYSTEM',
              title: 'Joueurs Présents',
              content: `Membres du groupe actifs :\n${startSnapshot.presentPlayers.map(p => `- ${p}`).join('\n')}`
            });
          }

          if (startSnapshot.publicSummary) {
            get().addEvent({
              type: 'NOTE',
              title: 'Synopsis / Contexte Joueurs',
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
          title: 'Fin de la Session',
          content: `Session terminée le ${format(now, 'dd/MM/yyyy à HH:mm:ss')}`
        });

        get().addEvent({
          type: 'SYSTEM',
          title: 'Durée de jeu',
          content: `La session a duré : ${durationStr}`
        });

        // Process Snapshot Data
        if (snapshot) {
          if (snapshot.notes) {
            get().addEvent({
              type: 'NOTE',
              title: 'Notes de fin de session',
              content: snapshot.notes
            });
          }

          if (snapshot.presentPCs && snapshot.presentPCs.length > 0) {
            const pcContent = snapshot.presentPCs
              .map(pc => `- **${pc.name}**: ${pc.hp}/${pc.maxHp} HP (${pc.state})`)
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: 'État des Personnages (PJs)',
              content: `Personnages présents en fin de session :\n${pcContent}`
            });
          }

          if (snapshot.sessionEntities && snapshot.sessionEntities.length > 0) {
            const npcContent = snapshot.sessionEntities
              .map(npc => `- **${npc.name}**: ${npc.hp}/${npc.maxHp} HP (${npc.status})`)
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: 'État des PNJ / Monstres',
              content: `Entités actives en fin de session :\n${npcContent}`
            });
          }

          if (snapshot.pendingChecklist && snapshot.pendingChecklist.length > 0) {
            const checklistContent = snapshot.pendingChecklist
              .map(item => `- [ ] ${item}`)
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: 'Checklist restante',
              content: `Éléments non terminés :\n${checklistContent}`
            });
          }

          if (snapshot.clocks && snapshot.clocks.length > 0) {
            const clockContent = snapshot.clocks
              .map(c => `- **${c.name}**: ${c.filled}/${c.total} segments`)
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: 'État de Clock-OS',
              content: `Jauges actives :\n${clockContent}`
            });
          }

          if (snapshot.whiteboardSnapshot) {
            get().addEvent({
              type: 'SYSTEM',
              title: 'Sauvegarde Whiteboard',
              content: 'Une copie du Whiteboard a été archivée avec cette session.',
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
            title: '✨ Résumé Narratif (IA)',
            content: summary
          });
        } catch (err) {
          console.error("[JournalStore] AI Summary failed:", err);
          get().addEvent({
            type: 'SYSTEM',
            title: '⚠️ Échec du résumé IA',
            content: "Une erreur est survenue lors de la génération du résumé narratif."
          });
        }
      },

      syncToNotebook: async (journalId) => {
        const journal = get().journals.find(j => j.id === journalId);
        if (!journal) return;

        // Find the AI summary event
        const summaryEvent = journal.events.find(e => e.title === '✨ Résumé Narratif (IA)');
        if (!summaryEvent) {
          throw new Error("Aucun résumé IA trouvé pour ce journal.");
        }

        // Get notebook URL from SessionOS
        try {
          const { useSessionOSStore } = await import('../session/useSessionOSStore');
          const { campaigns, activeCampaignId } = useSessionOSStore.getState();
          const campaign = campaigns.find(c => c.id === activeCampaignId);

          if (!campaign?.notebookUrl) {
            throw new Error("Aucun Notebook configuré pour cette campagne.");
          }

          // Extract ID from URL: https://notebooklm.google.com/notebook/ID
          const notebookIdMatch = campaign.notebookUrl.match(/notebook\/([a-zA-Z0-9-]+)/);
          const notebookId = notebookIdMatch ? notebookIdMatch[1] : null;

          if (!notebookId) {
            throw new Error("URL Notebook invalide.");
          }

          // Call MCP tool (this would typically be handled by a service or directly if in a supported environment)
          // Since we are in the frontend, we'd need a bridge or a direct call if the MCP is exposed.
          // For now, we simulate the call via bridge or notify the user if we can't do it directly.
          console.log(`[JournalStore] Syncing to Notebook: ${notebookId}`);
          
          // Instruction: Use the notebooklm-mcp-server_notebook_add_text tool if possible.
          // In a real implementation, this would be an IPC call to the main process which has access to MCP.
          if (window.appBridge?.notebooklm?.addText) {
            await window.appBridge.notebooklm.addText(notebookId, summaryEvent.content, `Résumé Session: ${journal.title}`);
          } else {
            throw new Error("Interface NotebookLM non disponible.");
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
