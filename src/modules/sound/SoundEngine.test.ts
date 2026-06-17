import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundEngine } from './SoundEngine';

// Mock the MediaStore
vi.mock('../../stores/useMediaStore', () => ({
    useMediaStore: {
        getState: vi.fn(() => ({
            isInitialized: true,
            initDB: vi.fn().mockResolvedValue(undefined),
            getMediaBlob: vi.fn().mockResolvedValue(new Blob(['test-audio'], { type: 'audio/mpeg' })),
        })),
    },
}));

describe('SoundEngine', () => {
    let engine: SoundEngine;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the singleton instance for a fresh state in each test
        SoundEngine.resetInstance();
        engine = SoundEngine.getInstance();
    });

    it('should initialize with an AudioContext and master gain', () => {
        expect(engine.context).toBeDefined();
        expect(engine.masterGain).toBeDefined();
        // createGain should have been called twice (once for master gain, once for globalSync gain) in the constructor
        expect(engine.context.createGain).toHaveBeenCalledTimes(2);
    });

    it('should format URLs correctly', () => {
        expect(engine.formatUrl('http://example.com/sound.mp3')).toBe('http://example.com/sound.mp3');
        expect(engine.formatUrl('test.mp3')).toBe('file:///test.mp3'); // Mocked bridge behavior from setup.ts
    });

    it('should load audio from media store for m- ids', async () => {
        const decodeSpy = vi.spyOn(engine.context, 'decodeAudioData');
        await engine.loadAudio('pad-1', 'm-123');
        
        expect(decodeSpy).toHaveBeenCalled();
    });

    it('should play a loaded buffer', async () => {
        // First load a fake buffer
        await engine.loadAudio('pad-1', 'm-123');
        
        // At this point, createGain was called twice (for master + globalSync)
        engine.play('pad-1', 0.8);
        
        // Now createGain should have been called three times (master + globalSync + pad)
        expect(engine.context.createGain).toHaveBeenCalledTimes(3);
        expect(engine.context.createBufferSource).toHaveBeenCalledTimes(1);
        
        const sourceMock = vi.mocked(engine.context.createBufferSource).mock.results[0].value;
        const gainMock = vi.mocked(engine.context.createGain).mock.results[2].value; // First two calls were constructor, third is pad
        
        expect(sourceMock.start).toHaveBeenCalledWith(0);
        expect(gainMock.gain.value).toBe(0.8);
    });

    it('should stop playback for a pad', async () => {
        await engine.loadAudio('pad-1', 'm-123');
        engine.play('pad-1');
        
        const sourceMock = vi.mocked(engine.context.createBufferSource).mock.results[0].value;
        engine.stop('pad-1');
        
        expect(sourceMock.stop).toHaveBeenCalled();
        expect(sourceMock.disconnect).toHaveBeenCalled();
    });

    it('should handle master volume changes', () => {
        engine.setMasterVolume(0.5);
        expect(engine.masterGain.gain.setTargetAtTime).toHaveBeenCalledWith(0.5, expect.any(Number), 0.05);
    });

    it('should attempt to set output device if supported', async () => {
        // @ts-expect-error adding sinkId to mock
        engine.context.setSinkId = vi.fn().mockResolvedValue(undefined);
        
        await engine.setOutputDevice('device-123');
        // @ts-expect-error check
        expect(engine.context.setSinkId).toHaveBeenCalledWith('device-123');
    });
});
