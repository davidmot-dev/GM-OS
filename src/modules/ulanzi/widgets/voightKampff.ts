import { HAUTEUR, LARGEUR, type RectanglePlein } from './defileDesQuarts';

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

/** La ligne de base, dans le bas de la matrice. Le pic monte au-dessus. */
const LIGNE_DE_BASE = HAUTEUR - 3;
/** Hauteur d'un pic, en pixels au-dessus de la ligne. */
const HAUTEUR_DU_PIC = 4;

/**
 * **Le tracé : une ligne de base, et `niveau` pics régulièrement espacés.**
 *
 * `phase` décale l'ensemble, pour la dérive. Elle est prise **modulo l'écart
 * entre deux pics** et non modulo la largeur : le motif se répète à cet
 * intervalle-là, et un décalage plus grand ferait sauter le tracé au lieu de le
 * faire glisser.
 */
export function traceDuSignal(niveau: number, phase = 0): RectanglePlein[] {
    const pics = Math.max(NIVEAU_MIN, Math.min(NIVEAU_MAX, Math.round(niveau)));
    const couleur = couleurDuNiveau(pics);
    const ecart = Math.floor(LARGEUR / pics);

    // La ligne de base, d'un bord à l'autre. Sans elle, des pics isolés
    // ressembleraient à des barres et non à un signal.
    const commandes: RectanglePlein[] = [{ df: [0, LIGNE_DE_BASE, LARGEUR, 1, couleur] }];

    const decalage = ((phase % ecart) + ecart) % ecart;
    for (let n = 0; n < pics; n++) {
        const x = n * ecart + decalage;
        // Un pic qui déborderait est simplement omis : il reviendra au tour
        // suivant, et un rectangle tronqué au bord se lirait comme un pic plus
        // court — donc comme une autre valeur.
        if (x >= LARGEUR) continue;
        commandes.push({ df: [x, LIGNE_DE_BASE - HAUTEUR_DU_PIC, 1, HAUTEUR_DU_PIC, couleur] });
    }

    return commandes;
}

export interface CompositionDuSignal {
    text: '';
    color: string;
    center: true;
    noScroll: true;
    draw: RectanglePlein[];
}

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
        draw: traceDuSignal(etat.niveau, Math.floor(maintenant / 1000)),
    };
}
