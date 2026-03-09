import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VoiceEffects {
    pitch: number;      // -12 to 12 semitones
    formant: number;    // -100 to 100 (timbre simulation via peaking EQ)
    reverb: number;     // 0 to 1 (mix)
    distortion: number; // 0 to 1 (amount)
    lowCut: number;     // 80, 250 or 0 (off)
    gateThreshold: number; // -100 to 0 dB
    outputGain: number; // 0 to 2
    antiLarsen: boolean; // Toggle browser echo cancellation
    noiseGate: boolean;  // Toggle gate logic
}

export interface VoicePreset {
    id: string;
    name: string;
    icon: string;
    description: string;
    effects: VoiceEffects;
}

interface VoiceState {
    isActive: boolean;
    isLive: boolean;
    isMonitor: boolean;
    isSyncNPC: boolean;
    
    currentEffects: VoiceEffects;
    activePresetId: string | null;
    
    inputLevel: number; // 0 to 1 (for VU-meter)
    
    outputDeviceId: string | null;
    availableOutputs: MediaDeviceInfo[];
    
    // Actions
    toggleActive: (active?: boolean) => void;
    toggleLive: (live?: boolean) => void;
    toggleMonitor: (monitor?: boolean) => void;
    toggleSyncNPC: (sync?: boolean) => void;
    
    updateEffect: (key: keyof VoiceEffects, value: number) => void;
    applyPreset: (presetId: string) => void;
    setInputLevel: (level: number) => void;
    toggleAntiLarsen: (active?: boolean) => void;
    toggleNoiseGate: (active?: boolean) => void;
    
    setOutputDeviceId: (deviceId: string | null) => void;
    setAvailableOutputs: (devices: MediaDeviceInfo[]) => void;
    
    presets: VoicePreset[];
}

const DEFAULT_EFFECTS: VoiceEffects = {
    pitch: 0,
    formant: 0,
    reverb: 0,
    distortion: 0,
    lowCut: 80,
    gateThreshold: -50,
    outputGain: 1.0,
    antiLarsen: true,
    noiseGate: true
};

const INITIAL_PRESETS: VoicePreset[] = [
    {
        id: 'clean',
        name: 'Clean',
        icon: 'Mic2',
        description: 'Voix naturelle avec légère compression.',
        effects: { ...DEFAULT_EFFECTS }
    },
    {
        id: 'ghost',
        name: 'Spectre',
        icon: 'Ghost',
        description: 'Voix éthérée avec beaucoup de reverb et pitch haut.',
        effects: { ...DEFAULT_EFFECTS, pitch: 4, reverb: 0.7, formant: 40 }
    },
    {
        id: 'ogre',
        name: 'Ogre',
        icon: 'Skull',
        description: 'Voix caverneuse, grave et massive.',
        effects: { ...DEFAULT_EFFECTS, pitch: -5, formant: -60, reverb: 0.3 }
    },
    {
        id: 'robot',
        name: 'Androïde',
        icon: 'Cpu',
        description: 'Effet métallique et distorsion numérique.',
        effects: { ...DEFAULT_EFFECTS, distortion: 0.5, formant: 20, pitch: -1 }
    },
    {
        id: 'dragon',
        name: 'Dragon',
        icon: 'Flame',
        description: 'Grogne profond avec distorsion et sub-harmoniques.',
        effects: { ...DEFAULT_EFFECTS, pitch: -8, distortion: 0.4, formant: -80, reverb: 0.5 }
    }
];

export const useVoiceStore = create<VoiceState>()(
    persist(
        (set, get) => ({
            isActive: false,
            isLive: false,
            isMonitor: false,
            isSyncNPC: false,
            
            currentEffects: { ...DEFAULT_EFFECTS },
            activePresetId: 'clean',
            
            inputLevel: 0,
            outputDeviceId: null,
            availableOutputs: [],
            
            presets: INITIAL_PRESETS,
            
            toggleActive: (active) => set((state) => ({ isActive: active !== undefined ? active : !state.isActive })),
            toggleLive: (live) => set((state) => ({ isLive: live !== undefined ? live : !state.isLive })),
            toggleMonitor: (monitor) => set((state) => ({ isMonitor: monitor !== undefined ? monitor : !state.isMonitor })),
            toggleSyncNPC: (sync) => set((state) => ({ isSyncNPC: sync !== undefined ? sync : !state.isSyncNPC })),
            
            updateEffect: (key, value) => set((state) => ({
                currentEffects: { ...state.currentEffects, [key]: value },
                activePresetId: null // User modified values, no longer strictly the preset
            })),
            
            applyPreset: (presetId) => {
                const preset = get().presets.find(p => p.id === presetId);
                if (preset) {
                    set({ 
                        currentEffects: { ...preset.effects },
                        activePresetId: presetId
                    });
                }
            },
            
            setInputLevel: (level) => set({ inputLevel: level }),
            
            toggleAntiLarsen: (active) => set((state) => ({ 
                currentEffects: { ...state.currentEffects, antiLarsen: active !== undefined ? active : !state.currentEffects.antiLarsen } 
            })),
            
            toggleNoiseGate: (active) => set((state) => ({ 
                currentEffects: { ...state.currentEffects, noiseGate: active !== undefined ? active : !state.currentEffects.noiseGate } 
            })),
            
            setOutputDeviceId: (deviceId) => set({ outputDeviceId: deviceId }),
            setAvailableOutputs: (devices) => set({ availableOutputs: devices }),
        }),
        {
            name: 'gmos-voice-storage',
            partialize: (state) => ({
                currentEffects: state.currentEffects,
                activePresetId: state.activePresetId,
                isSyncNPC: state.isSyncNPC,
                outputDeviceId: state.outputDeviceId
            })
        }
    )
);
