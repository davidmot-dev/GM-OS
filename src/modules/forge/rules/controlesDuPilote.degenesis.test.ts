import { expect, it } from 'vitest';
import { controlerLePilote } from './controlesDuPilote';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/** Le contrôle des règles Degenesis du pilote (2026-10-30). */
const fiche = { id: 't', sections: [{ id: 'attributs', fields: [
    { id: 'psyche', type: 'number' }, { id: 'reactivite', type: 'number' }, { id: 'traumatismes', type: 'number' },
    { id: 'blessures_superficielles', type: 'number' },
] }] } as unknown as SheetTemplate;

it('la Forge refuse des pistes de santé et un jet Degenesis qui lisent des champs absents', () => {
    const d = {
        dice: { engine: 'pool', successThreshold: 6 },
        jet: { sens: 'superieur-ou-egal', reserve: { base: 0, max: 12, faces: 6 }, degenesis: { traumatismes: 'traumatismes', ego: 'ego_absent' } },
        combat: {
            initiativeFormula: '', initiativeEnReserve: { mecanique: 'degenesis' }, statsToTrack: [],
            pistesDeSante: { mecanique: 'degenesis', blessures: 'blessures_superficielles', traumatismes: 'trauma_absent' },
        },
    } as unknown as GameDriver;
    const r = controlerLePilote(d, fiche);
    const ou = (cle: string, gravite: string) => r.some(c => c.ou === cle && c.gravite === gravite);
    expect(ou('jet.degenesis.ego', 'erreur')).toBe(true);
    expect(ou('dice.successThreshold', 'avertissement')).toBe(true);
    expect(ou('combat.pistesDeSante.traumatismes', 'erreur')).toBe(true);
    expect(ou('combat.pistesDeSante.blessures', 'avertissement')).toBe(true);
    expect(ou('combat.initiativeEnReserve', 'erreur')).toBe(true);
});
