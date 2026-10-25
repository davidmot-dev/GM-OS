import { describe, it, expect } from 'vitest';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { CLE_DUNE, CHOIX_DUNE, attaqueDune, acheterProgressionDune, bilanDune, compteDune, conserverDune, depenserDune, desDune, difficulteDune, lireDune, menaceInitialeDune, recupererPrincipe, relancerDune, resultatDune, santeDuConflitDune } from './duneRegles';
const regle = DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune')!.jet!.dune!;
describe('Dune, livre français et errata 1.1', () => {
    it('Combat 6 + Devoir 7, dé 5 spécialisé : deux réussites, pas de changement du seuil', () => {
        expect(resultatDune([{ val: 5, seuil: 13, critique: 6 }], 1, 2).tagSuccess).toBe(true);
        expect(resultatDune([{ val: 5, seuil: 13, critique: 1 }], 1, 2).tagSuccess).toBe(false);
    });
    it('l’aide perd ses réussites mais conserve ses complications si le principal échoue', () => {
        const des = [{ val: 18, seuil: 13, critique: 6 }, { val: 1, seuil: 10, critique: 1, aide: 'Anna' }, { val: 20, seuil: 10, critique: 1, aide: 'Nasir' }];
        expect(compteDune(des, 1)).toMatchObject({ reussites: 0, complications: 1 });
        expect(compteDune([{ ...des[0], val: 5 }, ...des.slice(1)], 1)).toMatchObject({ reussites: 4, complications: 1 });
        const apres = relancerDune(des, [0, 1, 2], () => 3);
        expect(apres.map(d => d.val)).toEqual([3, 1, 20]);
    });
    it('un automatique remplace un dé, sans agrandir la réserve', () => {
        const des = desDune([20, 5], 13, 1, { ...CHOIX_DUNE, unAutomatique: true }, () => 20);
        expect(des.map(d => d.val)).toEqual([1, 5]);
        expect(resultatDune(des, 1, 1).successes).toBe(3);
    });
    it('l’opposition dépasse 5 et tient compte des facteurs des deux camps', () => {
        expect(difficulteDune({ reussites: 8, gene: 1, facteurs: 2, pnj: true })).toBe(9);
        expect(difficulteDune({ reussites: 1, gene: 3, facteurs: 0, pnj: true })).toBe(0);
        expect(compteDune([{ val: 16, seuil: 13, critique: 1 }], 5).complications).toBe(1);
    });
    it('réserve pleine : trois points restent dépensables et le bonus ne se conserve jamais', () => {
        const b = bilanDune(4, 1, 2);
        const depense = depenserDune(b, 3, 6);
        expect(depense).toEqual({ bilan: { normal: 2, bonus: 0, depense: 3, clos: false }, table: 0 });
        expect(conserverDune(depense.bilan, 6)).toMatchObject({ verse: 0, perdu: 2 });
        expect(conserverDune(b, 3)).toMatchObject({ verse: 3, perdu: 2 });
        expect(conserverDune(b, 6, true)).toMatchObject({ verse: 3, perdu: 2 });
        expect(() => depenserDune(b, 12, 6)).toThrow('insuffisante');
        expect(() => conserverDune(conserverDune(b, 0).bilan, 0)).toThrow('fermé');
    });
    it('mineur vaincu en un succès ; qualité défensive ajoutée après la borne 4–8 ; égalité suffisante', () => {
        expect(attaqueDune('mineur', 8, 2, 0, 0, true).vaincu).toBe(true);
        expect(attaqueDune('notable', 8, 3, 5, 4, true)).toMatchObject({ conditions: 11, apres: 11, vaincu: true });
        expect(attaqueDune('notable', 6, 0, 2, 1, false).apres).toBe(2);
    });
    it('survivre garde la progression, et un vaincu ne devient pas un mort', () => {
        const d = { vaincu: true, progression: 8, conditions: 8, qualite: 2, durable: '', recuperation: 0 };
        expect(santeDuConflitDune(d).state).toBe('critical');
        const survie = santeDuConflitDune({ ...d, vaincu: false, survieScene: 'duel-1' });
        expect(survie.state).toBe('healthy'); expect(survie.data.filled).toBe(8);
    });
    it('l’introspection refuse une scène ayant échangé de la Détermination et rééquilibre les maximes à 6', () => {
        const s = { ...lireDune({}), bafoues: ['devoir'], determinationDansLaScene: true };
        expect(() => recupererPrincipe(s, {}, 'devoir', 'Ma famille d’abord')).toThrow('Détermination');
        const apres = recupererPrincipe({ ...s, determinationDansLaScene: false }, { devoir: 6, foi: 5 }, 'devoir', 'Je crois en eux', 'foi');
        expect(apres).toMatchObject({ devoir: 5, foi: 6, [CLE_DUNE]: { maximes: { devoir: '', foi: 'Je crois en eux' }, bafoues: [], recuperes: ['devoir'] } });
    });
    it('Maison mineure et quatre joueurs : proposition 4 ; qualité 0 → 1 coûte 2, une seule progression par aventure', () => {
        expect(menaceInitialeDune(1, 4)).toBe(4);
        const s = { ...lireDune({}), aventure: 'Arrakis', atouts: [{ id: 'lame', nom: 'Lame', qualite: 0, tangible: true, permanent: true, usage: 'offensif' as const, zone: '', neutralise: false }] };
        const apres = acheterProgressionDune(regle, { progression: 2, [CLE_DUNE]: s }, { genre: 'qualite', objet: 'lame' });
        expect(apres.progression).toBe(0); expect(lireDune(apres).atouts[0].qualite).toBe(1);
        expect(() => acheterProgressionDune(regle, apres, { genre: 'qualite', objet: 'lame' })).toThrow('déjà');
    });
});
