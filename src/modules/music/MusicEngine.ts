/**
 * Engine Audio pour Music OS v5
 * Gère le mixage, les platines, les boucles A/B et le routage via Streaming HTML5.
 */
import { useMediaStore } from '../../stores/useMediaStore';

export interface DeckState {
    isPlaying: boolean;
    isLooping: boolean;
    volume: number;
    currentTime: number;
    duration: number;
}

/**
 * Représente une platine (Deck) individuelle pour la lecture musicale.
 * Utilise un élément HTMLAudioElement routé vers un contexte Web Audio.
 */
class MusicDeck {
    private context: AudioContext;
    private audioElement: HTMLAudioElement;
    private sourceNode: MediaElementAudioSourceNode;
    private gainNode: GainNode;
    private state: DeckState;
    private onStateChange: (state: DeckState) => void;
    private objectUrl: string | null = null;

    public get isPlaying() { return this.state.isPlaying; }
    public get duration() { return this.audioElement.duration || 0; }
    public get currentTime() { return this.audioElement.currentTime || 0; }

    constructor(context: AudioContext, destination: AudioNode, onStateChange: (state: DeckState) => void) {
        this.context = context;
        this.onStateChange = onStateChange;

        // 1. Création de l'élément audio HTML5
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = "anonymous";
        this.audioElement.preload = "auto";

        // IMPORTANT for Electron: Attach to DOM to keep priority
        this.audioElement.style.display = "none";
        document.body.appendChild(this.audioElement);

        // 2. Branchement Web Audio
        this.sourceNode = context.createMediaElementSource(this.audioElement);
        this.gainNode = context.createGain();

        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(destination);

        this.state = {
            isPlaying: false,
            isLooping: true,
            volume: 1.0,
            currentTime: 0,
            duration: 0
        };

        // Events listeners for state sync
        this.audioElement.onplay = () => { this.state.isPlaying = true; this.updateState(); };
        this.audioElement.onpause = () => { this.state.isPlaying = false; this.updateState(); };
        this.audioElement.onended = () => { if (!this.state.isLooping) { this.state.isPlaying = false; this.updateState(); } };
        this.audioElement.onloadedmetadata = () => { this.state.duration = this.audioElement.duration; this.updateState(); };
    }

    /**
     * Charge une piste audio de manière asynchrone.
     * Supporte les IDs du MediaStore (m-xxx) et les chemins locaux formés via l'appBridge.
     * @param url Chemin ou ID de la piste à charger.
     */
    async loadTrack(url: string) {
        console.log(`[MusicDeck] loadTrack(url: "${url}", type: ${typeof url}, length: ${url?.length})`);

        // On libère l'ancien handle avant de charger
        this.audioElement.pause();
        this.audioElement.src = "";

        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }

        let finalUrl = url;

        if (url && url.startsWith('m-')) {
            const mediaStore = useMediaStore.getState();
            if (!mediaStore.isInitialized) {
                console.log('[MusicDeck] MediaStore not initialized, waiting...');
                await mediaStore.initDB();
            }
            console.log(`[MusicDeck] Fetching MediaBlob for: ${url}`);
            const blob = await mediaStore.getMediaBlob(url);
            if (blob) {
                this.objectUrl = URL.createObjectURL(blob);
                finalUrl = this.objectUrl;
                console.log(`[MusicDeck] Blob URL created: ${finalUrl}`);
            } else {
                console.error(`[MusicDeck] MediaBlob not found for ID: ${url}`);
                if (window.useToastStore) window.useToastStore.getState().gmToast('error', `Fichier audio introuvable dans la base de données.`);
                return; // Abort loading
            }
        } else if (url) {
            // Transformation des chemins locaux Windows en URLs valides pour l'élément audio
            const isLocalPath = !url.includes('://') && !url.startsWith('blob:') && !url.startsWith('data:');

            if (isLocalPath) {
                console.log(`[MusicDeck] Local path detected: ${url}`);
                if (window.appBridge?.utils?.formatFileUrl) {
                    finalUrl = window.appBridge.utils.formatFileUrl(url);
                } else {
                    const normalizedPath = url.replace(/^file:\/\/\//, '').replace(/\\/g, '/');
                    finalUrl = `gmos://media/${normalizedPath}`;
                }
            }
        }

        console.log(`[MusicDeck] Final source assigned: ${finalUrl}`);
        this.audioElement.src = finalUrl;
        
        // Listen for errors on the audio element immediately
        this.audioElement.onerror = () => {
            const err = this.audioElement.error;
            const msg = `Erreur Audio: ${err?.message || 'Inconnue'} (Code ${err?.code})`;
            console.error(`[MusicDeck] AudioElement Error [${finalUrl}]:`, err);
            if (window.useToastStore) window.useToastStore.getState().gmToast('error', msg);
        };

        this.audioElement.load();

        this.state.currentTime = 0;
        this.updateState();
    }

    /**
     * Démarre la lecture de la platine.
     * Gère la reprise du contexte Web Audio si suspendu.
     */
    async play() {
        console.log(`[MusicDeck] play() triggered. Current context state: ${this.context.state}`);
        if (this.context.state === 'suspended') {
            await this.context.resume();
            console.log(`[MusicDeck] Context resumed. New state: ${this.context.state}`);
        }

        // Debug supplémentaire
        if (!this.audioElement.src || this.audioElement.src.endsWith('/') || this.audioElement.src === window.location.href) {
            console.warn(`[MusicDeck] Lecture annulée : src vide ou invalide pour Deck`);
            return;
        }

        // Restore volume in case a fade was in progress
        const now = this.context.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.state.volume, now);

        try {
            console.log(`[MusicDeck] Calling audioElement.play() for: ${this.audioElement.src}`);
            await this.audioElement.play();
            console.log(`[MusicDeck] Play successful.`);
        } catch (e) {
            const error = e as Error;
            console.error(`[MusicDeck] Play failed for ${this.audioElement.src}:`, error);
            if (window.useToastStore) window.useToastStore.getState().gmToast('error', `Échec Lecture: ${error.message}`);
        }
    }

    /**
     * Met la lecture en pause.
     */
    pause() {
        this.audioElement.pause();
    }

    /**
     * Arrête la lecture et revient au début de la piste.
     */
    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.state.isPlaying = false;
        this.updateState();
    }

    /**
     * Modifie le volume de la platine de manière fluide.
     * @param value Nouveau volume (0.0 à 1.0).
     */
    setVolume(value: number) {
        this.state.volume = value;
        const now = this.context.currentTime;
        this.gainNode.gain.setTargetAtTime(value, now, 0.02);
        this.updateState();
    }

    /**
     * Effectue un fondu de sortie (fade-out) avant d'arrêter la platine.
     * @param durationMs Durée du fondu en millisecondes.
     */
    fadeOut(durationMs: number) {
        const now = this.context.currentTime;
        const durationSec = durationMs / 1000;

        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + durationSec);

        setTimeout(() => {
            this.stop();
            // Reset gain for next usage
            this.gainNode.gain.setValueAtTime(this.state.volume, this.context.currentTime);
        }, durationMs + 100);
    }

    /**
     * Active ou désactive la lecture en boucle (loop).
     * @param value True pour boucler, False pour arrêter à la fin.
     */
    setLooping(value: boolean) {
        this.state.isLooping = value;
        this.audioElement.loop = value;
        this.updateState();
    }

    private updateState() {
        this.onStateChange({ ...this.state, currentTime: this.audioElement.currentTime, duration: this.audioElement.duration || 0 });
    }

    /** @returns Position actuelle de lecture en secondes. */
    getCurrentTime(): number {
        return this.audioElement.currentTime;
    }
}

/**
 * Moteur principal de gestion de la musique (Music OS).
 * Gère deux platines (A/B), un crossfader, le ducking voix et le routage vers le stream.
 */
export class MusicEngine {
    private context: AudioContext;
    private masterGain: GainNode;
    private duckingGain: GainNode;
    private crossfaderGainA: GainNode;
    private crossfaderGainB: GainNode;
    private globalSyncGain: GainNode;
    private destination: MediaStreamAudioDestinationNode;

    public deckA: MusicDeck;
    public deckB: MusicDeck;

    private crossfaderValue: number = 0.5;
    private useRescueRoute: boolean = true; // HACK Tauri: Direct routing if MediaStream is blocked

    constructor() {
        this.context = new AudioContext(); // Native default for stability

        this.destination = this.context.createMediaStreamDestination();
        this.masterGain = this.context.createGain();
        this.duckingGain = this.context.createGain();
        
        this.crossfaderGainA = this.context.createGain();
        this.crossfaderGainB = this.context.createGain();

        this.globalSyncGain = this.context.createGain();
        
        // Routage standard (vers Stream)
        this.globalSyncGain.connect(this.destination);

        // ROUTE DE SECOURS (vers Sortie Physique)
        // Indispensable si le MediaStream ne sort pas de son via l'élément <audio> dans WebView2
        if (this.useRescueRoute) {
            console.log("[MusicEngine] Rescue Route active: Connecting globalSyncGain to context.destination");
            this.globalSyncGain.connect(this.context.destination);
        }

        this.masterGain.connect(this.duckingGain);
        this.duckingGain.connect(this.globalSyncGain);

        this.crossfaderGainA.connect(this.masterGain);
        this.crossfaderGainB.connect(this.masterGain);

        this.deckA = new MusicDeck(this.context, this.crossfaderGainA, () => { });
        this.deckB = new MusicDeck(this.context, this.crossfaderGainB, () => { });

        this.updateCrossfaderGains();
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
     * Configure l'écouteur de ducking (atténuation automatique).
     * S'abonne au VoiceStore pour ajuster le gain master quand quelqu'un parle.
     */
    private async setupDucking() {
        // We import it dynamically to avoid circular dependencies if any
        const { useVoiceStore } = await import('../voice/useVoiceStore');
        
        useVoiceStore.subscribe((state) => {
            const { isDucking, currentEffects } = state;
            const targetGain = isDucking ? currentEffects.duckingRange : 1.0;
            
            // Smooth transition for ducking using dynamic attack
            this.duckingGain.gain.setTargetAtTime(targetGain, this.context.currentTime, currentEffects.duckingAttack / 1000);
        });
    }

    /**
     * Modifie le volume global de la musique.
     * @param value Nouveau volume (0.0 à 1.0).
     */
    setMasterVolume(value: number) {
        this.masterGain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
    }

    /**
     * Positionne le crossfader entre les platines A et B.
     * @param value Valeur entre 0.0 (Deck A uniquement) et 1.0 (Deck B uniquement).
     */
    setCrossfader(value: number) {
        this.crossfaderValue = Math.max(0, Math.min(1, value));
        const now = this.context.currentTime;
        this.updateCrossfaderGains(now);
    }

    /**
     * Met à jour les gains individuels des platines en fonction de la position du crossfader.
     * @param time Timestamp Web Audio optionnel pour le changement.
     */
    private updateCrossfaderGains(time?: number) {
        const gainA = 1 - this.crossfaderValue;
        const gainB = this.crossfaderValue;
        const scheduledTime = time || this.context.currentTime;

        // Curve optimization: use setTargetAtTime for smooth manual sliding
        this.crossfaderGainA.gain.setTargetAtTime(gainA, scheduledTime, 0.02);
        this.crossfaderGainB.gain.setTargetAtTime(gainB, scheduledTime, 0.02);
    }

    /**
     * Effectue une transition automatique (auto-fade) vers une platine cible.
     * @param target Platine cible ('A' ou 'B').
     * @param durationMs Durée de la transition en millisecondes.
     */
    performAutoFade(target: 'A' | 'B', durationMs: number) {
        const now = this.context.currentTime;
        const durationSec = durationMs / 1000;
        const targetA = target === 'A' ? 1 : 0;
        const targetB = target === 'B' ? 1 : 0;

        this.crossfaderGainA.gain.cancelScheduledValues(now);
        this.crossfaderGainB.gain.cancelScheduledValues(now);

        this.crossfaderGainA.gain.setValueAtTime(this.crossfaderGainA.gain.value, now);
        this.crossfaderGainA.gain.linearRampToValueAtTime(targetA, now + durationSec);

        this.crossfaderGainB.gain.setValueAtTime(this.crossfaderGainB.gain.value, now);
        this.crossfaderGainB.gain.linearRampToValueAtTime(targetB, now + durationSec);

        this.crossfaderValue = target === 'A' ? 0 : 1;
    }

    /**
     * Récupère le flux audio (MediaStream) pour le routage externe (ex: Stream OS).
     * @returns Le flux audio mixé.
     */
    getStream(): MediaStream {
        return this.destination.stream;
    }

    /**
     * Arrête toute lecture musicale en cours sur les deux platines.
     */
    stopAll() {
        this.deckA.stop();
        this.deckB.stop();
        console.log('[MusicEngine] All decks stopped.');
    }

    /**
     * Reprend le contexte audio si suspendu par le navigateur.
     */
    async resume() {
        if (this.context.state === 'suspended') await this.context.resume();
    }

    /**
     * Vérifie si une URL correspond à un service de streaming connu.
     * @param url URL à vérifier.
     * @returns True si c'est du streaming (YouTube, Spotify, etc.).
     */
    isStreamingService(url: string): boolean {
        if (!url) return false;
        const u = url.toLowerCase();
        return u.includes('youtube.com') || u.includes('youtu.be') ||
            u.includes('spotify.com') || u.includes('deezer.com');
    }

    /**
     * Désigne le périphérique de sortie.
     * @param deviceId ID du périphérique.
     */
    public async setOutputDevice(deviceId: string) {
        console.log(`[MusicEngine] Attempting to set output device to: ${deviceId}`);
        
        if ('setSinkId' in this.context) {
            try {
                // @ts-expect-error setSinkId exists in modern browsers
                await this.context.setSinkId(deviceId === 'default' ? '' : deviceId);
                console.log(`[MusicEngine] Context Output device successfully changed to ${deviceId}`);
            } catch (error) {
                console.error('[MusicEngine] Failed to set audio output device', error);
            }
        } else {
            console.warn('[MusicEngine] AudioContext.setSinkId not supported.');
        }
    }
}


export const musicEngine = new MusicEngine();

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as any).musicEngine = musicEngine;
}
