import fs from 'node:fs';
import path from 'node:path';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import AdmZip from 'adm-zip';
import {describe,it,expect,vi,afterAll,afterEach} from 'vitest';
import {nexusService} from '../../src/modules/system/archive/NexusService';
import type {NexusCampaignState,NexusManifest} from '../../src/modules/system/archive/nexus.types';
import {controlerLePilote} from '../../src/modules/forge/rules/controlesDuPilote';
import {modulesDuPilote} from '../../src/modules/modulesDuJeu/catalogue';
import {casesAligneesSurLaFiche} from '../../src/modules/session/logic/HealthInterpreter';
import {useSessionOSStore} from '../../src/modules/session/useSessionOSStore';
import {preparerLeJet} from '../../src/modules/dice/DescripteurDeJet';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const dir='output/campagnes-tests/shadowrun-anarchy',noms=['01-La-Derniere-Couleur','02-Moniteur-et-Seuils','03-Risque-Anarchy-et-Matrice'];
const toutes=noms.map(n=>{const z=new AdmZip(path.join(dir,n+'.gmos'));return {z,s:JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m:JSON.parse(z.readAsText('manifest.json')) as NexusManifest};});
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const pilote=toutes[0].s.requiredDriverData![0],fiche=toutes[0].s.requiredTemplateData![0];
const pcs=(i:number)=>toutes[i].s.players.flatMap(p=>p.characters),pj=(code:string)=>toutes.flatMap(t=>t.s.players.flatMap(p=>p.characters)).find(c=>c.name.startsWith(code+' —'))!;
afterAll(()=>fs.writeFileSync(path.join(dir,'verification-contexte.json'),JSON.stringify({archives:noms.map(n=>({fichier:n+'.gmos',sha256:hash(fs.readFileSync(path.join(dir,n+'.gmos')))})),assertions:'shadowrun.test.ts ; résultat global verification-archives.json'},null,2)+'\n'));
const initial=useSessionOSStore.getState();afterEach(()=>{useSessionOSStore.setState(initial,true);vi.restoreAllMocks();});
import {reserveDeShadowrun,resoudreShadowrun,seuilDeSoin} from '../../src/modules/dice/systemes/shadowrun';
import {positionDuMoniteur} from '../../src/modules/combat/logic/moniteurDeShadowrun';
import {lireLaCorrespondance,versLaFiche} from '../../src/modules/fiches/correspondanceDeFiche';
describe('le lot Shadowrun Anarchy réellement livré',()=>{
 for(const[i,{z,s,m}]of toutes.entries()){
  it(noms[i]+' : Nexus, médias et absence de dépendance au disque personnel',()=>{
   expect(nexusService.validateManifest(m)).toEqual([]);expect(m.campaignId).toBe(s.campaign.id);expect(m.exportedAt).toBe('2026-11-01T12:00:00.000Z');expect(m.assetMap).toHaveLength(32);
   for(const a of m.assetMap){expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);const b=z.readFile(a.relativePath)!;expect(b.length).toBe(a.sizeBytes);expect(hash(b)).toBe(a.checksum);if(a.mimeType==='image/svg+xml')expect(b.toString('utf8')).not.toMatch(/<script|<foreignObject|<image|href=/);}
   const refs=new Set(m.assetMap.map(a=>a.originalRef));for(const r of nexusService.collectAssetPaths(s))if(!r.startsWith('data:'))expect(refs.has(r),r).toBe(true);expect(nexusService.scanForRemoteUrls(s)).toEqual([]);
  });
  it(noms[i]+' : tous les liens de fiction restent dans cette campagne',()=>{
   const ids=(a:{id:string}[])=>new Set(a.map(x=>x.id)),pc=ids(pcs(i)),npc=ids(s.entities),lieux=ids(s.atlasMaps),sc=ids(s.scenes!),actes=ids(s.actes!),cl=ids(s.clues);
   for(const x of s.scenes!){expect(x.campaignId).toBe(s.campaign.id);expect(actes.has(x.acteId)).toBe(true);expect(lieux.has(x.lieuId!)).toBe(true);for(const id of x.personnagesIds!)expect(pc.has(id)).toBe(true);for(const id of x.entiteIds)expect(npc.has(id)).toBe(true);for(const id of x.indiceIds)expect(cl.has(id)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);}
   for(const c of s.clues){expect(lieux.has(c.locationId!)).toBe(true);expect(npc.has(c.ownerId!)).toBe(true);}
   for(const p of pcs(i))for(const r of p.relations??[])expect(npc.has(r.targetId)).toBe(true);
   for(const se of s.sessions){expect(se.status).toBe('planned');for(const id of se.scenesPrevuesIds??[])expect(sc.has(id)).toBe(true);}
   for(const r of s.rencontres??[]){expect(sc.has(r.sceneId!)).toBe(true);for(const l of r.lignes)if(l.genre==='entite')expect(npc.has(l.entiteId)).toBe(true);}
  });
  it(noms[i]+' : types exacts, bornes et vraies cases du pilote',()=>{
   const champs=new Map(fiche.sections.flatMap(s=>s.fields).map(f=>[f.id,f]));expect(champs.size).toBe(125);
   for(const c of [...pcs(i),...s.entities]){expect(c.campaignId).toBe(s.campaign.id);const d=c.sheetData!;expect(Object.keys(d)).toHaveLength(125);
    for(const[k,v]of Object.entries(d)){const f=champs.get(k)!;expect(f,k).toBeTruthy();expect(typeof v,k).toBe(f.type==='number'?'number':f.type==='checkbox'?'boolean':'string');if(f.type==='number'&&f.max)expect(Number(v),k).toBeLessThanOrEqual(Number(f.max));if(f.type==='select')expect(f.options).toContain(v);}
    expect(c.healthSystem).toEqual(casesAligneesSurLaFiche(undefined,pilote.combat,d));expect(c.healthSystem?.data.boxes.filter((b:{filled:boolean})=>b.filled)).toHaveLength(Number(d.moniteur));
    expect(c.hp).toBeUndefined();
   }expect(controlerLePilote(pilote,fiche)).toEqual([]);
  });
  it(noms[i]+' : pas de module factice et portées des outils',()=>{
   expect(modulesDuPilote(pilote).modules).toEqual([]);expect(s.modulesDuJeu).toBeUndefined();for(const a of [...s.atmospheres!,...s.playlists!,...s.tuilesDeLumiere!])expect(a.campagneId).toBe(s.campaign.id);
   for(const t of s.tuilesDeLumiere!)expect(t.lightStates).toEqual({});for(const m of s.moments!){expect(s.atmospheres!.some(a=>a.id===m.soundAtmosphereId)).toBe(true);expect(Object.values(s.atmospheres![0].pads).some(p=>p.id===m.soundPadId)).toBe(true);}
  });
 }

 it('22 PJ distincts, trois joueurs autorisés et trois campagnes',()=>{expect(toutes.map((_,i)=>pcs(i).length)).toEqual([3,9,10]);expect(new Set(toutes.flatMap((_,i)=>pcs(i).map(p=>p.id))).size).toBe(22);expect(new Set(toutes.map(t=>t.s.campaign.id)).size).toBe(3);for(const{s}of toutes)expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);});
 it('le descripteur compose bien compétence et attribut',()=>{const j=preparerLeJet(pilote.jet!,pj('R00').sheetData!,{champs:{competence:'competence_1',attribut:'logique'}},fiche.sections);expect(j.nombreDeDes).toBe(10);expect(j.shadowrun).toBeTruthy();});
 it.each([['S00',6,0,0,0],['S00',7,1,0,0],['S00',9,1,0,0],['S00',10,0,1,0],['S00',12,0,1,0],['S00',13,0,0,1],['S02',7,2,1,0],['S03',7,2,1,1],['S05',7,3,0,0]])('%s VD %s par la vraie porte des dégâts',(code,vd,l,g,i)=>{
  const p=structuredClone(pj(String(code)));vi.spyOn(console,'log').mockImplementation(()=>{});
  useSessionOSStore.setState({customGameDrivers:[pilote],campaigns:toutes.map(t=>t.s.campaign),activeCampaignId:p.campaignId,players:[{id:'p-1',realName:'Thomas D.',avatarUrl:'',isOnline:false,characters:[p]}]});
  useSessionOSStore.getState().handleApplyImpact(p.id,'pc',{value:Number(vd),type:'physique'});const d=useSessionOSStore.getState().players[0].characters[0].sheetData!;
  expect([d.blessures_legeres,d.blessures_graves,d.blessures_incapacitantes]).toEqual([l,g,i]);expect(d.moniteur).toBe(positionDuMoniteur({legeres:Number(l),graves:Number(g),incapacitantes:Number(i)},{legeres:Number(p.sheetData!.blessures_legeres_max),graves:Number(p.sheetData!.blessures_graves_max),incapacitantes:1}));
 });
 it.each([['physique',0],['armure secondaire',1],['sans armure',1],['mental',1]])('VD 6, famille %s',(type,legeres)=>{
  const p=structuredClone(pj('S00'));vi.spyOn(console,'log').mockImplementation(()=>{});useSessionOSStore.setState({customGameDrivers:[pilote],campaigns:toutes.map(t=>t.s.campaign),activeCampaignId:p.campaignId,players:[{id:'p-1',realName:'Thomas D.',avatarUrl:'',isOnline:false,characters:[p]}]});useSessionOSStore.getState().handleApplyImpact(p.id,'pc',{value:6,type});expect(useSessionOSStore.getState().players[0].characters[0].sheetData!.blessures_legeres).toBe(legeres);
 });
 it('le soin natif efface la pire blessure',()=>{const p=structuredClone(pj('S06'));vi.spyOn(console,'log').mockImplementation(()=>{});useSessionOSStore.setState({customGameDrivers:[pilote],campaigns:toutes.map(t=>t.s.campaign),activeCampaignId:p.campaignId,players:[{id:'p-1',realName:'Thomas D.',avatarUrl:'',isOnline:false,characters:[p]}]});useSessionOSStore.getState().handleApplyImpact(p.id,'pc',{value:1,isRecovery:true});const d=useSessionOSStore.getState().players[0].characters[0].sheetData!;expect([d.blessures_legeres,d.blessures_graves,d.blessures_incapacitantes,d.moniteur]).toEqual([1,1,0,3]);});
 it.each([['R00',0,2],['R01',1,5],['R02',2,8],['R03',3,10]])('%s reprend la RR et le risque normal',(code,rr,risque)=>{const d=pj(code).sheetData!;const r=reserveDeShadowrun(Number(d.competence_1)+Number(d.competence_1_attribut),{rr:Number(d.competence_1_rr)});expect(r.rr).toBe(rr);expect(r.risque).toBe(risque);});
 it('les dés de risque réussis comptent double et RR ignore les 1',()=>{const r=reserveDeShadowrun(6,{rr:1,desDeRisque:3});const j=resoudreShadowrun({normaux:[5,2,1],risque:[6,5,1]},r,3);expect(j.shadowrun.succes).toBe(5);expect(j.shadowrun.complication).toBe('aucune');});
 it.each([[1,'mineure',0],[2,'critique',1],[3,'desastre',2]])('complication sur %s uns',(uns,complication,gain)=>{const r=reserveDeShadowrun(6,{rr:0});const j=resoudreShadowrun({normaux:[6,6,6,6],risque:Array(Number(uns)).fill(1)},r,3);expect(j.shadowrun.complication).toBe(complication);expect(j.shadowrun.anarchyGagnee).toBe(gain);if(uns===3)expect(j.tagSuccess).toBe(false);});
 it('la relance garde la complication sans second gain',()=>{const r=reserveDeShadowrun(6,{rr:0});const j=resoudreShadowrun({normaux:[6,6,6],risque:[6,6,6]},r,3,'critique');expect(j.shadowrun.complication).toBe('critique');expect(j.shadowrun.anarchyGagnee).toBe(0);});
 it.each([['R06',1],['R07',2],['R08',2],['R09',2]])('%s Essence et magie',(code,annules)=>{const d=pj(code).sheetData!;expect(reserveDeShadowrun(10,{magie:true},{essence:Number(d.essence)}).annules).toBe(annules);});
 it('le soin à Essence 2 relève le seuil de deux',()=>expect(seuilDeSoin('grave',2)).toBe(7));
 it('les 120 clés de valeur ont une correspondance et un retour exact',()=>{const c=lireLaCorrespondance(fs.readFileSync('docs/systems/shadowrun-anarchy/fiche/correspondance.json','utf8'));expect(c).toBeTruthy();const v=versLaFiche({sheetData:pcs(0)[0].sheetData!},c!);expect(Object.keys(v)).toHaveLength(120);});
 it('chaque cas a une source et une ligne de matrice, CSV vierge',()=>{const cas=JSON.parse(fs.readFileSync(path.join(dir,'cas-de-recette.json'),'utf8')) as {id:string;source:string}[];const m=JSON.parse(fs.readFileSync(path.join(dir,'matrice-couverture.json'),'utf8')) as {casIds:string[]}[];expect(cas).toHaveLength(64);for(const c of cas){expect(fs.existsSync(c.source)).toBe(true);expect(m.filter(x=>x.casIds.includes(c.id))).toHaveLength(1);}const csv=fs.readFileSync(path.join(dir,'resultats.csv'),'utf8');expect((csv.match(/NON TESTÉ/g)||[]).length).toBe(64);});
});
