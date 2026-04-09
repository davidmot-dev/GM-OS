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
        openAIKey: '',
        geminiKey: '',
      },
      logs: [],
      activeAdvices: [],
      hardwareStatus: {
        hue: 'disconnected',
        audio: 'missing',
      },
      isPanelOpen: false,

      setStatus: (status) => set({ status }),

      setHardwareStatus: (status) =>
        set((state) => ({
          hardwareStatus: { ...state.hardwareStatus, ...status },
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      updateSecrets: (newSecrets) =>
        set((state) => ({
          secrets: { ...state.secrets, ...newSecrets },
        })),

      addLog: (log) =>
        set((state) => ({
          logs: [
            {
              ...log,
              id: Math.random().toString(36).substring(7),
              timestamp: new Date().toISOString(),
            },
            ...state.logs,
          ].slice(0, 50),
        })),

      clearLogs: () => set({ logs: [] }),

      setAdvices: (activeAdvices) => set({ activeAdvices }),

      setIsPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
      
      requestTacticalAnalysis: async (combatantId: string) => {
        const getStore = () => (useTacticalAIStore as any).getState() as TacticalAIState;

        set({ status: 'analyzing' });

        try {
          const { useCombatStore } = await import('../combat/useCombatStore');
          const { useMapStore } = await import('../map/useMapStore');
          const { aiService } = await import('../ai/AIService');
          const { TacticalNarrativeService } = await import('./logic/TacticalNarrativeService');

          const combatState = useCombatStore.getState();
          const mapState = useMapStore.getState();
          
          const actor = combatState.combatants.find(c => c.id === combatantId);
          if (!actor) {
            setStatus('idle');
            return;
          }

          const narrativeReport = TacticalNarrativeService.getSituationalReport(
              actor,
              combatState.combatants,
              mapState.tokens,
              mapState.dangerZones,
              mapState.gridSize
          );

          const systemPrompt = `Tu es "Le Stratège", un expert en tactique militaire pour jeux de rôle. 
Ton rôle est d'analyser la situation et de donner des conseils narratifs et stratégiques.
N'utilise PAS de jargon technique "meta" (ex: pas de "Bonus de +2", pas de "Action mineure"), parle uniquement en termes de fiction et de placements.
Réponds exclusivement en JSON valide sous la forme d'un tableau d'objets TacticalAdvice.

Interface TacticalAdvice attendue :
{
  "id": "string",
  "sourceId": "${combatantId}",
  "type": "position" | "status" | "macro-flank" | "macro-rout",
  "message": "Ton conseil narratif ici",
  "priority": 1 (basse) à 3 (critique)
}`;

          set({ activeAdvices: advices as any[], status: 'idle' });
          getStore().addLog({ 
            type: 'tactical', 
            message: `Analyse stratégique générée pour ${actor.name}.` 
          });

        } catch (error) {
          console.error("[TacticalAIStore] Analysis failed:", error);
          set({ status: 'error' });
          getStore().addLog({ 
            type: 'error', 
            message: "L'analyse tactique a échoué (IA indisponible ou erreur de parsing)." 
          });
        }
      }
    }),
    {
      name: 'gm-os-tactical-ai',
      partialize: (state) => ({
        settings: state.settings,
        secrets: state.secrets,
        logs: state.logs,
        activeAdvices: state.activeAdvices,
        status: state.status
      }),

    }
  )
);
