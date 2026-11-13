// Vérification hors ligne et emballage ; aucun service ni profil utilisateur.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import AdmZip from 'adm-zip';
import {chromium} from '@playwright/test';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {empreinte} from './archives-de-recette.mjs';
const dir=path.resolve('output/campagnes-tests/delta-green'),lire=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const pr=lire('provenance.json'),archive=pr.campagne,tests=lire('verification-vitest.json');
assert.equal(tests.numFailedTests,0);assert.equal(tests.success,true);assert.equal(empreinte(fs.readFileSync(path.join(dir,archive.fichier))),archive.sha256);
const python=process.env.GMOS_PYTHON??path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
const portable=path.resolve('outils/gmos-campagnes-tests/plugin/gmos-campagnes-tests/skills/campagnes-de-test/scripts/gmos_bundle.py');
const structure=JSON.parse(execFileSync(python,['-I','-B','-X','utf8',portable,'verify',path.join(dir,archive.fichier)],{encoding:'utf8'}));assert.equal(structure.valid,true);
fs.writeFileSync(path.join(dir,'verification-plugin.json'),JSON.stringify({archive,controle:'Structure partielle, pas import natif',...structure},null,2)+'\n');
const assets=new AdmZip(path.join(dir,archive.fichier));const m=JSON.parse(assets.readAsText('manifest.json'));
const captures=path.join(dir,'captures');fs.mkdirSync(captures,{recursive:true});
const navigateur=await chromium.launch({channel:'msedge',headless:true});const medias=[],photos=[];
try{
 const contexte=await navigateur.newContext({viewport:{width:1200,height:800}});await contexte.setOffline(true);const page=await contexte.newPage();
 for(const a of m.assetMap){const b=fs.readFileSync(path.join(dir,a.relativePath));assert.equal(empreinte(b),a.checksum);
  if(a.mimeType.startsWith('image/')){const dimensions=await page.evaluate(url=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve([im.naturalWidth,im.naturalHeight]);im.onerror=()=>resolve(null);im.src=url;}),`data:${a.mimeType};base64,${b.toString('base64')}`);assert.ok(dimensions,a.relativePath);
   await page.goto(pathToFileURL(path.join(dir,a.relativePath)).href);const cible=path.join(captures,path.parse(a.relativePath).name+'.jpg');await page.locator(a.mimeType==='image/svg+xml'?'svg':'img').screenshot({path:cible,type:'jpeg',quality:85});photos.push(cible);medias.push({fichier:a.relativePath,sha256:a.checksum,dimensions});
  }else{const duree=await page.evaluate(async octets=>{const c=new AudioContext();try{return(await c.decodeAudioData(new Uint8Array(octets).buffer)).duration;}finally{await c.close();}},[...b]);assert.equal(duree,4);medias.push({fichier:a.relativePath,sha256:a.checksum,dureeSecondes:duree,ecouteHumaine:false});}
 }
 for(const [groupe,selection]of [['plans',photos.filter(p=>path.basename(p).startsWith('plan-'))],['pieces',photos.filter(p=>path.basename(p).startsWith('piece-'))]]){
  const w=400,h=285,canvas=createCanvas(w*3,h*Math.ceil(selection.length/3)),ctx=canvas.getContext('2d');ctx.fillStyle='#e4e5dc';ctx.fillRect(0,0,canvas.width,canvas.height);
  for(const[i,p]of selection.entries()){const im=await loadImage(p),x=i%3*w,y=Math.floor(i/3)*h;ctx.drawImage(im,x,y,400,266);ctx.fillStyle='#182920';ctx.font='15px Arial';ctx.fillText(path.basename(p),x+6,y+281);}
  fs.writeFileSync(path.join(captures,'planche-'+groupe+'.jpg'),canvas.toBuffer('image/jpeg',{quality:90}));
 }
}finally{await navigateur.close();}
const rapport={archive,structure:true,tests:tests.numPassedTests,imagesDecodees:25,wavDecodes:1,medias,capturesExaminees:false,importNatif:false,hubReseau:false,recetteHumaine:'NON TESTÉ'};
if(fs.existsSync(path.join(dir,'verification-relecture.json'))){const r=lire('verification-relecture.json');rapport.capturesExaminees=r.archiveSha256===archive.sha256&&r.rendusExaminees===true;}
fs.writeFileSync(path.join(dir,'verification-medias.json'),JSON.stringify(rapport,null,2)+'\n');
fs.writeFileSync(path.join(dir,'RAPPORT-DE-VERIFICATION.md'),`# Rapport — Delta Green\n\n**PRÉPARÉE ; import natif et Hub réseau NON EXÉCUTÉS.**\n\n- ${tests.numPassedTests} essais Vitest réussis : archive, liens, champs/types, jets du vrai personnage, arrondi PV, fonctions du moteur, pupitre, caviardage GM-05 et injection réelle Nexus en mémoire sur sentinelles fictives. L’injection conserve les anciens PJ et avatars et ajoute une campagne. Ce n’est pas un import Electron ni une sauvegarde sur disque.\n- Utilitaire portable : structure acceptée, contrôle partiel.\n-25 images décodées hors ligne, dont24 SVG originaux et la bannière JPEG ;1 WAV synthétique décodé,4secondes, aucune écoute humaine revendiquée. Rendus conservés sous captures/. Leur examen visuel est consigné séparément dans verification-relecture.json.\n-33 cas humains NON TESTÉS. Import natif, restauration/rechargement réel, Hub360/768/1180px, matériel, TTS/IA et sorties physiques NON EXÉCUTÉS. Aucun service lancé ni donnée privée utilisée.\n- Le pilote source conserve un lien NotebookLM : référence de travail, pas média nécessaire ni contenu téléchargé. Tous les médias de campagne sont embarqués.\n-18 fiches de corpus non relues. Les cas manuels ne certifient pas ces règles. Inconscience à2PV sans signal spécialisé : limite explicitée.\n\nCampagne : ${archive.fichier}\n\nSHA-256 : ${archive.sha256}\n\nPilote2.0.1 inchangé : ${pr.pilote.sha256}\n`);
for(const n of ['delta-green-verifier.mjs','delta-green.test.ts','vitest-delta-green.config.mts'])fs.copyFileSync(path.join('outils/campagnes-de-recette',n),path.join(dir,'reproduction',n));
const cheminRapport=path.join(dir,'RAPPORT-DE-VERIFICATION.md');
fs.writeFileSync(cheminRapport,fs.readFileSync(cheminRapport,'utf8').replace('-33 cas',`- ${pr.cas} cas`).replace('-25 images','- 25 images').replace('dont24','dont 24').replace(';1 WAV','; 1 WAV').replace(',4secondes',', 4 secondes').replace('-18 fiches','- 18 fiches').replace('à2PV','à 2 PV').replace('Hub360','Hub 360').replace('1180px','1180 px').replace('Pilote2.0.1','Pilote 2.0.1'));
fs.copyFileSync(portable,path.join(dir,'reproduction','gmos_bundle.py'));
console.log(JSON.stringify({tests:tests.numPassedTests,structure:true,images:25,wav:1,capturesExaminees:rapport.capturesExaminees,archive},null,2));
// L’emballage exige une relecture visuelle explicite liée aux mêmes empreintes.
if(process.argv.includes('--emballer')){
 const relecture=lire('verification-relecture.json');assert.equal(relecture.archiveSha256,archive.sha256);assert.equal(relecture.rendusExaminees,true);
 const zip=new AdmZip();function ajouter(rep,prefix=''){for(const f of fs.readdirSync(rep,{withFileTypes:true})){const relatif=path.posix.join(prefix,f.name),absolu=path.join(rep,f.name);if(f.isDirectory())ajouter(absolu,relatif);else if(!relatif.endsWith('.zip')&&relatif!=='verification-emballage.json')zip.addFile(relatif,fs.readFileSync(absolu));}}ajouter(dir);assert.equal(zip.getEntries().filter(e=>e.entryName.endsWith('.gmos')).length,1);for(const e of zip.getEntries())e.header.time=new Date(pr.genereLe);const cible=path.join(dir,'Delta-Green-Les-dossiers-de-la-pluie-Recette.zip');zip.writeZip(cible);assert.equal(empreinte(new AdmZip(cible).readFile(archive.fichier)),archive.sha256);fs.writeFileSync(path.join(dir,'verification-emballage.json'),JSON.stringify({zip:path.basename(cible),sha256:empreinte(fs.readFileSync(cible)),archive,octets:fs.statSync(cible).size,campagnes:1},null,2)+'\n');
}
