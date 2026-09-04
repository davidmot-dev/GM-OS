import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { gmToast } from '../../stores/useToastStore';
import { contexteAllegeMaintenant } from '../ai/modeDeContexte';
import { debruitageMigre, type Debruitage } from './logic/migrationDesEffets';
import { texteDuPersonnage, type PersonnageAVoix } from './logic/personnageAVoix';


export type { VoiceEffects, ProfilVocal, VoicePreset } from './types';
import type { VoiceEffects, ProfilVocal, VoicePreset } from './types';

interface VoiceState {
    isActive: boolean;
    isLive: boolean;
    isMonitor: boolean;
    isSyncNPC: boolean;
    isDucking: boolean; // Current active state of ducking
    
    currentEffects: VoiceEffects;
    activePresetId: string | null;
    
    inputLevel: number; // 0 to 1 (for VU-meter)

    /**
     * La probabilité que le meneur soit en train de parler, selon RNNoise.
     *
     * Zéro quand le débruitage neuronal est éteint : *une absence d'estimation
     * ne doit pas se lire comme une certitude de silence*, et c'est pourquoi la
     * porte ne s'en sert que pour se TENIR ouverte, jamais pour s'ouvrir.
     */
    probabiliteDeVoix: number;
    
    outputDeviceId: string | null;
    availableOutputs: MediaDeviceInfo[];

    /**
     * Le micro choisi par le meneur, ou `null` pour celui de Windows.
     *
     * *Demandé par David le 2026-09-03.* Voice-OS appelait `getUserMedia` sans
     * `deviceId` : il prenait donc **le périphérique d'entrée par défaut du
     * système**, et le tableau de bord n'offrait un sélecteur que pour la
     * sortie. Avec un casque USB branché à côté d'une webcam, c'est Windows qui
     * tranchait — *et il ne tranche pas le soir de la partie, il tranche au
     * branchement.*
     */
    inputDeviceId: string | null;
    availableInputs: MediaDeviceInfo[];

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
    setProbabiliteDeVoix: (probabilite: number) => void;
    toggleAntiLarsen: (active?: boolean) => void;
    setDebruitage: (mode: Debruitage) => void;
    toggleNoiseGate: (active?: boolean) => void;
    toggleDucking: (active?: boolean) => void;
    setDucking: (isDucking: boolean) => void;
    
    setOutputDeviceId: (deviceId: string | null) => void;
    setAvailableOutputs: (devices: MediaDeviceInfo[]) => void;
    setInputDeviceId: (deviceId: string | null) => void;
    setAvailableInputs: (devices: MediaDeviceInfo[]) => void;
    setWorkletReady: (ready: boolean) => void;
    
    /**
     * Repose la voix d'un personnage, **profil enregistré d'abord**.
     *
     * Les mots-clés ne sont plus qu'un repli, pour un PNJ dont personne n'a
     * jamais réglé la voix. Auparavant ils étaient le seul chemin, et ils
     * écrasaient tout à chaque bascule de sélection.
     */
    syncWithNpc: (personnage: PersonnageAVoix) => void;
    /**
     * Fabrique un profil vocal et l'applique.
     *
     * **Rend le profil au lieu de se contenter de l'appliquer** : c'est
     * l'appelant qui sait où le ranger — la fiche du PNJ — et le store de voix
     * n'a pas à connaître le module des PNJ.
     */
    generateVoiceProfile: (personnage: PersonnageAVoix) => Promise<ProfilVocal | null>;
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
    compression: 40,
    outputGain: 1.0,
    antiLarsen: true,
    debruitage: 'navigateur',
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
            probabiliteDeVoix: 0,
            isWorkletReady: false,
            outputDeviceId: null,
            availableOutputs: [],
            inputDeviceId: null,
            availableInputs: [],
            
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
            setProbabiliteDeVoix: (probabilite) => set({ probabiliteDeVoix: probabilite }),
            
            toggleAntiLarsen: (active) => set((state) => ({ 
                currentEffects: { ...state.currentEffects, antiLarsen: active !== undefined ? active : !state.currentEffects.antiLarsen } 
            })),
            
            setDebruitage: (mode) => set((state) => ({
                currentEffects: { ...state.currentEffects, debruitage: mode },
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
            setInputDeviceId: (deviceId) => set({ inputDeviceId: deviceId }),
            setAvailableInputs: (devices) => set({ availableInputs: devices }),
            setWorkletReady: (ready) => set({ isWorkletReady: ready }),
            
            lastSyncedEntityId: null,
        lastSyncedEntityName: null,

            syncWithNpc: (personnage) => {
                const { isSyncNPC, lastSyncedEntityId, updateEffect, applyPreset, appliquerProfil } = get();
                if (!isSyncNPC || lastSyncedEntityId === personnage.id) return;

                /*
                  **Ce qu'on a réglé passe avant ce qu'on devine.**

                  Un profil enregistré est un choix du meneur — proposé par l'IA,
                  puis retouché aux curseurs. Les mots-clés ci-dessous sont une
                  approximation sur deux champs de texte : ils ne peuvent pas
                  passer devant. *Sans cette priorité, sélectionner un PNJ
                  effaçait sa propre voix.*
                */
                if (personnage.voiceProfile) {
                    appliquerProfil(personnage.voiceProfile);
                    set({ lastSyncedEntityId: personnage.id, lastSyncedEntityName: personnage.name });
                    return;
                }

                const text = texteDuPersonnage(personnage);

                // Repli par mots-clés, pour un PNJ dont la voix n'a jamais été réglée.
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
                    lastSyncedEntityId: personnage.id,
                    lastSyncedEntityName: personnage.name
                });
            },

            appliquerProfil: (profil) => set({
                currentEffects: { ...profil.effects },
                activePresetId: profil.presetId,
            }),

            generateVoiceProfile: async (personnage) => {
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

                const fieldsText = Object.entries(personnage.traits).map(([k, v]) => `${k}: ${v}`).join(', ');
                const prompt = `Analyse ce personnage et propose des réglages de voix.
Nom: ${personnage.name}
Traits: ${fieldsText}
Notes: ${personnage.notes}

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

                    set({ lastSyncedEntityId: personnage.id, lastSyncedEntityName: personnage.name || 'Unknown NPC' });
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
                outputDeviceId: state.outputDeviceId,
                inputDeviceId: state.inputDeviceId
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Ensure all new fields exist in currentEffects after hydration
                    state.currentEffects = { ...DEFAULT_EFFECTS, ...state.currentEffects };
                    /*
                      Le réglage de débruitage a changé de forme le 2026-09-03 :
                      un booléen est devenu trois positions. Sans cette
                      traduction, un rack enregistré le matin repartait « aucun
                      débruitage » — *un changement de forme ne doit jamais
                      changer un réglage en silence.*
                    */
                    state.currentEffects.debruitage = debruitageMigre(
                        state.currentEffects as unknown as { debruitage?: unknown; noiseSuppression?: unknown },
                        DEFAULT_EFFECTS.debruitage,
                    );
                }
            }
        }
    )
);
