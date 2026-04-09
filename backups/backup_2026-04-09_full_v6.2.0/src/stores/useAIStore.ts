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
      
      updateConfig: (provider, config) => set((state) => ({
        configs: {
          ...state.configs,
          [provider]: { ...state.configs[provider], ...config }
        }
      })),
      
      getApiKey: (provider) => get().configs[provider].apiKey,
      setStreamEnabled: (streamEnabled) => set({ streamEnabled }),
      setLiteContext: (liteContext) => set({ liteContext }),
    }),
    {
      name: 'gm-os-ai-settings',
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
