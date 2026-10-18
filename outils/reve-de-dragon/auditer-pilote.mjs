// Audit R0 du pilote exporté, sans lire les magasins de GM-OS.
// 18/10/2026 : David reprend le chantier RdD et fournit son export.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import {buildSync} from 'esbuild';

const racine=fileURLToPath(new URL('../../',import.meta.url));
const regles231=process.argv.includes('--regles-231');
const [entree,sortie]=process.argv.slice(2).filter(a=>!a.startsWith('--'));
if(!entree){console.error('Usage : node outils/reve-de-dragon/auditer-pilote.mjs <export.gmos-driver> [copie-corrigee.gmos-driver] [--regles-231]');process.exit(2);}
const source=path.resolve(entree),octets=fs.readFileSync(source);
const sha=b=>createHash('sha256').update(b).digest('hex');
const archive=new AdmZip(octets);
const manifeste=JSON.parse(archive.readAsText('manifest.json'));
const etat=JSON.parse(archive.readAsText('state.json'));
assert.equal(manifeste.bundleType,'driver');
assert.equal(etat.gameDriver.jet?.cible?.mecanique,'reves-de-dragons');
assert.equal(manifeste.driverId,etat.gameDriver.id);
assert.equal(etat.gameDriver.templateId,etat.sheetTemplate.id);

const travail=path.join(racine,'scratch/reve-de-dragon-r0');
fs.mkdirSync(travail,{recursive:true});
// Même code pur que la Forge et le combat ; aucun lancement de l'application.
const moteur=path.join(travail,'moteurs-audit.cjs');
buildSync({stdin:{contents:`
export {controlerLePilote} from './src/modules/forge/rules/controlesDuPilote.ts';
export {preparerLeJet} from './src/modules/dice/DescripteurDeJet.ts';
export {santePrincipaleDeLaFiche,maximumDeLaJauge,santeDeDepart} from './src/modules/combat/logic/SanteDuCombattant.ts';
`,resolveDir:racine},bundle:true,platform:'node',format:'cjs',outfile:moteur,logLevel:'warning'});
const api=createRequire(import.meta.url)(moteur);
const champs=etat.sheetTemplate.sections.flatMap(s=>s.fields.map(f=>({...f,section:s.id})));
const parCle=new Map();for(const f of champs)parCle.set(f.id,[...(parCle.get(f.id)||[]),f]);
// Ces valeurs servent au diagnostic ; elles ne sont jamais écrites dans un personnage.
const valeurs=Object.fromEntries(champs.filter(f=>f.defaultValue!==undefined).map(f=>[f.id,f.defaultValue]));
const jet=api.preparerLeJet(etat.gameDriver.jet,valeurs,{champs:{caracteristique:'agilite',competences_gen:'discretion'},ajustementDeDifficulte:0},etat.sheetTemplate.sections);
assert.equal(jet.seuil,78);assert.deepEqual(jet.avertissements,[]);
const rapport={source:path.relative(racine,source),sha256:sha(octets),pilote:etat.gameDriver.id,gabarit:etat.sheetTemplate.id,
 sections:etat.sheetTemplate.sections.length,zones:champs.length,clesUniques:parCle.size,
 doublons:[...parCle].filter(([,a])=>a.length>1).map(([cle,zones])=>({cle,zones})),
 selectsSansOptions:champs.filter(f=>f.type==='select'&&!f.options?.length),
 constatsForge:api.controlerLePilote(etat.gameDriver,etat.sheetTemplate),
 santeAvant:api.santePrincipaleDeLaFiche(etat.gameDriver,valeurs),
 jetControle:{seuil:jet.seuil,explication:jet.explicationDuSeuil},correction:null};

if(sortie){
 const cible=path.resolve(sortie);assert.notEqual(cible,source,'Conserver le fichier original.');
 assert.ok(!fs.existsSync(cible),'La copie existe déjà : choisir un autre nom.');
 const copie=structuredClone(etat);
 // Le livre 2.3.1 (p. 206–208) distingue seuil de récupération et maximum
 // de rêve : ne pas déclarer ici le seuil comme un plafond de la réserve.
 const liens=regles231?{vie:'vie_max',endurance:'endurance_max'}
  :{vie:'vie_max',endurance:'endurance_max',reve_pts:'reve_pts_max'};
 for(const [cle,maximum]of Object.entries(liens)){
  assert.ok(champs.some(f=>f.id===maximum&&f.type==='number'));
  const stat=copie.gameDriver.combat.statsToTrack.find(s=>s.fieldId===cle);assert.ok(stat);
  stat.max=maximum;
  assert.equal(api.maximumDeLaJauge(cle,copie.gameDriver.combat.statsToTrack,valeurs),valeurs[maximum]);
 }
 delete copie.gameDriver.jet.difficulte;
 if(regles231)copie.gameDriver.combat.santeDeDepart='(taille + constitution) / 2';
 assert.deepEqual(copie.sheetTemplate,etat.sheetTemplate);
 assert.equal(copie.gameDriver.id,etat.gameDriver.id);
 assert.equal(copie.gameDriver.templateId,etat.gameDriver.templateId);
 const difference=structuredClone(copie);
 for(const stat of difference.gameDriver.combat.statsToTrack)delete stat.max;
 difference.gameDriver.jet.difficulte=etat.gameDriver.jet.difficulte;
 difference.gameDriver.combat.santeDeDepart=etat.gameDriver.combat.santeDeDepart;
 assert.deepEqual(difference,etat,'Seuls les liens max, la santé de départ et jet.difficulte peuvent changer.');
 const sante=api.santePrincipaleDeLaFiche(copie.gameDriver,valeurs);
 assert.deepEqual(sante,{champ:'vie',courant:11,max:11});
 if(regles231){
  for(const [taille,constitution,attendu]of [[9,13,11],[10,13,12],[13,10,12],[6,6,6],[15,15,15]]){
   assert.equal(api.santeDeDepart(copie.gameDriver.combat.santeDeDepart,k=>({taille,constitution})[k]),attendu);
  }
  const sansMaximum={...valeurs,taille:10,constitution:13,vie:12};delete sansMaximum.vie_max;
  assert.deepEqual(api.santePrincipaleDeLaFiche(copie.gameDriver,sansMaximum),{champ:'vie',courant:12,max:12});
 }
 const constats=api.controlerLePilote(copie.gameDriver,copie.sheetTemplate);
 assert.deepEqual(constats,[]);
 const nouveauManifeste={...manifeste,bundleId:'nexus-drv-'+Date.now()+'-r0',exportedAt:new Date().toISOString()};
 // Réécrire les entrées évite de conserver le drapeau de descripteur ZIP
 // de l'export d'origine, qu'adm-zip ne réécrit pas lors d'updateFile.
 const nouvelleArchive=new AdmZip();
 for(const entree of archive.getEntries()){
  const contenu=entree.entryName==='manifest.json'?Buffer.from(JSON.stringify(nouveauManifeste,null,2))
   :entree.entryName==='state.json'?Buffer.from(JSON.stringify(copie,null,2)):entree.getData();
  nouvelleArchive.addFile(entree.entryName,contenu,entree.comment,entree.attr);
 }
 fs.mkdirSync(path.dirname(cible),{recursive:true});nouvelleArchive.writeZip(cible);
 const relu=JSON.parse(new AdmZip(cible).readAsText('state.json'));assert.deepEqual(relu,copie);
 assert.equal(sha(fs.readFileSync(source)),rapport.sha256,'Original inchangé.');
 rapport.correction={fichier:path.relative(racine,cible),sha256:sha(fs.readFileSync(cible)),sante,constatsForge:constats,
  liens,ficheIdentique:true,editionReference:regles231?'2.3.1':null,
  reglesVerifiees:regles231?['santeDeDepart : moyenne au supérieur, p. 44–45','seuil de rêve distinct du plafond, p. 206–208']:[],
  editionValidee:false,integre:false};
}
fs.writeFileSync(path.join(travail,'audit-r0.json'),JSON.stringify(rapport,null,2));
console.log(JSON.stringify({...rapport,doublons:rapport.doublons.map(d=>d.cle)},null,2));
