import { describe, expect, it } from 'vitest';
import {
    argusDe, bonusDeLaStimulation, doseDEx, etatDeLaSporulation, exposition, inhaler, nouveauJour, testerLeGerme,
    type RegleDeLaContamination,
} from './contaminationDeDegenesis';
import { CLE_DEGENESIS, lireLEtatDegenesis } from './maximaDeDegenesis';

const REGLE: RegleDeLaContamination = {
    sporulations: 'sporulations_jauge', ego: 'ego_jauge', egoMax: 'ego_max',
    resistance: ['physique', 'resistance'],
    attributs: ['physique', 'agilite', 'charisme', 'intellect', 'psyche', 'instinct'],
    physique: 'physique',
    mental: [['psyche', 'foi'], ['psyche', 'volonte']],
    social: [['charisme', 'negociation'], ['charisme', 'expression']],
    sens: [['instinct', 'perception'], ['instinct', 'empathie']],
};
const des = (...f: number[]) => () => f.shift() ?? 1;

describe('DEG-A5 — Sporulation, Brûlure et EX (p. 177, 186-190)', () => {
    it('les seuils : mollusk dès 1, stigmates à 50 %, porteur dès un point permanent, Léperos à 50 % de permanentes', () => {
        expect(etatDeLaSporulation(1, 8, { version: 1 })).toMatchObject({ mollusk: true, stigmates: false, porteur: false });
        expect(etatDeLaSporulation(4, 8, { version: 1 })).toMatchObject({ stigmates: true, exces: 0, aTester: 0 });
        expect(etatDeLaSporulation(10, 8, { version: 1, sporulationPermanente: 4 })).toMatchObject({ exces: 2, aTester: 2, porteur: true, leperos: true });
        expect(etatDeLaSporulation(10, 8, { version: 1, excesTeste: 1 }).aTester).toBe(1);
    });

    it('le test du Germe : un test par point d’excédent, difficulté l’excédent ; chaque échec, un point permanent', () => {
        const sp = etatDeLaSporulation(10, 8, { version: 1 });
        // PSY 2 + Foi 2 = 4 dés, difficulté 2 : le premier réussit (6 6 2 2), le second échoue (5 2 2 2).
        const r = testerLeGerme(sp, { version: 1 }, 4, {}, des(6, 6, 2, 2, 5, 2, 2, 2))!;
        expect(r.echecs).toBe(1);
        expect(r.etat).toMatchObject({ sporulationPermanente: 1, excesTeste: 2 });
        expect(r.texte).toContain('2 tests, difficulté 2');
        expect(r.texte).toContain('porteur du Germe');
        // Rien à retester tant que l'excédent ne grandit pas.
        expect(testerLeGerme(etatDeLaSporulation(10, 8, r.etat), r.etat, 4, {}, des())).toBeNull();
    });

    it('l’exposition : PHY + Résistance contre le niveau, l’hermétique en succès d’office ; échec, +1D', () => {
        // Forte sporination (3) : 4 dés, un succès d'office ; 4 2 2 2 → 2 succès, échec ; 1D = 5.
        const r = exposition(3, 4, { hermetique: 1 }, des(4, 2, 2, 2, 5));
        expect(r.gain).toBe(5);
        expect(r.texte).toContain('1 succès d’office → 2 succès ; échec, +5 Sporulation');
        expect(exposition(1, 4, {}, des(4, 2, 2, 2)).gain).toBe(0);
    });

    it('l’EX retire 1D sans toucher aux permanentes, une seule dose par jour', () => {
        const etat = { version: 1 as const, sporulationPermanente: 2, excesTeste: 2 };
        const r = doseDEx(etatDeLaSporulation(10, 8, etat), etat, des(6));
        expect(r.retires).toBe(6);
        expect(r.etat).toMatchObject({ exDuJour: true, excesTeste: 0 });
        expect(r.texte).toContain('Sporulation 10 → 4 (2 permanentes');
        expect(doseDEx(etatDeLaSporulation(4, 8, r.etat), r.etat, des(6)).retires).toBe(0);
        expect(doseDEx(etatDeLaSporulation(3, 8, { version: 1, sporulationPermanente: 2 }), { version: 1 }, des(6)).retires).toBe(1);
    });

    it('une Brûlure intense d’Argus, Puissance 4 : Égo +4 sans dépasser le maximum, Sporulation +4, stimulation gardée', () => {
        const fiche = { ego_jauge: 6, sporulations_jauge: 5 };
        const r = inhaler(REGLE, fiche, 'argus', true, 8, des(4), CLE_DEGENESIS);
        expect(r.maj).toMatchObject({ ego_jauge: 8, sporulations_jauge: 9 });
        expect(lireLEtatDegenesis(r.maj).stimulation).toEqual({ chakra: 'argus', puissance: 4 });
        expect(argusDe(r.stimulation)).toBe(4);
        expect(r.texte).toContain('Égo 6 → 8, Sporulation 5 → 9');
    });

    it('la Discordia : un attribut tiré au dé tombe à 1 ou monte à 6, sans Égo ni Sporulation', () => {
        const r = inhaler(REGLE, { ego_jauge: 2, sporulations_jauge: 0 }, 'discordia', false, 8, des(5, 3), CLE_DEGENESIS);
        expect(r.stimulation.discordia).toEqual({ attribut: 'psyche', valeur: 1 });
        expect(r.maj).not.toHaveProperty('ego_jauge');
        expect(bonusDeLaStimulation(r.stimulation, REGLE, ['psyche', 'foi'], { psyche: 3 })).toMatchObject({ des: -2 });
    });

    it('les bonus d’un jet : Muse et Unité en dés, Gloire en succès mentaux et PHY/2, Bion en résistance', () => {
        expect(bonusDeLaStimulation({ chakra: 'muse', puissance: 4 }, REGLE, ['instinct', 'perception'], {})).toMatchObject({ des: 4, succes: 0 });
        expect(bonusDeLaStimulation({ chakra: 'muse', puissance: 4 }, REGLE, ['instinct', 'survie'], {})).toBeNull();
        expect(bonusDeLaStimulation({ chakra: 'unite', puissance: 2 }, REGLE, ['charisme', 'expression'], {})!.des).toBe(2);
        expect(bonusDeLaStimulation({ chakra: 'gloire', puissance: 3 }, REGLE, ['psyche', 'volonte'], {})).toMatchObject({ des: 0, succes: 3 });
        expect(bonusDeLaStimulation({ chakra: 'gloire', puissance: 3 }, REGLE, ['physique', 'corps_a_corps'], {})).toMatchObject({ des: 2, succes: 0 });
        expect(bonusDeLaStimulation({ chakra: 'bion', puissance: 1 }, REGLE, ['physique', 'resistance'], {})).toMatchObject({ succes: 1 });
        expect(bonusDeLaStimulation({ chakra: 'argus', puissance: 4 }, REGLE, ['psyche', 'reactivite'], {})).toBeNull();
    });

    it('un nouveau jour : +1 Égo au réveil, l’EX de nouveau possible', () => {
        const r = nouveauJour(REGLE, { ego_jauge: 7, [CLE_DEGENESIS]: { version: 1, exDuJour: true } }, 8, CLE_DEGENESIS);
        expect(r.maj).toMatchObject({ ego_jauge: 8 });
        expect(lireLEtatDegenesis(r.maj).exDuJour).toBe(false);
    });
});
