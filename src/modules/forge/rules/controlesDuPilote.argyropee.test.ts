import { expect, it } from 'vitest';
import { controlerLePilote } from './controlesDuPilote';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/** Le contrôle du test d'Argyropée (2026-11-08) : le pilote forgé échouait à chaque test. */
const fiche = { id: 't', sections: [
    { id: 'competences', fields: [{ id: 'serrurerie', type: 'number' }] },
    { id: 'metiers', fields: [{ id: 'metier1_nom', type: 'text' }, { id: 'metier1_bonus', type: 'number' }] },
    { id: 'jauges', fields: [{ id: 'panache', type: 'number' }] },
] } as unknown as SheetTemplate;
const seuil = [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }];

it('le pilote 2.0.0 d’Argyropée passe sans constat', () => {
    const d = {
        dice: { defaultDice: '1d10', logic: 'sum', engine: 'standard' },
        jet: { sens: 'superieur-ou-egal', seuil, reserve: { base: 1, max: 1, faces: 10 },
            argyropee: { panache: 'panache', metiers: [{ nom: 'metier1_nom', bonus: 'metier1_bonus' }] } },
        combat: { initiativeFormula: '1d10', statsToTrack: [] },
    } as unknown as GameDriver;
    expect(controlerLePilote(d, fiche).filter(c => c.ou.startsWith('jet'))).toEqual([]);
});

it('la Forge signale les critiques sur le dé, la difficulté en réussites et les champs absents', () => {
    const d = {
        dice: { defaultDice: '1d10', logic: 'sum', engine: 'standard' },
        jet: { sens: 'superieur-ou-egal', seuil, reserve: { base: 1, max: 1, faces: 10 }, critique: 15, complication: 8,
            difficulte: { min: 1, max: 1, defaut: 1 },
            argyropee: { panache: 'panache_absent', metiers: [{ nom: 'metier1_nom', bonus: 'bonus_absent' }] } },
        combat: { initiativeFormula: '1d10', statsToTrack: [] },
    } as unknown as GameDriver;
    const r = controlerLePilote(d, fiche);
    const ou = (cle: string, gravite: string) => r.some(c => c.ou === cle && c.gravite === gravite);
    expect(ou('jet.critique', 'avertissement')).toBe(true);
    expect(ou('jet.difficulte', 'avertissement')).toBe(true);
    expect(ou('jet.argyropee.panache', 'erreur')).toBe(true);
    expect(ou('jet.argyropee.metiers.0', 'erreur')).toBe(true);
});

it('la Forge signale les champs absents de la Faveur divine, de la magie et de la Guigne (09/11/2026)', () => {
    const d = {
        dice: { defaultDice: '1d10', logic: 'sum', engine: 'standard' },
        jet: { sens: 'superieur-ou-egal', seuil, reserve: { base: 1, max: 1, faces: 10 },
            argyropee: { panache: 'panache', faveur: { competence: 'serrurerie', prieres: 'prieres_absentes' },
                magie: { sorts: ['sort_absent'], combat: 'panache' }, guigne: { depense: 'panache', offert: 'offrande_absente' } } },
        combat: { initiativeFormula: '1d10', statsToTrack: [] },
    } as unknown as GameDriver;
    const ou = controlerLePilote(d, fiche).filter(c => c.gravite === 'erreur').map(c => c.ou);
    expect(ou).toEqual(expect.arrayContaining(['jet.argyropee.faveur.prieres', 'jet.argyropee.magie.sorts.0', 'jet.argyropee.guigne.offert']));
    expect(ou).not.toContain('jet.argyropee.faveur.competence');
});
