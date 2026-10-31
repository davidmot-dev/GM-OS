// Atelier fiche GM-OS Studio : deux pages du PDF fourni, sans modification du fond.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const ici=path.dirname(fileURLToPath(import.meta.url)),racine=path.resolve(ici,'../..');
const source=process.argv[2]||path.join(racine,'docs/Reference/COC/COC2_01_Livre_de_Regles_Fiche PJ.pdf');
const cible=process.argv[3]||path.join(racine,'docs/fiches/COC/coc2-fiche-personnage-interactive.html');
const sortie=path.join(racine,'output/fiches/coc');fs.mkdirSync(sortie,{recursive:true});
const poppler=process.env.GMOS_PDFTOPPM||'C:/Users/david/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe';
execFileSync(poppler,['-r','144','-png',source,path.join(sortie,'source')]);
const octets=fs.readFileSync(source),pdf=await getDocument({data:new Uint8Array(octets)}).promise;
assert.equal(pdf.numPages,2,'Cette recette correspond aux deux pages de la fiche COC2 fournie.');
const pages=[];
for(let i=1;i<=2;i++){const p=await pdf.getPage(i);pages.push({id:'page-'+i,label:i===1?'Identité, caractéristiques, attaques et santé':'Six Voies et échelle',width:p.view[2]-p.view[0],height:p.view[3]-p.view[1],orientation:'portrait',backgroundData:'data:image/png;base64,'+fs.readFileSync(path.join(sortie,`source-${i}.png`)).toString('base64'),fields:[]});}
await pdf.destroy();
// Relevés sur le rendu 144 dpi : deux pixels pour un point PDF.
const F=(page,key,label,type,x,y,w,h,extra={})=>pages[page-1].fields.push({key,label,type,x:x/2,y:y/2,w:w/2,h:h/2,className:`coc-field coc-${type}`,...extra});
const T=(key,label,x,y,w,h=23,extra={})=>F(1,key,label,'text',x,y,w,h,extra);
const N=(key,label,x,y,w,h=34,extra={})=>F(1,key,label,'number',x,y,w,h,extra);
const A=(key,label,x,y,w,h,extra={})=>F(1,key,label,'textarea',x,y,w,h,extra);
T('identity.name','Nom du personnage',405,88,465,42,{className:'coc-field coc-text coc-name'});
T('identity.player','Joueur',82,177,280,24);
N('identity.age','Âge',400,178,29,23,{className:'coc-field coc-number coc-small-number'});
T('identity.origin','Origine',452,177,149,24);
T('identity.profile','Profil',631,177,246,24);
const attrs=[['agility','AGI',317],['constitution','CON',372],['strength','FOR',430],['perception','PER',491],['charisma','CHA',552],['intellect','INT',611],['willpower','VOL',670]];
for(const[k,l,y]of attrs){N(`attributes.${k}`,l,147,y,51,40);A(`attribute_notes.${k}`,`${l} — notes`,217,y,144,40,{className:'coc-field coc-textarea coc-notes'});}
for(const[k,l,x,y]of[['melee','ATC',178,752],['ranged','ATD',178,807],['defense','DEF',315,752],['initiative','INIT.',315,807],['cg','CG',315,860]])N(`combat.${k}`,l,x,y,46,33);
T('combat.damage_bonus','BDM',178,860,46,33);
A('profile.description','Description',396,290,480,64);
A('profile.sequelae','Séquelles',88,959,273,114);
for(let i=0;i<3;i++){
 A(`traits.${i}.description`,`Avantage ou désavantage ${i+1}`,396,420+47*i,373,35);
 N(`traits.${i}.value`,`Avantage ou désavantage ${i+1} — valeur`,784,420+47*i,90,35);
}
T('equipment.0','Équipement — première ligne',535,582,339,25);
T('equipment.1','Équipement — seconde ligne',397,613,477,24);
const armes=[{y:694,notes:752},{y:805,notes:863},{y:912,notes:970}];
for(const[i,{y,notes}]of armes.entries()){
 A(`weapons.${i}.name`,`Arme ${i+1}`,397,y,211,32);
 N(`weapons.${i}.attack_bonus`,`Arme ${i+1} — bonus après 1D20 +`,702,y,27,32,{className:'coc-field coc-number coc-small-number'});
 N(`weapons.${i}.critical_bonus`,`Arme ${i+1} — BC`,748,y,54,32);
 T(`weapons.${i}.damage`,`Arme ${i+1} — DM`,820,y,55,32);
 T(`weapons.${i}.notes_range`,`Arme ${i+1} — notes et portée`,539,notes,336,23);
}
A('armor.name','Protection',397,1040,328,34);
N('armor.reduction','RD',748,1040,54,34);
N('armor.penalty','Malus de protection',821,1040,53,34);
// Les cellules larges 5/10/15/20 portent un état imprimé sur la première page.
// Elles restent les valeurs numériques de la même jauge ; aucun effet de règle ajouté.
const bords=[66,103,135,170,203,262,305,339,371,404,461,502,535,570,601,661,700,733,765,805,874];
for(const[page,key,label,dy,dx]of[[1,'tracks.health','Échelle de santé',1132,22.55],[2,'tracks.scale','Échelle de la page 2',1125,0]])for(let i=0;i<20;i++)F(page,key,`${label} — ${i+1}`,'hotspot',bords[i]+dx+1,dy,bords[i+1]-bords[i]-2,20,{value:i+1});
const colonnes=[{gauche:58,droite:334,nomX:134,caseX:69.6},{gauche:337,droite:610,nomX:412,caseX:348.4},{gauche:613,droite:887,nomX:687,caseX:623.3}];
const rangs=[{caseY:141.1,haut:132,bas:221},{caseY:233.1,haut:222,bas:312},{caseY:327.1,haut:313,bas:403},{caseY:418.2,haut:404,bas:495},{caseY:509.0,haut:496,bas:584}];
for(let voie=0;voie<6;voie++){
 const c=colonnes[voie%3],decalage=voie<3?0:490.71;
 F(2,`paths.${voie}.name`,`Voie ${voie+1} — nom`,'text',c.nomX,105+decalage,c.droite-c.nomX-7,17,{className:'coc-field coc-text coc-path-name'});
 for(let r=0;r<5;r++){
  const rang=rangs[r],prefixe=`paths.${voie}.ranks.${r}`;
  F(2,prefixe+'.acquired',`Voie ${voie+1}, rang ${r+1} — acquis`,'checkbox',c.caseX,rang.caseY+decalage,13.5,13.5);
  F(2,prefixe+'.name',`Voie ${voie+1}, rang ${r+1} — nom de capacité`,'text',c.gauche+106,rang.haut+8+decalage,c.droite-c.gauche-114,20,{className:'coc-field coc-text coc-rank-name'});
  F(2,prefixe+'.description',`Voie ${voie+1}, rang ${r+1} — description`,'textarea',c.gauche+8,rang.haut+33+decalage,c.droite-c.gauche-16,rang.bas-rang.haut-41,{className:'coc-field coc-textarea coc-rank-description'});
 }
}
const toutes=pages.flatMap(p=>p.fields),cles=new Map();
for(const p of pages){for(const f of p.fields){assert.ok(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=p.width&&f.y+f.h<=p.height,JSON.stringify(f));if(cles.has(f.key))assert.equal(f.type,'hotspot','Clé répétée : '+f.key);cles.set(f.key,f.type);}for(let i=0;i<p.fields.length;i++)for(let j=i+1;j<p.fields.length;j++){const a=p.fields[i],b=p.fields[j];const chevauche=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.05&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.05;assert.ok(!chevauche,`Chevauchement : ${a.key} et ${b.key}`);}}
assert.equal(toutes.filter(f=>f.type==='hotspot').length,40);assert.equal(toutes.filter(f=>f.type==='checkbox').length,30);assert.equal(cles.size,151);assert.equal(toutes.length,189);
const customCss=fs.readFileSync(path.join(ici,'fiche/champs.css'),'utf8');
const template={id:'coc2-fr',name:'COC2 — fiche de personnage',system:'Chroniques Oubliées Contemporain, deuxième édition',accent:'#51275f',schemaVersion:2,customCss,pages};
const style=fs.readFileSync(path.join(ici,'fiche/interface.css'),'utf8'),runtime=fs.readFileSync(path.join(ici,'fiche/runtime.js'),'utf8');
const manifeste={format:'character-sheet-studio-html',formatVersion:1,template};
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>COC2 — fiche de personnage interactive</title><style>${style}\n${customCss}</style></head><body>
<header class="toolbar"><strong>COC2</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer><input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>Remplir la fiche COC2</h2><p>Cette fiche de Chroniques Oubliées Contemporain reproduit les deux pages du PDF fourni, sans recoloration. « Zones » montre les contrôles transparents. Aucun emplacement de portrait n’est imprimé : aucun n’est ajouté.</p><p>La première page porte l’identité, les sept caractéristiques et leurs notes, la description, trois avantages/désavantages, deux lignes d’équipement, les valeurs de combat, trois armes, une protection et les séquelles. Les libellés et préfixes « 1D20 + » restent ceux du PDF. BDM et DM sont des textes libres ; les autres valeurs chiffrées acceptent notamment les nombres négatifs. Aucun calcul de règle n’est ajouté.</p><p>Les deux échelles imprimées sont des jauges de 0 à 20 : cliquer une cellule allume celles qui la précèdent ; recliquer la valeur courante revient à zéro. Les cellules larges de santé correspondent à 5, 10, 15 et 20. L’échelle de la page 2 est enregistrée sous un nom générique : aucun rôle non imprimé sur le document ne lui est attribué automatiquement.</p><p>La seconde page comporte six Voies. Chaque rang a son nom, sa description et une case indépendante ; cocher une capacité ne coche pas les autres rangs. Aucun prérequis ni progression n’est imposé par cette fiche.</p><p>Zoom de 20 à 400 %, Ctrl+molette, Ctrl++, Ctrl+− ; Ctrl+0 ajuste la page. Sauvegarde automatique dans ce navigateur ; exportez régulièrement un JSON pour conserver une copie. L’import remplace les données après confirmation si la fiche est remplie ; la réinitialisation demande confirmation.</p><p>Imprimer produit les deux pages, même si une seule est affichée à l’écran, aux dimensions originales de 473,386 × 609,449 points. Une saisie très longue peut défiler dans son champ : relisez le rendu imprimé. Le manifeste est importable dans le moteur GM-OS ; intégration permanente et correspondance avec le pilote restent des étapes séparées.</p><button id="close-help">Fermer</button></dialog>
<script id="character-sheet-template" type="application/json">${JSON.stringify(manifeste).replaceAll('<','\\u003c')}</script><script>${runtime}</script></body></html>`;
fs.mkdirSync(path.dirname(cible),{recursive:true});fs.writeFileSync(cible,html);
const sha=b=>createHash('sha256').update(b).digest('hex');
const bilan={source:path.basename(source),sourceSHA256:sha(octets),htmlSHA256:sha(html),templateId:template.id,pages:pages.map(p=>({id:p.id,width:p.width,height:p.height,zones:p.fields.length})),zones:toutes.length,cles:cles.size,hotspots:40,pistes:2,casesIndependantes:30,creation:'Nouveau modèle ; aucune fiche COC2 précédente trouvée dans docs/fiches ni dans le moteur.',integration:'Modèle à importer ; ni builtinTemplates ni correspondance du pilote modifiés.'};
fs.writeFileSync(path.join(sortie,'construction.json'),JSON.stringify(bilan,null,2)+'\n');fs.writeFileSync(path.join(sortie,'champs.json'),JSON.stringify(pages.map(({id,fields})=>({page:id,fields})),null,2)+'\n');
console.log(JSON.stringify({cible,...bilan},null,2));
