import { describe, expect, it } from 'vitest';
import { REGLAGES_ALIEN, budgetDesEclats, composerLesDesAlien, depenserUnEclat, equipementsAlien, resultatDuJetAlien, type JetAlien, type RegleDesJetsAlien } from './jetsAlien';
import { preparerLeJet } from '../DescripteurDeJet';
import type { RollResult } from '../DiceEngine';
const regle: RegleDesJetsAlien = { competence: 'competence', competences: { tir: 'distance' }, equipement: { noms: 'armes', bonus: 'bonus', degats: 'degats', portees: 'portees' } };
const jet: JetAlien = { version: 1, id: 'jet', competence: 'distance', nomCompetence: 'Tir', role: 'simple', composition: '', reussites: 4, paniqueEnAttente: false, annule: false, eclats: [] };
const resultat: RollResult = { total: 4, successes: 4, modifier: 0, rolls: [{ val: 6, sides: 6 }], totalDisplay: '4 réussites' };
describe('Alien A2 — règles françaises des jets', () => {
    it('un malus −4 sur base 2 / Stress 3 laisse zéro base et un Stress', () => {
        expect(composerLesDesAlien(2, 3, { ...REGLAGES_ALIEN, situation: -4 })).toMatchObject({ base: 0, stress: 1 });
        expect(composerLesDesAlien(2, 3, { ...REGLAGES_ALIEN, situation: -5 })).toMatchObject({ base: 0, stress: 0 });
    });
    it('cumule arme, aide, outil, situation et Tremblement avant de retirer les dés', () => {
        expect(composerLesDesAlien(10, 3, { ...REGLAGES_ALIEN, aide: 5, outil: 1, situation: -1 }, 2, -2)).toMatchObject({ base: 13, stress: 3, aide: 3 });
        expect(composerLesDesAlien(1, 3, { ...REGLAGES_ALIEN, situation: 2 }, 0, -2)).toMatchObject({ base: 1, stress: 3 });
    });
    it('le plafond des anciens profils demeure ; un profil sans plafond garde ses bonus', () => {
        const config = { sens: 'superieur-ou-egal' as const, reserve: { base: 10, max: 10, faces: 6 } };
        expect(preparerLeJet(config, {}, { champs: {}, desSupplementaires: 3 }).nombreDeDes).toBe(10);
        expect(preparerLeJet({ ...config, reserve: { ...config.reserve, sansPlafond: true } }, {}, { champs: {}, desSupplementaires: 3 }).nombreDeDes).toBe(13);
    });
    it('relie les quatre colonnes par ligne et refuse un bonus non numérique', () => {
        const armes = equipementsAlien(regle, { armes: 'Pistolet\n\nFusil', bonus: '+2\n\nabc', degats: '1\n\n2', portees: 'Moyenne\n\nLongue' });
        expect(armes[0]).toMatchObject({ id: '0', nom: 'Pistolet', bonus: 2, degats: 1, portee: 'Moyenne' });
        expect(armes[1].erreur).toContain('ligne 3');
    });
    it('une égalité échoue en opposition, et seules les réussites nettes donnent des éclats', () => {
        expect(resultatDuJetAlien(resultat, { ...jet, role: 'attaquant', defense: 4 })).toMatchObject({ successes: 0, tagSuccess: false });
        expect(budgetDesEclats({ ...jet, role: 'attaquant', defense: 2 })).toBe(1);
        expect(resultatDuJetAlien(resultat, { ...jet, role: 'attaquant' }).tagSuccess).toBeUndefined();
        expect(resultatDuJetAlien(resultat, { ...jet, role: 'defenseur' }).tagSuccess).toBeUndefined();
    });
    it('ne dépense ni pendant la Panique, ni sur une action annulée, ni avant l’opposition', () => {
        for (const j of [{ ...jet, paniqueEnAttente: true }, { ...jet, annule: true }, { ...jet, role: 'attaquant' as const }]) expect(depenserUnEclat(j, 'degat')).toBe(j);
    });
    it('conserve le budget après sérialisation ; dégâts répétables, autres effets une fois', () => {
        let suite = depenserUnEclat(jet, 'clouer');
        expect(depenserUnEclat(suite, 'clouer')).toBe(suite);
        suite = depenserUnEclat(JSON.parse(JSON.stringify(suite)), 'degat');
        suite = depenserUnEclat(suite, 'degat');
        expect(budgetDesEclats(suite)).toBe(0);
        expect(depenserUnEclat(suite, 'desarmer')).toBe(suite);
        expect(suite.eclats.map(e => e.id)).toEqual(['clouer', 'degat', 'degat']);
    });
    it('les effets proposés sont ceux de la compétence effectivement lancée', () => {
        expect(depenserUnEclat({ ...jet, competence: 'observation' }, 'degat').eclats).toEqual([]);
        expect(depenserUnEclat({ ...jet, competence: 'observation' }, 'nombre').eclats).toHaveLength(1);
        expect(depenserUnEclat({ ...jet, competence: 'soins' }, 'nombre').eclats).toEqual([]);
    });
});
