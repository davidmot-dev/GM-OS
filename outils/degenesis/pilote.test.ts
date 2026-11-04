import fs from 'node:fs';
import AdmZip from 'adm-zip';
import { describe, it, expect } from 'vitest';
import { controlerLePilote } from '../../src/modules/forge/rules/controlesDuPilote';
import { preparerLeJet } from '../../src/modules/dice/DescripteurDeJet';
import { calculerLesMaxima, appliquerLEgoMaximal, CLE_DEGENESIS } from '../../src/modules/dice/systemes/maximaDeDegenesis';
import { bonusDeLaStimulation, inhaler } from '../../src/modules/dice/systemes/contaminationDeDegenesis';
import { santeDeDepart, valeurDuChamp } from '../../src/modules/combat/logic/SanteDuCombattant';
import { calculerLeCoup, lireLaManiabilite, lireLesDegats, lireLesProprietes, sommeDesChamps } from '../../src/modules/dice/systemes/combatDeDegenesis';

/**
 * **Le pilote Degenesis remis à David** (2.0.0 le 30/10/2026, `finir_degenesis.py` ; 2.1.0 le
 * 03/11 : DEG-A1 et DEG-A2, `combat_degenesis.py` ; 2.2.0 le 04/11 : DEG-A3 et DEG-A4,
 * `maxima_et_jets_lies_degenesis.py` ; 2.3.0 le 04/11 : DEG-A5 et DEG-A6, `contamination_degenesis.py`). Sauté tant que le fichier n'est pas là :
 * `Export Dirvers/` ne se commite pas.
 */
const fichier = 'Export Dirvers/corriges/Degenesis_driver_gmos_finir.gmos-driver';
describe.skipIf(!fs.existsSync(fichier))('export Degenesis 2.3.0 fourni à David', () => {
    const x = JSON.parse(new AdmZip(fichier).getEntry('state.json')!.getData().toString('utf8'));
    const sections = x.sheetTemplate.sections;
    const defauts = Object.fromEntries(sections.flatMap((s: { fields: { id: string; defaultValue?: unknown }[] }) =>
        s.fields.map(f => [f.id, f.defaultValue])));
    const combat = x.gameDriver.jet.degenesis.combat;

    it('ne produit aucun constat de la Forge et préserve les identifiants', () => {
        expect(controlerLePilote(x.gameDriver, x.sheetTemplate)).toEqual([]);
        expect(x.gameDriver.id).toBe('custom-1793142284065');
        expect(x.gameDriver.version).toBe('2.3.0');
        expect(x.gameDriver.combat.initiativeEnReserve).toEqual({ mecanique: 'degenesis' });
        const ids = sections.flatMap((s: { fields: { id: string }[] }) => s.fields.map(f => f.id));
        expect(ids).toHaveLength(131);
    });

    it("Falberg à l'épée bâtarde, +1D de maniabilité et +2D d'Égo de l'initiative : dix dés (p. 100, 103)", () => {
        const falberg = { ...defauts, physique: 4, corps_a_corps: 3, force: 3, arme1: 'Épée bâtarde', arme1_degats: '4+F/2', arme1_maniabilite: '+1D' };
        const jet = preparerLeJet(x.gameDriver.jet, falberg,
            { champs: { attribut: 'physique', competence: 'corps_a_corps' }, degenesis: { modificateur: lireLaManiabilite(falberg.arme1_maniabilite), ego: 2 } }, sections);
        expect(jet.avertissements).toEqual([]);
        expect(jet.degenesis).toMatchObject({ base: 7, valeur: 10, des: 10 });
        expect(combat.attaques).toContain('corps_a_corps');
        expect(lireLesDegats(falberg.arme1_degats, sommeDesChamps(falberg, combat.force))).toEqual({ base: 8, detail: '4 + F/2 (7 → 4)' });
    });

    it('le défricheur de Vedran contre la chemise de mailles de l’Usudi : 10 dégâts nets (p. 107)', () => {
        const coup = calculerLeCoup({ base: 11, declencheurs: 1, armure: 2, proprietes: lireLesProprietes('') });
        expect(coup.nets).toBe(10);
        expect(combat.armures).toEqual([{ nom: 'armure1', valeur: 'armure1_valeur' }, { nom: 'armure2', valeur: 'armure2_valeur' }]);
        expect(combat.defenses.esquive).toEqual(['agilite', 'mobilite']);
        expect(combat.aDistance).toEqual(['armes_a_projectiles']);
    });

    it('INT 3 + Concentration 2 : Égo max 10, sans remplir la jauge ; les trois autres maxima suivent le pilote (p. 26, 94)', () => {
        const fiche = { ...defauts, intellect: 3, concentration: 2, instinct: 2, psyche: 2, foi: 2, physique: 3, resistance: 2, ego_max: 8, ego_jauge: 6 };
        const stats = x.gameDriver.combat.statsToTrack as { fieldId: string; max: string }[];
        const duPilote = (jauge: string) => santeDeDepart(stats.find(s => s.fieldId === jauge)?.max, c => valeurDuChamp(fiche, c));
        const m = calculerLesMaxima(x.gameDriver.jet.degenesis.maxima, fiche, duPilote);
        expect(m.lignes.map(l => [l.cle, l.surLaFiche, l.calcule])).toEqual([
            ['ego', 8, 10], ['sporulations', 8, 8], ['blessures', 10, 10], ['traumatismes', 5, 5],
        ]);
        expect(appliquerLEgoMaximal(x.gameDriver.jet.degenesis.maxima, fiche, m)).toEqual({ ego_max: 10 });
    });

    it('la confrontation compose une réserve de chaque attribut et de ses six compétences (p. 19-20)', () => {
        const r = x.gameDriver.jet.degenesis.reserves as { attribut: string; competences: string[] }[];
        expect(r.map(a => a.attribut)).toEqual(['physique', 'agilite', 'charisme', 'intellect', 'psyche', 'instinct']);
        expect(r.every(a => a.competences.length === 6)).toBe(true);
        expect(r.find(a => a.attribut === 'psyche')!.competences).toContain('tromperie');
    });

    it('une Brûlure intense de Muse : Égo et Sporulation de la fiche, puis +Puissance à INS + Perception (p. 189-190)', () => {
        const con = x.gameDriver.jet.degenesis.contamination;
        const fiche = { ...defauts, ego_jauge: 3, ego_max: 8, sporulations_jauge: 2 };
        const r = inhaler(con, fiche, 'muse', true, 8, () => 4, CLE_DEGENESIS);
        expect(r.maj).toMatchObject({ ego_jauge: 7, sporulations_jauge: 6 });
        expect(bonusDeLaStimulation(r.stimulation, con, ['instinct', 'perception'], fiche)).toMatchObject({ des: 4 });
        expect(con.potentiels).toHaveLength(6);
        expect(con.attributs).toEqual(['physique', 'agilite', 'charisme', 'intellect', 'psyche', 'instinct']);
    });
});
