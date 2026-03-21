import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ambientEngine, resetAmbientEngine } from './AmbientEngine';

// Mock the MediaStore
vi.mock('../../stores/useMediaStore', () => ({
    useMediaStore: {
        getState: vi.fn(() => ({
            getMediaBlob: vi.fn().mockResolvedValue(new Blob(['test-audio'], { type: 'audio/mpeg' })),
        })),
    },
}));

describe('AmbientEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetAmbientEngine();
    });

    it('should initialize with 8 tracks and a master chain', () => {
        expect(ambientEngine.tracks.length).toBe(8);
        // Master chain: compressor -> masterGain -> analyser -> destination
        expect(vi.mocked(ambientEngine['context'].createDynamicsCompressor)).toHaveBeenCalled();
        expect(vi.mocked(ambientEngine['context'].createGain)).toHaveBeenCalled();
        expect(vi.mocked(ambientEngine['context'].createAnalyser)).toHaveBeenCalled();
    });

    it('should configure the compressor correctly', () => {
        const compressor = ambientEngine['compressor'];
        expect(compressor.threshold.setValueAtTime).toHaveBeenCalledWith(-24, expect.any(Number));
        expect(compressor.ratio.setValueAtTime).toHaveBeenCalledWith(12, expect.any(Number));
    });

    it('should handle output device changes', async () => {
        // @ts-expect-error adding sinkId to mock
        ambientEngine['context'].setSinkId = vi.fn().mockResolvedValue(undefined);
        
        await ambientEngine.setOutputDevice('audio-out-1');
        // @ts-expect-error check
        expect(ambientEngine['context'].setSinkId).toHaveBeenCalledWith('audio-out-1');
    });

    describe('AmbientTrack', () => {
        it('should initialize with mono-summing routing', () => {
            const track = ambientEngine.tracks[0];
            // Splitter(2) -> [Left, Right]
            // We connect Left (0) to Merger Left (0) and Merger Right (1)
            expect(vi.mocked(ambientEngine['context'].createChannelSplitter)).toHaveBeenCalled();
            expect(vi.mocked(ambientEngine['context'].createChannelMerger)).toHaveBeenCalled();
            
            const splitter = vi.mocked(track['splitter']);
            expect(splitter.connect).toHaveBeenCalledWith(track['merger'], 0, 0);
            expect(splitter.connect).toHaveBeenCalledWith(track['merger'], 0, 1);
        });

        it('should load audio and play with fade-in', async () => {
            const track = ambientEngine.tracks[0];
            const decodeSpy = vi.spyOn(ambientEngine['context'], 'decodeAudioData');
            
            await track.load('m-ambient-1');
            expect(decodeSpy).toHaveBeenCalled();
            
            track.play(0.6, 2.0);
            
            expect(vi.mocked(ambientEngine['context'].createBufferSource)).toHaveBeenCalled();
            const gainNode = track['gainNode'];
            expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.6, expect.any(Number));
        });

        it('should stop with fade-out', async () => {
            const track = ambientEngine.tracks[0];
            await track.load('m-ambient-1');
            track.play();
            
            const source = track['source'];
            track.stop(1.5);
            
            expect(track['gainNode'].gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
            // The actual stop happens in a setTimeout, we might need vi.useFakeTimers() if we want to be strict
        });
    });

    it('should fade out all tracks', () => {
        const stopSpies = ambientEngine.tracks.map(t => vi.spyOn(t, 'stop'));
        ambientEngine.fadeOutAll(3.0);
        
        stopSpies.forEach(spy => expect(spy).toHaveBeenCalledWith(3.0));
    });
});
