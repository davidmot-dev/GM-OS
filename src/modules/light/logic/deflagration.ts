/**
 * **Une explosion — la décroissance, puis le noir.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT QUI A MENÉ ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le 2026-09-17, David après avoir essayé tout le catalogue : *« explosion ne
 * dure pas assez longtemps et à la fin cela doit devenir noir »*. Les deux
 * reproches étaient dans le code, dans cet ordre :
 *
 * | Ce qu'il a vu | Ce que faisait le code |
 * | --- | --- |
 * | trop court | quatre images, **1,54 s** en tout |
 * | ça ne devient pas noir | la fin **rendait à la lampe son état d'avant** — donc la lumière revenait |
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ CE QU'UNE EXPLOSION EST, POUR UNE AMPOULE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *Le Hue est médiocre en stroboscopie et excellent en décroissance lente.* Une
 * explosion n'est donc pas un flash : c'est **un flash et six secondes de
 * retombée**. Le flash coûte une commande, la retombée en coûte cinq, et
 * `transitiontime` fait tout le travail entre deux images.
 *
 * ⭐ **La brillance et la couleur descendent ENSEMBLE**, jamais séparément —
 * c'est la leçon des trois feux, payée la veille : *deux bruits indépendants
 * autour d'un orange donnent le même résultat visuel quelles que soient leurs
 * amplitudes.* Ici chaque image est un couple, et un essai vérifie que les deux
 * colonnes décroissent.
 *
 * ⚠️ **Ce que ça coûte au pont.** Six commandes en 5,45 s, soit 1,1 cmd/s par
 * lampe en moyenne — mais le premier battement dure 200 ms, donc **5 cmd/s le
 * temps du flash**. Sur un pont qui en tient dix toutes lampes confondues, une
 * explosion sur plus de deux lampes verra son flash étalé sur ~100 ms au lieu
 * d'être simultané. *Pour un flash, c'est supportable ; pour une rafale, ça ne
 * l'était pas* — et c'est pourquoi la fusillade, elle, a une cadence partagée.
 */

export interface ImageDeDeflagration {
    bri: number;
    hex: string;
    /** En **décisecondes** — l'unité du pont. */
    transitiontime: number;
    /** Attente avant l'image suivante, en millisecondes. */
    interval: number;
}

/**
 * Les six images de la retombée.
 *
 * *Le blanc du coup, la boule de feu, les flammes, la braise, les décombres qui
 * rougeoient, puis presque plus rien.* Après quoi la lampe s'éteint pour de bon.
 */
export const IMAGES_DE_DEFLAGRATION: readonly ImageDeDeflagration[] = [
    { bri: 254, hex: '#ffffff', transitiontime: 0, interval: 200 },
    { bri: 215, hex: '#ffb844', transitiontime: 1, interval: 450 },
    { bri: 155, hex: '#ff6a12', transitiontime: 4, interval: 750 },
    { bri: 95, hex: '#e02a00', transitiontime: 7, interval: 1050 },
    { bri: 45, hex: '#8b1a00', transitiontime: 10, interval: 1400 },
    { bri: 12, hex: '#3b0a00', transitiontime: 13, interval: 1600 },
];

/**
 * Le fondu de l'extinction finale, en décisecondes.
 *
 * ⛔ Il ne vit pas dans la table : ce n'est pas une image, c'est **la commande
 * d'arrêt**, qui porte `on: false` et voyage avec `effect: 'none'`. *Une seule
 * commande, jamais deux* — c'est la règle du module, et elle tient ici aussi.
 */
export const EXTINCTION_DS = 20;

/** La durée totale, du coup jusqu'au noir complet, en millisecondes. */
export const dureeDeLaDeflagration = (): number =>
    IMAGES_DE_DEFLAGRATION.reduce((somme, image) => somme + image.interval, 0)
    + EXTINCTION_DS * 100;

/** L'image de ce tour, ou `null` quand il ne reste plus qu'à éteindre. */
export const imageDeDeflagration = (tick: number): ImageDeDeflagration | null =>
    IMAGES_DE_DEFLAGRATION[tick] ?? null;
