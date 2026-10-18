import { describe, expect, it } from 'vitest';
import { preparerJetDuVoyageur } from './jetDuVoyageur';
import { ficheDuJet, jetDuTest, valeursDuJet } from './jetDuVoyageur.fixtures';
describe('état général dans le véritable moteur de jet RdD', () => {
    it('Mêlée 13, compétence +3, difficulté -1, état -5 : ajustement -3, cible 45 %', () => {
        const {jet, malus} = preparerJetDuVoyageur(jetDuTest,ficheDuJet,valeursDuJet,{caracteristique:'melee',competence:'discretion'},-1);
        expect(malus).toBe(-5);expect(jet.seuil).toBe(45);expect(jet.avertissements).toEqual([]);
        expect(jet.echelle).toBeDefined();expect(jet.composantes.filter(c => c.champ === '__rddEtatDuJet')).toHaveLength(1);
    });
    it('CHANCE ignore état et compétence, même choisie dans la liste ordinaire', () => {
        for (const nature of ['action','chance'] as const) {
            const {jet,malus} = preparerJetDuVoyageur(jetDuTest,ficheDuJet,valeursDuJet,{caracteristique:'chance',competence:'discretion'},0,nature);
            expect(malus).toBe(0);expect(jet.seuil).toBe(50);expect(jet.avertissements).toEqual([]);
        }
    });
    it('la guérison écarte l’état ; les autres paramètres restent ceux choisis par la table', () => {
        const p = preparerJetDuVoyageur(jetDuTest,ficheDuJet,valeursDuJet,{caracteristique:'reve',competence:'discretion'},0,'guerison');
        expect(p.malus).toBe(0);expect(p.jet.seuil).toBe(91);
    });
});
