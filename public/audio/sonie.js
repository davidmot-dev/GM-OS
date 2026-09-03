/**
 * **La sonie d'un morceau, au sens de la norme — ITU-R BS.1770 / EBU R 128.**
 *
 * *Chantier demandé par David le 2026-09-03 : « on partirait sur le débruitage
 * et la normalisation de niveau ».*
 *
 * Le besoin est simple à dire : deux morceaux d'une playlist ne sortent pas au
 * même volume, et le meneur court au crossfader entre deux scènes. Le remède ne
 * l'est pas — **« le volume » d'un morceau n'existe pas** tant qu'on n'a pas
 * choisi comment le mesurer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI PAS UN SIMPLE RMS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Trois raisons, et chacune se serait entendue :
 *
 * - **L'oreille n'entend pas toutes les fréquences au même niveau.** Un morceau
 *   de basses profondes et un morceau de cordes aiguës peuvent avoir le même
 *   RMS et sembler séparés de 6 dB. D'où la **pondération K** : un passe-haut à
 *   38 Hz qui écarte ce qui ne s'entend pas, et une étagère qui relève de 4 dB
 *   ce qui est au-dessus de 1,7 kHz — là où l'oreille est la plus sensible.
 * - **Un morceau qui commence par vingt secondes de silence** aurait un RMS
 *   ridicule, et on le pousserait de 10 dB. D'où le **fenêtrage et les portes**
 *   de la norme : on ne compte que les blocs de 400 ms qui portent quelque
 *   chose, puis on écarte ceux qui sont plus de 10 LU sous la moyenne des
 *   premiers. *La mesure doit porter sur ce qu'on entend, pas sur la durée.*
 * - **C'est la mesure que tout le monde emploie.** Les valeurs sont donc
 *   comparables à celles d'un autre outil, et un morceau déjà mastérisé à
 *   −14 LUFS pour une plateforme de diffusion se reconnaît tout seul.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE MODULE NE FAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il ne décode rien et n'ouvre aucun fichier : il reçoit des échantillons et
 * accumule. C'est ce qui permet de le brancher **pendant la lecture**, sans
 * décoder une heure de musique en mémoire — et de le mesurer au banc avec des
 * signaux dont on connaît la réponse.
 */

/** Le niveau visé par défaut, en LUFS. */
export const CIBLE_PAR_DEFAUT = -18;

/** La durée d'un bloc de mesure, en secondes (norme : 400 ms). */
const BLOC_S = 0.4;

/** Le pas entre deux blocs : 100 ms, soit 75 % de recouvrement. */
const PAS_S = 0.1;

/** La porte absolue de la norme, en LUFS. */
const PORTE_ABSOLUE = -70;

/** La porte relative, en LU sous la moyenne des blocs retenus. */
const PORTE_RELATIVE = -10;

/**
 * Les deux biquads de la pondération K, calculés pour un taux donné.
 *
 * ⚠️ **Les coefficients publiés dans la norme ne valent QUE pour 48 kHz.** Les
 * recopier tels quels sur un contexte à 44,1 kHz — ce que certaines cartes son
 * imposent — décalerait les deux filtres de 9 %. On les recalcule donc depuis
 * les paramètres analogiques (méthode de `libebur128`), et à 48 kHz on retombe
 * **exactement** sur la table de la norme : c'est ce que vérifie le test.
 */
export function coefficientsK(taux) {
    /*
      La transformation bilinéaire en `tan`, et non la forme en sinus/cosinus des
      filtres audio courants : c'est celle de `libebur128`, et c'est la seule qui
      retombe **exactement** sur la table de la norme à 48 kHz. Essayée d'abord
      avec la forme classique, elle donnait 1,5293 au lieu de 1,5351 pour `b0` —
      un écart de 0,03 dB, invisible mais qui aurait rendu la mesure
      incomparable à celle de tout autre outil. *Une norme se recopie, elle ne se
      réinvente pas.*
    */

    /* Étage 1 : étagère haute, +3,999 dB à partir de 1681,97 Hz. */
    const G = 3.999843853973347;
    const Q1 = 0.7071752369554196;
    const F1 = 1681.974450955533;

    const K1 = Math.tan(Math.PI * F1 / taux);
    const Vh = Math.pow(10, G / 20);
    const Vb = Math.pow(Vh, 0.4996667741545416);
    const a0_1 = 1 + K1 / Q1 + K1 * K1;

    const etage1 = {
        b0: (Vh + Vb * K1 / Q1 + K1 * K1) / a0_1,
        b1: (2 * (K1 * K1 - Vh)) / a0_1,
        b2: (Vh - Vb * K1 / Q1 + K1 * K1) / a0_1,
        a1: (2 * (K1 * K1 - 1)) / a0_1,
        a2: (1 - K1 / Q1 + K1 * K1) / a0_1,
    };

    /* Étage 2 : passe-haut à 38,13 Hz — ce que l'oreille ne juge pas. */
    const Q2 = 0.5003270373238773;
    const F2 = 38.13547087602444;

    const K2 = Math.tan(Math.PI * F2 / taux);
    const a0_2 = 1 + K2 / Q2 + K2 * K2;

    const etage2 = {
        b0: 1,
        b1: -2,
        b2: 1,
        a1: (2 * (K2 * K2 - 1)) / a0_2,
        a2: (1 - K2 / Q2 + K2 * K2) / a0_2,
    };

    return { etage1, etage2 };
}

/** Un biquad à état, appliqué échantillon par échantillon. */
class Biquad {
    constructor(c) {
        this.c = c;
        this.x1 = 0; this.x2 = 0; this.y1 = 0; this.y2 = 0;
    }

    filtrer(x) {
        const { b0, b1, b2, a1, a2 } = this.c;
        const y = b0 * x + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2;
        this.x2 = this.x1; this.x1 = x;
        this.y2 = this.y1; this.y1 = y;
        return y;
    }
}

/**
 * Accumule la sonie d'un flux, canal par canal.
 *
 * On lui donne des blocs de la taille qu'on veut ; elle en fait des sous-blocs
 * de 100 ms, puis des blocs de 400 ms qui se recouvrent, comme la norme le
 * demande.
 */
export class MesureDeSonie {
    constructor(taux, nbCanaux = 2) {
        this.taux = taux;
        this.nbCanaux = nbCanaux;

        const { etage1, etage2 } = coefficientsK(taux);
        this.filtres = [];
        for (let c = 0; c < nbCanaux; c++) {
            this.filtres.push([new Biquad(etage1), new Biquad(etage2)]);
        }

        this.tailleSousBloc = Math.round(taux * PAS_S);
        this.sousBlocsParBloc = Math.round(BLOC_S / PAS_S);

        /** La somme des carrés du sous-bloc en cours, par canal. */
        this.sommes = new Float64Array(nbCanaux);
        this.remplissage = 0;

        /** Les sommes des sous-blocs complets, en attente de former des blocs. */
        this.sousBlocs = [];

        /** La sonie de chaque bloc de 400 ms retenu, en LUFS. */
        this.blocs = [];
    }

    /**
     * Ajoute un bloc d'échantillons.
     *
     * @param {Float32Array[]} canaux — un tableau par canal, tous de même longueur
     */
    ajouter(canaux) {
        const n = canaux[0] ? canaux[0].length : 0;

        for (let i = 0; i < n; i++) {
            for (let c = 0; c < this.nbCanaux; c++) {
                const source = canaux[c] || canaux[0];
                const [etagere, passeHaut] = this.filtres[c];
                const pondere = passeHaut.filtrer(etagere.filtrer(source[i]));
                this.sommes[c] += pondere * pondere;
            }

            this.remplissage++;
            if (this.remplissage === this.tailleSousBloc) {
                this.sousBlocs.push(Array.from(this.sommes));
                this.sommes.fill(0);
                this.remplissage = 0;

                if (this.sousBlocs.length >= this.sousBlocsParBloc) {
                    this.fermerUnBloc();
                    this.sousBlocs.shift();
                }
            }
        }
    }

    /** Referme un bloc de 400 ms et retient sa sonie. */
    fermerUnBloc() {
        const echantillons = this.tailleSousBloc * this.sousBlocsParBloc;
        let somme = 0;
        for (let c = 0; c < this.nbCanaux; c++) {
            let parCanal = 0;
            for (let b = 0; b < this.sousBlocsParBloc; b++) parCanal += this.sousBlocs[b][c];
            /*
              Les poids de canaux de la norme valent 1 pour la gauche et la
              droite — seuls les canaux arrière d'un 5.1 sont relevés de 1,5 dB.
              Une platine de musique est stéréo : le poids est donc 1 partout.
            */
            somme += parCanal / echantillons;
        }
        this.blocs.push(-0.691 + 10 * Math.log10(somme || 1e-30));
    }

    /**
     * La sonie intégrée, en LUFS, ou `null` s'il n'y a pas encore de quoi juger.
     *
     * **Les deux portes de la norme, et c'est là que tout se joue.** La porte
     * absolue écarte les blocs sous −70 LUFS : le silence ne compte pas. La
     * porte relative écarte ensuite ceux qui sont plus de 10 LU sous la moyenne
     * des premiers : *une intro murmurée ne doit pas faire pousser tout le
     * morceau de 10 dB.*
     */
    lufs() {
        const retenus = this.blocs.filter(l => l > PORTE_ABSOLUE);
        if (retenus.length < 3) return null;

        const moyenne = (liste) => {
            /* On moyenne les PUISSANCES, jamais les décibels. */
            let somme = 0;
            for (const l of liste) somme += Math.pow(10, (l + 0.691) / 10);
            return -0.691 + 10 * Math.log10(somme / liste.length);
        };

        const seuil = moyenne(retenus) + PORTE_RELATIVE;
        const finaux = retenus.filter(l => l > seuil);
        if (!finaux.length) return null;

        return moyenne(finaux);
    }

    /** Combien de blocs de 400 ms ont été mesurés — de quoi juger la maturité. */
    get nbBlocs() {
        return this.blocs.length;
    }
}

/**
 * Le gain à appliquer pour amener un morceau à la cible.
 *
 * **Borné, et c'est indispensable.** Un morceau mesuré à −40 LUFS — une prise
 * de son d'ambiance très douce — demanderait +22 dB : on lui remonterait son
 * bruit de fond avec, et le moindre transitoire saturerait. *Une correction
 * automatique doit avoir le droit de renoncer.*
 *
 * @param {number|null} lufs — la sonie mesurée, ou `null` si inconnue
 * @param {number} cible — en LUFS
 * @param {number} limiteDb — l'écart maximal autorisé, en dB
 * @returns {number} un gain linéaire ; exactement 1 quand on ne sait pas
 */
export function gainDeNormalisation(lufs, cible = CIBLE_PAR_DEFAUT, limiteDb = 12) {
    if (lufs === null || lufs === undefined || !Number.isFinite(lufs)) return 1;
    const ecart = Math.max(-limiteDb, Math.min(limiteDb, cible - lufs));
    return Math.pow(10, ecart / 20);
}
