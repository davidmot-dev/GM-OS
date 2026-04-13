import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider, AIModelConfig } from '../modules/ai/types';

interface AIState {
  activeProvider: AIProvider;
  configs: Record<AIProvider, AIModelConfig>;
  streamEnabled: boolean;
  liteContext: boolean;
  
  // Actions
  setProvider: (provider: AIProvider) => void;
  updateConfig: (provider: AIProvider, config: Partial<AIModelConfig>) => void;
  getApiKey: (provider: AIProvider) => string | undefined;
  setStreamEnabled: (enabled: boolean) => void;
  setLiteContext: (enabled: boolean) => void;
  syncWithKeychain: () => Promise<void>;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      activeProvider: 'gemini',
      configs: {
        gemini: { provider: 'gemini', modelId: 'gemini-1.5-flash' },
        openai: { provider: 'openai', modelId: 'gpt-4o' },
        anthropic: { provider: 'anthropic', modelId: 'claude-3-5-sonnet-latest' },
        ollama: { provider: 'ollama', modelId: 'gemma4:26b' },
      },
      streamEnabled: true,
      liteContext: false,

      setProvider: (provider) => set({ activeProvider: provider }),

      updateConfig: (provider, config) => {
        // Sécurité : Si une clé API est fournie, on l'enregistre dans le trousseau natif
        // au lieu du store persistant (localStorage)
        if (config.apiKey && window.appBridge?.security) {
          window.appBridge.security.saveSecret(`ai-key-${provider}`, config.apiKey);
        }

        set((state) => ({
          configs: {
            ...state.configs,
            [provider]: { 
              ...state.configs[provider], 
              ...config,
              // On retire la clé de l'état "config" pour ne pas qu'elle soit persistée par erreur
              // Elle sera récupérée dynamiquement via getApiKey
              apiKey: undefined 
            }
          }
        }));
      },

      getApiKey: (provider) => get().configs[provider].apiKey,
      
      setStreamEnabled: (streamEnabled) => set({ streamEnabled }),
      setLiteContext: (liteContext) => set({ liteContext }),

      syncWithKeychain: async () => {
        if (!window.appBridge?.security) return;

        const currentConfigs = { ...get().configs };
        let hasChanges = false;

        for (const provider of Object.keys(currentConfigs) as AIProvider[]) {
          const secretId = `ai-key-${provider}`;
          
          // 1. Migration : Si une clé traîne encore en clair dans le localStorage
          if (currentConfigs[provider].apiKey) {
            await window.appBridge.security.saveSecret(secretId, currentConfigs[provider].apiKey!);
            currentConfigs[provider].apiKey = undefined; // On nettoie le store local
            hasChanges = true;
          }

          // 2. Récupération : On charge la clé depuis le trousseau natif
          const securedKey = await window.appBridge.security.getSecret(secretId);
          if (securedKey) {
            currentConfigs[provider].apiKey = securedKey;
            hasChanges = true;
          }
        }

        if (hasChanges) {
          set({ configs: currentConfigs });
        }
      }
    }),
    {
      name: 'gm-os-ai-settings',
      // On exclut explicitement les clés API de la persistance brute
      partialize: (state) => ({
        activeProvider: state.activeProvider,
        streamEnabled: state.streamEnabled,
        liteContext: state.liteContext,
        configs: Object.fromEntries(
          Object.entries(state.configs).map(([k, v]) => [k, { ...v, apiKey: undefined }])
        )
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as AIState),
        configs: {
          ...currentState.configs,
          ...((persistedState as AIState)?.configs || {})
        }
      }),
    }
  )
);
