/** Vérification de livraison, navigateur jetable hors ligne, aucun profil GM-OS personnel. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
const out='output/gmos-studio/argyropee',file=path.resolve('docs/fiches/Argyropée/argyropee-fiche-interactive.html'),id='argyropee-fr';
fs.mkdirSync(`${out}/controles`,{recursive:true});
for(const [name,args] of [['theme',['scripts/theme-valider.mjs','argyropee']],['fiche',['scripts/fiche-valider.mjs',file]]]){
 const rapport=execFileSync(process.execPath,args,{encoding:'utf8'});fs.writeFileSync(`${out}/controles/validation-${name}.md`,rapport);
}
const html=fs.readFileSync(file,'utf8'),manifest=JSON.parse(html.match(/<script type="application\/json" id="character-sheet-template">(.*?)<\/script>/s)[1]);
const fields=manifest.template.pages.flatMap(p=>p.fields),keys=new Map(fields.map(f=>[f.key,f]));
for(const p of manifest.template.pages){
 for(const f of p.fields)assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=p.width&&f.y+f.h<=p.height,f.key);
 for(let i=0;i<p.fields.length;i++)for(let j=i+1;j<p.fields.length;j++){
  const a=p.fields[i],b=p.fields[j];assert.ok(!(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.1),`Chevauchement ${a.key}/${b.key}`);
 }
}
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1500},acceptDownloads:true});
const errors=[],network=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.setOffline(true);await context.route(/^https?:/,r=>{network.push(r.request().url());return r.abort();});
const page=await context.newPage(),field=k=>page.locator(`[data-key="${k}"]`),spot=(k,n)=>page.locator(`[data-key="${k}"][data-value="${n}"]`);
const zoom=async n=>{await page.locator('#zoom').fill(String(n));await page.locator('#zoom').dispatchEvent('change');};
const photo=async name=>{await page.locator('.page-wrap:visible').screenshot({path:`${out}/controles/${name}.png`});};
const exporter=async()=>{const[d]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);return JSON.parse(fs.readFileSync(await d.path(),'utf8'));};
const importer=async doc=>{await page.locator('#file').setInputFiles({name:'controle.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});await page.waitForTimeout(250);};
try{
 await page.goto(pathToFileURL(file).href);await field('identity.name').waitFor();
 assert.equal(await page.locator('.arg-field').count(),326);assert.equal(keys.size,128);
 await zoom(150);await photo('fiche-page-1-vierge');await page.locator('#zones').click();await photo('fiche-page-1-zones');
 await page.locator('#next').click();await photo('fiche-page-2-zones');await page.locator('#zones').click();await photo('fiche-page-2-vierge');
 await field('profile.description').fill('Description de contrôle.\nDonnées fictives.');await field('equipment.bag').fill('Corde\nCarnet\nEncrier');
 await page.locator('#prev').click();await field('identity.name').fill('Camille des Canaux');await field('tracks.health').fill('12');
 await field('careers.0.name').fill('Apothicaire');await field('weapons.0.name').fill('Rapière');await field('magic.0.name').fill('Texte de contrôle');
 await spot('skills.agility.level',5).click();assert.equal(await page.locator('[data-key="skills.agility.level"].active').count(),5);
 await spot('skills.agility.level',5).click();assert.equal(await page.locator('[data-key="skills.agility.level"].active').count(),0);
 await spot('skills.agility.level',3).click();
 const copie=await exporter();assert.equal(copie.data['skills.agility.level'],3);assert.equal(copie.data['equipment.bag'],'Corde\nCarnet\nEncrier');
 await page.reload();await field('identity.name').waitFor();assert.equal(await field('identity.name').inputValue(),'Camille des Canaux');assert.equal(await field('tracks.health').inputValue(),'12');
 page.once('dialog',d=>d.accept());await page.locator('#reset').click();assert.equal(await field('identity.name').inputValue(),'');await importer(copie);assert.equal(await field('identity.name').inputValue(),'Camille des Canaux');
 await importer({...copie,sheet:'autre'});assert.match(await page.locator('#status').innerText(),/Import refusé/);assert.equal(await field('identity.name').inputValue(),'Camille des Canaux');
 const temoin=Object.fromEntries([...keys].map(([k,f])=>[k,f.type==='number'?2:f.type==='hotspot'?3:'Exemple']));
 Object.assign(temoin,{'identity.name':'Camille des Canaux','identity.citizenship':'Gyropéenne','identity.gender':'F','identity.height':'1,68 m','identity.weight':'60 kg','careers.0.name':'Apothicaire','careers.0.rank':'Compagnon','weapons.0.name':'Rapière de duel','weapons.0.range':'Mêlée','weapons.0.damage':'1d8','weapons.0.ammo':'—','armour.0.name':'Cuir','skills.other.name':'Navigation','profile.description':'Personnage fictif destiné au contrôle visuel.\nToutes les valeurs sont saisies manuellement.','equipment.bag':'Corde\nCarnet\nEncrier','equipment.worn':'Rapière\nBourse'});
 page.once('dialog',d=>d.accept());await importer({...copie,data:temoin});await zoom(150);await photo('fiche-page-1-remplie');await page.locator('#next').click();await photo('fiche-page-2-remplie');
 for(const n of [20,400]){await zoom(n);assert.equal(Number(await page.locator('#zoom').inputValue()),n);}
 await page.keyboard.press('Control+0');const z=Number(await page.locator('#zoom').inputValue());await page.keyboard.press('Control++');assert.equal(Number(await page.locator('#zoom').inputValue()),z+10);await page.keyboard.press('Control+-');
 await page.locator('#viewport').hover();await page.keyboard.down('Control');await page.mouse.wheel(0,-120);await page.keyboard.up('Control');assert.equal(Number(await page.locator('#zoom').inputValue()),z+10);
 await page.pdf({path:`${out}/controles/impression.pdf`,preferCSSPageSize:true,printBackground:true});
 const tabletContext=await browser.newContext({viewport:{width:768,height:1024},isMobile:true,hasTouch:true});await tabletContext.setOffline(true);
 const tablet=await tabletContext.newPage();tablet.on('pageerror',e=>errors.push(e.message));await tablet.goto(pathToFileURL(file).href);await tablet.locator('#fit').tap();await tablet.locator('[data-key="skills.agility.level"][data-value="4"]').tap();assert.equal(await tablet.locator('[data-key="skills.agility.level"].active').count(),4);await tablet.screenshot({path:`${out}/controles/tablette-768.png`});await tabletContext.close();
 const moteur=await context.newPage();await moteur.goto(pathToFileURL(path.resolve('docs/fiches/Character_Sheet_Manager.html')).href);await moteur.locator('#templateFile').setInputFiles(file);await moteur.getByText('Argyropée — fiche de personnage',{exact:true}).waitFor();await moteur.locator(`[data-new="${id}"]`).click();await moteur.locator('#newCharacterName').fill('Contrôle Argyropée');await moteur.locator('#createCharacterBtn').click();await moteur.locator(`.sheet[data-template="${id}"]:visible`).waitFor();
 await moteur.locator('[data-key="identity.name"]').fill('Camille du moteur');await moteur.locator('[data-key="skills.agility.level"][data-value="4"]').click();
 await moteur.locator(`.sheet[data-template="${id}"]:visible`).screenshot({path:`${out}/controles/moteur-page-1.png`});
 const[d]=await Promise.all([moteur.waitForEvent('download'),moteur.locator('#exportCharBtn').click()]);const retour=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert.equal(retour.data['skills.agility.level'],4);
 page.once('dialog',d=>d.accept());await importer(retour);await page.locator('#prev').click();assert.equal(await field('identity.name').inputValue(),'Camille du moteur');
 page.once('dialog',d=>d.dismiss());await page.locator('#reset').click();assert.equal(await field('identity.name').inputValue(),'Camille du moteur');
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 const report={date:'2026-11-08',pages:2,zones:fields.length,cles:keys.size,pistes:33,hotspots:231,erreursJavaScript:errors,requetesReseau:network,geometriesSansChevauchement:true,saisieDeuxPages:true,pistesCumulativesEtZero:true,sauvegardeRechargement:true,importExportJSON:true,importIncompatibleRefuse:true,reinitialisationAvecConfirmation:true,zoom20a400:true,raccourcisEtMolette:true,tabletteTactile:true,importMoteurEtRetourJSON:true,htmlSHA256:createHash('sha256').update(html).digest('hex'),capturesExaminees:false,integration:'Fiche importable ; ni installation builtinTemplates ni correspondance de pilote.'};
 fs.writeFileSync(`${out}/controles/verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
