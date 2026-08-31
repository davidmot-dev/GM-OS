/**
 * Engine Audio pour Music OS v5
 * Gère le mixage, les platines, les boucles A/B et le routage via Streaming HTML5.
 */
import { useMediaStore } from '../../stores/useMediaStore';
import { SortiesAudio } from '../../utils/sortiesAudio';
import {
    courbeDuFonduCroise,
    gainsALaPosition,
    platineOpposee,
    positionDeLaPlatine,
    positionDuFondu,
    type FonduEnCours,
} from './logic/fonduCroise';

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
    /** L'arrêt programmé par `fadeOut` — annulable, voir `annulerLArretDiffere`. */
    private arretDiffere: ReturnType<typeof setTimeout> | null = null;
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

        // Une minuterie d'arrêt visait la piste précédente : elle n'a plus de
        // sujet, et laissée en vie elle arrêterait celle qu'on charge.
        this.annulerLArretDiffere();

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

        // Restore volume in case a fade was in progress — et surtout, désarmer
        // l'arrêt qu'il avait programmé : il couperait ce qu'on démarre ici.
        this.annulerLArretDiffere();
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

        this.annulerLArretDiffere();

        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + durationSec);

        this.arretDiffere = setTimeout(() => {
            this.arretDiffere = null;
            this.stop();
            // Reset gain for next usage
            this.gainNode.gain.setValueAtTime(this.state.volume, this.context.currentTime);
        }, durationMs + 100);
    }

    /**
     * Désarme l'arrêt programmé par un `fadeOut`.
     *
     * ⚠ **Sans ça, la minuterie survivait à ce qu'elle devait arrêter.** Relancer
     * la même platine avant la fin d'un fondu de sortie — le meneur qui change
     * d'avis, ce qui arrive en séance — laissait courir l'ancienne minuterie,
     * qui **coupait le morceau tout juste démarré** quelques secondes plus tard.
     * Sans rien dire, et sans qu'un second clic n'y change quoi que ce soit.
     */
    private annulerLArretDiffere() {
        if (this.arretDiffere) {
            clearTimeout(this.arretDiffere);
            this.arretDiffere = null;
        }
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

    /**
     * Place la tête de lecture à un instant précis de la piste.
     *
     * **Fonctionne à l'arrêt comme en lecture**, et c'est le point : le meneur
     * cale son passage pendant que le morceau précédent tourne encore, puis
     * lance. `play()` ne remet pas à zéro — seul `stop()` le fait — donc la
     * position choisie survit jusqu'au démarrage.
     *
     * Refuse tant que la durée est inconnue : `audioElement.currentTime` posé
     * avant que les métadonnées soient lues est ignoré en silence par le
     * navigateur, ce qui donnerait un curseur qui bouge et une lecture qui
     * repart du début.
     */
    seek(secondes: number): boolean {
        const duree = this.audioElement.duration;
        if (!Number.isFinite(duree) || duree <= 0) return false;

        this.audioElement.currentTime = Math.min(duree, Math.max(0, secondes));
        this.updateState();
        return true;
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
    /** Les sorties détournées, une par enceinte demandée. */
    private sorties!: SortiesAudio;
    /** Ce que valent le ducking de la voix et le réglage global, séparément. */
    private valeurDucking = 1.0;
    private valeurGlobale = 1.0;
    /** Le fondu en cours, s'il y en a un — voir `positionDuCrossfader`. */
    private fondu: FonduEnCours | null = null;
    /** L'arrêt programmé de la platine sortante, annulable. */
    private arretDeLaSortante: ReturnType<typeof setTimeout> | null = null;
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

        this.sorties = new SortiesAudio(this.context, 'MusicEngine');

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
            this.valeurGlobale = targetGain;
            this.menerLesVoiesDetournees(0.1);
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
            this.valeurDucking = targetGain;
            this.menerLesVoiesDetournees(currentEffects.duckingAttack / 1000);
        });
    }

    /**
     * **Les voies détournées suivent les deux réglages de la voie normale** — le
     * ducking de la voix et le réglage global. Elles n'ont qu'un gain là où la
     * chaîne principale en a deux, et reçoivent donc leur produit.
     */
    private menerLesVoiesDetournees(timeConstant: number) {
        const cible = this.valeurDucking * this.valeurGlobale;
        for (const canal of this.sorties.canaux) {
            canal.ducking.gain.setTargetAtTime(cible, this.context.currentTime, Math.max(0.001, timeConstant));
        }
    }

    /**
     * **Envoie une platine sur une sortie choisie**, ou la ramène à celle du
     * module. *Demande de David du 2026-08-31.*
     *
     * ⚠️ **Le détournement se fait APRÈS le crossfader, et c'est tout le
     * point.** Router la platine elle-même l'aurait sortie du fondu : elle
     * démarrerait à plein volume, et le crossfader ne pourrait plus l'arrêter.
     * Pris ici, le fondu continue de la mener — *et croiser deux platines
     * envoyées sur deux enceintes fait exactement ce qu'on attend : l'une
     * s'éteint d'un côté pendant que l'autre monte de l'autre.*
     */
    public routerLaPlatine(deck: 'A' | 'B', deviceId: string | null | undefined) {
        const gain = deck === 'A' ? this.crossfaderGainA : this.crossfaderGainB;
        const canal = this.sorties.canal(deviceId);
        gain.disconnect();
        if (!canal) {
            gain.connect(this.masterGain);
            return;
        }
        canal.entree.gain.value = this.masterGain.gain.value;
        canal.ducking.gain.value = this.valeurDucking * this.valeurGlobale;
        gain.connect(canal.entree);
    }

    /**
     * Modifie le volume global de la musique.
     * @param value Nouveau volume (0.0 à 1.0).
     */
    setMasterVolume(value: number) {
        this.masterGain.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
        // Le volume de la musique mène les voies détournées avec la voie normale.
        for (const canal of this.sorties.canaux) {
            canal.entree.gain.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }

    /**
     * **Où en est le crossfader, maintenant.**
     *
     * L'unique vérité : pendant un fondu elle se calcule sur l'horloge audio,
     * celle qui fait réellement le son. L'écran la lit au lieu d'en animer une
     * deuxième de son côté.
     */
    positionDuCrossfader(): number {
        if (!this.fondu) return this.crossfaderValue;
        return positionDuFondu(this.fondu, this.context.currentTime);
    }

    /** Un fondu est-il en cours ? */
    get fonduEnCours(): boolean {
        return this.fondu !== null && this.context.currentTime < this.fondu.debutSec + this.fondu.dureeSec;
    }

    /**
     * Vers quelle platine le fondu se dirige, ou `null` s'il n'y en a pas.
     *
     * Pour l'écran seulement — et **lu sur le moteur** : la déduire de la
     * position du curseur la ferait basculer au milieu du trajet, puisque celle-ci
     * traverse 0,5 en chemin.
     */
    get cibleDuFondu(): 'A' | 'B' | null {
        if (!this.fonduEnCours || !this.fondu) return null;
        return this.fondu.cible < 0.5 ? 'A' : 'B';
    }

    /**
     * Positionne le crossfader à la main.
     *
     * **Annule le fondu en cours ET l'arrêt qu'il avait programmé.** Sans ça,
     * ramener le crossfader vers la platine sortante la faisait revenir… puis
     * s'arrêter net quelques secondes plus tard, quand la minuterie du fondu
     * abandonné se réveillait.
     */
    setCrossfader(value: number) {
        this.annulerLeFondu();
        this.crossfaderValue = Math.max(0, Math.min(1, value));
        this.updateCrossfaderGains(this.context.currentTime);
    }

    /**
     * Applique les gains d'une position, **à puissance égale**.
     *
     * La conversion vit dans `fonduCroise.gainsALaPosition`, partagée avec la
     * courbe du fondu automatique : deux formules différentes s'entendraient à
     * l'instant où l'un prend la suite de l'autre.
     */
    private updateCrossfaderGains(time?: number) {
        const { a, b } = gainsALaPosition(this.crossfaderValue);
        const quand = time ?? this.context.currentTime;

        this.crossfaderGainA.gain.setTargetAtTime(a, quand, 0.02);
        this.crossfaderGainB.gain.setTargetAtTime(b, quand, 0.02);
    }

    /** Oublie le fondu courant et désarme l'arrêt de la platine sortante. */
    private annulerLeFondu() {
        if (this.arretDeLaSortante) {
            clearTimeout(this.arretDeLaSortante);
            this.arretDeLaSortante = null;
        }
        if (this.fondu) {
            this.crossfaderValue = this.positionDuCrossfader();
            this.fondu = null;
        }
        const now = this.context.currentTime;
        for (const g of [this.crossfaderGainA, this.crossfaderGainB]) {
            g.gain.cancelScheduledValues(now);
            g.gain.setValueAtTime(g.gain.value, now);
        }
    }

    /**
     * **La transition d'un morceau à l'autre, d'un seul tenant.**
     *
     * Ce qu'elle remplace — `performAutoFade` — n'était qu'un tiers du
     * mécanisme. Les deux autres vivaient dans le magasin et, surtout, **dans un
     * `useEffect` du composant `Mixer`** : c'est lui qui animait le curseur et
     * qui, à la fin, arrêtait la platine sortante. Trois conséquences, toutes
     * signalées par David le 2026-08-30 sous *« ça ne fonctionne pas bien »* :
     *
     * 1. **Écran de Music-OS fermé, la platine sortante ne s'arrêtait jamais.**
     *    Elle continuait à jouer, inaudible, et sa pastille restait allumée —
     *    deux morceaux « en cours » à l'écran. *Le chemin s'arrêtait avant le
     *    moteur, et le résultat restait plausible.*
     * 2. **Le drapeau `autoFadeTarget` n'était effacé que par ce même effet.**
     *    Périmé, il choisissait ensuite la platine à l'envers.
     * 3. **L'arrêt arrivait après un SECOND fondu de même durée** (`stopDeck`
     *    enchaînait un `fadeOut` sur une platine déjà à zéro) : douze secondes
     *    pour une transition de six.
     *
     * Tout se décide donc ici, avec l'horloge audio pour seule référence.
     */
    crossfadeTo(target: 'A' | 'B', durationMs: number) {
        this.annulerLeFondu();

        const depart = this.crossfaderValue;
        const cible = positionDeLaPlatine(target);
        const dureeSec = Math.max(0.05, durationMs / 1000);
        const now = this.context.currentTime;

        const { a, b } = courbeDuFonduCroise(depart, cible);
        this.crossfaderGainA.gain.setValueCurveAtTime(a, now, dureeSec);
        this.crossfaderGainB.gain.setValueCurveAtTime(b, now, dureeSec);

        this.fondu = { depart, cible, debutSec: now, dureeSec };
        this.crossfaderValue = cible;

        /*
          La platine sortante s'arrête **quand le fondu est fini**, pas avant et
          pas deux fondus plus tard. La marge couvre l'écart entre l'horloge
          audio et celle des minuteries ; arrêter un peu trop tard n'a aucune
          conséquence, un peu trop tôt couperait la fin du morceau.
        */
        const sortante = platineOpposee(target);
        this.arretDeLaSortante = setTimeout(() => {
            this.arretDeLaSortante = null;
            (sortante === 'A' ? this.deckA : this.deckB).stop();
        }, dureeSec * 1000 + 120);
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
