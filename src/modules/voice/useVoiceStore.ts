import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gmToast } from '../../stores/useToastStore';
import { contexteAllegeMaintenant } from '../ai/modeDeContexte';


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

/**
 * Un profil vocal enregistré sur la fiche d'un PNJ.
 *
 * **Ce qu'on garde, et pourquoi tout.** On enregistre l'état complet du rack —
 * pas les cinq valeurs suggérées par le modèle. Le meneur retouche presque
 * toujours aux curseurs après coup, et c'est cet état-là qu'il veut retrouver,
 * pas la proposition initiale. *Ce qu'on rappelle doit être ce qu'on a entendu.*
 */
export interface ProfilVocal {
    /** Le preset actif, s'il n'a pas été retouché depuis. */
    presetId: string | null;
    effects: VoiceEffects;
    /** Quand il a été posé — pour que l'écran puisse dire « il y a trois jours ». */
    enregistreLe: number;
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
    /**
     * Fabrique un profil vocal et l'applique.
     *
     * **Rend le profil au lieu de se contenter de l'appliquer** : c'est
     * l'appelant qui sait où le ranger — la fiche du PNJ — et le store de voix
     * n'a pas à connaître le module des PNJ.
     */
    generateVoiceProfile: (npc: { name: string; gmNotes: string; fields: Record<string, string> }) => Promise<ProfilVocal | null>;
    /** Repose un profil enregistré sur le rack. */
    appliquerProfil: (profil: ProfilVocal) => void;
    
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

            appliquerProfil: (profil) => set({
                currentEffects: { ...profil.effects },
                activePresetId: profil.presetId,
            }),

            generateVoiceProfile: async (npc) => {
                const { updateEffect, applyPreset } = get();
                const aiStore = (await import('../../stores/useAIStore')).useAIStore.getState();

                /*
                  **Le fournisseur réellement employé, et non « Ollama » quoi
                  qu'il arrive.**

                  La ligne d'avant testait `configs.ollama ? 'ollama' : …` — or
                  cet objet existe toujours, donc la condition était toujours
                  vraie. L'appel partait bien vers le fournisseur actif, mais le
                  message de confirmation annonçait Ollama à tout le monde.
                  *Un message qui nomme le mauvais outil envoie chercher la
                  panne au mauvais endroit.*
                */
                const provider = aiStore.activeProvider;
                const model = aiStore.configs[provider]?.modelId ?? '—';

                const fieldsText = Object.entries(npc.fields).map(([k, v]) => `${k}: ${v}`).join(', ');
                const prompt = `Analyse ce personnage et propose des réglages de voix.
Nom: ${npc.name}
Traits: ${fieldsText}
Notes: ${npc.gmNotes}

Règles des valeurs :
- preset: "clean", "ghost", "ogre", "robot" ou "dragon"
- pitch: nombre entre -12 et 12
- formant: nombre entre -100 et 100
- reverb: nombre décimal entre 0 et 1
- distortion: nombre décimal entre 0 et 1`;

                /**
                 * La forme imposée au décodeur, plutôt que demandée au modèle.
                 *
                 * **C'est la leçon de la Forge du 2026-08-12** : une consigne
                 * s'ignore, une grammaire non. L'ancien code demandait poliment
                 * « EXCLUSIVEMENT un objet JSON », puis rattrapait la réponse
                 * avec trois filets — dont un `new Function()`, c'est-à-dire une
                 * **évaluation de code sur la sortie d'un modèle**. Le schéma
                 * rend ces filets inutiles.
                 */
                const schema = {
                    type: 'object',
                    properties: {
                        preset: { type: 'string', enum: ['clean', 'ghost', 'ogre', 'robot', 'dragon'] },
                        pitch: { type: 'number' },
                        formant: { type: 'number' },
                        reverb: { type: 'number' },
                        distortion: { type: 'number' },
                    },
                    required: ['preset', 'pitch', 'formant', 'reverb', 'distortion'],
                };

                const translate = (await import('i18next')).default;

                try {
                    const { aiService } = await import('../../modules/ai/AIService');

                    /*
                      **Sans persona et sans contexte de séance.**

                      L'appel passait `'voice-profiler'` en DEUXIÈME argument —
                      qui est le *contexte*, pas l'identifiant de persona. La
                      demande de sound-design partait donc enrobée des
                      instructions du Sage, des personnages et des PNJ de la
                      séance en cours. C'est mot pour mot le défaut corrigé pour
                      la Forge le 2026-08-12, où le modèle, sommé d'incarner un
                      conteur pendant qu'on lui demandait d'extraire des données,
                      commentait son travail. *Un contexte hérité d'ailleurs
                      reste un choix que personne n'a fait.*
                    */
                    const response = await aiService.generateText(
                        /*
                          **Le moment décide, plutôt que personne — axe F.1.**
                          Ce `undefined` laissait le réglage global trancher, et
                          le commentaire ci-dessus dit déjà pourquoi c'est un
                          problème : *un contexte hérité d'ailleurs reste un
                          choix que personne n'a fait.* En partie on allège, en
                          préparation et en pause on prend tout.
                        */
                        prompt, undefined, 'sage', {}, contexteAllegeMaintenant(),
                        true,   // attendJson
                        true,   // sansPersona
                        schema,
                    );

                    const profile = JSON.parse(response.text) as {
                        preset?: string; pitch?: number; formant?: number; reverb?: number; distortion?: number;
                    };

                    if (profile.preset) applyPreset(profile.preset);
                    if (profile.pitch !== undefined) updateEffect('pitch', profile.pitch);
                    if (profile.formant !== undefined) updateEffect('formant', profile.formant);
                    if (profile.reverb !== undefined) updateEffect('reverb', profile.reverb);
                    if (profile.distortion !== undefined) updateEffect('distortion', profile.distortion);

                    set({ lastSyncedEntityName: npc.name || 'Unknown NPC' });
                    gmToast(translate.t('modules:voice.messages.profile_generated', { provider: provider.toUpperCase(), model }), 'info');

                    // L'état RÉEL du rack après application — c'est lui qu'on
                    // enregistre, pas la suggestion brute du modèle.
                    const apres = get();
                    return { presetId: apres.activePresetId, effects: { ...apres.currentEffects }, enregistreLe: Date.now() };
                } catch (err) {
                    /*
                      **Un échec se dit.** Il partait dans la console et nulle
                      part ailleurs : on cliquait, rien ne bougeait, et rien
                      n'expliquait pourquoi. C'est la forme exacte du défaut que
                      ce projet traque — quelque chose qui échoue sans le dire.
                    */
                    const dit = err instanceof Error ? err.message : String(err);
                    console.error('[Voice-OS] Profilage vocal en échec :', err);
                    gmToast(`Profil vocal : ${dit}`, 'error');
                    return null;
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
