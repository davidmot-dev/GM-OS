import fs from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import AdmZip from 'adm-zip';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {nexusService} from '../../src/modules/system/archive/NexusService';
import type {NexusCampaignState,NexusManifest} from '../../src/modules/system/archive/nexus.types';
import {preparerLeJet} from '../../src/modules/dice/DescripteurDeJet';
import {degreDuDe} from '../../src/modules/dice/degresDeReussite';
import {HealthInterpreter} from '../../src/modules/session/logic/HealthInterpreter';
import {santeDeDepart,valeurDuChamp} from '../../src/modules/combat/logic/SanteDuCombattant';
import {caviarderPourLesJoueurs} from '../../src/modules/remote/logic/caviardageDesJoueurs';
import {useSessionOSStore} from '../../src/modules/session/useSessionOSStore';
import {modulesDuPilote} from '../../src/modules/modulesDuJeu/catalogue';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const dir='output/campagnes-tests/delta-green/',nom='01-Delta-Green-Les-dossiers-de-la-pluie.gmos';
const z=new AdmZip(dir+nom),s=JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m=JSON.parse(z.readAsText('manifest.json')) as NexusManifest;
const pilote=s.requiredDriverData![0],fiche=s.requiredTemplateData![0],pcs=s.players.flatMap(p=>p.characters),rec=pcs.find(p=>p.name==='[RECETTE] JET')!;
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const initial=useSessionOSStore.getState();afterEach(()=>{useSessionOSStore.setState(initial,true);vi.restoreAllMocks();});
describe('campagne Delta Green — données effectivement livrées',()=>{
 it('manifeste natif, dépendances et archive unique',()=>{
  expect(nexusService.validateManifest(m)).toEqual([]);expect(m.campaignId).toBe(s.campaign.id);expect(fs.readdirSync(dir).filter(f=>f.endsWith('.gmos'))).toEqual([nom]);expect(pilote.version).toBe('2.0.1');expect(fiche.sections.flatMap(s=>s.fields)).toHaveLength(164);expect(modulesDuPilote(pilote,'systems/delta-green').modules).toEqual([]);
 });
 it('tous les médias référencés sont embarqués avec empreintes exactes',()=>{
  const refs=new Set(m.assetMap.map(a=>a.originalRef));expect(m.assetMap).toHaveLength(26);
  for(const a of m.assetMap){expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);const b=z.readFile(a.relativePath)!;expect(b.length).toBe(a.sizeBytes);expect(hash(b)).toBe(a.checksum);}
  for(const p of nexusService.collectAssetPaths(s))expect(refs.has(p),p).toBe(true);
  // Le pilote livré contient un lien NotebookLM, pas un média à télécharger.
  const urls=nexusService.scanForRemoteUrls(s);expect(urls).toHaveLength(1);expect(urls[0]).toMatch(/^https:\/\/notebook.google.com\/notebook\//);
 });
 it('liens de Trame, séances, lieux, personnages, indices et rencontres cohérents',()=>{
  expect(s.sessions).toHaveLength(12);expect(s.scenes).toHaveLength(41);expect(s.actes).toHaveLength(5);
  const ids=(a:{id:string}[])=>new Set(a.map(x=>x.id)),sc=ids(s.scenes!),ac=ids(s.actes!),loc=ids(s.atlasMaps),pc=ids(pcs),npc=ids(s.entities),cl=ids(s.clues);
  for(const x of s.scenes!){expect(ac.has(x.acteId)).toBe(true);expect(loc.has(x.lieuId!)).toBe(true);for(const p of x.personnagesIds!)expect(pc.has(p)).toBe(true);for(const p of x.entiteIds)expect(npc.has(p)).toBe(true);for(const p of x.indiceIds)expect(cl.has(p)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);}
  for(const se of s.sessions){expect(se.status).toBe('planned');expect(se.scenesPrevuesIds).toHaveLength(3);for(const id of se.scenesPrevuesIds!)expect(sc.has(id)).toBe(true);}
  for(const r of s.rencontres!){expect(sc.has(r.sceneId!)).toBe(true);for(const l of r.lignes)if(l.genre==='entite')expect(npc.has(l.entiteId)).toBe(true);}
 });
 it('profils de recette hors des scènes narratives ; ateliers accessibles sans progression',()=>{
  const r=new Set(pcs.filter(p=>p.name.startsWith('[RECETTE]')).map(p=>p.id));expect(r.size).toBe(3);
  for(const x of s.scenes!){if(x.acteId.endsWith('-recette')){expect(x.importance).toBe('optionnelle');expect(x.personnagesIds!.every(p=>r.has(p))).toBe(true);}else{expect(x.personnagesIds!.some(p=>r.has(p))).toBe(false);expect(x.enchainements!.some(e=>e.vers.includes('-atelier-'))).toBe(false);for(const t of ['Informations et voies alternatives :','Réactions :','Issues :','Transition :'])expect(x.notesDuMeneur).toContain(t);}}
 });
 it('types des champs, santé réelle et jauges dérivées',()=>{
  const champs=new Map(fiche.sections.flatMap(s=>s.fields).map(f=>[f.id,f]));
  for(const p of [...pcs,...s.entities]){const v=p.sheetData!;for(const[k,x]of Object.entries(v)){const f=champs.get(k)!;expect(f,k).toBeDefined();expect(typeof x).toBe(f.type==='checkbox'?'boolean':['number','gauge','rating'].includes(f.type)?'number':'string');}expect(p.maxHp).toBe(santeDeDepart(pilote.combat!.santeDeDepart,k=>valeurDuChamp(v,k)));expect(p.healthSystem!.data.current).toBe(v.PV);expect(v.VOL).toBe(v.POU);expect(v.SR).toBe(Number(v.SAN)-Number(v.POU));}
 });
 const preparer=(champ:string,modificateurDuSeuil=0)=>preparerLeJet(pilote.jet!,rec.sheetData!,{champs:{competence:champ},difficulte:1,desSupplementaires:0,modificateurDuSeuil},fiche.sections);
 it('prépare les valeurs du vrai personnage et borne les chances',()=>{expect(preparer('recherche').seuil).toBe(50);expect(preparer('FOR').seuil).toBe(55);expect(preparer('recherche',40).seuil).toBe(90);expect(preparer('autre1',40).seuil).toBe(99);expect(preparer('autre2',-40).seuil).toBe(1);});
 it.each([[1,'reussite-particuliere'],[11,'reussite-particuliere'],[44,'reussite-particuliere'],[50,'reussite-normale'],[51,'echec-normal'],[55,'echec-total'],[99,'echec-total'],[100,'echec-total']])('dé%s au seuil50 : %s',(de,attendu)=>{expect(degreDuDe(Number(de),preparer('recherche').echelle!)).toBe(attendu);});
 it('applique un impact de3 sur le profil synthétique',()=>{expect(HealthInterpreter.calculateNextState(rec.healthSystem!,{value:3,type:'solide'}).data.current).toBe(9);});
 it('GM-05 retire les marqueurs privés complets et partiels',()=>{
  for(const charge of [{session:{sessions:s.sessions,players:s.players,entities:s.entities,atlasMaps:s.atlasMaps},lectureDuMeneur:{actes:s.actes,scenes:s.scenes}},{session:{sessions:s.sessions.slice(0,1)}}])expect(JSON.stringify(caviarderPourLesJoueurs(charge))).not.toContain('SECRET_MJ_DG_PLUIE');
 });
 it('injection Nexus en mémoire : une campagne ajoutée et anciens PJ/avatars conservés',()=>{
  const ancienne={id:'temoin-fiction',name:'Témoin fictif'};const joueurs=s.players.map((p,i)=>({...p,avatarUrl:'avatar-'+i,characters:[{...pcs[0],id:'ancien-'+i,campaignId:ancienne.id}]}));
  useSessionOSStore.setState({...initial,campaigns:[ancienne],players:joueurs,entities:[],sessions:[],actes:[],scenes:[],atlasMaps:[],wikiEntries:[],clues:[],timelineEvents:[]});
  (nexusService as unknown as {injectState:(e:NexusCampaignState)=>void}).injectState(s);const etat=useSessionOSStore.getState();expect(etat.campaigns).toHaveLength(2);expect(etat.players).toHaveLength(3);
  for(const[i,p]of etat.players.entries()){expect(p.avatarUrl).toBe('avatar-'+i);expect(p.characters).toHaveLength(3);expect(p.characters.some(c=>c.id==='ancien-'+i)).toBe(true);}
 });
 it('restauration locale par updateCharacter préserve la note et la SAN du héros en mémoire',()=>{
  const copie=JSON.parse(JSON.stringify(s)) as NexusCampaignState;copie.scenes![0].notesDuMeneur='TEMOIN_FICTION';
  useSessionOSStore.setState({...initial,players:copie.players,scenes:copie.scenes!});const san=copie.players[0].characters[0].sheetData!.SAN;
  const cible=copie.players[0].characters[1],action=useSessionOSStore.getState().updateCharacter;
  action('p-1',cible.id,{sheetData:{...cible.sheetData,recherche:20}});expect(useSessionOSStore.getState().players[0].characters[1].sheetData!.recherche).toBe(20);
  action('p-1',cible.id,{sheetData:{...cible.sheetData,recherche:50}});
  const serialise=JSON.parse(JSON.stringify({players:useSessionOSStore.getState().players,scenes:useSessionOSStore.getState().scenes}));expect(serialise.players[0].characters[1].sheetData.recherche).toBe(50);expect(serialise.players[0].characters[0].sheetData.SAN).toBe(san);expect(serialise.scenes[0].notesDuMeneur).toBe('TEMOIN_FICTION');
 });
 it('matrice complète et36 cas non prévalidés avec repères existants',()=>{
  const cs=JSON.parse(fs.readFileSync(dir+'cas-de-recette.json','utf8')),mat=JSON.parse(fs.readFileSync(dir+'matrice-couverture.json','utf8'));expect(cs).toHaveLength(36);expect(mat.flatMap((m:{casIds:string[]})=>m.casIds).sort()).toEqual(cs.map((c:{id:string})=>c.id).sort());
  for(const c of cs){expect(c.archive).toBe(nom);expect(s.scenes!.find(x=>x.id===c.repere.sceneId)!.personnagesIds).toContain(c.repere.personnageId);expect(c.source).toBeTruthy();}
  expect(fs.readFileSync(dir+'resultats.csv','utf8').match(/NON TESTÉ/g)).toHaveLength(36);
 });
});
