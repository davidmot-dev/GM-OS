import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { describe, it, expect } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';
import { preparerLeJet } from '../../src/modules/dice/DescripteurDeJet';
import { calculerLesDerives } from '../../src/modules/dice/systemes/derivesDeRuneQuest';

/**
 * **Le pilote RuneQuest remis à David** (2.1.0 le 30/10/2026, 2.2.0 le 03/11 : RQ-A3 et RQ-A4, 2.3.0 le même jour : RQ-A5 et RQ-A6,
 * `finir_runequest.py`). Sauté
 * tant que le fichier n'est pas là : `Export Dirvers/` ne se commite pas.
 */
const fichier = 'Export Dirvers/corriges/RQ_driver_gmos_finir.gmos-driver';
describe.skipIf(!fs.existsSync(fichier))('export RuneQuest 2.3.0 fourni à David', () => {
    const x = JSON.parse(new AdmZip(fichier).getEntry('state.json')!.getData().toString('utf8'));
    const sections = x.sheetTemplate.sections;
    const defauts = Object.fromEntries(sections.flatMap((s: { fields: { id: string; defaultValue?: unknown }[] }) =>
        s.fields.map(f => [f.id, f.defaultValue])));

    it('ne produit aucun constat de la Forge et préserve les identifiants', () => {
        expect(controlerLePilote(x.gameDriver, x.sheetTemplate)).toEqual([]);
        expect(x.gameDriver.id).toBe('custom-1793114851695');
        expect(x.sheetTemplate.id).toBe('tpl-1793114851695');
        expect(x.gameDriver.version).toBe('2.3.0');
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

    it('déclare les armes de la feuille et les rangs d’action (RQ-A3, RQ-A4)', () => {
        const rq = x.gameDriver.jet.runequest;
        expect(rq.armes).toHaveLength(8);
        expect(rq.armes[0]).toEqual({ score: 'arme1', nom: 'arme1_nom', degats: 'arme1_degats', ra: 'arme1_ra', durabilite: 'arme1_durabilite', genre: 'melee' });
        expect(rq.armes.at(-1)).toMatchObject({ score: 'bouclier', durabilite: 'bouclier_pv', genre: 'bouclier' });
        expect(rq.bonusAuxDegats).toBe('bonus_degats');
        expect(x.gameDriver.combat.initiative).toEqual({ mode: 'rangs-d-action' });
        expect(x.gameDriver.combat.rangsDAction).toEqual({ mecanique: 'runequest', dex: 'dex', raDex: 'ra_dex', raTai: 'ra_tai' });
    });

    it('nomme le champ lancé, pour retrouver l’arme', () => {
        const jet = preparerLeJet(x.gameDriver.jet, { ...defauts, arme1: 65 }, { champs: { aptitude: 'arme1' } }, sections);
        expect(jet.runequest?.champ).toBe('arme1');
    });

    it('calcule les attributs de Vasana sur la fiche du pilote (RQ-A5, p. 54-59)', () => {
        const vasana = { ...defauts, for: 16, con: 12, tai: 10, dex: 11, int: 15, pou: 15, cha: 19 };
        const d = calculerLesDerives(x.gameDriver.jet.runequest.derives, vasana);
        const valeur = (cle: string) => d.lignes.find(l => l.cle === cle)?.calcule;
        expect(d.manquantes).toEqual([]);
        expect([valeur('pv-max'), valeur('bonus-degats'), valeur('enc-max'), valeur('zone-poitrine'), valeur('categorie-magie')]).toEqual([12, '+1D4', 14, 5, 10]);
        expect(d.lignes.filter(l => l.cle.startsWith('armes-')).map(l => l.calcule)).toEqual([5, 5, 5, 5]);
    });

    it('nomme la magie des deux cultes et la progression (RQ-A6)', () => {
        const rq = x.gameDriver.jet.runequest;
        expect(rq.magie.cultes.map((c: { pr: string; veneration: string }) => [c.pr, c.veneration])).toEqual([['points_de_rune', 'veneration'], ['points_de_rune_2', 'veneration_2']]);
        expect(rq.progression.runes).toHaveLength(16);
        expect(rq.progression.opposees).toContainEqual(['rune_stase', 'rune_mouvement']);
        expect(rq.progression.categories.competences_armes).toBe('mod_manipulation');
    });

    it('ajoute l’inspiration en cours au jet de l’aptitude inspirée, et à elle seule (RQ-A6, p. 236)', () => {
        const etat = { version: 1, situationTentee: true, malusDesRunes: {}, runesInspirees: [], coches: ['passion1'],
            inspiration: { source: 'passion1', sourceLibelle: 'Haine', genre: 'passion', niveau: 'reussite-speciale', aptitude: 'arme1', aptitudeLibelle: 'Épée large', bonus: 30 } };
        const fiche = { ...defauts, arme1: 65, esquive: 35, _gmos_runequest: etat };
        const inspire = preparerLeJet(x.gameDriver.jet, fiche, { champs: { aptitude: 'arme1' } }, sections);
        expect(inspire.seuil).toBe(95);
        expect(inspire.runequest?.explication).toContain('+ 30 inspiration (Haine)');
        expect(preparerLeJet(x.gameDriver.jet, fiche, { champs: { aptitude: 'esquive' } }, sections).seuil).toBe(35);
    });
});
