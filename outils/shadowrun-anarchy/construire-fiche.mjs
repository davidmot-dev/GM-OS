import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const ici=path.dirname(fileURLToPath(import.meta.url)),sortie='output/fiches/shadowrun-anarchy';
const source='docs/Reference/Shadowrun Anarchy/sran2_01anarchyv2_PJ.pdf',cible='docs/fiches/Shadowrun Anarchy/shadowrun-anarchy2-fiche-personnage-interactive.html';
const geometrie=JSON.parse(fs.readFileSync(path.join(sortie,'source/geometrie.json'),'utf8'));assert.equal(geometrie.length,1);
const p=geometrie[0],page={id:'page-1',label:'Personnage, atouts, risques et blessures',width:p.width,height:p.height,orientation:'portrait',backgroundData:'data:image/png;base64,'+fs.readFileSync(path.join(sortie,'source/page-1.png')).toString('base64'),fields:[]};
const F=(key,label,type,x,y,w,h,extra={})=>page.fields.push({key,label,type,x,y,w,h,className:`sra-field sra-${type}`,...extra});
const T=(k,l,x,y,w,h=14,extra={})=>F(k,l,'text',x,y,w,h,extra);
const N=(k,l,x,y,w,h=14,extra={})=>F(k,l,'number',x,y,w,h,extra);
const H=(k,l,v,x,y,w,h)=>F(k,l,'hotspot',x,y,w,h,{value:v});
T('identity.name','Pseudo',80,33,272,16,{className:'sra-field sra-text sra-name'});
F('portrait','Portrait','portrait',420,99,140,151,{fit:'cover'});
for(const[i,[k,l]]of [['strength','Force'],['agility','Agilité'],['willpower','Volonté'],['logic','Logique'],['charisma','Charisme'],['anarchy','Anarchy']].entries()){
 const c=p.curves.filter(c=>c.width>29&&c.width<50&&c.height>29&&c.height<50&&c.top>60&&c.top<120)[i];
 N(k==='anarchy'?'tracks.anarchy':`attributes.${k}`,l,c.x0+5,c.top+7,c.width-10,c.height-14,{className:'sra-field sra-number sra-big'});
}
for(let i=0;i<11;i++){
 const y=141.8+17.008*i;
 T(`skills.${i}.name`,`Compétence ${i+1} — libellé`,28,y,152,15.5);
 N(`skills.${i}.rating`,`Compétence ${i+1} — indice`,187,y,35,15.5);
 N(`skills.${i}.attribute`,`Compétence ${i+1} — attribut`,229,y,39,15.5);
 N(`skills.${i}.pool`,`Compétence ${i+1} — réserve de dés RD`,275,y,33,15.5);
 for(let n=0;n<3;n++)H(`skills.${i}.risk_reduction`,`Compétence ${i+1} — réduction du risque ${n+1}`,n+1,312.57+14.175*n,146.84+17.008*i,11.34,10.6);
}
for(let i=0;i<11;i++)T(`assets.${i}.description`,`Atout ${i+1}`,31,352.8+17.008*i,318,15.4);
for(let i=0;i<5;i++)T(`keywords.${i}`,`Mot-clé ${i+1}`,408,293.2+17.008*i,160,13,{className:'sra-field sra-text sra-card'});
for(let i=0;i<4;i++)T(`behaviours.${i}`,`Comportement ${i+1}`,409,420.5+16.996*i,159,13,{className:'sra-field sra-text sra-behaviour'});
for(let i=0;i<4;i++)T(`cues.${i}`,`Réplique ${i+1}`,408,538.8+22.673*i,161,13,{className:'sra-field sra-text sra-card'});
T('knowledge.description','Connaissances',28,562,271,14);
N('tracks.essence','Essence',312,561.5,40,14);
for(let i=0;i<4;i++){T(`weapons_spells.${i}.name`,`Arme ou sort ${i+1}`,28,603.8+17.008*i,263,15.4);T(`weapons_spells.${i}.type`,`Arme ou sort ${i+1} — type`,297,603.8+17.008*i,56,15.4);}
for(let i=0;i<5;i++)T(`equipment.${i}`,`Équipement et nuyens — ligne ${i+1}`,28,693.9+14.173*i,107,11.4);
// Les six cercles sont trois degrés distincts (3/2/1), pas une jauge globale de six PV.
for(const[k,label,xs]of [['light','Légères',[266.42,279.09,291.76]],['serious','Graves',[305.35,318.03]],['incapacitating','Incapacitante',[337.2]]])xs.forEach((x,i)=>H(`wounds.${k}`,`Blessures ${label} — ${i+1}`,i+1,x,681.87,10.27,9.6));
T('armour.primary.name','Armure principale',213,720.4,49,11.7);
T('armour.secondary.name','Armure secondaire',217,734.6,45,11.7);
for(const[i,k]of ['unarmoured','primary','secondary','mental'].entries()){
 for(const[j,degree]of ['light','serious','incapacitating'].entries())N(`thresholds.${k}.${degree}`,`Seuil ${k} — ${degree}`,[269,306,334][j],706.7+14.173*i,[30,22,17][j],11.1,{className:'sra-field sra-number sra-small'});
}
N('hacking.minimum_risk_dice','Nombre minimum de dés de risque en piratage',510,739.2,48,10.9);
N('hacking.threshold_increase','Augmentation du seuil en piratage',510,754.8,48,10.9);
const cles=new Map();for(const f of page.fields){assert.ok(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=page.width&&f.y+f.h<=page.height,f.key);if(cles.has(f.key))assert.equal(f.type,'hotspot');cles.set(f.key,f.type);}
for(let i=0;i<page.fields.length;i++)for(let j=i+1;j<page.fields.length;j++){const a=page.fields[i],b=page.fields[j];assert.ok(!(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.1),`Chevauchement : ${a.key} / ${b.key}`);}
assert.equal(page.fields.length,146);assert.equal(cles.size,121);assert.equal(page.fields.filter(f=>f.type==='hotspot').length,39);
const customCss=fs.readFileSync(path.join(ici,'fiche/champs.css'),'utf8'),style=fs.readFileSync(path.join(ici,'fiche/interface.css'),'utf8'),runtime=fs.readFileSync(path.join(ici,'fiche/runtime.js'),'utf8');
const template={id:'shadowrun-anarchy2-fr',name:'Shadowrun : Anarchy 2.0 — fiche de personnage',system:'Shadowrun : Anarchy 2.0',accent:'#943e29',schemaVersion:2,customCss,pages:[page]};
const manifeste={format:'character-sheet-studio-html',formatVersion:1,template};
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shadowrun : Anarchy 2.0 — fiche interactive</title><style>${style}\n${customCss}</style></head><body>
<header class="toolbar"><strong>Anarchy 2.0</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer><input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>Fiche Shadowrun : Anarchy 2.0</h2><p>Une page fidèle au PDF fourni, aux dimensions natives de 600,945 × 779,528 points. Le fond original est intégré, sans recoloration ; la fiche fonctionne hors ligne. Zones montre les contrôles transparents.</p><p>Pseudo, cinq attributs et Anarchy, onze lignes de compétences avec indice, attribut, RD et réduction du risque (RR), onze lignes d’atouts, cinq mots-clés, quatre comportements et quatre répliques ; connaissances, Essence, quatre armes ou sorts, cinq lignes d’équipement et nuyens, armures et seuils de blessures, deux valeurs de piratage. Les seuils, la RD et les valeurs de règle restent saisissables : aucun calcul ou effet automatique ajouté. L’addition indice + attribut est imprimée mais n’est pas une dérivation à deux sources prise en charge par le manifeste ; renseignez la RD explicitement.</p><p>Les trois cercles RR de chaque compétence forment une jauge numérique de 0 à 3. Les blessures ont trois pistes séparées : légères (0–3), graves (0–2), incapacitante (0–1), y compris les cercles pâles optionnels du PDF. Cliquer remplit jusqu’à cette valeur ; recliquer la valeur courante remet cette piste à zéro. Aucune aggravation automatique entre degrés ou capacité optionnelle imposée.</p><p>Portrait : cliquer l’emplacement rond pour choisir une image locale ; elle est intégrée au JSON. Maj+clic ou clic droit, avec confirmation, retire le portrait. L’image est centrée et recadrée dans une ellipse intérieure qui préserve le cadre irrégulier imprimé.</p><p>Zoom de 20 à 400 %, Ctrl+molette, Ctrl++, Ctrl+−, Ctrl+0 pour ajuster. Sauvegarde automatique locale si disponible ; exporter régulièrement un JSON. Import remplace les données après confirmation si la fiche est remplie ; Réinitialiser demande confirmation. L’impression utilise le format natif et masque les commandes. Les saisies très longues peuvent défiler : relire l’impression.</p><p>Le manifeste est importable dans le moteur de fiches GM-OS. Son intégration permanente et la correspondance avec le pilote sont des étapes distinctes ; ce fichier ne modifie pas le pilote.</p><button id="close-help">Fermer</button></dialog>
<script id="character-sheet-template" type="application/json">${JSON.stringify(manifeste).replaceAll('<','\\u003c')}</script><script>${runtime}</script></body></html>`;
fs.mkdirSync(path.dirname(cible),{recursive:true});fs.writeFileSync(cible,html);const hash=b=>createHash('sha256').update(b).digest('hex');
const rapport={source,sourceSHA256:hash(fs.readFileSync(source)),html:cible,htmlSHA256:hash(html),templateId:template.id,pages:[{width:page.width,height:page.height,zones:page.fields.length}],cles:cles.size,hotspots:39,pistes:14,portrait:true,calculs:'Aucun : saisie explicite RD et seuils, aucune règle non fournie ajoutée.',creation:'Nouveau modèle ; aucun modèle précédent Shadowrun Anarchy trouvé dans les fiches ou le moteur.',integration:'Autonome, pas de builtinTemplates ni de correspondance écrits.'};
fs.writeFileSync(path.join(sortie,'construction.json'),JSON.stringify(rapport,null,2)+'\n');fs.writeFileSync(path.join(sortie,'champs.json'),JSON.stringify(page.fields,null,2)+'\n');console.log(JSON.stringify(rapport,null,2));
