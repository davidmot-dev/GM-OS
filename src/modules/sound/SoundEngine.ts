import { useMediaStore } from '../../stores/useMediaStore';

export class SoundEngine {
    private static instance: SoundEngine;
    private context: AudioContext;
    private masterGain: GainNode;
    private padSources: Map<string, AudioBufferSourceNode> = new Map();
    private padGains: Map<string, GainNode> = new Map();
    private audioBuffers: Map<string, AudioBuffer> = new Map();

    private constructor() {
        // Initialize Web Audio API
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.context = new AudioContextClass();

        // Setup Master Gain
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 1.0;

        // Note: setSinkId is a newer API, need to check support
        // We will connect masterGain to destination by default
        this.masterGain.connect(this.context.destination);

        // Resume context if suspended (browser autoplay policy)
        if (this.context.state === 'suspended') {
            const resumeListener = () => {
                this.context.resume();
                document.removeEventListener('click', resumeListener);
            };
            document.addEventListener('click', resumeListener);
        }
    }

    public static getInstance(): SoundEngine {
        if (!SoundEngine.instance) {
            SoundEngine.instance = new SoundEngine();
        }
        return SoundEngine.instance;
    }

    private formatUrl(filePath: string): string {
        if (filePath.startsWith('http') || filePath.startsWith('data:') || filePath.startsWith('file://')) {
            return filePath;
        }
        // @ts-expect-error global
        if (window.appBridge?.utils?.formatFileUrl) {
            // @ts-expect-error global
            return window.appBridge.utils.formatFileUrl(filePath);
        }
        return filePath;
    }

    public async loadAudio(padId: string, filePath: string): Promise<void> {
        try {
            let arrayBuffer: ArrayBuffer;

            if (filePath && filePath.startsWith('m-')) {
                const { getMediaBlob } = useMediaStore.getState();
                const blob = await getMediaBlob(filePath);
                if (!blob) {
                    console.warn(`[SoundEngine] MediaBlob not found for ID: ${filePath}`);
                    return;
                }
                arrayBuffer = await blob.arrayBuffer();
            } else {
                const url = this.formatUrl(filePath);
                const response = await fetch(url);
                arrayBuffer = await response.arrayBuffer();
            }

            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(padId, audioBuffer);
            console.log(`[SoundEngine] Loaded ${filePath} for pad ${padId}`);
        } catch (error) {
            console.error(`[SoundEngine] Error loading audio for ${padId}:`, error);
        }
    }

    public play(padId: string, volume: number = 1.0, onEndedCallback?: () => void) {
        const buffer = this.audioBuffers.get(padId);
        if (!buffer) {
            console.warn(`[SoundEngine] Cannot play ${padId}, buffer not loaded.`);
            return;
        }

        // Stop existing playback for this pad if any
        this.stop(padId);

        // Create individual gain node
        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(this.masterGain);
        this.padGains.set(padId, gainNode);

        // Create buffer source
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(gainNode);

        source.onended = () => {
            this.padSources.delete(padId);
            this.padGains.delete(padId);
            gainNode.disconnect();
            if (onEndedCallback) onEndedCallback();
        };

        source.start(0);
        this.padSources.set(padId, source);
    }

    public stop(padId: string) {
        const source = this.padSources.get(padId);
        if (source) {
            source.stop();
            source.disconnect();
            this.padSources.delete(padId);
        }

        const gain = this.padGains.get(padId);
        if (gain) {
            gain.disconnect();
            this.padGains.delete(padId);
        }
    }

    public stopAll() {
        console.log('[SoundEngine] Executing 3s Master Fade-Out');

        // 1. Fade out the master gain over 3 seconds
        const currentTime = this.context.currentTime;
        this.masterGain.gain.cancelScheduledValues(currentTime);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0, currentTime + 3);

        // 2. Schedule actual stop and disconnect for all sources after 3.1s
        setTimeout(() => {
            this.padSources.forEach((source) => {
                try {
                    source.stop();
                    source.disconnect();
                } catch {
                    // Ignore errors if source is already stopped/disconnected
                }
            });
            this.padSources.clear();

            this.padGains.forEach(gain => gain.disconnect());
            this.padGains.clear();

            // 3. Reset Master Gain instantly back to original setting (default 1.0) for future playbacks
            this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
            this.masterGain.gain.setValueAtTime(1.0, this.context.currentTime);

            console.log('[SoundEngine] All sources stopped. Engine ready.');
        }, 3100);
    }

    public setVolume(padId: string, volume: number) {
        const gain = this.padGains.get(padId);
        if (gain) {
            // Smoothly ramp volume to avoid clicks
            gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
        }
    }

    public setMasterVolume(volume: number) {
        this.masterGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
    }

    public async setOutputDevice(deviceId: string) {
        if ('setSinkId' in this.context) {
            try {
                // @ts-expect-error AudioContext.setSinkId exists in modern browsers
                await this.context.setSinkId(deviceId === 'default' ? '' : deviceId);
                console.log(`[SoundEngine] Output device changed to ${deviceId}`);
            } catch (error: unknown) {
                const err = error as { name?: string; message?: string };
                if (err.name === 'NotFoundError') {
                    console.warn(`[SoundEngine] Device ${deviceId} not found, falling back to default.`);
                    // @ts-expect-error fallback
                    await this.context.setSinkId('');
                } else {
                    console.error('[SoundEngine] Failed to set audio output device', error);
                }
            }
        } else {
            console.warn('[SoundEngine] AudioContext.setSinkId is not supported by this browser.');
        }
    }
}

export const soundEngine = SoundEngine.getInstance();
