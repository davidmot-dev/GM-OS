import { describe, it, expect } from 'vitest';
import {
    composerJaugeDeTable,
    COULEUR_A_SEC,
    COULEUR_DE_LA_RESERVE,
    LARGEUR_DE_LA_MATRICE,
    nomEtValeur,
} from './jaugeDeTable';
import { CARACTERES_TENUS } from './compteARebours';

/**
 * **Les réserves de table — étape C, le 2026-08-31.**
 *
 * L'étape qui **démontre la thèse du § 12** : ajouter un jeu ne doit coûter
 * aucune ligne de code. Rien dans le fichier testé ici ne connaît Dune ; il ne
 * connaît qu'un nom, une valeur, un plancher et parfois un plafond.
 */

const IMPULSION = { id: 'impulsion', nom: 'Impulsion', valeur: 4, min: 0, max: 6 };
const MENACE = { id: 'menace', nom: 'Menace', valeur: 12, min: 0 };

const couleurs = (barres: { df: [number, number, number, number, string] }[]) =>
    barres.map(b => b.df[4]);

describe('une réserve avec plafond', () => {
    it('dessine une case par cran, comme les horloges', () => {
        const charge = composerJaugeDeTable(IMPULSION);

        expect(charge.text).toBe('IMPULSI');
        expect(charge.draw).toHaveLength(6);
        expect(couleurs(charge.draw).filter(c => c === COULEUR_DE_LA_RESERVE)).toHaveLength(4);
    });

    /**
     * **Les crans se comptent au-dessus du minimum.** Une réserve qui va de 2 à
     * 6 en a quatre, pas six — prendre `max` pour total ferait paraître pleine
     * une réserve à son plancher.
     */
    it('compte les crans au-dessus du plancher, pas depuis zéro', () => {
        const charge = composerJaugeDeTable({ id: 'x', nom: 'X', valeur: 2, min: 2, max: 6 });

        expect(charge.draw).toHaveLength(4);
        // Au plancher, aucune case n'est remplie : le rouge est porté par le
        // nom, comme sur le minuteur arrivé à zéro.
        expect(charge.color).toBe(COULEUR_A_SEC);
        expect(couleurs(charge.draw)).not.toContain(COULEUR_A_SEC);
    });

    it('ne déborde jamais de la matrice', () => {
        for (const max of [4, 6, 8, 12]) {
            for (const { df: [x, , l] } of composerJaugeDeTable({ ...IMPULSION, max }).draw) {
                expect(x + l, `max ${max}`).toBeLessThanOrEqual(LARGEUR_DE_LA_MATRICE);
            }
        }
    });
});

/**
 * **Sans plafond, il n'y a aucune proportion à dessiner.** `max` absent est une
 * différence de nature, pas un oubli : la Menace n'a pas de limite. *Inventer un
 * plafond pour avoir une jolie jauge serait un mensonge de dessin.*
 */
describe('une réserve sans plafond', () => {
    it('montre le nombre et ne dessine pas de barre', () => {
        const charge = composerJaugeDeTable(MENACE);

        expect(charge.text).toBe('MENA 12');
        expect(charge.draw).toEqual([]);
    });

    it('garde le nombre lisible quand il grandit', () => {
        expect(composerJaugeDeTable({ ...MENACE, valeur: 7 }).text).toBe('MENAC 7');
        expect(composerJaugeDeTable({ ...MENACE, valeur: 137 }).text).toBe('MEN 137');
    });

    it('ne déborde pas de ce que la largeur tient', () => {
        for (const valeur of [0, 9, 42, 137]) {
            expect(nomEtValeur('Menace', valeur).length, `${valeur}`)
                .toBeLessThanOrEqual(CARACTERES_TENUS);
        }
    });
});

/**
 * **À sec, elle passe au rouge.** Une réserve vide change ce qu'on a le droit
 * de faire — chez Dune, à zéro d'Impulsion l'achat d'un dé se paie en Menace.
 */
describe('une réserve à sec', () => {
    it('passe au rouge, avec ou sans plafond', () => {
        expect(composerJaugeDeTable({ ...IMPULSION, valeur: 0 }).color).toBe(COULEUR_A_SEC);
        expect(composerJaugeDeTable({ ...MENACE, valeur: 0 }).color).toBe(COULEUR_A_SEC);
    });

    it('ne l’est pas tant qu’il reste un cran', () => {
        expect(composerJaugeDeTable({ ...IMPULSION, valeur: 1 }).color).toBe(COULEUR_DE_LA_RESERVE);
    });
});

describe('ce qui ne change pas', () => {
    /** Le § 1 vaut ici : seule l'heure du monde déroge. */
    it('ne défile jamais', () => {
        expect(composerJaugeDeTable(IMPULSION).noScroll).toBe(true);
        expect(composerJaugeDeTable(MENACE).noScroll).toBe(true);
    });
});
