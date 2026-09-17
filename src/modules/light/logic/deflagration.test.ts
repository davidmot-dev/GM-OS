import { describe, it, expect } from 'vitest';
import {
    dureeDeLaDeflagration,
    EXTINCTION_DS,
    imageDeDeflagration,
    IMAGES_DE_DEFLAGRATION,
} from './deflagration';

/**
 * **Ce que ces essais protègent : les deux reproches de David, nommés.**
 *
 * ⛔ Le 2026-09-17 : *« explosion ne dure pas assez longtemps et à la fin cela
 * doit devenir noir »*. L'ancienne version durait **1,54 s** et rendait à la
 * lampe l'état qu'elle avait avant — donc la lumière revenait.
 *
 * ⚠️ *Aucun essai ne pouvait le voir*, et c'est le point : la durée n'était
 * écrite nulle part. Elle était la somme de quatre `interval` posés dans quatre
 * branches d'un `if`. **Une valeur qui n'existe que comme somme de morceaux ne
 * peut pas être vérifiée** — ni relue.
 */

/** La luminance relative d'un `#rrggbb`, pour dire qui est « plus clair ». */
const clarte = (hex: string): number => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, v = (n >> 8) & 255, b = n & 255;
    return 0.2126 * r + 0.7152 * v + 0.0722 * b;
};

describe('la retombée d’une explosion', () => {
    /** Le reproche n° 1, chiffré. L'ancienne durait 1,54 s. */
    it('dure assez longtemps pour qu’on la regarde', () => {
        const secondes = dureeDeLaDeflagration() / 1000;
        expect(secondes).toBeGreaterThan(5);
        expect(secondes).toBeLessThan(12);
    });

    /** Le reproche n° 2 : la dernière image est **presque** noire… */
    it('finit sur une braise mourante, puis laisse la place à l’extinction', () => {
        const derniere = IMAGES_DE_DEFLAGRATION[IMAGES_DE_DEFLAGRATION.length - 1];
        expect(derniere.bri).toBeLessThan(20);
        /* …et le vrai noir est la commande d'arrêt, pas une image. */
        expect(imageDeDeflagration(IMAGES_DE_DEFLAGRATION.length)).toBeNull();
        expect(EXTINCTION_DS).toBeGreaterThan(0);
    });

    /**
     * ⭐ **La leçon des trois feux, appliquée ici.** Brillance et couleur
     * descendent **ensemble**. Les laisser varier chacune de son côté redonnerait
     * du bruit orange — c'est exactement ce qui rendait feu de camp et incendie
     * indiscernables la veille.
     */
    it('fait descendre la brillance et la clarté de la couleur ensemble', () => {
        IMAGES_DE_DEFLAGRATION.forEach((image, i) => {
            if (i === 0) return;
            const avant = IMAGES_DE_DEFLAGRATION[i - 1];
            expect(image.bri).toBeLessThan(avant.bri);
            expect(clarte(image.hex)).toBeLessThan(clarte(avant.hex));
        });
    });

    it('part d’un blanc à fond', () => {
        expect(IMAGES_DE_DEFLAGRATION[0].bri).toBe(254);
        expect(IMAGES_DE_DEFLAGRATION[0].transitiontime).toBe(0);
    });

    /**
     * ⭐ La règle du module : un fondu plus long que le battement qui le suit
     * **n'est jamais vu**. La commande suivante arrive avant sa fin, et la lampe
     * se contente de suivre.
     */
    it('ne fond jamais plus longtemps qu’elle n’attend', () => {
        IMAGES_DE_DEFLAGRATION.forEach(image => {
            expect(image.transitiontime * 100).toBeLessThanOrEqual(image.interval);
        });
    });

    /** Le fondu s'allonge à mesure que ça retombe : *une explosion s'éteint de plus en plus lentement.* */
    it('ralentit en retombant', () => {
        IMAGES_DE_DEFLAGRATION.forEach((image, i) => {
            if (i === 0) return;
            expect(image.interval).toBeGreaterThan(IMAGES_DE_DEFLAGRATION[i - 1].interval);
        });
    });

    /** Toutes les brillances restent dans la plage du matériel (1–254). */
    it('reste dans ce qu’une ampoule sait faire', () => {
        IMAGES_DE_DEFLAGRATION.forEach(image => {
            expect(image.bri).toBeGreaterThanOrEqual(1);
            expect(image.bri).toBeLessThanOrEqual(254);
            expect(image.hex).toMatch(/^#[0-9a-f]{6}$/);
        });
    });

    /**
     * ⚠️ **Le budget du pont : dix commandes par seconde, toutes lampes
     * confondues.** Le flash coûte cher un court instant — c'est assumé et
     * mesuré, pas ignoré.
     */
    it('coûte peu en moyenne, même si le flash coûte cher un instant', () => {
        const total = IMAGES_DE_DEFLAGRATION.reduce((s, i) => s + i.interval, 0);
        const moyenne = (IMAGES_DE_DEFLAGRATION.length * 1000) / total;
        expect(moyenne).toBeLessThan(1.5);

        const pointe = 1000 / Math.min(...IMAGES_DE_DEFLAGRATION.map(i => i.interval));
        expect(pointe).toBeLessThanOrEqual(5);
    });
});
