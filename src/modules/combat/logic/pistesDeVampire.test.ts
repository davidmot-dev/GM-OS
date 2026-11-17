import { describe, expect, it } from 'vitest';
import { degatsDeVampireSelonLeJeu, lireLeTypeDeVampire } from './pistesDeVampire';

/** La porte des dégâts de Vampire (2026-11-17, p. 126-127) : le type du coup dit la jauge et la nature. */
const pilote = { jet: { vampire: {
    soif: 'soif', volonte: 'volonte',
    degats: { sante: 'sante_degats', volonte: 'volonte_degats', jaugeDeSante: 'sante' },
} } };
const stats = [
    { fieldId: 'sante', max: 'vigueur + 3', isMainHP: true },
    { fieldId: 'volonte', max: 'resolution + sang_froid' },
];
const fiche = { vigueur: 2, resolution: 2, sang_froid: 3, sante: 5, volonte: 5, sante_degats: '', volonte_degats: '' };

describe('Vampire — la porte des dégâts', () => {
    it('lit le type du coup avec les mots du pilote', () => {
        expect(lireLeTypeDeVampire('Aggravés')).toEqual({ jauge: 'sante', nature: 'aggrave', diviser: true });
        expect(lireLeTypeDeVampire('Superficiels non divisés')).toEqual({ jauge: 'sante', nature: 'superficiel', diviser: false });
        expect(lireLeTypeDeVampire('Volonté — aggravés')).toEqual({ jauge: 'volonte', nature: 'aggrave', diviser: true });
        expect(lireLeTypeDeVampire(undefined)).toEqual({ jauge: 'sante', nature: 'superficiel', diviser: true });
    });

    it('sans la règle des dégâts au pilote, la porte laisse passer', () => {
        expect(degatsDeVampireSelonLeJeu({ jet: { vampire: { soif: 'soif' } } }, fiche, { value: 3 }, stats)).toBeNull();
        // Ni maximum ni Santé sur la fiche : rien ne dit quand la jauge est pleine.
        expect(degatsDeVampireSelonLeJeu(pilote, {}, { value: 3 }, [])).toBeNull();
    });

    it('une créature du livre sans Vigueur : la capacité se lit sur sa fiche (« Santé 6 », p. 371)', () => {
        const r = degatsDeVampireSelonLeJeu(pilote, { sante: 6 }, { value: 7, type: 'Aggravés' }, stats)!;
        expect(r.fiche).toEqual({ sante_degats: 'XXXXXX' });
        expect(r.impact.value).toBe(6);
    });

    it('l’officier de police : six aggravés sur cinq cases, la Santé tombe à zéro (p. 126-127)', () => {
        const r = degatsDeVampireSelonLeJeu(pilote, fiche, { value: 6, type: 'Aggravés' }, stats)!;
        expect(r.fiche).toEqual({ sante_degats: 'XXXXX' });
        expect(r.impact).toMatchObject({ value: 5, isRecovery: false });
    });

    it('des superficiels laissent la Santé (cases sans « X ») où elle est', () => {
        const r = degatsDeVampireSelonLeJeu(pilote, fiche, { value: 5, type: 'Superficiels' }, stats)!;
        expect(r.fiche).toEqual({ sante_degats: '///' });
        expect(r.impact.value).toBe(0);
    });

    it('un soin d’aggravés rend la case à la Santé', () => {
        const r = degatsDeVampireSelonLeJeu(pilote, { ...fiche, sante: 4, sante_degats: 'X/' }, { value: 1, type: 'Aggravés', isRecovery: true }, stats)!;
        expect(r.fiche).toEqual({ sante_degats: '/' });
        expect(r.impact).toMatchObject({ value: 1, isRecovery: true });
    });

    it('la Volonté s’écrit elle-même ; rien ne part vers la Santé', () => {
        const r = degatsDeVampireSelonLeJeu(pilote, fiche, { value: 2, type: 'Volonté — aggravés' }, stats)!;
        expect(r.fiche).toEqual({ volonte_degats: 'XX', volonte: 3 });
        expect(r.impact.value).toBe(0);
    });
});
