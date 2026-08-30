import { HAUTEUR, LARGEUR } from './defileDesQuarts';

/**
 * **Le signal du Voight-Kampff — un tracé, pas une jauge.**
 *
 * *Demandé par David le 2026-08-31 : « est-ce que tu pourrais faire une sorte de
 * signal électro pour Voight-Kampff », puis « quand j'appuie sur un bouton le
 * rythme s'accélère ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI C'EST UN WIDGET COMPOSÉ, ET LE SECOND SEULEMENT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ce n'est aucun des quatre types du § 2 : ni jauge, ni compte à rebours, ni
 * rang, ni icône d'état. C'est un **dessin propre**, comme le défilé des Quarts
 * — l'étagère composée existe exactement pour ça, et elle doit rester rare.
 *
 * **Vérifié sur l'appareil avant d'écrire une ligne** : ses dix-neuf effets
 * natifs (`Radar`, `MovingLine`, `LookingEyes`, `Matrix`…) ne contiennent aucun
 * tracé. Il ne l'animera donc pas seul.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE RYTHME SE LIT À LA DENSITÉ, PAS À LA VITESSE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La cadence de publication de l'afficheur est d'une seconde. Un tracé qui
 * avancerait d'un cran par seconde ne serait pas un signal, ce serait un
 * hoquet : **animer le battement lui-même était hors de portée.**
 *
 * Alors le rythme s'écrit dans le dessin : **deux pics au repos, six au
 * maximum**, sur les mêmes trente-deux colonnes. Une accélération se voit d'un
 * coup d'œil, ce que le § 1 exige — et c'est aussi ce que fait une vraie sortie
 * papier, où l'on lit la fréquence à l'écartement des pics.
 *
 * La **dérive** d'une colonne par seconde ne porte donc aucune information :
 * elle dit seulement que la machine tourne. *Un instrument figé passe pour une
 * panne.*
 */

/** Au repos. Le sujet est calme, ou la machine ne trouve rien. */
export const NIVEAU_MIN = 1;
/** Au bout. Six pics sur trente-deux colonnes : on ne distinguerait pas plus. */
export const NIVEAU_MAX = 6;

/** L'état que le meneur pousse à la main. */
export interface EtatDuSignal {
    niveau: number;
}

export const SIGNAL_INITIAL: EtatDuSignal = { niveau: NIVEAU_MIN };

export function accelerer(etat: EtatDuSignal): EtatDuSignal {
    return { niveau: Math.min(NIVEAU_MAX, etat.niveau + 1) };
}

export function calmer(etat: EtatDuSignal): EtatDuSignal {
    return { niveau: Math.max(NIVEAU_MIN, etat.niveau - 1) };
}

/**
 * **La couleur monte avec le rythme — et elle n'est pas réglable.**
 *
 * Vert au repos, rouge au bout. *On ne rend pas réglable ce qui dit quelque
 * chose* : une couleur fixe effacerait la seule information que la table lit de
 * loin, exactement comme aplatir les Quarts sous un accent unique.
 */
export const COULEURS_DU_SIGNAL = [
    '#00C853', // 1 — calme
    '#64DD17',
    '#AEEA00',
    '#FFC400',
    '#FF6D00',
    '#FF1744', // 6 — au bout
] as const;

export function couleurDuNiveau(niveau: number): string {
    const rang = Math.max(NIVEAU_MIN, Math.min(NIVEAU_MAX, Math.round(niveau)));
    return COULEURS_DU_SIGNAL[rang - 1];
}

/** Le creux de l'onde, tout en bas de la matrice. */
const BAS = HAUTEUR - 2;
/** La crête, tout en haut. */
const HAUT = 1;

/** Un segment, au format que comprend AWTRIX : `[x0, y0, x1, y1, couleur]`. */
export interface LigneTracee {
    dl: [number, number, number, number, string];
}

/**
 * **Le tracé : une onde triangulaire, qui monte et descend linéairement.**
 *
 * *Demandé par David le 2026-08-31 : « fais varier linéairement la ligne de haut
 * en bas ».*
 *
 * ⚠️ **Dessiné en LIGNES, et c'est une contrainte mesurée, pas un choix de
 * style.** Une première version dessinait un rectangle d'un pixel par colonne :
 * 980 octets, **802 ms par poussée, et deux échecs sur vingt** sur l'appareil de
 * David. Ça aurait lâché en séance sans qu'on sache pourquoi. Les mêmes trente-
 * deux colonnes en segments `dl` font 435 octets, douze commandes, **401 ms et
 * aucun échec** — le plancher de l'appareil.
 *
 * *Un dessin trop lourd ne se voit pas dans le code, il se voit sur le fil.*
 *
 * `phase` décale l'ensemble. Elle est prise **modulo la période** et non modulo
 * la largeur : le motif se répète à cet intervalle-là, et un décalage plus grand
 * ferait sauter le tracé au lieu de le faire glisser.
 */
export function traceDuSignal(niveau: number, phase = 0): LigneTracee[] {
    const cycles = Math.max(NIVEAU_MIN, Math.min(NIVEAU_MAX, Math.round(niveau)));
    const couleur = couleurDuNiveau(cycles);
    const periode = Math.max(2, Math.floor(LARGEUR / cycles));
    const demie = Math.max(1, Math.floor(periode / 2));

    const decalage = ((phase % periode) + periode) % periode;
    const lignes: LigneTracee[] = [];

    /*
      On part **avant** le bord gauche et l'on va **au-delà** du droit : sans
      cela, le décalage laisserait un blanc d'un côté à chaque image, et l'œil
      lirait un tracé qui se recompose plutôt qu'un tracé qui glisse. Les
      coordonnées hors matrice sont simplement écrêtées par l'appareil.
    */
    for (let debut = decalage - periode; debut < LARGEUR; debut += periode) {
        lignes.push({ dl: [debut, BAS, debut + demie, HAUT, couleur] });
        lignes.push({ dl: [debut + demie, HAUT, debut + periode, BAS, couleur] });
    }

    return lignes;
}

export interface CompositionDuSignal {
    text: '';
    color: string;
    center: true;
    noScroll: true;
    draw: LigneTracee[];
}

/**
 * **De combien de colonnes le tracé avance par image.**
 *
 * *« Accélère le rythme », David, le 2026-08-31.* Une colonne par image donnait
 * une colonne par seconde — un glissement à peine perceptible. On ne peut pas
 * publier beaucoup plus vite (400 ms par requête, mesuré), alors on avance de
 * **deux colonnes** à chaque fois : combiné à la cadence de 500 ms, cela fait
 * quatre colonnes par seconde, quatre fois plus qu'avant.
 *
 * *Au-delà, le pas approcherait la demi-période et le tracé sauterait au lieu de
 * glisser* — l'œil verrait un clignotement, pas un signal.
 */
export const PAS_DE_DERIVE = 2;

/**
 * **La période d'une image du tracé — mesurée sur l'appareil, pas choisie.**
 *
 * Une poussée coûte **401 ms** à l'Ulanzi de David, quelle que soit la taille de
 * la charge (mesuré sur 20 envois, aucun échec). Descendre sous 500 ms ferait
 * donc démarrer une publication avant la fin de la précédente.
 *
 * Elle doit rester égale à `CADENCE_RAPIDE_MS` du battement : c'est ce dernier
 * qui décide *quand* on publie, celle-ci ne fait que calculer la même image.
 */
export const CADENCE_DU_SIGNAL_MS = 500;

/**
 * Le signal, tel qu'il part vers l'afficheur.
 *
 * **Aucun texte, et c'est délibéré.** « VK » sur trente-deux pixels dirait aux
 * joueurs ce qu'ils regardent, et le § 4 veut exactement l'inverse : *ils voient
 * le rythme monter et ne savent pas pourquoi.* Le tracé seul est une machine qui
 * mesure quelque chose ; nommé, il devient un score.
 *
 * `maintenant` fournit la dérive — une colonne par seconde, et la fonction reste
 * pure.
 */
export function composerVoightKampff(etat: EtatDuSignal, maintenant: number): CompositionDuSignal {
    return {
        text: '',
        color: couleurDuNiveau(etat.niveau),
        center: true,
        noScroll: true,
        draw: traceDuSignal(etat.niveau, Math.floor(maintenant / CADENCE_DU_SIGNAL_MS) * PAS_DE_DERIVE),
    };
}
