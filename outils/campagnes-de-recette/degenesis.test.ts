import fs from 'node:fs';
import path from 'node:path';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import AdmZip from 'adm-zip';
import {describe,it,expect,vi,afterAll} from 'vitest';
import {nexusService} from '../../src/modules/system/archive/NexusService';
import type {NexusCampaignState,NexusManifest} from '../../src/modules/system/archive/nexus.types';
import {controlerLePilote} from '../../src/modules/forge/rules/controlesDuPilote';
import {modulesDuPilote} from '../../src/modules/modulesDuJeu/catalogue';
import {santePrincipaleDeLaFiche,santeAlignee,maximumDeLaJauge} from '../../src/modules/combat/logic/SanteDuCombattant';
import {pistesDeSanteSelonLeJeu} from '../../src/modules/combat/logic/pistesDeDegenesis';
import {preparerLeJet} from '../../src/modules/dice/DescripteurDeJet';
import {actionsDuRound,confrontation,resoudreDegenesis} from '../../src/modules/dice/systemes/degenesis';
import {lireLaCorrespondance,versLaFiche} from '../../src/modules/fiches/correspondanceDeFiche';
import {lireDuJson} from '../../src/modules/tables/logic/collageDUneTable';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const dossier='output/campagnes-tests/degenesis',noms=['01-La-Station-des-Cendres','02-Sante-et-Limites','03-Reserves-et-Declencheurs'];
const toutes=noms.map(n=>{const z=new AdmZip(path.join(dossier,n+'.gmos'));return {z,s:JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m:JSON.parse(z.readAsText('manifest.json')) as NexusManifest};});
const empreinte=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
afterAll(()=>fs.writeFileSync(path.join(dossier,'verification-contexte.json'),JSON.stringify({archives:noms.map(n=>({fichier:n+'.gmos',sha256:empreinte(fs.readFileSync(path.join(dossier,n+'.gmos')))})),assertions:'degenesis.test.ts ; résultat global verification-archives.json'},null,2)+'\n'));
const pilote=toutes[0].s.requiredDriverData![0],fiche=toutes[0].s.requiredTemplateData![0];
const pcs=(i:number)=>toutes[i].s.players.flatMap(p=>p.characters),pj=(code:string)=>pcs(code.startsWith('S')?1:2).find(c=>c.name.startsWith(code))!;
const jet=(code:string,choix={},attribut='physique',competence='corps_a_corps')=>preparerLeJet(pilote.jet!,pj(code).sheetData,{champs:{attribut,competence},degenesis:choix},fiche.sections);
const pistes=(code:string,value:number,type='physique',isRecovery=false)=>pistesDeSanteSelonLeJeu(pilote.combat.pistesDeSante,pj(code).sheetData,{value,type,isRecovery},pilote.combat.statsToTrack)!;
describe('les campagnes Degenesis livrées',()=>{
 for(const[i,{z,s,m}]of toutes.entries()){
  it(noms[i]+' : intégrité Nexus, chemins et médias',()=>{
   expect(nexusService.validateManifest(m)).toEqual([]);expect(m.campaignId).toBe(s.campaign.id);expect(m.exportedAt).toBe('2026-10-30T12:00:00.000Z');expect(m.gmosVersion).toBe(JSON.parse(fs.readFileSync('package.json','utf8')).version);expect(m.assetMap).toHaveLength(40);
   for(const a of m.assetMap){expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);const b=z.readFile(a.relativePath)!;expect(b.length).toBe(a.sizeBytes);expect(empreinte(b)).toBe(a.checksum);if(a.mimeType==='audio/wav')expect(b.toString('ascii',8,12)).toBe('WAVE');if(a.mimeType==='image/svg+xml')expect(b.toString('utf8')).not.toMatch(/<script|<foreignObject|<image|href=/);}
   const refs=new Set(m.assetMap.map(a=>a.originalRef));for(const r of nexusService.collectAssetPaths(s))if(!r.startsWith('data:'))expect(refs.has(r),r).toBe(true);expect(nexusService.scanForRemoteUrls(s)).toEqual([]);
  });
  it(noms[i]+' : liens de fiction et portée des outils',()=>{
   const set=(a:{id:string}[])=>new Set(a.map(x=>x.id)),pc=set(pcs(i)),npc=set(s.entities),lieux=set(s.atlasMaps),sc=set(s.scenes!),actes=set(s.actes!),cl=set(s.clues),moments=set(s.moments!);
   for(const x of s.scenes!){expect(x.campaignId).toBe(s.campaign.id);expect(actes.has(x.acteId)).toBe(true);expect(lieux.has(x.lieuId!)).toBe(true);for(const id of x.personnagesIds!)expect(pc.has(id)).toBe(true);for(const id of x.entiteIds)expect(npc.has(id)).toBe(true);for(const id of x.indiceIds)expect(cl.has(id)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);if(x.momentDeStoryboardId)expect(moments.has(x.momentDeStoryboardId)).toBe(true);}
   for(const carte of s.atlasMaps)expect(['battlemap','world-map','region','city','dungeon']).toContain(carte.type);
   for(const c of s.clues){expect(lieux.has(c.locationId!)).toBe(true);expect(npc.has(c.ownerId!)).toBe(true);}
   for(const p of pcs(i))for(const r of p.relations??[])expect((r.targetType==='pc'?pc:npc).has(r.targetId)).toBe(true);
   for(const se of s.sessions){expect(se.status).toBe('planned');for(const id of se.scenesPrevuesIds??[])expect(sc.has(id)).toBe(true);}
   for(const at of s.atmospheres!)for(const[k,pad]of Object.entries(at.pads))expect(k).toBe(pad.id);
   for(const a of [...s.atmospheres!,...s.playlists!,...s.tuilesDeLumiere!])expect(a.campagneId).toBe(s.campaign.id);
   for(const moment of s.moments!){expect(s.atmospheres!.some(a=>a.id===moment.soundAtmosphereId)).toBe(true);expect(Object.values(s.atmospheres![0].pads).some(p=>p.id===moment.soundPadId)).toBe(true);}
   for(const tuile of s.tuilesDeLumiere!)expect(tuile.lightStates).toEqual({});
  });
  it(noms[i]+' : types, choix opposés et maxima réels',()=>{
   const champs=new Map(fiche.sections.flatMap(s=>s.fields).map(f=>[f.id,f]));expect(champs.size).toBe(131);
   for(const c of [...pcs(i),...s.entities]){expect(c.campaignId).toBe(s.campaign.id);const d=c.sheetData!;expect(Object.keys(d)).toHaveLength(131);for(const[k,v]of Object.entries(d)){expect(champs.has(k),k).toBe(true);const f=champs.get(k)!;expect(typeof v,k).toBe(f.type==='number'?'number':'string');if(f.type==='number'){expect(Number(v),k).toBeGreaterThanOrEqual(0);if(f.max)expect(Number(v),k).toBeLessThanOrEqual(Number(f.max));}}
    expect(Number(d.concentration)*Number(d.pulsions)).toBe(0);expect(Number(d.foi)*Number(d.volonte)).toBe(0);
    const b=maximumDeLaJauge('blessures_superficielles',pilote.combat.statsToTrack,d)!,t=maximumDeLaJauge('traumatismes',pilote.combat.statsToTrack,d)!;expect(d.sante).toBe(b-Number(d.blessures_superficielles)+t-Number(d.traumatismes));expect(c.hp).toBe(d.sante);expect(c.maxHp).toBe(b+t);expect(c.healthSystem).toEqual(santeAlignee(undefined,santePrincipaleDeLaFiche(pilote,d)));
   }expect(controlerLePilote(s.requiredDriverData![0],s.requiredTemplateData![0])).toEqual([]);
  });
  it(noms[i]+' : pas de faux module',()=>{expect(modulesDuPilote(pilote).modules).toEqual([]);expect(s.modulesDuJeu).toBeUndefined();expect(s.deckSessionStates).toBeUndefined();expect(s.campaign.identiteVisuelle?.aEviter).toContain('photorealism');});
 }
 it('trois joueurs autorisés et 21 nouveaux PJ indépendants',()=>{expect(toutes.map(t=>t.s.players.flatMap(p=>p.characters).length)).toEqual([3,9,9]);for(const{s}of toutes)expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);expect(new Set(toutes.flatMap(t=>t.s.players.flatMap(p=>p.characters.map(c=>c.id)))).size).toBe(21);expect(new Set(toutes.flatMap(t=>t.s.tuilesDeLumiere!.map(x=>x.id))).size).toBe(9);});
 it.each([['D01',{},1,0],['D02',{},6,0],['D03',{modificateur:3},12,3],['D04',{modificateur:2},12,1],['D01',{modificateur:-8},0,0],['D05',{},4,0],['D02',{ego:3},9,0]])('%s : vraie réserve avec %j',(code,choix,des,automatiques)=>{const j=jet(String(code),choix);expect(j.nombreDeDes).toBe(des);expect(j.degenesis?.automatiques).toBe(automatiques);});
 it('combiner librement attribut et compétence sans muter la fiche',()=>{const avant=structuredClone(pj('D02').sheetData);expect(jet('D02',{},'intellect','perception').nombreDeDes).toBe(Number(avant.intellect)+Number(avant.perception));expect(pj('D02').sheetData).toEqual(avant);});
 it.each([[[2,4,6],2,2,1,'reussite'],[[6,2,3],4,1,0,'echec'],[[1,1,3],2,0,0,'echec-critique'],[[1,4,2],2,1,0,'echec'],[[1,1,1,4],1,1,0,'reussite']])('résultat préparé %j difficulté%i',(des,difficulte,succes,declencheurs,bilan)=>expect(resoudreDegenesis(des as number[],0,Number(difficulte)).degenesis).toMatchObject({succes,declencheurs,bilan}));
 it('S02 déborde sur les Traumatismes',()=>{expect(pistes('S02',3)).toMatchObject({fiche:{blessures_superficielles:10,traumatismes:2},impact:{value:3,isRecovery:false}});expect(pj('S02').hp).toBe(7);});
 it('S03 soigne seulement les Blessures',()=>expect(pistes('S03',3,'physique',true)).toMatchObject({fiche:{blessures_superficielles:7,traumatismes:2},impact:{value:3,isRecovery:true}}));
 it('S04 atteint le seuil mortel ; S05 ne déborde plus',()=>{expect(pistes('S04',1).fiche.traumatismes).toBe(6);expect(pistes('S04',1).texte).toContain('plus être sauvé');expect(pistes('S05',8).impact.value).toBe(0);});
 it('S06 : attaque mentale sur Égo, pas la chair',()=>{expect(pistes('S06',1,'mental')).toMatchObject({fiche:{ego_jauge:0},impact:{value:0}});expect(pistes('S06',1,'mental').texte).toContain('effondre');});
 it('S08 ne soigne jamais plus que les Blessures présentes',()=>expect(pistes('S08',9,'physique',true)).toMatchObject({fiche:{blessures_superficielles:0,traumatismes:2},impact:{value:3,isRecovery:true}}));
 it('S09 a son seuil de Sporulation réel, pas la taille imprimée24',()=>expect(maximumDeLaJauge('sporulations_jauge',pilote.combat.statsToTrack,pj('S09').sheetData)).toBe(10));
 it('initiative et confrontation : succès puis six',()=>{expect(confrontation({succes:3,six:1},{succes:3,six:0})).toBe('a');expect(actionsDuRound(2)).toBe(2);expect(actionsDuRound(5)).toBe(3);});
 it('129 clés réelles vers la fiche HTML dont les pistes subies',()=>{const table=lireLaCorrespondance(fs.readFileSync('docs/systems/degenesis/fiche/correspondance.json','utf8'))!;for(const c of [...pcs(0),pj('S03')]){const v=versLaFiche({sheetData:c.sheetData,narratif:{description:c.description,inventory:c.inventory},inventoryItems:c.inventoryItems},table);expect(v['identity.name']).toBe(c.name);expect(v['attributes.physical']).toBe(c.sheetData.physique);expect(v['tracks.ego']).toBe(c.sheetData.ego_jauge);expect(v['tracks.trauma']).toBe(c.sheetData.traumatismes);expect(v['weapons.0.name']).toBe(c.sheetData.arme1);}});
 it('clone Nexus cohérent et rejeu distinct d’un soin',()=>{let n=0;const s=toutes[0].s,clone=nexusService.applyResolutionToState(s,{strategy:'clone'},true,p=>p+'-dg-'+(++n));expect(clone.campaign.id).not.toBe(s.campaign.id);expect(clone.players.flatMap(p=>p.characters).every(c=>c.campaignId===clone.campaign.id)).toBe(true);expect(nexusService.applyResolutionToState(s,{strategy:'rejouer'}).players.flatMap(p=>p.characters.map(c=>c.sheetData))).toEqual(s.players.flatMap(p=>p.characters.map(c=>c.sheetData)));});
 it('tables originales lues par le vrai parseur Table-OS',()=>{for(const n of fs.readdirSync(path.join(dossier,'tables-a-importer'))){const t=lireDuJson(fs.readFileSync(path.join(dossier,'tables-a-importer',n),'utf8'))!;expect(t).not.toBeNull();expect(t.ignorees).toEqual([]);expect(t.entrees.every(e=>e.title.length>5)).toBe(true);expect(t.entrees.map(e=>[e.min,e.max])).toEqual([1,2,3,4,5,6].map(n=>[n,n]));}});
 it('66 cas humains vierges et chaque cas couvert une fois',()=>{const cs=JSON.parse(fs.readFileSync(path.join(dossier,'cas-de-recette.json'),'utf8')),m=JSON.parse(fs.readFileSync(path.join(dossier,'matrice-couverture.json'),'utf8'));expect(cs).toHaveLength(66);expect(new Set(cs.map((c:{id:string})=>c.id)).size).toBe(66);expect(m.flatMap((x:{casIds:string[]})=>x.casIds).sort()).toEqual(cs.map((c:{id:string})=>c.id).sort());expect(m.every((x:{source:string})=>x.source)).toBe(true);expect(fs.readFileSync(path.join(dossier,'resultats.csv'),'utf8').split(/\r?\n/).filter(l=>l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(66);});
});
