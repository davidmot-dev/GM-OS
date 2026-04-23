import { useSoundStore } from './useSoundStore';
import { soundController } from './SoundController';

/**
 * Interfaces locales pour la gestion MIDI (évite les conflits d'environnement).
 */
interface GMMIDIAccess {
    inputs: GMMIDIInputMap;
    outputs: GMMIDIOutputMap;
    onstatechange: ((event: GMMIDIConnectionEvent) => void) | null;
}

interface GMMIDIInputMap extends Map<string, GMMIDIInput> {
    __brand?: 'GMMIDIInputMap';
}
interface GMMIDIOutputMap extends Map<string, GMMIDIOutput> {
    __brand?: 'GMMIDIOutputMap';
}

interface GMMIDIInput {
    id: string;
    name?: string;
    onmidimessage: ((event: GMMIDIMessageEvent) => void) | null;
}

interface GMMIDIOutput {
    id: string;
    name?: string;
}

interface GMMIDIMessageEvent {
    data: Uint8Array;
}

interface GMMIDIConnectionEvent {
    port: {
        name: string;
        state: string;
        type: string;
    };
}

/**
 * Moteur de gestion des périphériques MIDI (Contrôleurs, Launchpads).
 * Permet de mapper des notes MIDI à des pads audio via un mode d'apprentissage (Learning).
 */
export class MidiEngine {
    private static instance: MidiEngine;
    private initializationPromise: Promise<void> | null = null;
    private initialized: boolean = false;

    private constructor() {}

    /**
     * Récupère l'instance unique du MidiEngine (Singleton).
     */
    public static getInstance(): MidiEngine {
        if (!MidiEngine.instance) {
            MidiEngine.instance = new MidiEngine();
        }
        return MidiEngine.instance;
    }

    /**
     * Réinitialise l'instance (Utile pour les tests unitaires).
     */
    public static resetInstance(): void {
        MidiEngine.instance = new MidiEngine();
    }

    /**
     * Initialise l'accès à l'API Web MIDI du navigateur.
     * @param force Si vrai, force une nouvelle demande d'accès même si déjà initialisé.
     */
    public async initialize(force: boolean = false): Promise<void> {
        if (this.initialized && !force) return;
        if (this.initializationPromise && !force) return this.initializationPromise;

        this.initialized = false; // Reset to allow re-initialization if forced
        this.initializationPromise = (async () => {
            interface MIDINavigator {
                requestMIDIAccess?: (options?: unknown) => Promise<GMMIDIAccess>;
            }
            const nav = navigator as unknown as MIDINavigator;
            if (nav.requestMIDIAccess) {
                try {
                    const access = await nav.requestMIDIAccess();
                    this.onMIDISuccess(access);
                    this.initialized = true;
                } catch (error) {
                    console.error('[MIDI] Failed to get MIDI access:', error);
                }
            } else {
                console.warn('[MIDI] Web MIDI API not supported in this browser.');
            }
        })();
        
        await this.initializationPromise;
        this.initializationPromise = null; // Clear promise so we can re-init later if needed
    }

    /**
     * Callback de succès de l'accès MIDI. Scanne les entrées et configure les listeners.
     */
    private onMIDISuccess(midiAccess: GMMIDIAccess): void {
        console.log('[MIDI] Access Granted');

        const scanInputs = () => {
            const inputs: GMMIDIInput[] = [];
            midiAccess.inputs.forEach((input) => inputs.push(input));
            
            console.log(`[MIDI] ${inputs.length} devices detected:`, inputs.map(i => i.name || i.id));
            useSoundStore.getState().setMidiConnected(inputs.length > 0);

            inputs.forEach((input) => {
                input.onmidimessage = (event) => this.onMIDIMessage(event);
            });
        };

        scanInputs();

        midiAccess.onstatechange = (event) => {
            console.log(`[MIDI] State change: ${event.port.name} is now ${event.port.state}`);
            scanInputs();
        };
    }

    /**
     * Analyse un message MIDI entrant. Filtre les événements Note On.
     */
    private onMIDIMessage(event: GMMIDIMessageEvent): void {
        const [status, note, velocity] = event.data;
        const isNoteOn = (status & 0xF0) === 0x90 && velocity > 0;
        
        if (isNoteOn) {
            console.log(`[MIDI] Note On: ${note} (Vel: ${velocity})`);
            this.handleMIDINote(note);
        }
    }

    /**
     * Traite une note MIDI reçue en fonction du mode (Normal ou Learning).
     * @param midiNote Numéro de la note MIDI (0-127).
     */
    private handleMIDINote(midiNote: number): void {
        const { atmospheres, activeAtmosphereId, isMidiLearnActive } = useSoundStore.getState();
        const activeAtmosphere = atmospheres.find(a => a.id === activeAtmosphereId);
        if (!activeAtmosphere) return;

        // Mode Learning : On associe la note au dernier pad sélectionné (géré par le store)
        if (isMidiLearnActive) {
            const { activePadLearnId, setPadMidiMapping, toggleMidiLearn } = useSoundStore.getState();
            if (activePadLearnId) {
                console.log(`[MIDI] Mapping Note ${midiNote} to ${activePadLearnId}`);
                setPadMidiMapping(activePadLearnId, midiNote);
                toggleMidiLearn(); // Automatiquement quitter le mode learn après capture
            }
            return;
        }

        // Mode Normal : On cherche si un pad est mappé à cette note
        const pads = Object.values(activeAtmosphere.pads);
        const padToTrigger = pads.find(p => p.midiMapping === midiNote);
        if (padToTrigger) {
            console.log(`[MIDI] Triggering pad: ${padToTrigger.title || padToTrigger.id} via Note ${midiNote}`);
            soundController.togglePad(padToTrigger.id);
        }
    }
}


export const midiEngine = MidiEngine.getInstance();
