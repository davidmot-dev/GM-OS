import fs from 'node:fs';
import path from 'node:path';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import AdmZip from 'adm-zip';
import {describe,it,expect,vi,afterAll,afterEach} from 'vitest';
import {nexusService} from '../../src/modules/system/archive/NexusService';
import type {NexusCampaignState,NexusManifest} from '../../src/modules/system/archive/nexus.types';
import {modulesDuPilote} from '../../src/modules/modulesDuJeu/catalogue';
import {controlerLePilote} from '../../src/modules/forge/rules/controlesDuPilote';
import {santeDeDepart,valeurDuChamp} from '../../src/modules/combat/logic/SanteDuCombattant';
import {resolveInitiativeFormula} from '../../src/modules/combat/logic/CombatRules';
import {HealthInterpreter} from '../../src/modules/session/logic/HealthInterpreter';
import {preparerLeJet} from '../../src/modules/dice/DescripteurDeJet';
import {DiceEngine} from '../../src/modules/dice/DiceEngine';
import * as argy from '../../src/modules/dice/systemes/argyropee';
import {lireLaCorrespondance,versLaFiche,versGmOs} from '../../src/modules/fiches/correspondanceDeFiche';
import {caviarderPourLesJoueurs} from '../../src/modules/remote/logic/caviardageDesJoueurs';
import {useSessionOSStore} from '../../src/modules/session/useSessionOSStore';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const dir='output/campagnes-tests/argyropee',nom='01-Les-Comptes-de-la-maree.gmos';
const z=new AdmZip(path.join(dir,nom)),s=JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m=JSON.parse(z.readAsText('manifest.json')) as NexusManifest;
const pilote=s.requiredDriverData![0],fiche=s.requiredTemplateData![0],pcs=s.players.flatMap(p=>p.characters),pj=(code:string)=>pcs.find(p=>p.id.endsWith('-'+code.toLowerCase()))!;
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const initial=useSessionOSStore.getState();
afterEach(()=>{useSessionOSStore.setState(initial,true);vi.restoreAllMocks();});
afterAll(()=>{
 const archive={fichier:nom,sha256:hash(fs.readFileSync(path.join(dir,nom)))};
 fs.writeFileSync(path.join(dir,'verification-contexte.json'),JSON.stringify({archives:[archive],assertions:'argyropee.test.ts et argyropee-ecrans.test.tsx',portee:'Fonctions et composants en mémoire jsdom ; import natif Electron et réseau non exécutés.'},null,2)+'\n');
 const cible=pj('SANTE'),actuel=Number(cible.sheetData!.points_de_sante),hp=HealthInterpreter.calculateNextState(cible.healthSystem!,{value:5,type:'solide'});
 const de=vi.spyOn(DiceEngine,'roll').mockReturnValue(10),v=pj('JET').sheetData!;
 const initiative=resolveInitiativeFormula({formula:pilote.combat!.initiativeFormula!,combatant:{} as never,resolver:k=>Number(v[k])});de.mockRestore();
 fs.writeFileSync(path.join(dir,'verification-ecarts.json'),JSON.stringify({archive,verdict:'ÉCARTS DE RÈGLE CONSERVÉS — les tests de diagnostic ne valident pas ces règles',ecarts:[
  {id:'ARGY-SANTE-NEGATIVE',casHumain:'SAN-02',source:'Santé p.52-53 ; HealthInterpreter.handleHP',avant:actuel,impact:5,attendu:actuel-5,observe:hp.data.current,etatGenerique:hp.state,conforme:false},
  {id:'ARGY-INITIATIVE-ZERO',casHumain:'COM-01',source:'Initiative p.46 ; CombatRules.resolveInitiativeFormula',faceMoteur:10,attendu:Number(v.agilite)+Number(v.detection)+Number(v.bonus_initiative),observe:initiative,conforme:false},
 ]},null,2)+'\n');
});
describe('la campagne Argyropée livrée',()=>{
 it('archive unique, manifeste Nexus courant, date et dépendance exacte',()=>{
  expect(fs.readdirSync(dir).filter(n=>n.endsWith('.gmos'))).toEqual([nom]);expect(nexusService.validateManifest(m)).toEqual([]);expect(m.exportedAt).toBe('2026-11-09T12:00:00.000Z');expect(m.campaignId).toBe(s.campaign.id);
  expect(pilote.id).toBe('custom-1794176660508');expect(pilote.version).toBe('2.1.0');expect(fiche.id).toBe('tpl-1794176660508');expect(fiche.sections.flatMap(x=>x.fields)).toHaveLength(137);expect(controlerLePilote(pilote,fiche)).toEqual([]);
  expect(s.deckManifests).toBeUndefined();expect(s.deckSessionStates).toBeUndefined();expect(s.modulesDuJeu).toEqual({});expect(modulesDuPilote(pilote,'systems/argyropee').modules).toHaveLength(0);
 });
 it('tous les médias voyagent, sans URL distante ou chemin personnel',()=>{
  expect(m.assetMap).toHaveLength(48);const refs=new Set(m.assetMap.map(a=>a.originalRef));
  for(const a of m.assetMap){expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);const b=z.readFile(a.relativePath)!;expect(b.length).toBe(a.sizeBytes);expect(hash(b)).toBe(a.checksum);if(a.mimeType==='image/svg+xml')expect(b.toString()).not.toMatch(/<script|<foreignObject|<image|href=/);}
  for(const p of nexusService.collectAssetPaths(s))if(!p.startsWith('data:'))expect(refs.has(p),p).toBe(true);
  expect(nexusService.scanForRemoteUrls(s)).toEqual([]);
 });
 it('trois joueurs autorisés, trois héros et huit profils artificiels séparés',()=>{
  expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);expect(pcs).toHaveLength(11);expect(new Set(pcs.map(p=>p.id)).size).toBe(11);expect(pcs.filter(p=>p.name.startsWith('[RECETTE]'))).toHaveLength(8);
  for(const p of pcs){expect(p.campaignId).toBe(s.campaign.id);expect(p.systemId).toBe(pilote.id);expect(p.templateId).toBe(fiche.id);}
 });
 it('douze séances préparées et des ateliers sans obligation de fiction',()=>{
  expect(s.sessions).toHaveLength(12);expect(s.actes).toHaveLength(5);expect(s.scenes).toHaveLength(42);expect(s.atlasMaps).toHaveLength(12);expect(s.clues).toHaveLength(12);
  const r=new Set(pcs.filter(p=>p.name.startsWith('[RECETTE]')).map(p=>p.id));
  for(const x of s.scenes!){if(x.acteId.endsWith('-recette')){expect(x.importance).toBe('optionnelle');for(const p of x.personnagesIds!)expect(r.has(p)).toBe(true);}else{expect(x.notesDuMeneur!.length).toBeGreaterThan(650);for(const p of x.personnagesIds!)expect(r.has(p)).toBe(false);expect(x.enchainements!.every(e=>!e.vers.includes('-atelier-'))).toBe(true);}}
  for(const se of s.sessions){expect(se.status).toBe('planned');expect(se.scenesPrevuesIds).toHaveLength(3);expect(se.sessionEntityIds).toHaveLength(3);for(const t of ['Pression :','Réactions :','Issues :','Transition :'])expect(se.gmSecrets).toContain(t);}
  const livre=fs.readFileSync(path.join(dir,'CAMPAGNE-DU-MENEUR.md'),'utf8');for(const t of ['Fin A','Fin B','Fin C','Plusieurs moyens','aucune information indispensable derrière un unique jet'])expect(livre).toContain(t);
 });
 it('actes, scènes, lieux, indices, PNJ et rencontres ont des liens valides',()=>{
  const ids=(a:{id:string}[])=>new Set(a.map(x=>x.id)),sc=ids(s.scenes!),actes=ids(s.actes!),pc=ids(pcs),npc=ids(s.entities),loc=ids(s.atlasMaps),cl=ids(s.clues);
  for(const x of s.scenes!){expect(actes.has(x.acteId)).toBe(true);expect(loc.has(x.lieuId!)).toBe(true);for(const p of x.personnagesIds!)expect(pc.has(p)).toBe(true);for(const p of x.entiteIds)expect(npc.has(p)).toBe(true);for(const p of x.indiceIds)expect(cl.has(p)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);}
  for(const se of s.sessions)for(const id of se.scenesPrevuesIds!)expect(sc.has(id)).toBe(true);
  for(const c of s.clues){expect(npc.has(c.ownerId!)).toBe(true);expect(loc.has(c.locationId!)).toBe(true);}
  for(const r of s.rencontres!){expect(sc.has(r.sceneId!)).toBe(true);for(const l of r.lignes)if(l.genre==='entite')expect(npc.has(l.entiteId)).toBe(true);}
  for(const p of pcs)for(const r of p.relations??[])expect(npc.has(r.targetId)).toBe(true);
  for(const l of s.atlasMaps)for(const r of l.linkedEntities??[]){if(r.mapId)expect(loc.has(r.mapId)).toBe(true);if(r.entityId)expect(npc.has(r.entityId)).toBe(true);}
 });
 it('chaque valeur suit le gabarit ; santé et charges sont cohérentes',()=>{
  const champs=new Map(fiche.sections.flatMap(x=>x.fields).map(f=>[f.id,f]));
  for(const p of [...pcs,...s.entities])for(const[k,v]of Object.entries(p.sheetData??{})){const f=champs.get(k);expect(f,k).toBeDefined();expect(typeof v).toBe(f!.type==='checkbox'?'boolean':['number','gauge','rating'].includes(f!.type)?'number':'string');}
  for(const p of pcs){const v=p.sheetData!;expect(p.maxHp).toBe(santeDeDepart(pilote.combat!.santeDeDepart,k=>valeurDuChamp(v,k)));expect(v.points_de_sante_max).toBe(p.maxHp);expect(v.charge_lourde).toBe(2*Number(v.charge_legere));expect(v.charge_poussable).toBe(6*Number(v.charge_legere));expect(p.healthSystem!.data.current).toBe(Math.max(0,Number(v.points_de_sante)));}
 });
 it('le vrai préparateur et le jet de Serrurerie du PJ JET donnent la somme attendue',()=>{
  const v=pj('JET').sheetData!;const jet=preparerLeJet(pilote.jet!,v,{champs:{competence:'serrurerie'},difficulte:1,desSupplementaires:0},fiche.sections);
  expect(jet.seuil).toBe(3);const metiers=argy.metiersDeLaFiche(pilote.jet!.argyropee,v);expect(argy.bonusDuMetierChoisi(metiers,0)).toBe(2);
  expect(argy.lancerArgyropee(jet.seuil,2,{modificateur:0,aidants:0},()=>10)).toMatchObject({total:5,argyropee:{de:0,bilan:'echec'}});
  expect(argy.lancerArgyropee(jet.seuil,2,{modificateur:0,aidants:0},()=>4)).toMatchObject({total:9,argyropee:{bilan:'reussite-partielle'}});
 });
 it.each([[-1,'echec-critique'],[0,'echec-critique'],[1,'echec'],[7,'echec'],[8,'reussite-partielle'],[9,'reussite-partielle'],[10,'reussite'],[14,'reussite'],[15,'reussite-critique'],[21,'reussite-critique']])('les paliers sont éprouvés avec total imposé %i',(total,bilan)=>{
  expect(argy.resoudreArgyropee(0,Number(total),0,{modificateur:0,aidants:0}).argyropee.bilan).toBe(bilan);
 });
 it('le Panache rehausse le même dé sans dépasser9 et fournit le coût du palier',()=>{
  const avant=argy.lancerArgyropee(3,2,{modificateur:0,aidants:0},()=>1);
  expect(argy.paliersAtteignables(avant.argyropee)).toContainEqual({bilan:'reussite-partielle',cout:2});expect(argy.depenserLePanache(avant,2)).toMatchObject({total:8,argyropee:{de:1,deFinal:3,panache:2}});
  expect(argy.depenserLePanache(avant,99)).toMatchObject({total:14,argyropee:{deFinal:9,panache:8}});
 });
 it('l’action complexe lit les valeurs1 et4 du profil et distingue le rattrapage',()=>{
  const v=pj('JET').sheetData!,d=[Number(v.escalade),Number(v.furtivite)];expect(argy.moyenneDesCompetences(d)).toBe(2);
  expect(argy.resoudreArgyropee(4,1,0,{modificateur:0,aidants:0},0,d).argyropee.complexe).toMatchObject({issue:'partiellement-ratee',totalDeRattrapage:8});
  expect(argy.resoudreArgyropee(3,1,0,{modificateur:0,aidants:0},0,d).argyropee.complexe!.issue).toBe('ratee');
 });
 it('opposition : critique2, partielle1, seuil5 et égalité simultanée',()=>{
  const jet=(t:number)=>argy.resoudreArgyropee(0,t,0,{modificateur:0,aidants:0});const manches=[{joueur:jet(15),adversaire:jet(15)},{joueur:jet(15),adversaire:jet(10)},{joueur:jet(8),adversaire:jet(15)}];
  expect(argy.bilanDeLOpposition(manches)).toEqual({joueur:5,adversaire:5,issue:'egalite'});
 });
 it('les profils bornes d’Exubérance et Faveur sont effectivement différents',()=>{
  const jour=pj('JOUR').sheetData!,bas=pj('BAS').sheetData!,ko=pj('INCONSCIENT').sheetData!;
  expect(argy.obstacleALExuberance(Number(jour.panache),Number(jour.points_de_sante))).toBeNull();expect(argy.obstacleALExuberance(Number(bas.panache),Number(bas.points_de_sante))).toContain('3');expect(argy.obstacleALExuberance(Number(ko.panache),Number(ko.points_de_sante))).toContain('inconscient');
  expect(argy.prieresRestantes(jour.sciences_religieuses,jour.faveur_divine)).toBe(1);expect(argy.prieresRestantes(bas.sciences_religieuses,bas.faveur_divine)).toBe(0);expect(argy.regainDuMatin(10,jour.panache_bonus,jour.guigne_offerte).panache).toBe(15);
 });
 it('magie : coût du double domaine, seuil6→7 puis pas de second tirage à8',()=>{
  const v=pj('DOUBLE').sheetData!;expect(argy.doubleHumeur([v.humeur1_domaine,v.humeur2_domaine])).toBe(true);expect(argy.coutDuSort(true,true)).toBe(1);expect(argy.coutDuSort(true,false)).toBe(2);
  expect(argy.magieDuCombatApres(pj('MAGIE').sheetData!.magie_du_combat,1)).toEqual({apres:7,franchit:true});expect(argy.magieDuCombatApres(7,1)).toEqual({apres:8,franchit:false});expect(argy.silenciadaContractee(20)).toBe(true);expect(argy.silenciadaContractee(21)).toBe(false);
 });
 it('PNJ : nouveau d6, division entière et aucune carrière animale ajoutée',()=>{
  expect(argy.lancerUnPnj({privilegiee:true,carriere:2,modificateur:0},()=>5,()=>10)).toMatchObject({total:7,argyropee:{de:0,competence:5}});
  expect(argy.lancerUnPnj({privilegiee:false,carriere:2,modificateur:0},()=>5,()=>4)).toMatchObject({total:8,argyropee:{competence:2}});
  expect(argy.lancerUnPnj({privilegiee:true,carriere:0,modificateur:0},()=>5,()=>4).total).toBe(9);
 });
 it('documente l’écart réel de santé sans transformer0 HP en règle d’inconscience',()=>{
  const p=pj('SANTE'),apres=HealthInterpreter.calculateNextState(p.healthSystem!,{value:5,type:'solide'});
  expect(apres.data.current).toBe(0);expect(apres.state).toBe('dead');expect(Number(p.sheetData!.points_de_sante)-5).toBe(-1);
  expect(pj('INCONSCIENT').sheetData!.points_de_sante).toBe(-1);expect(pj('INCONSCIENT').healthSystem!.data.current).toBe(0);
 });
 it('documente le d10 générique d’initiative, qui lit10 au lieu de0',()=>{
  vi.spyOn(DiceEngine,'roll').mockReturnValue(10);const v=pj('JET').sheetData!;
  const score=resolveInitiativeFormula({formula:pilote.combat!.initiativeFormula!,combatant:{} as never,resolver:k=>Number(v[k])});
  expect(score).toBe(14);expect(0+Number(v.agilite)+Number(v.detection)+Number(v.bonus_initiative)).toBe(4);
 });
 it('les128 clés de la correspondance vont réellement à la fiche et reviennent',()=>{
  const table=lireLaCorrespondance(fs.readFileSync('docs/systems/argyropee/fiche/correspondance.json','utf8'))!;
  const p=pj('JET'),v=versLaFiche({sheetData:p.sheetData},table);expect(Object.keys(v)).toHaveLength(128);expect(v['skills.locksmithing.level']).toBe(3);expect(v['tracks.panache']).toBe(12);
  const retour=versGmOs({...v,'identity.name':'Nouveau nom de recette','skills.agility.level':5},table);
  expect(retour.sheetData).toMatchObject({nom:'Nouveau nom de recette',agilite:5});
 });
 it('GM-05 : le caviardage réel retire les marqueurs fictifs complets et partiels',()=>{
  const charge={session:{sessions:s.sessions,players:s.players,entities:s.entities,campaigns:[s.campaign],atlasMaps:s.atlasMaps,clues:s.clues},lectureDuMeneur:{actes:s.actes,scenes:s.scenes,wikiEntries:s.wikiEntries}};
  expect(JSON.stringify(caviarderPourLesJoueurs(charge))).not.toContain('SECRET_MJ_ARGY_MAREE');expect(charge.session.sessions[0].gmSecrets).toContain('SECRET_MJ_ARGY_MAREE');
  expect(JSON.stringify(caviarderPourLesJoueurs({session:{sessions:s.sessions.slice(0,1)}}))).not.toContain('SECRET_MJ_ARGY_MAREE');
 });
 it('injection réelle en mémoire : une campagne ajoutée, profils et anciens PJ conservés',()=>{
  const oldCampaign={id:'campagne-temoin-isolee',name:'Témoin fictif'},oldChar={...pcs[0],id:'ancien-pj-fictif',campaignId:oldCampaign.id,name:'Ancien personnage fictif'};
  const anciens=s.players.map((p,i)=>({...p,avatarUrl:`avatar-fictif-${i}`,characters:[{...oldChar,id:`ancien-pj-${i}`}]}));
  useSessionOSStore.setState({...initial,campaigns:[oldCampaign],players:anciens,entities:[],sessions:[],actes:[],scenes:[],atlasMaps:[],wikiEntries:[],clues:[],timelineEvents:[]});
  (nexusService as unknown as {injectState:(e:NexusCampaignState)=>void}).injectState(s);
  const state=useSessionOSStore.getState();expect(state.campaigns).toHaveLength(2);expect(state.players).toHaveLength(3);
  for(const[i,p]of state.players.entries()){expect(p.avatarUrl).toBe(`avatar-fictif-${i}`);expect(p.characters.some(c=>c.id===`ancien-pj-${i}`)).toBe(true);expect(p.characters.length).toBe(s.players[i].characters.length+1);}
 });
 it('61 cas humains et18 couvertures sourcées, aucun résultat humain prévalidé',()=>{
  const cs=JSON.parse(fs.readFileSync(path.join(dir,'cas-de-recette.json'),'utf8')),mat=JSON.parse(fs.readFileSync(path.join(dir,'matrice-couverture.json'),'utf8'));
  expect(cs).toHaveLength(61);expect(new Set(cs.map((c:{id:string})=>c.id)).size).toBe(61);expect(mat.flatMap((x:{casIds:string[]})=>x.casIds).sort()).toEqual(cs.map((c:{id:string})=>c.id).sort());
  for(const c of cs){expect(c.archive).toBe(nom);expect(c.source).toBeTruthy();expect(c.statut).toBe('NON TESTÉ');const sc=s.scenes!.find(x=>x.id===c.repere.sceneId)!;expect(sc.acteId).toBe(c.repere.acteId);expect(sc.personnagesIds).toContain(c.repere.personnageId);}
  expect(fs.readFileSync(path.join(dir,'resultats.csv'),'utf8').split(/\r?\n/).filter(l=>l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(61);
 });
 it('les empreintes portent sur les sources et le pilote effectivement livrés',()=>{
  const pr=JSON.parse(fs.readFileSync(path.join(dir,'provenance.json'),'utf8'));expect(pr.sourcesRegles).toHaveLength(20);
  for(const a of [...pr.sourcesRegles,...pr.sourcesTechniques,...pr.sourcesVisuelles,...pr.sourcesGenerateur])expect(hash(fs.readFileSync(a.fichier))).toBe(a.sha256);
  expect(hash(fs.readFileSync(pr.pilote.source))).toBe(pr.pilote.sha256);expect(hash(fs.readFileSync(path.join(dir,'Argyropee-2.1.0.gmos-driver')))).toBe(pr.pilote.sha256);
 });
});
