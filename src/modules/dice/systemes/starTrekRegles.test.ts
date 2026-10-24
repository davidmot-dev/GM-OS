import { describe, it, expect } from 'vitest';
import {
    augmenterLaGravite, compterLaTache, controleDeCreation, coutDesAssistants, complicationDeReputation, etatDesBlessures,
    etatDuStress, gagnerDeLaDetermination, graviteSubie, guerirUneBlessure, infligerUneBlessure, intervention, jetDeReputation,
    lireStarTrek, menaceDeDepart, oppositionDeLaTache, premiersSecours, progressionPossible, reduireLeStress, reprendreConnaissance,
    seuilDeComplication, subirDuStress, traiterUneBlessure, type RegleDeStarTrek,
} from './starTrekRegles';

/** Les pages citées sont celles du Livre de Base imprimé de la deuxième édition. */
const REGLE: RegleDeStarTrek = {
    attributs: ['maitrise', 'forme', 'presence', 'audace', 'intuition', 'raison'],
    fonctions: ['commandement', 'navigation', 'ingenierie', 'securite', 'medecine', 'science'],
    forme: 'forme', stress: { courant: 'stress', maximum: 'stress_max' }, protection: 'resistance',
};

describe('la tâche (p. 253–259)', () => {
    it('Scotty : Maîtrise 11 + Ingénierie 4, spécialisation, 4 et 19 — deux réussites', () => {
        const r = compterLaTache([{ val: 4, seuil: 15, critique: 4 }, { val: 19, seuil: 15, critique: 4 }], seuilDeComplication(1));
        expect(r).toMatchObject({ reussites: 2, complications: 0 });
    });
    it('la marge de complication va de 20 à 16–20, jamais au-delà', () => {
        expect(seuilDeComplication(1)).toBe(20);
        expect(seuilDeComplication(3)).toBe(18);
        expect(seuilDeComplication(9)).toBe(16);
    });
    it('l’aide ne compte que si le personnage réussit au moins une fois (p. 256)', () => {
        const aide = { val: 3, seuil: 13, critique: 1, aide: 'Rom' };
        expect(compterLaTache([{ val: 18, seuil: 12, critique: 1 }, { val: 17, seuil: 12, critique: 1 }, aide], 20))
            .toMatchObject({ reussites: 0, aidesPerdues: true });
        expect(compterLaTache([{ val: 5, seuil: 12, critique: 1 }, { val: 8, seuil: 12, critique: 1 }, aide], 20).reussites).toBe(3);
    });
    it('le dé du vaisseau sous sa fonction vaut deux réussites (p. 178)', () => {
        expect(compterLaTache([{ val: 2, seuil: 14, critique: 1 }, { val: 3, seuil: 12, critique: 3, aide: 'Vaisseau' }], 20).reussites).toBe(3);
    });
    it('le premier assistant est gratuit, les suivants coûtent un point chacun (p. 255)', () => {
        expect([0, 1, 2, 3].map(coutDesAssistants)).toEqual([0, 0, 1, 2]);
    });
    it('Worf contre le Jem’Hadar : 1 réussite du réactif, difficulté 1 ; l’actif qui échoue lui donne l’Impulsion manquante', () => {
        expect(oppositionDeLaTache(1, 0, 1)).toEqual({ difficulte: 1, reussi: true, impulsionDuReactif: 0 });
        expect(oppositionDeLaTache(4, 0, 2)).toEqual({ difficulte: 4, reussi: false, impulsionDuReactif: 2 });
        expect(oppositionDeLaTache(2, 3, 0).difficulte).toBe(0);
    });
    it('la Détermination ne dépasse pas 3 (p. 262)', () => {
        expect(gagnerDeLaDetermination(2)).toEqual({ apres: 3, perdue: false });
        expect(gagnerDeLaDetermination(3)).toEqual({ apres: 3, perdue: true });
    });
});

describe('le Stress (p. 277–278)', () => {
    it('le maximum est la Forme, sauf un maximum écrit par un talent', () => {
        expect(etatDuStress(REGLE, { forme: 9, stress: 4 })).toEqual({ courant: 4, max: 9, epuise: false });
        expect(etatDuStress(REGLE, { forme: 9, stress_max: 11, stress: 11 })).toEqual({ courant: 11, max: 11, epuise: true });
    });
    it('ce qui déborde devient une complication', () => {
        expect(subirDuStress(7, 9, 3)).toEqual({ apres: 9, deborde: true, epuise: true });
        expect(subirDuStress(2, 9, 3)).toEqual({ apres: 5, deborde: false, epuise: false });
    });
    it('2 Impulsion par case, trois au plus ; répit 4, pause 8, sommeil tout', () => {
        expect(reduireLeStress(6, { impulsion: 8 })).toEqual({ apres: 3, cout: 6 });
        expect(reduireLeStress(6, 'repit').apres).toBe(2);
        expect(reduireLeStress(6, 'pause').apres).toBe(0);
        expect(reduireLeStress(11, 'sommeil').apres).toBe(0);
    });
});

describe('les blessures (p. 290–292)', () => {
    it('la Protection réduit la gravité, jamais sous 1 ; Perforant l’ignore', () => {
        expect(graviteSubie(3, 1)).toBe(2);
        expect(graviteSubie(2, 3)).toBe(1);
        expect(graviteSubie(3, 1, true)).toBe(3);
    });
    it('augmenter la gravité : deux fois au plus, 2 Impulsion par point, 1 si Puissante', () => {
        expect(augmenterLaGravite(3)).toEqual({ plus: 2, cout: 4 });
        expect(augmenterLaGravite(1, true)).toEqual({ plus: 1, cout: 1 });
    });
    it('une blessure létale qui vainc rend mourant ; les premiers secours relèvent, l’intervention guérit', () => {
        let v: Record<string, unknown> = {};
        v = { ...v, ...infligerUneBlessure(v, { id: 'b1', nom: 'Brûlure', gravite: 4, letale: true }, 'att-1') };
        expect(etatDesBlessures(v)).toMatchObject({ vaincu: true, mourant: true });
        expect(infligerUneBlessure(v, { id: 'b2', nom: 'x', gravite: 1, letale: false }, 'att-1')).toEqual({});
        v = { ...v, ...premiersSecours(v) };
        expect(etatDesBlessures(v).mourant).toBe(false);
        expect(intervention(lireStarTrek(v).blessures[0])).toEqual({ difficulte: 5, marge: 2, heures: 4 });
        v = { ...v, ...traiterUneBlessure(v, 'b1') };
        expect(intervention(lireStarTrek(v).blessures[0])).toEqual({ difficulte: 4, marge: 1, heures: 4 });
        v = { ...v, ...guerirUneBlessure(v, 'b1') };
        expect(lireStarTrek(v).blessures).toEqual([]);
    });
    it('l’étourdissement s’efface au réveil', () => {
        let v: Record<string, unknown> = {};
        v = { ...v, ...infligerUneBlessure(v, { id: 'p', nom: 'Paralysie', gravite: 3, letale: false }, 'a') };
        v = { ...v, ...reprendreConnaissance(v) };
        expect(etatDesBlessures(v)).toMatchObject({ vaincu: false, blessures: [] });
    });
});

describe('la Réputation (p. 169–172)', () => {
    it('seuil 7 + Réputation, un dé sous la Réputation vaut deux, la Gloire au-delà de la difficulté', () => {
        const des = [2, 9, 15];
        const r = jetDeReputation(3, 3, 1, 0, () => des.shift()!);
        expect(r).toMatchObject({ seuil: 10, difficulte: 1, reussites: 3, reussi: true, gloire: 2, reprimandes: 0 });
    });
    it('raté : une Réprimande par réussite manquante, plus une par 20', () => {
        const des = [20, 14];
        expect(jetDeReputation(3, 2, 3, 0, () => des.shift()!)).toMatchObject({ reussites: 0, reprimandes: 4 });
    });
    it('les réprimandes passées élargissent la marge', () => {
        expect([0, 1, 5, 9].map(complicationDeReputation)).toEqual([20, 19, 15, 15]);
    });
});

describe('Menace, création, progression', () => {
    it('deux points de Menace par personnage joueur (p. 264)', () => {
        expect(menaceDeDepart(4)).toBe(8);
    });
    it('un seul attribut à 12, une seule fonction à 5 (p. 132)', () => {
        const ok = { maitrise: 12, forme: 9, presence: 8, audace: 10, intuition: 9, raison: 8, commandement: 5, navigation: 2, ingenierie: 3, securite: 1, medecine: 2, science: 3 };
        expect(controleDeCreation(REGLE, ok).conforme).toBe(true);
        expect(controleDeCreation(REGLE, { ...ok, raison: 12, science: 5 }).constats).toEqual([
            '2 attributs à 12 : un seul permis.', '2 fonctions à 5 : une seule permise.',
        ]);
    });
    it('un jalon monte jusqu’à 11 et 4, un arc jusqu’à 12 et 5 (p. 167, 169)', () => {
        expect(progressionPossible('jalon', 'attribut', 11)).toEqual({ possible: false, plafond: 11 });
        expect(progressionPossible('arc', 'fonction', 4)).toEqual({ possible: true, plafond: 5 });
    });
});
