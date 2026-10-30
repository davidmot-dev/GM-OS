// Recette hors ligne : HTML autonome et import dans un moteur en contexte neuf.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const cible=path.resolve('docs/fiches/Degenesis/degenesis-fiche-personnage-interactive.html');
const sortie='output/fiches/degenesis',id='degenesis-fr';fs.mkdirSync(sortie,{recursive:true});
const rapport=execFileSync(process.execPath,['scripts/fiche-valider.mjs',cible,'--json'],{encoding:'utf8'});
fs.writeFileSync(sortie+'/validation.json',rapport);assert.equal(JSON.parse(rapport)[0].accepte,true);
fs.writeFileSync(sortie+'/validation.md',execFileSync(process.execPath,['scripts/fiche-valider.mjs',cible],{encoding:'utf8'}));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:1120},deviceScaleFactor:2,acceptDownloads:true});
const erreurs=[],reseau=[];ctx.on('page',p=>p.on('pageerror',e=>erreurs.push(e.message)));
await ctx.setOffline(true);await ctx.route(/^https?:/,r=>{reseau.push(r.request().url());r.abort();});
const page=await ctx.newPage();
const champ=k=>page.locator(`[data-key="${k}"]`),point=(k,v)=>page.locator(`[data-key="${k}"][data-value="${v}"]`);
const pause=()=>page.waitForTimeout(250);
const donnees=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('character-sheet:degenesis-fr:v1')).data);
const zoom=async v=>{await page.locator('#zoom').fill(String(v));await page.locator('#zoom').dispatchEvent('change');};
const exporte=async()=>{const[d]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);return JSON.parse(fs.readFileSync(await d.path(),'utf8'));};
const importe=async doc=>{await page.locator('#file').setInputFiles({name:'controle.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});await pause();};
try{
 await page.goto(pathToFileURL(cible).href);await champ('identity.name').waitFor();
 const manifeste=await page.evaluate(()=>JSON.parse(document.getElementById('character-sheet-template').textContent));
 const fields=manifeste.template.pages.flatMap(p=>p.fields),definitions=new Map(fields.map(f=>[f.key,f]));
 assert.equal(manifeste.template.id,id);assert.equal(manifeste.template.pages.length,1);
 assert.equal(fields.length,461);assert.equal(definitions.size,129);assert.equal(await page.locator('.dg-field').count(),461);
 const fond=Buffer.from(manifeste.template.pages[0].backgroundData.split(',')[1],'base64');assert.deepEqual(fond,fs.readFileSync(sortie+'/source-1.png'));
 await zoom(100);
 await page.locator('.page-wrap').screenshot({path:sortie+'/page-1-vierge.png'});
 await page.locator('#zones').click();await page.locator('.page-wrap').screenshot({path:sortie+'/page-1-zones.png'});await page.locator('#zones').click();
 await champ('identity.name').fill('Alda');await champ('identity.culture').fill('Borca\nUne vie parmi les ruines.');
 await point('attributes.physical',4).click();await pause();assert.equal((await donnees())['attributes.physical'],4);assert.equal(await page.locator('[data-key="attributes.physical"].active').count(),4);
 await point('attributes.physical',4).click();await pause();assert.equal((await donnees())['attributes.physical'],0);assert.equal(await page.locator('[data-key="attributes.physical"].active').count(),0);
 for(const [k,v]of [['skills.athletics',3],['skills.survival',5],['origins.resources',2],['tracks.ego',19],['tracks.sporulation',7],['tracks.flesh_wounds',9],['tracks.trauma',4],['potentials.5.level',2]]){
  await point(k,v).click();await pause();assert.equal((await donnees())[k],v);assert.equal(await page.locator(`[data-key="${k}"].active`).count(),v);
 }
 const fixture={};for(const[k,f]of definitions){if(f.type==='number')fixture[k]=3;else if(f.type==='hotspot')fixture[k]=f.value;else if(f.type==='textarea')fixture[k]='Notes de terrain.';else fixture[k]='Alda';}
 Object.assign(fixture,{'identity.name':'Alda des Forges','identity.age':27,'identity.rank':'Recrue','experience.total':12,'identity.gender':'F','identity.height':'1,74 m','identity.weight':'67 kg','wealth.dinars_lc':'125 / 30','identity.culture':'Borca\nRécupératrice des terres grises.','identity.concept':'Le Créateur\nRéparer plutôt que jeter.','identity.cult':'Spitaliers\nProfil de contrôle, valeurs choisies.','attributes.physical':4,'attributes.agility':3,'skills.athletics':3,'skills.medicine':4,'origins.allies':2,'origins.resources':2,'tracks.ego':12,'tracks.sporulation':3,'tracks.flesh_wounds':5,'tracks.trauma':2,'potentials.0.name':'Potentiel à renseigner','potentials.0.level':2,'weapons.0.name':'Carabine de récupération','weapons.0.handling':'AGI + Armes\nà projectiles','weapons.0.range':'20 / 60','weapons.0.damage':'6','weapons.0.magazine':'6 / 6','weapons.0.properties':'Valeurs de contrôle\nsans effet automatique','weapons.0.weight':3.5,'weapons.0.technology':'III','weapons.0.slots':2,'armor.0.name':'Manteau renforcé','armor.0.rating':2,'armor.0.properties':'Équipement de contrôle','armor.0.weight':4,'armor.0.technology':'II','armor.0.slots':2,'equipment.0.name':'Bandages et trousse de soin','equipment.0.weight':1,'equipment.3.name':'Gourde et provisions','equipment.3.weight':2,'equipment_totals.0.weight':10.5});
 page.once('dialog',d=>d.accept());await importe({format:'interactive-character-sheet',version:1,sheet:id,data:fixture});
 const json=await exporte();assert.deepEqual(json.data,fixture);assert.equal(Object.keys(json.data).length,129);
 await page.reload();await champ('identity.name').waitFor();assert.equal(await champ('identity.name').inputValue(),'Alda des Forges');
 await zoom(100);await page.locator('.page-wrap').screenshot({path:sortie+'/page-1-remplie.png'});
 const garde=await donnees();
 for(const doc of [{...json,data:{'identity.age':'texte'}},{...json,sheet:'autre-modele'},{...json,data:{'tracks.ego':25}},{...json,data:{'potentials.0.level':4}},{...json,data:{'identity.name':123}}]){
  await importe(doc);assert.match(await page.locator('#status').textContent(),/Import refusé/);assert.deepEqual(await donnees(),garde);
 }
 page.once('dialog',d=>d.dismiss());await page.locator('#reset').click();assert.deepEqual(await donnees(),garde);
 page.once('dialog',d=>d.accept());await page.locator('#reset').click();await pause();assert.deepEqual(await donnees(),{});
 await importe(json);assert.deepEqual(await donnees(),garde);
 page.once('dialog',d=>d.dismiss());await importe({...json,data:{'identity.name':'À refuser'}});assert.deepEqual(await donnees(),garde);
 await page.locator('#help').click();assert.equal(await page.locator('#help-dialog').evaluate(e=>e.open),true);await page.locator('#close-help').click();
 assert.equal(await page.locator('#prev').isDisabled(),true);assert.equal(await page.locator('#next').isDisabled(),true);
 await zoom(5);assert.equal(await page.locator('#zoom').inputValue(),'20');await zoom(500);assert.equal(await page.locator('#zoom').inputValue(),'400');
 await page.keyboard.press('Control+-');assert.equal(await page.locator('#zoom').inputValue(),'390');await page.keyboard.press('Control+0');
 const avant=Number(await page.locator('#zoom').inputValue());await page.locator('#viewport').dispatchEvent('wheel',{ctrlKey:true,deltaY:-20});assert.equal(Number(await page.locator('#zoom').inputValue()),avant+10);
 await page.locator('#zones').click();await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.page-wrap:visible').count(),1);assert.equal(await page.locator('.toolbar').isVisible(),false);
 assert.equal(await champ('identity.name').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.equal(await champ('identity.name').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
 // Impression dérivée de contrôle en mémoire, aucun PDF source modifié.
 const impression=await page.pdf({preferCSSPageSize:true,printBackground:true});
 const pdf=await getDocument({data:new Uint8Array(impression)}).promise;assert.equal(pdf.numPages,1);
 const imprimee=(await pdf.getPage(1)).view;assert.ok(Math.abs(imprimee[2]-595.22)<1);assert.ok(Math.abs(imprimee[3]-842)<1);await pdf.destroy();
 await page.emulateMedia({media:'screen'});await page.locator('#zones').click();
 await page.setViewportSize({width:390,height:844});await page.locator('#fit').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:sortie+'/mobile-390.png'});
 // Import dans la bibliothèque d'un contexte Chrome neuf, pas le vrai profil GM-OS.
 const moteur=await ctx.newPage();await moteur.goto(pathToFileURL(path.resolve('docs/fiches/Character_Sheet_Manager.html')).href);
 await moteur.locator('#templateFile').setInputFiles(cible);await moteur.getByText('Degenesis — fiche de personnage',{exact:true}).waitFor();
 await moteur.locator('[data-new="degenesis-fr"]').click();await moteur.locator('#newCharacterName').fill('Contrôle Degenesis');await moteur.locator('#createCharacterBtn').click();
 await moteur.locator('.sheet[data-template="degenesis-fr"]').waitFor();assert.equal(await moteur.locator('.dg-field').count(),461);
 await moteur.locator('[data-key="identity.name"]').fill('Alda du moteur');
 await moteur.locator('[data-key="tracks.ego"][data-value="11"]').click();assert.equal(await moteur.locator('[data-key="tracks.ego"].active').count(),11);
 await moteur.locator('[data-key="skills.medicine"][data-value="4"]').click();
 await moteur.locator('.sheet[data-template="degenesis-fr"]').screenshot({path:sortie+'/moteur-page-1.png'});
 const[d]=await Promise.all([moteur.waitForEvent('download'),moteur.locator('#exportCharBtn').click()]);
 const mj=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert.equal(mj.data['tracks.ego'],11);assert.equal(mj.data['skills.medicine'],4);
 page.once('dialog',dlg=>dlg.accept());await importe(mj);assert.equal(await champ('identity.name').inputValue(),'Alda du moteur');assert.equal((await donnees())['tracks.ego'],11);
 assert.deepEqual(erreurs,[]);assert.deepEqual(reseau,[]);
 const bilan={pages:1,zones:461,cles:129,pistes:58,hotspots:390,htmlSHA256:createHash('sha256').update(fs.readFileSync(cible)).digest('hex'),fondIdentiqueAuRenduSource:true,erreursJavaScript:erreurs,requetesReseau:reseau,impression:imprimee,fonctions:'Saisie et sauvegarde des 129 clés, jauges cumulatives et remise à zéro, import/export et rechargement, rejets sans perte, reset confirmé, zoom/clavier/molette, mobile, impression sur une page, import dans un moteur jetable et retour JSON v2.',integration:'Modèle non installé dans builtinTemplates ; correspondance non écrite, conformément à l’atelier.',capturesExaminees:false};
 fs.writeFileSync(sortie+'/verification.json',JSON.stringify(bilan,null,2)+'\n');console.log(JSON.stringify(bilan,null,2));
}finally{await browser.close();}
