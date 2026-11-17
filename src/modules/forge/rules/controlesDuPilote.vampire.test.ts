import { expect, it } from 'vitest';
import { controlerLePilote } from './controlesDuPilote';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/** Le contrôle des règles Vampire V5 du pilote (2026-11-17). */
const fiche = { id: 't', sections: [{ id: 'attributs', fields: [
    { id: 'dexterite', type: 'number' }, { id: 'melee', type: 'number' }, { id: 'soif', type: 'number' }, { id: 'volonte', type: 'gauge' },
] }] } as unknown as SheetTemplate;
const reserve = { base: 0, max: 30, sansPlafond: true, faces: 10, composantes: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }] };

it('la Forge signale le pilote forgé : un seuil composé sur une réserve sans composante', () => {
    const d = {
        dice: { engine: 'standard', successThreshold: 6 },
        jet: {
            seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }],
            reserve: { base: 0, max: 10, faces: 10, cout: [1, 2, 3] }, sens: 'superieur-ou-egal',
            vampire: { soif: 'soif_absente', volonte: 'volonte_absente' },
        },
        combat: { statsToTrack: [] },
    } as unknown as GameDriver;
    const r = controlerLePilote(d, fiche);
    const ou = (cle: string, gravite: string) => r.some(c => c.ou === cle && c.gravite === gravite);
    expect(ou('jet.vampire', 'avertissement')).toBe(true);
    expect(ou('jet.vampire.soif', 'erreur')).toBe(true);
    expect(ou('jet.vampire.volonte', 'erreur')).toBe(true);
    expect(ou('jet.reserve.cout', 'avertissement')).toBe(true);
});

it('un pilote Vampire selon le livre passe sans constat sur le jet', () => {
    const d = {
        dice: { engine: 'standard', successThreshold: 6 },
        jet: { reserve, sens: 'superieur-ou-egal', difficulte: { min: 1, max: 10, defaut: 3 }, vampire: { soif: 'soif', volonte: 'volonte' } },
        combat: { statsToTrack: [] },
    } as unknown as GameDriver;
    expect(controlerLePilote(d, fiche).filter(c => c.ou.startsWith('jet') || c.ou.startsWith('dice'))).toEqual([]);
});

it('un d10 de Vampire réussit sur 6, et pas sur 8', () => {
    const d = {
        dice: { engine: 'standard', successThreshold: 8 },
        jet: { reserve, sens: 'superieur-ou-egal', vampire: { soif: 'soif' } },
        combat: { statsToTrack: [] },
    } as unknown as GameDriver;
    expect(controlerLePilote(d, fiche).some(c => c.ou === 'dice.successThreshold')).toBe(true);
});

it('les dégâts case par case : champs absents et jauge sans maximum sont signalés (p. 126)', () => {
    const d = {
        dice: { engine: 'standard', successThreshold: 6 },
        jet: { reserve, sens: 'superieur-ou-egal', vampire: {
            soif: 'soif', volonte: 'volonte',
            degats: { sante: 'sante_degats', volonte: 'volonte_degats', jaugeDeSante: 'sante' },
            puissance: 'puissance_absente',
        } },
        combat: { statsToTrack: [{ fieldId: 'pv', label: 'PV', isMainHP: true }, { fieldId: 'volonte', label: 'Volonté' }] },
    } as unknown as GameDriver;
    const r = controlerLePilote(d, fiche);
    expect(r.filter(c => c.ou === 'jet.vampire.degats.sante' && c.gravite === 'erreur')).toHaveLength(1);
    expect(r.some(c => c.ou === 'jet.vampire.degats.jaugeDeSante' && c.gravite === 'avertissement' && /santé principale est « pv »/.test(c.message))).toBe(true);
    expect(r.some(c => c.ou === 'combat.statsToTrack' && /« volonte » n'a pas de maximum/.test(c.message))).toBe(true);
    expect(r.some(c => c.ou === 'jet.vampire' && /puissance_absente/.test(c.message))).toBe(true);
});

it('un bestiaire dont aucune colonne ne donne la santé est signalé, pas celui qui la donne', () => {
    const base = {
        dice: { engine: 'standard', successThreshold: 6 },
        jet: { reserve, sens: 'superieur-ou-egal', vampire: { soif: 'soif' } },
        combat: { santeDeDepart: 'vigueur + 3', statsToTrack: [{ fieldId: 'volonte', label: 'Santé', isMainHP: true }] },
    };
    const creatures = [{ id: 'lieutenant', nom: 'Lieutenant de police', valeurs: { sante: 6 } }];
    const sans = { ...base, bestiaire: { colonnes: [{ id: 'sante', libelle: 'Santé', nature: 'nombre' }], creatures } } as unknown as GameDriver;
    const avec = { ...base, bestiaire: { colonnes: [{ id: 'sante', libelle: 'Santé', nature: 'nombre', champ: 'volonte' }], creatures } } as unknown as GameDriver;
    expect(controlerLePilote(sans, fiche).some(c => c.ou === 'bestiaire.colonnes')).toBe(true);
    expect(controlerLePilote(avec, fiche).some(c => c.ou === 'bestiaire.colonnes')).toBe(false);
});
