import fs from 'node:fs';
import {Buffer} from 'node:buffer';
import {createHash} from 'node:crypto';
import AdmZip from 'adm-zip';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {nexusService} from '../../src/modules/system/archive/NexusService';
import type {NexusCampaignState,NexusManifest} from '../../src/modules/system/archive/nexus.types';
import {preparerLeJet} from '../../src/modules/dice/DescripteurDeJet';
import {champsProposes} from '../../src/modules/dice/demandeDeJet';
import {compterLesReussites,compulsionAleatoire,resoudreVampire,relancerVampire,relanceImpossible,resoudreLExaltation} from '../../src/modules/dice/systemes/vampire';
import {naissanceDansLeJeu} from '../../src/modules/session/logic/jeuDuPersonnage';
import {santeDeDepart,valeurDuChamp} from '../../src/modules/combat/logic/SanteDuCombattant';
import {caviarderPourLesJoueurs} from '../../src/modules/remote/logic/caviardageDesJoueurs';
import {useSessionOSStore} from '../../src/modules/session/useSessionOSStore';
import {modulesDuPilote} from '../../src/modules/modulesDuJeu/catalogue';
import {lireLaCorrespondance,versLaFiche,versGmOs} from '../../src/modules/fiches/correspondanceDeFiche';
import {controlerLePilote} from '../../src/modules/forge/rules/controlesDuPilote';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const dir='output/campagnes-tests/vampire/',nom='01-Vampire-Le-registre-des-absents.gmos';
const z=new AdmZip(dir+nom),s=JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m=JSON.parse(z.readAsText('manifest.json')) as NexusManifest;
const pilote=s.requiredDriverData![0],fiche=s.requiredTemplateData![0],pcs=s.players.flatMap(p=>p.characters),rec=pcs.find(p=>p.name==='[RECETTE] JET')!,corps=pcs.find(p=>p.name==='[RECETTE] CORPS')!;
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const initial=useSessionOSStore.getState();
afterEach(()=>{useSessionOSStore.setState(initial,true);vi.restoreAllMocks();});
const preparer=(champs:Record<string,string>,options={},v=rec.sheetData!)=>preparerLeJet(pilote.jet!,v,{champs,difficulte:3,desSupplementaires:0,...options},fiche.sections);

describe('Vampire — campagne réellement livrée',()=>{
 it('manifeste natif, pilote et unique archive de campagne',()=>{
  expect(nexusService.validateManifest(m)).toEqual([]);expect(m.campaignId).toBe(s.campaign.id);
  expect(fs.readdirSync(dir).filter(f=>f.endsWith('.gmos'))).toEqual([nom]);
  expect(pilote.id).toBe('custom-1794902116143');expect(pilote.version).toBe('2.0.0');expect(fiche.id).toBe('tpl-1794902116144');
  expect(controlerLePilote(pilote,fiche)).toEqual([]);expect(fiche.sections.flatMap(x=>x.fields)).toHaveLength(137);
  expect(modulesDuPilote(pilote,'systems/vampire').modules).toEqual([]);
 });
 it('tous les médias sont embarqués avec leur empreinte et sans chemin privé',()=>{
  expect(m.assetMap).toHaveLength(33);const refs=new Set(m.assetMap.map(a=>a.originalRef));
  for(const a of m.assetMap){expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);const b=z.readFile(a.relativePath)!;expect(b.length).toBe(a.sizeBytes);expect(hash(b)).toBe(a.checksum);}
  for(const p of nexusService.collectAssetPaths(s))expect(refs.has(p),p).toBe(true);
  expect(nexusService.collectAssetPaths(s).size).toBe(33);expect(nexusService.scanForRemoteUrls(s)).toEqual([]);
  expect(JSON.stringify(s)).not.toMatch(/C:\\Users\\|APPDATA|Security_Backup_GMOS/);
 });
 it('tous les identifiants et les liens de campagne sont cohérents',()=>{
  const ids=(a:{id:string}[])=>new Set(a.map(x=>x.id));const sc=ids(s.scenes!),ac=ids(s.actes!),loc=ids(s.atlasMaps),pc=ids(pcs),npc=ids(s.entities),cl=ids(s.clues);
  const all=[s.campaign,...s.scenes!,...s.actes!,...s.atlasMaps,...pcs,...s.entities,...s.clues,...s.sessions,...s.rencontres!,...s.wikiEntries];
  expect(ids(all).size).toBe(all.length);for(const x of all.slice(1))expect(x.campaignId).toBe(s.campaign.id);
  for(const x of s.scenes!){expect(ac.has(x.acteId)).toBe(true);expect(loc.has(x.lieuId!)).toBe(true);for(const p of x.personnagesIds!)expect(pc.has(p)).toBe(true);for(const p of x.entiteIds)expect(npc.has(p)).toBe(true);for(const p of x.indiceIds)expect(cl.has(p)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);}
  for(const x of s.rencontres!){expect(sc.has(x.sceneId!)).toBe(true);for(const l of x.lignes)if(l.genre==='entite')expect(npc.has(l.entiteId)).toBe(true);}
  for(const x of s.atlasMaps)for(const l of x.linkedEntities??[])if(l.entityId)expect(npc.has(l.entityId)).toBe(true);
 });
 it('douze séances préparées, quatre actes de fiction et six ateliers autonomes',()=>{
  expect(s.sessions).toHaveLength(12);expect(s.scenes).toHaveLength(42);expect(s.actes).toHaveLength(5);
  const recette=s.actes!.find(a=>a.titre==='ATELIERS DE RECETTE — hors fiction')!;
  expect(s.scenes!.filter(x=>x.acteId===recette.id)).toHaveLength(6);
  for(const se of s.sessions){expect(se.status).toBe('planned');expect(se.scenesPrevuesIds).toHaveLength(3);expect(se.gmSecrets!.length).toBeGreaterThan(1200);}
  for(const x of s.scenes!){expect(x.passages).toEqual([]);expect(x.termineeLe).toBeUndefined();if(x.acteId===recette.id){expect(x.importance).toBe('optionnelle');expect(x.enchainements).toEqual([]);expect(x.personnagesIds!.every(p=>pcs.find(c=>c.id===p)!.name.startsWith('[RECETTE]'))).toBe(true);}else{expect(x.personnagesIds!.some(p=>pcs.find(c=>c.id===p)!.name.startsWith('[RECETTE]'))).toBe(false);expect(x.notesDuMeneur).toContain('Informations et voies alternatives');expect(x.notesDuMeneur).toContain('Réactions :');expect(x.notesDuMeneur).toContain('Issues :');expect(x.notesDuMeneur).toContain('Transition :');expect(x.enchainements!.some(e=>e.vers.includes('-atelier-'))).toBe(false);}}
 });
 it('les joueurs autorisés ont de nouveaux PJ, sans anciens avatars ni PJ copiés',()=>{
  expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);
  expect(pcs).toHaveLength(6);for(const p of s.players){expect(p.avatarUrl).toBe('');expect(p.characters).toHaveLength(2);expect(p.characters.filter(c=>c.name.startsWith('[RECETTE]'))).toHaveLength(1);}
  expect(s.entities).toHaveLength(11);expect(s.entities.filter(e=>e.name.startsWith('[RECETTE]'))).toHaveLength(1);
 });
 it('tous les champs du pilote ont leur type et leurs bornes, PNJ compris',()=>{
  const fields=new Map(fiche.sections.flatMap(x=>x.fields).map(f=>[f.id,f]));
  for(const p of [...pcs,...s.entities]){expect(Object.keys(p.sheetData!)).toHaveLength(137);for(const [key,value]of Object.entries(p.sheetData!)){const f=fields.get(key)!;expect(f,key).toBeDefined();expect(typeof value).toBe(['number','gauge','rating'].includes(f.type)?'number':f.type==='checkbox'?'boolean':'string');if(typeof value==='number'){if(f.min!==undefined)expect(value).toBeGreaterThanOrEqual(f.min);if(f.max!==undefined)expect(value).toBeLessThanOrEqual(f.max);}}
   expect(p.sheetData!.sante).toBe(santeDeDepart(pilote.combat!.santeDeDepart,k=>valeurDuChamp(p.sheetData!,k)));
   expect(p.sheetData!.volonte).toBe(Number(p.sheetData!.resolution)+Number(p.sheetData!.sang_froid));
  }
  for(const e of s.entities){expect(['ally','neutral','hostile','boss']).toContain(e.role);expect(e.avatar).toBe('');for(const k of ['hp','maxHp','initiative','speed','ac'] as const)expect(typeof e[k]).toBe('number');}
 });
 it('la santé sérialisée provient du constructeur réel, sans état interne inventé',()=>{
  for(const p of [...pcs,...s.entities]){const g={...fiche,sections:fiche.sections.map(x=>({...x,fields:x.fields.map(f=>({...f,defaultValue:p.sheetData![f.id]}))}))};expect(p.healthSystem).toEqual(naissanceDansLeJeu(pilote,g).healthSystem);}
 });
 it('[VAM-A01] conformité Santé : le profil CORPS doit avoir six cases, pas les cinq génériques',()=>{
  // Assertion conservée en ÉCHEC tant que le pilote choisit boxes sans casesDeSante.
  // L'emballage signale explicitement cet unique défaut connu, il ne l'annonce pas réussi.
  const attendu=santeDeDepart(pilote.combat!.santeDeDepart,k=>valeurDuChamp(corps.sheetData!,k));
  expect((corps.healthSystem!.data.boxes as unknown[]).length).toBe(attendu);
 });
 it.each([
  [{attribut:'dexterite',competence:'melee'},{},5,2],
  [{attribut:'dexterite',competence:'melee'},{vampire:{specialite:true}},6,2],
  [{attribut:'intelligence'},{},3,2],
  [{attribut:'force',competence:'force'},{},4,2],
  [{attribut:'dexterite',competence:'discipline_1'},{},5,2],
  [{attribut:'dexterite',competence:'melee'},{vampire:{modificateur:-10}},1,1],
  [{attribut:'dexterite',competence:'melee'},{vampire:{modificateur:3}},8,2],
  [{attribut:'volonte'},{},5,0],
  [{attribut:'humanite'},{},7,0],
 ] as const)('prépare le vrai profil : %j %j', (c,o,total,soif)=>{
  const p=preparer(c,o);expect(p.vampire!.total).toBe(total);expect(p.vampire!.desDeSoif).toBe(soif);expect(p.vampire!.ordinaires+p.vampire!.desDeSoif).toBe(total);expect(p.reussitesRequises).toBe(3);
 });
 it('les bornes de Soif ne gonflent pas la réserve',()=>{
  expect(preparer({attribut:'force'},{},{...rec.sheetData,soif:5}).vampire).toMatchObject({total:2,ordinaires:0,desDeSoif:2});
  expect(preparer({attribut:'dexterite',competence:'melee'},{},{...rec.sheetData,soif:0}).vampire).toMatchObject({total:5,ordinaires:5,desDeSoif:0});
 });
 it('le menu nomme la spécialité et la discipline sans proposer les lignes de texte',()=>{
  const menus=new Map(champsProposes(pilote.jet!.reserve!.composantes[1],fiche.sections,rec.sheetData!).map(c=>[c.id,c.label]));
  expect(menus.get('melee')).toBe('Mêlée — Couteaux');expect(menus.get('discipline_1')).toBe('Célérité');expect(menus.has('discipline_1_pouvoirs')).toBe(false);expect(menus.has('discipline_2')).toBe(false);
 });
 it.each([
  [[10,10,7,3,2],[],3,5,'victoire-critique'],
  [[10,7,3,2],[10,4],5,5,'triomphe-brutal'],
  [[7,3,2],[1,4],3,1,'echec-bestial'],
  [[6,6,7],[1,4],3,3,'victoire'],
  [[1,2,3],[2,4],3,0,'echec-total'],
  [[6,4,3],[2,4],3,1,'echec'],
  [[10,7,3],[2,4],3,2,'echec'],
 ] as const)('référence de résultat %j + %j', (o,h,d,nb,bilan)=>{
  const r=resoudreVampire(o,h,d);expect(r.vampire.reussites).toBe(nb);expect(r.vampire.bilan).toBe(bilan);
 });
 it.each([[2,4],[3,5],[4,8]])('%s dix valent %s réussites', (n,r)=>{expect(compterLesReussites(Array(n).fill(10)).reussites).toBe(r);});
 it('la relance du 10 ordinaire peut défaire le brutal, sans bouger la Soif',()=>{
  const avant=resoudreVampire([10,7,3,2],[10,4],5),apres=relancerVampire(avant.vampire,[0],()=>1);
  expect(apres.vampire).toMatchObject({soif:[10,4],reussites:2,bilan:'echec',relance:true,relances:[0]});
  expect(relanceImpossible(avant.vampire,false,0)).toContain('Plus de Volonté');expect(relanceImpossible(avant.vampire,true,5)).toContain('jauge');expect(relanceImpossible(apres.vampire,false,5)).toContain('déjà');
  expect(relanceImpossible(resoudreVampire([],[1,2],3).vampire,false,5)).toContain('Aucun dé ordinaire');
 });
 it.each([[[6],2,2,false],[[5],2,3,false],[[1],4,5,false],[[6],5,5,false],[[1],5,5,true],[[2,6],2,2,false]] as const)('Exaltation %j à Soif %s', (des,avant,apres,frenesie)=>{
  expect(resoudreLExaltation(des,avant)).toMatchObject({soifApres:apres,frenesie});
 });
 it('les dix résultats de Compulsion suivent les classes du livre',()=>{
  expect(Array.from({length:10},(_,i)=>compulsionAleatoire(i+1).nom)).toEqual(['Soif','Soif','Soif','Domination','Domination','Destruction','Destruction','Paranoïa','Paranoïa','Compulsion de clan']);
 });
 it('la correspondance échange les valeurs du personnage livré sans lier les dégâts / X',()=>{
  const table=lireLaCorrespondance(fs.readFileSync('docs/systems/vampire/fiche/correspondance.json','utf8'))!;
  const html=versLaFiche(rec,table);expect(html['skills.melee']).toBe(2);expect(html['specialties.melee']).toBe('Couteaux');expect(html['tracks.hunger']).toBe(2);
  expect(Object.keys(html).some(k=>k.startsWith('damage.'))).toBe(false);
  const retour=versGmOs({...html,'skills.melee':4,'specialties.melee':'Contrôle de recette'},table).sheetData;
  expect(retour.melee).toBe(4);expect(retour.melee_specialites).toBe('Contrôle de recette');expect(rec.sheetData!.melee).toBe(2);
 });
 it('GM-05 : secrets privés et pièces non révélées absents des charges joueurs',()=>{
  for(const charge of [{session:{campaigns:[s.campaign],sessions:s.sessions,players:s.players,entities:s.entities,atlasMaps:s.atlasMaps,clues:s.clues},lectureDuMeneur:{actes:s.actes,scenes:s.scenes}},{session:{sessions:s.sessions.slice(0,1)}}]){
   const avant=JSON.stringify(charge),joueur=caviarderPourLesJoueurs(charge,rec.id);expect(JSON.stringify(joueur)).not.toContain('SECRET_MJ_VAM_REGISTRE');expect(JSON.stringify(charge)).toBe(avant);
  }
  const charge=caviarderPourLesJoueurs({session:{clues:s.clues}},rec.id);expect(charge.session.clues.map(c=>c.id)).toEqual([s.clues[0].id]);
 });
 it('l’injection Nexus réelle en mémoire ajoute une seule campagne et garde anciens PJ et avatars',()=>{
  const ancienne={...s.campaign,id:'campagne-sentinelle',name:'Campagne sentinelle fictive'};
  const players=s.players.map((p,i)=>({...p,avatarUrl:'avatar-sentinelle-'+i,characters:[{...p.characters[0],id:'ancien-fictif-'+i,campaignId:ancienne.id}]}));
  useSessionOSStore.setState({...initial,campaigns:[ancienne],players,entities:[],sessions:[],actes:[],scenes:[],atlasMaps:[],wikiEntries:[],clues:[],timelineEvents:[]});
  (nexusService as unknown as {injectState:(e:NexusCampaignState)=>void}).injectState(s);
  const final=useSessionOSStore.getState();expect(final.campaigns).toHaveLength(2);expect(final.players).toHaveLength(3);
  for(const [i,p]of final.players.entries()){expect(p.avatarUrl).toBe('avatar-sentinelle-'+i);expect(p.characters).toHaveLength(3);expect(p.characters.some(c=>c.id==='ancien-fictif-'+i)).toBe(true);}
 });
 it('restauration locale en mémoire : note de fiction et valeur d’un héros conservées',()=>{
  const copie=JSON.parse(JSON.stringify(s)) as NexusCampaignState;copie.scenes![0].notesDuMeneur='TEMOIN_FICTION_REGISTRE';
  useSessionOSStore.setState({...initial,players:copie.players,scenes:copie.scenes!});
  const pj=copie.players[0].characters[1],before=copie.players[0].characters[0].sheetData!.investigation,update=useSessionOSStore.getState().updateCharacter;
  update('p-1',pj.id,{sheetData:{...pj.sheetData,investigation:1}});expect(useSessionOSStore.getState().players[0].characters[1].sheetData!.investigation).toBe(1);
  update('p-1',pj.id,{sheetData:{...pj.sheetData,investigation:3}});
  const serialise=JSON.parse(JSON.stringify({players:useSessionOSStore.getState().players,scenes:useSessionOSStore.getState().scenes}));
  expect(serialise.players[0].characters[1].sheetData.investigation).toBe(3);expect(serialise.players[0].characters[0].sheetData.investigation).toBe(before);expect(serialise.scenes[0].notesDuMeneur).toBe('TEMOIN_FICTION_REGISTRE');
 });
 it('les 53 cas humains restent vierges, chaque mécanisme et repère est couvert',()=>{
  const cs=JSON.parse(fs.readFileSync(dir+'cas-de-recette.json','utf8')),mat=JSON.parse(fs.readFileSync(dir+'matrice-couverture.json','utf8'));
  expect(cs).toHaveLength(53);expect(mat.flatMap((x:{casIds:string[]})=>x.casIds).sort()).toEqual(cs.map((c:{id:string})=>c.id).sort());
  for(const c of cs){expect(c.archive).toBe(nom);expect(s.scenes!.find(x=>x.id===c.repere.sceneId)!.personnagesIds).toContain(c.repere.personnageId);expect(c.source).toBeTruthy();}
  expect(fs.readFileSync(dir+'resultats.csv','utf8').match(/NON TESTÉ/g)).toHaveLength(53);
  for(const f of fs.readdirSync('docs/systems/vampire/rules'))if(f.endsWith('.md'))expect(fs.readFileSync('docs/systems/vampire/rules/'+f,'utf8')).toMatch(/^relu: true$/m);
 });
});
