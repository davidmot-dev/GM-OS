// GM-OS Studio : une page fidèle au PDF fourni, coordonnées natives en points.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const ici=path.dirname(fileURLToPath(import.meta.url)),racine=path.resolve(ici,'../..');
const source=process.argv[2]||path.join(racine,'docs/systems/degenesis/Degenesis Reference/Degenesis - Fiche PJ.pdf');
const cible=process.argv[3]||path.join(racine,'docs/fiches/Degenesis/degenesis-fiche-personnage-interactive.html');
const sortie=path.join(racine,'output/fiches/degenesis');fs.mkdirSync(sortie,{recursive:true});
const poppler=process.env.GMOS_PDFTOPPM||'C:/Users/david/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe';
execFileSync(poppler,['-r','144','-png',source,path.join(sortie,'source')]);
const octets=fs.readFileSync(source),pdf=await getDocument({data:new Uint8Array(octets)}).promise;
assert.equal(pdf.numPages,1,'Cette recette correspond à la page unique fournie.');
const page=await pdf.getPage(1);
const p={id:'page-1',label:'Identité, aptitudes, pistes et équipement',width:page.view[2]-page.view[0],height:page.view[3]-page.view[1],orientation:'portrait',backgroundData:'data:image/png;base64,'+fs.readFileSync(path.join(sortie,'source-1.png')).toString('base64'),fields:[]};
await pdf.destroy();
const releves=JSON.parse(fs.readFileSync(path.join(ici,'fiche/releves.json'),'utf8'));
assert.equal(releves.pistes.length,58);
// Relevés sur le rendu à 144 dpi : le facteur deux conserve les points du PDF.
const F=(key,label,type,x,y,w,h,extra={})=>p.fields.push({key,label,type,x:x/2,y:y/2,w:w/2,h:h/2,className:`dg-field dg-${type}`,...extra});
for(const r of releves.pistes)for(const [i,b]of r.boxes.entries())F(r.key,`${r.label} — ${i+1}`, 'hotspot',b.x,b.y,b.w,b.h,{value:i+1,className:'dg-field dg-hotspot'+(r.baseNoireImprimee&&i===0?' dg-base':'')});
const T=(key,label,x,y,w,h=18)=>F(key,label,'text',x,y,w,h);
const N=(key,label,x,y,w,h=18)=>F(key,label,'number',x,y,w,h);
const A=(key,label,x,y,w,h,extra={})=>F(key,label,'textarea',x,y,w,h,extra);
T('identity.name','Nom',112,70,210);
N('identity.age','Âge',101,99,221);
T('identity.rank','Rang',116,128,206);
N('experience.total','Expérience',166,157,156);
T('identity.gender','Sexe',868,70,204);
T('identity.height','Taille',881,99,191);
T('identity.weight','Poids du personnage',876,128,196);
T('wealth.dinars_lc','Dinars / LC',911,157,161);
for(const[k,l,x,w]of[['culture','Culture',65,258],['concept','Concept',426,288],['cult','Culte',786,288]])A(`identity.${k}`,l,x,246,w,136,{className:'dg-field dg-textarea dg-culture'});
for(let i=0;i<6;i++)T(`potentials.${i}.name`,`Potentiel ${i+1} — nom`,815,928+28*i,195,18);
const armes=[['name','Arme',66,214,'textarea'],['handling','Maniement',284,113,'textarea'],['range','Portée (−/−4D)',402,126,'text'],['damage','Dégâts',534,87,'text'],['magazine','Chargeur',627,60,'text'],['properties','Propriétés',693,212,'textarea'],['weight','Poids',911,62,'number'],['technology','Tech',978,45,'text'],['slots','Emplacements',1029,43,'number']];
for(let i=0;i<3;i++)for(const[k,l,x,w,t]of armes)F(`weapons.${i}.${k}`,`Arme ${i+1} — ${l}`,t,x,1159+42*i,w,35);
const armures=[['name','Armure',66,331,'textarea'],['rating','Valeur d’armure',402,128,'number'],['properties','Propriétés',535,370,'textarea'],['weight','Poids',911,62,'number'],['technology','Tech',978,45,'text'],['slots','Emplacements',1029,43,'number']];
for(let i=0;i<2;i++)for(const[k,l,x,w,t]of armures)F(`armor.${i}.${k}`,`Armure ${i+1} — ${l}`,t,x,1342+42*i,w,34);
for(let i=0;i<3;i++){
 const y=1482+42*i;
 for(const[c,x,w]of[[0,66,396],[1,535,303]]){
  const n=i+3*c;
  A(`equipment.${n}.name`,`Équipement ${n+1} — description`,x,y,w,34);
  N(`equipment.${n}.weight`,`Équipement ${n+1} — poids`,c===0?467:844,y,c===0?62:62,34);
 }
 N(`equipment_totals.${i}.weight`,`Poids total — ligne ${i+1} (saisie manuelle)`,911,y,161,34);
}
const cles=new Map();
for(const f of p.fields){
 assert.ok(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=p.width&&f.y+f.h<=p.height,JSON.stringify(f));
 if(cles.has(f.key))assert.equal(f.type,'hotspot','Clé répétée : '+f.key);cles.set(f.key,f.type);
}
for(let i=0;i<p.fields.length;i++)for(let j=i+1;j<p.fields.length;j++){
 const a=p.fields[i],b=p.fields[j];
 const overlap=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.05&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.05;
 assert.ok(!overlap,`Zones superposées : ${a.key} et ${b.key}`);
}
assert.equal(p.fields.filter(f=>f.type==='hotspot').length,390);
assert.equal(cles.size,129);
const customCss=fs.readFileSync(path.join(ici,'fiche/champs.css'),'utf8');
const template={id:'degenesis-fr',name:'Degenesis — fiche de personnage',system:'Degenesis',accent:'#303030',schemaVersion:2,customCss,pages:[p]};
const style=fs.readFileSync(path.join(ici,'fiche/interface.css'),'utf8'),runtime=fs.readFileSync(path.join(ici,'fiche/runtime.js'),'utf8');
const manifeste={format:'character-sheet-studio-html',formatVersion:1,template};
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Degenesis — fiche de personnage interactive</title><style>${style}\n${customCss}</style></head><body>
<header class="toolbar"><strong>Degenesis</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer><input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>Remplir la fiche Degenesis</h2><p>Cette fiche reproduit la page du PDF fourni, sans recoloration. « Zones » montre les champs transparents. Les zones Culture, Concept et Culte sont des textes libres ; aucun emplacement de portrait n’est imprimé, donc aucun n’est ajouté.</p><p>Cliquez les cases des attributs, compétences, Origines, potentiels et des quatre grandes pistes : les cases précédentes s’allument et une seule valeur numérique est enregistrée par piste. Recliquez la valeur courante pour revenir à zéro. Les cases noires initiales des attributs appartiennent au fond imprimé et ne disparaissent pas ; une croix blanche y indique la sélection interactive. Aucune valeur de création n’est imposée automatiquement.</p><p>Les trois armes, deux armures, six équipements et les trois lignes de poids total sont saisissables. Aucun calcul de caractéristiques, de blessures, de capacité ou de poids n’est ajouté : les totaux sont manuels. Un champ trop long peut défiler à la saisie ; relisez la version imprimée.</p><p>Zoom de 20 à 400 %, Ctrl+molette, Ctrl++, Ctrl+− ; Ctrl+0 ajuste la page. Sauvegarde automatique dans ce navigateur ; exportez régulièrement un JSON pour conserver une copie. L’import remplace la fiche après confirmation si elle est remplie ; la réinitialisation demande confirmation.</p><p>Impression sur une page aux dimensions originales. Le manifeste est importable dans le moteur de fiches GM-OS ; l’intégration au moteur et la correspondance avec le pilote sont des étapes séparées.</p><button id="close-help">Fermer</button></dialog>
<script id="character-sheet-template" type="application/json">${JSON.stringify(manifeste).replaceAll('<','\\u003c')}</script><script>${runtime}</script></body></html>`;
fs.mkdirSync(path.dirname(cible),{recursive:true});fs.writeFileSync(cible,html);
const bilan={source:path.basename(source),sourceSHA256:createHash('sha256').update(octets).digest('hex'),htmlSHA256:createHash('sha256').update(html).digest('hex'),templateId:template.id,pages:[{id:p.id,width:p.width,height:p.height}],zones:p.fields.length,cles:cles.size,pistes:releves.pistes.length,hotspots:390,creation:'Nouveau modèle ; aucune fiche Degenesis précédente trouvée dans le dépôt ou le moteur.',integration:'Modèle à importer ; ni builtinTemplates ni correspondance du pilote modifiés.'};
fs.writeFileSync(path.join(sortie,'construction.json'),JSON.stringify(bilan,null,2)+'\n');
console.log(JSON.stringify({cible,...bilan},null,2));
