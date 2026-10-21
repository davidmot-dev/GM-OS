import { describe,it,expect } from 'vitest';
import { budgetViergeAlien,payerActionAlien,distribuerCartesAlien,fileDesInitiativesAlien,budgetDuCombattantAlien } from './actionsAlien';
import type { Combatant } from '../../combat/types';
const c=(id:string):Combatant=>({id,name:id,init:0,isPlayer:false,faction:'enemy',statuses:[],hp:6,hpMax:6});
describe('A6 — créneaux et actions du livre français',()=>{
    it('une lente et une rapide, dans les deux ordres',()=>{
        for(const ordre of [['lente','rapide'],['rapide','lente']] as const){let b=budgetViergeAlien();for(const [i,a] of ordre.entries())b=payerActionAlien(b,a,String(i));expect(b).toMatchObject({lentes:1,rapides:1});expect(payerActionAlien(b,'blocage','trois')).toBe(b);}
    });
    it('deux rapides empêchent la lente ; une réaction paie un vrai créneau',()=>{
        let b=payerActionAlien(budgetViergeAlien(),'blocage','a');b=payerActionAlien(b,'blocage','b');expect(b.rapides).toBe(2);expect(payerActionAlien(b,'lente','c')).toBe(b);
    });
    it('ne réapplique pas une déclaration après sérialisation',()=>{const b=payerActionAlien(budgetViergeAlien(),'lente','a');expect(payerActionAlien(JSON.parse(JSON.stringify(b)),'lente','a')).toEqual(b);});
    it('surveillance réserve la lente, une autre action l’interrompt',()=>{
        const b=payerActionAlien(budgetViergeAlien(),'surveillance','a','Sas');expect(b).toMatchObject({rapides:1,surveillance:'Sas'});
        expect(payerActionAlien(b,'tir-surveillance','b')).toMatchObject({lentes:1,rapides:1});
        expect(payerActionAlien(b,'rapide','c').surveillance).toBeUndefined();
        expect(payerActionAlien(budgetViergeAlien(),'tir-surveillance','d')).toMatchObject({lentes:0});
    });
    it('surveillance persiste au passage du Round jusqu’à la prochaine initiative',()=>{
        const b=payerActionAlien(budgetViergeAlien(),'surveillance','a','Porte'),x={...c('x'),alien:{cartes:[5],budgets:{'1:5':b}}};
        expect(budgetDuCombattantAlien(x,2,5)).toMatchObject({herite:true,rapides:1,surveillance:'Porte'});
    });
    it('Vitesse 2 donne deux cartes sans dupliquer Santé et ne remet aucune carte',()=>{
        const a=distribuerCartesAlien([c('x'),c('y')],x=>x.id==='x'?2:1,()=>0.5)!;
        expect(a).toHaveLength(2);const file=fileDesInitiativesAlien(a);expect(file).toHaveLength(3);expect(new Set(file.map(x=>x.carte)).size).toBe(3);expect(a.find(x=>x.id==='x')?.hp).toBe(6);
    });
    it('plus de dix cartes demande de grouper les PNJ ; pas de doublon aléatoire',()=>expect(distribuerCartesAlien(Array.from({length:6},(_,i)=>c(String(i))),()=>2)).toBeUndefined());
});
