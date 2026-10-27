// Fiche HTML autonome : uniquement les deux pages du PDF fourni par David.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const ici=path.dirname(fileURLToPath(import.meta.url)),racine=path.resolve(ici,'../..');
const source=process.argv[2];
if(!source)throw Error('Fournir Fiche_Barbarian of Lemuria-vf.pdf en argument.');
const cible=process.argv[3]||path.join(racine,'docs/fiches/Barbarian of Lemuria/barbarian-of-lemuria-fiche-interactive.html');
const octets=fs.readFileSync(source),pdf=await getDocument({data:new Uint8Array(octets),useSystemFonts:true,wasmUrl:path.join(racine,'node_modules/pdfjs-dist/wasm')+'/',standardFontDataUrl:path.join(racine,'node_modules/pdfjs-dist/standard_fonts')+'/'}).promise;
assert.equal(pdf.numPages,2,'La recette correspond aux deux pages du PDF fourni.');
const pages=[],rendus=[];
for(let n=1;n<=2;n++){
 const p=await pdf.getPage(n),rotation=n===1?90:270,v=p.getViewport({scale:2,rotation});
 const c=createCanvas(Math.ceil(v.width),Math.ceil(v.height));await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
 rendus.push([c.width,c.height]);
 pages.push({id:`page-${n}`,label:n===1?'Personnage — identité, aptitudes et équipement':'Notes d’aventures et vade-mecum',width:v.width/2,height:v.height/2,orientation:'landscape',backgroundData:'data:image/png;base64,'+c.toBuffer('image/png').toString('base64'),fields:[]});
}
await pdf.destroy();

// Relevé visuel sur le rendu paysager 1684 × 1191 ; coordonnées du manifeste en unités PDF.
function champ(p,key,label,type,x,y,w,h,extra={}){
 const pg=pages[p-1],[rw,rh]=rendus[p-1];pg.fields.push({key,label,type,x:+(x*pg.width/rw).toFixed(3),y:+(y*pg.height/rh).toFixed(3),w:+(w*pg.width/rw).toFixed(3),h:+(h*pg.height/rh).toFixed(3),className:`bol-field bol-${type}`,...extra});
}
const texte=(p,k,l,x,y,w,h=32,extra={})=>champ(p,k,l,'text',x,y,w,h,extra);
const nombre=(p,k,l,x,y,w,h,classe='')=>champ(p,k,l,'number',x,y,w,h,{className:'bol-field bol-number '+classe});
const long=(p,k,l,x,y,w,h,extra={})=>champ(p,k,l,'textarea',x,y,w,h,extra);

texte(1,'identity.name','Nom',538,53,501,34);
texte(1,'identity.origin','Origine',538,111,704,30);
texte(1,'identity.languages','Langues',538,167,717,28);
nombre(1,'experience.current','Points d’expérience',1289,189,59,50);
champ(1,'identity.portrait','Portrait','portrait',1382,151,239,239,{fit:'contain'});
long(1,'identity.description','Description',1372,407,255,135,{className:'bol-field bol-textarea bol-small'});

for(const [key,label,x]of [['strength','Vigueur',204],['agility','Agilité',397],['mind','Esprit',590],['appeal','Aura',789]])nombre(1,`attributes.${key}`,label,x,326,65,58,'bol-attribute');
for(const [key,label,y]of [['initiative','Initiative',509],['melee','Mêlée',662],['ranged','Tir',807],['defense','Défense',953]])nombre(1,`combat.${key}`,label,102,y,52,47);

for(const [i,[y,w]]of [[590,206],[657,191],[725,191],[793,211],[859,260]].entries()){
 nombre(1,`careers.${i}.rank`,`Carrière ${i+1} — rang`,302,y+10,31,31,'bol-rank');
 texte(1,`careers.${i}.name`,`Carrière ${i+1} — nom`,355,y,w,45);
}
for(const [i,y]of [325,383,442,500].entries()){
 texte(1,`weapons.${i}.name`,`Arme ${i+1} — nom`,984,y,238,32);
 texte(1,`weapons.${i}.damage`,`Arme ${i+1} — dégâts`,1254,y,61,32,{className:'bol-field bol-text bol-small bol-center'});
}
for(const [i,[y,h]]of [[638,40],[696,40],[754,40],[812,40],[870,40],[922,20]].entries())texte(1,`equipment.${i}.description`,`Armure et équipement — ligne ${i+1}`,983,y,646,h,{className:'bol-field bol-text bol-small'});

// Les quartiers sont des nombres libres, sans graduation imprimée : pas de fausse piste.
for(const [key,label,x,y]of [['power','Points de pouvoir',629,594],['hero','Points d’héroïsme',815,594],['faith','Points de foi',619,784],['vitality','Points de vitalité',819,784]])nombre(1,`resources.${key}`,label,x,y,75,48,'bol-resource');
// Le motif imprimé remonte dans l'angle inférieur gauche : ne jamais écrire dessus.
long(1,'traits.advantages','Avantages',393,1008,552,128);
long(1,'traits.disadvantages','Désavantages',983,1008,646,128);
long(2,'adventure.notes','Notes d’aventures',65,143,1549,506);

const customCss=fs.readFileSync(path.join(ici,'fiche/champs.css'),'utf8');
const template={id:'barbarian-of-lemuria-fr',name:'Barbarian of Lemuria — fiche de personnage',system:'Barbarian of Lemuria',accent:'#333333',schemaVersion:2,customCss,pages};
const cles=new Set();for(const p of pages)for(const f of p.fields){assert(!cles.has(f.key),'Clé dupliquée '+f.key);cles.add(f.key);assert(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=p.width&&f.y+f.h<=p.height,'Géométrie '+f.key);}
for(const p of pages)for(let i=0;i<p.fields.length;i++)for(let j=i+1;j<p.fields.length;j++){const a=p.fields[i],b=p.fields[j];assert(!(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.05&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.05),`Superposition ${a.key}/${b.key}`);}
const manifeste={format:'character-sheet-studio-html',formatVersion:1,template};
const style=fs.readFileSync(path.join(ici,'fiche/interface.css'),'utf8'),runtime=fs.readFileSync(path.join(ici,'fiche/runtime.js'),'utf8');
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Barbarian of Lemuria — fiche interactive</title><style>${style}\n${customCss}</style></head><body>
<header class="toolbar"><strong>Barbarian of Lemuria</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer>
<input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>Remplir la fiche Barbarian of Lemuria</h2><p>Les deux pages du PDF sont conservées, remises dans leur sens de lecture en paysage. Zones révèle les emplacements de saisie sans modifier le fond.</p><p>Les quatre attributs, les quatre aptitudes de combat, les rangs des cinq lignes de carrières et les quartiers de ressources accueillent des nombres libres, y compris négatifs. Les dégâts acceptent des expressions de dés. Aucun calcul ni coût de règle n’est appliqué automatiquement.</p><p>Dans l’espace « Description ou portrait », le portrait est en haut et le texte en bas. Cliquez la zone du portrait pour choisir une image ; Maj+clic ou clic droit permet de la retirer après confirmation.</p><p>Le verso offre une grande zone de notes ; le vade-mecum imprimé reste intact. Zoom de 20 à 400 %, Ctrl+molette, Ctrl++, Ctrl+− ; Ctrl+0 ajuste la page. Les coordonnées des champs restent fixes.</p><p>La sauvegarde locale appartient à ce navigateur. Exporter JSON conserve les deux pages et le portrait ; Importer JSON remplace les valeurs après confirmation. Imprimer produit les deux pages A4 paysage. La fiche fonctionne hors ligne et porte son manifeste GM-OS ; son raccordement au pilote est une étape d’intégration séparée.</p><button id="close-help">Fermer</button></dialog>
<script id="character-sheet-template" type="application/json">${JSON.stringify(manifeste).replaceAll('<','\\u003c')}</script><script>${runtime}</script></body></html>`;
fs.mkdirSync(path.dirname(cible),{recursive:true});fs.writeFileSync(cible,html);
const bilan={source:path.basename(source),sha256:createHash('sha256').update(octets).digest('hex'),templateId:template.id,pages:pages.map(p=>({id:p.id,orientation:p.orientation,width:p.width,height:p.height,champs:p.fields.length})),zones:cles.size,clesAjoutees:[...cles],clesRetirees:[],calculs:0};
fs.mkdirSync(path.join(racine,'output/fiches/barbarian'),{recursive:true});fs.writeFileSync(path.join(racine,'output/fiches/barbarian/construction.json'),JSON.stringify(bilan,null,2));
console.log(JSON.stringify({cible,...bilan},null,2));
