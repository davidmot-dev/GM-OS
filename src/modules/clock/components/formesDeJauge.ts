/**
 * **Les quatre formes d'une jauge de tension — la géométrie, et rien d'autre.**
 *
 * Demandé par David le 2026-08-30 : *« pouvoir choisir entre 3-4 types de
 * représentations »*. Il n'en existait qu'une, l'anneau segmenté à la *Blades
 * in the Dark*, dessiné à trois échelles (100 px chez le meneur, 75 px sur le
 * hub, 48 px sur la tablette).
 *
 * Le calcul vit ici, séparé du rendu, parce que **c'est exactement ce qui casse
 * sans rien dire** : une division par le nombre de segments, un rayon qui sort
 * du repère, un arc dont le drapeau `large-arc` bascule au mauvais moment. Rien
 * de tout cela ne lève d'erreur — on obtient un dessin faux, et un dessin faux
 * en séance ne se rattrape pas plus qu'un jet faux.
 *
 * Toutes les coordonnées sont dans **un repère de 100 unités**, celui du
 * `viewBox`. Elles ne dépendent donc ni de la taille demandée ni de la racine
 * de la page — le piège des 85 % qui a coupé l'anneau du minuteur ne peut pas
 * se reproduire ici.
 */

export type FormeDeJauge = 'anneau' | 'barre' | 'points' | 'aiguille';

export const FORMES_DE_JAUGE: readonly FormeDeJauge[] = ['anneau', 'barre', 'points', 'aiguille'];

/**
 * L'anneau reste le défaut, et c'est la migration : les jauges créées avant ce
 * jour n'ont pas de forme, et doivent continuer à s'afficher exactement comme
 * hier. *Un choix ajouté ne redessine pas ce qui existait.*
 */
export const FORME_PAR_DEFAUT: FormeDeJauge = 'anneau';

/** Le côté du repère du `viewBox`. Toutes les formes tiennent dedans. */
export const REPERE = 100;

const CENTRE = REPERE / 2;

/** Borne une fraction à `[0, 1]`, et rend `0` de ce qui n'est pas un nombre. */
export function fractionRemplie(remplis: number, total: number): number {
    if (!Number.isFinite(remplis) || !Number.isFinite(total) || total <= 0) return 0;
    return Math.min(1, Math.max(0, remplis / total));
}

export interface Point {
    x: number;
    y: number;
}

/**
 * Le point d'un cercle à un angle donné, en radians.
 *
 * L'axe des `y` d'un SVG descend : `π` est donc à gauche, `1,5π` en haut et
 * `2π` à droite. Parcourir de `π` à `2π` trace la moitié **supérieure**, de
 * gauche à droite — c'est le sens du cadran à aiguille.
 */
export function pointSurLeCercle(rayon: number, angle: number, centre: Point = { x: CENTRE, y: CENTRE }): Point {
    return {
        x: centre.x + rayon * Math.cos(angle),
        y: centre.y + rayon * Math.sin(angle),
    };
}

/* ────────────────────────────── L'anneau ────────────────────────────── */

export const RAYON_DE_L_ANNEAU = 45;

/**
 * Les tracés des segments de l'anneau, un par segment, dans le sens horaire
 * depuis midi.
 *
 * `ecart` est l'espace laissé entre deux segments, en radians. Il est retranché
 * de chaque arc : au-delà de deux segments il ne peut pas les faire disparaître,
 * mais **à un seul segment il retirerait un tour complet**, et l'anneau
 * s'inverserait. D'où le cas particulier.
 */
export function arcsDeLAnneau(total: number, ecart = 0.05): string[] {
    if (!Number.isFinite(total) || total < 1) return [];

    const angleParSegment = (2 * Math.PI) / total;
    const jeu = total === 1 ? 0 : ecart;

    return Array.from({ length: total }, (_, i) => {
        const debut = i * angleParSegment + jeu / 2 - Math.PI / 2;
        const fin = (i + 1) * angleParSegment - jeu / 2 - Math.PI / 2;

        const a = pointSurLeCercle(RAYON_DE_L_ANNEAU, debut);
        const b = pointSurLeCercle(RAYON_DE_L_ANNEAU, fin);

        // Un arc de plus d'un demi-tour doit le dire, sinon le tracé prend le
        // chemin court et le segment se dessine à l'envers.
        const grandArc = fin - debut > Math.PI ? 1 : 0;

        return `M ${a.x} ${a.y} A ${RAYON_DE_L_ANNEAU} ${RAYON_DE_L_ANNEAU} 0 ${grandArc} 1 ${b.x} ${b.y}`;
    });
}

/* ────────────────────────────── La barre ────────────────────────────── */

export interface CaseDeLaBarre {
    x: number;
    y: number;
    largeur: number;
    hauteur: number;
    rx: number;
}

const MARGE = 6;
const LARGEUR_UTILE = REPERE - MARGE * 2;

/**
 * Les cases d'une barre segmentée, de gauche à droite.
 *
 * L'écart se resserre quand les segments se multiplient : à douze segments,
 * garder trois unités d'écart laisserait des cases plus étroites que leur
 * propre espacement, et l'œil ne lirait plus une barre mais des miettes.
 */
export function casesDeLaBarre(total: number): CaseDeLaBarre[] {
    if (!Number.isFinite(total) || total < 1) return [];

    const ecart = total <= 8 ? 3 : 2;
    const largeur = (LARGEUR_UTILE - ecart * (total - 1)) / total;
    const hauteur = 26;

    return Array.from({ length: total }, (_, i) => ({
        x: MARGE + i * (largeur + ecart),
        y: 46,
        largeur,
        hauteur,
        // Un rayon plus grand que la demi-largeur transformerait les cases
        // étroites en pastilles, et la barre cesserait d'être une barre.
        rx: Math.min(3, largeur / 2),
    }));
}

/* ────────────────────────────── Les points ───────────────────────────── */

export interface PastilleDeJauge {
    cx: number;
    cy: number;
    r: number;
}

/**
 * Les pastilles, en une rangée jusqu'à six, en deux rangées équilibrées au-delà.
 *
 * *Six d'un coup se comptent d'un regard ; douze en ligne se comptent un par
 * un.* Deux rangées gardent aussi les pastilles assez grosses pour survivre aux
 * 48 px de la tablette, qui est la raison d'être de cette forme.
 */
export function pastillesDeLaJauge(total: number): PastilleDeJauge[] {
    if (!Number.isFinite(total) || total < 1) return [];

    const parRangee = total <= 6 ? total : Math.ceil(total / 2);
    const rangees = Math.ceil(total / parRangee);

    const pas = LARGEUR_UTILE / parRangee;
    const r = Math.min(9, pas * 0.36);

    const ecartVertical = 6;
    const hauteurDeRangee = 2 * r + ecartVertical;
    const cyPremiere = 56 - ((rangees - 1) * hauteurDeRangee) / 2;

    return Array.from({ length: total }, (_, i) => {
        const rangee = Math.floor(i / parRangee);
        const rang = i % parRangee;
        // La dernière rangée peut être incomplète : elle se centre sur
        // elle-même, sinon elle pendrait à gauche.
        const dansCetteRangee = Math.min(parRangee, total - rangee * parRangee);

        return {
            cx: CENTRE + (rang - (dansCetteRangee - 1) / 2) * pas,
            cy: cyPremiere + rangee * hauteurDeRangee,
            r,
        };
    });
}

/* ───────────────────────────── L'aiguille ───────────────────────────── */

const CENTRE_DU_CADRAN: Point = { x: CENTRE, y: 70 };
const RAYON_DU_CADRAN = 38;

/** Le tracé d'un arc du cadran, de `debut` à `fin` exprimés en fractions. */
export function arcDuCadran(debut: number, fin: number): string {
    const depart = Math.min(1, Math.max(0, debut));
    const arrivee = Math.min(1, Math.max(0, fin));
    if (arrivee <= depart) return '';

    const a = pointSurLeCercle(RAYON_DU_CADRAN, Math.PI * (1 + depart), CENTRE_DU_CADRAN);
    const b = pointSurLeCercle(RAYON_DU_CADRAN, Math.PI * (1 + arrivee), CENTRE_DU_CADRAN);
    const grandArc = arrivee - depart > 0.5 ? 1 : 0;

    return `M ${a.x} ${a.y} A ${RAYON_DU_CADRAN} ${RAYON_DU_CADRAN} 0 ${grandArc} 1 ${b.x} ${b.y}`;
}

export interface TraitDuCadran {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

/**
 * Les traits qui marquent les segments sur le pourtour du cadran.
 *
 * *Les segments restent le modèle en dessous* : l'aiguille dit une pression,
 * mais le meneur compte toujours en coups encaissés, et il doit pouvoir les
 * lire. Il y en a `total + 1`, les deux extrémités comprises.
 */
export function traitsDuCadran(total: number): TraitDuCadran[] {
    if (!Number.isFinite(total) || total < 1) return [];

    return Array.from({ length: total + 1 }, (_, i) => {
        const angle = Math.PI * (1 + i / total);
        const dedans = pointSurLeCercle(43, angle, CENTRE_DU_CADRAN);
        const dehors = pointSurLeCercle(47, angle, CENTRE_DU_CADRAN);
        return { x1: dedans.x, y1: dedans.y, x2: dehors.x, y2: dehors.y };
    });
}

export interface Aiguille {
    pivot: Point;
    pointe: Point;
}

/** L'aiguille, du pivot vers la fraction visée. */
export function aiguilleDuCadran(fraction: number): Aiguille {
    const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
    return {
        pivot: CENTRE_DU_CADRAN,
        pointe: pointSurLeCercle(32, Math.PI * (1 + f), CENTRE_DU_CADRAN),
    };
}

/* ──────────────────────── Le cadre de chaque forme ──────────────────────── */

/** La ligne du compte, pour les formes plates. Le cadre s'y appuie. */
export const Y_DU_COMPTE_PLAT = 18;
/** La ligne du compte, sous le cadran à aiguille. */
export const Y_DU_COMPTE_CADRAN = 90;

const HAUT_DU_COMPTE = Y_DU_COMPTE_PLAT - 10;
const MARGE_BASSE = 4;

export interface BoiteDeLaForme {
    x: number;
    y: number;
    largeur: number;
    hauteur: number;
}

/**
 * **Le cadre serré autour d'une forme** — il devient le `viewBox`, et son
 * rapport décide de la hauteur rendue.
 *
 * Les quatre formes vivaient dans le même carré de 100, celui de l'anneau. Une
 * barre n'y occupe qu'un quart de la hauteur : sur le Player Hub, où la jauge
 * est demandée à 75 px puis réduite à 65 %, il en restait une vingtaine de
 * pixels perdus au milieu d'un carré vide. *Un carré n'est la bonne boîte que
 * pour ce qui est rond.*
 *
 * Le cadre est **calculé sur la géométrie**, pas écrit à la main : il suit donc
 * le nombre de segments — deux rangées de pastilles sont plus hautes qu'une.
 */
export function boiteDeLaForme(forme: FormeDeJauge, total: number): BoiteDeLaForme {
    const carre: BoiteDeLaForme = { x: 0, y: 0, largeur: REPERE, hauteur: REPERE };

    const platJusquA = (bas: number): BoiteDeLaForme => ({
        x: 0,
        y: HAUT_DU_COMPTE,
        largeur: REPERE,
        hauteur: bas + MARGE_BASSE - HAUT_DU_COMPTE,
    });

    switch (forme) {
        case 'barre': {
            const cases = casesDeLaBarre(total);
            if (cases.length === 0) return carre;
            return platJusquA(Math.max(...cases.map(c => c.y + c.hauteur)));
        }

        case 'points': {
            const pastilles = pastillesDeLaJauge(total);
            if (pastilles.length === 0) return carre;
            return platJusquA(Math.max(...pastilles.map(p => p.cy + p.r)));
        }

        // Le demi-cadran ne descend pas sous son pivot ; seul le compte le suit.
        case 'aiguille':
            return { x: 0, y: 20, largeur: REPERE, hauteur: REPERE - 20 };

        case 'anneau':
        default:
            return carre;
    }
}
