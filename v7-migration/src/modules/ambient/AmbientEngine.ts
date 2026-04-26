import { useMediaStore } from '../../stores/useMediaStore';

/**
 * Représente une piste d'ambiance individuelle.
 * Gère le chargement, la lecture en boucle et les fondus (fade-in/fade-out).
 * Inclut un routage spécifique pour corriger les problèmes de phase (Mono Summed).
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


    /**
     * Récupère l'analyseur de fréquence de la piste.
     */
    getAnalyser() {
        return this.analyser;
    }

    /**
     * Charge un fichier audio depuis une URL ou un ID MediaStore.
     * @param url Chemin du fichier ou identifiant 'm-XXX'.
     */
    async load(url: string) {
        if (this.currentUrl === url && this.buffer) return;

        try {
            let arrayBuffer: ArrayBuffer;

            if (url && url.startsWith('m-')) {
                const mediaStore = useMediaStore.getState();
                if (!mediaStore.isInitialized) {
                    await mediaStore.initDB();
                }
                const blob = await mediaStore.getMediaBlob(url);
                if (!blob) {
                    console.error(`[AmbientTrack] MediaBlob not found for ID: ${url}`);
                    if (window.useToastStore) window.useToastStore.getState().gmToast('error', `Fichier d'ambiance introuvable dans la base de données.`);
                    return;
                }
                arrayBuffer = await blob.arrayBuffer();
            } else {
                let finalUrl = url;
                if (url && !url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('gmos://')) {
                    const cleanPath = url.replace(/^file:\/\/\//, '').replace(/\\/g, '/');
                    finalUrl = `gmos://media/${cleanPath}`;
                }
                const encodedUrl = encodeURI(finalUrl).replace(/%5C/g, '/');

                const response = await fetch(encodedUrl);
                arrayBuffer = await response.arrayBuffer();
            }

            this.buffer = await this.context.decodeAudioData(arrayBuffer);
            this.currentUrl = url;
        } catch (e) {
            console.error(`[AmbientTrack] Erreur de chargement: ${url}`, e);
            throw e;
        }
    }

    /**
     * Démarre la lecture de la piste avec un fondu d'entrée.
     * @param volume Volume cible (0.0 à 1.0).
     * @param fadeTime Durée du fondu en secondes.
     */
    play(volume: number = 0.5, fadeTime: number = 1.5) {
        if (!this.buffer || this.isPlaying) return;

        // Ensure context is resumed for remote triggers
        if (this.context.state === 'suspended') {
            this.context.resume().catch(e => console.error('[AmbientTrack] Failed to resume context:', e));
        }

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

    /**
     * Arrête la lecture de la piste avec un fondu de sortie.
     * @param fadeTime Durée du fondu en secondes.
     */
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

    /**
     * Ajuste le volume de la piste en temps réel.
     * @param volume Nouveau volume (0.0 à 1.0).
     */
    setVolume(volume: number) {
        const now = this.context.currentTime;
        this.gainNode.gain.setTargetAtTime(volume, now, 0.1);
    }
}

/**
 * Moteur principal pour Ambient OS.
 * Gère 8 pistes indépendantes avec mixage master, compression et ducking réactif à la voix.
 */
export class AmbientEngine {
    private context: AudioContext;
    private masterGain: GainNode;
    private duckingGain: GainNode;
    private globalSyncGain: GainNode;
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

        this.duckingGain = this.context.createGain();
        this.duckingGain.gain.value = 1.0;

        this.globalSyncGain = this.context.createGain();
        this.globalSyncGain.gain.value = 1.0;

        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 256;

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.duckingGain);
        this.duckingGain.connect(this.globalSyncGain);
        this.globalSyncGain.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        // Init 8 tracks
        for (let i = 0; i < 8; i++) {
            this.tracks.push(new AmbientTrack(this.context, this.compressor));
        }

        this.setupDucking();
        this.setupGlobalSync();
    }

    /**
     * S'abonne au store master pour appliquer le volume global et le mode Focus Chat.
     */
    private async setupGlobalSync() {
        const { useAudioMasterStore } = await import('../../stores/useAudioMasterStore');
        
        useAudioMasterStore.subscribe((state) => {
            const { masterVolume, isFocusMode, focusDuckingRatio } = state;
            
            // Calcul du gain final : Master Global * (Mode Focus ? ratio : 1.0)
            const targetGain = masterVolume * (isFocusMode ? focusDuckingRatio : 1.0);
            
            this.globalSyncGain.gain.setTargetAtTime(targetGain, this.context.currentTime, 0.1);
        });
    }

    /**
     * Configure le système de ducking automatique.
     * S'abonne au Voice Store pour réduire le volume des ambiances quand quelqu'un parle.
     */
    private async setupDucking() {
        const { useVoiceStore } = await import('../voice/useVoiceStore');
        
        useVoiceStore.subscribe((state) => {
            const { isDucking, currentEffects } = state;
            
            // Safety: ensure finite values to prevent Web Audio API crashes 
            // especially if state is corrupted or missing fields in localStorage
            const duckingRange = Number.isFinite(currentEffects?.duckingRange) ? currentEffects.duckingRange : 0.3;
            const duckingAttack = Number.isFinite(currentEffects?.duckingAttack) ? currentEffects.duckingAttack : 150;
            
            const targetGain = isDucking ? duckingRange : 1.0;
            const timeConstant = Math.max(0.001, duckingAttack / 1000); // Must be > 0
            
            this.duckingGain.gain.setTargetAtTime(
                targetGain, 
                this.context.currentTime, 
                timeConstant
            );
        });
    }

    /**
     * Relance le contexte audio s'il est suspendu par le navigateur.
     */
    async resume() {
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
    }

    /**
     * Arrête toutes les pistes d'ambiance avec un fondu.
     * @param fadeTime Durée du fondu de sortie.
     */
    fadeOutAll(fadeTime: number = 2.0) {
        this.tracks.forEach(track => track.stop(fadeTime));
    }

    /**
     * Récupère l'analyseur master pour la visualisation globale.
     */
    getAnalyser() {
        return this.analyser;
    }

    public async setOutputDevice(deviceId: string) {
        if ('setSinkId' in this.context) {
            try {
                // @ts-expect-error AudioContext.setSinkId exists in modern browsers
                await this.context.setSinkId(deviceId === 'default' ? '' : deviceId);
                console.log(`[AmbientEngine] Output device changed to ${deviceId}`);
            } catch (error: unknown) {
                const err = error as { name?: string; message?: string };
                if (err.name === 'NotFoundError') {
                    console.warn(`[AmbientEngine] Device ${deviceId} not found, falling back to default.`);
                    // @ts-expect-error fallback
                    await this.context.setSinkId('');
                } else {
                    console.error('[AmbientEngine] Failed to set audio output device', error);
                }
            }
        } else {
            console.warn('[AmbientEngine] AudioContext.setSinkId is not supported by this browser.');
        }
    }
}


// Singleton for Ambient OS
export let ambientEngine = new AmbientEngine();

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as unknown as { ambientEngine: AmbientEngine }).ambientEngine = ambientEngine;
}

/** @internal - For testing only */
export const resetAmbientEngine = () => {
    ambientEngine = new AmbientEngine();
     if (typeof window !== 'undefined') {
        (window as unknown as { ambientEngine: AmbientEngine }).ambientEngine = ambientEngine;
    }
};
