import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { describe, it, expect } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';
import { preparerLeJet } from '../../src/modules/dice/DescripteurDeJet';

/**
 * **Le pilote RuneQuest 2.1.0 remis à David** (30/10/2026, `finir_runequest.py`). Sauté
 * tant que le fichier n'est pas là : `Export Dirvers/` ne se commite pas.
 */
const fichier = 'Export Dirvers/corriges/RQ_driver_gmos_finir.gmos-driver';
describe.skipIf(!fs.existsSync(fichier))('export RuneQuest 2.1.0 fourni à David', () => {
    const x = JSON.parse(new AdmZip(fichier).getEntry('state.json')!.getData().toString('utf8'));
    const sections = x.sheetTemplate.sections;
    const defauts = Object.fromEntries(sections.flatMap((s: { fields: { id: string; defaultValue?: unknown }[] }) =>
        s.fields.map(f => [f.id, f.defaultValue])));

    it('ne produit aucun constat de la Forge et préserve les identifiants', () => {
        expect(controlerLePilote(x.gameDriver, x.sheetTemplate)).toEqual([]);
        expect(x.gameDriver.id).toBe('custom-1793114851695');
        expect(x.sheetTemplate.id).toBe('tpl-1793114851695');
        expect(x.gameDriver.version).toBe('2.1.0');
        const ids = sections.flatMap((s: { fields: { id: string }[] }) => s.fields.map(f => f.id));
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('lance une compétence de la fiche avec les plages du livre (p. 143)', () => {
        const jet = preparerLeJet(x.gameDriver.jet, { ...defauts, observation: 56 }, { champs: { aptitude: 'observation' } }, sections);
        expect(jet.avertissements).toEqual([]);
        expect(jet.echelle).toMatchObject({ chances: 56, particuliere: 3, significative: 11, echecTotal: 99 });
    });

    it('teste une caractéristique ×5, et une Rune telle quelle', () => {
        expect(preparerLeJet(x.gameDriver.jet, { ...defauts, con: 12 }, { champs: { aptitude: 'con' } }, sections).seuil).toBe(60);
        expect(preparerLeJet(x.gameDriver.jet, { ...defauts, rune_air: 60 }, { champs: { aptitude: 'rune_air' } }, sections).seuil).toBe(60);
    });

    it('ne propose pas les dégâts ni le rang d’action d’une arme comme aptitude', () => {
        const motif = new RegExp(x.gameDriver.jet.seuil[0].motif);
        expect(motif.test('arme1')).toBe(true);
        expect(motif.test('arme1_degats')).toBe(false);
        expect(motif.test('arme1_ra')).toBe(false);
        expect(motif.test('ra_dex')).toBe(true);
    });

    it('déclare les sept zones des coups localisés, hors du menu des aptitudes (p. 146)', () => {
        const zones = x.gameDriver.combat.coupsLocalises.zones;
        expect(Object.keys(zones)).toEqual(['jambe-droite', 'jambe-gauche', 'abdomen', 'poitrine', 'bras-droit', 'bras-gauche', 'tete']);
        expect(zones.tete).toEqual({ pv: 'pv_tete', armure: 'pa_tete', degats: 'degats_tete' });
        expect(defauts.degats_tete).toBe(0);
        const duJet = [x.gameDriver.jet.seuil[0].sectionId, ...(x.gameDriver.jet.seuil[0].sectionsSupplementaires ?? [])];
        expect(duJet).not.toContain('localisations');
    });
});
