// Vérification hors ligne, dans un navigateur jetable ; aucune donnée de GM-OS.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from '@playwright/test';
import {createCanvas} from '@napi-rs/canvas';
const cible=path.resolve('docs/fiches/Crimes/crimes-fiche-personnage-interactive.html');
const sortie='output/fiches/crime';fs.mkdirSync(sortie,{recursive:true});
const rapport=execFileSync(process.execPath,['scripts/fiche-valider.mjs',cible,'--json'],{encoding:'utf8'});
fs.writeFileSync(sortie+'/validation.json',rapport);
const verdict=JSON.parse(rapport)[0];assert.equal(verdict.accepte,true);
const navigateur=await chromium.launch({channel:'msedge',headless:true});
const contexte=await navigateur.newContext({viewport:{width:1280,height:1060},deviceScaleFactor:2,acceptDownloads:true});
const page=await contexte.newPage(),erreurs=[],reseau=[];
page.on('pageerror',e=>erreurs.push(e.message));
await contexte.route(/^https?:/,r=>{reseau.push(r.request().url());r.abort();});
const champ=k=>page.locator(`[data-key="${k}"]`);
const point=(k,v)=>page.locator(`[data-key="${k}"][data-value="${v}"]`);
const donnees=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('character-sheet:crimes-fr:v1')).data);
const pause=()=>page.waitForTimeout(250);
async function exporter(){const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);return JSON.parse(fs.readFileSync(await d.path(),'utf8'));}
async function importer(doc){await page.locator('#file').setInputFiles({name:'fiche.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});await pause();}
try{
 await page.goto(pathToFileURL(cible).href);await page.locator('.crime-field').first().waitFor();
 const manifeste=await page.evaluate(()=>JSON.parse(document.getElementById('character-sheet-template').textContent));
 assert.equal(manifeste.template.pages.length,2);assert.equal(await page.locator('.crime-field').count(),344);
 assert.equal(await page.locator('.crime-checkbox').count(),55);
 // Les marques des Potentiels (C2, 2026-10-22) : fatigue, épuisement, blessures, sous chacun des trois.
 assert.equal(await page.locator('.crime-harm').count(),9);
 await page.locator('#zoom').fill('100');await page.locator('#zoom').dispatchEvent('change');
 for(let i=0;i<2;i++){
  await page.locator('#page').selectOption(String(i));
  await page.locator('.page-wrap:not([hidden])').screenshot({path:`${sortie}/page-${i+1}-vierge.png`});
  await page.locator('#zones').click();
  assert.notEqual(await page.locator('.page-wrap:not([hidden]) .crime-field').first().evaluate(e=>getComputedStyle(e).outlineStyle),'none');
  await page.locator('.page-wrap:not([hidden])').screenshot({path:`${sortie}/page-${i+1}-zones.png`});
  await page.locator('#zones').click();
 }
 await page.locator('#page').selectOption('0');
 await point('attributes.physical',7).click();
 assert.equal(await page.locator('[data-key="attributes.physical"].active').count(),7);
 await point('attributes.physical',7).click();assert.equal(await page.locator('[data-key="attributes.physical"].active').count(),0);
 await point('attributes.physical',6).click();
 await point('psychology.emotivity','yes').click();await point('psychology.emotivity','no').click();
 assert.equal(await page.locator('[data-key="psychology.emotivity"].active').count(),1);
 await champ('specialties.combat.unarmed').check();await champ('specialties.combat.blades').check();
 await point('skills.combat.level',3).click();await champ('skills.combat.counter').fill('27');
 await champ('psychology.neurosis.threshold').fill('8');await point('tracks.neurosis',5).click();
 await champ('psychology.madness').fill('Notes de contrôle sur deux lignes.\nAucune règle calculée.');
 await page.locator('#page').selectOption('1');
 await champ('identity.name').fill('Moreau');await champ('identity.first').fill('Camille');
 await champ('profile.description').fill('Texte de contrôle : accents, apostrophe et saisie longue.');
 await champ('contacts.0.name').fill('Contact de contrôle');await point('contacts.0.rating',3).click();
 await champ('clues.0.text').fill('Indice de contrôle');await champ('clues.0.points.constable').fill('12');
 await champ('team.name').fill('Les Enquêteurs');await champ('team.objectives').fill('Objectif de contrôle.');
 const portrait=createCanvas(150,180),g=portrait.getContext('2d');g.fillStyle='#c3ccc4';g.fillRect(0,0,150,180);g.fillStyle='#31564a';g.beginPath();g.arc(75,55,27,0,Math.PI*2);g.fill();g.fillRect(38,92,74,70);
 const [choix]=await Promise.all([page.waitForEvent('filechooser'),champ('portrait').click()]);
 await choix.setFiles({name:'portrait.png',mimeType:'image/png',buffer:portrait.toBuffer('image/png')});
 await page.locator('[data-key="portrait"] img').waitFor();await pause();
 const exporte=await exporter();assert.equal(exporte.data['identity.name'],'Moreau');assert.equal(exporte.data['skills.combat.counter'],27);
 assert.equal(exporte.data['psychology.neurosis.threshold'],8);assert.equal(exporte.data['tracks.neurosis'],5);
 assert.equal(exporte.data['specialties.combat.unarmed'],true);assert.equal(exporte.data['specialties.combat.blades'],true);
 assert.equal(exporte.data['psychology.emotivity'],'no');assert.ok(exporte.data.portrait.startsWith('data:image/jpeg;base64,'));
 await page.reload();await champ('identity.name').waitFor({state:'attached'});await page.locator('#page').selectOption('1');assert.equal(await champ('identity.name').inputValue(),'Moreau');
 await page.locator('#zoom').fill('100');await page.locator('#zoom').dispatchEvent('change');
 for(let i=0;i<2;i++){await page.locator('#page').selectOption(String(i));await page.locator('.page-wrap:not([hidden])').screenshot({path:`${sortie}/page-${i+1}-remplie.png`});}
 // Un import invalide ne détruit pas la fiche déjà remplie.
 await importer({...exporte,data:{'identity.name':'Perdu','skills.combat.counter':'texte'}});
 assert.match(await page.locator('#status').textContent(),/Import refusé/);assert.equal((await donnees())['identity.name'],'Moreau');
 page.once('dialog',d=>d.dismiss());await page.locator('#reset').click();assert.equal((await donnees())['identity.name'],'Moreau');
 page.once('dialog',d=>d.accept());await page.locator('#reset').click();await pause();assert.deepEqual(await donnees(),{});
 await importer(exporte);assert.deepEqual(await donnees(),exporte.data);
 page.once('dialog',d=>d.accept());await champ('portrait').click({modifiers:['Shift']});await pause();assert.equal((await donnees()).portrait,'');
 page.once('dialog',d=>d.accept());await importer(exporte);assert.ok((await donnees()).portrait);
 await page.locator('#help').click();assert.equal(await page.locator('#help-dialog').evaluate(e=>e.open),true);await page.locator('#close-help').click();
 await page.locator('#zoom').fill('10');await page.locator('#zoom').dispatchEvent('change');assert.equal(await page.locator('#zoom').inputValue(),'20');
 await page.locator('#zoom').fill('900');await page.locator('#zoom').dispatchEvent('change');assert.equal(await page.locator('#zoom').inputValue(),'400');
 await page.keyboard.press('Control+-');assert.equal(await page.locator('#zoom').inputValue(),'390');await page.keyboard.press('Control+0');
 await page.locator('#viewport').dispatchEvent('wheel',{ctrlKey:true,deltaY:-10});
 await page.locator('#zones').click();
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.page-wrap:visible').count(),2);assert.equal(await page.locator('.toolbar').isVisible(),false);
 assert.equal(await champ('identity.name').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.equal(await champ('identity.name').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
 assert.notEqual(await page.locator('[data-key="attributes.physical"].active').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 await page.emulateMedia({media:'screen'});
 const mobile=await navigateur.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});const mp=await mobile.newPage();await mp.goto(pathToFileURL(cible).href);
 assert.equal(await mp.locator('.crime-field').count(),344);assert.ok(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await mp.screenshot({path:`${sortie}/mobile-390.png`});await mobile.close();
 assert.deepEqual(erreurs,[]);assert.deepEqual(reseau,[]);
 const bilan={pages:2,zones:344,cles:206,erreursJavaScript:erreurs,appelsReseau:reseau,verifications:['fonds et manifeste','coordonnées dans les pages','jauges cumulatives et retour à zéro','choix exclusifs','cases indépendantes','compteurs numériques','portrait : ajout, suppression et transport JSON','autosauvegarde et rechargement','export/import sans perte','rejet atomique des imports invalides','réinitialisation : annulation et confirmation','zoom 20–400 et raccourcis','impression : deux pages visibles, outils masqués','écran de 390 pixels']};
 fs.writeFileSync(sortie+'/verification.json',JSON.stringify(bilan,null,2));console.log(JSON.stringify(bilan,null,2));
}finally{await contexte.close();await navigateur.close();}
