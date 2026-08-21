import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSessionOSStore } from '../session/useSessionOSStore';
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
              macroContext,
              // Les portées du jeu, et non celles par défaut de `GridEngine` :
              // sans elles, le rapport envoyé à l'IA classe les distances selon
              // un autre jeu. Les deux autres appelants les passaient déjà.
              useSessionOSStore.getState().getActiveDriver?.()?.tactical,
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
               'oracle',
               /*
                 **Les règles du système, et rien du lore — axe C.3 du plan du
                 2026-08-07.**

                 Aucune `ragOptions` n'était passée : le Cortex chargeait TOUT
                 le lore de campagne pour répondre à « attaquer ou se déplacer
                 ? ». Or `TacticalNarrativeService` vient de lui préparer un
                 rapport de situation précis — positions, portées, zones de
                 danger — et c'est cela qui décide du conseil. Le lore n'y
                 ajoute rien et se paie en prefill sur un module qui vise
                 trente à soixante secondes, parce que son conseil se périme.

                 `systemOnly` restreint la sélection au corpus du système ;
                 `limit: 2` tient dans le plafond des 4 000 jetons sans le
                 saturer, et la question elle-même trie les fiches par sujet
                 depuis le 2026-08-19 — un conseil de combat ramène donc les
                 fiches de combat.
               */
               { systemOnly: true, limit: 2 },
             );

             /*
               `sansPersona` : le contexte est DÉJÀ dans `fullSystemPrompt`,
               que ce bloc vient de préparer lui-même. Sans cela `generateJSON`
               rappelait `prepareSystemPrompt` et reconcaténait persona, RAG et
               contexte de séance **une seconde fois** — défaut relevé au plan
               IA du 2026-08-07 et jamais traité depuis. Le Cortex vise 30 à 60
               secondes, parce que son conseil se périme ; il payait le double
               de prefill pour un contexte qu'il envoyait en double.
             */
             return aiService.generateJSON<any[]>(advicePrompt, fullSystemPrompt, undefined, { sansPersona: true });
          })();

          /*
            **`Promise.all` attend les deux ; il ne les parallélise pas
            forcément.** Le commentaire d'origine annonçait une « exécution
            parallèle qui réduit considérablement le temps de réponse » —
            relevé comme mensonger au § 3.5 du plan du 2026-08-07 : sous
            `NUM_PARALLEL=1`, qui est le défaut d'Ollama, **les deux appels
            font la queue**. On attend donc la somme des deux, pas le plus
            long des deux.

            On garde `Promise.all` — il est juste, et il gagne réellement
            quand le fournisseur sert deux requêtes de front, ce qui est le
            cas du cloud. Mais on cesse de promettre ce gain : *une
            optimisation annoncée qui n'a pas lieu fait chercher le temps
            perdu ailleurs.*
          */
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
