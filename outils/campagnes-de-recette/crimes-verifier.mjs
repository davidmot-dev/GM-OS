// Contrôles des livrables ; un échec de conformité nommé reste un échec dans le rapport.
// CRI-A01 corrigé le 24/11/2026 : la suite liée ne doit plus porter aucun échec.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import AdmZip from 'adm-zip';import {chromium} from '@playwright/test';import {createCanvas,loadImage} from '@napi-rs/canvas';
import {empreinte} from './archives-de-recette.mjs';
const r=path.resolve('output/campagnes-tests/crimes'),j=n=>JSON.parse(fs.readFileSync(path.join(r,n),'utf8')),e=(n,x)=>fs.writeFileSync(path.join(r,n),typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');
const pr=j('provenance.json'),archive=pr.campagne;assert.equal(empreinte(fs.readFileSync(path.join(r,archive.fichier))),archive.sha256);
const tests=j('verification-vitest.json');const echecs=tests.testResults.flatMap(f=>f.assertionResults).filter(x=>x.status==='failed');assert.equal(echecs.length,0,echecs.map(x=>x.fullName).join('
'));
const portable='C:/Users/david/.codex/plugins/cache/created-by-me-remote/gmos-campagnes-tests/0.2.0/skills/campagnes-de-test/scripts/gmos_bundle.py';
const python='C:/Users/david/AppData/Local/Python/bin/python.exe';
const verification=execFileSync(python,['-I','-X','utf8','-B',portable,'verify',path.join(r,archive.fichier)],{encoding:'utf8'});e('verification-plugin.json',{archiveSha256:archive.sha256,outil:'gmos_bundle.py verify — contrôle structurel partiel',sortie:verification});
const captures=path.join(r,'captures');fs.mkdirSync(captures,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});let fichiers;
try{const context=await browser.newContext({viewport:{width:1200,height:800}});await context.setOffline(true);const page=await context.newPage();const img=path.join(r,'assets/images');fichiers=fs.readdirSync(img).sort();
 for(const [i,n]of fichiers.entries()){const mime=n.endsWith('.jpg')?'image/jpeg':'image/svg+xml';const uri=`data:${mime};base64,`+fs.readFileSync(path.join(img,n)).toString('base64');await page.setContent('<html><body style="margin:0;background:#e0d9ce;display:grid;place-items:center;width:1200px;height:800px"><img style="max-width:1200px;max-height:800px" /></body></html>');await page.locator('img').evaluate(async(el,src)=>{el.src=src;await el.decode();},uri);assert.ok(await page.locator('img').evaluate(el=>el.naturalWidth>0&&el.naturalHeight>0),n);await page.screenshot({path:path.join(captures,`${String(i+1).padStart(2,'0')}-${n}.jpg`),type:'jpeg',quality:90});}
}finally{await browser.close();}
const files=fs.readdirSync(captures).filter(n=>n.endsWith('.jpg')&&!n.startsWith('planche-')).sort();
for(let i=0;i<files.length;i+=4){const can=createCanvas(1200,800),ctx=can.getContext('2d');ctx.fillStyle='#f0e8d8';ctx.fillRect(0,0,1200,800);for(let k=0;k<4&&i+k<files.length;k++){const img=await loadImage(path.join(captures,files[i+k]));ctx.drawImage(img,k%2*600,Math.floor(k/2)*400,600,400);}fs.writeFileSync(path.join(captures,`planche-${String(i/4+1).padStart(2,'0')}.jpg`),can.toBuffer('image/jpeg'));}
e('verification-medias.json',{archiveSha256:archive.sha256,imagesDecodees:fichiers.length,imagesRendues:files.length,navigateur:'Edge Chromium hors ligne',audio:'Aucun son préparé',capturesRelues:false,captures:files.map(fichier=>({fichier:'captures/'+fichier,sha256:empreinte(fs.readFileSync(path.join(captures,fichier)))}))});
e('verification-controles.json',{archiveSha256:archive.sha256,total:tests.numTotalTests,reussis:tests.numPassedTests,echecs:tests.numFailedTests,echecsConnus:echecs.map(x=>x.fullName),import:'Nexus réel en mémoire et sauvegarde validée, pas import Electron',recetteHumaine:'NON TESTÉ',electron:'NON EXÉCUTÉ',hub:'NON EXÉCUTÉ'});
console.log(JSON.stringify({archive,total:tests.numTotalTests,reussis:tests.numPassedTests,echecs:tests.numFailedTests,images:fichiers.length}));
