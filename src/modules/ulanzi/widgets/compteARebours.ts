import { HAUTEUR, LARGEUR, type RectanglePlein } from './defileDesQuarts';

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
    /** L'horloge est pleine : ce qu'elle annonçait arrive. */
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
    const pleine = total > 0 && remplis >= total;
    const couleur = pleine
        ? COULEURS_DU_COMPTE.pleine
        : (compte.couleur || COULEURS_DU_COMPTE.plein);

    return {
        text: nomPourLaMatrice(compte.nom),
        color: couleur,
        center: true,
        noScroll: true,
        draw: barreDeSegments(remplis, total, couleur),
    };
}
