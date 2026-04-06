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
