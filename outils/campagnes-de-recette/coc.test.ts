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
import {CHOIX_DE_COC,preparerCoc,resoudreCoc,bonusDuHeros,ajouterLeHeros,nombreDeDesDeCoc} from '../../src/modules/dice/systemes/coc';
import {encaissementSelonLeJeu} from '../../src/modules/combat/logic/encaissementDeCoc';
import {lireLaCorrespondance,versLaFiche} from '../../src/modules/fiches/correspondanceDeFiche';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const dir='output/campagnes-tests/coc',noms=['01-Les-Minutes-de-Verre','02-Sante-et-Etats','03-Heros-Blues-et-Tests'];
const toutes=noms.map(n=>{const z=new AdmZip(path.join(dir,n+'.gmos'));return {z,s:JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m:JSON.parse(z.readAsText('manifest.json')) as NexusManifest};});
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const pilote=toutes[0].s.requiredDriverData![0],fiche=toutes[0].s.requiredTemplateData![0];
const pcs=(i:number)=>toutes[i].s.players.flatMap(p=>p.characters),pj=(code:string)=>toutes.flatMap(t=>t.s.players.flatMap(p=>p.characters)).find(c=>c.name.startsWith(code+' —'))!;
afterAll(()=>fs.writeFileSync(path.join(dir,'verification-contexte.json'),JSON.stringify({archives:noms.map(n=>({fichier:n+'.gmos',sha256:hash(fs.readFileSync(path.join(dir,n+'.gmos')))})),assertions:'coc.test.ts ; résultat global verification-archives.json'},null,2)+'\n'));
const initial=useSessionOSStore.getState();afterEach(()=>{useSessionOSStore.setState(initial,true);vi.restoreAllMocks();});
describe('le lot COC2 réellement livré',()=>{
 for(const[i,{z,s,m}]of toutes.entries()){
  it(noms[i]+' : Nexus, médias et absence de dépendance au disque personnel',()=>{
   expect(nexusService.validateManifest(m)).toEqual([]);expect(m.campaignId).toBe(s.campaign.id);expect(m.exportedAt).toBe('2026-10-31T12:00:00.000Z');expect(m.assetMap).toHaveLength(40);
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
   const champs=new Map(fiche.sections.flatMap(s=>s.fields).map(f=>[f.id,f]));expect(champs.size).toBe(162);
   for(const c of [...pcs(i),...s.entities]){expect(c.campaignId).toBe(s.campaign.id);const d=c.sheetData!;expect(Object.keys(d)).toHaveLength(162);
    for(const[k,v]of Object.entries(d)){const f=champs.get(k)!;expect(f,k).toBeTruthy();expect(typeof v,k).toBe(f.type==='number'?'number':f.type==='checkbox'?'boolean':'string');if(f.type==='number'&&f.max)expect(Number(v),k).toBeLessThanOrEqual(Number(f.max));if(f.type==='select')expect(f.options).toContain(v);}
    expect(c.healthSystem).toEqual(casesAligneesSurLaFiche(undefined,pilote.combat,d));expect(c.healthSystem?.data.boxes.filter((b:{filled:boolean})=>b.filled)).toHaveLength(Number(d.echelle_de_sante));
    expect(c.hp).toBeUndefined();expect(d.initiative).toBe(10+Number(d.intelligence)+Number(d.perception));expect(d.defense).toBe(10+Number(d.agilite)+Number(d.perception));expect(d.capacite_de_guerison).toBe(Number(d.constitution)+3);
   }expect(controlerLePilote(pilote,fiche)).toEqual([]);
  });
  it(noms[i]+' : pas de module factice et portées des outils',()=>{
   expect(modulesDuPilote(pilote).modules).toEqual([]);expect(s.modulesDuJeu).toBeUndefined();for(const a of [...s.atmospheres!,...s.playlists!,...s.tuilesDeLumiere!])expect(a.campagneId).toBe(s.campaign.id);
   for(const t of s.tuilesDeLumiere!)expect(t.lightStates).toEqual({});for(const m of s.moments!){expect(s.atmospheres!.some(a=>a.id===m.soundAtmosphereId)).toBe(true);expect(Object.values(s.atmospheres![0].pads).some(p=>p.id===m.soundPadId)).toBe(true);}
  });
 }
 it('24 PJ nouveaux, trois joueurs autorisés, trois campagnes',()=>{expect(toutes.map((_,i)=>pcs(i).length)).toEqual([3,9,12]);expect(new Set(toutes.flatMap((_,i)=>pcs(i).map(p=>p.id))).size).toBe(24);expect(new Set(toutes.map(t=>t.s.campaign.id)).size).toBe(3);for(const{s}of toutes)expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);});
 it('le descripteur du pilote réel compose le bonus sélectionné pour COC',()=>{const j=preparerLeJet(pilote.jet!,pcs(0)[0].sheetData!,{champs:{caracteristique:'agilite'}},fiche.sections);expect(j.seuil).toBe(2);expect(j.reussitesRequises).toBe(1);expect(j.composantes[0].champ).toBe('agilite');});
 it.each([['S02',3,5,'Contusionné'],['S03',3,10,'Affaibli'],['S04',3,15,'Blessé'],['S05',3,20,'Mourant']])('%s franchit un seuil via la vraie porte des dégâts',(code,dm,apres,label)=>{
  const p=structuredClone(pj(code));vi.spyOn(console,'log').mockImplementation(()=>{});useSessionOSStore.setState({customGameDrivers:[pilote],campaigns:toutes.map(t=>t.s.campaign),activeCampaignId:p.campaignId,players:[{id:'p-1',realName:'Thomas D.',avatarUrl:'',isOnline:false,characters:[p]}]});
  const r=encaissementSelonLeJeu(pilote.combat.encaissement,p.sheetData,{value:dm});expect(r?.texte).toContain(label);useSessionOSStore.getState().handleApplyImpact(p.id,'pc',{value:dm});expect(useSessionOSStore.getState().players[0].characters[0].sheetData?.echelle_de_sante).toBe(apres);
 });
 it('RD ignorée pour feu et frontière stricte de mort instantanée',()=>{expect(encaissementSelonLeJeu(pilote.combat.encaissement,pj('S09').sheetData,{value:5,type:'sans protection (feu)'})?.impact.value).toBe(5);expect(encaissementSelonLeJeu(pilote.combat.encaissement,pj('S08').sheetData,{value:22})?.texte).not.toContain('tué sur le coup');expect(encaissementSelonLeJeu(pilote.combat.encaissement,pj('S08').sheetData,{value:23})?.texte).toContain('tué sur le coup');expect(encaissementSelonLeJeu(pilote.combat.encaissement,pj('S06').sheetData,{value:3})?.texte).toContain('coup de grâce');});
 it.each([['H00',[]],['H01',[2]],['H02',[2,4]],['H09',[2,4]],['H10',[5,10]],['H20',[5,10,10]]])('%s prépare ses vrais bonus après test',(code,bonus)=>expect(bonusDuHeros(Number(pj(code).sheetData!.echelle_evolution)).map(b=>b.bonus)).toEqual(bonus));
 it('santé physique et Blues lus depuis les PJ livrés',()=>{const r=pilote.jet!.coc!;expect(preparerCoc(r,CHOIX_DE_COC,{valeur:2,champ:'agilite'},pj('S07').sheetData!).total).toBe(-1);expect(preparerCoc(r,CHOIX_DE_COC,{valeur:2,champ:'intelligence'},pj('S07').sheetData!).total).toBe(2);for(const[code,v]of [['B04',0],['B05',1],['B10',3],['B15',5],['B20',10]] as const){expect(preparerCoc(r,CHOIX_DE_COC,{valeur:2,champ:'volonte'},pj(code).sheetData!).total).toBe(2+v);expect(preparerCoc(r,{...CHOIX_DE_COC,blues:'moins'},{valeur:2},pj(code).sheetData!).total).toBe(2-v);}});
 it('le héros franchit le seuil mais préserve le 1 naturel',()=>{const p=preparerCoc(pilote.jet!.coc!,CHOIX_DE_COC,{valeur:2},pj('H01').sheetData!);expect(ajouterLeHeros(resoudreCoc(p,[11]),p,2).coc.bilan).toBe('reussite');expect(ajouterLeHeros(resoudreCoc(p,[1]),p,20).coc.bilan).toBe('echec-critique');});
 it('vraie variante 3d6 : même ID, bonus et conversions explicites',()=>{const s=JSON.parse(new AdmZip(path.join(dir,'COC-2.0.0-option-3d6.gmos-driver')).readAsText('state.json'));expect(s.gameDriver.id).toBe(pilote.id);const prep=preparerCoc(s.gameDriver.jet.coc,{...CHOIX_DE_COC,conditions:2,bonus:1},{valeur:2},{});expect(prep.total).toBe(5);expect(nombreDeDesDeCoc(prep.solde,prep.des)).toEqual({nombre:4,faces:6});expect(resoudreCoc(prep,[1,3,4,6]).coc.naturel).toBe(13);});
 it('151 clés HTML reliées, cases numériques et cases de capacité booléennes',()=>{const table=lireLaCorrespondance(fs.readFileSync('docs/systems/coc/fiche/correspondance.json','utf8'))!;for(const c of [pcs(0)[0],pj('S07'),pj('V01')]){const v=versLaFiche({sheetData:c.sheetData,narratif:{description:c.description,inventory:c.inventory},inventoryItems:c.inventoryItems},table);expect(v['identity.name']).toBe(c.name);expect(v['tracks.health']).toBe(c.sheetData!.echelle_de_sante);}expect(table.champs).toHaveLength(151);});
 it('clone Nexus et rejeu ne valent pas soin ou remise à zéro',()=>{let n=0;const s=toutes[1].s,clone=nexusService.applyResolutionToState(s,{strategy:'clone'},true,p=>p+'-coc-'+(++n));expect(clone.campaign.id).not.toBe(s.campaign.id);expect(clone.players.flatMap(p=>p.characters).every(c=>c.campaignId===clone.campaign.id)).toBe(true);expect(nexusService.applyResolutionToState(s,{strategy:'rejouer'}).players.flatMap(p=>p.characters.map(c=>c.sheetData))).toEqual(s.players.flatMap(p=>p.characters.map(c=>c.sheetData)));});
 it('70 cas humains vierges, chaque cas couvert une fois et sources relues présentes',()=>{const cs=JSON.parse(fs.readFileSync(path.join(dir,'cas-de-recette.json'),'utf8')),m=JSON.parse(fs.readFileSync(path.join(dir,'matrice-couverture.json'),'utf8'));expect(cs).toHaveLength(70);expect(new Set(cs.map((c:{id:string})=>c.id)).size).toBe(70);expect(m.flatMap((x:{casIds:string[]})=>x.casIds).sort()).toEqual(cs.map((c:{id:string})=>c.id).sort());expect(m.every((x:{source:string})=>x.source)).toBe(true);expect(fs.readFileSync(path.join(dir,'resultats.csv'),'utf8').split(/\r?\n/).filter(l=>l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(70);const pr=JSON.parse(fs.readFileSync(path.join(dir,'provenance.json'),'utf8'));expect(pr.sourcesRegles).toHaveLength(18);for(const a of [...pr.sourcesRegles,...pr.sourcesTechniques])expect(hash(fs.readFileSync(a.fichier))).toBe(a.sha256);});
});
