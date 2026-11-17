import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import AdmZip from 'adm-zip';
import {chromium} from '@playwright/test';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {empreinte} from './archives-de-recette.mjs';
const dir=path.resolve('output/campagnes-tests/vampire'),lire=n=>JSON.parse(fs.readFileSync(path.join(dir,n),'utf8'));
const pr=lire('provenance.json'),archive=pr.campagne,tests=lire('verification-tests-liaison.json');
assert.deepEqual(tests.archive,archive);assert.equal(tests.conformiteGlobale,false);
assert.equal(tests.echecs,1);assert.equal(tests.anomalies[0].id,'VAM-A01');
assert.equal(empreinte(fs.readFileSync(path.join(dir,'verification-vitest.json'))),tests.rapportSha256);
for(const source of [...pr.sources,...pr.sourcesRegles,...pr.sourcesTechniques,...tests.sources])assert.equal(empreinte(fs.readFileSync(source.fichier)),source.sha256,source.fichier+' a changé depuis la vérification');
assert.equal(empreinte(fs.readFileSync(path.join(dir,archive.fichier))),archive.sha256);
assert.equal(empreinte(fs.readFileSync(path.join(dir,'Vampire-2.0.0.gmos-driver'))),pr.pilote.sha256);
assert.equal(empreinte(fs.readFileSync(path.join(dir,'fiche/vampire-v5-fiche-personnage-interactive.html'))),pr.gabarit.htmlSha256);
const python=process.env.GMOS_PYTHON??path.join(process.env.USERPROFILE,'AppData/Local/Python/bin/python.exe');
const portable=path.resolve('outils/gmos-campagnes-tests/plugin/gmos-campagnes-tests/skills/campagnes-de-test/scripts/gmos_bundle.py');
const structure=JSON.parse(execFileSync(python,['-I','-B','-X','utf8',portable,'verify',path.join(dir,archive.fichier)],{encoding:'utf8'}));assert.equal(structure.valid,true,JSON.stringify(structure));
fs.writeFileSync(path.join(dir,'verification-plugin.json'),JSON.stringify({archive,controle:'Structure Nexus partielle ; pas un import GM-OS',...structure},null,2)+'\n');
const zipCampagne=new AdmZip(path.join(dir,archive.fichier)),manifest=JSON.parse(zipCampagne.readAsText('manifest.json'));
const captures=path.join(dir,'captures');fs.mkdirSync(captures,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),medias=[],photos=[];
try{
 const context=await browser.newContext({viewport:{width:1200,height:800}});await context.setOffline(true);const page=await context.newPage();
 for(const a of manifest.assetMap){const b=fs.readFileSync(path.join(dir,a.relativePath));assert.equal(empreinte(b),a.checksum);assert.equal(empreinte(zipCampagne.readFile(a.relativePath)),a.checksum);
  if(a.mimeType.startsWith('image/')){
   const size=await page.evaluate(url=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve([im.naturalWidth,im.naturalHeight]);im.onerror=()=>resolve(null);im.src=url;}),`data:${a.mimeType};base64,${b.toString('base64')}`);assert.ok(size,a.relativePath);
   await page.goto(pathToFileURL(path.join(dir,a.relativePath)).href);const target=path.join(captures,path.parse(a.relativePath).name+'.jpg');await page.locator(a.mimeType==='image/svg+xml'?'svg':'img').screenshot({path:target,type:'jpeg',quality:86});photos.push(target);medias.push({fichier:a.relativePath,sha256:a.checksum,dimensions:size});
  }else{
   const duration=await page.evaluate(async data=>{const c=new AudioContext();try{return(await c.decodeAudioData(new Uint8Array(data).buffer)).duration;}finally{await c.close();}},[...b]);assert.equal(duration,4);medias.push({fichier:a.relativePath,sha256:a.checksum,dureeSecondes:duration,ecouteHumaine:false});
  }
 }
 for(const [group,files]of [['plans',photos.filter(p=>path.basename(p).startsWith('plan-'))],['pieces',photos.filter(p=>path.basename(p).startsWith('piece-'))],['cartouches',photos.filter(p=>path.basename(p).startsWith('cartouche-'))]]){
  const w=400,h=286,canvas=createCanvas(w*3,h*Math.ceil(files.length/3)),ctx=canvas.getContext('2d');ctx.fillStyle='#e9e3dc';ctx.fillRect(0,0,canvas.width,canvas.height);
  for(const[i,p]of files.entries()){const im=await loadImage(p),x=i%3*w,y=Math.floor(i/3)*h;ctx.drawImage(im,x,y,w,266);ctx.fillStyle='#282128';ctx.font='14px Arial';ctx.fillText(path.basename(p),x+5,y+281);}
  fs.writeFileSync(path.join(captures,'planche-'+group+'.jpg'),canvas.toBuffer('image/jpeg',{quality:92}));
 }
}finally{await browser.close();}
assert.equal(medias.filter(x=>x.dimensions).length,31);assert.equal(medias.filter(x=>x.dureeSecondes).length,2);
let relu=false;
if(fs.existsSync(path.join(dir,'verification-relecture.json'))){const r=lire('verification-relecture.json');relu=r.archiveSha256===archive.sha256&&r.rendusExaminees===true&&r.narrationRelue===true;}
const rapport={archive,structurePartielle:true,controlesAutomatiques:tests.controles,reussis:tests.reussis,echecs:tests.echecs,anomalies:tests.anomalies,imagesDecodees:31,wavDecodes:2,medias,capturesExaminees:relu,importElectron:false,hubReseau:false,recetteHumaine:'NON TESTÉ'};
fs.writeFileSync(path.join(dir,'verification-medias.json'),JSON.stringify(rapport,null,2)+'\n');
fs.writeFileSync(path.join(dir,'RAPPORT-DE-VERIFICATION.md'),`# Vérification — Vampire V5\n\n**LOT PRÉPARÉ ; conformité globale NON acquise.**\n\n- ${tests.controles} contrôles : **${tests.reussis} réussis, 1 échec conservé VAM-A01** (cinq cases génériques au lieu de six sur CORPS). Le rapport Vitest est en échec ; ce défaut n’est pas transformé en succès attendu. Tout autre échec bloque l’emballage.\n- Manifeste natif, médias et empreintes, liens, champs/types, bornes, 12 séances prévues et 6 ateliers contrôlés sur l’archive livrée. Fonctions réelles : jets, Volonté, Exaltation, Compulsions, correspondance HTML, caviardage et injection Nexus en mémoire.\n- Injection en mémoire : une seule campagne ajoutée, anciens PJ et avatars sentinelles conservés. Restauration locale sérialisée : note de fiction et valeur du héros préservées. **Ce n’est pas un import Electron ni un rechargement de sa sauvegarde.**\n- Utilitaire portable du plugin : structure Nexus acceptée, contrôle partiel.\n- 31 images décodées hors ligne (30 SVG originaux et la bannière JPEG), 2 WAV synthétiques décodés de 4 secondes. Aucune écoute humaine revendiquée. Relecture des rendus et de la narration : ${relu?'consignée, même SHA':'en attente de consignation'}.\n- ${pr.cas} cas humains **NON TESTÉS** ; import réel, restauration/rechargement réel, Hub 360/768/1180 px, réception des jets, droits sur le réseau, matériel, IA et TTS **NON EXÉCUTÉS**. Aucun service lancé ni profil personnel lu.\n- Aucun module Vampire spécialisé compatible ; aucun automate ajouté pour / X, Remords, frénésie, liens ou progression. Profils aux valeurs choisies, pas créations novices certifiées.\n\nArchive : ${archive.fichier}\n\nSHA-256 : ${archive.sha256}\n\nPilote 2.0.0 inchangé : ${pr.pilote.sha256}\n`);
const sources=['vampire-executer-tests.mjs','vampire-verifier.mjs','vampire.test.ts','vitest-vampire.config.mts'];
for(const file of sources)fs.copyFileSync(path.join('outils/campagnes-de-recette',file),path.join(dir,'reproduction',file));
fs.copyFileSync(portable,path.join(dir,'reproduction','gmos_bundle.py'));
console.log(JSON.stringify({archive,controles:tests.controles,reussis:tests.reussis,echecs:tests.echecs,images:31,wav:2,relus:relu},null,2));
if(process.argv.includes('--emballer')){
 const revue=lire('verification-relecture.json');assert.equal(revue.archiveSha256,archive.sha256);assert.equal(revue.rendusExaminees,true);assert.equal(revue.narrationRelue,true);
 const zip=new AdmZip();
 function ajouter(rep,prefix=''){for(const e of fs.readdirSync(rep,{withFileTypes:true})){const relatif=path.posix.join(prefix,e.name),full=path.join(rep,e.name);if(e.isDirectory())ajouter(full,relatif);else if(!relatif.endsWith('.zip')&&relatif!=='verification-emballage.json')zip.addFile(relatif,fs.readFileSync(full));}}
 ajouter(dir);assert.equal(zip.getEntries().filter(e=>e.entryName.endsWith('.gmos')).length,1);for(const e of zip.getEntries())e.header.time=new Date(pr.dateFixe);
 const final=path.join(dir,'Vampire-Le-registre-des-absents-Recette.zip');zip.writeZip(final);
 const controle=new AdmZip(final);assert.equal(empreinte(controle.readFile(archive.fichier)),archive.sha256);
 assert.equal(controle.getEntries().filter(e=>e.entryName.endsWith('.gmos')).length,1);
 const csv=controle.readAsText('resultats.csv');assert.equal((csv.match(/NON TESTÉ/g)??[]).length,53);
 fs.writeFileSync(path.join(dir,'verification-emballage.json'),JSON.stringify({zip:path.basename(final),sha256:empreinte(fs.readFileSync(final)),archive,octets:fs.statSync(final).size,campagnes:1,anomalies:['VAM-A01'],recetteHumaine:'NON TESTÉ'},null,2)+'\n');
 console.log('ZIP livré, une seule campagne, mêmes empreintes.');
}
