import { HAUTEUR, LARGEUR, type RectanglePlein } from './defileDesQuarts';
import { graviteDeLaJauge } from '../../clock/logic/sensDeLaJauge';

/**
 * **Le compte à rebours — le premier widget GÉNÉRIQUE de l'afficheur.**
 *
 * Étape B du § 14, construite le 2026-08-30. C'est aussi **le premier miroir**
 * au sens du § 4 : jusqu'ici l'afficheur ne reflétait rien, il ne montrait que
 * ce que le meneur poussait à la main. *À partir d'ici, s'il ment, c'est un
 * bug.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IL PARLE LA MÊME GRAMMAIRE QUE LE DÉFILÉ, ET C'EST DÉLIBÉRÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un mot en haut, une barre de segments en bas. La table a déjà appris à lire
 * cette composition en une séance ; lui en imposer une seconde aurait coûté un
 * apprentissage pour rien. *Un objet ambiant ne se regarde pas, il se
 * reconnaît.*
 *
 * ⚠️ **Le nom est tronqué, et c'est une perte réelle.** 32 pixels tiennent sept
 * caractères ; « Alerte Gardes » en fait treize. On ne fait pas défiler — *un
 * texte qui défile n'est pas consultable d'un coup d'œil* (§ 1) — donc on coupe.
 * Deux horloges dont les sept premières lettres se ressemblent seront
 * indistinguables sur l'objet : c'est au meneur de les nommer court.
 *
 * Ce fichier ne connaît ni le réseau, ni l'appareil, ni React.
 */

/** Ce que 32 pixels tiennent en gras, sans défilement. Mesuré sur « JOURNEE ». */
export const CARACTERES_TENUS = 7;

export const COULEURS_DU_COMPTE = {
    /** Un segment rempli, quand l'horloge n'a pas de couleur propre. */
    plein: '#FF8C1A',
    /** Un segment encore vide. Présent, mais éteint. */
    vide: '#141414',
    /**
     * **À mi-course : l'échéance approche.** Ajouté le 2026-09-15 avec le code
     * couleur.
     *
     * ⚠️ **C'est volontairement le même pigment que `plein`**, et il faut le
     * dire : sur 32 pixels, l'orange EST déjà la couleur de repos d'une horloge
     * sans couleur choisie. Le cran de tension ne se voit donc que sur les
     * horloges à qui le meneur a donné une couleur — elles quittent la leur pour
     * l'orange. Pour les autres, l'échelle reste à deux crans.
     *
     * *Inventer un troisième pigment aurait été pire :* à deux pixels de hauteur
     * et à travers une table, un jaune et un orange ne se distinguent pas, et
     * une jauge qui prétend dire trois choses en dit zéro. Le remède pour qui
     * veut les trois crans est de **choisir une couleur pour sa jauge**, ce qui
     * est précisément à quoi ce réglage sert.
     */
    tension: '#FF8C1A',
    /** L'horloge est au bout : ce qu'elle annonçait arrive. */
    pleine: '#FF1744',
} as const;

/**
 * Le nom tel qu'il part vers la matrice.
 *
 * **Sans accents, et ce n'est pas un détail** : l'appareil force les majuscules
 * et rien ne garantit que sa fonte porte un « É ». Un caractère absent se
 * dessine en case vide — et on ne le verrait qu'à la table. C'est la leçon déjà
 * payée sur « JOURNEE » et « SOIREE ».
 */
export function nomPourLaMatrice(nom: string, maximum = CARACTERES_TENUS): string {
    return nom
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
        .slice(0, maximum)
        .trim()
        .toUpperCase();
}

/**
 * **La barre de segments, qui s'adapte au nombre de segments.**
 *
 * Le défilé en avait six, gravés dans son dessin. Une horloge de tension en a
 * quatre, six, huit ou douze : la barre doit donc se calculer. On garde un pixel
 * d'interstice pour que deux segments voisins restent deux — sans lui, une barre
 * pleine devient un trait, et on ne compte plus rien.
 *
 * **Au-delà de ce que la largeur permet de distinguer, on cesse de compter et
 * l'on remplit proportionnellement.** *Une barre dont on ne peut pas compter les
 * cases ment sur ce qu'elle est* : mieux vaut une jauge continue, honnêtement
 * approximative, que seize traits d'un pixel qu'on croit pouvoir dénombrer.
 */
export function barreDeSegments(
    remplis: number,
    total: number,
    couleurPleine: string,
    hauteur = 2,
): RectanglePlein[] {
    const y = HAUTEUR - hauteur;
    if (total <= 0) return [];

    const pas = Math.floor(LARGEUR / total);

    // Moins de deux pixels par segment : on ne peut plus séparer les cases.
    if (pas < 2) {
        const largeurPleine = Math.round((LARGEUR * Math.min(remplis, total)) / total);
        const barres: RectanglePlein[] = [{ df: [0, y, LARGEUR, hauteur, COULEURS_DU_COMPTE.vide] }];
        if (largeurPleine > 0) barres.push({ df: [0, y, largeurPleine, hauteur, couleurPleine] });
        return barres;
    }

    const largeur = Math.max(1, pas - 1);
    return Array.from({ length: total }, (_, n) => ({
        df: [n * pas, y, largeur, hauteur, n < remplis ? couleurPleine : COULEURS_DU_COMPTE.vide],
    } as RectanglePlein));
}

/** Ce qu'une horloge doit montrer. Volontairement plus étroit que `TensionClock`. */
export interface CompteAAfficher {
    nom: string;
    remplis: number;
    total: number;
    /** La couleur de l'horloge, si elle en porte une. */
    couleur?: string;
    /**
     * **Cette jauge se vide-t-elle ?** — un consommable, pas une tension.
     *
     * ⛔ Sans ce drapeau, cette composition avait **sa propre** comparaison
     * `remplis >= total`, écrite à la main comme celle de `NarrativeClock` : des
     * rations à zéro seraient restées de leur couleur ordinaire au milieu de la
     * table pendant que l'écran du meneur criait. *Cinquième lecteur d'une même
     * règle, et le seul que personne n'aurait regardé.*
     *
     * Absent = elle monte, comme avant ce champ.
     */
    seVide?: boolean;
}

export interface CompositionDuCompte {
    text: string;
    color: string;
    center: true;
    noScroll: true;
    draw: RectanglePlein[];
}

/**
 * L'horloge, traduite en ce que l'afficheur doit montrer.
 *
 * **Pleine, elle passe au rouge** — quelle que soit sa couleur propre. C'est la
 * seule chose que la table doit voir de l'autre bout de la pièce : *ce qui était
 * annoncé arrive.* La couleur choisie sert à distinguer les horloges entre
 * elles, pas à masquer l'échéance.
 */
export function composerCompteARebours(compte: CompteAAfficher): CompositionDuCompte {
    const total = Math.max(0, Math.round(compte.total));
    const remplis = Math.max(0, Math.min(total, Math.round(compte.remplis)));
    /*
      **Au bout de sa course, elle passe au rouge** — et le bout n'est pas le
      même dans les deux sens : le plein pour une tension, le VIDE pour un
      consommable. La règle est chez `estCritique`, une seule fois pour les cinq
      lecteurs ; elle était écrite à la main ici, et c'est ce qui l'aurait fait
      manquer le 2026-09-15.
    */
    const gravite = graviteDeLaJauge({
        totalSegments: total,
        filledSegments: remplis,
        sens: compte.seVide ? 'epuisement' : 'remplissage',
    });

    /*
      **La couleur choisie s'efface à mesure qu'on approche du bout** — elle
      distingue les horloges entre elles, elle ne masque pas l'échéance. C'est la
      règle qui valait déjà pour le rouge du bout ; le 2026-09-15 elle s'étend
      d'un cran, avec le code couleur demandé par David.

      ⚠️ **Le rouge arrive désormais au dernier QUART, plus seulement au bout.**
      C'est le vrai gain sur les 32 pixels : la table voit venir, au lieu de
      constater.
    */
    const couleur = gravite === 'calme'
        ? (compte.couleur || COULEURS_DU_COMPTE.plein)
        : gravite === 'tension'
            ? COULEURS_DU_COMPTE.tension
            : COULEURS_DU_COMPTE.pleine;

    return {
        text: nomPourLaMatrice(compte.nom),
        color: couleur,
        center: true,
        noScroll: true,
        draw: barreDeSegments(remplis, total, couleur),
    };
}
