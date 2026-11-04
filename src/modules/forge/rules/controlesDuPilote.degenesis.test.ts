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

it("la Forge refuse une attaque Degenesis qui lit des champs absents (DEG-A2, 03/11)", () => {
    const d = {
        dice: { engine: 'pool', successThreshold: 4 },
        jet: { sens: 'superieur-ou-egal', reserve: { base: 0, max: 12, faces: 6 }, degenesis: { combat: {
            force: ['psyche', 'force_absente'], attaques: ['reactivite'], aDistance: ['tir_absent'],
            armes: [{ nom: 'arme1', degats: 'arme1_degats' }], armures: [{ valeur: 'traumatismes' }],
            defenses: { 'parade-lutte': ['psyche'] },
        } } },
        combat: { statsToTrack: [] },
    } as unknown as GameDriver;
    const r = controlerLePilote(d, fiche);
    const ou = (cle: string) => r.some(c => c.ou === cle && c.gravite === 'erreur');
    expect(ou('jet.degenesis.combat.force[1]')).toBe(true);
    expect(ou('jet.degenesis.combat.force[0]')).toBe(false);
    expect(ou('jet.degenesis.combat.aDistance[0]')).toBe(true);
    expect(ou('jet.degenesis.combat.armes[0].nom')).toBe(true);
    expect(ou('jet.degenesis.combat.armures[0].valeur')).toBe(false);
    expect(ou('jet.degenesis.combat.defenses.esquive')).toBe(true);
});

it('la Forge refuse des maxima et des réserves de confrontation qui lisent des champs absents (DEG-A3, DEG-A4, 04/11)', () => {
    const d = {
        dice: { engine: 'pool', successThreshold: 4 },
        jet: { sens: 'superieur-ou-egal', reserve: { base: 0, max: 12, faces: 6 }, degenesis: {
            maxima: {
                ego: { champ: 'ego_max_absent', branches: [{ cle: 'c', libelle: 'C', attribut: 'psyche', competence: 'concentration_absente' }] },
                blessures: { jauge: 'blessures_superficielles', champs: ['psyche', 'resistance_absente'] },
            },
            reserves: [{ attribut: 'psyche', competences: ['reactivite', 'ruse_absente'] }],
        } },
        combat: { statsToTrack: [] },
    } as unknown as GameDriver;
    const r = controlerLePilote(d, fiche);
    const ou = (cle: string, gravite = 'erreur') => r.some(c => c.ou === cle && c.gravite === gravite);
    expect(ou('jet.degenesis.maxima.ego.champ')).toBe(true);
    expect(ou('jet.degenesis.maxima.ego.branches')).toBe(true);
    expect(ou('jet.degenesis.maxima.ego.branches[0].competence')).toBe(true);
    expect(ou('jet.degenesis.maxima.ego.branches[0].attribut')).toBe(false);
    expect(ou('jet.degenesis.maxima.blessures.champs[1]')).toBe(true);
    expect(ou('jet.degenesis.maxima.blessures.jauge', 'avertissement')).toBe(true);
    expect(ou('jet.degenesis.reserves[0].competences[1]')).toBe(true);
    expect(ou('jet.degenesis.reserves[0].competences[0]')).toBe(false);
});
