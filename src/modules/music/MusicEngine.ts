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

    async loadTrack(url: string) {
        console.log(`[MusicDeck] Loading track: ${url}`);

        // On libère l'ancien handle avant de charger
        this.audioElement.pause();
        this.audioElement.src = "";

        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }

        let finalUrl = url;

        if (url && url.startsWith('m-')) {
            const { getMediaBlob } = useMediaStore.getState();
            console.log(`[MusicDeck] Fetching MediaBlob for: ${url}`);
            const blob = await getMediaBlob(url);
            if (blob) {
                this.objectUrl = URL.createObjectURL(blob);
                finalUrl = this.objectUrl;
                console.log(`[MusicDeck] Blob URL created: ${finalUrl}`);
            } else {
                console.warn(`[MusicDeck] MediaBlob not found for ID: ${url}`);
            }
        } else if (url) {
            // Transformation des chemins locaux Windows en URLs valides pour l'élément audio
            const isLocalPath = !url.includes('://') && !url.startsWith('blob:') && !url.startsWith('data:');

            if (isLocalPath) {
                console.log(`[MusicDeck] Local path detected: ${url}`);
                const win = window as unknown as { appBridge?: { utils?: { formatFileUrl: (p: string) => string } } };
                if (win.appBridge?.utils?.formatFileUrl) {
                    finalUrl = win.appBridge.utils.formatFileUrl(url);
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
            const gWin = window as unknown as { useToastStore?: { getState: () => { gmToast: (t: string, m: string) => void } } };
            if (gWin.useToastStore) gWin.useToastStore.getState().gmToast('error', msg);
        };

        this.audioElement.load();

        this.state.currentTime = 0;
        this.updateState();
    }

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
            const gWin = window as unknown as { useToastStore?: { getState: () => { gmToast: (t: string, m: string) => void } } };
            if (gWin.useToastStore) gWin.useToastStore.getState().gmToast('error', `Échec Lecture: ${error.message}`);
        }
    }

    pause() {
        this.audioElement.pause();
    }

    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.state.isPlaying = false;
        this.updateState();
    }


    setVolume(value: number) {
        this.state.volume = value;
        const now = this.context.currentTime;
        this.gainNode.gain.setTargetAtTime(value, now, 0.02);
        this.updateState();
    }

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

    setLooping(value: boolean) {
        this.state.isLooping = value;
        this.audioElement.loop = value;
        this.updateState();
    }

    private updateState() {
        this.onStateChange({ ...this.state, currentTime: this.audioElement.currentTime, duration: this.audioElement.duration || 0 });
    }

    getCurrentTime(): number {
        return this.audioElement.currentTime;
    }
}

export class MusicEngine {
    private context: AudioContext;
    private masterGain: GainNode;
    private duckingGain: GainNode;
    private crossfaderGainA: GainNode;
    private crossfaderGainB: GainNode;
    private destination: MediaStreamAudioDestinationNode;

    public deckA: MusicDeck;
    public deckB: MusicDeck;

    private crossfaderValue: number = 0.5;

    constructor() {
        this.context = new AudioContext(); // Native default for stability

        this.destination = this.context.createMediaStreamDestination();
        this.masterGain = this.context.createGain();
        this.duckingGain = this.context.createGain();
        
        this.masterGain.connect(this.duckingGain);
        this.duckingGain.connect(this.destination);

        this.crossfaderGainA = this.context.createGain();
        this.crossfaderGainB = this.context.createGain();

        this.crossfaderGainA.connect(this.masterGain);
        this.crossfaderGainB.connect(this.masterGain);

        this.deckA = new MusicDeck(this.context, this.crossfaderGainA, () => { });
        this.deckB = new MusicDeck(this.context, this.crossfaderGainB, () => { });

        this.updateCrossfaderGains();
        this.setupDucking();
    }

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

    setMasterVolume(value: number) {
        this.masterGain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
    }

    setCrossfader(value: number) {
        this.crossfaderValue = Math.max(0, Math.min(1, value));
        const now = this.context.currentTime;
        this.updateCrossfaderGains(now);
    }

    private updateCrossfaderGains(time?: number) {
        const gainA = 1 - this.crossfaderValue;
        const gainB = this.crossfaderValue;
        const scheduledTime = time || this.context.currentTime;

        // Curve optimization: use setTargetAtTime for smooth manual sliding
        this.crossfaderGainA.gain.setTargetAtTime(gainA, scheduledTime, 0.02);
        this.crossfaderGainB.gain.setTargetAtTime(gainB, scheduledTime, 0.02);
    }

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

    getStream(): MediaStream {
        return this.destination.stream;
    }

    async resume() {
        if (this.context.state === 'suspended') await this.context.resume();
    }

    isStreamingService(url: string): boolean {
        if (!url) return false;
        const u = url.toLowerCase();
        return u.includes('youtube.com') || u.includes('youtu.be') ||
            u.includes('spotify.com') || u.includes('deezer.com');
    }

    public async setOutputDevice(deviceId: string) {
        console.log(`[MusicEngine] Output device updated in store: ${deviceId}. AudioRouter will handle the physical switch.`);
    }
}


export const musicEngine = new MusicEngine();
