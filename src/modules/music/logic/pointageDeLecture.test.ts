import { describe, it, expect } from 'vitest';
import { secondesAuPointeur, pasDuClavier } from './pointageDeLecture';

/**
 * **Se placer dans un morceau depuis la barre de la platine.**
 *
 * Demandé par David le 2026-08-30 : *« positionner l'avancée d'un morceau en
 * bougeant le slider du deck A ou B afin de commencer à mon moment précis »*.
 *
 * Ce que ces tests gardent, ce n'est pas le geste — c'est ce qui arrive **aux
 * bords**. `audioElement.currentTime = NaN` lève une exception ; `= -3` est
 * ignoré **en silence**, ce qui donnerait un curseur qui bouge et une lecture
 * qui ne bouge pas. Les deux se produisent avec un cadre de largeur nulle ou un
 * pointeur sorti de la barre, et aucun des deux n'est visible à la relecture.
 */

const cadre = { left: 100, width: 200 };

describe('l’instant visé par le pointeur', () => {
    it('tombe au bon endroit au milieu', () => {
        expect(secondesAuPointeur(200, cadre, 60)).toBe(30);
    });

    it('rend zéro au bord gauche et la durée au bord droit', () => {
        expect(secondesAuPointeur(100, cadre, 60)).toBe(0);
        expect(secondesAuPointeur(300, cadre, 60)).toBe(60);
    });

    /** Un clic peut sortir du cadre : glissement rapide, capture de pointeur. */
    it('borne au lieu de produire un instant négatif', () => {
        expect(secondesAuPointeur(-500, cadre, 60)).toBe(0);
    });

    it('borne au lieu de dépasser la fin de la piste', () => {
        expect(secondesAuPointeur(9999, cadre, 60)).toBe(60);
    });

    /** *La platine vient d'apparaître : le cadre n'a pas encore de largeur.* */
    it('rend zéro plutôt qu’un NaN quand rien n’est mesurable', () => {
        expect(secondesAuPointeur(200, { left: 0, width: 0 }, 60)).toBe(0);
        expect(secondesAuPointeur(200, cadre, 0)).toBe(0);
        expect(secondesAuPointeur(200, cadre, Number.NaN)).toBe(0);
        expect(secondesAuPointeur(Number.NaN, cadre, 60)).toBe(0);
    });

    /** Une piste dont la durée est inconnue est un flux : rien à viser. */
    it('rend zéro sur une durée infinie', () => {
        expect(secondesAuPointeur(200, cadre, Number.POSITIVE_INFINITY)).toBe(0);
    });

    it('ne rend jamais NaN, quelles que soient les entrées', () => {
        const entrees = [-1e9, 0, 150, 1e9, Number.NaN];
        for (const x of entrees) {
            for (const d of [0, 60, Number.NaN, Number.POSITIVE_INFINITY]) {
                expect(Number.isNaN(secondesAuPointeur(x, cadre, d)), `x=${x} d=${d}`).toBe(false);
            }
        }
    });
});

describe('le pas du clavier', () => {
    /** *« à mon moment précis »* : cinq secondes ne tombent pas sur une mesure. */
    it('descend à la seconde avec Shift', () => {
        expect(pasDuClavier(false)).toBe(5);
        expect(pasDuClavier(true)).toBe(1);
    });
});
