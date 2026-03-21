import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
})

// Mock Web Audio API
class AudioContextMock {
    state = 'suspended';
    currentTime = 0;
    createGain = vi.fn(() => ({
        gain: {
            value: 1,
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            setTargetAtTime: vi.fn(),
            cancelScheduledValues: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
    }));
    createAnalyser = vi.fn(() => ({
        fftSize: 256,
        connect: vi.fn(),
        disconnect: vi.fn(),
    }));
    createBufferSource = vi.fn(() => ({
        buffer: null,
        loop: false,
        onended: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    }));
    createDynamicsCompressor = vi.fn(() => ({
        threshold: { setValueAtTime: vi.fn() },
        knee: { setValueAtTime: vi.fn() },
        ratio: { setValueAtTime: vi.fn() },
        attack: { setValueAtTime: vi.fn() },
        release: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
    }));
    createChannelSplitter = vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
    }));
    createChannelMerger = vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
    }));
    decodeAudioData = vi.fn().mockResolvedValue({});
    resume = vi.fn().mockResolvedValue(undefined);
    destination = {};
}

vi.stubGlobal('AudioContext', AudioContextMock);

// Mock WebMIDI API
const midiAccessMock = {
    inputs: new Map(),
    outputs: new Map(),
    onstatechange: null,
};

vi.stubGlobal('navigator', {
    ...navigator,
    requestMIDIAccess: vi.fn().mockResolvedValue(midiAccessMock),
});

// Mock appBridge
vi.stubGlobal('appBridge', {
    utils: {
        formatFileUrl: vi.fn((p) => `file:///${p}`),
    },
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }
});
