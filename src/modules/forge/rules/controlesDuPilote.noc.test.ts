import { expect, it } from 'vitest';
import { controlerLePilote } from './controlesDuPilote';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
const fiche = { id: 't', sections: [{ id: 'talents', fields: [{ id: 'ferveur', type: 'number' }] }] } as unknown as SheetTemplate;
it('la Forge refuse une Singularité dans le vide et des 10 déjà imposés par le moteur', () => {
    const d = { dice: { engine: 'pool_explode' }, jet: { destin: { singularite: 'introuvable', desSurDixAuChoix: true } } } as unknown as GameDriver;
    const r = controlerLePilote(d, fiche);
    expect(r.some(c => c.ou === 'jet.destin.singularite' && c.gravite === 'erreur')).toBe(true);
    expect(r.some(c => c.ou === 'dice.engine' && c.gravite === 'erreur')).toBe(true);
});
it('la Forge valide le Talent qui donne le rendement d’Espoir et son seuil', () => {
    const d = { jet: { reservesDuPersonnage: [{ id: 'espoir', label: 'Espoir', effet: 'des', parPoint: 3, stocks: [], parPointSelon: { champ: 'absent', aPartirDe: 0 } }] } } as unknown as GameDriver;
    expect(controlerLePilote(d, fiche).some(c => c.ou.endsWith('parPointSelon'))).toBe(true);
    d.jet!.reservesDuPersonnage![0].parPointSelon = { champ: 'ferveur', aPartirDe: 4 };
    expect(controlerLePilote(d, fiche).some(c => c.ou.endsWith('parPointSelon'))).toBe(false);
});
