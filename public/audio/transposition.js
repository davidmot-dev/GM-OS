/**
 * **La transposition de Voice-OS — WSOLA, et non plus deux têtes qui balayent.**
 *
 * *Chantier ouvert par David le 2026-09-03, après la révision du module : « le
 * son se coupe ou sature trop facilement (peut-être que la librairie choisie
 * n'est pas la meilleure) ».* Il n'y avait pas de librairie ; il y avait
 * l'algorithme le plus simple qui existe, et son défaut s'entend.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE FAISAIT L'ANCIEN, ET POURQUOI ÇA CHUINTAIT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deux têtes de lecture décalées d'une demi-mémoire, un fondu sinusoïdal entre
 * les deux, **complémentaire en amplitude** (`w` et `1 − w`) — et **aucun
 * alignement** : le point de recollage tombait où le balayage le voulait. Les
 * deux têtes lisent donc des instants quelconques du signal, qui se somment
 * avec une phase quelconque.
 *
 * **Mesuré au banc le 2026-09-03** (2 s de signal, ondulation du niveau RMS par
 * fenêtres de 20 ms) :
 *
 * | Signal | Ancien | Celui-ci |
 * | --- | --- | --- |
 * | bruit blanc, −5 demi-tons | **39 %** | 13 % |
 * | voyelle 120 Hz, −5 demi-tons | **50 %** | 13 % |
 * | voyelle 120 Hz, −8 demi-tons | **57 %** | 25 % |
 * | voyelle 120 Hz, +4 demi-tons | **39 %** | 1,5 % |
 *
 * Et le niveau : l'ancien perdait **1,7 dB** au passage (0,181 pour 0,221 en
 * entrée) ; celui-ci rend exactement le niveau qu'il reçoit.
 *
 * ⛔ **Le piège de la mesure, et il a failli me faire conclure l'inverse : sur
 * une SINUSOÏDE, l'ancien algorithme ne montre que 3 % d'ondulation.** Une
 * sinusoïde retardée reste la même sinusoïde — les deux têtes restent corrélées,
 * quoi qu'il arrive. *Le défaut n'apparaît que sur un signal riche, c'est-à-dire
 * sur une voix.* Une sonde qui ne réveille pas le défaut ne prouve rien.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE FAIT CELUI-CI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La technique est celle de SoundTouch et de la plupart des changeurs de voix :
 * **WSOLA** — *Waveform Similarity Overlap-Add*. On lit la mémoire à la vitesse
 * du ratio demandé, ce qui transpose ET change la durée ; puis on rattrape la
 * durée en **recollant** la lecture de temps en temps.
 *
 * Tout tient dans le choix du point de recollage :
 *
 * 1. Le retard de lecture dérive (de `1 − ratio` par échantillon). Quand il
 *    sort de ses bornes, il faut sauter.
 * 2. **On ne saute pas n'importe où : on cherche, autour du saut voulu, l'endroit
 *    dont la forme d'onde RESSEMBLE le plus à celle qu'on est en train de
 *    lire** — une corrélation sur cinq millisecondes. Sur une voix, cela revient
 *    à retomber en phase avec le cycle glottal.
 * 3. Les deux extraits étant alors **en phase**, donc corrélés, le fondu
 *    complémentaire en amplitude est cette fois le bon : ils s'additionnent en
 *    amplitude, et le niveau ne bouge pas. *C'est l'alignement qui rend le fondu
 *    correct — pas l'inverse.*
 *
 * ⚠️ **Ce que ça coûte, et il faut le dire.** Un recollage reste une couture :
 * sur une attaque de consonne, il peut la répéter ou l'escamoter. C'est le
 * compromis de toutes les méthodes temporelles. Un vocodeur de phase n'a pas ce
 * défaut mais en a un autre, pire sur la voix — la « phasiness », ce halo
 * métallique sur les voyelles tenues. *Pour de la voix, WSOLA est le bon choix,
 * et c'est pour ça que les changeurs de voix l'emploient.*
 *
 * ⚠️ **La latence.** En transposant, la lecture court derrière l'écriture :
 * `RETARD_CIBLE`, soit 43 ms. À l'unisson, l'entrée est rendue **telle quelle,
 * sans retard** — l'ancien code, lui, gardait 85 ms de délai même sans
 * transposition.
 *
 * Ce module ne connaît ni `AudioWorklet` ni `sampleRate` : il prend des
 * échantillons et rend des échantillons. C'est ce qui permet de l'éprouver au
 * banc, sans micro ni enceinte — voir
 * `src/modules/voice/logic/transposition.test.ts`.
 */

/** La mémoire de travail, en échantillons. 341 ms à 48 kHz. */
const TAILLE_TAMPON = 16384;

/** Le retard de lecture visé après un recollage. 43 ms à 48 kHz. */
export const RETARD_CIBLE = 2048;

/** Sous ce retard, la lecture rattraperait l'écriture : il faut recoller. */
const RETARD_MIN = 1536;

/** Au-dessus, le décalage s'entendrait comme un écho : il faut recoller. */
const RETARD_MAX = 4096;

/** La longueur du fondu d'un recollage. 10,7 ms à 48 kHz. */
const RECOUVREMENT = 512;

/**
 * De combien on s'autorise à déplacer le point de recollage pour l'aligner.
 *
 * **Il faut pouvoir couvrir une période entière de la voix la plus grave**, sans
 * quoi la recherche ne peut pas retomber en phase : 600 échantillons valent
 * 12,5 ms à 48 kHz, soit la période d'un 80 Hz.
 */
const RECHERCHE = 600;

/**
 * Sur combien d'échantillons on compare les formes d'onde.
 *
 * ⚠️ **Mesuré le 2026-09-03 : une fenêtre plus courte qu'une période de voix
 * aligne mal.** À 256 échantillons (5,3 ms) elle ne couvrait pas les 8,3 ms d'un
 * 120 Hz, et l'ondulation résiduelle doublait. 512 échantillons valent 10,7 ms.
 */
const COMPARAISON = 512;

/** En deçà de cet écart, aucune transposition n'est demandée. */
const SEUIL_D_UNISSON = 0.001;

/**
 * Le pas de la rampe entre le son direct et la ligne transposée.
 *
 * Passer de l'un à l'autre, c'est passer d'un échantillon courant à un
 * échantillon vieux de 43 ms : sans rampe, ça claque. ~43 ms de transition.
 */
const PAS_DE_MELANGE = 1 / 2048;

export class Transposeur {
    constructor() {
        this.tampon = new Float32Array(TAILLE_TAMPON);
        /** Nombre d'échantillons écrits depuis toujours — un index absolu. */
        this.ecrits = 0;
        /** Position de lecture, absolue et fractionnaire. */
        this.lecture = 0;
        /** Position de lecture sortante pendant un fondu de recollage. */
        this.sortante = 0;
        /** Où en est le fondu de recollage, en échantillons. `-1` : aucun. */
        this.fondu = -1;
        /** Où l'on en est entre le direct (0) et la ligne transposée (1). */
        this.melange = 0;
    }

    /** L'échantillon à un index absolu fractionnaire, interpolé linéairement. */
    lire(position) {
        const bas = Math.floor(position);
        const frac = position - bas;
        const a = this.tampon[((bas % TAILLE_TAMPON) + TAILLE_TAMPON) % TAILLE_TAMPON];
        const b = this.tampon[(((bas + 1) % TAILLE_TAMPON) + TAILLE_TAMPON) % TAILLE_TAMPON];
        return (1 - frac) * a + frac * b;
    }

    /**
     * Le meilleur point de recollage autour du saut voulu.
     *
     * On compare les `COMPARAISON` échantillons qu'on **allait lire** à ceux
     * qu'on lirait après le saut, pour chaque décalage candidat, et on garde le
     * plus ressemblant. La corrélation est **normalisée** : sans cela, le
     * candidat le plus fort gagnerait au lieu du plus semblable — *un maximum de
     * produit n'est pas une ressemblance.*
     *
     * @returns le saut retenu, en échantillons (positif = on remonte dans le temps)
     */
    meilleurSaut(sautVoulu) {
        const depart = Math.round(this.lecture);
        let meilleur = sautVoulu;
        let meilleurScore = -Infinity;

        for (let d = -RECHERCHE; d <= RECHERCHE; d += 2) {
            const saut = sautVoulu + d;
            const candidat = depart - saut;

            /* Le candidat doit rester dans la mémoire écrite, fondu compris. */
            const retard = this.ecrits - candidat;
            if (retard < RECOUVREMENT + COMPARAISON) continue;
            if (retard > TAILLE_TAMPON - COMPARAISON) continue;

            let produit = 0;
            let energie = 0;
            for (let i = 0; i < COMPARAISON; i += 2) {  // un échantillon sur deux : l'alignement n'en souffre pas
                const a = this.tampon[((depart + i) % TAILLE_TAMPON + TAILLE_TAMPON) % TAILLE_TAMPON];
                const b = this.tampon[((candidat + i) % TAILLE_TAMPON + TAILLE_TAMPON) % TAILLE_TAMPON];
                produit += a * b;
                energie += b * b;
            }

            const score = produit / Math.sqrt(energie + 1e-9);
            if (score > meilleurScore) {
                meilleurScore = score;
                meilleur = saut;
            }
        }

        return meilleur;
    }

    /** Remet la lecture à son retard nominal, sans fondu. */
    resynchroniser() {
        this.lecture = this.ecrits - RETARD_CIBLE;
        this.sortante = this.lecture;
        this.fondu = -1;
    }

    /**
     * Transpose un bloc.
     *
     * @param {Float32Array} entree
     * @param {Float32Array} sortie
     * @param {number} ratio 2^(demi-tons/12) — 1 signifie « aucune transposition »
     */
    traiter(entree, sortie, ratio) {
        const transpose = Math.abs(ratio - 1) > SEUIL_D_UNISSON;
        const cibleDeMelange = transpose ? 1 : 0;

        for (let i = 0; i < entree.length; i++) {
            const echantillon = entree[i];
            this.tampon[this.ecrits % TAILLE_TAMPON] = echantillon;
            this.ecrits++;

            /* La rampe entre le direct et la ligne transposée. */
            if (this.melange < cibleDeMelange) {
                this.melange = Math.min(cibleDeMelange, this.melange + PAS_DE_MELANGE);
                if (this.melange === PAS_DE_MELANGE) this.resynchroniser();
            } else if (this.melange > cibleDeMelange) {
                this.melange = Math.max(cibleDeMelange, this.melange - PAS_DE_MELANGE);
            }

            if (this.melange === 0) {
                /* Direct : aucun retard, et la ligne se tient prête. */
                sortie[i] = echantillon;
                this.lecture = this.ecrits - RETARD_CIBLE;
                this.sortante = this.lecture;
                this.fondu = -1;
                continue;
            }

            const retard = this.ecrits - this.lecture;

            /*
              **Le recollage.** On ne l'engage pas pendant un fondu : deux
              coutures superposées feraient exactement le bruit qu'on cherche à
              éviter.
            */
            if (this.fondu < 0 && (retard < RETARD_MIN || retard > RETARD_MAX)) {
                const saut = this.meilleurSaut(Math.round(RETARD_CIBLE - retard));
                const candidat = this.lecture - saut;
                const retardCandidat = this.ecrits - candidat;
                if (retardCandidat >= RECOUVREMENT + COMPARAISON
                    && retardCandidat <= TAILLE_TAMPON - COMPARAISON) {
                    this.sortante = this.lecture;
                    this.lecture = candidat;
                    this.fondu = 0;
                }
            }

            let transposee;

            if (this.fondu >= 0) {
                /*
                  Les deux extraits sont **alignés** par la corrélation, donc
                  corrélés : un fondu complémentaire en amplitude conserve leur
                  niveau. C'est tout l'intérêt de l'alignement — sans lui, il
                  faudrait un fondu à puissance constante, et il creuserait
                  quand même les transitoires.
                */
                const t = this.fondu / RECOUVREMENT;
                const poids = 0.5 - 0.5 * Math.cos(Math.PI * t);
                transposee = (1 - poids) * this.lire(this.sortante) + poids * this.lire(this.lecture);

                this.sortante += ratio;
                this.fondu++;
                if (this.fondu >= RECOUVREMENT) this.fondu = -1;
            } else {
                transposee = this.lire(this.lecture);
            }

            this.lecture += ratio;

            /*
              Filet : si la lecture a dépassé l'écriture — un ratio extrême, un
              bloc perdu —, on se resynchronise plutôt que de lire du vide.
            */
            const apres = this.ecrits - this.lecture;
            if (apres < RECOUVREMENT || apres > TAILLE_TAMPON - COMPARAISON) {
                this.resynchroniser();
            }

            sortie[i] = (transposee * this.melange) + (echantillon * (1 - this.melange));
        }
    }
}
