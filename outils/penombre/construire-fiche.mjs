import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'output/studio/penombre/2026-11-22');fs.mkdirSync(out,{recursive:true});
const file=path.join(root,'docs/Reference/Pénombre/Feuille de personnage standard WEB.pdf');
const bytes=fs.readFileSync(file),geometry=JSON.parse(fs.readFileSync(path.join(out,'geometrie-source.json'),'utf8'));
assert.equal(createHash('sha256').update(bytes).digest('hex'),geometry.sourceSha256);
const background=fs.readFileSync(path.join(out,'fiche-source.png'));
assert.equal(createHash('sha256').update(background).digest('hex'),geometry.imageSha256);
const p={id:'page-1',label:'Éminence grise — fiche standard',width:geometry.width,height:geometry.height,orientation:'landscape',backgroundData:'data:image/png;base64,'+background.toString('base64'),fields:[]};

// Relevé sur le rendu 1191 × 919 du PDF original, converti en unités natives.
const F=(key,label,type,x,y,w,h,extra={})=>p.fields.push({key,label,type,x:+(x/1.5).toFixed(3),y:+(y/1.5).toFixed(3),w:+(w/1.5).toFixed(3),h:+(h/1.5).toFixed(3),className:`pen-field pen-${type}`,...extra});
const T=(k,l,x,y,w,h=21)=>F(k,l,'text',x,y,w,h);
const N=(k,l,x,y,w,h=25)=>F(k,l,'number',x,y,w,h,{className:'pen-field pen-number pen-circle'});
const H=(k,l,value,x,y,w,h,extra={})=>F(k,l,'hotspot',x,y,w,h,{value,...extra});
const C=(k,l,x,y,w,h)=>F(k,l,'checkbox',x,y,w,h);

for(const[k,l,y,x]of [['name','Nom',133,126],['people','Peuple',163,153],['key','Clé',193,113],['scale','Gamme',223,152],['tone','Ton',253,115]])T(`identity.${k}`,l,x,y,372-x);
for(const[k,l,x,y]of [['night','Nuit',153,352],['soul','Âme',273,352],['nature','Nature',107,478],['mind','Esprit',299,478],['spark','Étincelle',211,545]])T(`harmonics.${k}`,`${l} — dé`,x,y,39,37);
for(const[k,l,x,y]of [['powers','Potentiel — pouvoirs',448,213],['assets','Potentiel — atouts',448,346],['magic','Potentiel — maîtrises magiques',448,565]])N(`potential.${k}`,l,x,y,33,31);

// Le timbre est un choix exclusif ; les marques de partition sont indépendantes.
for(const[value,label,y]of [['harmonious','harmonieux',35],['false','faux',60],['dissonant','dissonant',85]])H('timbre.state',`Timbre ${label}`,value,727,y,16,16);
C('partition.key','Partition — clé',490,85,16,16);
for(const[i,[x,y]]of [[557,98],[596,84],[637,73],[674,59]].entries())C(`partition.notes.${i}.marked`,`Partition — note ${i+1}`,x,y,18,17);
F('plague.description','Peste — description et symptômes','textarea',868,55,293,57,{className:'pen-field pen-textarea pen-lines'});
T('plague.name','Peste — intitulé',915,33,246,21);

// Quatre lignes de pouvoirs, chacune avec sa propre case d'usage.
for(const[i,y]of [190,214,238,262].entries()){
 C(`powers.${i}.used`,`Pouvoir ${i+1} — case d’usage`,522,y+3,16,17);
 T(`powers.${i}.description`,`Pouvoir ${i+1}`,551,y,432,22);
 T(`powers.${i}.type`,`Pouvoir ${i+1} — type`,1006,y,156,22);
}

// Neuf atouts libres et leurs trois dés imprimés.
const assets=[...Array.from({length:3},(_,i)=>[414,410+i*27,712]),...Array.from({length:6},(_,i)=>[799,331+i*27,1103])];
for(const[i,[x,y,dx]]of assets.entries()){
 T(`assets.${i}.description`,`Atout ${i+1}`,x,y,dx-x-8,22);
 for(let n=1;n<=3;n++)H(`assets.${i}.rank`,`Atout ${i+1} — ${n} dé(s)`,n,dx+(n-1)*24,y+2,20,21);
}

for(const[i,y]of [583,614].entries()){
 T(`magic.${i}.name`,`Maîtrise magique ${i+1}`,563,y,153,22);
 T(`magic.${i}.harmonic`,`Maîtrise magique ${i+1} — harmonique`,734,y,105,22);
 T(`magic.${i}.prerequisite`,`Maîtrise magique ${i+1} — prérequis`,860,y,210,22);
 N(`magic.${i}.level`,`Maîtrise magique ${i+1} — niveau`,i?1076:1118,i?617:586,27,27);
}
N('consciousness.max','Conscience maximale',225,702,30,30);
for(let n=1;n<=10;n++)H('consciousness.current',`Conscience — ${n}`,n,83+((n-1)%5)*25.7,695+Math.floor((n-1)/5)*27,17,17,{className:'pen-field pen-hotspot pen-round'});
for(const[i,y]of [777,801,825,849].entries()){
 T(`complications.${i}.description`,`Complication ${i+1}`,80,y,224,21);
 for(let n=1;n<=3;n++)H(`complications.${i}.severity`,`Complication ${i+1} — ${n} case(s)`,n,321+(n-1)*25.7,y+4,17,18);
}

for(const f of p.fields)assert(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=p.width&&f.y+f.h<=p.height,f.key);
for(let i=0;i<p.fields.length;i++)for(let j=i+1;j<p.fields.length;j++){
 const a=p.fields[i],b=p.fields[j];assert(!(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.1),`Chevauchement ${a.key}/${b.key}`);
}
const id='penombre-standard-fr';
const scope=`.sheet[data-template="${id}"]`;
const customCss=`${scope} .pen-field{position:absolute;box-sizing:border-box;margin:0;border:0;border-radius:0;background:transparent;color:#302b24;font:9px/1.15 Georgia,"Times New Roman",serif;padding:0 1px;resize:none;outline:0;min-width:0;min-height:0}
${scope} .pen-field:focus{outline:.6px solid #714c31;background:rgba(255,248,225,.85)}
${scope} .pen-number,${scope} [data-key^="harmonics."]{text-align:center;font-size:13px;padding:0;font-variant-numeric:tabular-nums;appearance:textfield}
${scope} .pen-number::-webkit-inner-spin-button,${scope} .pen-number::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
${scope} .pen-textarea{line-height:18px;overflow:auto}
${scope} .pen-hotspot,${scope} .pen-checkbox{cursor:pointer;touch-action:manipulation;padding:0}
${scope} .pen-checkbox{appearance:none;-webkit-appearance:none}
${scope} .pen-checkbox:checked{background:rgba(89,54,28,.65);box-shadow:inset 0 0 0 1px #694524}
${scope} .pen-hotspot.active::after{content:"";position:absolute;inset:1px;background:rgba(89,54,28,.48);box-shadow:inset 0 0 0 1px #694524;pointer-events:none}
${scope} .pen-round,${scope} .pen-round.active::after{border-radius:50%}
${scope} [data-key^="partition."]{border-radius:50%}
${scope} .pen-circle{border-radius:50%}
`;
const template={id,name:'Pénombre — fiche standard',system:'Pénombre',accent:'#80502e',schemaVersion:2,customCss,pages:[p]};
const manifest={format:'character-sheet-studio-html',formatVersion:1,template};
// Réemploi du runtime générique de fiche déjà utilisé dans le dépôt, sans le modifier.
let runtime=fs.readFileSync(path.join(root,'outils/torg/fiche/runtime.js'),'utf8').replaceAll('torg-', 'penombre-').replace('Fiche Torg autonome','Fiche Pénombre autonome');
let css=fs.readFileSync(path.join(root,'outils/torg/fiche/interface.css'),'utf8').replaceAll('torg-eternity-fr',id).replaceAll('torg-', 'pen-').replace('size:612pt 792pt','size:793.701pt 612.283pt');
css+='\n@media print{.sheet[data-template="'+id+'"] .pen-checkbox:checked{background:#694524!important}.sheet[data-template="'+id+'"] .pen-hotspot.active::after{background:rgba(89,54,28,.48)!important;print-color-adjust:exact;-webkit-print-color-adjust:exact}}';
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pénombre — fiche standard interactive</title><style>${css}\n${customCss}</style></head><body>
<header class="toolbar"><strong>Pénombre</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer><input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp" hidden>
<dialog id="help-dialog"><h2>La fiche standard de Pénombre</h2><p>Une page paysage reproduit le PDF standard fourni. Zones révèle les champs ; le fond reste celui du PDF. Aucun portrait ni page collégiale n’est ajouté.</p><p>Saisissez les dés harmoniques sous forme libre, par exemple D8. Potentiels, niveaux, descriptions et maximum de Conscience restent manuels : aucun calcul de règles n’est ajouté. Le timbre est un choix exclusif. La clé et les quatre notes de la partition se cochent séparément.</p><p>Les dés d’atout, les cases de complications et les dix repères de Conscience sont des pistes cumulatives. Cliquer le dernier repère choisi efface la piste. Les cases d’usage des quatre pouvoirs restent indépendantes. La piste de Conscience compte des jetons ; elle ne distingue pas leurs faces actives et inactives.</p><p>Zoom 20–400 %, Ctrl+molette, Ctrl++, Ctrl+− et Ctrl+0. Export/import JSON, sauvegarde locale si disponible, réinitialisation avec confirmation. Imprimer conserve le format paysage du PDF. La fiche est autonome hors ligne ; son raccordement à un pilote dans GM-OS est une étape distincte.</p><button id="close-help">Fermer</button></dialog>
<script id="character-sheet-template" type="application/json">${JSON.stringify(manifest).replaceAll('<','\\u003c')}</script><script>${runtime}</script></body></html>`;
const target=path.join(root,'docs/fiches/Pénombre/Penombre-fiche-standard-interactive.html');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,html);
const keys=[...new Set(p.fields.map(f=>f.key))];
fs.writeFileSync(path.join(out,'construction-fiche.json'),JSON.stringify({source:path.relative(root,file),sourceSha256:createHash('sha256').update(bytes).digest('hex'),cible:path.relative(root,target),templateId:id,pages:1,champs:p.fields.length,cles:keys.length,clesAjoutees:keys,clesRetirees:[],versionPrecedente:false,calculs:0,format:{width:p.width,height:p.height}},null,2)+'\n');
console.log(JSON.stringify({target,pages:1,champs:p.fields.length,cles:keys.length}));
