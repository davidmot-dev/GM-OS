import { describe, it, expect } from 'vitest';
import { forcerLeJet, relancableMalgreSaReussite, subirLeStress, type RegleDuForcage } from './yearZero';
import type { RollResult } from '../DiceEngine';

/**
 * **Blade Runner, la fin** — 2026-10-16 (carnet « Blade Runner ») : relancer au
 * forçage un D10 ou un D12 qui n'a fait qu'une réussite (« Forcer un jet », p. 55),
 * et le stress subi que la Psychologie réduit (« STRESS ET SANG-FROID »).
 */
const jet = (...des: [number, number][]): RollResult => ({
    total: 0, modifier: 0, totalDisplay: '', successes: 0,
    rolls: des.map(([val, sides]) => ({ val, sides, source: 'base' as const })),
});
const BR: RegleDuForcage = { garde: 'reussites-et-uns', relancerUneReussite: true };
const suite = (...valeurs: number[]) => { let i = 0; return () => valeurs[i++]; };

describe('relancer un dé à une seule réussite', () => {
    it('seuls les D10 et D12 qui montrent 6 à 9 le peuvent', () => {
        expect([[7, 10], [9, 12], [10, 10], [7, 8], [3, 12], [1, 10]].map(([val, sides]) =>
            relancableMalgreSaReussite({ val, sides }))).toEqual([true, true, false, false, false, false]);
    });

    it('le dé désigné se relance, et le nouveau résultat s’applique — même pire', () => {
        // D10 à 7 (une réussite) désigné, D8 à 3 relancé d'office, D12 à 1 gardé.
        const r = forcerLeJet(jet([7, 10], [3, 8], [1, 12]), BR, { famille: 'echelonnee', aussi: [0], de: suite(10, 2) });
        expect(r.rolls.map(d => [d.val, d.relance])).toEqual([[10, true], [2, true], [1, false]]);
        expect(r.successes).toBe(2);
        const pire = forcerLeJet(jet([7, 10]), BR, { famille: 'echelonnee', aussi: [0], de: suite(4) });
        expect(pire.successes).toBe(0);
    });

    it('sans la règle, ou pour un dé qui ne le peut pas, la réussite reste', () => {
        const sansRegle = forcerLeJet(jet([7, 10]), { garde: 'reussites-et-uns' }, { famille: 'echelonnee', aussi: [0], de: suite(1) });
        expect(sansRegle.rolls[0]).toMatchObject({ val: 7, relance: false });
        const deuxReussites = forcerLeJet(jet([11, 12]), BR, { famille: 'echelonnee', aussi: [0], de: suite(1) });
        expect(deuxReussites.rolls[0]).toMatchObject({ val: 11, relance: false });
    });
});

describe('le stress subi', () => {
    const REGLE = { champ: 'sangFroid', jet: ['empathie', 'psychologie'] };

    it('chaque réussite retire un point du facteur, le reste au Sang-froid', () => {
        // Empathie B (D10) = 6 : une réussite ; Psychologie C (D8) = 2 : aucune.
        const r = subirLeStress(3, REGLE, { empathie: 'B (D10)', psychologie: 'C', sangFroid: 4 }, suite(6, 2));
        expect(r).toMatchObject({ reussites: 1, perte: 2, avant: 4, apres: 2 });
        expect(r.des).toEqual([{ champ: 'empathie', faces: 10, val: 6 }, { champ: 'psychologie', faces: 8, val: 2 }]);
    });

    it('un 10 en vaut deux ; on ne descend jamais sous zéro', () => {
        expect(subirLeStress(2, REGLE, { empathie: 'A', psychologie: 'D', sangFroid: 3 }, suite(10, 1))).toMatchObject({ perte: 0, apres: 3 });
        expect(subirLeStress(3, REGLE, { empathie: 'D', psychologie: 'D', sangFroid: 1 }, suite(2, 3))).toMatchObject({ perte: 3, apres: 0 });
    });

    it('un dé dont la fiche ne dit pas le niveau n’est pas lancé', () => {
        expect(subirLeStress(1, REGLE, { empathie: '', sangFroid: 2 }, suite()).des).toEqual([]);
    });
});
