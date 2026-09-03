/**
 * **Le débruitage neuronal de Voice-OS — RNNoise, piloté directement.**
 *
 * *Chantier demandé par David le 2026-09-03 : « on partirait sur le
 * débruitage ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI PAS LA GLU DU PAQUET
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `@shiguredo/rnnoise-wasm` fournit une glu d'Emscripten qui a besoin de
 * `TextDecoder` et de `window` : **aucun des deux n'existe dans un
 * AudioWorklet**, et elle instancie le module de façon asynchrone, ce qu'un
 * constructeur de processeur ne peut pas attendre.
 *
 * Or le wash ne réclame que **trois imports** — un `assert` qui échoue, une
 * demande d'agrandissement du tas, et une écriture sur la sortie d'erreur. On
 * l'instancie donc soi-même, **de façon synchrone**, à partir d'un
 * `WebAssembly.Module` déjà compilé qu'on nous passe. Conséquence heureuse : le
 * même code tourne sous Node, donc **le débruiteur est mesurable au banc** —
 * voir `electron/debruitage.test.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES TROIS PIÈGES DE RNNOISE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. **Il travaille en échelle 16 bits.** Il attend des échantillons entre
 *    −32768 et 32767, alors que Web Audio parle en −1..1. Sans la mise à
 *    l'échelle, l'entrée lui paraît un silence absolu et il ne rend rien.
 * 2. **Il exige des trames de 480 échantillons** (10 ms à 48 kHz), quand un
 *    worklet en livre 128. Il faut donc accumuler — d'où **10 ms de latence**,
 *    et pas une de plus si l'accumulation est juste.
 * 3. **Il est entraîné à 48 kHz.** À un autre taux d'échantillonnage, son
 *    découpage en bandes tombe à côté. C'est l'appelant qui garantit le taux.
 *
 * Il rend en prime une **probabilité de voix** (0 à 1) par trame : un détecteur
 * d'activité vocale entraîné, bien plus fiable qu'un seuil de niveau. Elle sert
 * à tenir la porte ouverte pendant qu'on parle — *ce qui répond, par un autre
 * chemin, au « le son se coupe » du même jour.*
 */

/** Le nombre d'échantillons qu'une trame RNNoise contient, immuable. */
export const TAILLE_DE_TRAME = 480;

/** L'échelle attendue par RNNoise : du 16 bits signé. */
const ECHELLE = 32768;

/** Le taux d'échantillonnage pour lequel le modèle est entraîné. */
export const TAUX_ATTENDU = 48000;

/**
 * Instancie le module RNNoise et rend une poignée sur ses fonctions.
 *
 * Les trois imports sont des bouchons, et c'est justifié : `__assert_fail` ne
 * doit jamais survenir (il signalerait un bogue du modèle), `fd_write` ne sert
 * qu'aux traces de `printf`, et l'agrandissement du tas est **vraiment**
 * implémenté — le refuser silencieusement ferait échouer un `malloc` sans que
 * rien ne le dise.
 *
 * @param {WebAssembly.Module} module — compilé par l'appelant
 */
export function instancierRnnoise(module) {
    let instance = null;

    const imports = {
        env: {
            __assert_fail: () => {
                throw new Error('[RNNoise] assertion interne — modèle ou mémoire corrompus');
            },
            emscripten_resize_heap: (octets) => {
                if (!instance) return 0;
                const memoire = instance.exports.memory;
                const actuel = memoire.buffer.byteLength;
                if (octets <= actuel) return 1;
                /* `grow` compte en pages de 64 Kio, et arrondit au-dessus. */
                const pages = Math.ceil((octets - actuel) / 65536);
                try {
                    memoire.grow(pages);
                    return 1;
                } catch {
                    return 0;
                }
            },
        },
        wasi_snapshot_preview1: {
            /* On prétend avoir écrit ce qu'on nous demande d'écrire. */
            fd_write: (_fd, _iov, iovcnt, pnum) => {
                if (instance) new DataView(instance.exports.memory.buffer).setUint32(pnum, 0, true);
                return iovcnt >= 0 ? 0 : -1;
            },
        },
    };

    instance = new WebAssembly.Instance(module, imports);
    const exports = instance.exports;

    /*
      ⛔ **Deux appels d'amorçage, et rien ne marche sans eux.** Première
      tentative sans eux : `rnnoise_create` déclenchait `__assert_fail` depuis
      les entrailles du modèle. C'est la glu d'Emscripten qui les fait
      normalement, et elle les fait *avant* d'exposer quoi que ce soit :

      - `emscripten_stack_init` pose la pile du programme. Sans elle, tout
        appel écrit dans une pile dont les bornes valent zéro.
      - `__wasm_call_ctors` exécute les constructeurs statiques — et pour
        RNNoise, **c'est là que les tables du modèle sont remplies**. Sans elle,
        le réseau existe mais ses poids sont nuls.

      *Un module WebAssembly n'est pas prêt parce qu'il est instancié.*
    */
    exports.emscripten_stack_init();
    exports.__wasm_call_ctors();

    return exports;
}

/**
 * Un débruiteur : il avale des blocs de n'importe quelle taille et en rend
 * autant, débruités, avec **une trame de retard**.
 */
export class Debruiteur {
    /**
     * @param {WebAssembly.Module} module
     */
    constructor(module) {
        this.wasm = instancierRnnoise(module);
        this.etat = this.wasm.rnnoise_create(0);
        if (!this.etat) throw new Error('[RNNoise] rnnoise_create a rendu 0');

        /* La zone d'échange avec le wasm : une trame de flottants 32 bits. */
        this.adresse = this.wasm.malloc(TAILLE_DE_TRAME * 4);
        if (!this.adresse) throw new Error('[RNNoise] malloc a rendu 0');

        /** Ce qui attend d'être traité, et ce qui attend d'être rendu. */
        this.entree = new Float32Array(TAILLE_DE_TRAME);
        this.sortie = new Float32Array(TAILLE_DE_TRAME);
        this.remplissage = 0;

        /**
         * La dernière probabilité de voix rendue par le modèle.
         *
         * Elle vaut 0 avant la première trame — soit dix millisecondes pendant
         * lesquelles il ne faut pas conclure au silence.
         */
        this.probabiliteDeVoix = 0;

        /*
          La sortie démarre à zéro : les 480 premiers échantillons rendus sont
          donc du silence, et c'est exactement la latence annoncée. *Mieux vaut
          dix millisecondes de silence franc qu'un bout de mémoire non initialisée.*
        */
    }

    /** Une vue flottante sur la zone d'échange — refaite si la mémoire a grandi. */
    zone() {
        return new Float32Array(this.wasm.memory.buffer, this.adresse, TAILLE_DE_TRAME);
    }

    /**
     * Débruite un bloc.
     *
     * @param {Float32Array} entree
     * @param {Float32Array} sortie — peut être le même tableau que `entree`
     */
    traiter(entree, sortie) {
        for (let i = 0; i < entree.length; i++) {
            this.entree[this.remplissage] = entree[i];
            /*
              On rend l'échantillon de la trame précédente AVANT d'avancer :
              c'est ce décalage d'une trame qui est toute la latence, et il ne
              doit jamais dériver.
            */
            sortie[i] = this.sortie[this.remplissage];
            this.remplissage++;

            if (this.remplissage === TAILLE_DE_TRAME) {
                const zone = this.zone();
                for (let j = 0; j < TAILLE_DE_TRAME; j++) zone[j] = this.entree[j] * ECHELLE;

                this.probabiliteDeVoix = this.wasm.rnnoise_process_frame(
                    this.etat, this.adresse, this.adresse,
                );

                const rendu = this.zone();
                for (let j = 0; j < TAILLE_DE_TRAME; j++) this.sortie[j] = rendu[j] / ECHELLE;
                this.remplissage = 0;
            }
        }
    }

    /** Rend au wasm ce qu'il nous a prêté. */
    detruire() {
        if (!this.etat) return;
        this.wasm.rnnoise_destroy(this.etat);
        this.wasm.free(this.adresse);
        this.etat = 0;
        this.adresse = 0;
    }
}
