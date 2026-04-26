import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TacticalAIState } from './types';

export const useTacticalAIStore = create<TacticalAIState>()(
  persist(
    (set) => ({
      status: 'idle',
      settings: {
        intensity: 0.5,
        isMuted: false,
        autoApplyDispel: true,
        enableTacticalToasts: true,
        isEnabled: true,
      },
      secrets: {
        hueBridgeIp: '',
        hueUsername: '',
      },
      logs: [],
      activeAdvices: [],
      strategicNarration: '',
      hardwareStatus: {
        hue: 'disconnected',
        audio: 'missing',
      },
      isPanelOpen: false,

      setStatus: (status) => set({ status }),

      updateSettings: (newSettings) => 
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
        
      updateSecrets: (newSecrets) => 
        set((state) => ({ secrets: { ...state.secrets, ...newSecrets } })),
        
      addLog: (log) => 
        set((state) => ({ 
          logs: [...state.logs, { ...log, id: Math.random().toString(), timestamp: new Date().toISOString() }].slice(-50) 
        })),
        
      clearLogs: () => set({ logs: [] }),
      
      setAdvices: (advices) => set({ activeAdvices: advices }),
      
      setIsPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),

      setHardwareStatus: (status) =>
        set((state) => ({
          hardwareStatus: { ...state.hardwareStatus, ...status },
        })),

      requestTacticalAnalysis: async (combatantId?: string, macroContext?: string) => {
        const getStore = () => (useTacticalAIStore as any).getState() as TacticalAIState;

        set({ status: 'analyzing', strategicNarration: '', activeAdvices: [] });

        try {
          const { useCombatStore } = await import('../combat/useCombatStore');
          const { useMapStore } = await import('../map/useMapStore');
          const { aiService } = await import('../ai/AIService');
          const { TacticalNarrativeService } = await import('./logic/TacticalNarrativeService');

          const combatState = useCombatStore.getState();
          const mapState = useMapStore.getState();
          
          // Use provided ID or current turn's actor
          const targetId = combatantId || combatState.combatants[combatState.currentTurnIdx]?.id;
          const actor = combatState.combatants.find(c => c.id === targetId);

          if (!actor) {
            set({ status: 'idle' });
            return;
          }

          const narrativeReport = TacticalNarrativeService.getSituationalReport(
              actor,
              combatState.combatants,
              mapState.tokens,
              mapState.dangerZones,
              mapState.gridSize,
              macroContext
          );

          // 1. PHASE NARRATION (Streaming)
          const narrationPrompt = `Analyse la situation suivante pour ${actor.name} et donne une brève "narration stratégique" (2-3 phrases) décrivant l'ambiance et l'opportunité tactique principale.
          SITUATION : ${narrativeReport}`;

          const narrationPromise = aiService.generateTextStream(
            narrationPrompt,
            (token) => {
              set(state => ({ strategicNarration: state.strategicNarration + token }));
            },
            (statusMsg) => set({ status: statusMsg as any }),
            'oracle'
          );

          // 2. PHASE CONSEILS (Bloquant car JSON)
          const advicePrompt = `Basé sur ce rapport tactique : ${narrativeReport}. Génère 2 à 3 conseils concrets de combat, de mouvement ou de magie.`;
          
          const advicePromise = (async () => {
             // Get the full system prompt for proper grounding
             const fullSystemPrompt = await aiService.prepareSystemPrompt(
               advicePrompt, 
               `Tu es "Le Stratège", expert en JDR. Réponds exclusivement en JSON valide avec ce format exact : [ { "id": "...", "type": "attack|move|spell|defense", "message": "...", "priority": 1-5 } ]. Ne parle pas avant ni après le JSON.`,
               'oracle'
             );

             return aiService.generateJSON<any[]>(advicePrompt, fullSystemPrompt);
          })();

          // Exécution parallèle pour réduire considérablement le temps de réponse
          // particulièrement important pour les modèles lourds (gemini-3.1-pro)
          const [, advices] = await Promise.all([narrationPromise, advicePromise]);

          set({ activeAdvices: advices, status: 'idle' });
          getStore().addLog({ 
            type: 'tactical', 
            message: `Analyse stratégique générée pour ${actor.name}.` 
          });

        } catch (error) {
          console.error("[TacticalAIStore] Analysis failed:", error);
          set({ status: 'error' });
          getStore().addLog({ 
            type: 'error', 
            message: "L'analyse tactique a échoué." 
          });
        }
      }
    }),
    {
      name: 'gm-os-tactical-ai',
      partialize: (state) => ({
        settings: state.settings,
        secrets: {
          hueBridgeIp: state.secrets.hueBridgeIp,
          hueUsername: state.secrets.hueUsername,
        },
        logs: state.logs,
        activeAdvices: state.activeAdvices,
        status: state.status
      }),

    }
  )
);
