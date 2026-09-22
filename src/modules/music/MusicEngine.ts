/**
 * Engine Audio pour Music OS v5
 * Gère le mixage, les platines, les boucles A/B et le routage via Streaming HTML5.
 */
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
import { gmToast } from '../../stores/useToastStore';
import { useMediaStore } from '../../stores/useMediaStore';
import { SortiesAudio } from '../../utils/sortiesAudio';
/*
  Le module est du JavaScript parce qu'un AudioWorklet le charge aussi, tel quel,
  sans passer par Vite. Son contrat pour TypeScript vit dans `sonie.d.ts`, et la
  règle de gain est partagée avec la sonde : *une cible et une limite écrites à
  deux endroits finissent par différer.*
*/
import { gainDeNormalisation } from '../../../public/audio/sonie.js';
import {
    courbeDuFonduCroise,
    gainsALaPosition,
    platineOpposee,
    positionDeLaPlatine,
    positionDuFondu,
    type FonduEnCours,
} from './logic/fonduCroise';
import { brancherLeDucking } from '../voice/abonnementAuDucking';
import {
    delaiAvantLaSortie,
    plageValide,
    positionDeDepart,
    sortieAtteinte,
    type PlageDeLecture,
} from './logic/plageDeLecture';

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

    /**
     * Le gain de normalisation, entre la source et le gain de la platine.
     *
     * Separe du gain de platine EXPRES : celui-la porte le volume et les
     * fondus, celui-ci porte une correction mesuree. *Deux intentions dans un
     * meme gain, et on ne sait plus lequel des deux a bouge.*
     */
    private gainDeNormalisation: GainNode;

    /** La sonde de sonie, si le worklet a pu etre charge. */
    private sonde: AudioWorkletNode | null = null;

    /** La piste chargee, qui sert de cle a la sonie mesuree. */
    private pisteEnCours: string | null = null;

    /** Rendus par le store, comme `onStateChange` — le moteur n'importe rien. */
    public sonieDe: ((piste: string) => number | null) | null = null;
    public reglageDeNormalisation: (() => { actif: boolean; cible: number }) | null = null;
    public onSonieMesuree: ((piste: string, lufs: number) => void) | null = null;
    /** L'arrêt programmé par `fadeOut` — annulable, voir `annulerLArretDiffere`. */
    private arretDiffere: ReturnType<typeof setTimeout> | null = null;

    /**
     * **La plage de lecture de la piste chargée** — voir `logic/plageDeLecture`.
     *
     * Elle appartient au pad, pas à la platine : c'est le magasin qui la repose
     * à chaque chargement. ⚠️ **`loadTrack` l'efface**, et ce n'est pas du
     * ménage : une plage 0:10→0:40 restée d'un morceau précédent ferait jouer
     * trente secondes d'un morceau de six minutes, en boucle, sans rien dire.
     */
    private plage: PlageDeLecture | null = null;

    /**
     * Le rendez-vous avec la sortie de la plage.
     *
     * ⛔ **Il vit dans le moteur et NON dans un composant**, et surtout pas dans
     * une boucle `requestAnimationFrame` : le fondu croisé a déjà payé cette
     * leçon le 2026-08-30 — *un composant démonté n'exécute rien*, et une
     * animation d'image se fige quand la fenêtre passe à l'arrière-plan. Une
     * boucle qui s'arrête dès qu'on quitte l'écran de Music-OS serait pire
     * qu'absente.
     */
    private rendezVousDeSortie: ReturnType<typeof setTimeout> | null = null;

    /**
     * **Vrai pendant qu'un fondu croisé emmène cette platine vers le silence.**
     *
     * ⛔ Signalé par David le 2026-09-16 — *« le fade out fade in entre A et B ne
     * fonctionne plus, le son traverse d'un coup »*, une plage posée. Le fondu
     * partait bien (9 essais le prouvent) ; c'est **la plage qui coupait la
     * platine sortante en plein fondu** : arrivée à sa sortie, elle rembobinait
     * à l'entrée — ou, 🔁 éteint, se mettait en pause **net**. Le morceau
     * disparaissait donc d'un coup pendant que l'autre montait, ce qui s'entend
     * exactement comme une bascule.
     *
     * *La plage dit ce qui se joue en écoute normale. Une platine qu'un fondu
     * emmène au silence est déjà condamnée — la couper une seconde fois n'aide
     * personne.*
     */
    private fonduDeSortieEnCours = false;
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
        this.gainDeNormalisation = context.createGain();

        /*
          La sonde viendra se glisser entre la source et la normalisation quand
          son worklet sera charge — voir `brancherLaSonde`. En attendant, le son
          passe : *une mesure qui n'est pas prete ne doit pas retarder la
          musique d'une seconde.*
        */
        this.sourceNode.connect(this.gainDeNormalisation);
        this.gainDeNormalisation.connect(this.gainNode);
        this.gainNode.connect(destination);

        this.state = {
            isPlaying: false,
            isLooping: true,
            volume: 1.0,
            currentTime: 0,
            duration: 0
        };

        // Events listeners for state sync
        this.audioElement.onplay = () => { this.state.isPlaying = true; this.updateState(); this.surveillerLaSortie(); };
        this.audioElement.onpause = () => { this.state.isPlaying = false; this.updateState(); this.desarmerLaSortie(); };
        this.audioElement.onended = () => { if (!this.state.isLooping) { this.state.isPlaying = false; this.updateState(); } };
        this.audioElement.onloadedmetadata = () => {
            this.state.duration = this.audioElement.duration;
            /*
              **La plage se revalide ici, et c'est le seul endroit possible.**
              Le magasin la pose au chargement, donc **avant** que la durée du
              fichier soit connue : le bornage de `plageValide` n'a alors rien
              à border. Une sortie au-delà de la fin du morceau — un fichier
              remplacé sous un pad qui gardait ses points — ne se voit qu'ici.
            */
            if (this.plage) {
                this.plage = plageValide(this.plage.entree, this.plage.sortie, this.audioElement.duration);
                this.appliquerLaBoucleNative();
                this.surveillerLaSortie();
            }
            this.updateState();
        };

        /*
          **Le filet du rendez-vous.** `timeupdate` est émis par l'élément audio
          lui-même — quatre fois par seconde environ, et **sans dépendre de
          l'horloge des images ni de celle des minuteries**. C'est peu précis,
          donc ça ne peut pas tenir la boucle tout seul ; mais le jour où une
          minuterie est bridée (fenêtre à l'arrière-plan) ou décalée par une
          mise en tampon, c'est lui qui rattrape.

          *Une boucle qui se dégrade à un quart de seconde près vaut mieux
          qu'une boucle qui s'arrête.*
        */
        this.audioElement.ontimeupdate = () => {
            if (this.fonduDeSortieEnCours) return;
            if (this.plage && this.state.isPlaying && sortieAtteinte(this.audioElement.currentTime, this.plage)) {
                this.bouclerOuFinir();
            }
        };
    }

    /**
     * Glisse la sonde de sonie entre la source et le gain de normalisation.
     *
     * Appelee apres coup, une fois le module du worklet charge. Un echec est
     * sans consequence : la platine joue, elle ne mesure simplement pas.
     */
    brancherLaSonde() {
        if (this.sonde) return;
        try {
            const sonde = new AudioWorkletNode(this.context, 'sonie-processor', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                outputChannelCount: [2],
                processorOptions: { canaux: 2, piste: this.pisteEnCours },
            });

            sonde.port.onmessage = (evenement) => {
                const message = evenement.data;
                if (message && message.type === 'sonie' && this.onSonieMesuree) {
                    this.onSonieMesuree(message.piste, message.lufs);
                }
            };

            this.sourceNode.disconnect(this.gainDeNormalisation);
            this.sourceNode.connect(sonde);
            sonde.connect(this.gainDeNormalisation);
            this.sonde = sonde;
        } catch (erreur) {
            console.warn('[MusicDeck] sonde de sonie indisponible :', erreur);
            this.sonde = null;
        }
    }

    /**
     * Repose le gain de normalisation d'apres ce que le store sait de la piste.
     *
     * ⚠️ **Le gain est pose au CHARGEMENT, jamais pendant la lecture.** La sonde
     * affine sa mesure tout au long du morceau ; suivre ces affinements ferait
     * bouger le volume sous les doigts du meneur. Une piste deja mesuree est
     * donc juste des la premiere note ; une piste inconnue joue telle quelle et
     * sera juste la prochaine fois. *Un correctif qui remue pendant qu'on
     * ecoute est pire que le defaut.*
     */
    appliquerLaNormalisation() {
        const reglage = this.reglageDeNormalisation ? this.reglageDeNormalisation() : null;
        const lufs = (reglage && reglage.actif && this.pisteEnCours && this.sonieDe)
            ? this.sonieDe(this.pisteEnCours)
            : null;

        const gain = gainDeNormalisation(lufs, reglage ? reglage.cible : undefined);
        this.gainDeNormalisation.gain.setTargetAtTime(gain, this.context.currentTime, 0.05);
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

        /*
          ⚠️ **La plage meurt avec la piste qu'elle découpait.** Le magasin
          repose celle du nouveau pad juste après ce chargement ; la garder
          d'ici là ferait jouer en boucle trente secondes arbitraires d'un
          morceau qui n'a rien demandé — *et le meneur n'aurait aucun moyen de
          deviner d'où sortent ces bornes.*
        */
        this.plage = null;
        this.desarmerLaSortie();
        this.appliquerLaBoucleNative();

        /*
          ⛔ **DÉTACHER LE GESTIONNAIRE AVANT DE DÉMONTER — 2026-09-22.**

          David, capture à l'appui : deux `AudioElement Error [blob:…]` dans la
          console, une par changement de morceau, **alors que tout s'entendait**.

          Le gestionnaire n'était jamais détaché : celui de la piste **précédente**
          était encore là au démontage, et c'est lui qui attrapait l'erreur. Il
          journalisait donc l'adresse de **l'ancienne** piste — *l'erreur nommait
          la mauvaise piste, ce qui est pire que de ne rien nommer* — et il
          affichait une bulle rouge au meneur, en pleine partie, pour rien.
        */
        this.audioElement.onerror = null;

        // On libère l'ancien handle avant de charger
        this.audioElement.pause();
        /*
          ⛔ **`src = ""` n'est pas un démontage, c'est un chargement qui échoue.**
          La chaîne vide se résout contre l'adresse du document : l'élément tente
          de charger la page elle-même, n'y trouve aucun média, et lève `error`.
          `removeAttribute` + `load()` est la façon prévue d'arrêter un élément
          média sans rien casser.
        */
        this.audioElement.removeAttribute('src');
        this.audioElement.load();

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
                gmToast(`Fichier audio introuvable dans la base de données.`, 'error');
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

        /*
          La cle de la sonie est l'URL DEMANDEE, pas l'URL finale : celle-ci est
          un `blob:` recree a chaque chargement, et la mesure serait perdue a
          chaque fois.
        */
        this.pisteEnCours = url;
        this.sonde?.port.postMessage({ type: 'piste', piste: url });
        this.appliquerLaNormalisation();
        this.audioElement.src = finalUrl;
        
        /*
          ⚠️ **Une erreur journalisée sous une forme qui ne s'affiche pas est une
          erreur perdue.** `MediaError` n'a **aucune propriété énumérable** : le
          panneau de débogage rendait donc « AudioElement Error [blob:…] : » suivi
          de **rien**. On déplie le code et le message à la main.
        */
        this.audioElement.onerror = () => {
            const err = this.audioElement.error;
            const msg = `Erreur Audio: ${err?.message || 'Inconnue'} (Code ${err?.code})`;
            console.error(
                `[MusicDeck] AudioElement Error [${finalUrl}] `
                + `code=${err?.code ?? '?'} : ${err?.message || 'sans message'}`,
            );
            gmToast(msg, 'error');
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

        /*
          **La plage définit ce qui se joue** : lancer avec la tête hors de
          l'extrait l'amène à l'entrée. Une position déjà dans la plage est
          respectée — le meneur qui s'est placé à l'oreille dans son passage ne
          veut pas être ramené au début parce qu'il a appuyé sur Lecture.
        */
        /*
          ⚠️ **Par `seek` et non par `currentTime` en direct.** `seek` porte la
          garde que cette ligne n'avait pas : *une position posée avant que les
          métadonnées soient lues est **ignorée en silence** par le navigateur.*
          Écrite à la main, elle faisait donc démarrer le morceau à zéro au lieu
          de l'entrée, une fois sur deux et sans rien dire.
        */
        const depart = positionDeDepart(this.audioElement.currentTime, this.plage);
        if (depart !== null) this.seek(depart);

        try {
            console.log(`[MusicDeck] Calling audioElement.play() for: ${this.audioElement.src}`);
            await this.audioElement.play();
            console.log(`[MusicDeck] Play successful.`);
        } catch (e) {
            const error = e as Error;
            console.error(`[MusicDeck] Play failed for ${this.audioElement.src}:`, error);
            gmToast(`Échec Lecture: ${error.message}`, 'error');
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
        this.desarmerLaSortie();
        // La platine quitte l'antenne : le fondu qui l'y emmenait est fini, et
        // sa plage doit valoir de nouveau au prochain départ.
        this.fonduDeSortieEnCours = false;
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

        /*
          ⛔ **Le SECOND fondu qui emmène cette platine au silence** — trouvé le
          2026-09-16 en répondant à la question de David, *« est-ce que tu dois
          revoir d'autres mécanismes de fade out ? »*. Le crossfader n'était pas
          seul : `stopDeck` et `stopAll` passent par ici, et une plage qui
          atteint sa sortie pendant ces trois secondes coupe le morceau net au
          lieu de le laisser descendre. *Même cause, même remède, deux chemins.*
        */
        this.suspendreLaPlagePendantLeFondu(true);

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
        /*
          La platine n'est plus promise au silence : sa plage revaut. C'est le
          cas du meneur qui change d'avis en plein fondu de sortie — celui que
          cette fonction existe déjà pour rattraper.
        */
        this.fonduDeSortieEnCours = false;
    }

    /**
     * Active ou désactive la lecture en boucle (loop).
     * @param value True pour boucler, False pour arrêter à la fin.
     */
    setLooping(value: boolean) {
        this.state.isLooping = value;
        this.appliquerLaBoucleNative();
        this.updateState();
    }

    /**
     * **La boucle native du navigateur et la plage ne peuvent pas coexister.**
     *
     * `audioElement.loop` reboucle sur le morceau **entier**. Laissé allumé
     * sous une plage, il ne se déclencherait jamais (on n'atteint plus la fin
     * du fichier) sauf si la sortie touche la fin — et là les deux mécanismes
     * rembobineraient, l'un vers zéro, l'autre vers l'entrée. *Deux écrivains
     * pour une même position, et c'est le hasard qui tranche.*
     */
    private appliquerLaBoucleNative() {
        this.audioElement.loop = this.state.isLooping && !this.plage;
    }

    /**
     * Pose (ou retire) la plage de lecture de la piste chargée.
     *
     * Appelée par le magasin au chargement d'un pad et à chaque fois que le
     * meneur déplace un point. Les valeurs brutes viennent du pad ; c'est
     * `plageValide` qui décide si elles font une plage — voir la table des
     * quatre comportements dans `logic/plageDeLecture`.
     */
    definirLaPlage(entree: number | null, sortie: number | null) {
        this.plage = plageValide(entree, sortie, this.audioElement.duration);
        this.appliquerLaBoucleNative();
        this.surveillerLaSortie();
        this.updateState();
    }

    /** La plage en vigueur, pour l'écran qui la dessine. */
    get plageDeLecture(): PlageDeLecture | null {
        return this.plage;
    }

    /**
     * Arme le rendez-vous avec la sortie de la plage.
     *
     * Ré-armé à chaque événement qui change la donne : lecture, déplacement de
     * la tête, changement de plage, et bouclage. *Un rendez-vous pris sur une
     * position périmée arrive au mauvais moment.*
     */
    /**
     * Le moteur prévient la platine qu'un fondu croisé l'emmène au silence (ou
     * qu'il ne l'y emmène plus — le meneur peut saisir le crossfader en cours
     * de route, et la platine revient alors à l'antenne avec sa plage).
     */
    suspendreLaPlagePendantLeFondu(actif: boolean) {
        this.fonduDeSortieEnCours = actif;
        this.surveillerLaSortie();
    }

    private surveillerLaSortie() {
        this.desarmerLaSortie();
        if (!this.plage || !this.state.isPlaying || this.fonduDeSortieEnCours) return;

        if (sortieAtteinte(this.audioElement.currentTime, this.plage)) {
            this.bouclerOuFinir();
            return;
        }

        const delai = delaiAvantLaSortie(this.audioElement.currentTime, this.plage);
        if (delai === null) return;

        this.rendezVousDeSortie = setTimeout(() => {
            this.rendezVousDeSortie = null;
            this.bouclerOuFinir();
        }, delai);
    }

    private desarmerLaSortie() {
        if (this.rendezVousDeSortie) {
            clearTimeout(this.rendezVousDeSortie);
            this.rendezVousDeSortie = null;
        }
    }

    /**
     * La sortie est atteinte : on rembobine à l'entrée, ou on s'arrête.
     *
     * C'est ici que le bouton 🔁 de la platine reprend tout son sens — il ne
     * décide plus *si le fichier se répète* mais *si la plage se répète*.
     *
     * Sans boucle, on **pause et on revient à l'entrée** plutôt que d'appeler
     * `stop()` : la platine reste prête à rejouer le même passage, ce qui est
     * exactement ce qu'on veut d'un extrait. *Rembobiner à zéro obligerait à
     * refaire le chemin à chaque fois.*
     */
    private bouclerOuFinir() {
        if (!this.plage) return;
        this.desarmerLaSortie();

        if (this.state.isLooping) {
            this.audioElement.currentTime = this.plage.entree;
            this.updateState();
            this.surveillerLaSortie();
            return;
        }

        this.audioElement.pause();
        this.audioElement.currentTime = this.plage.entree;
        this.state.isPlaying = false;
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
        /*
          Le rendez-vous avec la sortie était pris pour l'ancienne position : il
          arriverait trop tôt ou trop tard. On ne **borne pas** le déplacement à
          la plage, en revanche — se placer hors de l'extrait est un geste
          délibéré, et la lecture y rentrera d'elle-même.
        */
        this.surveillerLaSortie();
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

    /** Le module du worklet de sonie, charge une seule fois. */
    private sondePrete: Promise<void> | null = null;

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
        /*
          ⛔ **L'import différé ne suffisait pas — 2026-09-05.** Il évite bien le
          cycle *dans un sens*, mais quand `useVoiceStore` était lui-même le point
          d'entrée du graphe, il rendait un module encore en cours d'évaluation :
          l'abonnement levait une exception dans une promesse que personne
          n'attend, et **la musique cessait de baisser quand le meneur parle**,
          sans un mot. Voir [[abonnementAuDucking]].
        */
        await brancherLeDucking('MusicEngine', ({ isDucking, currentEffects }) => {
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
    /**
     * @param fonduMs Le temps mis pour atteindre la valeur. Absent, on garde le
     *        lissage court d'un curseur qu'on traîne. Une rampe **linéaire**
     *        au-delà : `setTargetAtTime` n'atteint jamais sa cible, et le
     *        cheveu qui reste au-dessus de zéro s'entend dans une pièce
     *        silencieuse.
     */
    setMasterVolume(value: number, fonduMs?: number) {
        const maintenant = this.context.currentTime;
        // Le volume de la musique mène les voies détournées avec la voie normale.
        for (const gain of [this.masterGain, ...this.sorties.canaux.map(c => c.entree)]) {
            if (!fonduMs || fonduMs <= 0) {
                gain.gain.setTargetAtTime(value, maintenant, 0.05);
                continue;
            }
            gain.gain.cancelScheduledValues(maintenant);
            gain.gain.setValueAtTime(gain.gain.value, maintenant);
            gain.gain.linearRampToValueAtTime(value, maintenant + fonduMs / 1000);
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

        /*
          **Les deux platines retrouvent leur plage.** Le meneur qui saisit le
          crossfader en plein fondu ramène la sortante à l'antenne : sa plage
          doit recommencer à valoir. *Une suspension qu'on oublie de lever est
          la minuterie qui survit à ce qu'elle devait arrêter, en plus discret.*
        */
        this.deckA.suspendreLaPlagePendantLeFondu(false);
        this.deckB.suspendreLaPlagePendantLeFondu(false);
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
        const platineSortante = sortante === 'A' ? this.deckA : this.deckB;

        /*
          ⛔ **La plage de la platine sortante se tait pendant le fondu.** Sans
          ça, un morceau qui atteint sa sortie en plein fondu rembobine — ou se
          met en pause net, 🔁 éteint — et **le fondu s'entend comme une
          bascule** (signalé par David le 2026-09-16). La platine entrante, elle,
          récupère la sienne : c'est elle qui reste à l'antenne.
        */
        platineSortante.suspendreLaPlagePendantLeFondu(true);
        (target === 'A' ? this.deckA : this.deckB).suspendreLaPlagePendantLeFondu(false);

        this.arretDeLaSortante = setTimeout(() => {
            this.arretDeLaSortante = null;
            platineSortante.stop();
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
                /*
                  ⭐ **La même rustine qu'Ambient-OS le 2026-09-22** : une
                  platine visée sur l'enceinte que ce contexte porte déjà n'a
                  rien à gagner d'une voie détournée, et son flux saccade. Voir
                  `sortiesAudio`.

                  ⚠️ Ce moteur est le seul des trois à ne pas passer par
                  `poserLaSortie` : il ne sait donc pas si l'appareil a été
                  retrouvé sous un autre numéro. C'est ce qu'on pose ici, et
                  rien de plus — *ce qu'on n'a pas vérifié ne se déclare pas.*
                */
                this.sorties.sortieDuModuleEst(deviceId === 'default' ? '' : deviceId);
                console.log(`[MusicEngine] Context Output device successfully changed to ${deviceId}`);
            } catch (error) {
                console.error('[MusicEngine] Failed to set audio output device', error);
            }
        } else {
            console.warn('[MusicEngine] AudioContext.setSinkId not supported.');
        }
    }
    /**
     * Charge le worklet de sonie et branche les deux sondes.
     *
     * Appele par le store apres avoir pose ses rappels — donc apres qu'il sait
     * quoi faire d'une mesure. *Brancher une sonde dont personne ne lit la
     * sortie, c'est du calcul en pure perte.*
     */
    async preparerLaSonie() {
        if (this.sondePrete) return this.sondePrete;
        this.sondePrete = (async () => {
            try {
                await this.context.audioWorklet.addModule('/audio/sonie-processor.js');
                this.deckA.brancherLaSonde();
                this.deckB.brancherLaSonde();
                console.log('[MusicEngine] Sondes de sonie branchees');
            } catch (erreur) {
                console.warn('[MusicEngine] Mesure de sonie indisponible :', erreur);
            }
        })();
        return this.sondePrete;
    }

    /** Repose les gains de normalisation des deux platines. */
    rejouerLaNormalisation() {
        this.deckA.appliquerLaNormalisation();
        this.deckB.appliquerLaNormalisation();
    }

}


export const musicEngine = new MusicEngine();

// Export for cross-store access
if (typeof window !== 'undefined') {
    (window as any).musicEngine = musicEngine;
}
