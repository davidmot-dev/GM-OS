import { describe, expect, it, vi } from 'vitest';
import { ajouterUneBlessure, avancerLeTempsAlien, combatAlienVierge, demanderUnCritique, desDeProtection, malusDesBlessures, preparerLeTir, rechargerUneArme, resoudreLeTrepas, soignerUneBlessure, trepasDu } from './combatAlien';
import { REGLAGES_ALIEN, ajouterUneCibleSecondaire, budgetDesEclats, depenserUnEclat, type JetAlien } from './jetsAlien';
import { DiceEngine } from '../DiceEngine';
const arme = { id:'0', nom:'Fusil', bonus:1, degats:2, portee:'Longue', proprietes:{ automatique:true,munitions:true,unique:false,armure:'perce-armure' as const } };
const blessure = (code: number) => ajouterUneBlessure(demanderUnCritique(combatAlienVierge(),'coup'),'coup',code,{ min:code,max:code,title:`Critique ${code}`,description:'',effect:'Effet du livre.' },()=>4);
describe('Alien A3 — livre français p. 61,94–101,118', () => {
    it('compose visée, portée et automatique avant le tir et son Stress', () => {
        expect(preparerLeTir({ ...REGLAGES_ALIEN, viser:true,automatique:true,portee:2 },arme)).toMatchObject({bonus:3,stress:1,erreur:undefined});
        expect(preparerLeTir({ ...REGLAGES_ALIEN,portee:0,sansDefense:true },arme).bonus).toBe(3);
        expect(preparerLeTir({ ...REGLAGES_ALIEN,portee:4 },arme).erreur).toContain('au-delà');
    });
    it('affecte un six par cible secondaire, puis les éclats à la cible retenue', () => {
        const j: JetAlien = { version:1,id:'j',competence:'distance',nomCompetence:'Tir',role:'simple',composition:'',reussites:4,paniqueEnAttente:false,annule:false,eclats:[],automatique:true };
        const cible = ajouterUneCibleSecondaire(j,'B');
        const suite = depenserUnEclat(cible,'degat','B');
        expect(budgetDesEclats(suite)).toBe(1);
        expect(suite.eclats[1].cible).toBe('B');
        expect(ajouterUneCibleSecondaire(suite,'B')).toBe(suite);
    });
    it('un chargeur vide consomme une seule réserve à son rechargement', () => {
        const s = { ...combatAlienVierge(), armes:{'0':{vide:true,chargeurs:2}} };
        const recharge = rechargerUneArme(s,'0'); expect(recharge.armes['0']).toEqual({vide:false,chargeurs:1});
        expect(rechargerUneArme(JSON.parse(JSON.stringify(recharge)),'0')).toEqual(recharge);
    });
    it('additionne armure et abri avant moitié arrondie ou double', () => {
        expect(desDeProtection(5+2,'perce-armure')).toBe(4);
        expect(desDeProtection(5+2,'doublee')).toBe(14);
    });
    it('le D66 prend un dé des dizaines et un des unités, sans résultats 1–10 ou 67', () => {
        const d = vi.spyOn(DiceEngine,'roll').mockReturnValueOnce(4).mockReturnValueOnce(4);
        const res = DiceEngine.rollStandard(66,1);
        expect(res.total).toBe(44); expect(d.mock.calls).toEqual([[6],[6]]); d.mockRestore();
    });
    it('conserve chaque demande et empêche de retirer une blessure après reprise', () => {
        const s = demanderUnCritique(demanderUnCritique(combatAlienVierge(),'a'),'b');
        const r = ajouterUneBlessure(s,'a',44,{min:44,max:44,title:'Poumon',description:'',effect:'Endurance et Mobilité −2.'},()=>3);
        expect(r.critiques).toEqual(['b']); expect(r.blessures[0]).toMatchObject({fatale:true,unite:'jour',jours:3});
        expect(ajouterUneBlessure(JSON.parse(JSON.stringify(r)),'a',63,{min:63,max:63,title:'Mort',description:''},()=>1)).toEqual(r);
    });
    it('Trépas : test à échéance, nouveau sursis d’une période, échec mortel', () => {
        let s = blessure(61); expect(trepasDu(s,s.blessures[0])).toBe(false);
        s = avancerLeTempsAlien(s,'round'); expect(trepasDu(s,s.blessures[0])).toBe(true);
        s = resoudreLeTrepas(s,'coup',1); expect(s.mort).toBe(false); expect(s.blessures[0].echeance).toBe(2);
        s = resoudreLeTrepas(avancerLeTempsAlien(s,'round'),'coup',0); expect(s.mort).toBe(true);
        expect(blessure(63).mort).toBe(true);
    });
    it('distingue stabilisation, tentatives avec matériel meilleur et guérison quotidienne', () => {
        let s = blessure(44);
        s = soignerUneBlessure(s,'coup','stabiliser',0,'Lambert',0);
        expect(soignerUneBlessure(s,'coup','stabiliser',2,'Lambert',0)).toBe(s);
        s = soignerUneBlessure(s,'coup','stabiliser',2,'Lambert',1);
        expect(s.blessures[0]).toMatchObject({stabilisee:true,jours:4});
        s = soignerUneBlessure(s,'coup','guerison',1,'Lambert',1); expect(s.blessures[0].jours).toBe(2);
        expect(soignerUneBlessure(s,'coup','guerison',1,'Lambert',1)).toBe(s);
        expect(malusDesBlessures(s,'endurance')).toBe(-2);
    });
    it('les critiques persistent malgré le passage du temps si fatales non stabilisées', () => {
        let s = ajouterUneBlessure(demanderUnCritique(combatAlienVierge(),'coup'),'coup',44,{min:44,max:44,title:'Poumon',description:''},()=>1,true);
        expect(s.blessures[0].jours).toBe(0.5);
        s = avancerLeTempsAlien(s,'jour'); expect(s.blessures[0].guerie).toBe(false);
        expect(trepasDu(s,s.blessures[0])).toBe(true);
    });
});
