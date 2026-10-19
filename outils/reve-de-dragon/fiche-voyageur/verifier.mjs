// Vérification du livrable en navigateur isolé, hors ligne ; ne lance pas GM-OS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const html=path.resolve(process.argv[2]||path.join(root,'docs/fiches/Rêve de Dragon/reve-de-dragon-livret-voyageur-interactif.html'));
const target=path.join(root,'scratch/reve-de-dragon-fiche');fs.mkdirSync(target,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1300,height:1800},acceptDownloads:true});
const page=await context.newPage(),errors=[],network=[];
page.on('pageerror',error=>errors.push(error.message));
await context.route(/^https?:/,route=>{network.push(route.request().url());return route.abort();});
const field=key=>page.locator(`[data-key="${key}"]`).first();
const track=(key,value)=>page.locator(`[data-key="${key}"][data-value="${value}"]`);
const active=key=>page.locator(`[data-key="${key}"].active`).count();
const go=number=>page.selectOption('#page',String(number-1));
const importJSON=async object=>{
 const payload={name:'verification.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(object))};
 await page.locator('#file').setInputFiles(payload);
 await page.waitForFunction(()=>/JSON importé|Import refusé/.test(document.getElementById('status').textContent));
};
try{
 await page.goto(pathToFileURL(html).href);
 await page.locator('.background').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
 const manifest=await page.locator('#character-sheet-template').evaluate(e=>JSON.parse(e.textContent));
 assert.equal(manifest.template.pages.length,5);
 assert.equal(await page.locator('.rdd-field').count(),manifest.template.pages.reduce((n,p)=>n+p.fields.length,0));
 assert.equal(await field('identity.name').inputValue(),'');
 const overlaps=[];
 for(const p of manifest.template.pages)for(const [i,a]of p.fields.entries())for(const b of p.fields.slice(i+1)){
  if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)overlaps.push([a.key,b.key]);
 }
 assert.deepEqual(overlaps,[],'Aucun champ ne doit intercepter la saisie d’un autre.');
 await field('identity.name').fill('Lior, voyageur du rêve');
 await field('attributes.strength.value').fill('13');
 await field('skills.craft.level').fill('-4');
 await field('skills.craft.experience').fill('7');
 await field('resources.constitutionThreshold').fill('3');
 for(const p of [2,3,4,5])assert.equal(await field(`headers.${p}.name`).inputValue(),'Lior, voyageur du rêve');
 assert.equal(await field('route.constitutionThreshold').inputValue(),'3');
 assert.equal(await field('route.constitutionThreshold').getAttribute('readonly'),'');
 await page.waitForTimeout(250);await page.reload();
 assert.equal(await field('identity.name').inputValue(),'Lior, voyageur du rêve');
 assert.equal(await field('skills.craft.level').inputValue(),'-4');
 await go(4);
 await track('tracks.fatigue',17).click();assert.equal(await active('tracks.fatigue'),17);
 await track('tracks.fatigue',2).click();assert.equal(await active('tracks.fatigue'),2);
 await track('tracks.fatigue',2).click();assert.equal(await active('tracks.fatigue'),0);
 await track('tracks.fatigue',12).click();
 await track('injuries.light.count',3).click();assert.equal(await active('injuries.light.count'),3);
 await track('injuries.light.count',3).click();assert.equal(await active('injuries.light.count'),0);
 await track('tracks.inebriation','0').click();assert.equal(await active('tracks.inebriation'),1);
 await track('tracks.inebriation','5').click();assert.equal(await active('tracks.inebriation'),1);
 await track('calendar.day','8').click();await track('calendar.day','21').click();assert.equal(await active('calendar.day'),1);
 await go(3);
 const zodiac=manifest.template.pages[2].fields.filter(f=>f.key==='astrology.referenceHour');
 await track('astrology.referenceHour',zodiac[0].value).click();await track('astrology.referenceHour',zodiac[5].value).click();
 assert.equal(await active('astrology.referenceHour'),1);
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;
 await download.saveAs(path.join(target,'aller-retour.json'));
 const saved=JSON.parse(fs.readFileSync(path.join(target,'aller-retour.json'),'utf8'));
 assert.equal(saved.templateId,manifest.template.id);assert.equal(saved.data['tracks.fatigue'],12);
 assert.equal(saved.data['tracks.inebriation'],'5');assert.equal(saved.data['calendar.day'],'21');
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('#reset').click();
 assert.equal(await field('identity.name').inputValue(),'Lior, voyageur du rêve');
 page.once('dialog',dialog=>dialog.accept());await page.locator('#reset').click();
 assert.equal(await field('identity.name').inputValue(),'');assert.equal(await field('headers.2.name').inputValue(),'');
 assert.equal(await active('tracks.fatigue'),0);
 saved.data['extension.exemple']={texte:'Donnée conservée'};
 await importJSON(saved);assert.equal(await field('identity.name').inputValue(),'Lior, voyageur du rêve');
 const storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('character-sheet:reve-de-dragon-voyageur-fr:v1')));
 assert.deepEqual(storage.data['extension.exemple'],{texte:'Donnée conservée'});
 await importJSON({templateId:manifest.template.id,data:{'attributes.strength.value':'invalide'}});
 assert.match(await page.locator('#status').textContent(),/Import refusé/);assert.equal(await field('attributes.strength.value').inputValue(),'13');
 await importJSON({templateId:'un-autre-modele',data:{}});
 assert.match(await page.locator('#status').textContent(),/autre modèle/);assert.equal(await field('identity.name').inputValue(),'Lior, voyageur du rêve');
 await page.locator('#zoom').fill('20');await page.locator('#zoom').dispatchEvent('change');assert.equal(await page.locator('#zoom').inputValue(),'20');
 await page.locator('#minus').click();assert.equal(await page.locator('#zoom').inputValue(),'20');
 await page.locator('#zoom').fill('400');await page.locator('#zoom').dispatchEvent('change');await page.locator('#plus').click();assert.equal(await page.locator('#zoom').inputValue(),'400');
 await page.keyboard.press('Control+-');assert.equal(await page.locator('#zoom').inputValue(),'390');
 await page.keyboard.press('Control+0');assert.ok(Number(await page.locator('#zoom').inputValue())<200);
 await page.locator('#help').click();assert.equal(await page.locator('#help-dialog').evaluate(d=>d.open),true);await page.locator('#close-help').click();
 await page.locator('#zones').click();assert.equal(await page.locator('#zones').getAttribute('aria-pressed'),'true');
 await page.locator('#zoom').fill('200');await page.locator('#zoom').dispatchEvent('change');
 // Remplissage de contrôle de chaque emplacement ; ces données n'entrent jamais dans le HTML livré.
 await page.evaluate(()=>{
  for(const input of document.querySelectorAll('.rdd-field:not(button):not([readonly])')){
   input.value=input.type==='number'?'12':input.tagName==='TEXTAREA'?'Première ligne de notes.\nDeuxième ligne de notes.':'Voyageur';
   input.dispatchEvent(new Event('input',{bubbles:true}));
  }
 });
 await field('identity.name').evaluate(e=>{e.value='Lior, voyageur du rêve';e.dispatchEvent(new Event('input',{bubbles:true}));});
 for(let n=1;n<=5;n++){
  await go(n);await page.locator('.page-wrap').nth(n-1).screenshot({path:path.join(target,`controle-zones-${n}.png`)});
 }
 await page.locator('#zones').click();
 for(let n=1;n<=5;n++){
  await go(n);await page.locator('.page-wrap').nth(n-1).screenshot({path:path.join(target,`controle-rempli-${n}.png`)});
 }
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.page-wrap:visible').count(),5);
 assert.equal(await page.locator('.toolbar').isVisible(),false);
 const printed=await page.pdf({path:path.join(target,'controle-impression.pdf'),preferCSSPageSize:true,printBackground:true});
 const pdf=await getDocument({data:new Uint8Array(printed)}).promise;
 assert.equal(pdf.numPages,5);const first=await pdf.getPage(1);assert.ok(Math.abs(first.view[2]-595)<1);assert.ok(Math.abs(first.view[3]-842)<1);await pdf.destroy();
 await page.emulateMedia({media:'screen'});await page.setViewportSize({width:360,height:800});await page.locator('#fit').click();
 const dimensions=await page.evaluate(()=>({page:innerWidth,body:document.body.scrollWidth,toolbar:document.querySelector('.toolbar').scrollWidth}));
 assert.ok(dimensions.body<=dimensions.page&&dimensions.toolbar<=dimensions.page,JSON.stringify(dimensions));
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 const report={succes:true,pages:5,champs:manifest.template.pages.reduce((n,p)=>n+p.fields.length,0),chevauchements:overlaps.length,erreursJavaScript:errors.length,requetesReseau:network.length,impression:'5 pages, 595 × 842 pt',controles:['saisie texte et nombres négatifs','copies du nom et du SC','sauvegarde et rechargement','jauges cumulatives et choix exclusifs','export et import JSON','conservation des extensions inconnues','rejet des imports invalides sans perte','réinitialisation confirmée et annulée','zoom 20–400 % et clavier','navigation, aide et Zones','saisie sur les 5 pages, captures remplies','impression des 5 pages','barre de commandes à 360 px']};
 fs.writeFileSync(path.join(target,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
