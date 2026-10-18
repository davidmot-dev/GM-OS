import { describe, it, expect } from 'vitest';
import { consommationDuJet, direLaConsommation, type ConsommationAuJet } from './consommationAuJet';

/**
 * **Les Materiae Primae d'une transmutation** — Nephilim, Quintessence p. 220 :
 * consommées sur une réussite, un échec ou une maladresse, conservées sur un critique.
 */
const MP: ConsommationAuJet = {
    label: 'Materiae Primae', composante: 'formule',
    elementSur: { remplacer: '_degree$', par: '_element' },
    champs: { Eau: 'alchemy_materia_water', Feu: 'alchemy_materia_fire' },
    conserveeSur: ['critique'],
};
const FICHE = { alchemy_formulas_3_degree: 4, alchemy_formulas_3_element: 'Eau', alchemy_materia_water: 6 };
const RETENUS = { formule: 'alchemy_formulas_3_degree' };

describe('les Materiae Primae d’une transmutation', () => {
    it('une réussite consomme le degré de la formule, dans la jauge de son élément', () => {
        const c = consommationDuJet(MP, RETENUS, FICHE, 'reussite-normale');
        expect(c).toEqual({ conservee: false, label: 'Materiae Primae', quantite: 4, element: 'Eau', champ: 'alchemy_materia_water', avant: 6, apres: 2, manque: 0 });
        expect(direLaConsommation(c!)).toBe('Materiae Primae Eau −4 → 2');
    });

    it('un échec et une maladresse consomment aussi', () => {
        expect(consommationDuJet(MP, RETENUS, FICHE, 'echec-normal')).toMatchObject({ apres: 2 });
        expect(consommationDuJet(MP, RETENUS, FICHE, 'echec-total')).toMatchObject({ apres: 2 });
    });

    it('un critique les conserve', () => {
        const c = consommationDuJet(MP, RETENUS, FICHE, 'reussite-particuliere');
        expect(c).toEqual({ conservee: true, label: 'Materiae Primae', quantite: 4, element: 'Eau' });
        expect(direLaConsommation(c!)).toMatch(/conservées \(critique\)/);
    });

    it('une jauge trop courte s’arrête à zéro, et dit ce qui manque', () => {
        const c = consommationDuJet(MP, RETENUS, { ...FICHE, alchemy_materia_water: 1 }, 'reussite-normale');
        expect(c).toMatchObject({ avant: 1, apres: 0, manque: 3 });
        expect(direLaConsommation(c!)).toMatch(/il en manquait 3/);
    });

    it('sans formule, sans degré ou sans élément connu, rien ne se consomme', () => {
        expect(consommationDuJet(MP, {}, FICHE, 'reussite-normale')).toBeNull();
        expect(consommationDuJet(MP, RETENUS, { ...FICHE, alchemy_formulas_3_degree: 0 }, 'reussite-normale')).toBeNull();
        expect(consommationDuJet(MP, RETENUS, { ...FICHE, alchemy_formulas_3_element: '' }, 'reussite-normale')).toBeNull();
        expect(consommationDuJet(undefined, RETENUS, FICHE, 'reussite-normale')).toBeNull();
    });
});
