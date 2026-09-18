import { describe, it, expect } from 'vitest';
import {
    teinterVers, fonduTenable, bornerLaForce, nomDeLaCopie,
    estUneVariante, identifiantDeVariante, idDepuisLIdentifiant,
    FORCE_PAR_DEFAUT,
} from './varianteDEffet';

/**
 * **Ce qu'une variante a le droit de changer, et ce qu'elle doit préserver.**
 *
 * Chaque cas ci-dessous garde une décision prise en construisant la copie
 * d'effet — et deux d'entre eux gardent un défaut réel du moteur.
 */

describe('tirer une palette vers une teinte', () => {
    const ROUGE: readonly [number, number] = [0.69, 0.31];
    const BLEU: readonly [number, number] = [0.15, 0.05];

    it('ne bouge rien à force nulle', () => {
        expect(teinterVers(ROUGE, BLEU, 0)).toEqual([0.69, 0.31]);
    });

    it('atteint la cible à force pleine', () => {
        /* ⚠️ `toBeCloseTo`, pas `toEqual` : l'interpolation passe par des
           flottants, et 0.17 y devient 0.17000000000000004. Exiger l'égalité
           binaire ferait rougir un calcul parfaitement juste. */
        const [x, y] = teinterVers(ROUGE, BLEU, 1);
        expect(x).toBeCloseTo(0.15, 10);
        expect(y).toBeCloseTo(0.05, 10);
    });

    /**
     * ⭐ **Le cas qui justifie le mélange plutôt que le remplacement.**
     *
     * Un gyrophare alterne un rouge et un bleu. Teintés vers le vert à 70 %,
     * les deux se rapprochent du vert — mais ils restent **distincts**, donc le
     * battement se voit encore. *Ce qui fait un effet n'est pas sa teinte,
     * c'est le rapport entre ses teintes.*
     */
    it('garde l’écart entre deux couleurs d’un même effet', () => {
        const VERT: readonly [number, number] = [0.17, 0.70];
        const a = teinterVers(ROUGE, VERT, 0.7);
        const b = teinterVers(BLEU, VERT, 0.7);

        expect(a).not.toEqual(b);
        /* L'écart se réduit — c'est le but — mais il ne disparaît pas. */
        const ecartAvant = Math.abs(ROUGE[0] - BLEU[0]);
        const ecartApres = Math.abs(a[0] - b[0]);
        expect(ecartApres).toBeLessThan(ecartAvant);
        expect(ecartApres).toBeGreaterThan(0.1);
    });

    it('⛔ à force pleine, les deux couleurs se confondent — c’est pourquoi ce n’est pas le défaut', () => {
        const VERT: readonly [number, number] = [0.17, 0.70];
        const a = teinterVers(ROUGE, VERT, 1);
        const b = teinterVers(BLEU, VERT, 1);
        expect(a[0]).toBeCloseTo(b[0], 10);
        expect(a[1]).toBeCloseTo(b[1], 10);
        expect(FORCE_PAR_DEFAUT).toBeLessThan(1);
    });

    it('refuse une force absurde plutôt que de rendre une couleur folle', () => {
        expect(bornerLaForce(5)).toBe(1);
        expect(bornerLaForce(-3)).toBe(0);
        expect(bornerLaForce('bleu')).toBe(FORCE_PAR_DEFAUT);
        expect(bornerLaForce(undefined)).toBe(FORCE_PAR_DEFAUT);
    });
});

/**
 * ⛔ **Le défaut latent du curseur de vitesse.**
 *
 * Le contrôle du catalogue interdit qu'un fondu dépasse son battement, et il
 * lit la **source** — où la vitesse vaut toujours 1. Le curseur, lui, divise
 * l'attente sans toucher au fondu : l'effet ne casse pas, il s'aplatit.
 */
describe('le fondu ne dépasse jamais le battement', () => {
    it('laisse un fondu déjà tenable tranquille', () => {
        // 2 400 ms de fondu pour 2 500 ms d'attente : c'est `aube-doree` au repos.
        expect(fonduTenable(24, 2500)).toBe(24);
    });

    it('⛔ rabote le fondu quand la vitesse a raccourci le battement', () => {
        // `aube-doree` à vitesse 2 : l'attente tombe à 1 250 ms.
        expect(fonduTenable(24, 1250)).toBe(11);
        // `holy` à vitesse 2 : 1 500 ms de fondu pour 750 ms d'attente.
        expect(fonduTenable(15, 750)).toBe(6);
    });

    it('laisse toujours une marge : le fondu finit AVANT la commande suivante', () => {
        // 1 000 ms d'attente ne donne pas 10 dixièmes, mais 9.
        expect(fonduTenable(50, 1000)).toBe(9);
    });

    it('ne rend jamais un fondu négatif, même sur une cadence minuscule', () => {
        expect(fonduTenable(30, 50)).toBe(0);
        expect(fonduTenable(30, 0)).toBe(30);   // cadence inconnue : on ne touche à rien
    });

    it('laisse un fondu nul tel quel — certains effets n’en veulent pas', () => {
        // Un stroboscope pose `transitiontime = 0` exprès.
        expect(fonduTenable(0, 100)).toBe(0);
    });
});

describe('nommer une copie', () => {
    it('propose « (copie) », puis numérote', () => {
        expect(nomDeLaCopie('Torche', [])).toBe('Torche (copie)');
        expect(nomDeLaCopie('Torche', ['Torche (copie)'])).toBe('Torche (copie 2)');
        expect(nomDeLaCopie('Torche', ['Torche (copie)', 'Torche (copie 2)']))
            .toBe('Torche (copie 3)');
    });
});

/**
 * ⚠️ Le préfixe est un contrat : sans lui, le moteur chercherait un `case` qui
 * n'existe pas et ne ferait **rien**, sans message — *une porte qui ouvre sur
 * rien*, exactement ce que le contrôle du catalogue existe pour interdire.
 */
describe('reconnaître une variante', () => {
    it('distingue une variante d’un effet du catalogue', () => {
        expect(estUneVariante('variante:abc')).toBe(true);
        expect(estUneVariante('torche')).toBe(false);
        expect(estUneVariante(undefined)).toBe(false);
        expect(estUneVariante('none')).toBe(false);
    });

    it('fait l’aller-retour sans rien perdre', () => {
        const id = 'v-1789576560192';
        expect(idDepuisLIdentifiant(identifiantDeVariante(id))).toBe(id);
    });
});
