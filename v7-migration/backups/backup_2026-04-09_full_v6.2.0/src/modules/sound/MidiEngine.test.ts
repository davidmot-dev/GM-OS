import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MidiEngine } from './MidiEngine';
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
    const mockSetPadMidiMapping = vi.fn();
    const mockToggleMidiLearn = vi.fn();
    const mockSetMidiConnected = vi.fn();

    beforeEach(async () => {
        vi.clearAllMocks();
        MidiEngine.resetInstance();
        
        mockInput = { 
            id: 'in-1', 
            name: 'Mock Device', 
            onmidimessage: null 
        };

        // Setup default store state
        vi.mocked(useSoundStore.getState).mockReturnValue({
            atmospheres: [{ id: 'default', pads: { PAD_01: { id: 'PAD_01', title: 'Test', midiMapping: 60 } } }],
            activeAtmosphereId: 'default',
            isMidiLearnActive: false,
            activePadLearnId: null,
            setMidiConnected: mockSetMidiConnected,
            setPadMidiMapping: mockSetPadMidiMapping,
            toggleMidiLearn: mockToggleMidiLearn,
            setActiveLearnPad: vi.fn(),
        } as any);

        // Pre-configure the MIDI access mock
        const nav = navigator as any;
        const access = await nav.requestMIDIAccess();
        access.inputs.forEach = vi.fn((cb) => cb(mockInput));

        // Initialize once for all tests in this describe
        await MidiEngine.getInstance().initialize();
    });

    it('should initialize and request MIDI access', async () => {
        const nav = navigator as any;
        expect(nav.requestMIDIAccess).toHaveBeenCalled();
        expect(mockSetMidiConnected).toHaveBeenCalledWith(true);
    });

    it('should handle MIDI Note On messages', async () => {
        expect(mockInput.onmidimessage).toBeDefined();
        
        // Simulate Note On (Status 144 = Note On Ch 1, Note 60, Velocity 100)
        const event = { data: new Uint8Array([144, 60, 100]) } as any;
        mockInput.onmidimessage!(event);
        
        expect(soundController.togglePad).toHaveBeenCalledWith('PAD_01');
    });

    it('should enter learn mode and map a note to a pad', async () => {
        // Setup store for learn mode - OVERRIDE for this specific test
        vi.mocked(useSoundStore.getState).mockReturnValue({
            isMidiLearnActive: true,
            activePadLearnId: 'PAD_02',
            setPadMidiMapping: mockSetPadMidiMapping,
            toggleMidiLearn: mockToggleMidiLearn,
            setActiveLearnPad: vi.fn(),
            atmospheres: [{ id: 'default', pads: {} }],
            activeAtmosphereId: 'default'
        } as any);

        // Simulate Note On for Note 72
        const event = { data: new Uint8Array([144, 72, 100]) } as any;
        mockInput.onmidimessage!(event);

        expect(mockSetPadMidiMapping).toHaveBeenCalledWith('PAD_02', 72);
        expect(mockToggleMidiLearn).toHaveBeenCalled();
    });
});
