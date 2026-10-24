import { describe, it, expect } from 'vitest';
import { copieDuGabarit, direLesUsages, usagesDuGabarit, usagesDuPilote } from './usagesDuModele';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/** Audit des clés, 2026-10-24 : la corbeille refuse ce qui sert encore ; la copie garde tout le gabarit. */
const etat = {
    players: [{ characters: [{ name: 'Nitouche', templateId: 'tpl-rdd' }, { name: 'Mara', templateId: 'tpl-torg' }] }],
    entities: [{ name: 'Groin', templateId: 'tpl-rdd' }],
    customGameDrivers: [{ name: 'Rêve de Dragon', templateId: 'tpl-rdd' }],
    campaigns: [{ name: 'Le secret de Milo', system: 'rdd' }, { name: 'Autre', system: 'torg' }],
};

describe('ce qui sert encore', () => {
    it('un gabarit : personnages, PNJ et pilotes qui le désignent', () => {
        expect(usagesDuGabarit(etat, 'tpl-rdd')).toEqual(['Nitouche', 'Groin', 'pilote Rêve de Dragon']);
        expect(usagesDuGabarit(etat, 'tpl-libre')).toEqual([]);
    });
    it('un pilote : les campagnes qui le jouent', () => {
        expect(usagesDuPilote(etat, 'rdd')).toEqual(['campagne Le secret de Milo']);
    });
    it('dit quatre noms, puis le compte', () => {
        expect(direLesUsages(['a', 'b', 'c', 'd', 'e', 'f'])).toBe('a, b, c, d et 2 autre(s)');
    });
});

describe('la copie d’un gabarit', () => {
    it('garde les règles de la fiche et les personas, pas l’identifiant ni la marque d’usine', () => {
        const livret = { id: 'tpl-rdd', name: 'Livret', emoji: '🐉', reglesDeFiche: 'rdd-231', isBuiltin: true,
            sections: [{ id: 's', label: 'S', fields: [] }], aiPersonas: { g: 'x' } } as SheetTemplate;
        const copie = copieDuGabarit(livret, 'Livret (copie)');
        expect(copie).toEqual({ name: 'Livret (copie)', emoji: '🐉', reglesDeFiche: 'rdd-231', sections: [{ id: 's', label: 'S', fields: [] }], aiPersonas: { g: 'x' } });
        expect(copie.sections).not.toBe(livret.sections);
    });
});
