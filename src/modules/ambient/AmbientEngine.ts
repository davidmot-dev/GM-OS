/*
  ⛔ **`window.useToastStore` n'existe pas — trouvé le 2026-09-12.**
  Ce moteur criait dans le vide : le magasin n'est assigné nulle part, donc
  le `if` qui gardait l'appel n'a jamais été franchi, et *« Fichier
  introuvable dans la base de données »* n'est jamais sorti. Les arguments
  étaient de surcroît inversés (`gmToast(message, type)`).
  Une séquence de storyboard à moitié jouée est restée sans explication
  pour cette raison. *Une garde qui n'est jamais franchie ressemble à un
  code qui marche.*
*/
import { poserLaSortie } from '../../utils/poserLaSortie';
import { gmToast } from '../../stores/useToastStore';
import { useMediaStore } from '../../stores/useMediaStore';
import { SortiesAudio } from '../../utils/sortiesAudio';
import { brancherLeDucking } from '../voice/abonnementAuDucking';

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
    /**
     * **La source qui finit son fondu de sortie, et sa minuterie.**
     *
     * ⛔ **Le défaut trouvé par David le 2026-09-22**, dont il avait eu
     * l'intuition : *« un buffer qui ne se vide pas toujours bien entre 2
     * séquences »*. `stop()` posait `isPlaying = false` **immédiatement**, alors
     * que la source joue encore pendant tout le fondu — une seconde et des
     * poussières. Un `play()` dans cette fenêtre ne voyait que le drapeau,
     * créait une **seconde** source sur le même nœud de gain, et les deux copies
     * de la même boucle jouaient décalées.
     *
     * ⭐ **C'est un filtre en peigne** : elles s'additionnent et s'annulent par
     * intermittence. À l'oreille, une saccade — et le routage anti-phase, qui
     * recopie le canal gauche sur les deux sorties, la rend plus nette encore.
     */
    private sortante: AudioBufferSourceNode | null = null;
    private minuterieDeSortie: ReturnType<typeof setTimeout> | null = null;
    /** Là où la piste sort en ce moment — voir `router`. */
    private destination: AudioNode;

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
        this.destination = destination;
    }

    /**
     * **Envoie cette piste ailleurs, sans toucher aux sept autres.**
     *
     * *Demande de David du 2026-08-31.* La pluie peut sortir des enceintes de la
     * table pendant que le grondement du métro reste au casque du meneur.
     *
     * On rebranche l'analyseur : tout ce qui est en amont — sommation mono,
     * volume de la piste, fondus en cours — continue sans savoir où ça sort.
     */
    router(destination: AudioNode) {
        if (destination === this.destination) return;
        this.analyser.disconnect();
        this.analyser.connect(destination);
        this.destination = destination;
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
                    gmToast(`Fichier d'ambiance introuvable dans la base de données.`, 'error');
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
    /**
     * **Coupe pour de bon ce qui traîne**, minuterie comprise.
     *
     * ⚠️ Appelée avant toute nouvelle source : *le fondu de sortie était de
     * toute façon déjà perdu* — `play()` remet le gain partagé à zéro puis le
     * remonte, et la vieille source restait audible à travers cette remontée.
     * La couper est donc strictement meilleur que la laisser.
     */
    private couperLaSortante() {
        if (this.minuterieDeSortie) {
            clearTimeout(this.minuterieDeSortie);
            this.minuterieDeSortie = null;
        }
        if (!this.sortante) return;
        try {
            this.sortante.stop();
            this.sortante.disconnect();
        } catch {
            /* Déjà arrétée : il n'y a rien à rattraper, et lever ici ferait
               échouer le démarrage de la piste suivante. */
        }
        this.sortante = null;
    }

    play(volume: number = 0.5, fadeTime: number = 1.5) {
        if (!this.buffer || this.isPlaying) return;

        /* ⛔ **Avant tout le reste** : sans ça, deux copies de la même boucle
           jouent décalées tant que le fondu de la précédente n'est pas fini. */
        this.couperLaSortante();

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

        /* Un second arrêt avant la fin du premier ne doit pas empiler les
           minuteries : chacune gardait une référence sur une vieille source. */
        this.couperLaSortante();

        const sourceToStop = this.source;
        this.sortante = sourceToStop;
        this.minuterieDeSortie = setTimeout(() => {
            this.minuterieDeSortie = null;
            /* Si une nouvelle lecture est passée entre-temps, elle a déjà
               coupé celle-ci et en tient une autre : on ne touche à rien. */
            if (this.sortante === sourceToStop) this.couperLaSortante();
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
    /** Le volume du module, posé par le meneur ou par un moment de storyboard. */
    private volumeGain: GainNode;
    private globalSyncGain: GainNode;
    private compressor: DynamicsCompressorNode;
    private analyser: AnalyserNode;
    public tracks: AmbientTrack[] = [];
    /** Les sorties détournées, une par enceinte demandée. */
    private sorties!: SortiesAudio;
    /** Ce que valent le ducking de la voix et le réglage global, séparément. */
    private valeurDucking = 1.0;
    private valeurGlobale = 1.0;
    /** La dernière valeur posée sur {@link volumeGain} — les voies détournées en ont besoin. */
    private valeurVolume = 1.0;

    constructor() {
        /*
          ⛔ **AUCUNE CADENCE FORCÉE — les 48 kHz sont retirés le 2026-09-22.**

          David : *« le son qui sort d'Ambient-OS est saccadé »*. Il était le
          **seul des quatre moteurs** à imposer une cadence — et le seul à
          hoqueter :

          | Moteur | Son contexte |
          | --- | --- |
          | Music-OS | défaut natif, *« Native default for stability »* |
          | Sound-OS | défaut natif |
          | Voice-OS | 48 kHz forcés, **avec leur raison** (RNNoise) et un avertissement si la carte refuse |
          | Ambient-OS | 48 kHz forcés **sans aucune raison**, depuis le 2026-03-02 |

          Quand la carte son tourne à 44 100 Hz — le cas courant —, imposer 48 000
          oblige le navigateur à ré-échantillonner **tout le flux** vers la cadence
          réelle du matériel : une cause connue de micro-coupures périodiques.

          ⭐ **Rien ici n'a besoin d'une cadence particulière** : `decodeAudioData`
          adapte les fichiers au contexte, quel qu'il soit. Le commentaire de
          Music-OS se lit comme une leçon déjà apprise — quelqu'un l'a retirée
          là-bas, et n'est jamais revenu ici. *Une contrainte sans raison, que
          seul le module en panne porte, se retire.*
        */
        // @ts-expect-error - Support for legacy browsers
        this.context = new (window.AudioContext || window.webkitAudioContext)();

        // Master Chain
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.context.currentTime);
        this.compressor.knee.setValueAtTime(30, this.context.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.context.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.context.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.context.currentTime);

        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 1.3; // Compensation gain

        /*
          ⭐ **Le volume du module — un troisième facteur, et il lui fallait son
          propre nœud.** `masterGain` porte une **compensation** (1,3) qui n'est
          pas un réglage : mélanger les deux rendrait la constante
          irrécupérable, et personne ne saurait plus ce qui vient du code et ce
          qui vient du meneur.

          ⛔ Jusqu'au 2026-09-20, `useAmbientStore.masterVolume` était écrit,
          persisté, restauré des instantanés — et **lu par personne**. Aucun
          nœud ne le portait.
        */
        this.volumeGain = this.context.createGain();
        this.volumeGain.gain.value = 1.0;

        this.duckingGain = this.context.createGain();
        this.duckingGain.gain.value = 1.0;

        this.globalSyncGain = this.context.createGain();
        this.globalSyncGain.gain.value = 1.0;

        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 256;

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.volumeGain);
        this.volumeGain.connect(this.duckingGain);
        this.duckingGain.connect(this.globalSyncGain);
        this.globalSyncGain.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        this.sorties = new SortiesAudio(this.context, 'AmbientEngine');

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
            this.valeurGlobale = targetGain;
            this.menerLesVoiesDetournees(0.1);
        });
    }

    /**
     * Configure le système de ducking automatique.
     * S'abonne au Voice Store pour réduire le volume des ambiances quand quelqu'un parle.
     */
    private async setupDucking() {
        /*
          ⛔ Même remède que Music-OS, pour la même cause : un import différé
          n'empêche pas de recevoir un module à moitié évalué quand c'est
          `useVoiceStore` qui ouvre le graphe. Voir [[abonnementAuDucking]].
        */
        await brancherLeDucking('AmbientEngine', (state) => {
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
            this.valeurDucking = targetGain;
            this.menerLesVoiesDetournees(timeConstant);
        });
    }

    /**
     * **Le volume général de l'ambiance.**
     *
     * ⛔ Il n'existait pas avant le 2026-09-20 : le champ vivait dans le
     * magasin sans que rien ne le porte au son. *Un réglage persisté que
     * personne n'applique coûte plus cher qu'un réglage absent — il se
     * restaure, il voyage dans les instantanés, et il ne fait rien.*
     *
     * @param fonduMs Le temps mis pour y aller. Absent, lissage court : *un
     *        curseur doit répondre sous le doigt, un moment doit glisser.*
     */
    public setMasterVolume(volume: number, fonduMs?: number) {
        const maintenant = this.context.currentTime;
        this.valeurVolume = volume;

        if (!fonduMs || fonduMs <= 0) {
            this.volumeGain.gain.setTargetAtTime(volume, maintenant, 0.05);
            this.menerLesVoiesDetournees(0.05);
            return;
        }

        /*
          ⚠️ **Une rampe linéaire, et pas une approche exponentielle.**
          `setTargetAtTime` s'approche de sa cible sans jamais l'atteindre : un
          « coupe le son » finirait à un cheveu de zéro, et le cheveu s'entend
          dans une pièce silencieuse. On annule d'abord ce qui était programmé,
          sinon deux moments rapprochés superposeraient deux rampes et le
          niveau final ne serait celui d'aucun des deux.
        */
        const rampe = (gain: GainNode, cible: number) => {
            gain.gain.cancelScheduledValues(maintenant);
            gain.gain.setValueAtTime(gain.gain.value, maintenant);
            gain.gain.linearRampToValueAtTime(cible, maintenant + fonduMs / 1000);
        };

        rampe(this.volumeGain, volume);
        /* Les voies détournées portent le produit des trois atténuations : on
           leur fait suivre la même rampe, vers le même produit. */
        const cible = this.valeurDucking * this.valeurGlobale * volume;
        for (const canal of this.sorties.canaux) rampe(canal.ducking, cible);
    }

    /**
     * **Les voies détournées suivent les deux réglages de la voie normale.**
     *
     * La chaîne principale les porte sur deux gains distincts — le ducking de la
     * voix et le réglage global — que la voie détournée n'a pas ; elle en porte
     * un seul, et reçoit donc leur produit. *Deux atténuations en série, c'est
     * une multiplication : la reproduire est exact, pas approché.*
     */
    private menerLesVoiesDetournees(timeConstant: number) {
        const cible = this.valeurDucking * this.valeurGlobale * this.valeurVolume;
        for (const canal of this.sorties.canaux) {
            canal.ducking.gain.setTargetAtTime(cible, this.context.currentTime, Math.max(0.001, timeConstant));
        }
    }

    /**
     * **Envoie une piste sur une sortie choisie**, ou la ramène à la sortie du
     * module. *Demande de David du 2026-08-31 : une ambiance de moment peut
     * sonner ailleurs que celle qui tournait déjà.*
     *
     * ⚠️ La voie détournée reprend la **compensation de gain** du master
     * d'ambiance (1,3) : sans elle, la même piste sortirait plus bas d'un côté
     * que de l'autre, et on croirait à un réglage de volume qui a bougé.
     */
    public routerLaPiste(index: number, deviceId: string | null | undefined) {
        const piste = this.tracks[index];
        if (!piste) return;

        const canal = this.sorties.canal(deviceId);
        if (!canal) {
            piste.router(this.compressor);
            return;
        }
        canal.entree.gain.value = this.masterGain.gain.value;
        canal.ducking.gain.value = this.valeurDucking * this.valeurGlobale * this.valeurVolume;
        piste.router(canal.entree);
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
            /*
              ⛔ **Ce bloc portait le défaut du 2026-09-12**, et son jumeau dans
              l'autre moteur : un `deviceId` périmé était pris pour un appareil
              absent, et le repli sur la sortie par défaut ne se disait qu'à la
              console. *Une ambiance visée sur les enceintes du fond sortait
              devant, en silence.* `poserLaSortie` retrouve l'appareil par sa
              signature avant tout repli, et prévient le meneur quand il a
              vraiment disparu.
            */
            await poserLaSortie({
                nom: 'AmbientEngine',
                deviceId,
                appliquer: async (sinkId) => {
                    // @ts-expect-error AudioContext.setSinkId exists in modern browsers
                    await this.context.setSinkId(sinkId);
                },
            });
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
