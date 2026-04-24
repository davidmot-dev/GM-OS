import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DisplayInfo } from '../modules/image/types';
import { AppBridge } from '../bridge/AppBridge';

export interface AudioDeviceInfo {
    deviceId: string;
    label: string;
    kind: 'audiooutput';
}

interface HardwareState {
    audioDevices: AudioDeviceInfo[];
    displays: DisplayInfo[];
    audioAliases: Record<string, string>; // deviceId -> alias
    displayAliases: Record<string, string>; // displayId -> alias
    
    // Actions
    fetchAudioDevices: () => Promise<void>;
    fetchDisplays: () => Promise<void>;
    setAudioAlias: (deviceId: string, alias: string) => void;
    setDisplayAlias: (displayId: string, alias: string) => void;
    
    // Selectors
    getAudioLabel: (deviceId: string) => string;
    getDisplayLabel: (displayId: string) => string;
}

export const useHardwareStore = create<HardwareState>()(
    persist(
        (set, get) => ({
            audioDevices: [],
            displays: [],
            audioAliases: {},
            displayAliases: {},

            fetchAudioDevices: async () => {
                try {
                    const devices = await AppBridge.audio.getDevices();
                    set({ audioDevices: devices.map(d => ({
                        deviceId: d.id,
                        label: d.label,
                        kind: 'audiooutput' as const
                    })) });
                } catch (error) {
                    console.error('[HardwareStore] Failed to fetch audio devices:', error);
                }
            },

            fetchDisplays: async () => {
                if (AppBridge.image.hasSupport) {
                    try {
                        const displays = await AppBridge.image.getDisplays();
                        set({ displays });
                    } catch (error) {
                        console.error('[HardwareStore] Failed to fetch displays:', error);
                    }
                }
            },

            setAudioAlias: (deviceId, alias) => {
                set((state) => ({
                    audioAliases: { ...state.audioAliases, [deviceId]: alias }
                }));
            },

            setDisplayAlias: (displayId, alias) => {
                set((state) => ({
                    displayAliases: { ...state.displayAliases, [displayId]: alias }
                }));
            },

            getAudioLabel: (deviceId) => {
                const state = get();
                return state.audioAliases[deviceId] || 
                       state.audioDevices.find(d => d.deviceId === deviceId)?.label || 
                       (deviceId === 'default' ? 'Système par défaut' : 'Périphérique Inconnu');
            },

            getDisplayLabel: (displayId) => {
                const state = get();
                if (displayId === 'hub') return 'Player Hub';
                return state.displayAliases[displayId] || 
                       state.displays.find(d => d.id === displayId)?.label || 
                       `Écran ${displayId}`;
            }
        }),
        {
            name: 'gmos-hardware-storage',
            partialize: (state) => ({
                audioAliases: state.audioAliases,
                displayAliases: state.displayAliases
            })
        }
    )
);
