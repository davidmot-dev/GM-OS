import { expect, it } from 'vitest';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { signalerDependancesConservees } from './versionsDesDependances';
const pilote = { id: 'coc', name: 'COC2', version: '2.0.0', templateId: 'fiche', dice: { defaultDice: '1d20' } } as GameDriver;
it('signale les deux versions, sans remplacer le pilote local', () => {
    const ancien = { ...pilote, version: '1.0.0' };
    expect(signalerDependancesConservees([pilote], [ancien])[0]).toContain('installé (1.0.0) conservé');
    expect(ancien.version).toBe('1.0.0');
});
it('signale une variante malgré une version identique', () => {
    expect(signalerDependancesConservees([pilote], [{ ...pilote, dice: { ...pilote.dice, defaultDice: '3d6' } }])).toHaveLength(1);
});
it('signale une modification du schéma de fiche', () => {
    const fiche = { id: 'fiche', sections: [] } as unknown as SheetTemplate;
    expect(signalerDependancesConservees([pilote], [pilote], [fiche], [{ ...fiche, sections: [{ id: 'ancienne', label: 'Ancienne', fields: [] }] }])).toHaveLength(1);
});
it('reste silencieux pour une dépendance absente ou déjà conforme', () => {
    expect(signalerDependancesConservees([pilote], [])).toEqual([]);
    expect(signalerDependancesConservees([pilote], [structuredClone(pilote)])).toEqual([]);
});
