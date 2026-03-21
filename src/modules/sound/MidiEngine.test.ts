import { describe, it, expect, vi, beforeEach } from 'vitest';
import { midiEngine, MidiEngine } from './MidiEngine';
import { useSoundStore } from './useSoundStore';
import { soundController } from './SoundController';

// Mock the dependencies
vi.mock('./useSoundStore', () => ({
    useSoundStore: {
        getState: vi.fn(),
    },
}));

vi.mock('./SoundController', () => ({
    soundController: {
        togglePad: vi.fn(),
    },
}));

describe('MidiEngine', () => {
    let mockInput: any;

    beforeEach(() => {
        vi.clearAllMocks();
        MidiEngine.resetInstance();
        
        mockInput = { 
            id: 'in-1', 
            name: 'Mock Device', 
            onmidimessage: null 
        };

        // Pre-configure the MIDI access mock from setup.ts to use our local mockInput
        const nav = navigator as any;
        nav.requestMIDIAccess().then((access: any) => {
            access.inputs.forEach = vi.fn((cb) => cb(mockInput));
        });

        // Setup default store state
        vi.mocked(useSoundStore.getState).mockReturnValue({
            atmospheres: [{ id: 'default', pads: { PAD_01: { id: 'PAD_01', title: 'Test', midiMapping: 60 } } }],
            activeAtmosphereId: 'default',
            isMidiLearnActive: false,
            activePadLearnId: null,
            setMidiConnected: vi.fn(),
            setPadMidiMapping: vi.fn(),
            toggleMidiLearn: vi.fn(),
            setActiveLearnPad: vi.fn(),
        } as any);
    });

    it('should initialize and request MIDI access', async () => {
        const nav = navigator as any;
        await midiEngine.initialize();
        expect(nav.requestMIDIAccess).toHaveBeenCalled();
    });

    it('should handle MIDI Note On messages', async () => {
        await midiEngine.initialize();
        
        // Ensure inputs are refreshed to attach onmidimessage
        midiEngine.refreshMidi();
        
        expect(mockInput.onmidimessage).toBeDefined();
        
        // Simulate Note On (Status 144 = Note On Ch 1, Note 60, Velocity 100)
        const event = { data: new Uint8Array([144, 60, 100]) } as any;
        mockInput.onmidimessage!(event);
        
        expect(soundController.togglePad).toHaveBeenCalledWith('PAD_01');
    });

    it('should enter learn mode and map a note to a pad', async () => {
        // Setup store for learn mode
        vi.mocked(useSoundStore.getState).mockReturnValue({
            isMidiLearnActive: true,
            activePadLearnId: 'PAD_02',
            setPadMidiMapping: vi.fn(),
            toggleMidiLearn: vi.fn(),
            setActiveLearnPad: vi.fn(),
            atmospheres: [{ id: 'default', pads: {} }], // Pad 2 not mapped yet
        } as any);

        await midiEngine.initialize();
        midiEngine.refreshMidi();

        // Simulate Note On for Note 72
        const event = { data: new Uint8Array([144, 72, 100]) } as any;
        mockInput.onmidimessage!(event);

        const state = useSoundStore.getState();
        expect(state.setPadMidiMapping).toHaveBeenCalledWith('PAD_02', 72);
        expect(state.toggleMidiLearn).toHaveBeenCalled();
    });
});
