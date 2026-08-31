import { useMediaStore } from '../../stores/useMediaStore';
import { SortiesAudio } from '../../utils/sortiesAudio';

export class SoundEngine {
    private static instance: SoundEngine;
    public context: AudioContext;
    public masterGain: GainNode;
    public globalSyncGain: GainNode;
    private padSources: Map<string, AudioBufferSourceNode> = new Map();
    private padGains: Map<string, GainNode> = new Map();
    private audioBuffers: Map<string, AudioBuffer> = new Map();
    /**
     * **Les sorties détournées, une par enceinte demandée.**
     *
     * Le module en a l'usage le plus évident : plusieurs pads sonnent en même
     * temps, et rien n'oblige la porte qui grince et le tonnerre à sortir du
     * même haut-parleur. Voir `sortiesAudio.ts`.
     */
    private sorties!: SortiesAudio;

    private constructor() {
        // Initialize Web Audio API
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.context = new AudioContextClass();

        // Setup Master Gain
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 1.0;

        this.globalSyncGain = this.context.createGain();
        this.globalSyncGain.gain.value = 1.0;

        this.masterGain.connect(this.globalSyncGain);
        this.globalSyncGain.connect(this.context.destination);

        this.sorties = new SortiesAudio(this.context, 'SoundEngine');

        this.setupGlobalSync();

        // Resume context if suspended (browser autoplay policy)
        if (this.context.state === 'suspended') {
            const resumeListener = () => {
                this.context.resume();
                document.removeEventListener('click', resumeListener);
            };
            document.addEventListener('click', resumeListener);
        }
    }

    /**
     * S'abonne au store master pour appliquer le volume global et le mode Focus Chat.
     */
    private async setupGlobalSync() {
        const { useAudioMasterStore } = await import('../../stores/useAudioMasterStore');
        
        useAudioMasterStore.subscribe((state) => {
            const { masterVolume, isFocusMode, focusDuckingRatio } = state;
            
            // Pour les SFX, on atténue moins fort que pour la musique (ex: 50% au lieu de 10%)
            const sfxDuckingRatio = Math.max(0.5, focusDuckingRatio * 5); 
            const targetGain = masterVolume * (isFocusMode ? sfxDuckingRatio : 1.0);
            
            this.globalSyncGain.gain.setTargetAtTime(targetGain, this.context.currentTime, 0.1);
            /*
              **Le même geste sur les voies détournées.** Un son routé vers une
              autre enceinte doit baisser quand le meneur parle, comme les
              autres : *un réglage qui ne vaut que pour une partie de ce qu'on
              entend est pire qu'un réglage absent.*
            */
            for (const canal of this.sorties.canaux) {
                canal.ducking.gain.setTargetAtTime(targetGain, this.context.currentTime, 0.1);
            }
        });
    }

    /**
     * Récupère l'instance unique du SoundEngine (Singleton).
     * @returns L'instance stable du moteur audio.
     */
    public static getInstance(): SoundEngine {
        if (!SoundEngine.instance) {
            SoundEngine.instance = new SoundEngine();
        }
        return SoundEngine.instance;
    }

    /** @internal - For testing only */
    public static resetInstance() {
        // @ts-expect-error - access private static
        SoundEngine.instance = undefined;
    }

    /**
     * Formate un chemin de fichier en URL utilisable par le moteur audio.
     * Supporte les protocoles http, data, file et l'appBridge natif.
     * @param filePath Chemin brut du fichier.
     * @returns URL formatée.
     */
    public formatUrl(filePath: string): string {
        if (filePath.startsWith('http') || filePath.startsWith('data:') || filePath.startsWith('file://')) {
            return filePath;
        }
        if (window.appBridge?.utils?.formatFileUrl) {
            return window.appBridge.utils.formatFileUrl(filePath);
        }
        return filePath;
    }

    /**
     * Vérifie si un pad a déjà son buffer audio chargé.
     */
    public hasBuffer(padId: string): boolean {
        return this.audioBuffers.has(padId);
    }

    /**
     * Charge de manière asynchrone un fichier audio et le décode en AudioBuffer.
     * Gère les IDs du MediaStore (m-xxx) et les URLs classiques.
     * @param padId Identifiant unique du pad associé au son.
     * @param filePath Chemin ou ID du fichier audio.
     */
    public async loadAudio(padId: string, filePath: string): Promise<void> {
        try {
            let arrayBuffer: ArrayBuffer;

            if (filePath && filePath.startsWith('m-')) {
                const mediaStore = useMediaStore.getState();
                if (!mediaStore.isInitialized) {
                    await mediaStore.initDB();
                }
                const blob = await mediaStore.getMediaBlob(filePath);
                if (!blob) {
                    console.error(`[SoundEngine] MediaBlob not found for ID: ${filePath}`);
                    if (window.useToastStore) window.useToastStore.getState().gmToast('error', `Fichier sonore introuvable dans la base de données.`);
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

    /**
     * Joue un son pré-chargé pour un pad spécifique.
     * @param padId Identifiant unique du pad.
     * @param volume Volume initial (0.0 à 1.0).
     * @param onEndedCallback Callback optionnel appelé à la fin de la lecture.
     */
    public play(padId: string, volume: number = 1.0, onEndedCallback?: () => void, sortie?: string) {
        const buffer = this.audioBuffers.get(padId);
        if (!buffer) {
            console.warn(`[SoundEngine] Cannot play ${padId}, buffer not loaded.`);
            return;
        }

        // Unsuspend context if needed (for remote triggers)
        if (this.context.state === 'suspended') {
            this.context.resume().catch(e => console.error('[SoundEngine] Failed to resume context:', e));
        }

        // Stop existing playback for this pad if any
        this.stop(padId);

        // Create individual gain node
        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;
        /*
          **La sortie se choisit au moment de brancher, et pas avant.** Sans
          `sortie`, `canal` rend `null` et on branche sur le master comme
          toujours — c'est ce qui rend le routage sans effet sur tout ce qui
          existait. Avec, le pad part sur sa propre voie, et les autres pads
          continuent où ils étaient.
        */
        const canal = this.sorties.canal(sortie);
        gainNode.connect(canal ? canal.entree : this.masterGain);
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

    /**
     * Arrête immédiatement la lecture d'un pad et libère les ressources associées.
     * @param padId Identifiant unique du pad.
     */
    public stop(padId: string) {
        const source = this.padSources.get(padId);
        if (source) {
            try {
                source.stop();
                source.disconnect();
            } catch {
                // Ignore if already stopped
            }
            this.padSources.delete(padId);
        }

        const gain = this.padGains.get(padId);
        if (gain) {
            gain.disconnect();
            this.padGains.delete(padId);
        }
    }

    /**
     * Décharge le buffer audio d'un pad pour libérer de la mémoire.
     * @param padId Identifiant du pad.
     */
    public unloadAudio(padId: string) {
        this.stop(padId);
        this.audioBuffers.delete(padId);
    }

    /**
     * Arrête tous les sons en cours avec un fondu de sortie (fade-out) de 3 secondes.
     * Réinitialise ensuite le gain master à 1.0.
     */
    public stopAll() {
        console.log('[SoundEngine] Executing 3s Master Fade-Out');

        // 1. Fade out the master gain over 3 seconds
        const currentTime = this.context.currentTime;
        // Les voies détournées descendent avec le master : sans ça, « tout
        // arrêter » laisserait sonner ce qu'un moment avait envoyé ailleurs.
        for (const gain of [this.masterGain, ...this.sorties.canaux.map(c => c.entree)]) {
            gain.gain.cancelScheduledValues(currentTime);
            gain.gain.setValueAtTime(gain.gain.value, currentTime);
            gain.gain.linearRampToValueAtTime(0, currentTime + 3);
        }

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
            for (const gain of [this.masterGain, ...this.sorties.canaux.map(c => c.entree)]) {
                gain.gain.cancelScheduledValues(this.context.currentTime);
                gain.gain.setValueAtTime(1.0, this.context.currentTime);
            }

            console.log('[SoundEngine] All sources stopped. Engine ready.');
        }, 3100);
    }

    /**
     * Modifie le volume d'un pad en cours de lecture de manière fluide.
     * @param padId Identifiant unique du pad.
     * @param volume Nouveau volume (0.0 à 1.0).
     */
    public setVolume(padId: string, volume: number) {
        const gain = this.padGains.get(padId);
        if (gain) {
            // Smoothly ramp volume to avoid clicks
            gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
        }
    }

    /**
     * Modifie le volume global (Master) de manière fluide.
     * @param volume Nouveau volume (0.0 à 1.0).
     */
    public setMasterVolume(volume: number) {
        this.masterGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
        // Le volume général mène les voies détournées avec les autres.
        for (const canal of this.sorties.canaux) {
            canal.entree.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
        }
    }

    /**
     * Change le périphérique de sortie audio (si supporté par le navigateur).
     * @param deviceId ID du périphérique (ex: 'default', 'communications' ou UUID).
     */
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

// Export for cross-store access
if (typeof window !== 'undefined') {
    window.soundEngine = soundEngine;
}
