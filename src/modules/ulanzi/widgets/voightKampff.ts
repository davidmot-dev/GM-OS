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

/*
 ──────────────────────────────────────────────────────────────────────────────
 LA GÉOMÉTRIE D'UN ÉLECTRO SUR SIX RANGÉES UTILES
 ──────────────────────────────────────────────────────────────────────────────

 *Demandé par David le 2026-08-31, image à l'appui : « est-ce qu'on pourrait
 avoir quelque chose qui ressemble à cela ? »* — un tracé d'électrocardiogramme
 au néon, ligne plate ponctuée de complexes.

 **C'est plus juste que l'onde triangulaire qu'il remplace** : le Voight-Kampff
 mesure des réponses physiologiques, et une ligne d'électro le dit mieux qu'un
 zigzag régulier.

 Deux choses de l'image sont hors de portée et ne seront pas approchées : la
 **lueur** (un pixel est allumé ou éteint, il n'y a pas d'anti-crénelage sur
 32 × 8) et les **courbes fines**. Ce qui passe, c'est la silhouette.
*/

/**
 * **La ligne de repos est basse, pas au milieu.**
 *
 * Un électro déflèche beaucoup plus vers le haut que vers le bas. Centrer la
 * ligne gaspillerait la moitié des huit rangées pour un creux qui n'en demande
 * que deux — *à cette taille, chaque rangée compte double.*
 */
const LIGNE = 5;
/** Le creux des ondes Q et S, sous la ligne. */
const CREUX = HAUTEUR - 1;
/** La crête du pic R, tout en haut de la matrice. */
const CRETE = 0;
/** La bosse arrondie qui suit le pic — l'onde T. */
const BOSSE = 3;

/** Un segment, au format que comprend AWTRIX : `[x0, y0, x1, y1, couleur]`. */
export interface LigneTracee {
    dl: [number, number, number, number, string];
}

/**
 * **Le budget, en nombre de segments — et c'est LUI qui dessine.**
 *
 * ⚠️ Mesuré sur l'appareil de David le 2026-08-31, et non choisi : douze
 * segments `dl` coûtent **401 ms et ne ratent jamais** (20 envois) ; trente-deux
 * commandes coûtent **802 ms et échouent deux fois sur vingt**. *Un dessin trop
 * lourd ne se voit pas dans le code, il se voit sur le fil* — et il lâcherait en
 * séance sans qu'on sache pourquoi.
 *
 * Seize est le plafond retenu : un tiers du chemin entre le chiffre éprouvé sans
 * risque et celui qui a échoué. *On ne s'installe pas sur une valeur qu'on n'a
 * pas mesurée, mais on ne se prive pas non plus de toute la marge.*
 */
export const BUDGET_DE_SEGMENTS = 16;

/**
 * **La ligne plate ne coûte qu'UN segment pour toute la largeur.**
 *
 * C'est elle qui rend l'électro payable, là où l'onde triangulaire ne pouvait
 * rien économiser : chacun de ses flancs était un segment.
 *
 * **Elle n'est pas interrompue sous les complexes**, et c'est un choix : la
 * couper entre chaque battement coûterait un segment par intervalle — sept au
 * niveau six — et le budget est tout le sujet. À six rangées utiles, un pic
 * franc qui traverse une horizontale se lit très bien comme un électro.
 */
const ligneDeRepos = (couleur: string): LigneTracee =>
    ({ dl: [0, LIGNE, LARGEUR - 1, LIGNE, couleur] });

/**
 * **Les quatre formes d'un battement, de la plus riche à la plus dépouillée.**
 *
 * Chacune déclare ce qu'elle coûte en segments et ce qu'elle occupe en colonnes.
 * *Une forme qui ne dit pas son prix ne peut pas être choisie par un budget.*
 */
interface FormeDuBattement {
    nom: 'qrs-et-t' | 'qrs' | 'pic';
    cout: number;
    colonnes: number;
    tracer: (x: number, couleur: string) => LigneTracee[];
}

/*
  **L'onde P a été retirée après un premier rendu, et c'est la mesure qui a
  tranché deux fois.**

  Elle coûtait deux segments — un huitième du budget — pour une bosse d'un seul
  pixel avant le pic. À six rangées utiles, elle ne se distingue pas du bruit :
  *un détail qu'on ne peut pas voir n'est pas un détail, c'est une dépense.* Le
  battement le plus riche est donc QRS + T.
*/

/** Le pic franc et ses deux creux — le cœur du dessin, présent partout. */
const qrs = (x: number, c: string): LigneTracee[] => [
    { dl: [x, LIGNE, x + 1, CREUX, c] },
    { dl: [x + 1, CREUX, x + 2, CRETE, c] },
    { dl: [x + 2, CRETE, x + 3, CREUX, c] },
    { dl: [x + 3, CREUX, x + 4, LIGNE, c] },
];

/** Une bosse arrondie de trois colonnes — les ondes P et T. */
const bosse = (x: number, c: string): LigneTracee[] => [
    { dl: [x, LIGNE, x + 1, BOSSE, c] },
    { dl: [x + 1, BOSSE, x + 3, LIGNE, c] },
];

const FORMES: FormeDuBattement[] = [
    {
        nom: 'qrs-et-t', cout: 6, colonnes: 10,
        tracer: (x, c) => [...qrs(x, c), ...bosse(x + 6, c)],
    },
    { nom: 'qrs', cout: 4, colonnes: 5, tracer: qrs },
    {
        nom: 'pic', cout: 2, colonnes: 3,
        tracer: (x, c) => [
            { dl: [x, LIGNE, x + 1, CRETE, c] },
            { dl: [x + 1, CRETE, x + 2, LIGNE, c] },
        ],
    },
];

/**
 * **La forme la plus riche que le budget laisse passer à ce rythme-là.**
 *
 * *C'est la décision de conception, et elle est imposée par la mesure* : on ne
 * peut pas afficher six complexes détaillés sur trente-deux colonnes — il en
 * faudrait quarante-huit segments. Le détail diminue donc quand le rythme monte.
 *
 * **Et c'est aussi ce que fait un vrai moniteur** à vitesse de défilement
 * constante : au repos on lit la forme de l'onde, au galop on ne lit plus que la
 * fréquence. Au niveau un, un tracé qu'on reconnaît immédiatement ; au niveau
 * six, des pics serrés qui ne racontent plus rien d'autre que l'affolement.
 *
 * **Elle ne dépend que de l'écart entre deux battements, pas du niveau.** Le
 * niveau ne fait que décider de cet écart ; c'est lui, ensuite, qui dit combien
 * de battements tiennent à l'écran et combien de colonnes chacun peut occuper.
 * *Nommer ce dont on dépend vraiment évite de croire qu'on dépend d'autre
 * chose.*
 */
export function formeDuBattement(periode: number): FormeDuBattement {
    /*
      **Le pire cas, pas le cas nominal** — et c'est le premier rendu qui l'a
      montré : le tracé démarre *avant* le bord gauche pour que les battements
      entrent au lieu d'apparaître, donc il y en a toujours **un de plus** que le
      niveau ne le laisse croire. Le budget calculé sans lui était dépassé de
      moitié — dix-sept segments annoncés pour douze.

      *Un budget qui ne compte pas ce qui déborde ne borne rien.*
    */
    const parEcran = Math.ceil(LARGEUR / periode) + 1;
    const tenable = FORMES.find(f =>
        1 + parEcran * f.cout <= BUDGET_DE_SEGMENTS && f.colonnes <= periode);
    // La plus dépouillée reste toujours possible : deux segments, trois colonnes.
    return tenable ?? FORMES[FORMES.length - 1];
}

/**
 * **Le tracé : une ligne de repos, ponctuée de battements.**
 *
 * `phase` décale les battements. Elle est prise **modulo l'écart entre deux
 * battements** et non modulo la largeur : le motif se répète à cet intervalle-là,
 * et un décalage plus grand ferait sauter le tracé au lieu de le faire glisser.
 *
 * On part **avant** le bord gauche : sans cela, un battement apparaîtrait d'un
 * coup au bord au lieu d'y entrer. Les coordonnées hors matrice sont écrêtées
 * par l'appareil.
 */
export function traceDuSignal(niveau: number, phase = 0): LigneTracee[] {
    const battements = Math.max(NIVEAU_MIN, Math.min(NIVEAU_MAX, Math.round(niveau)));
    const couleur = couleurDuNiveau(battements);
    const periode = Math.max(3, Math.floor(LARGEUR / battements));
    const forme = formeDuBattement(periode);

    const decalage = ((phase % periode) + periode) % periode;
    const lignes: LigneTracee[] = [ligneDeRepos(couleur)];

    for (let debut = decalage - periode; debut < LARGEUR; debut += periode) {
        lignes.push(...forme.tracer(debut, couleur));
    }

    /*
      **Ce qui ne se voit pas ne s'envoie pas** — et c'est ce qui a ramené le
      tracé dans son budget.

      Le premier rendu dessinait un battement entier hors matrice : dix-sept
      segments pour un dessin qui en promettait douze. Filtrer au **segment** et
      non au battement est la règle exacte : un battement à cheval sur le bord
      garde ses segments visibles et perd les autres, là où une règle par
      battement les aurait tous gardés.
    */
    return lignes.filter(({ dl: [x0, , x1] }) =>
        Math.max(x0, x1) >= 0 && Math.min(x0, x1) < LARGEUR);
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
