import { useSoundStore } from './useSoundStore';
import { soundController } from './SoundController';
import type { SoundPad } from './useSoundStore';

// Local interfaces to avoid 'any' and resolve missing WebMidi types
interface MIDIInput {
    id: string;
    name?: string;
    onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

interface MIDIMessageEvent {
    data: Uint8Array;
}

interface MIDIConnectionEvent {
    port: {
        name?: string;
        state: string;
        type: string;
    };
}

interface MIDIAccess {
    inputs: {
        values: () => IterableIterator<MIDIInput>;
        forEach: (callback: (input: MIDIInput) => void) => void;
    };
    onstatechange: ((event: MIDIConnectionEvent) => void) | null;
}

// Interface for navigator extension
interface NavigatorWithMIDI extends Navigator {
    requestMIDIAccess?: () => Promise<MIDIAccess>;
}

export class MidiEngine {
    private static instance: MidiEngine;
    private midiAccess: MIDIAccess | null = null;
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
            const nav = navigator as NavigatorWithMIDI;
            if (nav.requestMIDIAccess) {
                try {
                    const access = await nav.requestMIDIAccess();
                    this.onMIDISuccess(access);
                    this.initialized = true;
                } catch (error) {
                    console.error('[MIDI] Failed to get MIDI access:', error);
                    this.initializationPromise = null; // Reset promise to allow retry
                }
            } else {
                console.warn('[MIDI] WebMIDI API not supported by this browser.');
            }
        })();

        return this.initializationPromise;
    }

    private onMIDISuccess(access: MIDIAccess) {
        this.midiAccess = access;
        console.log('[MIDI] MIDI Access granted.');

        const handleInputs = () => {
            const currentInputs: MIDIInput[] = [];
            access.inputs.forEach((input) => currentInputs.push(input));
            
            const names = currentInputs.map(i => i.name || 'Unknown Device');
            const count = currentInputs.length;
            
            console.log(`[MIDI] Detected ${count} device(s):`, names);
            useSoundStore.getState().setMidiConnected(count > 0);

            currentInputs.forEach(input => {
                input.onmidimessage = (event: MIDIMessageEvent) => this.onMIDIMessage(event);
            });
        };

        handleInputs();
        // Second check after a short delay for some browsers
        setTimeout(handleInputs, 500);

        access.onstatechange = (event: MIDIConnectionEvent) => {
            const port = event.port;
            console.log(`[MIDI] State Change: ${port.name} is now ${port.state} (${port.type})`);
            handleInputs();
        };
    }

    private onMIDIMessage(event: MIDIMessageEvent) {
        const [status, data1, data2] = event.data;
        const command = status >> 4;
        
        // Command 9 is Note On
        const isNoteOn = command === 9 && data2 > 0;

        if (isNoteOn) {
            this.handleMidiSignal(data1);
        }
    }

    private handleMidiSignal(midiNote: number) {
        const currentState = useSoundStore.getState();
        const activeAtmos = currentState.atmospheres.find(a => a.id === currentState.activeAtmosphereId) || currentState.atmospheres[0];

        // Learn Mode
        if (currentState.isMidiLearnActive && currentState.activePadLearnId) {
            console.log(`[MIDI] Learning mode: Mapping ${midiNote} to pad ${currentState.activePadLearnId}`);
            currentState.setPadMidiMapping(currentState.activePadLearnId, midiNote);
            currentState.toggleMidiLearn(); 
            currentState.setActiveLearnPad(null);
            return;
        }

        // Playback Mode
        const padToTrigger = Object.values(activeAtmos.pads).find((p: SoundPad) => p.midiMapping === midiNote);

        if (padToTrigger) {
            console.log(`[MIDI] Triggering pad: ${padToTrigger.name || padToTrigger.title} (Note ${midiNote})`);
            soundController.togglePad(padToTrigger.id);
        }
    }

    public refreshMidi() {
        if (this.midiAccess) {
            this.onMIDISuccess(this.midiAccess);
        } else {
            this.initialize();
        }
    }

    public cleanup() {
        if (this.midiAccess) {
            this.midiAccess.inputs.forEach(input => {
                input.onmidimessage = null;
            });
        }
        this.initialized = false;
        this.initializationPromise = null;
    }
}

export const midiEngine = MidiEngine.getInstance();
