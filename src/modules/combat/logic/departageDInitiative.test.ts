import { describe, it, expect } from 'vitest';
import { comparerLInitiative, departager } from './departageDInitiative';

/** Symbaroum, p. 161 : l'Agilité, puis la Vigilance, puis 1D20 relancé jusqu'à départager. */
describe('le départage de l’initiative', () => {
    const vigilance: Record<string, number> = { brigand: 11, hargne: 9, troll: 9, elfe: 9 };

    it('à Agilité égale, la Vigilance départage (Hargne et le brigand)', () => {
        const ordre = departager([{ id: 'hargne', init: 10 }, { id: 'brigand', init: 10 }], c => [vigilance[c.id]], () => 1)
            .sort((a, b) => comparerLInitiative(a, b));
        expect(ordre.map(c => c.id)).toEqual(['brigand', 'hargne']);
        expect(ordre[0].departage).toEqual([11]);
    });

    it('la double égalité demande le d20, relancé tant qu’il y a égalité', () => {
        const des = [7, 7, 12, 4];
        const ordre = departager([{ id: 'troll', init: 10 }, { id: 'elfe', init: 10 }], c => [vigilance[c.id]], () => des.shift()!)
            .sort((a, b) => comparerLInitiative(a, b));
        expect(ordre.map(c => c.id)).toEqual(['troll', 'elfe']);
        expect(ordre[0].departage).toEqual([9, 7, 12]);
    });

    it('un combattant sans égal ne lance pas de d20', () => {
        const [seul] = departager([{ id: 'troll', init: 14 }, { id: 'elfe', init: 10 }], c => [vigilance[c.id]], () => { throw new Error('pas de d20'); });
        expect(seul.departage).toEqual([9]);
    });

    it('l’ordre retrié reste le même', () => {
        const liste = departager([{ id: 'hargne', init: 10 }, { id: 'brigand', init: 10 }, { id: 'troll', init: 12 }], c => [vigilance[c.id]], () => 1);
        const une = [...liste].sort((a, b) => comparerLInitiative(a, b)).map(c => c.id);
        const deux = [...liste].reverse().sort((a, b) => comparerLInitiative(a, b)).map(c => c.id);
        expect(une).toEqual(['troll', 'brigand', 'hargne']);
        expect(deux).toEqual(une);
    });
});
