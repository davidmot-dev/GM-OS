// GM-OS Studio — recette de la fiche fournie par David, 19 octobre 2026.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const ici=path.dirname(fileURLToPath(import.meta.url));
const racine=path.resolve(ici,'../..');
const source=process.argv[2];
if(!source)throw Error('Fournir le PDF de la fiche Crimes en argument.');
const cible=process.argv[3]||path.join(racine,'docs/fiches/Crimes/crimes-fiche-personnage-interactive.html');
const ressources=nom=>path.join(racine,'node_modules/pdfjs-dist',nom).replaceAll('\\','/')+'/';
const octets=fs.readFileSync(source);
const pdf=await getDocument({data:new Uint8Array(octets),wasmUrl:ressources('wasm'),standardFontDataUrl:ressources('standard_fonts')}).promise;
assert.equal(pdf.numPages,2,'La recette attend les deux pages de Crime - PJ Sheet.pdf.');
const pages=[],textes=[];
// Les atteintes (Crimes C2, 2026-10-22) : trois compteurs sous chaque Potentiel, là où le livre fait
// noter les marques (p. 395). Le PDF n'y imprime rien : leurs légendes sont dessinées sur le fond.
const POTENTIELS=[['physical','Physique',70.8],['mental','Mental',229.5],['social','Social',388.3]];
const ATTEINTES=[['fatigue','Fatigue'],['exhaustion','Épuisement'],['wounds','Blessures']];
const atteinte=(x0,i)=>({x:x0+i*46+12,y:388,w:20,h:10.5});
// L'italique des légendes imprimées (« Névrose - Seuil ») : Georgia, présente sous Windows ; à défaut, serif.
const georgie='C:/Windows/Fonts/georgiai.ttf';if(fs.existsSync(georgie))GlobalFonts.registerFromPath(georgie,'Georgia Italique');
const legender=(ctx,e)=>{ctx.fillStyle='#15110c';ctx.font=`${7.2*e}px "Georgia Italique", serif`;ctx.textAlign='center';
 for(const [,,x0]of POTENTIELS)for(const [i,[,l]]of ATTEINTES.entries()){const z=atteinte(x0,i);ctx.fillText(l,(z.x+z.w/2)*e,(z.y-1.6)*e);}};
for(let n=1;n<=2;n++){
 const p=await pdf.getPage(n),v=p.getViewport({scale:2}),c=createCanvas(Math.ceil(v.width),Math.ceil(v.height));
 await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
 if(n===1)legender(c.getContext('2d'),2);
 pages.push({id:`page-${n}`,label:n===1?'Expertise psychologique et compétences':'Profil, contacts et équipe',width:p.view[2],height:p.view[3],orientation:'portrait',backgroundData:'data:image/webp;base64,'+c.toBuffer('image/webp',96).toString('base64'),fields:[]});
 const contenu=await p.getTextContent();
 textes.push(contenu.items.filter(i=>i.str.trim()).map(i=>({s:i.str,x:i.transform[4],y:p.view[3]-i.transform[5],w:i.width,h:i.height})));
}
await pdf.destroy();
const champ=(p,key,label,type,x,y,w,h,extra={})=>pages[p-1].fields.push({key,label,type,x,y,w,h,className:`crime-field crime-${type}`,...extra});
const texte=(p,k,l,x,y,w,h=11)=>champ(p,k,l,'text',x,y,w,h);
const long=(p,k,l,x,y,w,h)=>champ(p,k,l,'textarea',x,y,w,h);
const nombre=(p,k,l,x,y,w=18,h=11,extra={})=>champ(p,k,l,'number',x,y,w,h,extra);
const point=(p,k,l,v,x,y,w,h,extra={})=>champ(p,k,l,'hotspot',x,y,w,h,{value:v,...extra});
const piste=(p,k,l,n,x,y,pas,w,h,pente=0)=>{for(let i=0;i<n;i++)point(p,k,`${l} — ${i+1}`,i+1,x+i*pas,y+i*pas*pente,w,h);};

// Page 1 : choix exclusifs de Jung, saisies libres et seuils indépendants.
for(const [k,l,y,a,b]of[['emotivity','Émotivité',105.2,'yes','no'],['activity','Activité',117.3,'yes','no'],['reactivity','Réactivité',129.4,'primary','secondary']]){
 point(1,`psychology.${k}`,`${l} — ${a==='yes'?'Oui':'Primaire'}`,a,136.5,y,10.5,10.5);
 point(1,`psychology.${k}`,`${l} — ${b==='no'?'Non':'Secondaire'}`,b,208.5,y,10.5,10.5);
}
texte(1,'psychology.temperament','Tempérament',133,153.5,145,13);
texte(1,'psychology.inclination','Inclinaison psychotique',177,178,101,13);
for(const [k,l,x,y,w]of[
 ['passions.primary','Passion primaire',372,92,177],['passions.secondary','Passion secondaire',382,104.1,167],
 ['taboo','Tabou',365,129,184],['needs.primary','Première nécessité',374,173.2,175],
 ['needs.secondary','Seconde nécessité',382,185.3,167],['needs.internal','Nécessité interne',366,197.4,183]
])texte(1,`psychology.${k}`,l,x,y,w);
piste(1,'tracks.anxiety','Angoisse',5,162.5,212.5,15.1,12.8,10.5,.0524);
for(const [k,l,n,x,y,pas,w,h]of[
 ['neurosis','Névrose',10,89.2,233.4,16.7,14.5,10],
 ['psychosis','Psychose',10,87.9,257.7,16.45,14.5,10],
 ['innocence','Innocence',10,86.7,281.8,16.7,13.5,10]
])piste(1,`tracks.${k}`,l,n,x,y,pas,w,h,.0524);
nombre(1,'psychology.neurosis.threshold','Seuil de Névrose',162,226,49,9.5);
nombre(1,'psychology.psychosis.base','Base de Psychose',162,250,49,9.5);
nombre(1,'psychology.innocence.threshold','Seuil d’Innocence',167,274,44,9.5);
long(1,'psychology.madness','Folies constatées',333,241,209,27);
texte(1,'psychology.decline','Déchéances',392,271,146,14);

for(const [k,l,x]of POTENTIELS)piste(1,`attributes.${k}`,l,10,x,364.5,13.75,12.5,12.8);
// Sous chaque Potentiel, ses marques : `harm.*` et non `attributes.*.…`, que le moteur rangerait SOUS la valeur.
for(const [k,l,x]of POTENTIELS)for(const [i,[a,la]]of ATTEINTES.entries()){const z=atteinte(x,i);nombre(1,`harm.${k}.${a}`,`${l} — ${la.toLowerCase()}`,z.x,z.y,z.w,z.h,{className:'crime-field crime-number crime-harm'});}

// Les trois cercles forment la piste ; le zéro incliné reste un compteur libre.
const groupes=[
 ['combat','Combat',168.755,435.285],['sport','Sport',168.755,496.702],['circus','Cirque',168.755,558.119],
 ['tracking','Traque',168.755,628.536],['larceny','Larcin',168.755,707.953],
 ['abstract','Sciences abstraites',327.496,435.285],['life','Sciences du vivant',327.496,496.702],
 ['humanities','Sciences de l’homme',327.496,558.119],['occultism','Occultisme',327.496,619.536],
 ['practical','Pratique',327.496,680.953],['intrigue','Intrigues',486.236,435.285],['society','Société',486.236,505.702]
];
const clefs=[
 ['unarmed','blades','firearms','bravado'],['riding','climbing','swimming','crowds'],['acrobatics','juggling','tightrope','escape','begging'],
 ['hunting','survival','tracking','trapping','scavenging','smallgame'],['camouflage','lockpicking','stealth','mimicry','burglary'],
 ['mathematics','cryptography','astronomy'],['nature','medicine','pharmacy','psychiatry'],['administration','anthropology','history','theology'],
 ['magnetism','spiritism','divination','languages'],['art','driving','photography','forgery'],
 ['milieu','journalism','criminology','police','district'],['diplomacy','politics','rhetoric','seduction','blackmarket','begging','storytelling']
];
for(const [j,[k,l,x,base]]of groupes.entries()){
 piste(1,`skills.${k}.level`,l,3,x,base-10.2,9.9,8.7,10.2);
 nombre(1,`skills.${k}.counter`,`${l} — compteur`,x+33.2,base-10.4,9.6,11,{className:'crime-field crime-number crime-counter'});
 const cases=textes[0].filter(i=>i.s==='E'&&Math.abs(i.x-(x+33.2))<.6&&i.y>base&&i.y<base+72).slice(0,clefs[j].length);
 assert.equal(cases.length,clefs[j].length,l);
 for(const [i,cell]of cases.entries()){
  const lib=textes[0].filter(t=>Math.abs(t.y-cell.y)<.2&&t.x<cell.x&&t.s!=='E').at(-1)?.s;
  assert.ok(lib);
  champ(1,`specialties.${k}.${clefs[j][i]}`,`${l} — ${lib}`,'checkbox',cell.x+.2,cell.y-10,8.7,8.7);
 }
}
for(const [k,l,base]of[['constable','Condé',620.6],['hound','Limier',635.6],['visionary','Illuminé',650.6],['mentalist','Mentaliste',665.6],['snoop','Fouineur',680.6]]){
 piste(1,`investigation.styles.${k}.level`,l,3,486.24,base-10.2,9.9,8.7,10.2);
 nombre(1,`investigation.styles.${k}.counter`,`${l} — compteur`,519.44,base-10.4,9.6,11,{className:'crime-field crime-number crime-counter'});
}

// Page 2 : portrait à l'intérieur du cadre, sans couvrir les attaches imprimées.
champ(2,'portrait','Portrait — choisir une image','portrait',53,81,145,216,{fit:'contain'});
texte(2,'identity.concept','Concept',312,88.5,245,15);
for(const [k,l,x,y,w]of[
 ['name','Nom',296,136,260],['first','Prénom',309,148.1,247],['sexage','Sexe et âge',321,160.2,235],
 ['role','Rôle',293,172.3,263],['origin','Origine géographique',370,213,186],['social','Origine sociale',340,225.1,216],['gang','Bande',301,237.2,255]
])texte(2,`identity.${k}`,l,x,y,w);
texte(2,'profile.refuge','Refuge',308,262,248,16);
long(2,'profile.description','Description',267,306,288,26);
long(2,'equipment.notes','Équipement',267,346,288,58);
piste(2,'fortune.points','Fortune',10,45,338.4,17.35,11,10);
piste(2,'fortune.level','Niveau de fortune',4,155.7,354.4,15.1,12.8,10.5);
for(let c=0;c<2;c++)for(let i=0;i<4;i++){
 const n=c*4+i,base=446.3+i*15.6,x=28.3+c*277.8;
 texte(2,`contacts.${n}.name`,`Contact ${n+1}`,x+1,base-11.5,223,12);
 piste(2,`contacts.${n}.rating`,`Contact ${n+1} — piste`,4,x+229.4,base-8.7,6.9,5.7,8.1);
}
for(let c=0;c<2;c++)for(let i=0;i<4;i++){
 const n=c*4+i,base=563.1+i*15.6,x=28.3+c*277.8;
 texte(2,`clues.${n}.text`,`Indice ${n+1}`,x+1,base-11.5,202,12);
 for(const [j,k]of ['constable','hound','visionary','mentalist','snoop'].entries())nombre(2,`clues.${n}.points.${k}`,`Indice ${n+1} — ${['Condé','Limier','Illuminé','Mentaliste','Fouineur'][j]}`,x+207+j*11.15,base-9.8,9.8,11,{className:'crime-field crime-number crime-clue'});
}
texte(2,'team.name','Nom de l’équipe',107,645,88,13);
piste(2,'team.track','Équipe — piste à cinq cases',5,200,646,15.1,12.8,10.5);
texte(2,'team.contact.name','Contact de groupe',405,644.5,126,13);
piste(2,'team.contact.rating','Contact de groupe — piste',4,535.7,646.1,6.9,5.7,8.1);
long(2,'team.objectives','Objectifs de l’équipe',76,659,482,32);
long(2,'team.reputation','Réputation de l’équipe',85,695,472,18);
long(2,'team.committed','Plots engagés',96,720,326,35);

const customCss=fs.readFileSync(path.join(ici,'fiche/champs.css'),'utf8');
const template={id:'crimes-fr',name:'Crimes — fiche de personnage',system:'Crimes',accent:'#31564a',schemaVersion:2,customCss,pages};
const cles=new Map();for(const p of pages)for(const f of p.fields){
 assert.ok(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=p.width&&f.y+f.h<=p.height,JSON.stringify(f));
 if(cles.has(f.key))assert.equal(f.type,'hotspot');cles.set(f.key,f.type);
}
const manifeste={format:'character-sheet-studio-html',formatVersion:1,template};
const style=fs.readFileSync(path.join(ici,'fiche/interface.css'),'utf8');
const runtime=fs.readFileSync(path.join(ici,'fiche/runtime.js'),'utf8');
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crimes — fiche de personnage interactive</title><style>${style}\n${customCss}</style></head><body>
<header class="toolbar"><strong>Crimes</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer>
<input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>Remplir la fiche Crimes</h2><p>Les fonds sont les deux pages du PDF d’origine. Saisissez dans les zones imprimées ; « Zones » rend leur contour visible.</p><p>Une piste se remplit jusqu’à la valeur choisie. Recliquez la même valeur pour revenir à zéro. Les choix de Jung sont exclusifs ; les spécialisations se cochent indépendamment. Les zéros inclinés près des compétences et styles sont des compteurs libres, sans calcul.</p><p>Le portrait se choisit par clic ; un clic droit ou Maj+clic permet de le retirer après confirmation. Les nombres d’indices suivent l’ordre imprimé : Condé, Limier, Illuminé, Mentaliste, Fouineur. La piste d’équipe sans légende reste une piste générique.</p><p>Zoom : Ctrl+molette, Ctrl++, Ctrl+− ; Ctrl+0 ajuste la page. Exportez régulièrement un JSON : la sauvegarde locale appartient à ce navigateur et ne remplace pas une copie personnelle. Le JSON transporte aussi le portrait.</p><p>« Imprimer » imprime les deux pages, sans la barre d’outils. Aucun calcul automatique ni liaison à un pilote n’est ajouté.</p><button id="close-help">Fermer</button></dialog>
<script id="character-sheet-template" type="application/json">${JSON.stringify(manifeste).replaceAll('<','\\u003c')}</script><script>${runtime}</script></body></html>`;
fs.mkdirSync(path.dirname(cible),{recursive:true});fs.writeFileSync(cible,html);
const rapport={source:path.basename(source),sha256:createHash('sha256').update(octets).digest('hex'),templateId:template.id,pages:pages.map(p=>({id:p.id,width:p.width,height:p.height,champs:p.fields.length})),zones:pages.flatMap(p=>p.fields).length,cles:cles.size,types:Object.fromEntries([...new Set(cles.values())].map(t=>[t,[...cles.values()].filter(v=>v===t).length]))};
console.log(JSON.stringify({cible,...rapport},null,2));
