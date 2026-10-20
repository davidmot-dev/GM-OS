// Contrôles dans Chrome jetable, hors ligne ; aucun profil ni campagne de David.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const cible=path.resolve('docs/fiches/Symbaroum/symbaroum-fiche-personnage-interactive.html');
const sortie='output/fiches/symbaroum';fs.mkdirSync(sortie,{recursive:true});
const rapport=execFileSync(process.execPath,['scripts/fiche-valider.mjs',cible,'--json'],{encoding:'utf8'});
fs.writeFileSync(sortie+'/validation.json',rapport);
assert.equal(JSON.parse(rapport)[0].accepte,true);
const navigateur=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const contexte=await navigateur.newContext({viewport:{width:1440,height:1080},deviceScaleFactor:2,acceptDownloads:true});
const erreurs=[],reseau=[];contexte.on('page',p=>p.on('pageerror',e=>erreurs.push(e.message)));
await contexte.route(/^https?:/,r=>{reseau.push(r.request().url());r.abort();});
const page=await contexte.newPage();
const champ=k=>page.locator(`[data-key="${k}"]`);
const point=(k,v)=>page.locator(`[data-key="${k}"][data-value="${v}"]`);
const sauvegarde=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('character-sheet:symbaroum-fr:v1')).data);
const pause=()=>page.waitForTimeout(240);
const zoom=async valeur=>{await page.locator('#zoom').fill(String(valeur));await page.locator('#zoom').dispatchEvent('change');};
async function exporter(){const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);return JSON.parse(fs.readFileSync(await d.path(),'utf8'));}
async function importer(doc){await page.locator('#file').setInputFiles({name:'fiche.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});await pause();}
try{
 await page.goto(pathToFileURL(cible).href);await page.locator('.sym-field').first().waitFor();
 const manifeste=await page.evaluate(()=>JSON.parse(document.getElementById('character-sheet-template').textContent));
 assert.equal(manifeste.template.id,'symbaroum-fr');
 assert.equal(manifeste.template.pages.length,2);assert.equal(await page.locator('.sym-field').count(),182);
 assert.equal(await page.locator('.sym-number').count(),19);
 await zoom(100);
 for(let i=0;i<2;i++){
  await page.locator('#page').selectOption(String(i));
  await page.locator('.page-wrap:not([hidden])').screenshot({path:`${sortie}/page-${i+1}-vierge.png`});
  await page.locator('#zones').click();
  assert.notEqual(await page.locator('.page-wrap:not([hidden]) .sym-field').first().evaluate(e=>getComputedStyle(e).outlineStyle),'none');
  await page.locator('.page-wrap:not([hidden])').screenshot({path:`${sortie}/page-${i+1}-zones.png`});
  await page.locator('#zones').click();
 }
 await page.locator('#page').selectOption('0');
 // Choix exclusifs, retour à vide, six ressources indépendantes, saisie numérique.
 await point('talents.0.rank','novice').click();await point('talents.0.rank','master').click();
 assert.equal(await page.locator('[data-key="talents.0.rank"].active').count(),1);
 await point('talents.0.rank','master').click();assert.equal(await page.locator('[data-key="talents.0.rank"].active').count(),0);
 await champ('attributes.accurate').fill('11');await champ('attributes.accurate').press('ArrowUp');assert.equal(await champ('attributes.accurate').inputValue(),'12');
 await champ('attributes.accurate').dispatchEvent('wheel',{deltaY:15});assert.equal(await champ('attributes.accurate').inputValue(),'11');
 await champ('attributes.accurate').blur();await champ('attributes.accurate').dispatchEvent('wheel',{deltaY:-15});assert.equal(await champ('attributes.accurate').inputValue(),'11');

 // Remplir chaque clé pour éprouver les rangées, l'import/export et les limites.
 const fixture={};
 for(const p of manifeste.template.pages)for(const f of p.fields){
  if(f.type==='portrait')continue;
  if(f.type==='number')fixture[f.key]=f.key==='experience.total'?125:f.key==='profile.age'?37:14;
  else if(f.type==='hotspot')fixture[f.key]='adept';
  else if(f.type==='textarea')fixture[f.key]='Notes de contrôle.\nDeuxième ligne.';
  else fixture[f.key]='Exemple';
 }
 Object.assign(fixture,{'identity.name':'Éléna des Brumes','identity.player':'David','identity.race':'Humaine','identity.career':'Éclaireuse','identity.shadow':'Gris bleuté et vert mousse','identity.quote':'Écoutons avant d’avancer.','health.current':8,'health.maximum':14,'health.pain_threshold':7,'corruption.current':2,'corruption.permanent':1,'corruption.threshold':5,'experience.unspent':27,'profile.height':'1,72 m','profile.weight':'65 kg','talents.0.name':'Sixième sens','talents.0.type':'Passif','weapons.0.name':'Épée longue','weapons.0.damage':'1D8+1','weapons.0.attribute':'Précision','weapons.0.qualities':'Précis','armors.0.protection':'1D6','possessions.money':'127 thalers'});
 await page.evaluate(values=>{
  for(const [key,value]of Object.entries(values)){
   const el=document.querySelector(`[data-key="${key}"]`);if(!el||el.tagName==='BUTTON')continue;
   el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));
  }
 },fixture);
 // Tous les rangs par vrais clics, à leur page visible.
 for(let i=0;i<12;i++)await point(`talents.${i}.rank`,'adept').click();
 await page.locator('#page').selectOption('1');
 const portrait=createCanvas(150,180),g=portrait.getContext('2d');g.fillStyle='#c3ccc4';g.fillRect(0,0,150,180);g.fillStyle='#424b35';g.beginPath();g.arc(75,55,27,0,Math.PI*2);g.fill();g.fillRect(38,92,74,70);
 const [choix]=await Promise.all([page.waitForEvent('filechooser'),champ('portrait').click()]);
 await choix.setFiles({name:'portrait-controle.png',mimeType:'image/png',buffer:portrait.toBuffer('image/png')});
 await page.locator('[data-key="portrait"] img').waitFor();await pause();
 const exporte=await exporter();assert.equal(exporte.sheet,'symbaroum-fr');
 for(const [k,v]of Object.entries(fixture))assert.equal(exporte.data[k],v,k);
 assert.equal(Object.keys(exporte.data).length,158);assert.ok(exporte.data.portrait.startsWith('data:image/jpeg;base64,'));
 await page.reload();await champ('identity.name').waitFor({state:'attached'});
 assert.equal(await champ('identity.name').inputValue(),fixture['identity.name']);
 await zoom(100);
 for(let i=0;i<2;i++){
  await page.locator('#page').selectOption(String(i));
  await page.locator('.page-wrap:not([hidden])').screenshot({path:`${sortie}/page-${i+1}-remplie.png`});
 }
 await importer({...exporte,data:{'identity.name':'Perdu','attributes.strong':'texte'}});
 assert.match(await page.locator('#status').textContent(),/Import refusé/);assert.deepEqual(await sauvegarde(),exporte.data);
 await importer({...exporte,sheet:'autre-modele'});assert.match(await page.locator('#status').textContent(),/autre modèle/);
 page.once('dialog',d=>d.dismiss());await page.locator('#reset').click();assert.deepEqual(await sauvegarde(),exporte.data);
 page.once('dialog',d=>d.accept());await page.locator('#reset').click();await pause();assert.deepEqual(await sauvegarde(),{});
 await importer({...exporte,data:{...exporte.data,'unknown.key':'Ignorée'}});assert.deepEqual(await sauvegarde(),exporte.data);
 await page.locator('#page').selectOption('1');page.once('dialog',d=>d.accept());await champ('portrait').click({modifiers:['Shift']});await pause();assert.equal((await sauvegarde()).portrait,'');
 page.once('dialog',d=>d.accept());await importer(exporte);assert.deepEqual(await sauvegarde(),exporte.data);
 await page.locator('#help').click();assert.equal(await page.locator('#help-dialog').evaluate(e=>e.open),true);await page.locator('#close-help').click();
 await zoom(10);assert.equal(await page.locator('#zoom').inputValue(),'20');await zoom(900);assert.equal(await page.locator('#zoom').inputValue(),'400');
 await page.keyboard.press('Control+-');assert.equal(await page.locator('#zoom').inputValue(),'390');await page.keyboard.press('Control+0');
 const avant=Number(await page.locator('#zoom').inputValue());await page.locator('#viewport').dispatchEvent('wheel',{ctrlKey:true,deltaY:-10});assert.equal(Number(await page.locator('#zoom').inputValue()),avant+10);
 await page.locator('#zones').click();await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.page-wrap:visible').count(),2);assert.equal(await page.locator('.toolbar').isVisible(),false);
 assert.equal(await champ('identity.name').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.equal(await champ('identity.name').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
 assert.notEqual(await point('talents.0.rank','adept').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 // Le PDF d'impression reste en mémoire : deux vraies pages A4, sans page vide.
 const impression=await page.pdf({preferCSSPageSize:true,printBackground:true});
 const pdf=await getDocument({data:new Uint8Array(impression)}).promise;
 assert.equal(pdf.numPages,2);
 for(let i=1;i<=2;i++){const pg=await pdf.getPage(i);assert.ok(Math.abs(pg.view[2]-595.276)<1);assert.ok(Math.abs(pg.view[3]-841.89)<1);}
 await pdf.destroy();await page.emulateMedia({media:'screen'});await page.locator('#zones').click();
 await page.setViewportSize({width:390,height:844});await page.locator('#fit').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:sortie+'/mobile-390.png'});

 // Import véritable dans le moteur existant, uniquement dans ce Chrome jetable.
 const moteur=await contexte.newPage();await moteur.goto(pathToFileURL(path.resolve('docs/fiches/Character_Sheet_Manager.html')).href);
 await moteur.locator('#templateFile').setInputFiles(cible);
 await moteur.getByText('Symbaroum — fiche de personnage',{exact:true}).waitFor();
 await moteur.locator('[data-new="symbaroum-fr"]').click();
 await moteur.locator('#newCharacterName').fill('Contrôle Symbaroum');
 await moteur.locator('#createCharacterBtn').click();
 await moteur.locator('.sheet[data-template="symbaroum-fr"]').first().waitFor();
 assert.equal(await moteur.locator('.sym-field').count(),182);
 await moteur.locator('[data-key="attributes.accurate"]').fill('14');
 await moteur.locator('[data-key="experience.total"]').fill('125');
 const engineCss=await moteur.locator('[data-key="attributes.accurate"]').evaluate(el=>{
  const rules=[...document.styleSheets].flatMap(s=>[...s.cssRules]);
  const spin=rules.find(r=>r.selectorText?.includes('.sym-number::-webkit-inner-spin-button'));
  const css=getComputedStyle(el),ctx=document.createElement('canvas').getContext('2d');ctx.font=css.font;
  return {padding:css.padding,appearance:css.appearance,spin:spin?.style.getPropertyValue('-webkit-appearance'),textWidth:ctx.measureText(el.value).width,width:parseFloat(el.style.width)};
 });
 assert.equal(engineCss.padding,'0px');assert.equal(engineCss.appearance,'textfield');assert.equal(engineCss.spin,'none');assert.ok(engineCss.textWidth<engineCss.width);
 await moteur.locator('[data-key="talents.0.rank"][data-value="master"]').click();
 assert.equal(await moteur.locator('[data-key="talents.0.rank"].active').count(),1);
 await moteur.locator('.sheet[data-template="symbaroum-fr"]').first().screenshot({path:sortie+'/moteur-page-1.png'});
 // L'export v2 du moteur revient dans le HTML autonome, avec les mêmes clés.
 const [download]=await Promise.all([moteur.waitForEvent('download'),moteur.locator('#exportCharBtn').click()]);
 const moteurJson=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 assert.equal(moteurJson.version,2);assert.equal(moteurJson.data['attributes.accurate'],14);
 page.once('dialog',d=>d.accept());await importer(moteurJson);
 assert.equal((await sauvegarde())['experience.total'],125);assert.equal((await sauvegarde())['talents.0.rank'],'master');
 assert.deepEqual(erreurs,[]);assert.deepEqual(reseau,[]);
 const bilan={pages:2,zones:182,cles:158,erreursJavaScript:erreurs,requetesReseau:reseau,impression:'2 pages A4',fonctions:'Saisie des 158 clés, rangs exclusifs, portrait, zoom 20–400 %, clavier et molette, sauvegarde/rechargement, import/export, rejet sans perte, réinitialisation confirmée, mobile, import dans le moteur jetable',integration:'Gabarit et correspondance non installés dans GM-OS'};
 fs.writeFileSync(sortie+'/verification.json',JSON.stringify(bilan,null,2)+'\n');
 console.log(JSON.stringify(bilan,null,2));
}finally{await navigateur.close();}
