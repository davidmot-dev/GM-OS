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
import {santePrincipaleDeLaFiche,santeAlignee} from '../../src/modules/combat/logic/SanteDuCombattant';
import {preparerLeJet} from '../../src/modules/dice/DescripteurDeJet';
import {CHOIX_DE_RUNEQUEST,calculerRuneQuest,degreAdverse,issueDeLOpposition,localisationDuCoup,niveauDeRuneQuest,nommerLeJetDeRuneQuest} from '../../src/modules/dice/systemes/runequest';
import {degreDuDe} from '../../src/modules/dice/degresDeReussite';
import {lireLaCorrespondance,versLaFiche} from '../../src/modules/fiches/correspondanceDeFiche';
import {lireDuJson} from '../../src/modules/tables/logic/collageDUneTable';
vi.stubGlobal('Uint8Array',Object.getPrototypeOf(Buffer.prototype).constructor);
const dossier='output/campagnes-tests/runequest',noms=['01-Les-Bornes-du-gue','02-Aptitudes-Combat-et-Sante','03-Runes-Passions-et-Magie'];
const toutes=noms.map(n=>{const z=new AdmZip(path.join(dossier,n+'.gmos'));return {z,s:JSON.parse(z.readAsText('state.json')) as NexusCampaignState,m:JSON.parse(z.readAsText('manifest.json')) as NexusManifest};});
const empreintes=noms.map(n=>({fichier:n+'.gmos',sha256:createHash('sha256').update(fs.readFileSync(path.join(dossier,n+'.gmos'))).digest('hex')}));
afterAll(()=>fs.writeFileSync(path.join(dossier,'verification-contexte.json'),JSON.stringify({archives:empreintes,assertions:'runequest.test.ts ; résultat global dans verification-archives.json'},null,2)+'\n'));
const pilote=toutes[0].s.requiredDriverData![0],fiche=toutes[0].s.requiredTemplateData![0];
const pcs=(i:number)=>toutes[i].s.players.flatMap(p=>p.characters),pj=(code:string)=>pcs(code.startsWith('C')?1:2).find(c=>c.name.startsWith(code))!;
const jet=(code:string,champ='arme1',choix={})=>preparerLeJet(pilote.jet!,pj(code).sheetData,{champs:{aptitude:champ},runequest:choix},fiche.sections);
describe('les archives RuneQuest réellement livrées',()=>{
 for(const[i,{z,s,m}]of toutes.entries()){
  it(noms[i]+' : manifeste et médias intègres',()=>{
   expect(nexusService.validateManifest(m)).toEqual([]);expect(m.campaignId).toBe(s.campaign.id);expect(m.exportedAt).toBe('2026-10-30T12:00:00.000Z');expect(m.gmosVersion).toBe('6.5.0');expect(m.assetMap).toHaveLength(39);
   for(const a of m.assetMap){expect(nexusService.isDangerousPath(a.relativePath)).toBe(false);const b=z.readFile(a.relativePath)!;expect(b.length).toBe(a.sizeBytes);expect(createHash('sha256').update(b).digest('hex')).toBe(a.checksum);if(a.mimeType==='audio/wav')expect(b.toString('ascii',8,12)).toBe('WAVE');else expect(b.toString('utf8')).not.toMatch(/<script|<foreignObject|<image|href=/);}
   const refs=new Set(m.assetMap.map(a=>a.originalRef));for(const r of nexusService.collectAssetPaths(s))if(!r.startsWith('data:'))expect(refs.has(r),r).toBe(true);
   expect(nexusService.scanForRemoteUrls(s)).toEqual([]);
  });
  it(noms[i]+' : aucune référence de fiction pendante',()=>{
   const set=(a:{id:string}[])=>new Set(a.map(x=>x.id)),pc=set(pcs(i)),npc=set(s.entities),lieux=set(s.atlasMaps),sc=set(s.scenes!),actes=set(s.actes!),cl=set(s.clues),moments=set(s.moments!);
   for(const x of s.scenes!){expect(x.campaignId).toBe(s.campaign.id);expect(actes.has(x.acteId)).toBe(true);expect(lieux.has(x.lieuId!)).toBe(true);for(const id of x.personnagesIds!)expect(pc.has(id)).toBe(true);for(const id of x.entiteIds)expect(npc.has(id)).toBe(true);for(const id of x.indiceIds)expect(cl.has(id)).toBe(true);for(const e of x.enchainements!)expect(sc.has(e.vers)).toBe(true);if(x.momentDeStoryboardId)expect(moments.has(x.momentDeStoryboardId)).toBe(true);}
   for(const c of s.clues){expect(lieux.has(c.locationId!)).toBe(true);expect(npc.has(c.ownerId!)).toBe(true);}
   for(const p of pcs(i))for(const r of p.relations??[])expect((r.targetType==='pc'?pc:npc).has(r.targetId)).toBe(true);
   for(const se of s.sessions){expect(se.status).toBe('planned');for(const id of se.scenesPrevuesIds??[])expect(sc.has(id)).toBe(true);}
   for(const at of s.atmospheres!)for(const[k,pad]of Object.entries(at.pads))expect(k).toBe(pad.id);
   for(const a of [...s.atmospheres!,...s.playlists!,...s.tuilesDeLumiere!])expect(a.campagneId).toBe(s.campaign.id);
  });
  it(noms[i]+' : champs réels et santé alignée',()=>{
   const champs=new Map(fiche.sections.flatMap(s=>s.fields).map(f=>[f.id,f]));expect(champs.size).toBe(313);
   for(const c of [...pcs(i),...s.entities]){expect(c.campaignId).toBe(s.campaign.id);const d=c.sheetData!;for(const[k,v]of Object.entries(d)){expect(champs.has(k),k).toBe(true);const f=champs.get(k)!;if(f.type==='number')expect(typeof v,k).toBe('number');else expect(typeof v,k).toBe('string');}
    expect(c.hp).toBe(d.points_de_vie);expect(c.maxHp).toBe(d.pv_max);expect(c.healthSystem).toEqual(santeAlignee(undefined,santePrincipaleDeLaFiche(pilote,d)));
    for(const[a,b]of[['fertilite','mort'],['harmonie','desordre'],['stase','mouvement'],['verite','illusion'],['homme','bete']])expect(Number(d['rune_'+a])+Number(d['rune_'+b])).toBe(100);
   }
   expect(controlerLePilote(s.requiredDriverData![0],s.requiredTemplateData![0])).toEqual([]);
  });
  it(noms[i]+' : aucun module incompatible ou pioche portée',()=>{expect(modulesDuPilote(s.requiredDriverData![0]).modules).toEqual([]);expect(s.modulesDuJeu).toBeUndefined();expect(s.deckSessionStates).toBeUndefined();expect(s.deckManifests).toBeUndefined();});
 }
 it('les trois joueurs existants reçoivent 21 nouveaux PJ sans duplication',()=>{
  expect(toutes.map(t=>t.s.players.flatMap(p=>p.characters).length)).toEqual([3,9,9]);
  for(const{s}of toutes)expect(s.players.map(p=>[p.id,p.realName])).toEqual([['p-1','Thomas D.'],['p-2','Marie C.'],['p-3','Lucas R.']]);
  expect(new Set(toutes.flatMap(t=>t.s.players.flatMap(p=>p.characters.map(c=>c.id)))).size).toBe(21);
  expect(new Set(toutes.flatMap(t=>t.s.tuilesDeLumiere!.map(x=>x.id))).size).toBe(9);
 });
 it('C02 utilise les seuils du livre sur le vrai panneau de jet',()=>{expect(jet('C02').echelle).toMatchObject({chances:56,particuliere:3,significative:11,echecTotal:99});});
 it.each([[2,'reussite-critique'],[11,'reussite-speciale'],[56,'reussite'],[57,'echec'],[99,'echec-critique'],[100,'echec-critique']])('C02, D100 %i → %s',(de,n)=>expect(niveauDeRuneQuest(degreDuDe(Number(de),jet('C02').echelle!))).toBe(n));
 it('C01 et C03 gardent les bornes 05/95 sans aplatir les critiques',()=>{expect(jet('C01').seuil).toBe(5);expect(jet('C03').echelle).toMatchObject({chances:95,particuliere:6,significative:24});expect(niveauDeRuneQuest(degreDuDe(97,jet('C03').echelle!))).toBe('echec');});
 it('le d100 nommé lit bien le total 94, pas la dizaine 90',()=>{const brut={total:94,results:[90,4]} as unknown as Parameters<typeof nommerLeJetDeRuneQuest>[0];expect(nommerLeJetDeRuneQuest(brut,jet('C02').echelle!).runequest.de).toBe(94);});
 it('C02 situation, augmentation et nouvelle tentative ne mutent pas la fiche',()=>{const avant=structuredClone(pj('C02').sheetData);expect(jet('C02','arme1',{modificateur:-10,augmentation:20}).runequest?.chancesModifiees).toBe(66);expect(jet('C02','arme1',{nouvelleTentative:true}).seuil).toBe(31);expect(pj('C02').sheetData).toEqual(avant);});
 it('CON 12 et M04 POU 15 produisent 60 et 55 %',()=>{expect(jet('C02','con').seuil).toBe(60);expect(jet('M04','pou',{mode:'resistance',passive:14}).seuil).toBe(55);});
 it('C04 réduit 140/80 à 100/40 et applique l’égalité de niveau',()=>{const c=jet('C04','arme1',{adverse:80});expect(c.runequest).toMatchObject({chancesModifiees:100,adverseReduite:40});expect(issueDeLOpposition(degreAdverse(50,100),degreAdverse(30,40))).toBe('egalite');expect(issueDeLOpposition(degreAdverse(99,100),degreAdverse(90,40))).toBe('deux-perdants');});
 it('tous les D20 retrouvent les champs de PV localisés réellement livrés',()=>{for(let de=1;de<=20;de++){const l=localisationDuCoup(de),key=pilote.jet!.runequest!.localisations![l.cle]!;expect(typeof pj('C09').sheetData[key]).toBe('number');}expect(pj('C07').sheetData.pv_bras_droit).toBe(0);expect(pj('C08').sheetData.pv_tete).toBe(-4);});
 it('les réserves des laboratoires sont distinctes et dans leurs plafonds',()=>{expect(pj('M01').sheetData.points_de_magie).toBe(0);expect(pj('M02').sheetData.points_de_magie).toBe(1);expect(pj('M03').sheetData.points_de_rune).toBe(0);expect(pj('M03').sheetData.points_de_rune_2).toBe(1);expect(pj('M08').sheetData.points_de_rune).toBe(1);expect(pj('M08').sheetData.points_de_rune_2).toBe(0);expect(pj('M09').sheetData.int_libre).toBe(0);expect(pilote.jet!.consommation).toBeUndefined();});
 it('les tests magiques sont des tests natifs, pas une fausse consommation',()=>{expect(jet('M04','pou').seuil).toBe(75);expect(jet('M05','rune_air').seuil).toBe(90);expect(jet('M06','passion1').seuil).toBe(85);expect(jet('M07','autre_competence_1').seuil).toBe(55);const v=pj('M05').sheetData;expect(calculerRuneQuest({label:'Air',valeur:Number(v.rune_air),caracteristique:false},CHOIX_DE_RUNEQUEST).chancesModifiees).toBe(90);});
 it('la correspondance réelle porte les personnages vers la fiche HTML',()=>{const table=lireLaCorrespondance(fs.readFileSync('docs/systems/runequest/fiche/correspondance.json','utf8'))!;for(const c of pcs(0)){const v=versLaFiche({sheetData:c.sheetData,narratif:{description:c.description,inventory:c.inventory},inventoryItems:c.inventoryItems},table);expect(v['identity.name']).toBe(c.name);expect(v['attributes.strength']).toBe(c.sheetData.for);expect(v['health.current']).toBe(c.hp);expect(v['magic.current']).toBe(c.sheetData.points_de_magie);}});
 it('le clone garde les bonnes références et le rejeu n’est pas un soin',()=>{let n=0;const s=toutes[0].s,clone=nexusService.applyResolutionToState(s,{strategy:'clone'},true,p=>p+'-rq-'+(++n));expect(clone.campaign.id).not.toBe(s.campaign.id);expect(clone.players.flatMap(p=>p.characters).every(c=>c.campaignId===clone.campaign.id)).toBe(true);expect(nexusService.applyResolutionToState(s,{strategy:'rejouer'}).players.flatMap(p=>p.characters.map(c=>c.sheetData))).toEqual(s.players.flatMap(p=>p.characters.map(c=>c.sheetData)));});
 it('les tables 1d6 sont lues par Table-OS sans entrée ignorée',()=>{for(const n of fs.readdirSync(path.join(dossier,'tables-a-importer'))){const t=lireDuJson(fs.readFileSync(path.join(dossier,'tables-a-importer',n),'utf8'))!;expect(t.ignorees).toEqual([]);expect(t.entrees.map(e=>[e.min,e.max])).toEqual([1,2,3,4,5,6].map(n=>[n,n]));}});
 it('66 cas humains encore vierges et couverture sourcée',()=>{const cs=JSON.parse(fs.readFileSync(path.join(dossier,'cas-de-recette.json'),'utf8')),m=JSON.parse(fs.readFileSync(path.join(dossier,'matrice-couverture.json'),'utf8'));expect(cs).toHaveLength(66);expect(new Set(cs.map((c:{id:string})=>c.id)).size).toBe(66);expect(m.every((x:{source:string;casIds:string[]})=>x.source&&x.casIds.length)).toBe(true);expect(fs.readFileSync(path.join(dossier,'resultats.csv'),'utf8').split(/\r?\n/).filter(l=>l.endsWith(';"NON TESTÉ";"";""'))).toHaveLength(66);});
});
