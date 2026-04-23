import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIProvider, AIModelConfig } from '../modules/ai/types';
import { AppBridge } from '../bridge/AppBridge';

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
        ollama: { 
          provider: 'ollama', 
          modelId: 'phi3',
          endpoint: 'http://127.0.0.1:11434'
        },
        ollama_cloud: {
          provider: 'ollama_cloud',
          modelId: 'llama3',
          endpoint: 'https://votre-ollama-cloud.com'
        },
        custom: {
          provider: 'custom',
          modelId: 'custom-model',
          endpoint: 'https://api.custom.com/v1'
        }
      },
      streamEnabled: true,
      liteContext: false,

      setProvider: (provider) => set({ activeProvider: provider }),

      updateConfig: async (provider, config) => {
        // Sécurité : Si une clé API est fournie, on l'enregistre dans le trousseau natif
        // au lieu du store persistant (localStorage)
        if (config.apiKey !== undefined && AppBridge.security.hasSupport) {
          try {
            console.log(`[AI Store] 🔐 Tentative de sauvegarde sécurisée pour "${provider}"...`);
            await AppBridge.security.saveSecret(`ai-key-${provider}`, config.apiKey);
            console.log(`[AI Store] ✅ Clé sauvegardée avec succès dans le trousseau pour "${provider}"`);
          } catch (err) {
            console.error(`[AI Store] ❌ Échec de la sauvegarde dans le trousseau pour "${provider}":`, err);
          }
        }

        set((state) => ({
          configs: {
            ...state.configs,
            [provider]: { 
              ...state.configs[provider], 
              ...config
            }
          }
        }));
      },

      getApiKey: (provider) => get().configs[provider].apiKey,
      
      setStreamEnabled: (streamEnabled) => set({ streamEnabled }),
      setLiteContext: (liteContext) => set({ liteContext }),

      syncWithKeychain: async () => {
        if (!AppBridge.security.hasSupport) {
          console.warn('[AI Store] 🛡️ API Security non disponible (Bridge absent)');
          return;
        }

        console.log('[AI Store] 🔐 Synchronisation avec le trousseau...');
        const currentConfigs = { ...get().configs };
        let hasChanges = false;

        const providers = Object.keys(currentConfigs) as AIProvider[];
        
        for (const provider of providers) {
          const secretId = `ai-key-${provider}`;
          
          try {
            // 1. Récupération : On charge la clé depuis le trousseau natif
            const securedKey = await AppBridge.security.getSecret(secretId);
            
            if (securedKey && typeof securedKey === 'string' && securedKey.length > 5) {
              console.log(`[AI Store] ✅ Clé récupérée avec succès pour "${provider}" (${securedKey.length} chars)`);
              currentConfigs[provider] = {
                ...currentConfigs[provider],
                apiKey: securedKey
              };
              hasChanges = true;
            } else {
              console.log(`[AI Store] ℹ️ Aucune clé trouvée dans le trousseau pour "${provider}"`);
              // 2. Migration : Si une clé traîne encore en clair en mémoire vive (venant du localStorage legacy)
              if (currentConfigs[provider].apiKey) {
                console.log(`[AI Store] 💾 Migration de la clé "${provider}" vers le Keychain.`);
                await AppBridge.security.saveSecret(secretId, currentConfigs[provider].apiKey!);
              }
            }
          } catch (err) {
            console.error(`[AI Store] ❌ Erreur Keychain pour "${provider}":`, err);
          }
        }

        if (hasChanges) {
          set({ configs: currentConfigs });
        }
      }
    }),
    {
      name: 'gm-os-ai-settings',
      // On exclut totalement les clés API de la persistance brute pour la sécurité
      partialize: (state) => {
        const cleanConfigs = Object.fromEntries(
          Object.entries(state.configs).map(([k, v]) => {
            const { apiKey, ...rest } = v;
            return [k, rest];
          })
        );
        return {
          activeProvider: state.activeProvider,
          streamEnabled: state.streamEnabled,
          liteContext: state.liteContext,
          configs: cleanConfigs
        };
      },
      merge: (persistedState, currentState) => {
        const typedPersisted = persistedState as AIState;
        return {
          ...currentState,
          ...typedPersisted,
          configs: {
            ...currentState.configs,
            ...(typedPersisted?.configs || {})
          }
        };
      },
    }
  )
);
