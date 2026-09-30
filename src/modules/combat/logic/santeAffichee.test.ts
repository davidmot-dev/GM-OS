import { describe, it, expect } from 'vitest';
import { santeAffichee, estHorsDeCombat } from './SanteDuCombattant';

/**
 * **La carte grisait un mort dont la barre était pleine** : un combattant qui
 * n'avait que ses points de vie s'affichait en 10 / 10 (2026-09-30).
 */
describe('la santé que la carte affiche', () => {
    it('garde le système de santé quand il existe', () => {
        const sante = { type: 'clocks', data: { filled: 2, segments: 6 }, state: 'scratched' };
        expect(santeAffichee({ hp: 3, hpMax: 10, healthSystem: sante })).toBe(sante);
    });

    it('construit la jauge depuis les points de vie : 148 / 155', () => {
        expect(santeAffichee({ hp: 148, hpMax: 155 }))
            .toEqual({ type: 'hp', data: { current: 148, max: 155 }, state: 'healthy' });
    });

    it('et dit le même mort qu’estHorsDeCombat', () => {
        const pris = { hp: 0, hpMax: 12 };
        expect(santeAffichee(pris)?.state).toBe('dead');
        expect(estHorsDeCombat(pris)).toBe(true);
    });

    it('suit les seuils du moteur', () => {
        expect(santeAffichee({ hp: 3, hpMax: 12 })?.state).toBe('critical');
        expect(santeAffichee({ hp: 6, hpMax: 12 })?.state).toBe('wounded');
        expect(santeAffichee({ hp: 10, hpMax: 12 })?.state).toBe('scratched');
    });

    it('ne fabrique rien sans jauge', () => {
        expect(santeAffichee({})).toBeUndefined();
    });
});
