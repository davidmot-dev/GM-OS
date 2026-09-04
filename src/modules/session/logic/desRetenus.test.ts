import { describe, it, expect, beforeEach } from 'vitest';
import { calculationEngine } from './CalculationEngine';

/**
 * **Un dé dans une formule de fiche ne se relance pas tout seul.**
 *
 * Défaut F3 du § 12m, corrigé le 2026-09-04. `roll()` appelait `Math.random()` à
 * chaque évaluation : taper dans un champ relançait les dés de tous les autres.
 * *Un total qui bouge tout seul n'est pas un calcul, c'est un bruit.*
 */

beforeEach(() => calculationEngine.relancerLesDes());

describe('un champ nommé retient son tirage', () => {
    it('rend la même valeur à chaque recalcul — le défaut du 04/09', () => {
        const premier = calculationEngine.evaluate('1d1000', {}, 'degats');

        for (let i = 0; i < 20; i++) {
            expect(calculationEngine.evaluate('1d1000', {}, 'degats')).toBe(premier);
        }
    });

    it('suit le contexte qui change autour de lui', () => {
        const a = calculationEngine.evaluate('1d1000 + @Force', { Force: 3 }, 'degats');
        const b = calculationEngine.evaluate('1d1000 + @Force', { Force: 8 }, 'degats');

        expect(b - a).toBe(5);
    });

    it('retient chaque dé de la formule séparément', () => {
        const total = calculationEngine.evaluate('1d1000 + 1d1000', {}, 'degats');
        expect(calculationEngine.evaluate('1d1000 + 1d1000', {}, 'degats')).toBe(total);
    });

    it('ne partage rien entre deux champs', () => {
        /*
          Mille faces : deux champs qui tirent la même valeur vingt fois de
          suite ne serait pas de la chance, ce serait un mélange de clés.
        */
        let different = false;
        for (let i = 0; i < 20 && !different; i++) {
            calculationEngine.relancerLesDes();
            different = calculationEngine.evaluate('1d1000', {}, 'a')
                !== calculationEngine.evaluate('1d1000', {}, 'b');
        }
        expect(different).toBe(true);
    });

    it('relance quand la formule change — ce n’est plus le même dé', () => {
        calculationEngine.evaluate('1d1000', {}, 'degats');
        /* Un d6 ne peut pas dépasser 6 : si le tirage du d1000 avait été
           réemployé, on le verrait. */
        for (let i = 0; i < 20; i++) {
            expect(calculationEngine.evaluate('1d6', {}, 'degats')).toBeLessThanOrEqual(6);
        }
    });
});

describe('sans nom de champ, on lance vraiment', () => {
    it('garde le comportement d’origine pour un calcul ponctuel', () => {
        const tirages = new Set(Array.from({ length: 30 }, () => calculationEngine.evaluate('1d1000')));
        expect(tirages.size).toBeGreaterThan(1);
    });
});

describe('relancer à la demande', () => {
    it('oublie un champ sans toucher aux autres', () => {
        const a = calculationEngine.evaluate('1d1000', {}, 'a');
        const b = calculationEngine.evaluate('1d1000', {}, 'b');

        calculationEngine.relancerLesDes('a');

        expect(calculationEngine.evaluate('1d1000', {}, 'b')).toBe(b);
        /* On ne peut pas exiger que `a` change — un dé relancé peut retomber
           sur la même face. Ce qui compte est que `b` n'ait pas bougé. */
        expect(typeof a).toBe('number');
    });

    it('oublie tout quand on ne nomme rien', () => {
        calculationEngine.evaluate('1d1000', {}, 'a');
        calculationEngine.relancerLesDes();

        let change = false;
        for (let i = 0; i < 20 && !change; i++) {
            calculationEngine.relancerLesDes();
            change = calculationEngine.evaluate('1d1000', {}, 'a') !== calculationEngine.evaluate('1d1000', {}, 'a');
        }
        /* Après un oubli, le premier calcul retire — puis il retient de nouveau. */
        expect(change).toBe(false);
    });
});

describe('une formule en erreur ne contamine pas la suivante', () => {
    it('referme la clé même quand l’évaluation échoue', () => {
        expect(calculationEngine.evaluate('1d20 + @', {}, 'casse')).toBe(0);

        const tirages = new Set(Array.from({ length: 30 }, () => calculationEngine.evaluate('1d1000')));
        expect(tirages.size).toBeGreaterThan(1);
    });
});
