import { useVoiceStore } from './useVoiceStore';

export class VoiceEngine {
    private static instance: VoiceEngine;
    private context: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;

    // Chain Nodes
    private inputGain: GainNode | null = null;
    private lowCut: BiquadFilterNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;
    private formantFilter: BiquadFilterNode | null = null;
    private distortion: WaveShaperNode | null = null;
    private reverb: ConvolverNode | null = null;
    private reverbGain: GainNode | null = null;
    private dryGain: GainNode | null = null;
    private outputGain: GainNode | null = null;
    private analyser: AnalyserNode | null = null;

    // Destinations
    private monitorGain: GainNode | null = null;
    private liveGain: GainNode | null = null;
    private gateGain: GainNode | null = null;
    private limiter: DynamicsCompressorNode | null = null;

    private isInitialized = false;
    private animationFrame: number | null = null;

    private constructor() {}

    public static getInstance(): VoiceEngine {
        if (!VoiceEngine.instance) {
            VoiceEngine.instance = new VoiceEngine();
        }
        return VoiceEngine.instance;
    }

    public async initialize() {
        if (this.isInitialized) return;

        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.context = new AudioContextClass({
                latencyHint: 'interactive'
            });

            const { currentEffects } = useVoiceStore.getState();

            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: currentEffects.antiLarsen,
                    noiseSuppression: currentEffects.antiLarsen,
                    autoGainControl: currentEffects.antiLarsen
                } 
            });

            this.source = this.context.createMediaStreamSource(this.stream);

            // 1. Analyser (at start to see raw input or at end? I'll put it at end for volume display)
            this.analyser = this.context.createAnalyser();
            this.analyser.fftSize = 256;

            // 2. Input Gain
            this.inputGain = this.context.createGain();

            // 3. Low Cut (High Pass)
            this.lowCut = this.context.createBiquadFilter();
            this.lowCut.type = 'highpass';

            // 4. Compressor (Acts as an Auto-Leveler)
            this.compressor = this.context.createDynamicsCompressor();
            this.compressor.threshold.value = -30; // Capture lower voices
            this.compressor.knee.value = 40;      // Very soft knee for natural feel
            this.compressor.ratio.value = 4;       // Gentle compression
            this.compressor.attack.value = 0.01;   // Fast enough for peaks
            this.compressor.release.value = 0.25;  // Smooth release
            this.dryGain = this.context.createGain();

            // 5. Formant (Peaking EQ)
            this.formantFilter = this.context.createBiquadFilter();
            this.formantFilter.type = 'peaking';
            this.formantFilter.frequency.value = 500;
            this.formantFilter.Q.value = 1.0;

            // 6. Distortion
            this.distortion = this.context.createWaveShaper();
            // @ts-expect-error - distortion.curve expects Float32Array but types are strict
            this.distortion.curve = this.makeDistortionCurve(0);
            this.distortion.oversample = '4x';

            // 7. Reverb
            this.reverb = this.context.createConvolver();
            this.reverb.buffer = await this.generateImpulseResponse(2.0, 2.0);
            this.reverbGain = this.context.createGain();
            this.reverbGain.gain.value = 0;

            // 8. Output & Monitors
            this.outputGain = this.context.createGain();
            this.monitorGain = this.context.createGain();
            this.liveGain = this.context.createGain();

            // 9. Noise Gate Gain
            this.gateGain = this.context.createGain();
            this.gateGain.gain.value = 0;

            // 10. Master Limiter (Brickwall)
            this.limiter = this.context.createDynamicsCompressor();
            this.limiter.threshold.value = -1.0;   // Hard limit near peak
            this.limiter.knee.value = 0;           // Hard knee for limiting
            this.limiter.ratio.value = 20;         // High ratio to block peaks
            this.limiter.attack.value = 0.001;     // Instant attack
            this.limiter.release.value = 0.1;      // Fast release

            // --- APPLY CURRENT STORE STATE ---
            const { isActive, isMonitor, isLive } = useVoiceStore.getState();
            this.inputGain.gain.value = isActive ? 1.0 : 0;
            this.monitorGain.gain.value = isMonitor ? 1.0 : 0;
            this.liveGain.gain.value = isLive ? 1.0 : 0;
            this.gateGain.gain.value = 1.0; // Open initially

            // Apply Effects
            if (currentEffects.lowCut === 0) {
                this.lowCut.frequency.value = 20;
            } else {
                this.lowCut.frequency.value = currentEffects.lowCut;
            }
            this.formantFilter.frequency.value = 500 + (currentEffects.formant * 5);
            this.formantFilter.gain.value = Math.abs(currentEffects.formant) / 5;
            this.reverbGain.gain.value = currentEffects.reverb;
            this.dryGain.gain.value = 1.0 - (currentEffects.reverb * 0.5);
            this.outputGain.gain.value = currentEffects.outputGain;

            // --- CONNECT CHAIN ---
            // source -> inputGain -> lowCut -> compressor -> formant -> distortion -> dry/wet reverb -> output -> monitor/live
            this.source.connect(this.inputGain);
            this.inputGain.connect(this.lowCut);
            this.lowCut.connect(this.compressor);
            this.compressor.connect(this.formantFilter);
            this.formantFilter.connect(this.distortion);
            
            // Reverb parallel paths
            this.distortion.connect(this.dryGain);
            this.distortion.connect(this.reverb);
            this.reverb.connect(this.reverbGain);
            
            this.dryGain.connect(this.outputGain);
            this.reverbGain.connect(this.outputGain);

            this.outputGain.connect(this.analyser);
            this.outputGain.connect(this.gateGain);
            this.gateGain.connect(this.limiter);
            
            // Final Destinations
            this.limiter.connect(this.monitorGain);
            this.monitorGain.connect(this.context.destination);
            
            this.limiter.connect(this.liveGain);
            this.liveGain.connect(this.context.destination);

            // Apply stored output device if any
            const { outputDeviceId } = useVoiceStore.getState();
            if (outputDeviceId) {
                this.updateOutputDevice(outputDeviceId).catch(err => console.error("Initial sinkId failed", err));
            }

            this.isInitialized = true;
            this.startLevelTracking();
            this.syncWithStore();
            this.refreshAvailableDevices();
            
            console.log('[VoiceEngine] Initialized');
        } catch (error) {
            console.error('[VoiceEngine] Initialization failed:', error);
            throw error;
        }
    }

    private makeDistortionCurve(amount: number): Float32Array {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0 ; i < n_samples; ++i ) {
            const x = i * 2 / n_samples - 1;
            curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
        }
        return curve;
    }

    private async generateImpulseResponse(duration: number, decay: number): Promise<AudioBuffer> {
        if (!this.context) throw new Error('Context not initialized');
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.context.createBuffer(2, length, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return buffer;
    }

    public async refreshAvailableDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const outputs = devices.filter(device => device.kind === 'audiooutput');
            useVoiceStore.getState().setAvailableOutputs(outputs);
        } catch (error) {
            console.error('[VoiceEngine] Failed to enumerate devices:', error);
        }
    }

    public async updateOutputDevice(deviceId: string) {
        if (!this.context) return;
        
        try {
            // @ts-expect-error - setSinkId is a recent experimental addition to AudioContext
            if (typeof this.context.setSinkId === 'function') {
                // @ts-expect-error - sinkId requires a string deviceId
                await this.context.setSinkId(deviceId);
                console.log(`[VoiceEngine] Output device changed to: ${deviceId}`);
            } else {
                console.warn('[VoiceEngine] setSinkId is not supported on this browser/environment');
            }
        } catch (error) {
            console.error('[VoiceEngine] Failed to set output device:', error);
        }
    }

    private startLevelTracking() {
        if (!this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const update = () => {
            this.analyser!.getByteTimeDomainData(dataArray);
            
            // Calculate RMS
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const val = (dataArray[i] - 128) / 128;
                sum += val * val;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const level = Math.min(1.0, rms * 5); // Scale for UI visibility
            
            // Dynamic Noise Gate Logic
            if (this.gateGain && this.context) {
                const { currentEffects, isActive } = useVoiceStore.getState();
                const db = 20 * Math.log10(rms || 0.000001);
                
                let targetGain = 1.0;
                if (!isActive || (currentEffects.noiseGate && db < currentEffects.gateThreshold)) {
                    targetGain = 0;
                }
                
                // smoothing = 0.1s for attack, 0.2s for release (expander feel)
                const timeConstant = targetGain > 0 ? 0.1 : 0.2;
                this.gateGain.gain.setTargetAtTime(targetGain, this.context.currentTime, timeConstant);
            }

            if (useVoiceStore.getState().isActive) {
                const currentLevel = level;
                useVoiceStore.getState().setInputLevel(currentLevel);
                
                // Sync with Player Hub if active
                if (window.appBridge?.image?.syncHubData) {
                    if (useVoiceStore.getState().isSyncNPC) {
                        window.appBridge.image.syncHubData('voice-level', currentLevel.toFixed(3));
                    } else {
                        // Ensure we send 0 to stop any ongoing animation
                        window.appBridge.image.syncHubData('voice-level', '0');
                    }
                }
            } else {
                useVoiceStore.getState().setInputLevel(0);
                if (window.appBridge?.image?.syncHubData) {
                    window.appBridge.image.syncHubData('voice-level', '0');
                }
            }
            this.animationFrame = requestAnimationFrame(update);
        };
        update();
    }

    public syncWithStore() {
        if (!this.isInitialized) return;

        useVoiceStore.subscribe((state, prevState) => {
            if (!this.context) return;
            
            const { currentEffects, isMonitor, isLive, isActive, outputDeviceId } = state;
            const prevEffects = prevState.currentEffects;

            // Handle Output Device changes
            if (outputDeviceId !== prevState.outputDeviceId && outputDeviceId) {
                this.updateOutputDevice(outputDeviceId);
            }

            // Handle Microphone constraint changes (Anti-Larsen toggle)
            if (currentEffects.antiLarsen !== prevEffects.antiLarsen && isActive) {
                console.log('[VoiceEngine] Re-initializing microphone for Anti-Larsen toggle');
                this.stop();
                this.initialize().catch(err => console.error("Re-initialization failed", err));
                return;
            }

            // 1. Master Active/Mute
            if (isActive !== prevState.isActive) {
                const masterVol = isActive ? 1.0 : 0;
                this.inputGain!.gain.setTargetAtTime(masterVol, this.context.currentTime, 0.05);
            }

            // 2. Monitoring & Live
            if (isMonitor !== prevState.isMonitor) {
                this.monitorGain!.gain.setTargetAtTime(isMonitor ? 1.0 : 0, this.context.currentTime, 0.05);
            }
            if (isLive !== prevState.isLive) {
                this.liveGain!.gain.setTargetAtTime(isLive ? 1.0 : 0, this.context.currentTime, 0.05);
            }

            // 3. Low Cut
            if (currentEffects.lowCut !== prevEffects.lowCut) {
                if (currentEffects.lowCut === 0) {
                    this.lowCut!.frequency.setTargetAtTime(20, this.context.currentTime, 0.05);
                } else {
                    this.lowCut!.frequency.setTargetAtTime(currentEffects.lowCut, this.context.currentTime, 0.05);
                }
            }

            // 4. Formant (Peaking EQ)
            if (currentEffects.formant !== prevEffects.formant) {
                const frequency = 500 + (currentEffects.formant * 5);
                const gain = Math.abs(currentEffects.formant) / 5;
                this.formantFilter!.frequency.setTargetAtTime(frequency, this.context.currentTime, 0.1);
                this.formantFilter!.gain.setTargetAtTime(gain, this.context.currentTime, 0.1);
            }

            // 5. Distortion - HEAVY OPERATION, MUST BE CONDITIONAL
            if (currentEffects.distortion !== prevEffects.distortion && this.distortion) {
                // @ts-expect-error - distortion.curve expects Float32Array
                this.distortion.curve = this.makeDistortionCurve(currentEffects.distortion * 100);
            }

            // 6. Reverb
            if (currentEffects.reverb !== prevEffects.reverb) {
                this.reverbGain!.gain.setTargetAtTime(currentEffects.reverb, this.context.currentTime, 0.1);
                this.dryGain!.gain.setTargetAtTime(1.0 - (currentEffects.reverb * 0.5), this.context.currentTime, 0.1);
            }

            // 7. Output Gain
            if (currentEffects.outputGain !== prevEffects.outputGain) {
                this.outputGain!.gain.setTargetAtTime(currentEffects.outputGain, this.context.currentTime, 0.1);
            }
        });
    }

    public stop() {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.context) {
            this.context.close();
        }
        
        // Reset state
        this.context = null;
        this.stream = null;
        this.source = null;
        this.isInitialized = false;
        
        // Reset UI levels
        useVoiceStore.getState().setInputLevel(0);
        if (window.appBridge?.image?.syncHubData) {
            window.appBridge.image.syncHubData('voice-level', '0');
        }
    }
}

export const voiceEngine = VoiceEngine.getInstance();
