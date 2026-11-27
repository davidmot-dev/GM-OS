import { describe, it, expect } from 'vitest';
import { calculerLesDegats, decrireLesDegats, lancerLesDesDeLArme, lireLesDegats, lireLesTraits } from './degatsDeTraveller';

/**
 * TRV-A2 (27/11/2026), critères C5 et C11 de la spécification
 * `2026-11-27-traveller-jets-demandes-et-degats.md` — les règles relues dans le livre v2.2, p. 74-76.
 */
describe('lireLesDegats — la colonne Dégâts', () => {
    it.each([
        ['3D', { des: 3, bonus: 0, destructrice: false }],
        ['1D+2', { des: 1, bonus: 2, destructrice: false }],
        ['3D-3', { des: 3, bonus: -3, destructrice: false }],
        ['3D−3', { des: 3, bonus: -3, destructrice: false }],
        ['1DD', { des: 1, bonus: 0, destructrice: true }],
        [' 6 D ', { des: 6, bonus: 0, destructrice: false }],
    ])('%s', (texte, attendu) => {
        expect(lireLesDegats(texte)).toEqual(attendu);
    });

    it.each(['', 'Spécial', '0D', 'D6', '3D6', undefined])('refuse « %s »', texte => {
        expect(lireLesDegats(texte)).toBeNull();
    });
});

describe('lireLesTraits', () => {
    it('AP et Auto se lisent, le reste est rappelé', () => {
        expect(lireLesTraits('AP 5, Auto 3, Viseur')).toEqual({ ap: 5, auto: 3, incapacitante: false, autres: ['Viseur'] });
        expect(lireLesTraits('Incapacitante')).toEqual({ ap: 0, auto: 0, incapacitante: true, autres: [] });
        expect(lireLesTraits('Explosion 9; Rayonnement')).toEqual({ ap: 0, auto: 0, incapacitante: false, autres: ['Explosion 9', 'Rayonnement'] });
        expect(lireLesTraits('—')).toEqual({ ap: 0, auto: 0, incapacitante: false, autres: [] });
    });
});

describe('calculerLesDegats — p. 74-76', () => {
    it('le Fusil (3D, p. 75) : dés + Effet − armure', () => {
        const d = calculerLesDegats({ degats: lireLesDegats('3D')!, lances: [4, 3, 5], effet: 2, protection: 4 });
        expect(d).toMatchObject({ deLArme: 12, brut: 14, protection: 4, net: 10, minimum: false });
        expect(decrireLesDegats(d, lireLesDegats('3D')!)).toBe('12 + 2 (Effet) − 4 (armure) = 10');
    });

    it('la Dague (1D+2, mêlée) ajoute le MD de FOR en plus de l’Effet (p. 74)', () => {
        const d = calculerLesDegats({ degats: lireLesDegats('1D+2')!, lances: [3], effet: 1, mdDeForceEnMelee: 1, protection: 0 });
        expect(d).toMatchObject({ deLArme: 5, brut: 7, net: 7 });
        const faible = calculerLesDegats({ degats: lireLesDegats('1D+2')!, lances: [3], effet: 0, mdDeForceEnMelee: -1, protection: 0 });
        expect(faible.net).toBe(4);
        expect(decrireLesDegats(faible, lireLesDegats('1D+2')!)).toBe('5 − 1 (FOR) = 4');
    });

    it('une arme perforante ignore autant d’armure que son niveau, sans passer sous 0 (p. 75)', () => {
        const d = calculerLesDegats({ degats: lireLesDegats('3D')!, lances: [2, 2, 2], effet: 0, protection: 8, ap: 5 });
        expect(d).toMatchObject({ protection: 3, net: 3 });
        expect(calculerLesDegats({ degats: lireLesDegats('3D')!, lances: [2, 2, 2], effet: 0, protection: 3, ap: 5 }).protection).toBe(0);
    });

    it('un Effet de 6+ inflige toujours au moins un point (p. 75) — pas un Effet de 5', () => {
        const fort = calculerLesDegats({ degats: lireLesDegats('1D')!, lances: [1], effet: 6, protection: 20 });
        expect(fort).toMatchObject({ net: 1, minimum: true });
        expect(decrireLesDegats(fort, lireLesDegats('1D')!)).toContain('au moins 1');
        expect(calculerLesDegats({ degats: lireLesDegats('1D')!, lances: [1], effet: 5, protection: 20 }).net).toBe(0);
    });

    it('une arme destructrice multiplie les dégâts obtenus par 10, avant l’Effet et l’armure (p. 75)', () => {
        const d = calculerLesDegats({ degats: lireLesDegats('1DD')!, lances: [4], effet: 3, protection: 10, ap: 10 });
        expect(d).toMatchObject({ deLArme: 40, brut: 43, protection: 0, net: 43 });
    });

    it('la rafale ajoute le niveau Auto (p. 76)', () => {
        const d = calculerLesDegats({ degats: lireLesDegats('3D')!, lances: [3, 3, 3], effet: 1, rafale: 3, protection: 2 });
        expect(d).toMatchObject({ brut: 13, net: 11, rafale: 3 });
    });

    it('un Effet négatif ne retire rien (la carte ne s’ouvre que sur une réussite)', () => {
        expect(calculerLesDegats({ degats: lireLesDegats('2D')!, lances: [3, 4], effet: -2, protection: 0 }).net).toBe(7);
    });

    it('lance un dé par dé de l’arme', () => {
        let n = 0;
        expect(lancerLesDesDeLArme(lireLesDegats('3D-3')!, () => ++n)).toEqual([1, 2, 3]);
    });
});
