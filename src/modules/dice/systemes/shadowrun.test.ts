import { describe, expect, it } from 'vitest';
import {
    CHOIX_DE_SHADOWRUN, complicationDesSpeciaux, desDeRisqueConseilles, encaisserShadowrun, graviteDe,
    lancerShadowrun, reserveDeShadowrun, resoudreShadowrun, seuilDeSoin, seuilsDeBlessure, succesAnnulesParLEssence,
} from './shadowrun';

const normal = { valeurDuSucces: 5 as const, rr: 0 as const, annules: 0 };

describe('Shadowrun : Anarchy 2.0 — le jet (p. 64-72)', () => {
    it('le soin de Lightning : 9 dés, 3 succès, il en fallait 4 (p. 64)', () => {
        const r = reserveDeShadowrun(5 + 4, { ...CHOIX_DE_SHADOWRUN, desDeRisque: 0 });
        expect(r.des).toBe(9);
        const j = resoudreShadowrun({ normaux: [1, 4, 5, 3, 6, 1, 4, 5, 3] }, r, 4);
        expect(j.shadowrun.succes).toBe(3);
        expect(j.tagSuccess).toBe(false);
        expect(j.shadowrun.complication).toBe('aucune');
    });

    it('Iron contre les gangers : avantage et désavantage changent la valeur du succès (p. 64-65)', () => {
        expect(resoudreShadowrun({ normaux: [4, 5, 6, 1, 3, 3, 5, 2, 2] }, normal, 0).shadowrun.succes).toBe(3);
        const desavantage = reserveDeShadowrun(5, { situation: -1 });
        expect(desavantage.valeurDuSucces).toBe(6);
        expect(resoudreShadowrun({ normaux: [1, 4, 5, 6, 2] }, desavantage, 0).shadowrun.succes).toBe(1);
        expect(reserveDeShadowrun(5, { situation: 1 }).valeurDuSucces).toBe(4);
    });

    it('les (dés)avantages se cumulent sans dépasser un (p. 65)', () => {
        expect(reserveDeShadowrun(5, { situation: 1 }, { graves: 1 }).avantage).toBe(0);
        expect(reserveDeShadowrun(5, { situation: 1, anarchyPourAvantage: true }).avantage).toBe(1);
        expect(reserveDeShadowrun(5, { situation: -1, blessureLegereRecente: true }, { graves: 1 }).avantage).toBe(-1);
    });

    it('la spécialisation ajoute deux dés ; les dés de risque restent dans la réserve (p. 52, 70)', () => {
        const r = reserveDeShadowrun(7, { specialisation: true, desDeRisque: 30 });
        expect(r.des).toBe(9);
        expect(r.risque).toBe(9);
    });

    it('la rafale d’Iron : 6 succès, deux 1 de risque dont un annulé par la RR 1 (p. 72)', () => {
        const r = reserveDeShadowrun(7 + 4, { desDeRisque: 7, rr: 1 });
        const j = resoudreShadowrun({ normaux: [5, 6, 2, 3], risque: [5, 6, 1, 1, 2, 3, 4] }, r, 3);
        expect(j.shadowrun.succes).toBe(6);
        expect(j.shadowrun.unsRestants).toBe(1);
        expect(j.shadowrun.complication).toBe('mineure');
        expect(j.shadowrun.nets).toBe(3);
        // VD 5 + 3 nets = 8 contre Force 4, Armure 2 : seuils 6/9/12, une blessure légère ; 10 aurait été grave.
        expect(seuilsDeBlessure(4, 2)).toEqual({ legere: 6, grave: 9, incapacitante: 12 });
        expect(graviteDe(8, seuilsDeBlessure(4, 2))).toBe('legere');
        expect(graviteDe(10, seuilsDeBlessure(4, 2))).toBe('grave');
        expect(graviteDe(6, seuilsDeBlessure(4, 2))).toBeNull();
    });

    it('Rolling Thunder : trois 1, ramenés à un par la RR 2, à aucun par la RR 3 (p. 71)', () => {
        const des = { normaux: [3, 4], risque: [1, 1, 1, 5, 2, 3, 6, 4] };
        expect(resoudreShadowrun(des, { ...normal, rr: 0 }, 3).shadowrun.complication).toBe('desastre');
        expect(resoudreShadowrun(des, { ...normal, rr: 2 }, 3).shadowrun.complication).toBe('mineure');
        expect(resoudreShadowrun(des, { ...normal, rr: 3 }, 3).shadowrun.complication).toBe('aucune');
    });

    it('le désastre fait échouer et rapporte deux points d’Anarchy ; la critique un (p. 70, 77)', () => {
        const desastre = resoudreShadowrun({ normaux: [6, 6, 6], risque: [1, 1, 1, 6] }, normal, 2);
        expect(desastre.shadowrun.succes).toBe(5);
        expect(desastre.tagSuccess).toBe(false);
        expect(desastre.shadowrun.anarchyGagnee).toBe(2);
        expect(resoudreShadowrun({ normaux: [6], risque: [1, 1] }, normal, 1).shadowrun.anarchyGagnee).toBe(1);
    });

    it('quatre succès nets font une réussite exceptionnelle (p. 64)', () => {
        const j = resoudreShadowrun({ normaux: [5, 6], risque: [5, 6, 6] }, normal, 4);
        expect(j.shadowrun.succes).toBe(8);
        expect(j.shadowrun.exceptionnelle).toBe(true);
    });

    it('la relance garde la complication du premier jet, et n’en crée pas (p. 77)', () => {
        const relance = resoudreShadowrun({ normaux: [6, 6], risque: [3] }, normal, 2, 'critique');
        expect(relance.shadowrun.complication).toBe('critique');
        expect(relance.shadowrun.anarchyGagnee).toBe(0);
        expect(resoudreShadowrun({ normaux: [6], risque: [1, 1, 1] }, normal, 1, 'aucune').shadowrun.complication).toBe('aucune');
    });

    it('la table « Combien prendre de dés de risque ? » (p. 71), sans dépasser la réserve', () => {
        expect(desDeRisqueConseilles(1, 'fort', 11)).toBe(7);
        expect(desDeRisqueConseilles(0, 'normal', 9)).toBe(2);
        expect(desDeRisqueConseilles(2, 'extreme', 9)).toBe(9);
        expect(desDeRisqueConseilles(3, 'extreme', 14)).toBe(14);
    });

    it('la règle de risque alternative : un dé spécial par RR, −1 à 3 succès (p. 72)', () => {
        const r = reserveDeShadowrun(4, { rr: 2, situation: 1 }, {}, true);
        expect(r.speciaux).toBe(2);
        expect(r.risque).toBe(0);
        // Les dés normaux comptent les 4 (avantage) ; les spéciaux valent 1 → −1 et 6 → 3, sans avantage.
        const j = resoudreShadowrun({ normaux: [4, 2, 2, 2], speciaux: [1, 6] }, r, 3);
        expect(j.shadowrun.succes).toBe(1 - 1 + 3);
        expect(complicationDesSpeciaux([1, 1])).toBe('critique');
        expect(complicationDesSpeciaux([1, 2, 1])).toBe('aucune');
        expect(complicationDesSpeciaux([1, 1, 1])).toBe('desastre');
    });

    it('lancer : les dés de risque sont pris dans la réserve', () => {
        const r = reserveDeShadowrun(6, { desDeRisque: 2 });
        const j = lancerShadowrun(r, 2, () => 5);
        expect(j.shadowrun.normaux).toHaveLength(4);
        expect(j.shadowrun.risque).toHaveLength(2);
        expect(j.shadowrun.succes).toBe(8);
    });
});

describe('Shadowrun : Anarchy 2.0 — blessures et Essence (p. 60, 68-69)', () => {
    it('la troisième légère devient grave, la quatrième incapacitante (p. 69)', () => {
        let m = { legeres: 0, graves: 0, incapacitantes: 0 };
        for (let i = 0; i < 2; i++) m = encaisserShadowrun('legere', m).moniteur;
        const troisieme = encaisserShadowrun('legere', m);
        expect(troisieme.cochee).toBe('grave');
        expect(troisieme.aggravee).toBe(true);
        expect(encaisserShadowrun('legere', troisieme.moniteur).cochee).toBe('incapacitante');
    });

    it('un atout porte les légères à trois et les graves à deux (p. 68)', () => {
        const m = encaisserShadowrun('grave', { legeres: 0, graves: 1, incapacitantes: 0 }, { legeres: 3, graves: 2, incapacitantes: 1 });
        expect(m.cochee).toBe('grave');
        expect(m.moniteur.graves).toBe(2);
    });

    it('Iron, Essence 3,5 : un succès de plus pour la soigner, un de moins à la magie (p. 60, 64)', () => {
        expect(seuilDeSoin('legere', 3.5)).toBe(4);
        expect(seuilDeSoin('grave', 6)).toBe(5);
        expect(succesAnnulesParLEssence(3.5)).toBe(1);
        expect(succesAnnulesParLEssence(3)).toBe(2);
        expect(reserveDeShadowrun(6, { magie: true }, { essence: 2.5 }).annules).toBe(2);
    });
});
