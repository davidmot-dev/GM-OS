import { describe, it, expect } from 'vitest';
import { suitesDuJet, valeurApresLaSuite, type SuiteDUnCritique } from './suitesDesCritiques';

/**
 * **Les suites d'une maladresse ou d'un critique** — Nephilim Légende : la
 * jauge qui monte dépend de ce qui a été lancé.
 */
const SECTIONS = [
    { id: 'les_vecus', fields: [{ id: 'simulacrum_experience_degree' }, { id: 'pastlives_0_degree' }] },
    { id: 'arts_magie', fields: [{ id: 'occult_magic_first' }] },
    { id: 'le_pentacle', fields: [{ id: 'ka_fire' }] },
];
const KHAIBA: SuiteDUnCritique = { quand: 'maladresse', label: 'Maladresse de Magie', sections: ['arts_magie'], ajouter: { champ: 'falls_khaiba' } };
const OMBRE: SuiteDUnCritique = { quand: 'maladresse', label: 'Maladresse du Vécu contemporain', champs: ['simulacrum_experience_degree'], ajouter: { champ: 'falls_shadow' } };
const SAPIENCE: SuiteDUnCritique = { quand: 'critique', label: 'Critique de Magie', sections: ['arts_magie'], ajouter: { champ: 'resources_sapience' } };
const SUITES = [KHAIBA, OMBRE, SAPIENCE];

describe('les suites du jet', () => {
    it('une maladresse sur un Art de Magie propose le Khaïba, pas l’Ombre', () => {
        expect(suitesDuJet(SUITES, 'echec-total', ['occult_magic_first', 'ka_fire'], SECTIONS)).toEqual([KHAIBA]);
    });

    it('une maladresse sur le Vécu contemporain propose l’Ombre', () => {
        expect(suitesDuJet(SUITES, 'echec-total', ['simulacrum_experience_degree'], SECTIONS)).toEqual([OMBRE]);
    });

    it('une maladresse sur un Vécu passé ne propose rien : la règle ne la fait rien coûter', () => {
        expect(suitesDuJet(SUITES, 'echec-total', ['pastlives_0_degree'], SECTIONS)).toEqual([]);
    });

    it('un critique en Magie propose le Point de Sapience, une maladresse jamais', () => {
        expect(suitesDuJet(SUITES, 'reussite-particuliere', ['occult_magic_first'], SECTIONS)).toEqual([SAPIENCE]);
    });

    it('un échec ou une réussite ordinaires ne déclenchent rien', () => {
        expect(suitesDuJet(SUITES, 'echec-normal', ['occult_magic_first'], SECTIONS)).toEqual([]);
        expect(suitesDuJet(SUITES, 'reussite-normale', ['occult_magic_first'], SECTIONS)).toEqual([]);
    });

    it('une suite sans section ni champ vaut pour tout jet', () => {
        const toute: SuiteDUnCritique = { quand: 'maladresse', label: 'Maladresse' };
        expect(suitesDuJet([toute], 'echec-total', [], SECTIONS)).toEqual([toute]);
    });

    it('sans suites ni degré, rien', () => {
        expect(suitesDuJet(undefined, 'echec-total', ['occult_magic_first'], SECTIONS)).toEqual([]);
        expect(suitesDuJet(SUITES, undefined, ['occult_magic_first'], SECTIONS)).toEqual([]);
    });
});

describe('la valeur après le geste', () => {
    it('ajoute un degré, plafonné au maximum de la jauge', () => {
        expect(valeurApresLaSuite(3)).toBe(4);
        expect(valeurApresLaSuite(10, 1, 10)).toBe(10);
    });

    it('retire sans descendre sous zéro', () => {
        expect(valeurApresLaSuite(2, -1)).toBe(1);
        expect(valeurApresLaSuite(0, -1)).toBe(0);
    });
});
