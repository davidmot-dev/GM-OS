// R0 du 18/10/2026 : consolider l'export de David, sans lire ses personnages.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import AdmZip from 'adm-zip';

const [entree,sortie]=process.argv.slice(2);
if(!entree||!sortie){console.error('Usage : node outils/reve-de-dragon/consolider-pilote.mjs <original.gmos-driver> <nouveau.gmos-driver>');process.exit(2);}
assert.notEqual(path.resolve(entree),path.resolve(sortie));
assert.ok(!fs.existsSync(sortie),'Le livrable existe déjà. Choisir un autre nom.');
const racine=fileURLToPath(new URL('../../',import.meta.url));
const travail=path.join(racine,'scratch/reve-de-dragon-r0');fs.mkdirSync(travail,{recursive:true});
const moteur=path.join(travail,'consolidation.cjs');
buildSync({stdin:{contents:`
export * from './src/modules/session/logic/ficheDeVoyageur.ts';
export {controlerLePilote} from './src/modules/forge/rules/controlesDuPilote.ts';
export {preparerLeJet} from './src/modules/dice/DescripteurDeJet.ts';
export {santePrincipaleDeLaFiche} from './src/modules/combat/logic/SanteDuCombattant.ts';
`,resolveDir:racine},bundle:true,platform:'node',format:'cjs',outfile:moteur,logLevel:'warning'});
const api=createRequire(import.meta.url)(moteur);
const octets=fs.readFileSync(entree),archive=new AdmZip(octets);
const original=JSON.parse(archive.readAsText('state.json')),etat=structuredClone(original);
const manifeste=JSON.parse(archive.readAsText('manifest.json'));
assert.equal(etat.gameDriver.jet.cible.mecanique,'reves-de-dragons');
const modele=etat.sheetTemplate;
const anciens=modele.sections.flatMap(s=>s.fields);
const connus=new Set(anciens.map(f=>f.id));
const parCle=new Map();for(const f of anciens)if(!parCle.has(f.id))parCle.set(f.id,structuredClone(f));
const alias=new Set(Object.values(api.ALIAS_DU_VOYAGEUR).flat());
const nouveaux={
 reve_seuil:{id:'reve_seuil',label:'Seuil de récupération du rêve',type:'number',defaultValue:parCle.get('reve_pts_max')?.defaultValue??15},
 reve_eclatement:{id:'reve_eclatement',label:'Éclatement du rêve au-delà de',type:'formula',defaultValue:45,formula:api.CALCULS_DU_VOYAGEUR.reve_eclatement},
};
const groupes=[
 ['identite','Identité et signes particuliers',['nom','age','sexe','taille_cm','poids_kg','cheveux','yeux','beaute','heure_naissance','ambidextrie']],
 ['caracteristiques','Caractéristiques',['taille','apparence','constitution','force','agilite','dexterite','vue','ouie','odorat_gout','volonte','intellect','empathie','reve','chance']],
 ['caracteristiques_derivees','Caractéristiques dérivées',['melee','tir','lancer','derobee']],
 ['points_seuils','Vie, endurance et seuils',['vie','vie_max','endurance','endurance_max','sc','sust','enc','plus_dom','malus_armure']],
 ['reve','Rêve et récupération',['reve_pts','reve_seuil','reve_eclatement']],
];
const utilises=new Set();
const champ=id=>{
 const f=structuredClone(nouveaux[id]??parCle.get(id));assert.ok(f,'Champ absent : '+id);utilises.add(id);
 if(api.CALCULS_DU_VOYAGEUR[id]){f.type='formula';f.formula=api.CALCULS_DU_VOYAGEUR[id];f.defaultValue=Number(f.defaultValue)||0;delete f.max;}
 else if(f.type==='gauge'){f.type='number';f.defaultValue=Number(f.defaultValue)||0;delete f.max;}
 if(f.defaultValue===undefined)f.defaultValue=f.type==='checkbox'?false:['text','textarea','select'].includes(f.type)?'':0;
 if(id==='points_de_chance'&&!Object.hasOwn(parCle.get(id),'defaultValue'))f.defaultValue=parCle.get('chance').defaultValue;
 if(id==='heure_naissance'){f.type='select';f.options=api.HEURES_DRACONIQUES;}
 return f;
};
const sections=groupes.map(([id,label,cles])=>({id,label,fields:cles.filter(c=>parCle.has(c)||nouveaux[c]).map(champ)}));
for(const s of modele.sections){
 const restantes=s.fields.filter(f=>!utilises.has(f.id)&&!alias.has(f.id)).map(f=>champ(f.id));
 if(restantes.length)sections.push({id:s.id,label:s.label,fields:restantes});
}
// Les clés distinctes retirées de l'écran restent dans les données originales et
// sont reprises explicitement par le panneau de consolidation, pas à l'import.
modele.sections=sections;modele.reglesDeFiche='rdd-231';
const finaux=sections.flatMap(s=>s.fields);
const ids=finaux.map(f=>f.id);
assert.equal(new Set(ids).size,ids.length);
assert.equal(new Set(sections.map(s=>s.id)).size,sections.length);
for(const id of connus)assert.ok(ids.includes(id)||alias.has(id),'Clé non couverte par la reprise : '+id);
etat.gameDriver.jet.cible.caracteristique.sectionsSupplementaires=['caracteristiques_derivees'];
delete etat.gameDriver.jet.difficulte;
etat.gameDriver.combat.santeDeDepart='(taille + constitution) / 2';
for(const s of etat.gameDriver.combat.statsToTrack){
 if(s.fieldId==='vie')s.max='vie_max';
 if(s.fieldId==='endurance')s.max='endurance_max';
 // Repère graphique, pas un blocage de saisie ni une application de l'éclatement.
 if(s.fieldId==='reve_pts')s.max='reve_eclatement';
}
const valeurs=Object.fromEntries(finaux.map(f=>[f.id,f.defaultValue]));
const initial=api.reprendreFicheDeVoyageur(modele,valeurs);
for(const f of finaux)if(api.CALCULS_DU_VOYAGEUR[f.id])f.defaultValue=initial[f.id];
const constats=api.controlerLePilote(etat.gameDriver,modele);
assert.deepEqual(constats,[]);
assert.equal(api.preparerLeJet(etat.gameDriver.jet,initial,{champs:{caracteristique:'agilite',competences_gen:'discretion'}},modele.sections).seuil,78);
assert.deepEqual(api.santePrincipaleDeLaFiche(etat.gameDriver,initial),{champ:'vie',courant:11,max:11});
assert.equal(modele.id,original.sheetTemplate.id);assert.equal(etat.gameDriver.id,original.gameDriver.id);
const nouveau=new AdmZip();
const meta={...manifeste,bundleId:'nexus-drv-'+Date.now()+'-r0-consolide',exportedAt:new Date().toISOString()};
for(const e of archive.getEntries())nouveau.addFile(e.entryName,e.entryName==='state.json'?Buffer.from(JSON.stringify(etat,null,2))
 :e.entryName==='manifest.json'?Buffer.from(JSON.stringify(meta,null,2)):e.getData(),e.comment,e.attr);
fs.mkdirSync(path.dirname(path.resolve(sortie)),{recursive:true});nouveau.writeZip(sortie);
assert.deepEqual(JSON.parse(new AdmZip(sortie).readAsText('state.json')),etat);
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(fs.readFileSync(entree)),sha(octets));
const rapport={original:entree,sortie,sha256:sha(fs.readFileSync(sortie)),avant:{zones:anciens.length,cles:connus.size},
 apres:{zones:finaux.length,cles:ids.length},clesReprises:[...alias].filter(c=>connus.has(c)),nouvellesCles:Object.keys(nouveaux),constats,
 gabaritStable:modele.id,personnagesModifies:false};
fs.writeFileSync(path.join(travail,'consolidation.json'),JSON.stringify(rapport,null,2));
console.log(JSON.stringify(rapport,null,2));
