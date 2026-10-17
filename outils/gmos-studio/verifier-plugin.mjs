import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import {unzipSync} from 'fflate';
import {chromium} from '@playwright/test';
import {createCanvas,loadImage} from '@napi-rs/canvas';

const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(root,'../..');
const base=path.join(root,'plugin/gmos-studio'),dist=path.join(root,'dist');
const registry=JSON.parse(await fs.readFile(path.join(root,'ateliers.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(base,'plugin.json'),'utf8'));
const checks=[],sha=b=>createHash('sha256').update(b).digest('hex');
async function test(name,fn){await fn();checks.push(name);console.log('OK '+name);}
async function paths(dir,prefix=''){const list=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){assert.equal(e.isSymbolicLink(),false);if(e.isDirectory())list.push(...await paths(path.join(dir,e.name),prefix+e.name+'/'));else list.push(prefix+e.name);}return list;}
const all=await paths(base),skillPaths=all.filter(p=>/^skills\/[^/]+\/SKILL\.md$/.test(p));
const textOf=async p=>fs.readFile(path.join(base,p),'utf8');
const bodyOf=t=>t.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'');
const textContent=t=>t.replace(/\r\n/g,'\n');
await test('Un manifeste portable, sept skills uniques et six ateliers numérotés',async()=>{
 assert.equal(manifest.name,'gmos-studio');assert.equal(manifest.$schema,'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');assert.equal(skillPaths.length,7);assert.equal(registry.length,6);assert.deepEqual(registry.map(a=>a.numero),[1,2,3,4,5,6]);
 const names=[];for(const p of skillPaths){const t=await textOf(p);const metadata=YAML.parse(t.match(/^---\n([\s\S]*?)\n---/)[1]);assert.ok(metadata.description);assert.equal(metadata.name,p.split('/')[1]);assert.ok(Buffer.byteLength(t)<1024*1024);names.push(metadata.name);}assert.equal(new Set(names).size,7);
});
await test('Métadonnées YAML et présentation compatibles',async()=>{
 assert.ok(manifest.extensions['com.openai'].interface.shortDescription.length<=30);
 for(const p of all.filter(p=>p.endsWith('agents/openai.yaml'))){const a=YAML.parse(await textOf(p));assert.ok(a.interface.display_name);assert.ok(a.interface.short_description);assert.equal(a.policy.allow_implicit_invocation,true);assert.equal(typeof a.interface.default_prompt,'string');}
 assert.ok(!manifest.mcpServers&&!manifest.apps&&!manifest.extensions['com.openai'].apps);
});
await test('Les six méthodes originales sont conservées intégralement',async()=>{
 for(const a of registry){const source=await fs.readFile(path.resolve(root,a.source,'SKILL.md'),'utf8');const bundled=await textOf('skills/'+a.id+'/SKILL.md');assert.ok(textContent(bundled).endsWith(textContent(bodyOf(source))),a.id);}
});
await test('Tous les liens Markdown locaux restent dans le paquet et existent',async()=>{
 let links=0;for(const p of all.filter(p=>p.endsWith('.md'))){for(const m of (await textOf(p)).matchAll(/\]\(([^)]+)\)/g)){
  const rel=m[1].replace(/^<|>$/g,'').split('#')[0];if(!rel||/^[a-z]+:/i.test(rel))continue;
  const file=path.resolve(base,path.dirname(p),decodeURIComponent(rel));assert.ok(file.startsWith(base+path.sep));await fs.access(file);links++;
 }}assert.ok(links>35);
});
await test('Menu, accès direct et parcours nouveau jeu présents sans imposer les six travaux',async()=>{
 const a=await textOf('skills/accueil/SKILL.md');for(const r of registry)assert.ok(a.includes('../'+r.id+'/SKILL.md'));
 for(const phrase of ['Que veux-tu préparer','Préparer un nouveau jeu','commence directement','Ce choix n’autorise pas d’emblée six productions','sans appliquer simultanément les six méthodes','une réponse applicable au document courant'])assert.ok(a.includes(phrase),phrase);
});
await test('Contrats actuels et socle SDK repris sans altération',async()=>{
 for(const id of ['theme','fiche'])for(const file of ['Cahier-des-charges-theme-de-jeu.md','Cahier-des-charges-fiche-de-personnage.md'])assert.equal(textContent(await fs.readFile(path.join(base,'skills',id,'references',file),'utf8')),textContent(await fs.readFile(path.join(repo,'documentation/Architecture',file),'utf8')));
 assert.equal(textContent(await fs.readFile(path.join(base,'skills/theme/references/rpg-core.css'),'utf8')),textContent(await fs.readFile(path.join(repo,'docs/ui/rpg-theme-sdk/rpg-core.css'),'utf8')));
});
await test('Index de connaissances résolus et noms uniques',async()=>{
 for(const p of all.filter(p=>p.endsWith('lookup/knowledge-index.json'))){const index=JSON.parse(await textOf(p));assert.equal(new Set(index.files.map(f=>f.name)).size,index.files.length);for(const f of index.files)await fs.access(path.resolve(base,path.dirname(p),'..',f.path));}
});
await test('Deux PDF de référence véritables, HTML, scripts et recettes inclus',async()=>{
 const pdfs=all.filter(p=>p.endsWith('.pdf'));assert.equal(pdfs.length,2);for(const p of pdfs)assert.equal((await fs.readFile(path.join(base,p))).subarray(0,5).toString(),'%PDF-');
 for(const p of ['skills/fiche/references/HTML_MANIFEST_SPEC.md','skills/fiche/references/alien_character_sheet_v2.html','skills/fiche/references/cthulhu_7_fiche_classique_interactive.html','skills/cartes/scripts/cards.py','skills/cartes/references/recipe.md','skills/theme/references/blade-runner.css'])await fs.access(path.join(base,p));
 assert.equal(sha(await fs.readFile(path.join(base,'skills/cartes/scripts/cards.py'))),sha(await fs.readFile(path.join(root,'sources/cartes/scripts/cards.py'))));
});
await test('Empreintes du manifeste de provenance cohérentes',async()=>{
 const index=JSON.parse(await textOf('sources.json'));assert.equal(index.sources.length,6);for(const a of index.sources){for(const f of a.files)assert.equal(sha(await fs.readFile(path.join(base,'skills',a.atelier,f.path))),f.sha256);}
});
await test('Archive privée à racine unique, sans perte ni fichier supplémentaire',async()=>{
 const archive=unzipSync(await fs.readFile(path.join(dist,'gmos-studio-0.1.0.zip')));assert.equal(Object.keys(archive).length,all.length);
 for(const p of all)assert.equal(sha(archive['gmos-studio/'+p]),sha(await fs.readFile(path.join(base,p))));
});
await test('Vérificateur STYLE / AVOID utilisable depuis le paquet fusionné',async()=>{
 const {validerIdentite}=await import(pathToFileURL(path.join(base,'skills/identite/scripts/valider-identite.mjs')));
 assert.equal(validerIdentite('STYLE: muted palette, ink texture\nAVOID: glossy rendering').valid,true);
 assert.equal(validerIdentite('STYLE: '+Array(61).fill('grain').join(' ')+'\nAVOID: gloss').valid,false);
 assert.equal(validerIdentite('STYLE: grain\nAVOID: '+Array(16).fill('gloss').join(' ')).valid,false);
});
await test('Outil bannière autonome : export réel WebP 2400 × 600 sous 500 Ko',async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({offline:true,viewport:{width:1280,height:900}}),page=await context.newPage();const errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  const c=createCanvas(2400,1000);c.getContext('2d').fillRect(0,0,2400,1000);
  await page.goto(pathToFileURL(path.join(base,'skills/banniere/tools/preparer-banniere.html')).href);
  await page.locator('#source').setInputFiles({name:'controle.png',mimeType:'image/png',buffer:c.toBuffer('image/png')});
  await page.locator('#export').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('#export').disabled);await page.locator('#export').click();await page.locator('#download').waitFor({state:'visible'});
  const data=await page.evaluate(async()=>{const b=await(await fetch(document.querySelector('#download').href)).blob();return {type:b.type,size:b.size,bytes:[...new Uint8Array(await b.arrayBuffer())]};});
  assert.equal(data.type,'image/webp');assert.ok(data.size<=500000);const image=await loadImage(Buffer.from(data.bytes));assert.equal(image.width,2400);assert.equal(image.height,600);assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 }finally{await browser.close();}
});
const report={checks,limitations:['Tests structurels et outils locaux, sans conversation de bout en bout avec le modèle.','Script cartes conservé octet pour octet ; non exécuté ici (Python non accessible dans cet environnement).','Aucune génération artistique, extraction d’ouvrage ou fiche réelle produite pour vérifier cette fusion.']};
await fs.writeFile(path.join(dist,'verification-plugin.json'),JSON.stringify(report,null,2)+'\n');
console.log(checks.length+' contrôles réussis.');
