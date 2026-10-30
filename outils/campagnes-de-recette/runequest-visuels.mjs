// Vérification propre à ce lot : ne modifie pas les vérificateurs des autres jeux.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import {empreinte} from './archives-de-recette.mjs';
const dir=path.resolve('output/campagnes-tests/runequest'),captures=path.join(dir,'captures');fs.mkdirSync(captures,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const contexte=await browser.newContext({viewport:{width:1200,height:800}});await contexte.setOffline(true);const page=await contexte.newPage();
 const images=fs.readdirSync(path.join(dir,'assets/images')),audios=fs.readdirSync(path.join(dir,'assets/audio'));
 for(const n of images){const data='data:image/svg+xml;base64,'+fs.readFileSync(path.join(dir,'assets/images',n)).toString('base64');assert.equal(await page.evaluate(src=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im.naturalWidth===1200&&im.naturalHeight===800);im.onerror=()=>resolve(false);im.src=src;}),data),true,n);}
 for(const n of audios){const data=[...fs.readFileSync(path.join(dir,'assets/audio',n))];assert.equal(await page.evaluate(async octets=>{const ac=new AudioContext();try{return(await ac.decodeAudioData(new Uint8Array(octets).buffer)).duration;}finally{await ac.close();}},data),4,n);}
 for(const n of ['carte-halle','carte-gue','carte-source','compagnie','indice-accord','indice-croquis','pj-arven','pj-delea','pj-koros']){await page.goto(pathToFileURL(path.join(dir,'assets/images',n+'.svg')).href);await page.locator('svg').screenshot({path:path.join(captures,'rendu-'+n+'.jpg'),type:'jpeg',quality:85});}
 const a=JSON.parse(fs.readFileSync(path.join(dir,'inventaire.json'),'utf8')).archives;
 fs.writeFileSync(path.join(dir,'verification-medias.json'),JSON.stringify({reussi:true,horsLigne:true,imagesDecodees:images.length,wavDecodes:audios.length,dureeWavSecondes:4,archives:a.map(x=>({fichier:x.fichier,sha256:empreinte(fs.readFileSync(path.join(dir,x.fichier)))})),capturesExaminees:false},null,2)+'\n');console.log(JSON.stringify({images:images.length,audios:audios.length,captures:9}));
}finally{await browser.close();}
