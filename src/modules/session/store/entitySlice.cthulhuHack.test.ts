import { createStore } from 'zustand/vanilla';
import { describe,expect,it } from 'vitest';
import { createEntitySlice,type EntitySlice } from './entitySlice';
import type { Campaign } from '../../../types/campaign.types';
import type { GameDriver } from '../../../types/drivers';
import type { PlayerCharacter } from '../../../types/player.types';
import { CLE_CTHULHU_HACK,annulerUsureCH,lireCH,type RegleCthulhuHack } from '../../dice/systemes/cthulhuHack';
import { estHorsDeCombat } from '../../combat/logic/SanteDuCombattant';
const r:RegleCthulhuHack={pv:'hp',fortune:'fortune',physique:['force','dexterite','constitution'],personnalite:['sagesse','intelligence','charisme'],armures:[{de:'armure',nom:'nomArmure',protection:'pa'}]};
function magasin(pulp=false){
    const pilote={id:'ch',jet:{cthulhuHack:r},combat:{defaultHealthType:'hp',statsToTrack:[{fieldId:'hp',isMainHP:true,max:'8'}]}} as GameDriver;
    const s=createStore<EntitySlice&{campaigns:Campaign[];customGameDrivers:GameDriver[];activeCampaignId:string}>((set,get,api)=>({
        ...createEntitySlice(set,get,api),campaigns:[{id:'c',system:'ch'}] as Campaign[],customGameDrivers:[pilote],activeCampaignId:'c',
    }));
    const c:PlayerCharacter={id:'pj',name:'Fictif',portraitUrl:'',templateId:'test',campaignId:'c',hp:8,maxHp:8,
        sheetData:{hp:8,armure:'d8',nomArmure:'Gilet',pa:3,[CLE_CTHULHU_HACK]:{...lireCH({}),pulp}}};
    s.setState({players:[{id:'j',realName:'Test',avatarUrl:'',isOnline:false,characters:[c]}]});return s;
}
describe('Cthulhu Hack dans les écritures réelles',()=>{
    it('la perte de PV queue une seule conséquence standard ; une nouvelle chute garde les précédentes',()=>{
        const s=magasin(),lire=()=>s.getState().players[0].characters[0];
        s.getState().handleApplyImpact('pj','pc',{value:9});s.getState().handleApplyImpact('pj','pc',{value:3});
        expect(lireCH(lire().sheetData!).consequences).toHaveLength(1);expect(lire().sheetData?.hp).toBe(0);
        s.getState().handleApplyImpact('pj','pc',{value:3,isRecovery:true});s.getState().handleApplyImpact('pj','pc',{value:3});
        expect(lireCH(lire().sheetData!).consequences.map(c=>c.cycle)).toEqual([1,2]);
    });
    it('Pulp reste actif à zéro et compte les véritables coups suivants, sans PV offerts',()=>{
        const s=magasin(true),lire=()=>s.getState().players[0].characters[0];
        s.getState().handleApplyImpact('pj','pc',{value:8});expect(estHorsDeCombat(lire())).toBe(false);
        s.getState().handleApplyImpact('pj','pc',{value:0});s.getState().handleApplyImpact('pj','pc',{value:1});
        expect(lire().hp).toBe(0);expect(lireCH(lire().sheetData!).consequences.map(c=>c.malus)).toEqual([0,1]);
    });
    it('tout déclin écrit perd un PA ; Fortune puis nouvelle usure ne perdent qu’un PA net',()=>{
        const s=magasin(),lire=()=>s.getState().players[0].characters[0].sheetData!;
        s.getState().updateCharacterSheetData('j','pj','armure','d6');expect(lire().pa).toBe(2);
        const restaure=annulerUsureCH(lire(),'armure',8,6);s.getState().updateCharacter('j','pj',{sheetData:{...restaure,armure:'d8'}});expect(lire().pa).toBe(3);
        s.getState().updateCharacterSheetData('j','pj','armure','d6');expect(lire().pa).toBe(2);
        s.getState().updateCharacter('j','pj',{sheetData:{hp:4,armure:'d6',nomArmure:'Gilet',pa:2}});
        expect(lireCH(lire()).armures).toHaveLength(2);
    });
});
