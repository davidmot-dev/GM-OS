/** Décodage hors ligne, rendus des vrais médias et planches ; aucun serveur. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {empreinte} from './archives-de-recette.mjs';
const dir=path.resolve('output/campagnes-tests/argyropee'),i=JSON.parse(fs.readFileSync(path.join(dir,'inventaire.json'),'utf8'));
const rapportPath=path.join(dir,'verification-medias.json'),captures=path.join(dir,'captures');
if(process.argv.includes('--lecture-confirmee')){
 const r=JSON.parse(fs.readFileSync(rapportPath,'utf8'));assert.deepEqual(r.archives,i.archives);
 for(const f of [...r.medias,...r.captures])assert.equal(empreinte(fs.readFileSync(path.join(dir,f.fichier))),f.sha256);
 r.capturesExaminees=true;fs.writeFileSync(rapportPath,JSON.stringify(r,null,2)+'\n');console.log('Lecture des rendus confirmée, empreintes inchangées.');
}else{
 fs.mkdirSync(captures,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1200,height:800}});await context.setOffline(true);const page=await context.newPage();
  const medias=[],photos=[];const images=fs.readdirSync(path.join(dir,'assets/images')).sort(),sons=fs.readdirSync(path.join(dir,'assets/audio')).sort();
  for(const nom of images){
   const fichier=`assets/images/${nom}`,data=fs.readFileSync(path.join(dir,fichier)),src=`data:${nom.endsWith('.jpg')?'image/jpeg':'image/svg+xml'};base64,${data.toString('base64')}`;
   const dimensions=await page.evaluate(src=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve([im.naturalWidth,im.naturalHeight]);im.onerror=()=>resolve(null);im.src=src;}),src);
   assert.ok(dimensions,nom);medias.push({fichier,sha256:empreinte(data),dimensions});
   await page.goto(pathToFileURL(path.join(dir,fichier)).href);
   const sortie=`captures/rendu-${path.parse(nom).name}.jpg`;
   await page.locator(nom.endsWith('.svg')?'svg':'img').screenshot({path:path.join(dir,sortie),type:'jpeg',quality:85});photos.push({fichier:sortie,sha256:empreinte(fs.readFileSync(path.join(dir,sortie)))});
  }
  for(const nom of sons){
   const fichier=`assets/audio/${nom}`,data=fs.readFileSync(path.join(dir,fichier));
   const duree=await page.evaluate(async octets=>{const a=new AudioContext();try{return(await a.decodeAudioData(new Uint8Array(octets).buffer)).duration;}finally{await a.close();}},[...data]);assert.equal(duree,4);
   medias.push({fichier,sha256:empreinte(data),dureeSecondes:duree,ecouteHumaine:false});
  }
  for(const groupe of ['carte','indice','pj','pnj','autres']){
   const selection=photos.filter(p=>{const n=path.basename(p.fichier);return groupe==='autres'?n.startsWith('rendu-')&&!/rendu-(carte|indice|pj|pnj)-/.test(n):n.startsWith(`rendu-${groupe}-`);});
   if(!selection.length)continue;const w=400,h=285,cols=3,canvas=createCanvas(cols*w,h*Math.ceil(selection.length/cols)),ctx=canvas.getContext('2d');ctx.fillStyle='#eeece6';ctx.fillRect(0,0,canvas.width,canvas.height);
   for(const[n,p]of selection.entries()){const im=await loadImage(path.join(dir,p.fichier)),x=n%cols*w,y=Math.floor(n/cols)*h,r=Math.min(w/im.width,260/im.height);ctx.drawImage(im,x,y,im.width*r,im.height*r);ctx.fillStyle='#25251f';ctx.font='15px Arial';ctx.fillText(path.basename(p.fichier),x+8,y+279,w-16);}
   const fichier=`captures/planche-${groupe}.jpg`;fs.writeFileSync(path.join(dir,fichier),canvas.toBuffer('image/jpeg',{quality:90}));photos.push({fichier,sha256:empreinte(fs.readFileSync(path.join(dir,fichier)))});
  }
  const rapport={reussi:true,navigateur:'Edge Chromium headless, profil jetable',horsLigne:true,imagesDecodees:images.length,wavDecodes:sons.length,archives:i.archives,medias,captures:photos,capturesExaminees:false,importElectron:false,hubReseau:false};
  fs.writeFileSync(rapportPath,JSON.stringify(rapport,null,2)+'\n');console.log(JSON.stringify({images:images.length,sons:sons.length,rendus:photos.length,capturesExaminees:false}));
 }finally{await browser.close();}
}
