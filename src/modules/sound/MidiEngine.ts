import { useSoundStore } from './useSoundStore';

// Local interfaces to replace 'any' and avoid environment type conflicts
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

export class MidiEngine {
    private static instance: MidiEngine;
    private initializationPromise: Promise<void> | null = null;
    private initialized: boolean = false;

    private constructor() {}

    public static getInstance(): MidiEngine {
        if (!MidiEngine.instance) {
            MidiEngine.instance = new MidiEngine();
        }
        return MidiEngine.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;
        if (this.initializationPromise) return this.initializationPromise;

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

        return this.initializationPromise;
    }

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

    private onMIDIMessage(event: GMMIDIMessageEvent): void {
        const [status, note, velocity] = event.data;
        const isNoteOn = (status & 0xF0) === 0x90 && velocity > 0;
        
        if (isNoteOn) {
            console.log(`[MIDI] Note On: ${note} (Vel: ${velocity})`);
            this.handleMIDINote(note);
        }
    }

    private handleMIDINote(midiNote: number): void {
        const { atmospheres, activeAtmosphereId, isMidiLearnActive } = useSoundStore.getState();
        const activeAtmosphere = atmospheres.find(a => a.id === activeAtmosphereId);
        if (!activeAtmosphere) return;

        // Mode Learning : On associe la note au dernier pad sélectionné (géré par le store)
        if (isMidiLearnActive) {
            console.log(`[MIDI] Learn mode active. Note received: ${midiNote}`);
            return;
        }

        // Mode Normal : On cherche si un pad est mappé à cette note
        const pads = Object.values(activeAtmosphere.pads);
        const padToTrigger = pads.find(p => p.midiMapping === midiNote);
        if (padToTrigger) {
            console.log(`[MIDI] Triggering pad: ${padToTrigger.title || padToTrigger.id} via Note ${midiNote}`);
            useSoundStore.getState().triggerPad(padToTrigger.id);
        }
    }
}

export const midiEngine = MidiEngine.getInstance();
