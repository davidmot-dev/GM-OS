// GM-OS Studio : recette autonome de la fiche de personnage Symbaroum.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const ici=path.dirname(fileURLToPath(import.meta.url));
const racine=path.resolve(ici,'../..');
const source=process.argv[2];
if(!source)throw Error('Fournir Symbaroum - Fiche de Perso.pdf en argument.');
const cible=process.argv[3]||path.join(racine,'docs/fiches/Symbaroum/symbaroum-fiche-personnage-interactive.html');
const octets=fs.readFileSync(source);
const pdf=await getDocument({data:new Uint8Array(octets)}).promise;
assert.equal(pdf.numPages,2,'Cette recette correspond aux deux pages du PDF fourni.');
const pages=[],rendus=[];
for(let n=1;n<=2;n++){
 const p=await pdf.getPage(n),v=p.getViewport({scale:2}),canvas=createCanvas(Math.ceil(v.width),Math.ceil(v.height));
 await p.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise;
 rendus.push([canvas.width,canvas.height]);
 pages.push({id:`page-${n}`,label:n===1?'Identité, attributs et talents':'Portrait, compagnons et équipement',width:p.view[2]-p.view[0],height:p.view[3]-p.view[1],orientation:'portrait',backgroundData:'data:image/png;base64,'+canvas.toBuffer('image/png').toString('base64'),fields:[]});
}
await pdf.destroy();
// Coordonnées relevées sur les rendus 1191 × 1684 ; conversion aux unités du PDF.
const champ=(p,key,label,type,x,y,w,h,extra={})=>{
 const pg=pages[p-1],[rw,rh]=rendus[p-1];
 pg.fields.push({key,label,type,x:+(x*pg.width/rw).toFixed(3),y:+(y*pg.height/rh).toFixed(3),w:+(w*pg.width/rw).toFixed(3),h:+(h*pg.height/rh).toFixed(3),className:`sym-field sym-${type}`,...extra});
};
const texte=(p,k,l,x,y,w,h=24,extra={})=>champ(p,k,l,'text',x,y,w,h,extra);
const long=(p,k,l,x,y,w,h,extra={})=>champ(p,k,l,'textarea',x,y,w,h,extra);
const nombre=(p,k,l,x,y,w,h=25,extra={})=>champ(p,k,l,'number',x,y,w,h,extra);

// Page 1 : les six triangles des losanges restent des valeurs indépendantes.
for(const [key,label,x,y,w]of[
 ['player','Joueur',72,91,370],['name','Nom',72,138,330],['race','Race',72,184,340],['career','Carrière',72,232,390]
])texte(1,`identity.${key}`,label,x,y,w,23);
long(1,'identity.shadow','Ombre',800,95,305,57);
texte(1,'identity.quote','Phrase type',778,232,327,23);
nombre(1,'experience.total','Expérience',787,188,153,20);
nombre(1,'experience.unspent','Expérience non dépensée',991,188,114,20);
for(const [key,label,x,y,w,h]of[
 ['health.current','Endurance',464,107,66,36],
 ['health.maximum','Endurance maximale',471,195,52,30],
 ['health.pain_threshold','Résistance à la douleur',560,108,52,30],
 ['corruption.current','Corruption',647,107,66,36],
 ['corruption.permanent','Corruption permanente',654,195,52,30],
 ['corruption.threshold','Seuil de Corruption',554,204,64,36]
])nombre(1,key,label,x,y,w,h,{className:'sym-field sym-number sym-resource'});

for(const [i,[key,label]]of [
 ['accurate','Précision'],['cunning','Astuce'],['discreet','Discrétion'],['persuasive','Persuasion'],
 ['quick','Agilité'],['resolute','Volonté'],['strong','Force'],['vigilant','Vigilance']
].entries())nombre(1,`attributes.${key}`,label,81+i*130.7,304,99,65,{className:'sym-field sym-number sym-attribute'});

// Douze emplacements : nom, effet, type et un choix exclusif N / A / M.
const rows=[{top:458,type:616,rank:625},{top:652,type:799,rank:807},{top:835,type:983,rank:992},{top:1019,type:1168,rank:1177}];
const cols=[{left:69,name:113,width:328,rank:358},{left:419,name:463,width:322,rank:704},{left:769,name:813,width:340,rank:1058}];
for(let r=0;r<4;r++)for(let c=0;c<3;c++){
 const n=r*3+c,row=rows[r],col=cols[c],prefix=`talents.${n}`;
 texte(1,`${prefix}.name`,`Talent ou pouvoir ${n+1} — nom`,col.name,row.top+12,col.width-44,24);
 long(1,`${prefix}.effect`,`Talent ou pouvoir ${n+1} — effet`,col.left,row.top+69,col.width,Math.min(82,row.type-row.top-75));
 texte(1,`${prefix}.type`,`Talent ou pouvoir ${n+1} — type`,col.name,row.type,col.rank-col.name-22,26,{className:'sym-field sym-text sym-small'});
 for(const [j,[value,label]]of [['novice','Novice'],['adept','Adepte'],['master','Maître']].entries()){
  champ(1,`${prefix}.rank`,`Talent ou pouvoir ${n+1} — ${label}`,'hotspot',col.rank+j*19.1-7,row.rank-7.5,14,15,{value,className:'sym-field sym-hotspot sym-rank'});
 }
}

for(let i=0;i<4;i++){
 const y=[1316,1369,1424,1479][i];
 for(const [key,label,x,w]of [['name','Arme',70,299],['damage','Dégâts',382,96],['qualities','Qualité',500,169],['attribute','Attribut',679,70]]){
  texte(1,`weapons.${i}.${key}`,`Arme ${i+1} — ${label}`,x,y,w,18,{className:'sym-field sym-text sym-small'+(['damage','attribute'].includes(key)?' sym-center':'')});
 }
}
for(let i=0;i<2;i++){
 const x=i===0?772:957,w=i===0?150:156;
 texte(1,`armors.${i}.name`,`Protection ${i+1} — armure`,x,1306,w,28);
 texte(1,`armors.${i}.protection`,`Protection ${i+1} — protection`,x,1367,w,28);
 long(1,`armors.${i}.qualities`,`Protection ${i+1} — qualité`,x,1426,w,40,{className:'sym-field sym-textarea sym-small'});
 nombre(1,`armors.${i}.defense`,`Protection ${i+1} — défense`,i===0?798:977,1486,101,65,{className:'sym-field sym-number sym-attribute'});
}

// Page 2 : portrait dans son cadre ; aucune image ne recouvre les filets.
nombre(2,'profile.age','Âge',87,92,105,22);
texte(2,'profile.height','Taille',221,92,111,22);
texte(2,'profile.weight','Poids',347,92,83,22);
long(2,'profile.appearance','Apparence',87,145,342,119);
long(2,'profile.history','Historique',87,300,342,144);
long(2,'profile.goals','Objectifs',87,482,342,91);
champ(2,'portrait','Portrait du personnage','portrait',446,78,316,485,{fit:'contain'});
for(let i=0;i<5;i++){
 for(const [key,label,x,w]of [['name','Nom',88,199],['race','Race',297,147],['career','Carrière',459,138],['player','Joueur',608,155]]){
  texte(2,`companions.${i}.${key}`,`Compagnon ${i+1} — ${label}`,x,[670,728,786,843,901][i],w,25);
 }
}
texte(2,'group.name','Nom du groupe',88,955,674,27);
long(2,'group.goals','Objectifs du groupe',88,1017,674,24);
for(let i=0;i<4;i++){
 const y=[1165,1251,1370,1491][i],h=[45,75,75,91][i];
 texte(2,`artifacts.${i}.name`,`Artéfact ${i+1} — nom`,88,y,180,25);
 long(2,`artifacts.${i}.powers`,`Artéfact ${i+1} — pouvoirs`,282,y,305,h);
 texte(2,`artifacts.${i}.corruption`,`Artéfact ${i+1} — Corruption`,608,y,145,25);
}
for(let i=0;i<21;i++)texte(2,`equipment.${i}.name`,`Équipement — ligne ${i+1}`,792,137+i*58,329,35);
long(2,'possessions.money','Argent',792,1373,329,74);
long(2,'possessions.other','Autres biens',792,1494,329,87);

const customCss=fs.readFileSync(path.join(ici,'fiche/champs.css'),'utf8');
const template={id:'symbaroum-fr',name:'Symbaroum — fiche de personnage',system:'Symbaroum',accent:'#71612e',schemaVersion:2,customCss,pages};
const cles=new Map();
for(const p of pages)for(const f of p.fields){
 assert.ok(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=p.width&&f.y+f.h<=p.height,JSON.stringify(f));
 if(cles.has(f.key))assert.equal(f.type,'hotspot');
 cles.set(f.key,f.type);
}
for(const p of pages)for(let i=0;i<p.fields.length;i++)for(let j=i+1;j<p.fields.length;j++){
 const a=p.fields[i],b=p.fields[j];
 const intersection=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0.05&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0.05;
 assert.ok(!intersection,`Champs superposés : ${a.key} et ${b.key}`);
}
const manifeste={format:'character-sheet-studio-html',formatVersion:1,template};
const style=fs.readFileSync(path.join(ici,'fiche/interface.css'),'utf8');
const runtime=fs.readFileSync(path.join(ici,'fiche/runtime.js'),'utf8');
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Symbaroum — fiche de personnage interactive</title><style>${style}\n${customCss}</style></head><body>
<header class="toolbar"><strong>Symbaroum</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer>
<input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>Remplir la fiche Symbaroum</h2><p>Les deux fonds sont ceux du PDF fourni. Le bouton « Zones » révèle les champs sans modifier le document.</p><p>Les losanges du haut accueillent séparément l’Endurance et son maximum, la Corruption et sa valeur permanente, la Résistance à la douleur et le Seuil de Corruption. Aucun calcul n’est ajouté : le PDF n’imprime pas de formule.</p><p>Dans les douze cadres, N / A / M sont des choix exclusifs : Novice, Adepte, Maître. Recliquez le rang actif pour l’effacer. Dégâts, protection et corruption des artéfacts acceptent du texte, notamment des expressions de dés.</p><p>Pour les nombres : tapez la valeur, utilisez ↑ / ↓ ou la molette quand le champ a le focus. Les flèches natives sont masquées pour laisser toute la place aux chiffres. Le portrait se choisit par clic ; Maj+clic ou clic droit permet de le retirer après confirmation.</p><p>Zoom : de 20 à 400 %, Ctrl+molette, Ctrl++, Ctrl+− ; Ctrl+0 ajuste la page. L’export JSON inclut toutes les valeurs et le portrait. La sauvegarde locale appartient à ce navigateur ; exportez régulièrement une copie.</p><p>« Imprimer » imprime les deux pages A4. La fiche porte son manifeste importable ; la correspondance avec le pilote GM-OS est une étape d’intégration séparée.</p><button id="close-help">Fermer</button></dialog>
<script id="character-sheet-template" type="application/json">${JSON.stringify(manifeste).replaceAll('<','\\u003c')}</script><script>${runtime}</script></body></html>`;
fs.mkdirSync(path.dirname(cible),{recursive:true});
fs.writeFileSync(cible,html);
const bilan={source:path.basename(source),sha256:createHash('sha256').update(octets).digest('hex'),templateId:template.id,pages:pages.map(p=>({id:p.id,width:p.width,height:p.height,champs:p.fields.length})),zones:pages.flatMap(p=>p.fields).length,cles:cles.size,types:Object.fromEntries([...new Set(cles.values())].map(t=>[t,[...cles.values()].filter(v=>v===t).length]))};
console.log(JSON.stringify({cible,...bilan},null,2));
