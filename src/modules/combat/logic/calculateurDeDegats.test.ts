import { describe, it, expect } from 'vitest';
import { calculateurDisponible, ciblesDuCalculateur, degatsDuDernierJet } from './calculateurDeDegats';
import { DiceEngine } from '../../dice/DiceEngine';

describe('« Calculer » ouvert depuis une carte (C1, 19/11/2026)', () => {
    const plateau = [{ id: 'rachel' }, { id: 'agent' }];

    it('coche la cible seule, jamais l’attaquant avec elle', () => {
        expect(ciblesDuCalculateur({ id: 'agent', targetId: 'rachel' }, plateau)).toEqual(['rachel']);
    });

    it('sans cible, coche le porteur de la carte', () => {
        expect(ciblesDuCalculateur({ id: 'agent', targetId: undefined }, plateau)).toEqual(['agent']);
        expect(ciblesDuCalculateur({ id: 'agent' }, plateau)).toEqual(['agent']);
    });

    it('une cible qui a quitté le plateau ne se coche pas : le porteur reprend la main', () => {
        expect(ciblesDuCalculateur({ id: 'agent', targetId: 'parti' }, plateau)).toEqual(['agent']);
    });
});

describe('le dernier jet en dégâts (C2, 19/11/2026)', () => {
    it('un jet ordinaire vaut son total', () => {
        expect(degatsDuDernierJet({ total: 7 })).toBe(7);
        expect(degatsDuDernierJet(DiceEngine.rollStandard(6, 2))).toBeGreaterThanOrEqual(2);
    });

    it('un jet Year Zero compte des réussites : jamais des dégâts', () => {
        expect(DiceEngine.rollYZE(4, 0).compte).toBe('reussites');
        expect(DiceEngine.rollYZEEchelonne([12, 8]).compte).toBe('reussites');
        expect(degatsDuDernierJet(DiceEngine.rollYZE(4, 0))).toBeNull();
        expect(degatsDuDernierJet({ total: 2, compte: 'reussites' })).toBeNull();
    });

    it('sans jet, rien à reprendre', () => {
        expect(degatsDuDernierJet(null)).toBeNull();
    });
});

describe('« Calculer » masqué pour Dune (19/11/2026)', () => {
    it('Dune n’a pas de points de vie : pas de calculateur', () => {
        expect(calculateurDisponible({ jet: { dune: { determination: 'determination' } } })).toBe(false);
    });

    it('les autres jeux, et l’absence de pilote, le gardent', () => {
        expect(calculateurDisponible({ jet: {} })).toBe(true);
        expect(calculateurDisponible(undefined)).toBe(true);
    });
});
