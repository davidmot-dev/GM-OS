// Recette de l'HTML et import dans un moteur jetable : aucune donnée de David.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const cible=path.resolve('docs/fiches/RuneQuest/runequest-fiche-personnage-interactive.html');
const sortie='output/fiches/runequest';fs.mkdirSync(sortie,{recursive:true});
const rapport=execFileSync(process.execPath,['scripts/fiche-valider.mjs',cible,'--json'],{encoding:'utf8'});
fs.writeFileSync(sortie+'/validation.json',rapport);assert.equal(JSON.parse(rapport)[0].accepte,true);
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:1080},deviceScaleFactor:2,acceptDownloads:true});
const erreurs=[],reseau=[];ctx.on('page',p=>p.on('pageerror',e=>erreurs.push(e.message)));
await ctx.route(/^https?:/,r=>{reseau.push(r.request().url());r.abort();});
const page=await ctx.newPage(),id='runequest-fr';
const champ=k=>page.locator(`[data-key="${k}"]`),point=(k,v)=>page.locator(`[data-key="${k}"][data-value="${v}"]`);
const pause=()=>page.waitForTimeout(250);
const donnees=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('character-sheet:runequest-fr:v1')).data);
const zoom=async v=>{await page.locator('#zoom').fill(String(v));await page.locator('#zoom').dispatchEvent('change');};
const exporte=async()=>{const[d]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);return JSON.parse(fs.readFileSync(await d.path(),'utf8'));};
const importe=async doc=>{await page.locator('#file').setInputFiles({name:'controle.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});await pause();};
try{
 await page.goto(pathToFileURL(cible).href);await champ('identity.name').waitFor();
 const manifeste=await page.evaluate(()=>JSON.parse(document.getElementById('character-sheet-template').textContent));
 const fields=manifeste.template.pages.flatMap(p=>p.fields),definitions=new Map(fields.map(f=>[f.key,f]));
 assert.equal(manifeste.template.id,id);assert.equal(manifeste.template.pages.length,4);
 assert.equal(await page.locator('.rq-field').count(),fields.length);
 await zoom(100);
 for(let i=0;i<4;i++){
  await page.locator('#page').selectOption(String(i));
  await page.locator('.page-wrap:not([hidden])').screenshot({path:`${sortie}/page-${i+1}-vierge.png`});
  await page.locator('#zones').click();
  await page.locator('.page-wrap:not([hidden])').screenshot({path:`${sortie}/page-${i+1}-zones.png`});
  await page.locator('#zones').click();
 }
 await page.locator('#page').selectOption('0');
 await champ('identity.name').fill('Vasana');await champ('attributes.strength').fill('17');
 await champ('runes.fire.experience').check();assert.equal(await champ('runes.fire.experience').isChecked(),true);
 await point('health.current',12).click();await pause();
 assert.equal((await donnees())['health.current'],12);assert.equal(await page.locator('[data-key="health.current"].active').count(),13);
 await point('health.current',12).click();await pause();assert.equal((await donnees())['health.current'],0);assert.equal(await page.locator('[data-key="health.current"].active').count(),0);
 await point('magic.current',7).click();await point('cults.0.rune_points.current',5).click();
 await point('conditions.dead','dead').click();await pause();assert.equal((await donnees())['conditions.dead'],'dead');
 await point('conditions.dead','dead').click();await pause();assert.equal((await donnees())['conditions.dead'],'');
 await page.locator('#page').selectOption('2');
 await point('family.relatives.0.sex','male').click();await point('family.relatives.0.sex','female').click();
 assert.equal(await page.locator('[data-key="family.relatives.0.sex"].active').count(),1);
 await point('companion.health.current',13).click();await pause();assert.equal((await donnees())['companion.health.current'],13);

 const fixture={};
 for(const[k,f]of definitions){
  if(f.type==='number')fixture[k]=17;
  else if(f.type==='checkbox')fixture[k]=true;
  else if(f.type==='hotspot')fixture[k]=f.value;
  else if(f.type==='textarea')fixture[k]='Notes de voyage.\nRetour au clan.';
  else fixture[k]='Alda';
 }
 Object.assign(fixture,{'identity.name':'Vasana','identity.player':'David','identity.origin':'Sartar','identity.tribe':'Colymar','identity.clan':'Varmandi','identity.occupation':'Guerrière','identity.age':21,'identity.birth_year':'1604','identity.gender':'F','identity.ransom':500,'identity.reputation':12,'runes.air.level':90,'runes.earth.level':60,'runes.fertility.level':75,'weapons.melee.0.name':'Épée large','weapons.melee.0.chance':85,'weapons.melee.0.damage':'1D8+1','weapons.melee.0.encumbrance':1,'weapons.melee.0.durability':12,'weapons.melee.0.strike_rank':5,'wealth.lunars':125,'family.relatives.0.name':'Aldar','family.spouses.0.marriage_type':'Libre','companion.name':'Éclair','companion.type':'Cheval','companion.damage_bonus':'1D6','history.grandparent.1582.events':'Bataille du Grizzly','history.grandparent.1582.results':'Survie','history.parent.1610.events':'Voyage','history.adventurer.1625.events':'Départ de Sartar','magic.spirit.0':'Soins 2'});
 page.once('dialog',d=>d.accept());await importe({format:'interactive-character-sheet',version:1,sheet:id,data:fixture});
 const json=await exporte();assert.deepEqual(json.data,fixture);assert.equal(Object.keys(json.data).length,definitions.size);
 await page.reload();await champ('identity.name').waitFor();assert.equal(await champ('identity.name').inputValue(),'Vasana');
 await zoom(100);
 for(let i=0;i<4;i++){
  await page.locator('#page').selectOption(String(i));
  await page.locator('.page-wrap:not([hidden])').screenshot({path:`${sortie}/page-${i+1}-remplie.png`});
 }
 const garde=await donnees();
 await importe({...json,data:{'attributes.strength':'texte'}});assert.match(await page.locator('#status').textContent(),/Import refusé/);assert.deepEqual(await donnees(),garde);
 await importe({...json,sheet:'autre-modele'});assert.match(await page.locator('#status').textContent(),/autre modèle/);assert.deepEqual(await donnees(),garde);
 await importe({...json,data:{'family.father.dead':'oui'}});assert.match(await page.locator('#status').textContent(),/Import refusé/);
 await importe({...json,data:{'health.current':99}});assert.match(await page.locator('#status').textContent(),/Import refusé/);
 page.once('dialog',d=>d.dismiss());await page.locator('#reset').click();assert.deepEqual(await donnees(),garde);
 page.once('dialog',d=>d.accept());await page.locator('#reset').click();await pause();assert.deepEqual(await donnees(),{});
 await importe(json);assert.deepEqual(await donnees(),garde);
 await page.locator('#help').click();assert.equal(await page.locator('#help-dialog').evaluate(e=>e.open),true);await page.locator('#close-help').click();
 await zoom(5);assert.equal(await page.locator('#zoom').inputValue(),'20');await zoom(500);assert.equal(await page.locator('#zoom').inputValue(),'400');
 await page.keyboard.press('Control+-');assert.equal(await page.locator('#zoom').inputValue(),'390');await page.keyboard.press('Control+0');
 const avant=Number(await page.locator('#zoom').inputValue());await page.locator('#viewport').dispatchEvent('wheel',{ctrlKey:true,deltaY:-20});assert.equal(Number(await page.locator('#zoom').inputValue()),avant+10);
 await page.locator('#zones').click();await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.page-wrap:visible').count(),4);assert.equal(await page.locator('.toolbar').isVisible(),false);
 assert.equal(await champ('identity.name').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.equal(await champ('identity.name').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
 const impression=await page.pdf({preferCSSPageSize:true,printBackground:true});
 const pdf=await getDocument({data:new Uint8Array(impression)}).promise;assert.equal(pdf.numPages,4);
 const dimensions=[];for(let i=1;i<=4;i++){const p=await pdf.getPage(i);dimensions.push(p.view);assert.ok(Math.abs(p.view[2]-(i===4?612:622.346))<1);assert.ok(Math.abs(p.view[3]-(i===4?792:802.346))<1);}await pdf.destroy();
 await page.emulateMedia({media:'screen'});await page.locator('#zones').click();await page.locator('#page').selectOption('0');
 await page.setViewportSize({width:390,height:844});await page.locator('#fit').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:sortie+'/mobile-390.png'});

 // Ce moteur est ouvert dans le contexte neuf ci-dessus. Ni sa bibliothèque réelle,
 // ni les données de l'application Electron ne sont consultées ou modifiées.
 const moteur=await ctx.newPage();await moteur.goto(pathToFileURL(path.resolve('docs/fiches/Character_Sheet_Manager.html')).href);
 await moteur.locator('#templateFile').setInputFiles(cible);await moteur.getByText('RuneQuest — fiche de personnage',{exact:true}).waitFor();
 await moteur.locator('[data-new="runequest-fr"]').click();await moteur.locator('#newCharacterName').fill('Contrôle RuneQuest');await moteur.locator('#createCharacterBtn').click();
 await moteur.locator('.sheet[data-template="runequest-fr"]').first().waitFor();
 assert.equal(await moteur.locator('.rq-field').count(),fields.length);
 await moteur.locator('[data-key="identity.name"]').fill('Vasana du moteur');
 await moteur.locator('[data-key="attributes.strength"]').fill('18');
 await moteur.locator('[data-key="health.current"][data-value="11"]').click();
 assert.equal(await moteur.locator('[data-key="health.current"].active').count(),12);
 await moteur.locator('.sheet[data-template="runequest-fr"]').first().screenshot({path:sortie+'/moteur-page-1.png'});
 const[d]=await Promise.all([moteur.waitForEvent('download'),moteur.locator('#exportCharBtn').click()]);
 const mj=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert.equal(mj.data['attributes.strength'],18);assert.equal(mj.data['health.current'],11);
 page.once('dialog',dlg=>dlg.accept());await importe(mj);assert.equal(await champ('identity.name').inputValue(),'Vasana du moteur');
 assert.deepEqual(erreurs,[]);assert.deepEqual(reseau,[]);
 const bilan={pages:4,zones:fields.length,cles:definitions.size,erreursJavaScript:erreurs,requetesReseau:reseau,impression:dimensions,fonctions:`Saisie et sauvegarde des ${definitions.size} clés, jauges cumulatives, choix M/F exclusifs, états indépendants, import/export et rechargement, rejets sans perte, reset confirmé, zoom/clavier/molette, mobile, impression, import dans le moteur jetable et retour JSON v2`,integration:'Modèle non installé dans builtinTemplates ; correspondance non écrite, conformément à l’atelier.'};
 fs.writeFileSync(sortie+'/verification.json',JSON.stringify(bilan,null,2)+'\n');console.log(JSON.stringify(bilan,null,2));
}finally{await browser.close();}
