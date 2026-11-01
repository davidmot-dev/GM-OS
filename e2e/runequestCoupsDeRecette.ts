import {expect, type Page} from '@playwright/test';
import type {GmOsLance} from './lancerGmOs';
import {ouvrirLeModule,ongletDeLaFiche} from './lancerGmOs';
import type {useSessionOSStore} from '../src/modules/session/useSessionOSStore';
import type {useCombatStore} from '../src/modules/combat/useCombatStore';
import {localisationDuCoup} from '../src/modules/dice/systemes/runequest';

type Fenetre = {useSessionOSStore:typeof useSessionOSStore;useCombatStore:typeof useCombatStore};
const CORPS='recette-rq-corps-campagne-bornes',AVENTURE='recette-rq-campagne-bornes';

/** RQ-A1 : les archives importées, leurs fiches et les vraies portes de Combat-OS. */
export async function verifierLesCoupsRuneQuest(gmos:GmOsLance,image:(p:Page,nom:string)=>Promise<unknown>){
    const f=gmos.fenetre;
    const ids=await f.evaluate(campagne=>{
        const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState(),combat=w.useCombatStore.getState();
        s.setActiveCampaign(campagne);combat.clearCombatants();
        const pcs=s.players.flatMap(p=>p.characters);
        for(const code of ['C07','C08','C09']){
            const c=pcs.find(c=>c.campaignId===campagne&&c.name.startsWith(code))!;
            combat.addCombatant({name:c.name,init:0,isPlayer:true,faction:'player',statuses:[],sourcePlayerId:c.id});
        }
        const npc=s.entities.find(e=>e.campaignId===campagne)!;
        combat.addCombatant({name:npc.name,init:0,isPlayer:false,faction:'enemy',statuses:[],sourceEntityId:npc.id});
        combat.addCombatant({name:'Adversaire autonome de recette',init:0,isPlayer:false,faction:'enemy',statuses:[],sheetData:{...npc.sheetData}});
        const cartes=w.useCombatStore.getState().combatants;
        return {c07:cartes.find(c=>c.name.startsWith('C07'))!.id,c08:cartes.find(c=>c.name.startsWith('C08'))!.id,c09:cartes.find(c=>c.name.startsWith('C09'))!.id,
            npc:cartes.find(c=>c.sourceEntityId===npc.id)!.id,autonome:cartes.find(c=>c.name==='Adversaire autonome de recette')!.id};
    },CORPS);
    await ouvrirLeModule(gmos,'Combat-OS');
    const carte=(id:string)=>f.locator(`[data-combattant="${id}"]`);
    const zones=(id:string)=>carte(id).locator('[data-coups-localises]');
    await expect(zones(ids.c07).locator('[data-zone="bras-droit"]')).toHaveText('Bras droit 0/3 · PA 2');
    await expect(zones(ids.c08).locator('[data-zone="tete"]')).toHaveText('Tête -4/4');
    const lire=(id:string)=>f.evaluate(id=>{
        const w=window as unknown as Fenetre,c=w.useCombatStore.getState().combatants.find(c=>c.id===id)!;
        const s=w.useSessionOSStore.getState();
        const fiche=c.sourcePlayerId?s.players.flatMap(p=>p.characters).find(p=>p.id===c.sourcePlayerId):c.sourceEntityId?s.entities.find(p=>p.id===c.sourceEntityId):c;
        return {hp:c.hp,ficheHp:fiche?.hp,donnees:fiche?.sheetData};
    },id);
    const action=async(id:string,zone:string,n:number,soin=false)=>{
        const z=zones(id);await z.locator(`[data-zone="${zone}"]`).click();
        await z.getByLabel('Dégâts du coup',{exact:true}).fill(String(n));
        await z.getByRole('button',{name:soin?'Soigner':'Encaisser',exact:true}).click();
    };
    await action(ids.c09,'jambe-droite',5);
    expect(await lire(ids.c09)).toMatchObject({hp:8,ficheHp:8,donnees:{degats_jambe_droite:0,pv_jambe_droite:2}});
    await action(ids.c09,'jambe-droite',10);
    expect(await lire(ids.c09)).toMatchObject({hp:4,ficheHp:4,donnees:{degats_jambe_droite:4,pv_jambe_droite:2,points_de_vie:4}});
    await expect(zones(ids.c09).locator('[data-zone="jambe-droite"]')).toHaveText('Jambe droite -2/2 · PA 5');
    await image(f,'04-coup-plafonne-c09');
    await action(ids.c09,'jambe-droite',99,true);
    expect(await lire(ids.c09)).toMatchObject({hp:8,ficheHp:8,donnees:{degats_jambe_droite:0,pv_jambe_droite:2}});
    await action(ids.c07,'bras-droit',2,true);
    expect(await lire(ids.c07)).toMatchObject({hp:11,ficheHp:11,donnees:{degats_bras_droit:1,pv_bras_droit:3}});
    for(const id of [ids.npc,ids.autonome]){
        await action(id,'bras-droit',8);
        expect(await lire(id)).toMatchObject({hp:6,ficheHp:6,donnees:{degats_bras_droit:6,pv_bras_droit:3}});
    }
    await image(f,'05-coups-pnj-et-autonome');

    // Le geste « Porter le coup » depuis le jet vise une vraie fiche importée de 01.
    const cible=await f.evaluate(campagne=>{
        const w=window as unknown as Fenetre,s=w.useSessionOSStore.getState(),combat=w.useCombatStore.getState();
        s.setActiveCampaign(campagne);combat.clearCombatants();
        const p=s.players[0],pc=p.characters.find(c=>c.campaignId===campagne)!,npc=s.entities.find(e=>e.campaignId===campagne)!;
        combat.addCombatant({name:pc.name,init:0,isPlayer:true,faction:'player',statuses:[],sourcePlayerId:pc.id});
        combat.addCombatant({name:npc.name,init:0,isPlayer:false,faction:'enemy',statuses:[],sourceEntityId:npc.id});
        const cartes=w.useCombatStore.getState().combatants,attaquant=cartes.find(c=>c.sourcePlayerId===pc.id)!,cible=cartes.find(c=>c.sourceEntityId===npc.id)!;
        combat.updateCombatant(attaquant.id,{targetId:cible.id});
        w.useCombatStore.setState({currentTurnIdx:cartes.indexOf(attaquant)});
        s.setSelectedPlayer(p.id);s.setSelectedCharacter(pc.id);s.setCurrentView('players');
        return {id:cible.id,ficheId:npc.id,nom:npc.name,pv:npc.hp!,donnees:npc.sheetData!,attaquantId:pc.id,attaquantPV:pc.hp};
    },AVENTURE);
    await ouvrirLeModule(gmos,'Tableau de Bord');await ongletDeLaFiche(f,'Lancer un test');
    const panneau=f.locator('[data-panneau-de-jet]').first();await panneau.locator('select').first().selectOption('arme1');
    await panneau.getByRole('button',{name:'Lancer',exact:true}).click();
    await panneau.getByRole('button',{name:'Localiser le coup (1D20)',exact:true}).click();
    await expect(panneau.getByLabel('Cible du coup',{exact:true})).toHaveValue(cible.id);
    const ligne=panneau.locator('[data-localisation-runequest]');
    const de=Number((await ligne.textContent())!.match(/Localisation : (\d+)/)![1]);
    const zone=localisationDuCoup(de),cle=zone.cle.replaceAll('-','_'),pv=Number(cible.donnees['pv_'+cle]),armure=Number(cible.donnees['pa_'+cle]??0);
    await expect(panneau.locator('[data-pv-cible-runequest]')).toHaveText(`${cible.nom} · ${zone.label} : ${pv} PV max. sur la fiche`);
    await panneau.getByLabel('Dégâts portés',{exact:true}).fill('8');await panneau.getByRole('button',{name:'Porter le coup',exact:true}).click();
    const net=Math.max(0,8-armure),retenus=['jambe-droite','jambe-gauche','bras-droit','bras-gauche'].includes(zone.cle)?Math.min(net,2*pv):net;
    const resultat=await f.evaluate(({npcId,pcId})=>{
        const s=(window as unknown as Fenetre).useSessionOSStore.getState();
        return {npc:s.entities.find(e=>e.id===npcId)!,pc:s.players.flatMap(p=>p.characters).find(c=>c.id===pcId)!};
    },{npcId:cible.ficheId,pcId:cible.attaquantId});
    expect(resultat.npc.sheetData!['degats_'+cle]).toBe(retenus);expect(resultat.npc.hp).toBe(cible.pv-retenus);expect(resultat.pc.hp).toBe(cible.attaquantPV);
    await image(f,'06-coup-depuis-le-jet');
    return {reussi:true,pj:true,pnjLie:true,autonome:true,armure:true,plafond:true,soinBorne:true,depuisLeJet:true,
        persistanceAttendues:{c07:{degats_bras_droit:1,points_de_vie:11},npc01:{id:cible.ficheId,champ:'degats_'+cle,degats:retenus,hp:cible.pv-retenus}}};
}
