/**
 * **L'échelle de chaleur d'un incendie — une seule variable pour la brillance
 * ET la couleur.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT QUI A MENÉ ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le 2026-09-17, David à l'écran : *« j'ai l'impression que feu de camp et
 * incendie sont pareil »*. Ils l'étaient. Les deux effets tiraient leur
 * brillance et leur couleur **indépendamment, au hasard**, autour d'un orange
 * — l'un avec une amplitude de ±70, l'autre de ±90.
 *
 * ⭐ **Deux bruits aléatoires autour d'une même teinte donnent le même résultat
 * visuel, quelles que soient leurs amplitudes.** La faute n'était pas dans les
 * réglages, elle était dans le mécanisme : *on réglait des curseurs là où il
 * fallait changer de principe.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ LE PRINCIPE : CE QUI EST CHAUD EST BRILLANT **ET** BLANC
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Dans une flamme réelle, la brillance et la couleur ne sont pas deux variables
 * : c'en est **une seule**, la température. Le cœur est éclatant et blanc-jaune ;
 * la fumée qui retombe est sombre et rouge sang. Les faire tirer ensemble
 * produit du feu ; les faire tirer séparément produit du bruit orange.
 *
 * C'est aussi ce qui sépare définitivement l'incendie du foyer : **un feu de
 * camp ne parcourt jamais cette échelle.** Il tient sa bande ambre, entre 75 et
 * 175 de brillance, et ne monte jamais au blanc.
 */

/**
 * Les sept teintes, **du plus froid au plus chaud**.
 *
 * ⚠️ **L'ordre EST le mécanisme.** Mélanger cette table casserait la corrélation
 * sans rien casser d'autre — aucune erreur, aucun test rouge ailleurs, juste du
 * bruit orange qui ressemble à un feu de camp. D'où l'essai qui vérifie que la
 * table monte vraiment.
 */
export const ECHELLE_DU_FEU = [
    '#6b0d00', // braise mourante
    '#a81800',
    '#e02a00',
    '#ff5400',
    '#ff8c1a',
    '#ffc25c',
    '#fff0b0', // cœur blanc-jaune
] as const;

/** La brillance d'une braise mourante, et celle d'un cœur de flamme. */
export const BRI_FROID = 120;
export const BRI_CHAUD = 254;

/**
 * La bande de brillance d'un **feu de camp**, pour mémoire et pour les essais.
 *
 * Elle est là pour qu'un essai puisse exiger que les deux effets n'occupent pas
 * la même plage — *c'est la seule chose qui garantisse qu'on les distingue.*
 */
export const BANDE_DU_FOYER = { bas: 75, haut: 175 } as const;

/**
 * La bande d'une **bougie**, et la brillance de sa bourrasque.
 *
 * ⛔ **Elle manquait, et ça se voyait.** Le 2026-09-17 les trois feux ont reçu
 * chacun leur geste, mais seuls le foyer et l'incendie ont reçu leur bande : la
 * bougie continuait de partir de `baseBri`, **la brillance courante de la
 * lampe**. Sur une lampe à 254, elle donnait une bougie de 254 — *une bougie
 * qui éclaire la pièce n'est pas une bougie.*
 *
 * ⚠️ Et l'essai des trois feux ne l'a pas vu, parce qu'il **n'en comparait que
 * deux**. *Un essai qui couvre deux cas sur trois ressemble à un essai qui
 * couvre le sujet* — le troisième était justement le cassé.
 */
export const BANDE_DE_LA_BOUGIE = { bas: 20, haut: 70 } as const;

/** Ce qu'il reste d'une bougie quand le courant d'air passe. */
export const BOURRASQUE = 8;

export interface EtatDuFeu {
    bri: number;
    hex: string;
}

/**
 * Ce qu'une chaleur donne à voir.
 *
 * @param chaleur 0 = braise mourante, 1 = cœur blanc. Borné.
 */
export const etatDuFeu = (chaleur: number): EtatDuFeu => {
    const c = Number.isFinite(chaleur) ? Math.min(1, Math.max(0, chaleur)) : 0;
    const rang = Math.min(ECHELLE_DU_FEU.length - 1, Math.floor(c * ECHELLE_DU_FEU.length));
    return {
        bri: Math.round(BRI_FROID + c * (BRI_CHAUD - BRI_FROID)),
        hex: ECHELLE_DU_FEU[rang],
    };
};

/**
 * Le tirage d'une chaleur, **biaisé vers le haut**.
 *
 * *Un incendie rage, il n'hésite pas* : la moyenne se situe autour de 0,64, donc
 * une brillance moyenne d'environ 206. Il descend quand même dans le sombre une
 * fois sur cinq — c'est la fumée qui passe devant, et elle fait partie de ce
 * qu'on reconnaît.
 */
export const tirerLaChaleur = (hasard: () => number = Math.random): number =>
    Math.pow(hasard(), 0.55);
