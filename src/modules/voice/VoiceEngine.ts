import { useVoiceStore } from './useVoiceStore';

/**
 * Moteur de traitement de la voix en temps réel.
 * Gère l'acquisition du microphone, les effets (Pitch, Distortion, Bitcrush), 
 * la réverbération, le noise gate dynamique et le ducking (atténuation automatique de l'ambiance).
 * Utilise un AudioWorklet pour le traitement basse latence.
 */
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
    private voiceWorklet: AudioWorkletNode | null = null;
    private reverb: ConvolverNode | null = null;
    private reverbGain: GainNode | null = null;
    private dryGain: GainNode | null = null;
    private outputGain: GainNode | null = null;
    private analyser: AnalyserNode | null = null;

    // Destinations
    private monitorGain: GainNode | null = null;
    private liveGain: GainNode | null = null;
    private globalSyncGain: GainNode | null = null;
    private gateGain: GainNode | null = null;
    private limiter: DynamicsCompressorNode | null = null;

    private isInitialized = false;
    private animationFrame: number | null = null;

    private constructor() {}

    /**
     * Récupère l'instance unique du VoiceEngine (Singleton).
     */
    public static getInstance(): VoiceEngine {
        if (!VoiceEngine.instance) {
            VoiceEngine.instance = new VoiceEngine();
        }
        return VoiceEngine.instance;
    }

    /**
     * Initialise le contexte audio, capture le microphone et configure la chaîne d'effets.
     * Configure également les contraintes optimales pour la clarté vocale (écho, suppression de bruit).
     */
    public async initialize() {
        if (this.isInitialized) return;

        try {
            this.context = new AudioContext({
                latencyHint: 'interactive'
            });

            // Ensure context is running (required for many browsers/Tauri)
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }

            const { currentEffects } = useVoiceStore.getState();

            // Apple Google Meet-style constraints for voice clarity
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    // Always-on DSP processing (OS-level, most effective)
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: currentEffects.antiLarsen, // User-controlled
                    // Voice-optimized acquisition
                    sampleRate: { ideal: 16000 },   // Optimal for speech (like Google Meet)
                    channelCount: { ideal: 1 },     // Mono: eliminates stereo noise bleed
                } 
            });

            this.source = this.context.createMediaStreamSource(this.stream);

            // 1. Analyser (at start to see raw input or at end? I'll put it at end for volume display)
            this.analyser = this.context.createAnalyser();
            this.analyser.fftSize = 256;

            // 2. Input Gain
            this.inputGain = this.context.createGain();

            // 3. Low Cut (High Pass) — 120Hz default cuts table rumble & fan noise
            this.lowCut = this.context.createBiquadFilter();
            this.lowCut.type = 'highpass';
            this.lowCut.frequency.value = 120; // Aggressive default (Google Meet uses ~100-120Hz)
            this.lowCut.Q.value = 0.707; // Butterworth — maximally flat passband

            // 4. Compressor — "Broadcast" style (tight, controlled, consistent)
            this.compressor = this.context.createDynamicsCompressor();
            this.compressor.threshold.value = -24; // Catches most speech levels
            this.compressor.knee.value = 6;        // Tighter knee for more aggressive onset
            this.compressor.ratio.value = 8;       // Broadcast ratio — strong leveling
            this.compressor.attack.value = 0.003;  // Ultra-fast: catches every consonant
            this.compressor.release.value = 0.15;  // Fast release: voice "breathes" naturally
            this.dryGain = this.context.createGain();

            // 5. Formant (Peaking EQ)
            this.formantFilter = this.context.createBiquadFilter();
            this.formantFilter.type = 'peaking';
            this.formantFilter.frequency.value = 500;
            this.formantFilter.Q.value = 1.0;

            // 6. AudioWorklet (Voice Processor)
            try {
                // Use absolute path from public root, but ensure it's loaded properly
                await this.context.audioWorklet.addModule('/audio/voice-processor.js');
                this.voiceWorklet = new AudioWorkletNode(this.context, 'voice-processor');
                
                // Initialize parameters
                const { currentEffects: initialEffects } = useVoiceStore.getState();
                const pitchValue = Math.pow(2, (initialEffects.pitch || 0) / 12);
                this.voiceWorklet.parameters.get('pitch')?.setValueAtTime(pitchValue, this.context.currentTime);
                this.voiceWorklet.parameters.get('distortion')?.setValueAtTime(initialEffects.distortion || 0, this.context.currentTime);
                this.voiceWorklet.parameters.get('bitcrush')?.setValueAtTime(initialEffects.bitcrush || 0, this.context.currentTime);

                useVoiceStore.getState().setWorkletReady(true);
                console.log('[VoiceEngine] AudioWorklet Loaded & Registered');
            } catch (e) {
                console.error('[VoiceEngine] Failed to load AudioWorklet:', e);
                useVoiceStore.getState().setWorkletReady(false);
            }

            // 7. Reverb
            this.reverb = this.context.createConvolver();
            this.reverb.buffer = await this.generateImpulseResponse(2.0, 2.0);
            this.reverbGain = this.context.createGain();
            this.reverbGain.gain.value = 0;

            // 8. Output & Monitors
            this.outputGain = this.context.createGain();
            this.monitorGain = this.context.createGain();
            this.liveGain = this.context.createGain();
            this.globalSyncGain = this.context.createGain();
            this.globalSyncGain.gain.value = 1.0;

            // 9. Noise Gate Gain
            this.gateGain = this.context.createGain();
            this.gateGain.gain.value = 0;

            // 10. Master Limiter (Brickwall)
            this.limiter = this.context.createDynamicsCompressor();
            this.limiter.threshold.value = -3.0;   // Safe limit to prevent distortion downstream
            this.limiter.knee.value = 0;           // Hard knee for limiting
            this.limiter.ratio.value = 20;         // High ratio to block peaks
            this.limiter.attack.value = 0.001;     // Instant attack
            this.limiter.release.value = 0.1;      // Fast release

            // --- APPLY CURRENT STORE STATE ---
            const { isActive, isMonitor, isLive, currentEffects: effects } = useVoiceStore.getState();
            this.inputGain.gain.value = isActive ? 1.0 : 0;
            this.monitorGain.gain.value = isMonitor ? 1.0 : 0;
            this.liveGain.gain.value = isLive ? 1.0 : 0;
            this.gateGain.gain.value = 1.0; // Open initially

            // Apply Effects
            if (effects.lowCut === 0) {
                this.lowCut.frequency.value = 120; // Default to voice-optimized 120Hz
            } else {
                this.lowCut.frequency.value = effects.lowCut;
            }
            this.formantFilter.frequency.value = 500 + (effects.formant * 5);
            this.formantFilter.gain.value = Math.abs(effects.formant) / 5;
            this.reverbGain.gain.value = effects.reverb;
            this.dryGain.gain.value = 1.0 - (effects.reverb * 0.5);
            this.outputGain.gain.value = effects.outputGain;

            // --- CONNECT CHAIN ---
            // source -> inputGain -> lowCut -> compressor -> formant -> distortion -> dry/wet reverb -> output -> monitor/live
            this.source.connect(this.inputGain);
            this.inputGain.connect(this.lowCut);
            this.lowCut.connect(this.compressor);
            this.compressor.connect(this.formantFilter);
            
            if (this.voiceWorklet) {
                this.formantFilter.connect(this.voiceWorklet);
                this.voiceWorklet.connect(this.dryGain);
                this.voiceWorklet.connect(this.reverb);
            } else {
                // Fallback direct connection
                this.formantFilter.connect(this.dryGain);
                this.formantFilter.connect(this.reverb);
            }
            
            this.reverb.connect(this.reverbGain);
            
            this.dryGain.connect(this.outputGain);
            this.reverbGain.connect(this.outputGain);

            this.outputGain.connect(this.analyser);
            this.outputGain.connect(this.gateGain);
            this.gateGain.connect(this.limiter);
            
            // Final Destinations
            this.limiter.connect(this.monitorGain);
            this.monitorGain.connect(this.globalSyncGain);
            
            this.limiter.connect(this.liveGain);
            this.liveGain.connect(this.globalSyncGain);

            this.globalSyncGain.connect(this.context.destination);

            // Apply stored output device if any
            const { outputDeviceId } = useVoiceStore.getState();
            if (outputDeviceId) {
                this.updateOutputDevice(outputDeviceId).catch(err => console.error("Initial sinkId failed", err));
            }

            this.isInitialized = true;
            this.startLevelTracking();
            this.syncWithStore();
            this.setupGlobalSync();
            this.refreshAvailableDevices();
            
            console.log('[VoiceEngine] Initialized');
        } catch (error) {
            console.error('[VoiceEngine] Initialization failed:', error);
            throw error;
        }
    }


    /**
     * Génère une impulsion aléatoire pour la réverbération algorithmique.
     * @param duration Durée de la queue de réverbération en secondes.
     * @param decay Facteur de décroissance exponentielle.
     * @returns Un AudioBuffer contenant l'impulsion générée.
     */
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

    /**
     * Liste les périphériques de sortie audio disponibles.
     * Met à jour la liste dans le store global.
     */
    public async refreshAvailableDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const outputs = devices.filter(device => device.kind === 'audiooutput');
            useVoiceStore.getState().setAvailableOutputs(outputs);
        } catch (error) {
            console.error('[VoiceEngine] Failed to enumerate devices:', error);
        }
    }

    /**
     * Change le périphérique de sortie audio utilisé par le contexte.
     * @param deviceId Identifiant unique du périphérique (sinkId).
     */
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

    private duckingTimeout: number | null = null;

    /**
     * Démarre l'analyse en temps réel du niveau d'entrée.
     * Gère également la logique du Noise Gate et la détection du Ducking.
     * Synchronise le niveau de voix avec le Player Hub via le bridge.
     */
    private startLevelTracking() {
        if (!this.analyser) return;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const update = () => {
            if (!this.analyser) return;
            this.analyser.getByteTimeDomainData(dataArray);
            
            // Calculate RMS
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const val = (dataArray[i] - 128) / 128;
                sum += val * val;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const level = Math.min(1.0, rms * 5); // Scale for UI visibility
            const db = 20 * Math.log10(rms || 0.000001);
            
            // Dynamic Noise Gate Logic
            if (this.gateGain && this.context) {
                const { currentEffects, isActive } = useVoiceStore.getState();
                
                let targetGain = 1.0;
                if (!isActive || (currentEffects.noiseGate && db < currentEffects.gateThreshold)) {
                    targetGain = 0;
                }
                
                // More reactive gate: fast open (0.005s) for crisp voice onset, slower close (0.4s) to avoid pumping
                const timeConstant = targetGain > 0 ? 0.005 : 0.4;
                this.gateGain.gain.setTargetAtTime(targetGain, this.context.currentTime, timeConstant);

                // --- DUCKING DETECTION ---
                if (isActive && currentEffects.duckingEnabled) {
                    if (db > currentEffects.duckingThreshold) {
                        if (this.duckingTimeout) {
                            clearTimeout(this.duckingTimeout);
                            this.duckingTimeout = null;
                        }
                        useVoiceStore.getState().setDucking(true);
                    } else if (useVoiceStore.getState().isDucking && !this.duckingTimeout) {
                        this.duckingTimeout = window.setTimeout(() => {
                            useVoiceStore.getState().setDucking(false);
                            this.duckingTimeout = null;
                        }, currentEffects.duckingRelease); // Smooth narrative release
                    }
                } else if (useVoiceStore.getState().isDucking) {
                    useVoiceStore.getState().setDucking(false);
                }
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

    /**
     * Abonne l'engine aux mutations du store global Voice.
     * Permet d'appliquer les changements de paramètres (Pitch, Gain, etc.) en temps réel sur la chaîne audio.
     */
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

            // 5. Worklet Parameters (Pitch, Distortion, Bitcrush)
            if (this.voiceWorklet) {
                const pitchParam = this.voiceWorklet.parameters.get('pitch');
                const distortionParam = this.voiceWorklet.parameters.get('distortion');
                const bitcrushParam = this.voiceWorklet.parameters.get('bitcrush');

                // Semitones to multiplier
                const pitchValue = Math.pow(2, (currentEffects.pitch || 0) / 12);
                pitchParam?.setTargetAtTime(pitchValue, this.context.currentTime, 0.1);
                
                distortionParam?.setTargetAtTime(currentEffects.distortion || 0, this.context.currentTime, 0.1);
                bitcrushParam?.setTargetAtTime(currentEffects.bitcrush || 0, this.context.currentTime, 0.1);
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

    /**
     * S'abonne au store master pour appliquer le volume global.
     * La voix n'est PAS atténuée par le mode Focus Chat.
     */
    private async setupGlobalSync() {
        if (!this.context || !this.globalSyncGain) return;
        
        const { useAudioMasterStore } = await import('../../stores/useAudioMasterStore');
        
        useAudioMasterStore.subscribe((state) => {
            const { masterVolume } = state;
            // La voix suit uniquement le master global
            this.globalSyncGain!.gain.setTargetAtTime(masterVolume, this.context!.currentTime, 0.1);
        });
    }

    /**
     * Arrête complètement l'engine, ferme le flux du microphone et le contexte audio.
     */
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
