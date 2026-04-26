import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gmToast } from '../../stores/useToastStore';


export interface VoiceEffects {
    pitch: number;      // -12 to 12 semitones
    formant: number;    // -100 to 100 (timbre simulation via peaking EQ)
    reverb: number;     // 0 to 1 (mix)
    distortion: number; // 0 to 1 (amount)
    bitcrush: number;  // 0 to 1
    lowCut: number;     // 80, 250 or 0 (off)
    gateThreshold: number; // -100 to 0 dB
    outputGain: number; // 0 to 2
    antiLarsen: boolean; // Toggle browser echo cancellation
    noiseGate: boolean;  // Toggle gate logic
    duckingEnabled: boolean;
    duckingThreshold: number; // dB
    duckingRange: number; // 0 to 1 (target gain)
    duckingRelease: number; // ms delay before fade-in
    duckingAttack: number; // ms for the fade transition
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
    isDucking: boolean; // Current active state of ducking
    
    currentEffects: VoiceEffects;
    activePresetId: string | null;
    
    inputLevel: number; // 0 to 1 (for VU-meter)
    
    outputDeviceId: string | null;
    availableOutputs: MediaDeviceInfo[];
    
    lastSyncedEntityId: string | null;
    lastSyncedEntityName: string | null;
    
    isWorkletReady: boolean; // Diagnostic: true if AudioWorklet loaded successfully
    
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
    toggleDucking: (active?: boolean) => void;
    setDucking: (isDucking: boolean) => void;
    
    setOutputDeviceId: (deviceId: string | null) => void;
    setAvailableOutputs: (devices: MediaDeviceInfo[]) => void;
    setWorkletReady: (ready: boolean) => void;
    
    syncWithNpc: (npc: { name: string; description: string; roleplayingNotes: string; id: string }) => void;
    generateVoiceProfile: (npc: { name: string; gmNotes: string; fields: Record<string, string> }) => Promise<void>;
    
    presets: VoicePreset[];

}

const DEFAULT_EFFECTS: VoiceEffects = {
    pitch: 0,
    formant: 0,
    reverb: 0,
    distortion: 0,
    bitcrush: 0,
    lowCut: 80,
    gateThreshold: -50,
    outputGain: 1.0,
    antiLarsen: true,
    noiseGate: true,
    duckingEnabled: false,
    duckingThreshold: -40,
    duckingRange: 0.3,
    duckingRelease: 800,
    duckingAttack: 150
};

const INITIAL_PRESETS: VoicePreset[] = [
    {
        id: 'clean',
        name: 'modules:voice.presets.clean.name',
        icon: 'Mic2',
        description: 'modules:voice.presets.clean.desc',
        effects: { ...DEFAULT_EFFECTS, duckingEnabled: true }
    },
    {
        id: 'ghost',
        name: 'modules:voice.presets.ghost.name',
        icon: 'Ghost',
        description: 'modules:voice.presets.ghost.desc',
        effects: { ...DEFAULT_EFFECTS, pitch: 4, reverb: 0.7, formant: 40, duckingEnabled: true }
    },
    {
        id: 'ogre',
        name: 'modules:voice.presets.ogre.name',
        icon: 'Skull',
        description: 'modules:voice.presets.ogre.desc',
        effects: { ...DEFAULT_EFFECTS, pitch: -5, formant: -60, reverb: 0.3, duckingEnabled: true }
    },
    {
        id: 'robot',
        name: 'modules:voice.presets.robot.name',
        icon: 'Cpu',
        description: 'modules:voice.presets.robot.desc',
        effects: { ...DEFAULT_EFFECTS, distortion: 0.5, formant: 20, pitch: -1, duckingEnabled: true }
    },
    {
        id: 'dragon',
        name: 'modules:voice.presets.dragon.name',
        icon: 'Flame',
        description: 'modules:voice.presets.dragon.desc',
        effects: { ...DEFAULT_EFFECTS, pitch: -8, distortion: 0.4, formant: -80, reverb: 0.5, duckingEnabled: true }
    }
];

export const useVoiceStore = create<VoiceState>()(
    persist(
        (set, get) => ({
            isActive: false,
            isLive: false,
            isMonitor: false,
            isSyncNPC: false,
            isDucking: false,
            
            currentEffects: { ...DEFAULT_EFFECTS },
            activePresetId: 'clean',
            
            inputLevel: 0,
            isWorkletReady: false,
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
            
            toggleDucking: (active?: boolean) => set((state) => ({ 
                currentEffects: { ...state.currentEffects, duckingEnabled: active !== undefined ? active : !state.currentEffects.duckingEnabled } 
            })),

            setDucking: (isDucking: boolean) => {
                if (get().isDucking === isDucking) return;
                set({ isDucking });
            },

            setOutputDeviceId: (deviceId) => set({ outputDeviceId: deviceId }),
            setAvailableOutputs: (devices) => set({ availableOutputs: devices }),
            setWorkletReady: (ready) => set({ isWorkletReady: ready }),
            
            lastSyncedEntityId: null,
        lastSyncedEntityName: null,

            syncWithNpc: (npc) => {
                // ... Existing sync logic ...
                const { isSyncNPC, lastSyncedEntityId, updateEffect, applyPreset } = get();
                if (!isSyncNPC || lastSyncedEntityId === npc.id) return;

                const text = `${npc.name} ${npc.description} ${npc.roleplayingNotes}`.toLowerCase();
                
                // Keep existing keyword logic for ultra-fast fallback
                if (text.includes('spectre') || text.includes('fantôme') || text.includes('ghost')) {
                    applyPreset('ghost');
                } else if (text.includes('ogre') || text.includes('géant') || text.includes('troll') || text.includes('colossal')) {
                    applyPreset('ogre');
                } else if (text.includes('robot') || text.includes('androïde') || text.includes('cyborg')) {
                    applyPreset('robot');
                } else if (text.includes('dragon') || text.includes('démon')) {
                    applyPreset('dragon');
                } else {
                    applyPreset('clean');
                    if (text.includes('grave') || text.includes('profond')) updateEffect('pitch', -4);
                    else if (text.includes('enfant') || text.includes('petit')) updateEffect('pitch', 5);
                }

                set({ 
                    lastSyncedEntityId: npc.id,
                    lastSyncedEntityName: npc.name
                });
            },

            generateVoiceProfile: async (npc) => {
                const { updateEffect, applyPreset } = get();
                const aiStore = (await import('../../stores/useAIStore')).useAIStore.getState();
                
                const provider = aiStore.configs.ollama ? 'ollama' : aiStore.activeProvider;
                const model = provider === 'ollama' ? (aiStore.configs.ollama.modelId || 'phi3') : aiStore.configs[provider].modelId;

                const fieldsText = Object.entries(npc.fields).map(([k, v]) => `${k}: ${v}`).join(', ');
                const prompt = `Tu es une IA experte en sound-design. Analyse ce PNJ et suggère des réglages de voix.
                Nom: ${npc.name}
                Traits: ${fieldsText}
                Notes: ${npc.gmNotes}

                Instructions STRICTES :
                - Tu DOIS répondre EXCLUSIVEMENT avec un objet JSON.
                - Aucun texte d'introduction ou de conclusion.
                - Les valeurs doivent être des CHIFFRES (pas de texte, pas de signes +).

                Exemple de format EXACT attendu :
                {
                  "preset": "dragon",
                  "pitch": -5,
                  "formant": -20,
                  "reverb": 0.2,
                  "distortion": 0.1
                }
                
                Règles des valeurs :
                - preset: "clean", "ghost", "ogre", "robot", ou "dragon"
                - pitch: nombre entre -12 et 12
                - formant: nombre entre -100 et 100
                - reverb: nombre décimal entre 0 et 1
                - distortion: nombre décimal entre 0 et 1`;

                try {
                    const { aiService } = await import('../../modules/ai/AIService');
                    const response = await aiService.generateText(prompt, 'voice-profiler');
                    
                    // Extraction du premier bloc JSON plat (ignore les accolades parasites après la réponse)
                    const match = response.text.match(/\{[^{}]+\}/);
                    
                    if (!match) {
                        throw new Error(`Format JSON introuvable dans la réponse: ${response.text.substring(0, 100)}...`);
                    }

                    const rawJson = match[0];
                    
                    // Nettoyeur auto-correctif:
                    const cleanedJson = rawJson
                        .replace(/:\s*\+(\d+)/g, ': $1')                // Signes +
                        .replace(/,\s*([}\]])/g, '$1')                 // Virgules traînantes
                        .replace(/(['"])?(\w+)(['"])?\s*:/g, '"$2":')    // Forcer double-quotes sur clés
                        .replace(/'/g, '"');                            // Guillemets simples -> doubles

                    let profile: { preset?: string, pitch?: number, formant?: number, reverb?: number, distortion?: number } = {};
                    try {
                        profile = JSON.parse(cleanedJson);
                    } catch (e1) {
                        try {
                            // Fallback ultime: Évaluation JS native
                            // Accepte nativement les commentaires, clés sans guillemets, virgules traînantes, etc.
                            profile = new Function(`return ${rawJson}`)();
                        } catch (e2) {
                            console.error("[Voice-OS] Échec absolu du parsing IA.", { erreurRegex: e1, erreurJS: e2, rawPayload: rawJson });
                            throw new Error("Impossible d'interpréter la réponse de l'IA.");
                        }
                    }

                    if (profile.preset) applyPreset(profile.preset);
                    if (profile.pitch !== undefined) updateEffect('pitch', profile.pitch);
                    if (profile.formant !== undefined) updateEffect('formant', profile.formant);
                    if (profile.reverb !== undefined) updateEffect('reverb', profile.reverb);
                    if (profile.distortion !== undefined) updateEffect('distortion', profile.distortion);

                    const translate = (await import('i18next')).default;
                    set({ lastSyncedEntityName: npc.name || 'Unknown NPC' });
                    gmToast(translate.t('modules:voice.messages.profile_generated', { provider: provider.toUpperCase(), model }), "info");
                } catch (err) {
                    console.error("Voice profiling failed:", err);
                }
            }
        }),

        {
            name: 'gmos-voice-storage',
            partialize: (state) => ({
                currentEffects: state.currentEffects,
                activePresetId: state.activePresetId,
                isSyncNPC: state.isSyncNPC,
                outputDeviceId: state.outputDeviceId
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Ensure all new fields exist in currentEffects after hydration
                    state.currentEffects = { ...DEFAULT_EFFECTS, ...state.currentEffects };
                }
            }
        }
    )
);
