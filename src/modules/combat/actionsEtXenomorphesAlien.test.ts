import { beforeEach,afterEach,describe,it,expect } from 'vitest';
import { createStore } from 'zustand';
import { useCombatStore } from './useCombatStore';
import { createEntitySlice,type EntitySlice } from '../session/store/entitySlice';
import { CLE_COMBAT_ALIEN,combatAlienVierge,lireLeCombatAlien } from '../dice/systemes/combatAlien';
import { xenoViergeAlien } from '../dice/systemes/xenomorphesAlien';
import { budgetDuCombattantAlien } from '../dice/systemes/actionsAlien';
import { estHorsDeCombat } from './logic/SanteDuCombattant';
import type { GameDriver } from '../../types/drivers';
const alien={actions:true,sante:'sante',force:'force',endurance:'endurance',protection:'protection',talents:'talent',proprietesArmes:'proprietes',stress:'stress',androide:'androide'};
const pilote={id:'a6',combat:{alien,defaultHealthType:'hp',statsToTrack:[{fieldId:'sante',isMainHP:true,max:'force'}]}} as GameDriver;
const creer=()=>createStore<EntitySlice>((set,get,api)=>({...createEntitySlice(set,get,api),campaigns:[{id:'c',system:'a6'}],activeCampaignId:'c',customGameDrivers:[pilote],getActiveDriver:()=>pilote}));
let s:ReturnType<typeof creer>;
beforeEach(()=>{
    s=creer();Object.assign(window,{useSessionOSStore:s,useCombatStore});
    useCombatStore.setState({combatants:[],currentTurnIdx:0,round:1,combatsGares:{},dejaConsigne:true,ouvertureConsignee:true});
    s.getState().addEntity({name:'XX121',type:'monster',role:'hostile',status:'alive',avatar:'',hp:6,maxHp:6,ac:0,speed:0,initiative:0,description:'',roleplayingNotes:'',gmSecretInfo:'',linkedMapIds:[],campaignId:'c',sheetData:{sante:6,force:2,protection:0,[CLE_COMBAT_ALIEN]:{...combatAlienVierge(),xenomorphe:{...xenoViergeAlien(),maximum:6,vitesse:2,xx121:true,acide:8}}}});
    useCombatStore.getState().addCombatant({name:'XX121',init:0,isPlayer:false,sourceEntityId:s.getState().entities[0].id,faction:'enemy',statuses:[]});
    useCombatStore.getState().addCombatant({name:'Marine',init:0,isPlayer:true,faction:'player',statuses:[],hp:4,hpMax:4});
});
afterEach(()=>{delete (window as unknown as {useSessionOSStore?:unknown}).useSessionOSStore;delete (window as unknown as {useCombatStore?:unknown}).useCombatStore;});
describe('A6 — vrai plateau et fiche de créature',()=>{
    it('deux créneaux autour du Marine partagent une seule créature et une seule Santé',()=>{
        const [x,h]=useCombatStore.getState().combatants;
        useCombatStore.setState({combatants:[{...x,init:1,alien:{cartes:[1,8],carteActive:1,budgets:{}}},{...h,init:4,alien:{cartes:[4],carteActive:4,budgets:{}}}]});
        useCombatStore.getState().nextTurn();expect(useCombatStore.getState().currentTurnIdx).toBe(1);
        useCombatStore.getState().nextTurn();expect(useCombatStore.getState().currentTurnIdx).toBe(0);expect(useCombatStore.getState().combatants[0].alien?.carteActive).toBe(8);expect(useCombatStore.getState().round).toBe(1);
        useCombatStore.getState().nextTurn();expect(useCombatStore.getState().round).toBe(2);expect(useCombatStore.getState().combatants).toHaveLength(2);
    });
    it('vrai tirage donne trois cartes distinctes et refuse de repiocher en cours de combat',()=>{
        const store=useCombatStore.getState();store.rollAutoInitiative({cards:10});const cartes=useCombatStore.getState().combatants.flatMap(c=>c.alien?.cartes??[]);expect(cartes).toHaveLength(3);expect(new Set(cartes).size).toBe(3);
        store.rollAutoInitiative({cards:10});expect(useCombatStore.getState().combatants.flatMap(c=>c.alien?.cartes??[])).toEqual(cartes);
    });
    it('le dommage à zéro crée un critique xéno et une demande d’acide, sans Brisé humain',()=>{
        const x=useCombatStore.getState().combatants[0];useCombatStore.getState().applyDamage(6,'physical',[x.id]);
        const e=s.getState().entities[0],suivi=lireLeCombatAlien(e.sheetData??{});
        expect(e.sheetData?.sante).toBe(0);expect(suivi.critiques).toHaveLength(1);expect(suivi.xenomorphe?.demandesAcide[0].des).toBe(14);expect(suivi.blessures).toEqual([]);
        expect(estHorsDeCombat(useCombatStore.getState().combatants[0])).toBe(false);
    });
    it('restaure le point d’une blessure dans les deux vues, sans plafond humain de Force',()=>{
        const e=s.getState().entities[0];s.getState().updateEntity(e.id,{sheetData:{...e.sheetData,sante:1,[CLE_COMBAT_ALIEN]:{...lireLeCombatAlien(e.sheetData??{}),xenomorphe:{...lireLeCombatAlien(e.sheetData??{}).xenomorphe!,etat:'blesse'}}}});
        expect(s.getState().entities[0].hp).toBe(1);expect(s.getState().entities[0].maxHp).toBe(6);expect(useCombatStore.getState().combatants[0].hp).toBe(1);
    });
    it('une réaction avant son initiative reste payée quand son créneau arrive',()=>{
        const [x,h]=useCombatStore.getState().combatants;useCombatStore.setState({combatants:[{...x,init:1,alien:{cartes:[1,8],carteActive:1,budgets:{}}},{...h,init:4,alien:{cartes:[4],carteActive:4,budgets:{}}}]});
        expect(useCombatStore.getState().agirAlien(h.id,'blocage','b',4)).toBe(true);useCombatStore.getState().nextTurn();
        const marine=useCombatStore.getState().combatants[1];expect(budgetDuCombattantAlien(marine,1,4).rapides).toBe(1);
        expect(useCombatStore.getState().agirAlien(h.id,'lente','l',4)).toBe(true);expect(useCombatStore.getState().agirAlien(h.id,'rapide','trop',4)).toBe(false);
    });
    it('la surveillance disparaît réellement après un coup subi',()=>{
        const x=useCombatStore.getState().combatants[0];useCombatStore.getState().updateCombatant(x.id,{alien:{cartes:[1],carteActive:1,budgets:{}}});useCombatStore.getState().agirAlien(x.id,'surveillance','s',1,'Porte');
        useCombatStore.getState().noterUnCoup(x.id,{value:1});expect(budgetDuCombattantAlien(useCombatStore.getState().combatants[0],1,1).surveillance).toBeUndefined();
    });
    it('une saisie administrative de Santé suit la fiche sans créer un dégât ou critique',()=>{
        const id=s.getState().entities[0].id;s.getState().updateEntityHP(id,3);expect(s.getState().entities[0].sheetData?.sante).toBe(3);
        expect(useCombatStore.getState().combatants[0].hp).toBe(3);
        s.getState().updateEntity(id,{gmSecretInfo:'Note du MJ'});expect(s.getState().entities[0].hp).toBe(3);
        s.getState().updateEntityHealth(id,{type:'hp',data:{current:0,max:6},state:'dead',badges:[]});
        expect(s.getState().entities[0].sheetData?.sante).toBe(0);expect(lireLeCombatAlien(s.getState().entities[0].sheetData??{}).critiques).toEqual([]);expect(s.getState().entities[0].healthSystem?.state).toBe('critical');
        expect(useCombatStore.getState().combatants[0].hp).toBe(0);
    });
});
