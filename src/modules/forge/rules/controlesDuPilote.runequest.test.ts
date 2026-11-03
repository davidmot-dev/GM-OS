import { expect, it } from 'vitest';
import { controlerLePilote } from './controlesDuPilote';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/** Le contrôle des armes et des rangs d'action de RuneQuest (RQ-A3, RQ-A4, 2026-11-03). */
const fiche = { id: 't', sections: [{ id: 'combat', fields: [
    { id: 'dex', type: 'number' }, { id: 'ra_dex', type: 'number' }, { id: 'arme1', type: 'number' },
    { id: 'arme1_degats', type: 'text' }, { id: 'bonus_degats', type: 'text' },
] }] } as unknown as SheetTemplate;

const pilote = (combat: Record<string, unknown>, runequest: Record<string, unknown>) => ({
    dice: { engine: 'standard' },
    jet: { sens: 'sous-ou-egal', seuil: [{ id: 'aptitude', label: 'Aptitude', sectionId: 'combat' }], reserve: { base: 1, max: 1, faces: 100 }, runequest },
    combat: { initiativeFormula: 'ra_dex', statsToTrack: [], ...combat },
} as unknown as GameDriver);

it('la Forge refuse des armes et des rangs d’action qui lisent des champs absents', () => {
    const r = controlerLePilote(pilote(
        { initiative: { mode: 'rangs-d-action' }, rangsDAction: { mecanique: 'runequest', dex: 'dex', raDex: 'ra_dex', raTai: 'ra_tai_absent' } },
        { armes: [{ score: 'arme1', degats: 'arme1_degats', ra: 'arme1_ra_absent', genre: 'melee' }], bonusAuxDegats: 'bonus_degats', con: 'con_absente' },
    ), fiche);
    const erreurs = r.filter(c => c.gravite === 'erreur').map(c => `${c.ou} ${c.message}`);
    expect(erreurs.some(e => e.startsWith('combat.rangsDAction.raTai') && e.includes('ra_tai_absent'))).toBe(true);
    expect(erreurs.some(e => e.startsWith('jet.runequest.armes') && e.includes('arme1_ra_absent'))).toBe(true);
    expect(erreurs.some(e => e.startsWith('jet.runequest ') && e.includes('con_absente'))).toBe(true);
    expect(erreurs.some(e => e.startsWith('combat.initiative.mode'))).toBe(false);
});

it('le mode « rangs-d-action » sans sa déclaration est une erreur', () => {
    const r = controlerLePilote(pilote({ initiative: { mode: 'rangs-d-action' } }, {}), fiche);
    expect(r.some(c => c.ou === 'combat.rangsDAction' && c.gravite === 'erreur')).toBe(true);
});

it('la Forge refuse des attributs, une magie et une progression qui lisent des champs absents (RQ-A5, RQ-A6)', () => {
    const r = controlerLePilote(pilote({}, {
        derives: { caracteristiques: { for: 'for_absente' }, pvMax: 'pv_max_absent', zones: { tete: 'pv_tete_absent' }, modificateursDArmes: [{ champ: 'mod_armes_absent', libelle: 'Armes' }] },
        magie: { pm: 'pm_absent', pou: 'dex', cultes: [{ nom: 'culte_absent', pr: 'pr_absent' }] },
        progression: { runes: ['rune_absente'], opposees: [], passions: [], categories: { section_absente: 'mod_absent', combat: 'dex' } },
    }), fiche);
    const erreurs = r.filter(c => c.gravite === 'erreur').map(c => `${c.ou} ${c.message}`);
    for (const absent of ['for_absente', 'pv_max_absent', 'pv_tete_absent', 'mod_armes_absent', 'pm_absent', 'culte_absent', 'pr_absent', 'rune_absente', 'mod_absent']) {
        expect(erreurs.some(e => e.includes(`« ${absent} »`)), absent).toBe(true);
    }
    expect(erreurs.some(e => e.startsWith('jet.runequest.progression.categories') && e.includes('« section_absente »'))).toBe(true);
    expect(erreurs.some(e => e.includes('« dex »'))).toBe(false);
});
