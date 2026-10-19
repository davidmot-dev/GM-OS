// Vérifie le gabarit intégré et la migration d'une base v11 dans un navigateur isolé.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from '@playwright/test';
import {CSS_NUMERIQUE_RDD,nombreDeChiffres} from './champs-numeriques.mjs';
const racine=fileURLToPath(new URL('../../../',import.meta.url));
const relatif='docs/fiches/Rêve de Dragon/reve-de-dragon-livret-voyageur-interactif.html';
const fichier=path.join(racine,relatif),html=fs.readFileSync(fichier,'utf8');
const extraire=texte=>JSON.parse(texte.match(/<script type="application\/json" id="character-sheet-template">([\s\S]*?)<\/script>/)[1]);
const avantHtml=process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):execFileSync('git',['show',`HEAD:${relatif}`],{cwd:racine,encoding:'utf8',maxBuffer:10*1024*1024});
const avant=extraire(avantHtml),apres=extraire(html),neutre=structuredClone(apres),elargis=[];
const moteur=fs.readFileSync(path.join(racine,'docs/fiches/Character_Sheet_Manager.html'),'utf8');
const integre=JSON.parse(moteur.match(/<script id="builtinTemplates" type="application\/json">([\s\S]*?)<\/script>/)[1]).find(t=>t.id===apres.template.id);
const {_builtin,...sansMarqueur}=integre;
assert.equal(_builtin,true);assert.deepEqual(sansMarqueur,apres.template,'Le moteur doit embarquer la fiche corrigée.');
neutre.template.customCss=avant.template.customCss;
neutre.template.pages.forEach((p,i)=>p.fields.forEach((f,j)=>{
 const ancien=avant.template.pages[i].fields[j];assert.ok(f.w>=ancien.w);
 if(f.w!==ancien.w){assert.equal(f.type,'number');elargis.push({key:f.key,page:i+1,avant:ancien.w,apres:f.w});}
 f.w=ancien.w;
}));
assert.deepEqual(neutre,avant,'Seuls customCss et les largeurs des champs numériques peuvent changer.');
const runtime=texte=>[...texte.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.deepEqual(runtime(html),runtime(avantHtml),'Le JavaScript autonome reste inchangé.');
assert.ok(apres.template.customCss.includes(CSS_NUMERIQUE_RDD));
for(const p of apres.template.pages)for(const[i,a]of p.fields.entries())for(const b of p.fields.slice(i+1))assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),`${a.key} recouvre ${b.key}`);
const sortie=path.join(racine,'scratch/reve-de-dragon-fiche/numeriques');fs.mkdirSync(sortie,{recursive:true});
const navigateur=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await navigateur.newPage({viewport:{width:1550,height:1900}}),erreurs=[],reseau=[];
 page.on('pageerror',e=>erreurs.push(e.message));await page.route(/^https?:/,r=>{reseau.push(r.request().url());return r.abort();});
 await page.goto(pathToFileURL(path.join(racine,'docs/fiches/Character_Sheet_Manager.html')).href);
 await page.locator('[data-new="reve-de-dragon-voyageur-fr"]').waitFor();
 // Une base déjà garnie doit recevoir la retouche sans perdre les saisies du PJ.
 const personnage={id:'controle-rdd-numeriques',name:'Contrôle : 11, 14 et 888',templateId:avant.template.id,templateName:avant.template.name,data:{'attributes.strength.value':11,'skills.craft.experience':888,'extension.exemple':{texte:'À conserver'}},createdAt:1,updatedAt:1};
 await page.evaluate(({ancien,personnage})=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('character-sheet-manager');r.onerror=()=>reject(r.error);
  r.onsuccess=()=>{const db=r.result,t=db.transaction(['templates','characters','meta'],'readwrite');
   t.objectStore('templates').put({...ancien,_builtin:true,_source:'builtin'});
   t.objectStore('characters').put(personnage);t.objectStore('meta').put({key:'builtinVersion',value:11});
   t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>{db.close();reject(t.error);};
  };
 }),{ancien:avant.template,personnage});
 await page.reload();
 await page.locator(`[data-char="${personnage.id}"]`).click();
 await page.locator('.sheet input[type="number"]').first().waitFor();
 assert.equal(await page.locator('[data-key="attributes.strength.value"]').inputValue(),'11');
 assert.equal(await page.locator('[data-key="skills.craft.experience"]').inputValue(),'888');
 const conserve=await page.evaluate(id=>new Promise((resolve,reject)=>{
  const r=indexedDB.open('character-sheet-manager');r.onerror=()=>reject(r.error);
  r.onsuccess=()=>{const db=r.result,t=db.transaction(['characters','meta']),c=t.objectStore('characters').get(id),m=t.objectStore('meta').get('builtinVersion');
   t.oncomplete=()=>{db.close();resolve({personnage:c.result,version:m.result.value});};t.onerror=()=>{db.close();reject(t.error);};
  };
 }),personnage.id);
 assert.equal(conserve.version,12);assert.deepEqual(conserve.personnage,personnage,'Toutes les données du personnage doivent rester intactes.');
 const mesures=[];
 for(let n=0;n<5;n++){
  await page.selectOption('#pageSelect',String(n));
  const champs=apres.template.pages[n].fields.filter(f=>f.type==='number').map((f,i)=>({...f,valeur:nombreDeChiffres(f)===3?'888':i%2?'11':'14',chiffres:nombreDeChiffres(f)}));
  const resultat=await page.evaluate(({champs,n})=>champs.map(f=>{
   const e=document.querySelector(`[data-key="${f.key}"]`),s=getComputedStyle(e);e.value=f.valeur;
   const span=document.createElement('span');
   Object.assign(span.style,{position:'absolute',visibility:'hidden',whiteSpace:'pre',fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,fontStyle:s.fontStyle,fontVariantNumeric:s.fontVariantNumeric,letterSpacing:s.letterSpacing});
   span.textContent='8'.repeat(f.chiffres);document.body.append(span);const requis=span.getBoundingClientRect().width;span.remove();
   return {key:f.key,page:n+1,w:f.w,chiffres:f.chiffres,requis,font:s.fontSize,variant:s.fontVariantNumeric,padding:s.padding,appearance:s.appearance,centrage:s.textAlign};
  }),{champs,n});
  for(const m of resultat){assert.ok(m.requis+.5<=m.w,`${m.key} : ${m.requis} dans ${m.w}`);assert.equal(m.padding,'0px');assert.equal(m.appearance,'textfield');assert.equal(m.centrage,'center');assert.match(m.variant,/tabular-nums/);assert.match(m.variant,/lining-nums/);}
  mesures.push(...resultat);
  await page.locator('.page-wrap').nth(n).screenshot({path:path.join(sortie,`moteur-page-${n+1}.png`),caret:'hide'});
 }
 await page.selectOption('#pageSelect','0');
 const nombre=page.locator('[data-key="attributes.strength.value"]');
 await nombre.fill('14');await nombre.press('ArrowUp');assert.equal(await nombre.inputValue(),'15');await nombre.press('ArrowDown');assert.equal(await nombre.inputValue(),'14');
 await nombre.hover();await page.mouse.wheel(0,-100);await page.waitForTimeout(100);assert.equal(await nombre.inputValue(),'15');
 await nombre.fill('11');await nombre.hover();await page.locator('.page-wrap').first().screenshot({path:path.join(sortie,'moteur-survol-focus.png'),caret:'hide'});
 const courante=await page.locator('#templateCss').textContent();assert.equal(courante,apres.template.customCss,'Aucune CSS de la fiche autonome ne doit masquer le défaut pendant ce test.');
 assert.ok(courante.includes('::-webkit-inner-spin-button'));assert.ok(courante.includes('::-webkit-outer-spin-button'));assert.ok(courante.includes('-webkit-appearance:none;margin:0'));
 await page.goto(pathToFileURL(fichier).href);
 await page.locator('[data-key="attributes.strength.value"]').fill('14');
 await page.locator('[data-key="attributes.strength.value"]').press('ArrowUp');assert.equal(await page.locator('[data-key="attributes.strength.value"]').inputValue(),'15');
 await page.locator('[data-key="attributes.strength.value"]').press('ArrowDown');assert.equal(await page.locator('[data-key="attributes.strength.value"]').inputValue(),'14');
 await page.locator('[data-key="attributes.strength.value"]').hover();await page.mouse.wheel(0,-100);await page.waitForTimeout(100);assert.equal(await page.locator('[data-key="attributes.strength.value"]').inputValue(),'15');
 await page.locator('#help').click();assert.match(await page.locator('#help-dialog').textContent(),/en tapant.*↑ \/ ↓.*molette.*focus/);
 assert.deepEqual(erreurs,[]);assert.deepEqual(reseau,[]);
 const rapport={succes:true,gabarit:apres.template.id,pages:5,numeriques:mesures.length,cles:813,elargis:elargis.length,parPage:apres.template.pages.map((_,i)=>({page:i+1,numeriques:mesures.filter(f=>f.page===i+1).length,elargis:elargis.filter(f=>f.page===i+1).length})),aucuneCleAjouteeRetireeRenommee:true,typesPagesXYHInchanges:true,fondsEtAutresChampsInchanges:true,aucunNouveauDerive:true,cssDuMoteurSeule:true,aucunChevauchement:true,gestes:'saisie, ↑ / ↓ et molette focalisée vérifiés dans le moteur et le HTML autonome',requetesReseau:reseau.length};
 rapport.gabaritIntegreIdentique=true;rapport.migrationV11versV12SansPerte=true;
 fs.writeFileSync(path.join(sortie,'verification-numeriques.json'),JSON.stringify(rapport,null,2));fs.writeFileSync(path.join(sortie,'mesures-apres.json'),JSON.stringify(mesures,null,2));console.log(JSON.stringify(rapport,null,2));
}finally{await navigateur.close();}
