/**
 * Engine Audio pour Ambient OS v5
 * Gère 8 pistes d'ambiance en boucle avec fondu et compression master.
 */

class AmbientTrack {
    private context: AudioContext;
    private source: AudioBufferSourceNode | null = null;
    private gainNode: GainNode;
    private analyser: AnalyserNode;
    private splitter: ChannelSplitterNode;
    private merger: ChannelMergerNode;
    private buffer: AudioBuffer | null = null;
    private isPlaying: boolean = false;
    private currentUrl: string | null = null;

    constructor(context: AudioContext, destination: AudioNode) {
        this.context = context;
        this.gainNode = context.createGain();
        this.gainNode.gain.value = 0;

        this.analyser = context.createAnalyser();
        this.analyser.fftSize = 64;

        // Anti-Phase Routing (GM-OS v3 Legacy Correction)
        // Splits the signal and forces the left channel (0) to both Left and Right outputs
        this.splitter = context.createChannelSplitter(2);
        this.merger = context.createChannelMerger(2);

        this.splitter.connect(this.merger, 0, 0); // Left -> Left
        this.splitter.connect(this.merger, 0, 1); // Left -> Right (Summed mono)

        // Connect the chain
        this.merger.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(destination);
    }


    getAnalyser() {
        return this.analyser;
    }

    async load(url: string) {
        if (this.currentUrl === url && this.buffer) return;

        let finalUrl = url;
        if (url && !url.startsWith('http') && !url.startsWith('file://') && !url.startsWith('blob:')) {
            finalUrl = 'file:///' + url.replace(/\\/g, '/');
        }
        const encodedUrl = encodeURI(finalUrl).replace(/%5C/g, '/');

        try {
            const response = await fetch(encodedUrl);
            const arrayBuffer = await response.arrayBuffer();
            this.buffer = await this.context.decodeAudioData(arrayBuffer);
            this.currentUrl = url;
        } catch (e) {
            console.error(`[AmbientTrack] Erreur de chargement: ${url}`, e);
            throw e;
        }
    }

    play(volume: number = 0.5, fadeTime: number = 1.5) {
        if (!this.buffer || this.isPlaying) return;

        this.source = this.context.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.loop = true;
        this.source.connect(this.splitter);


        const now = this.context.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(volume, now + fadeTime);

        this.source.start(0);
        this.isPlaying = true;
    }

    stop(fadeTime: number = 1.0) {
        if (!this.source || !this.isPlaying) return;

        const now = this.context.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);

        const sourceToStop = this.source;
        setTimeout(() => {
            if (sourceToStop) {
                sourceToStop.stop();
                sourceToStop.disconnect();
            }
        }, fadeTime * 1000 + 100);

        this.isPlaying = false;
        this.source = null;
    }

    setVolume(volume: number) {
        const now = this.context.currentTime;
        this.gainNode.gain.setTargetAtTime(volume, now, 0.1);
    }
}

export class AmbientEngine {
    private context: AudioContext;
    private masterGain: GainNode;
    private compressor: DynamicsCompressorNode;
    private analyser: AnalyserNode;
    public tracks: AmbientTrack[] = [];

    constructor() {
        // @ts-expect-error - Support for legacy browsers
        this.context = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 48000
        });

        // Master Chain
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.context.currentTime);
        this.compressor.knee.setValueAtTime(30, this.context.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.context.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.context.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.context.currentTime);

        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 1.3; // Compensation gain

        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 256;

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        // Init 8 tracks
        for (let i = 0; i < 8; i++) {
            this.tracks.push(new AmbientTrack(this.context, this.compressor));
        }
    }

    async resume() {
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
    }

    fadeOutAll(fadeTime: number = 2.0) {
        this.tracks.forEach(track => track.stop(fadeTime));
    }

    getAnalyser() {
        return this.analyser;
    }

    public async setOutputDevice(deviceId: string) {
        if ('setSinkId' in this.context) {
            try {
                // @ts-expect-error AudioContext.setSinkId exists in modern browsers
                await this.context.setSinkId(deviceId === 'default' ? '' : deviceId);
                console.log(`[AmbientEngine] Output device changed to ${deviceId}`);
            } catch (error) {
                console.error('[AmbientEngine] Failed to set audio output device', error);
            }
        } else {
            console.warn('[AmbientEngine] AudioContext.setSinkId is not supported by this browser.');
        }
    }
}

// Singleton for Ambient OS
export const ambientEngine = new AmbientEngine();
