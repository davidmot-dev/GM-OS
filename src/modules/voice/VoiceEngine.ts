import { useVoiceStore } from './useVoiceStore';
import { gmToast } from '../../stores/useToastStore';
import {
    duckingSuivant, DUCKING_INACTIF, FERMETURE_S, niveauRMS, OUVERTURE_S, porteSuivante,
    PORTE_FERMEE, type EtatDeLaPorte, type EtatDuDucking,
} from './logic/porteDeLaVoix';
import { reglageDuCompresseur } from './logic/compression';

/**
 * Le taux d'echantillonnage impose au contexte.
 *
 * **RNNoise est entraine a 48 kHz**, et la transposition compte ses constantes
 * en millisecondes a ce taux. Le laisser suivre la carte son - 44,1 kHz sur
 * certains pilotes - decalerait le decoupage en bandes du modele de 9 %.
 * Chromium sait reechantillonner l'entree pour nous ; *une hypothese de DSP se
 * garantit, elle ne s'espere pas.*
 */
const TAUX_DU_CONTEXTE = 48000;

/** Le seuil au-dela duquel on considere que le modele entend une voix. */
const SEUIL_DE_VOIX = 0.6;

/**
 * La cadence de la boucle de mesure, en ms.
 *
 * ⛔ **C'était `requestAnimationFrame`, et c'est une cause directe du « le son
 * se coupe ».** Un rAF est lié au rendu de la fenêtre : Chromium le ralentit à
 * une image par seconde quand la fenêtre passe en arrière-plan, et l'arrête
 * quand elle est réduite. Or la fenêtre du meneur passe derrière celle de
 * projection à chaque manipulation. La porte restait alors figée dans son
 * dernier état et le ducking ne relâchait plus. *Le son, lui, continuait de
 * couler : c'est la décision qui s'arrêtait, pas l'audio.*
 *
 * Un minuteur est ralenti aussi lorsque la fenêtre est réduite — d'où
 * `backgroundThrottling: false` sur la fenêtre du meneur — mais il ne dépend
 * plus du rendu, et 30 mesures par seconde suffisent à une porte comme à un
 * vumètre.
 */
const CADENCE_DE_MESURE_MS = 33;

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

    /**
     * L'analyseur de **détection**, branché sur la voix avant tout traitement.
     *
     * ⛔ Il remplace un analyseur posé sur `outputGain`, c'est-à-dire **après**
     * le compresseur 8:1, le worklet et la réverbération. Deux défauts en
     * découlaient : un seuil de porte réglé sur un signal déjà écrasé ne veut
     * rien dire, et **baisser le gain de sortie fermait la porte** — le curseur
     * de volume rendait le meneur muet. *Une décision sur la voix se prend sur
     * la voix, pas sur ce qu'on en a fait.*
     */
    private detecteur: AnalyserNode | null = null;
    private trameDeDetection: Float32Array<ArrayBuffer> | null = null;

    /** Le noeud de debruitage neuronal, s'il a pu etre charge. */
    private debruiteur: AudioWorkletNode | null = null;

    /** Le module wasm de RNNoise, compile une fois pour toute la session. */
    private static rnnoise: Promise<WebAssembly.Module> | null = null;

    // Destinations
    /**
     * L'unique voie vers la sortie.
     *
     * ⛔ **Il y en avait DEUX**, `monitorGain` et `liveGain`, toutes deux à 1.0
     * et toutes deux branchées sur le même nœud de sortie : activer le retour
     * casque **et** la diffusion sommait le signal deux fois, soit **+6 dB
     * d'un coup** sur un signal déjà limité. C'est le premier suspect du « ça
     * sature trop facilement ».
     *
     * Elles ne pouvaient de toute façon pas viser deux appareils : `setSinkId`
     * se pose sur le **contexte**, jamais sur un nœud — les deux finissaient sur
     * la même enceinte. Les deux interrupteurs restent dans l'interface, ils
     * commandent désormais une seule voie.
     */
    private sortieGain: GainNode | null = null;
    private globalSyncGain: GainNode | null = null;
    private gateGain: GainNode | null = null;
    private limiter: DynamicsCompressorNode | null = null;

    private isInitialized = false;
    private minuteurDeMesure: number | null = null;
    private lastSyncTime: number = 0;
    private lastSyncLevel: number = 0;
    private etatDeLaPorte: EtatDeLaPorte = PORTE_FERMEE;
    private etatDuDucking: EtatDuDucking = DUCKING_INACTIF;

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
                latencyHint: 'interactive',
                sampleRate: TAUX_DU_CONTEXTE,
            });

            // Ensure context is running (required for many browsers/Tauri)
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }

            this.stream = await this.ouvrirLeFlux();
            this.source = this.context.createMediaStreamSource(this.stream);

            // 1. Détection (avant tout traitement) — porte, ducking et vumètre
            this.detecteur = this.context.createAnalyser();
            this.detecteur.fftSize = 1024;
            this.trameDeDetection = new Float32Array(this.detecteur.fftSize);

            // 2. Input Gain
            this.inputGain = this.context.createGain();

            // 3. Low Cut (High Pass) — 120Hz default cuts table rumble & fan noise
            this.lowCut = this.context.createBiquadFilter();
            this.lowCut.type = 'highpass';
            this.lowCut.frequency.value = 120; // Aggressive default (Google Meet uses ~100-120Hz)
            this.lowCut.Q.value = 0.707; // Butterworth — maximally flat passband

            /*
              4. Compresseur — **réglable depuis le 2026-09-03**, et non plus
              figé à 8:1. Il était annoncé « broadcast » ; à ce taux c'est un
              limiteur, et il aplatissait le jeu du meneur en même temps que
              tout ce que Voice-to-Light avait à suivre. Voir `logic/compression`.
            */
            this.compressor = this.context.createDynamicsCompressor();
            this.appliquerLaCompression(useVoiceStore.getState().currentEffects.compression);
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
            this.sortieGain = this.context.createGain();
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
            this.sortieGain.gain.value = (isMonitor || isLive) ? 1.0 : 0;
            this.gateGain.gain.value = 1.0; // Open initially

            // Apply Effects
            if (effects.lowCut === 0) {
                this.lowCut.frequency.value = 120; // Default to voice-optimized 120Hz
            } else {
                this.lowCut.frequency.value = effects.lowCut;
            }
            this.formantFilter.frequency.value = 500 + (effects.formant * 5);
            this.formantFilter.gain.value = VoiceEngine.gainDeFormant(effects.formant);
            const melange = VoiceEngine.melangeDeReverb(effects.reverb);
            this.reverbGain.gain.value = melange.mouille;
            this.dryGain.gain.value = melange.sec;
            this.outputGain.gain.value = effects.outputGain;

            // --- CONNECT CHAIN ---
            // source -> inputGain -> lowCut -> compressor -> formant -> distortion -> dry/wet reverb -> output -> monitor/live
            this.source.connect(this.inputGain);
            await this.brancherLeDebruitage();
            this.lowCut.connect(this.compressor);
            this.compressor.connect(this.formantFilter);

            /*
              **La détection se branche ici, en dérivation.** Après le coupe-bas,
              pour qu'un ronflement de ventilateur n'ouvre pas la porte ; avant
              le compresseur, pour qu'elle lise les écarts réels de la voix. Une
              dérivation ne consomme rien du signal : la chaîne continue tout
              droit.
            */
            this.lowCut.connect(this.detecteur);
            
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

            this.outputGain.connect(this.gateGain);
            this.gateGain.connect(this.limiter);

            /* Une seule voie vers la sortie — voir `sortieGain`. */
            this.limiter.connect(this.sortieGain);
            this.sortieGain.connect(this.globalSyncGain);
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

    /** Pose sur le compresseur le réglage correspondant au curseur. */
    private appliquerLaCompression(compression: number, douceur = 0) {
        if (!this.compressor || !this.context) return;
        const r = reglageDuCompresseur(compression);
        const t = this.context.currentTime;
        if (douceur > 0) {
            this.compressor.threshold.setTargetAtTime(r.seuil, t, douceur);
            this.compressor.ratio.setTargetAtTime(r.taux, t, douceur);
            this.compressor.knee.setTargetAtTime(r.genou, t, douceur);
        } else {
            this.compressor.threshold.value = r.seuil;
            this.compressor.ratio.value = r.taux;
            this.compressor.knee.value = r.genou;
        }
        /*
          Attaque et relâchement ne se lissent PAS : ce sont les constantes de
          temps du détecteur, et les rampes dessus produisent des artefacts. On
          les pose.
        */
        this.compressor.attack.value = r.attaque;
        this.compressor.release.value = r.relachement;
    }

    /**
     * Le gain du filtre de formant, **avec son signe**, et borné.
     *
     * ⛔ Il était calculé avec `Math.abs()`. Conséquence : les voix graves
     * *creusaient* la fréquence — 500 + (−80 × 5) = **100 Hz** — mais y posaient
     * quand même **+16 dB**. Le preset « ogre » et le preset « dragon »
     * empilaient donc une bosse de seize décibels dans le grave, juste après un
     * compresseur, et juste avant un limiteur : *c'est là que « ça sature » se
     * fabriquait, et c'est un `abs()` qui le fabriquait.*
     *
     * Le signe rend au curseur ce qu'il annonce — vers le grave on creuse le
     * haut, vers l'aigu on creuse le grave — et la borne à ±12 dB évite qu'un
     * bout de course transforme un timbre en saturation.
     */
    private static gainDeFormant(formant: number): number {
        return Math.max(-12, Math.min(12, formant / 5));
    }

    /**
     * Le couple sec / mouillé de la réverbération, **à puissance constante**.
     *
     * ⛔ C'était `sec = 1 − mix × 0,5` et `mouillé = mix` : à fond, les deux
     * voies sommaient **1,5 fois** le signal. Deux sources décorrélées
     * s'additionnent en puissance, pas en amplitude — d'où la même courbe que
     * le fondu croisé de Music-OS, qui garde la somme des carrés à un.
     */
    private static melangeDeReverb(mix: number): { sec: number; mouille: number } {
        const angle = Math.max(0, Math.min(1, mix)) * Math.PI / 2;
        return { sec: Math.cos(angle), mouille: Math.sin(angle) };
    }

    /**
     * Branche le debruitage neuronal entre le gain d'entree et le coupe-bas.
     *
     * **Avant le coupe-bas, donc avant le detecteur** qui decide de la porte, du
     * ducking et de la lumiere : *ce qui decide doit decider sur le signal
     * propre.*
     *
     * WARN **Un echec ici ne doit jamais faire taire le micro.** Trois choses
     * peuvent manquer - le binaire, le worklet, ou le taux d'echantillonnage -
     * et dans les trois cas on branche le fil droit et on le dit une fois. *Une
     * amelioration qui casse la fonction de base n'est pas une amelioration.*
     */
    private async brancherLeDebruitage() {
        if (!this.context || !this.inputGain || !this.lowCut) return;

        const droit = () => this.inputGain!.connect(this.lowCut!);

        if (this.context.sampleRate !== TAUX_DU_CONTEXTE) {
            console.warn('[VoiceEngine] contexte a ' + this.context.sampleRate + ' Hz : debruitage neuronal indisponible.');
            gmToast('Debruitage neuronal indisponible : la carte son impose ' + this.context.sampleRate + ' Hz.', 'warning');
            droit();
            return;
        }

        try {
            if (!VoiceEngine.rnnoise) {
                VoiceEngine.rnnoise = fetch('/audio/rnnoise.wasm')
                    .then(reponse => {
                        if (!reponse.ok) throw new Error('HTTP ' + reponse.status);
                        return reponse.arrayBuffer();
                    })
                    .then(octets => WebAssembly.compile(octets));
            }
            const module = await VoiceEngine.rnnoise;

            await this.context.audioWorklet.addModule('/audio/debruitage-processor.js');
            const noeud = new AudioWorkletNode(this.context, 'debruitage-processor', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                outputChannelCount: [1],
                processorOptions: {
                    module,
                    actif: useVoiceStore.getState().currentEffects.debruitage === 'neuronal',
                },
            });

            noeud.port.onmessage = (evenement) => {
                const message = evenement.data;
                if (!message) return;
                if (message.type === 'voix') {
                    useVoiceStore.getState().setProbabiliteDeVoix(message.valeur);
                } else if (message.type === 'echec') {
                    console.error('[VoiceEngine] RNNoise en echec dans le worklet :', message.message);
                    gmToast('Le debruitage neuronal n a pas demarre - la voix passe sans lui.', 'error');
                }
            };

            this.inputGain.connect(noeud);
            noeud.connect(this.lowCut);
            this.debruiteur = noeud;
            console.log('[VoiceEngine] Debruitage neuronal branche');
        } catch (erreur) {
            console.error('[VoiceEngine] Debruitage neuronal indisponible :', erreur);
            gmToast('Debruitage neuronal indisponible - la voix passe sans lui.', 'warning');
            this.debruiteur = null;
            droit();
        }
    }

    /**
     * Ouvre le flux du micro selon les réglages courants.
     *
     * **Le micro choisi est demandé en `exact`, et pas en `ideal`.** Un `ideal`
     * qui échoue rend silencieusement *un autre* micro : le meneur croirait
     * parler dans son casque alors que c'est la webcam qui écoute. En `exact`,
     * l'appel échoue — on le dit, on retombe sur celui du système, et on remet
     * le sélecteur à « défaut » pour que l'écran ne mente pas.
     *
     * ⚠️ **48 kHz, et non 16 kHz comme avant.** 16 kHz est le bon choix pour de
     * la parole transmise — c'est celui de la visioconférence — mais ce module
     * ne transmet pas la parole : il la **transforme**. À 16 kHz, tout est
     * coupé au-dessus de 8 kHz : les sifflantes disparaissent, une voix
     * descendue de huit demi-tons devient sourde, et la réverbération n'a plus
     * de haut. Le contexte tourne de toute façon à 48 kHz — on rééchantillonnait
     * donc *vers le haut* un signal déjà appauvri.
     */
    private async ouvrirLeFlux(): Promise<MediaStream> {
        if (!navigator.mediaDevices) {
            throw new Error('navigator.mediaDevices is undefined. Insecure context or restricted browser.');
        }

        const { currentEffects, inputDeviceId } = useVoiceStore.getState();
        const commun: MediaTrackConstraints = {
            echoCancellation: true,
            noiseSuppression: currentEffects.debruitage === 'navigateur',
            autoGainControl: currentEffects.antiLarsen,
            sampleRate: { ideal: 48000 },
            channelCount: { ideal: 1 },
        };

        if (!inputDeviceId) return navigator.mediaDevices.getUserMedia({ audio: commun });

        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: { ...commun, deviceId: { exact: inputDeviceId } },
            });
        } catch (error) {
            console.warn('[VoiceEngine] Micro choisi indisponible, retour au micro système :', error);
            gmToast('Le micro choisi est introuvable — Voice-OS reprend celui du système.', 'warning');
            useVoiceStore.getState().setInputDeviceId(null);
            return navigator.mediaDevices.getUserMedia({ audio: commun });
        }
    }

    /**
     * Rouvre le micro sans démonter la chaîne d'effets.
     *
     * ⛔ **Changer l'anti-larsen appelait `stop()` puis `initialize()`** — donc
     * fermait l'`AudioContext`, détruisait les quinze nœuds, rechargeait le
     * worklet et rouvrait le micro. Une seconde de silence en pleine partie
     * dans le meilleur des cas ; et si la réouverture échouait, le module
     * restait **mort jusqu'au rechargement de l'application**, sans rien dire.
     *
     * Seul le flux change ici : on ouvre le nouveau **avant** de lâcher
     * l'ancien, de sorte qu'un échec laisse le meneur avec un micro qui marche
     * encore. *Un réglage raté doit être sans conséquence, sinon on n'ose plus
     * y toucher en séance.*
     */
    public async reconfigurerLeMicro() {
        if (!this.isInitialized || !this.context || !this.inputGain) return;

        try {
            const nouveau = await this.ouvrirLeFlux();
            const ancien = this.stream;

            this.source?.disconnect();
            this.stream = nouveau;
            this.source = this.context.createMediaStreamSource(nouveau);
            this.source.connect(this.inputGain);

            ancien?.getTracks().forEach(track => track.stop());
            console.log('[VoiceEngine] Micro reconfiguré sans démonter la chaîne');
        } catch (error) {
            console.error('[VoiceEngine] Reconfiguration du micro en échec :', error);
            gmToast('Impossible de rouvrir le micro — le précédent reste en place.', 'error');
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
     * Liste les périphériques audio disponibles, **entrées comprises**.
     *
     * ⚠️ Les libellés n'arrivent qu'**après** une autorisation micro accordée :
     * avant, `enumerateDevices` rend des entrées anonymes. C'est pourquoi
     * `initialize` rappelle cette méthode une fois le flux ouvert — *une liste
     * de « Périphérique 1, 2, 3 » ne se choisit pas.*
     */
    public async refreshAvailableDevices() {
        if (!navigator.mediaDevices) {
            console.warn('[VoiceEngine] navigator.mediaDevices is undefined.');
            return;
        }
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            useVoiceStore.getState().setAvailableOutputs(devices.filter(d => d.kind === 'audiooutput'));
            useVoiceStore.getState().setAvailableInputs(devices.filter(d => d.kind === 'audioinput'));
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

    /**
     * Démarre la boucle de mesure : niveau, porte, ducking, vumètre et Hub.
     *
     * **Une boucle, une mesure, trois décisions** — et les deux règles qui
     * décident vivent dans `logic/porteDeLaVoix.ts`, éprouvées sans micro.
     */
    private startLevelTracking() {
        if (!this.detecteur || !this.trameDeDetection) return;
        if (this.minuteurDeMesure) window.clearInterval(this.minuteurDeMesure);

        const update = () => {
            if (!this.detecteur || !this.trameDeDetection) return;
            this.detecteur.getFloatTimeDomainData(this.trameDeDetection);

            const { rms, db } = niveauRMS(this.trameDeDetection);
            const level = Math.min(1.0, rms * 5); // Scale for UI visibility
            const maintenantMs = performance.now();

            if (this.gateGain && this.context) {
                const { currentEffects, isActive } = useVoiceStore.getState();

                this.etatDeLaPorte = porteSuivante(this.etatDeLaPorte, {
                    db,
                    seuilDb: currentEffects.gateThreshold,
                    micro: isActive,
                    armee: currentEffects.noiseGate,
                    voix: useVoiceStore.getState().probabiliteDeVoix > SEUIL_DE_VOIX,
                    maintenantMs,
                });

                const cible = this.etatDeLaPorte.ouverte ? 1.0 : 0;
                const constante = this.etatDeLaPorte.ouverte ? OUVERTURE_S : FERMETURE_S;
                this.gateGain.gain.setTargetAtTime(cible, this.context.currentTime, constante);

                // --- DUCKING ---
                this.etatDuDucking = duckingSuivant(this.etatDuDucking, {
                    db,
                    seuilDb: currentEffects.duckingThreshold,
                    relacheMs: currentEffects.duckingRelease,
                    actif: isActive && currentEffects.duckingEnabled,
                    maintenantMs,
                });
                useVoiceStore.getState().setDucking(this.etatDuDucking.duck);
            }

            if (useVoiceStore.getState().isActive) {
                const currentLevel = level;
                useVoiceStore.getState().setInputLevel(currentLevel);
                
                // Sync with Player Hub if active
                if (window.appBridge?.image?.syncHubData) {
                    const now = Date.now();
                    // Throttle IPC to ~20fps (50ms) to avoid saturating the bridge
                    // But ALWAYS send 0 immediately
                    if (currentLevel === 0 || !this.lastSyncTime || now - this.lastSyncTime > 50) {
                        if (useVoiceStore.getState().isSyncNPC) {
                            window.appBridge.image.syncHubData('voice-level', currentLevel.toFixed(3));
                        } else if (currentLevel === 0 || (this.lastSyncLevel && this.lastSyncLevel > 0)) {
                            // Ensure we send 0 to stop any ongoing animation
                            window.appBridge.image.syncHubData('voice-level', '0');
                        }
                        this.lastSyncTime = now;
                        this.lastSyncLevel = currentLevel;
                    }
                }
            } else {
                useVoiceStore.getState().setInputLevel(0);
                /*
                  **Le zéro se dit une fois, pas trente fois par seconde.**
                  Cette branche envoyait `voice-level: 0` au Hub à chaque tour de
                  boucle micro coupé — soixante messages par seconde qui ne
                  disaient rien de nouveau, sur le pont que ce projet a déjà eu à
                  désaturer. *Un message qui répète l'état connu est du bruit,
                  même s'il est juste.*
                */
                if (this.lastSyncLevel !== 0 && window.appBridge?.image?.syncHubData) {
                    window.appBridge.image.syncHubData('voice-level', '0');
                    this.lastSyncLevel = 0;
                }
            }
        };

        update();
        this.minuteurDeMesure = window.setInterval(update, CADENCE_DE_MESURE_MS);
    }

    /**
     * Abonne l'engine aux mutations du store global Voice.
     * Permet d'appliquer les changements de paramètres (Pitch, Gain, etc.) en temps réel sur la chaîne audio.
     */
    public syncWithStore() {
        if (!this.isInitialized) return;

        useVoiceStore.subscribe((state, prevState) => {
            if (!this.context) return;
            
            const { currentEffects, isMonitor, isLive, isActive, outputDeviceId, inputDeviceId } = state;
            const prevEffects = prevState.currentEffects;

            // Handle Output Device changes
            if (outputDeviceId !== prevState.outputDeviceId && outputDeviceId) {
                this.updateOutputDevice(outputDeviceId);
            }

            /*
              **Les trois réglages qui vivent dans le flux du micro**, et non
              dans la chaîne : le micro choisi, l'anti-larsen (AGC) et la
              suppression de bruit. Ils se reposent en rouvrant le flux, sans
              toucher aux nœuds — voir `reconfigurerLeMicro`.
            */
            const fluxAChange = inputDeviceId !== prevState.inputDeviceId
                || currentEffects.antiLarsen !== prevEffects.antiLarsen
                || (currentEffects.debruitage === 'navigateur') !== (prevEffects.debruitage === 'navigateur');
            if (fluxAChange) {
                void this.reconfigurerLeMicro();
            }

            /*
              Le debruitage neuronal, lui, s'allume par un message : il ne coute
              ni remontage de chaine ni blanc dans le son.
            */
            if (currentEffects.debruitage !== prevEffects.debruitage) {
                this.debruiteur?.port.postMessage({
                    type: 'actif', valeur: currentEffects.debruitage === 'neuronal',
                });
                if (currentEffects.debruitage !== 'neuronal') {
                    useVoiceStore.getState().setProbabiliteDeVoix(0);
                }
            }

            // 1. Master Active/Mute
            if (isActive !== prevState.isActive) {
                const masterVol = isActive ? 1.0 : 0;
                this.inputGain!.gain.setTargetAtTime(masterVol, this.context.currentTime, 0.05);
            }

            // 2. Monitoring & Live — une seule voie, voir `sortieGain`
            if (isMonitor !== prevState.isMonitor || isLive !== prevState.isLive) {
                const ouvert = (isMonitor || isLive) ? 1.0 : 0;
                this.sortieGain!.gain.setTargetAtTime(ouvert, this.context.currentTime, 0.05);
            }

            // 2 bis. Compression
            if (currentEffects.compression !== prevEffects.compression) {
                this.appliquerLaCompression(currentEffects.compression, 0.05);
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
                const gain = VoiceEngine.gainDeFormant(currentEffects.formant);
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
                const melange = VoiceEngine.melangeDeReverb(currentEffects.reverb);
                this.reverbGain!.gain.setTargetAtTime(melange.mouille, this.context.currentTime, 0.1);
                this.dryGain!.gain.setTargetAtTime(melange.sec, this.context.currentTime, 0.1);
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
        if (this.minuteurDeMesure) {
            window.clearInterval(this.minuteurDeMesure);
            this.minuteurDeMesure = null;
        }
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
        this.detecteur = null;
        this.trameDeDetection = null;
        this.debruiteur = null;
        this.isInitialized = false;
        this.etatDeLaPorte = PORTE_FERMEE;
        this.etatDuDucking = DUCKING_INACTIF;
        
        // Reset UI levels
        useVoiceStore.getState().setInputLevel(0);
        if (window.appBridge?.image?.syncHubData) {
            window.appBridge.image.syncHubData('voice-level', '0');
        }
    }
}


export const voiceEngine = VoiceEngine.getInstance();
