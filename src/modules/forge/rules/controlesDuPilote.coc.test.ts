import { expect, it } from 'vitest';
import { controlerLePilote } from './controlesDuPilote';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/** Le contrôle des règles COC du pilote (2026-10-31). */
const fiche = { id: 't', sections: [{ id: 'caracteristiques', fields: [
    { id: 'agilite', type: 'number' }, { id: 'constitution', type: 'number' }, { id: 'echelle_de_sante', type: 'number' },
] }] } as unknown as SheetTemplate;

it('la Forge signale un jet COC à deux caractéristiques, des critiques à l’envers et des champs absents', () => {
    const d = {
        dice: { engine: 'standard' },
        jet: {
            sens: 'superieur-ou-egal', reserve: { base: 1, max: 1, faces: 20 }, critique: 1, complication: 20,
            seuil: [{ id: 'a', label: 'A', sectionId: 'caracteristiques' }, { id: 'b', label: 'B', sectionId: 'caracteristiques' }],
            coc: { sante: 'echelle_de_sante', evolution: { champ: 'evolution_absente' } },
        },
        combat: { initiativeFormula: '10', statsToTrack: [], encaissement: { mecanique: 'coc', sante: 'echelle_de_sante', rd: 'rd_absente' } },
    } as unknown as GameDriver;
    const r = controlerLePilote(d, fiche);
    const ou = (cle: string, gravite: string) => r.some(c => c.ou === cle && c.gravite === gravite);
    expect(ou('jet.coc', 'avertissement')).toBe(true);
    expect(ou('jet.critique', 'avertissement')).toBe(true);
    expect(ou('jet.coc', 'erreur')).toBe(true);
    expect(ou('combat.encaissement.rd', 'erreur')).toBe(true);
    expect(ou('combat.encaissement', 'avertissement')).toBe(true);
});
