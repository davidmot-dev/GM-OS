import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createStore } from 'zustand';
import { useCombatStore } from './useCombatStore';
import { createEntitySlice, type EntitySlice } from '../session/store/entitySlice';
import { lireLeCombatAlien } from '../dice/systemes/combatAlien';
import { estHorsDeCombat } from './logic/SanteDuCombattant';
import type { GameDriver } from '../../types/drivers';
import type { Combatant } from './types';
const alien = { sante:'sante',force:'force',endurance:'endurance',protection:'protection',talents:'talent',proprietesArmes:'proprietes',stress:'stress',androide:'androide' };
const pilote = { id:'alien-a4',combat:{alien,defaultHealthType:'hp',statsToTrack:[{fieldId:'sante',isMainHP:true,max:'force'}]},jet:{panique:{suites:{mecanique:'alien',stress:'stress',androide:'androide',agilite:'agilite',empathie:'empathie'}}} } as GameDriver;
const creer = () => createStore<EntitySlice>((set,get,api)=>({...createEntitySlice(set,get,api),campaigns:[{id:'c',system:pilote.id}],customGameDrivers:[pilote],activeCampaignId:'c',getActiveDriver:()=>pilote}));
let seance: ReturnType<typeof creer>;
beforeEach(()=>{
    seance=creer();
    (window as unknown as {useSessionOSStore:unknown}).useSessionOSStore=seance;
    (window as unknown as {useCombatStore:unknown}).useCombatStore=useCombatStore;
    useCombatStore.setState({combatants:[],combatsGares:{},dejaConsigne:true,ouvertureConsignee:true});
});
afterEach(()=>{delete (window as unknown as {useSessionOSStore?:unknown}).useSessionOSStore;delete (window as unknown as {useCombatStore?:unknown}).useCombatStore;});
function preparer(autonome=false) {
    const sheetData={androide:true,force:4,sante:4,stress:5};
    if (!autonome) seance.setState({players:[{id:'j',realName:'Test',avatarUrl:'',isOnline:false,characters:[{id:'pj',name:'Synthétique',portraitUrl:'',templateId:'test',campaignId:'c',hp:4,maxHp:4,sheetData}]}]});
    useCombatStore.setState({combatants:[{id:'a',name:'Synthétique',isPlayer:!autonome,sourcePlayerId:autonome?undefined:'pj',hp:4,hpMax:4,init:1,faction:'ally',statuses:[],resistances:[],vulnerabilities:[],immunities:[],sheetData,healthSystem:{type:'hp',data:{current:4,max:4},state:'healthy',badges:[]}} as Combatant]});
}
describe('A4 : dégâts depuis le pupitre du combat',()=>{
    it('raccorde les coups à la fiche réelle, conserve la demande et garde le synthétique en lice',()=>{
        preparer();useCombatStore.getState().applyDamage(4,'physical',['a']);
        const c=seance.getState().players[0].characters[0];
        expect(c.sheetData).toMatchObject({sante:0,stress:5});expect(lireLeCombatAlien(c.sheetData!).critiques).toHaveLength(1);
        expect(useCombatStore.getState().combatants[0].hp).toBe(0);expect(estHorsDeCombat(useCombatStore.getState().combatants[0])).toBe(false);
        useCombatStore.getState().applyDamage(1,'physical',['a']);
        expect(lireLeCombatAlien(seance.getState().players[0].characters[0].sheetData!).critiques).toHaveLength(2);
    });
    it('immunité au froid ; le feu inflige encore ses dégâts',()=>{
        preparer();useCombatStore.getState().applyDamage(9,'cold',['a']);
        expect(seance.getState().players[0].characters[0].sheetData?.sante).toBe(4);
        useCombatStore.getState().applyDamage(1,'fire',['a']);expect(seance.getState().players[0].characters[0].sheetData?.sante).toBe(3);
    });
    it('le combattant autonome conserve aussi sa demande synthétique',()=>{
        preparer(true);useCombatStore.getState().applyDamage(4,'physical',['a']);
        const c=useCombatStore.getState().combatants[0];
        expect(c.sheetData?.sante).toBe(0);expect(lireLeCombatAlien(c.sheetData!).critiques).toHaveLength(1);expect(estHorsDeCombat(c)).toBe(false);
    });
});
