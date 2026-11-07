/** Recette autonome hors ligne de la fiche demandée à GM-OS Studio, sans profil de David. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
const fichier=path.resolve('docs/fiches/Torg/torg-eternity-fiche-pj-vierge-interactive.html'),sortie='output/fiches/torg',id='torg-eternity-fr';
const validation=execFileSync(process.execPath,['scripts/fiche-valider.mjs',fichier,'--json'],{encoding:'utf8'});
fs.writeFileSync(`${sortie}/validation.json`,validation);assert.equal(JSON.parse(validation)[0].accepte,true);
fs.writeFileSync(`${sortie}/validation.md`,execFileSync(process.execPath,['scripts/fiche-valider.mjs',fichier],{encoding:'utf8'}));
const navigateur=await chromium.launch({channel:'msedge',headless:true});
const erreurs=[],reseau=[];
const contexte=await navigateur.newContext({viewport:{width:1440,height:1120},acceptDownloads:true});
contexte.on('page',p=>p.on('pageerror',e=>erreurs.push(e.message)));await contexte.setOffline(true);
await contexte.route(/^https?:/,r=>{reseau.push(r.request().url());r.abort();});
const page=await contexte.newPage(),champ=k=>page.locator(`[data-key="${k}"]`),point=(k,v)=>page.locator(`[data-key="${k}"][data-value="${v}"]`);
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('character-sheet:torg-eternity-fr:v1')).data);
const pause=()=>page.waitForTimeout(250),zoom=async n=>{await page.locator('#zoom').fill(String(n));await page.locator('#zoom').dispatchEvent('change');};
const photo=async(nom,p=page,selecteur='.page-wrap')=>{await p.evaluate(()=>document.fonts.ready);await p.locator(selecteur).screenshot({path:`${sortie}/${nom}.png`});};
const exporter=async()=>{const[d]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);return JSON.parse(fs.readFileSync(await d.path(),'utf8'));};
const importer=async doc=>{await page.locator('#file').setInputFiles({name:'controle.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});await pause();};
try {
 await page.goto(pathToFileURL(fichier).href);await champ('identity.name').waitFor();
 const m=await page.evaluate(()=>JSON.parse(document.getElementById('character-sheet-template').textContent)),fields=m.template.pages[0].fields,definitions=new Map(fields.map(f=>[f.key,f]));
 assert.equal(m.template.id,id);assert.equal(m.template.pages.length,1);assert.equal(fields.length,152);assert.equal(definitions.size,145);
 assert.deepEqual(Buffer.from(m.template.pages[0].backgroundData.split(',')[1],'base64'),fs.readFileSync(`${sortie}/torg-eternity-fiche-pj-vierge.png`));
 assert.equal(await page.locator('.torg-field').count(),152);
 const saisiesInitiales=await page.locator('.torg-field').evaluateAll(els=>els.filter(el=>el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement).map(el=>el.value));
 assert.ok(saisiesInitiales.every(v=>v===''),'Tous les champs doivent être vides.');
 assert.ok(fields.every(f=>f.y+f.h<694),'Aucune zone dans la Table des Bonus.');
 await zoom(100);await photo('fiche-vierge');await page.locator('#zones').click();await photo('fiche-zones');await page.locator('#zones').click();
 await champ('identity.name').fill('Camille Roche');await champ('attributes.strength').fill('11');
 await champ('skills.other.0.name').fill('Survie');await champ('skills.other.0.attribute').fill('Esp');await champ('skills.other.0.adds').fill('2');
 await champ('profile.description').fill('Description de contrôle.\nPersonnage fictif.');await champ('tracks.wounds').fill('2');
 await point('states.stymied',4).click();assert.equal(await page.locator('[data-key="states.stymied"].active').count(),2);
 await point('states.stymied',4).click();assert.equal(await page.locator('[data-key="states.stymied"].active').count(),0);
 await point('states.vulnerable',2).click();
 for(const n of [1,3,6]){await point('tracks.wound_level',n).click();assert.equal(await page.locator('[data-key="tracks.wound_level"].active').count(),n);}
 await pause();assert.equal((await data())['tracks.wound_level'],6);assert.equal((await data())['tracks.wounds'],2);
 const copie=await exporter();assert.equal(copie.sheet,id);assert.equal(copie.data['identity.name'],'Camille Roche');
 await page.reload();await champ('identity.name').waitFor();assert.equal(await champ('identity.name').inputValue(),'Camille Roche');
 assert.equal(await champ('attributes.strength').inputValue(),'11');assert.equal(await page.locator('[data-key="tracks.wound_level"].active').count(),6);
 page.once('dialog',d=>d.accept());await page.locator('#reset').click();assert.equal(await champ('identity.name').inputValue(),'');await importer(copie);assert.equal(await champ('identity.name').inputValue(),'Camille Roche');
 const mauvais={...copie,sheet:'autre-modele'};await importer(mauvais);assert.equal(await champ('identity.name').inputValue(),'Camille Roche');assert.match(await page.locator('#status').innerText(),/Import refusé/);
 const temoin={};for(const[k,f]of definitions)temoin[k]=f.type==='number'?2:f.type==='hotspot'?f.value:'Exemple';
 Object.assign(temoin,{'identity.name':'Camille Roche','identity.race':'Humaine','identity.cosm':'Prime Terre','profile.description':'Personnage fictif pour vérifier la mise en page.\nToutes les valeurs de cet exemple sont saisies manuellement.','weapons.0.name':'Épée','weapons.0.damage':'Fo + 2','assets.0.name':'Atout de contrôle','assets.0.effect':'Texte libre.','tracks.wound_level':2,'states.stymied':2,'states.vulnerable':4});
 page.once('dialog',d=>d.accept());await importer({...copie,data:temoin});await zoom(100);await photo('fiche-remplie-controle');
 await page.locator('#zones').click();await photo('fiche-remplie-zones');await page.locator('#zones').click();
 for(const z of [20,400]){await zoom(z);assert.equal(Number(await page.locator('#zoom').inputValue()),z);}
 await page.keyboard.press('Control+0');const ajuste=Number(await page.locator('#zoom').inputValue());await page.keyboard.press('Control++');assert.equal(Number(await page.locator('#zoom').inputValue()),ajuste+10);await page.keyboard.press('Control+-');
 await page.locator('#viewport').hover();await page.keyboard.down('Control');await page.mouse.wheel(0,-120);await page.keyboard.up('Control');await pause();assert.equal(Number(await page.locator('#zoom').inputValue()),ajuste+10);
 await page.emulateMedia({media:'print'});const impression=await page.locator('.page-wrap').evaluate(el=>({largeur:el.getBoundingClientRect().width,hauteur:el.getBoundingClientRect().height}));assert.ok(Math.abs(impression.largeur-816)<1);assert.ok(Math.abs(impression.hauteur-1056)<1);assert.equal(await page.locator('.toolbar').isVisible(),false);await page.emulateMedia({media:'screen'});
 const tactile=await navigateur.newContext({viewport:{width:768,height:1024},isMobile:true,hasTouch:true,locale:'fr-FR'});await tactile.setOffline(true);const tablette=await tactile.newPage();tablette.on('pageerror',e=>erreurs.push(e.message));await tablette.goto(pathToFileURL(fichier).href);await tablette.locator('#fit').tap();await tablette.locator('[data-key="states.stymied"][data-value="2"]').tap();assert.equal(await tablette.locator('[data-key="states.stymied"].active').count(),1);await tablette.screenshot({path:`${sortie}/tablette-768.png`});await tactile.close();
 // Import du manifeste dans le vrai moteur, dans le stockage jetable du navigateur.
 const moteur=await contexte.newPage();await moteur.goto(pathToFileURL(path.resolve('docs/fiches/Character_Sheet_Manager.html')).href);await moteur.locator('#templateFile').setInputFiles(fichier);await moteur.getByText('Torg Eternity — fiche PJ vierge',{exact:true}).waitFor();await moteur.locator(`[data-new="${id}"]`).click();await moteur.locator('#newCharacterName').fill('Contrôle Torg');await moteur.locator('#createCharacterBtn').click();await moteur.locator(`.sheet[data-template="${id}"]:visible`).waitFor();
 await moteur.locator('[data-key="identity.name"]').fill('Camille du moteur');await moteur.locator('[data-key="weapons.0.damage"]').fill('Fo + 2');await moteur.locator('[data-key="states.stymied"][data-value="4"]').click();await photo('moteur-fiche',moteur,`.sheet[data-template="${id}"]:visible`);
 const[d]=await Promise.all([moteur.waitForEvent('download'),moteur.locator('#exportCharBtn').click()]);const retour=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert.equal(retour.data['states.stymied'],4);assert.equal(retour.data['weapons.0.damage'],'Fo + 2');page.once('dialog',dialog=>dialog.accept());await importer(retour);assert.equal(await champ('identity.name').inputValue(),'Camille du moteur');
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('#reset').click();assert.equal(await champ('identity.name').inputValue(),'Camille du moteur');page.once('dialog',dialog=>dialog.accept());await page.locator('#reset').click();assert.equal(await champ('identity.name').inputValue(),'');
 assert.deepEqual(erreurs,[]);assert.deepEqual(reseau,[]);
 const bilan={pages:1,zones:fields.length,cles:definitions.size,pistes:3,hotspots:10,champsInitialementVides:true,fondIdentiqueAuPDFVierge:true,aucunChampSurLaTableDesBonus:true,tableDesBonus:JSON.parse(fs.readFileSync(`${sortie}/controle-du-fond.json`,'utf8')).tableDesBonus,htmlSHA256:createHash('sha256').update(fs.readFileSync(fichier)).digest('hex'),erreursJavaScript:erreurs,requetesReseau:reseau,saisie:true,pistesCumulativesEtZero:true,rechargement:true,importExportJSON:true,importIncompatibleRefuseSansPerte:true,reinitialisationConfirmee:true,zoom20a400:true,raccourcisEtMolette:true,tabletteTactile:true,impression,importDansLeMoteurEtRetourJSON:true,integration:'Modèle importable, non installé dans builtinTemplates ; correspondance non écrite, conformément à l’atelier.',capturesExaminees:false};
 fs.writeFileSync(`${sortie}/verification.json`,JSON.stringify(bilan,null,2)+'\n');console.log(JSON.stringify(bilan,null,2));
}finally{await navigateur.close();}
