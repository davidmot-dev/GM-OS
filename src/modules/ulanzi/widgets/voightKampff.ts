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
 * Alors le rythme s'écrit dans le dessin : **un battement au repos, six au
 * maximum**, sur les mêmes trente-deux colonnes. Une accélération se voit d'un
 * coup d'œil, ce que le § 1 exige — et c'est aussi ce que fait une vraie sortie
 * papier, où l'on lit la fréquence à l'écartement des complexes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ET LE DÉTAIL DIMINUE QUAND LE RYTHME MONTE — 2026-08-31
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * L'onde triangulaire d'origine est devenue un **tracé d'électro**, à la demande
 * de David, image à l'appui. C'est plus juste : le Voight-Kampff mesure des
 * réponses physiologiques.
 *
 * **Mais on ne peut pas afficher six complexes détaillés sur trente-deux
 * colonnes** — il en faudrait plus de quarante segments, et le budget mesuré en
 * autorise seize. Le battement se dépouille donc à mesure que le rythme monte :
 * complexe avec son onde T au repos, pic nu au bout.
 *
 * *C'est aussi ce que fait un vrai moniteur à vitesse de défilement constante* :
 * au repos on lit la forme de l'onde, au galop on ne lit plus que la fréquence.
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

/**
 * **Le nom de l'icône animée qui porte ce rythme.**
 *
 * Les six GIF vivent dans `public/ulanzi/` et sont fabriqués par
 * `scripts/fabriquerLesIcones.py`. GM-OS les dépose sur l'appareil au premier
 * besoin ; ils y **restent** — décision de David le 2026-08-31.
 */
export function iconeDuNiveau(niveau: number): string {
    const rang = Math.max(NIVEAU_MIN, Math.min(NIVEAU_MAX, Math.round(niveau)));
    return `gmosvk${rang}`;
}

export interface CompositionDuSignal {
    text: '';
    color: string;
    center: true;
    noScroll: true;
    /** Le nom de l'icône animée, jouée par l'appareil lui-même. */
    icon: string;
}

/**
 * **Le signal ne demande plus la cadence rapide, et c'est le gain caché.**
 *
 * Le tracé statique se redessinait toutes les 500 ms pour dériver d'une colonne
 * — c'est lui qui imposait cette cadence à tout le battement. L'animation vit
 * désormais dans l'appareil : le widget n'a plus rien à republier entre deux
 * changements de niveau, et le créneau de publication revient aux cinq autres.
 *
 * *Une contrainte qu'on croyait structurelle tenait à un seul widget.*
 */

/**
 * Le signal, tel qu'il part vers l'afficheur.
 *
 * **Aucun texte, et c'est délibéré.** « VK » sur trente-deux pixels dirait aux
 * joueurs ce qu'ils regardent, et le § 4 veut exactement l'inverse : *ils voient
 * le rythme monter et ne savent pas pourquoi.* Le tracé seul est une machine qui
 * mesure quelque chose ; nommé, il devient un score.
 *
 * **La charge ne dépend plus du temps.** C'est ce qui fait que le battement ne
 * republie rien tant que le niveau ne bouge pas : il compare les charges, et
 * celle-ci est identique d'un tour à l'autre.
 */
export function composerVoightKampff(etat: EtatDuSignal): CompositionDuSignal {
    return {
        text: '',
        color: couleurDuNiveau(etat.niveau),
        center: true,
        noScroll: true,
        icon: iconeDuNiveau(etat.niveau),
    };
}
