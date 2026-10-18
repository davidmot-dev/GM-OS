import { describe, expect, it } from 'vitest';
import { CLE_SUIVI_FATIGUE, etatDuVoyageur, malusDuJetVoyageur, proposerFatigue, segmentsDeFatigue, suivrePerteDEndurance } from './fatigueDuVoyageur';

const nitouche = {endurance_max: 23, endurance: 23, vie_max: 11, vie: 11, fatigue: 0, [CLE_SUIVI_FATIGUE]: 1};
describe('fatigue du Voyageur — règles 2.3.1', () => {
    it('la table imprimée produit exactement deux fois l’endurance, et huit lignes', () => {
        for (let e = 16; e <= 30; e++) {
            const s = segmentsDeFatigue(e)!;
            expect(s).toHaveLength(12);expect(s.reduce((a,b) => a+b)).toBe(e*2);
            expect(etatDuVoyageur({...nitouche, endurance_max: e}).segments.map(s => s.ligne)).toEqual([0,0,0,-1,-1,-1,-2,-3,-4,-5,-6,-7]);
        }
        expect(segmentsDeFatigue(23)).toEqual([3,4,4,4,4,4,3,4,4,4,4,4]);
        expect(segmentsDeFatigue(36)).toEqual(Array(12).fill(6));
        expect(segmentsDeFatigue(31)).toBeNull();expect(segmentsDeFatigue(0)).toBeNull();
    });
    it.each([[0,0],[11,0],[12,-1],[23,-1],[24,-2],[26,-2],[27,-3],[30,-3],[31,-4],[34,-4],[35,-5],[38,-5],[39,-6],[42,-6],[43,-7],[46,-7]])(
        'fatigue %s : le malus %s commence à la première case de la ligne', (fatigue, attendu) => {
            expect(etatDuVoyageur({...nitouche, fatigue}).fatigueMalus).toBe(attendu);
        });
    it('cumule les composantes et respecte les exceptions, y compris CHANCE choisie comme caractéristique', () => {
        const e = etatDuVoyageur({...nitouche, fatigue: 24, vie: 8, ethylisme: 2, surencombrement: 1});
        expect(e).toMatchObject({fatigueMalus: -2, vieMalus: -3, ethylismeMalus: -2, encombrementMalus: -1, total: -8});
        expect(malusDuJetVoyageur(e, 'action', 'reve')).toBe(-8);
        expect(malusDuJetVoyageur(e, 'action', 'chance')).toBe(0);
        for (const n of ['chance','guerison','stress','resistance'] as const) expect(malusDuJetVoyageur(e,n,'constitution')).toBe(0);
        expect(malusDuJetVoyageur(e,'ethylisme','constitution')).toBe(-5);
        expect(etatDuVoyageur({...nitouche, vie: -2}).vieMalus).toBe(-13);
    });
    it('propose le barème des efforts sans écrire ni consommer l’endurance', () => {
        const d = structuredClone(nitouche);
        expect(proposerFatigue(d,'intellectuel',2).maj).toMatchObject({fatigue:2,endurance:23});
        expect(proposerFatigue(d,'veille',3).apres).toBe(3);
        expect(proposerFatigue(d,'physique',2).apres).toBe(4);
        expect(proposerFatigue(d,'extenuant',3,6).apres).toBe(18);
        expect(proposerFatigue(d,'tmr',5).apres).toBe(5);
        expect(proposerFatigue(d,'libre',100).apres).toBe(46);
        expect(d).toEqual(nitouche);
        expect(() => proposerFatigue(d,'extenuant',1,7)).toThrow();
        expect(() => proposerFatigue(d,'libre',-1)).toThrow();
    });
    it('perte ordinaire : fatigue égale à l’endurance effectivement perdue ; l’alcool faible la diffère', () => {
        expect(proposerFatigue({...nitouche,endurance:2},'endurance',8).maj).toMatchObject({endurance:0,fatigue:2});
        const alcool = proposerFatigue({...nitouche,ethylisme:2},'alcool',4);
        expect(alcool.maj).toMatchObject({endurance:19,fatigue:0,fatigue_differee:4});
        expect(proposerFatigue({...nitouche,...alcool.maj},'differee',1).maj).toMatchObject({fatigue:4,fatigue_differee:0});
        expect(proposerFatigue({...nitouche,...alcool.maj,ethylisme:4},'alcool',3).maj).toMatchObject({endurance:16,fatigue:7,fatigue_differee:0});
    });
    it('l’exemple de Nitouche : 13 cases → 11 ; avec une seule case entamée, 12 → 7', () => {
        expect(proposerFatigue({...nitouche,fatigue:13},'sommeil',1).apres).toBe(11);
        expect(proposerFatigue({...nitouche,fatigue:12},'sommeil',1).apres).toBe(7);
        expect(proposerFatigue({...nitouche,fatigue:13},'sommeil',4).apres).toBe(0);
        expect(proposerFatigue({...nitouche,fatigue:13,endurance:20},'sommeil',10).maj).toMatchObject({fatigue:3,endurance:20});
        // Exactement la moitié d'un segment de 4 ne donne pas le segment précédent.
        expect(proposerFatigue({...nitouche,fatigue:9},'sommeil',1).apres).toBe(7);
    });
    it('une écriture répétée ne répète pas la fatigue, ni une reprise initiale, ni une récupération d’endurance', () => {
        const apres = suivrePerteDEndurance(nitouche,{...nitouche,endurance:20});
        expect(apres.fatigue).toBe(3);
        expect(suivrePerteDEndurance(apres,apres).fatigue).toBe(3);
        expect(suivrePerteDEndurance(apres,{...apres,endurance:23}).fatigue).toBe(3);
        expect(suivrePerteDEndurance({...nitouche,[CLE_SUIVI_FATIGUE]:0},{...nitouche,endurance:20}).fatigue).toBe(0);
        expect(suivrePerteDEndurance(nitouche,{...nitouche,endurance:19,__rddOperationFatigue:'alcool',fatigue_differee:4}).fatigue).toBe(0);
        expect(suivrePerteDEndurance(nitouche,{...nitouche,endurance:20,fatigue:3}).fatigue).toBe(3);
    });
    it('reste assommé tant qu’un segment complet n’a pas été récupéré, même si le plancher bloque le sommeil', () => {
        const plein = suivrePerteDEndurance(nitouche,{...nitouche,fatigue:46,endurance:0});
        const partiel = suivrePerteDEndurance(plein,{...plein,fatigue:44});
        expect(etatDuVoyageur(partiel).assomme).toBe(true);
        const reveille = suivrePerteDEndurance(partiel,{...partiel,fatigue:42});
        expect(etatDuVoyageur(reveille).assomme).toBe(false);
        expect(etatDuVoyageur(suivrePerteDEndurance(reveille,{...reveille,fatigue:43})).assomme).toBe(false);
    });
    it('une ancienne fatigue hors piste est signalée et conservée ; les entrées invalides sont refusées', () => {
        expect(etatDuVoyageur({...nitouche,fatigue:100})).toMatchObject({fatigue:100,total:-7});
        expect(() => proposerFatigue({...nitouche,fatigue:100},'sommeil',1)).toThrow(/Vérifier/);
        expect(() => etatDuVoyageur({...nitouche,fatigue:''})).toThrow();
        expect(() => etatDuVoyageur({...nitouche,endurance_max:31})).toThrow(/manuel/);
        expect(() => etatDuVoyageur({...nitouche,ethylisme:8})).toThrow();
    });
});
