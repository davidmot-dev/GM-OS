import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {createCanvas,loadImage} from '@napi-rs/canvas';

const root=path.dirname(fileURLToPath(import.meta.url)),dist=path.join(root,'dist');
await fs.mkdir(dist,{recursive:true});
const fixture=(w,h,paint)=>{const c=createCanvas(w,h);paint(c.getContext('2d'));return c.toBuffer('image/png');};
const large=fixture(2400,1000,c=>{c.fillStyle='#ff0000';c.fillRect(0,0,2400,200);c.fillStyle='#162c42';c.fillRect(0,200,2400,600);c.fillStyle='#00ff00';c.fillRect(0,800,2400,200);});
const small=fixture(1000,600,c=>{c.fillStyle='#162c42';c.fillRect(0,0,1000,600);});
const wide=fixture(3200,600,c=>{c.fillStyle='#ff0000';c.fillRect(0,0,3200,600);c.fillStyle='#162c42';c.fillRect(400,0,2400,600);});
const noise=fixture(2400,600,c=>{const d=c.createImageData(2400,600);let seed=12345;for(let i=0;i<d.data.length;i+=4){for(let k=0;k<3;k++){seed=(seed*1664525+1013904223)>>>0;d.data[i+k]=seed>>>24;}d.data[i+3]=255;}c.putImageData(d,0,0);});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({offline:true,viewport:{width:1280,height:1000}}),page=await context.newPage();
const errors=[],network=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
const load=async(buffer,name='source.png')=>{await page.locator('#source').setInputFiles({name,mimeType:'image/png',buffer});await page.waitForFunction(()=>!document.querySelector('#status').textContent.startsWith('Choisissez'));await page.waitForTimeout(100);};
async function test(name,fn){await fn();checks.push(name);console.log('OK '+name);}
async function output(){await page.locator('#export').click();await page.locator('#download').waitFor({state:'visible'});const result=await page.evaluate(async()=>{const a=document.querySelector('#download'),b=await(await fetch(a.href)).blob();return {name:a.download,type:b.type,bytes:b.size,base64:await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(b);})};});return {...result,buffer:Buffer.from(result.base64,'base64')};}
async function centerCheck(bytes){const image=await loadImage(bytes);assert.equal(image.width,2400);assert.equal(image.height,600);const c=createCanvas(2400,600);c.getContext('2d').drawImage(image,0,0);const pixel=c.getContext('2d').getImageData(0,0,1,1).data;for(const [i,n]of [22,44,66].entries())assert.ok(Math.abs(pixel[i]-n)<=4);}
try{
 await page.goto(pathToFileURL(path.join(root,'plugin/rpg-banner-builder/skills/create-banner/tools/preparer-banniere.html')).href);
 await test('Outil utilisable hors ligne et export désactivé sans source',async()=>assert.equal(await page.locator('#export').isDisabled(),true));
 await test('Recadrage vertical centré et export WebP 2400 × 600 sous 500 Ko',async()=>{await load(large);const result=await output();assert.equal(result.type,'image/webp');assert.ok(result.bytes<=500000);await centerCheck(result.buffer);});
 await test('Export JPEG, dimensions mesurées et nom sûr',async()=>{await page.locator('#format').selectOption('image/jpeg');await page.locator('#filename').fill('Test: Band');const result=await output();assert.equal(result.type,'image/jpeg');assert.equal(result.name,'Test- Band.jpg');assert.ok(result.bytes<=500000);await centerCheck(result.buffer);});
 await test('Source trop petite : aucun export sans agrandissement explicite',async()=>{await load(small);assert.equal(await page.locator('#export').isDisabled(),true);assert.match(await page.locator('#status').textContent(),/trop petite/);await page.locator('#upscale').check();const result=await output();await centerCheck(result.buffer);await page.locator('#upscale').uncheck();assert.equal(await page.locator('#download').isHidden(),true);});
 await test('Recadrage horizontal centré sans étirement',async()=>{await load(wide);await centerCheck((await output()).buffer);});
 await test('Compression réelle d’une image bruitée sous la borne',async()=>{await load(noise);const result=await output();assert.ok(result.bytes<=500000);const image=await loadImage(result.buffer);assert.equal(image.width/image.height,4);});
 await test('Deux aperçus cover centrés de 54 px de haut',async()=>{for(const id of ['wide','narrow']){const css=await page.locator('#'+id).evaluate(el=>{const s=getComputedStyle(el);return {h:s.height,size:s.backgroundSize,position:s.backgroundPosition};});assert.equal(css.h,'54px');assert.equal(css.size,'cover');assert.equal(css.position,'50% 50%');}});
 await test('Modification pendant l’encodage : sortie périmée écartée',async()=>{await page.evaluate(()=>{document.querySelector('#export').click();const f=document.querySelector('#filename');f.value='Nouvelle version';f.dispatchEvent(new Event('input'));});await page.waitForTimeout(150);assert.equal(await page.locator('#download').isHidden(),true);assert.equal(await page.locator('#export').isEnabled(),true);});
 await test('Image corrompue refusée et ancien téléchargement supprimé',async()=>{await load(Buffer.from('image invalide'));assert.match(await page.locator('#status').textContent(),/Impossible de lire/);assert.equal(await page.locator('#export').isDisabled(),true);assert.equal(await page.locator('#download').isHidden(),true);});
 await load(large);await page.locator('#format').selectOption('image/webp');await output();await page.screenshot({path:path.join(dist,'outil-apercu.png'),fullPage:true});
 await test('Smartphone : page sans débordement horizontal',async()=>{await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);});
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);checks.push('Aucune erreur JavaScript et aucune requête réseau');
 await fs.writeFile(path.join(dist,'verification-outil.json'),JSON.stringify({checks,errors,network,fixture:'Images synthétiques de contrôle uniquement ; aucune bannière de jeu générée.'},null,2)+'\n');
 console.log(checks.length+' contrôles réussis.');
}finally{await browser.close();}
