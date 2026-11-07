/** GM-OS Studio, David le 07/11/2026 : fiche PJ de l'image fournie, données vidées, Table des Bonus intacte. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const ici=path.dirname(fileURLToPath(import.meta.url)),racine=path.resolve(ici,'../..');
const sortie=path.join(racine,'output/fiches/torg'),dossier=path.join(racine,'docs/fiches/Torg');
fs.mkdirSync(dossier,{recursive:true});fs.mkdirSync(path.join(ici,'fiche'),{recursive:true});
const fond=fs.readFileSync(path.join(sortie,'torg-eternity-fiche-pj-vierge.png'));
const controle=JSON.parse(fs.readFileSync(path.join(sortie,'controle-du-fond.json'),'utf8'));
assert.equal(controle.tableDesBonus.pixelsModifies,0);
const id='torg-eternity-fr',fields=[];
const F=(key,label,type,x,y,w,h,extra={})=>fields.push({key,label,type,x,y,w,h,className:`torg-field torg-${type}`,...extra});
const T=(key,label,x,y,w,h=13,extra={})=>F(key,label,'text',x,y,w,h,extra);
const N=(key,label,x,y,w,h=14,extra={})=>F(key,label,'number',x,y,w,h,extra);
const A=(key,label,x,y,w,h)=>F(key,label,'textarea',x,y,w,h);
T('identity.name','Nom du personnage',264,18,214,16,{className:'torg-field torg-text torg-name'});
T('identity.race','Race',264,35,69,14);T('identity.cosm','Cosm',373,35,105,14);
N('identity.xp_total','Total PX',537,20,22,13);N('identity.xp_available','PX disponibles',537,37,22,13);
for(const[k,l,x,w]of[['magic','Magie',295,14],['social','Social',339,14],['spirit','Spirituel',380,16],['tech','Technologie',420,16]])N(`axioms.${k}`,`Axiome ${l}`,x,53,w,13,{className:'torg-field torg-number torg-small'});
T('identity.clearance','Niveau d’habilitation',508,53,51,13);
for(const[k,l,c]of[['charisma','Charisme',51.3],['dexterity','Dextérité',101.6],['spirit','Esprit',153],['strength','Force',205.2],['mind','Raison',257.9]])N(`attributes.${k}`,l,c-10,110,20,19,{className:'torg-field torg-number torg-circle'});
for(const[k,l,c]of[['movement','Déplacement',320.5],['run','Course',363.2],['toughness','Résistance totale',414.4],['armour','Armure',455.2]])N(`combat.${k}`,l,c-10,110,20,19,{className:'torg-field torg-number torg-circle'});
for(const[k,l,y]of[['dodge','Esquive',134],['melee','Défense en mêlée',182.2],['unarmed','Défense à mains nues',230.6]])N(`defenses.${k}`,l,510.3,y,20,19,{className:'torg-field torg-number torg-circle'});
// Choc et Blessures : la case imprimée porte son libellé en filigrane, sur toute sa largeur ; une
// valeur posée au centre se lisait « CH2C » (David, 07/11/2026 : « corrige chocs et blessures »).
// Le champ remplit l'intérieur du cadre, sur fond clair, le libellé redit en petit à gauche (CSS).
N('tracks.shock','Choc',500,270,63,23,{className:'torg-field torg-number torg-counter torg-choc'});
N('tracks.wounds','Blessures',500,310,63,23,{className:'torg-field torg-number torg-counter torg-blessures'});
const fixes=[['energy_weapons','Armes à énergie',161],['fire_combat','Armes à feu',176],['missile_weapons','Armes de jet',191],['melee_weapons','Armes de mêlée',206],['unarmed_combat','Combat à mains nues',221],['intimidation','Intimidation',251.5],['maneuver','Manœuvre',266.5],['taunt','Provocation',281.5],['trick','Ruse',296.5]];
for(const[k,l,y]of fixes){N(`skills.${k}.adds`,`${l} — rangs`,196,y,40,13.8);N(`skills.${k}.value`,`${l} — valeur`,239.5,y,44,13.8);}
for(let i=0;i<8;i++){
 const y=327.2+i*15.27,p=`skills.other.${i}`;
 T(`${p}.name`,`Autre compétence ${i+1} — nom`,28.5,y,116,13.8);
 T(`${p}.attribute`,`Autre compétence ${i+1} — attribut`,147.5,y,45,13.8,{className:'torg-field torg-text torg-centered'});
 N(`${p}.adds`,`Autre compétence ${i+1} — rangs`,196,y,40,13.8);
 N(`${p}.value`,`Autre compétence ${i+1} — valeur`,239.5,y,44,13.8);
}
A('profile.description','Description et notes du personnage',299,148,167,185);
for(let i=0;i<7;i++){T(`assets.${i}.name`,`Atout ${i+1}`,28.5,490.5+i*15,90,13.8);A(`assets.${i}.effect`,`Atout ${i+1} — effet`,121,490.5+i*15,162.5,13.8);}
for(let i=0;i<9;i++){const y=389.5+i*15;T(`equipment.${i}.name`,`Équipement ${i+1} — objet`,299,y,77,13.8);N(`equipment.${i}.tech`,`Équipement ${i+1} — Tech`,379,y,39,13.8);T(`equipment.${i}.notes`,`Équipement ${i+1} — notes`,421,y,159,13.8);}
for(let i=0;i<2;i++){const y=565.5+i*15;T(`armour.${i}.name`,`Armure ${i+1}`,299,y,77,13.8);N(`armour.${i}.tech`,`Armure ${i+1} — Tech`,379,y,39,13.8);N(`armour.${i}.bonus`,`Armure ${i+1} — bonus`,421,y,32,13.8);T(`armour.${i}.notes`,`Armure ${i+1} — notes`,456,y,124,13.8);}
for(let i=0;i<3;i++){
 const y=642+i*15;
 for(const[k,l,x,w,type]of[['name','Arme',28.5,136,'text'],['tech','Tech',168,38,'number'],['damage','Dommages',210,40,'text'],['ammo','Munitions',254,50,'text'],['range','Portée',308,83,'text'],['notes','Notes',395,185,'text']])F(`weapons.${i}.${k}`,`Arme ${i+1} — ${l}`,type,x,y,w,13.8);
}
// Les pistes reproduisent les repères imprimés ; aucun calcul de règles n'est ajouté.
for(const[key,label,y,value]of[['states.stymied','Déstabilisé −2',46.5,2],['states.stymied','Très déstabilisé −4',26,4],['states.vulnerable','Vulnérable +2',95,2],['states.vulnerable','Très vulnérable +4',74.5,4]])F(key,label,'hotspot',570.5,y,13.5,14.5,{value});
for(const[value,y,label]of[[1,238.5,'−1'],[2,218,'−2'],[3,197.5,'−3'],[4,177,'repère sans libellé 1'],[5,156.5,'repère sans libellé 2'],[6,136,'KO']])F('tracks.wound_level',`Niveau de Blessures — ${label}`,'hotspot',570.5,y,13.5,14.5,{value});
const keys=new Set(fields.map(f=>f.key));assert.equal(fields.length,152);assert.equal(keys.size,145);
for(const f of fields){assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=612&&f.y+f.h<=792,f.key);assert.ok(f.y+f.h<694,'La Table des Bonus est protégée : '+f.key);}
for(let i=0;i<fields.length;i++)for(let j=i+1;j<fields.length;j++){const a=fields[i],b=fields[j];assert.ok(!(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.05&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.05),`Chevauchement : ${a.key} / ${b.key}`);}
const customCss=fs.readFileSync(path.join(ici,'fiche/champs.css'),'utf8');
const template={id,name:'Torg Eternity — fiche PJ vierge',system:'Torg Eternity',accent:'#80683f',schemaVersion:2,customCss,pages:[{id:'page-1',label:'Fiche de personnage',width:612,height:792,orientation:'portrait',backgroundData:'data:image/png;base64,'+fond.toString('base64'),fields}]};
const runtime=fs.readFileSync(path.join(ici,'fiche/runtime.js'),'utf8'),style=fs.readFileSync(path.join(ici,'fiche/interface.css'),'utf8');
const manifest={format:'character-sheet-studio-html',formatVersion:1,template};
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Torg Eternity — fiche PJ vierge</title><style>${style}\n${customCss}</style></head><body>
<header class="toolbar"><strong>TORG ETERNITY</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer><input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>Remplir la fiche de Torg</h2><p>Une page fidèle à l’image fournie : toutes les données de Vikas ont été retirées. La Table des Bonus est conservée à l’identique et ne porte aucun champ interactif.</p><p>« Zones » affiche les champs transparents. Les colonnes de rangs et de valeurs se remplissent manuellement ; les lignes « Autre » acceptent leurs propres noms et attributs. Aucun calcul de règles n’est ajouté.</p><p>Les repères verticaux sont cliquables et cumulatifs ; cliquer de nouveau le dernier repère sélectionné efface la piste. Les deux repères de Blessures sans libellé sont conservés tels quels. Le compteur Blessures et la piste de niveau de Blessures restent indépendants, comme les deux zones imprimées. La grande zone centrale sert à la description et aux notes ; aucun portrait n’est imprimé.</p><p>Zoom de 20 % à 400 %, Ctrl+molette, Ctrl++, Ctrl+− et Ctrl+0. Sauvegarde locale dans ce navigateur ; exporter le JSON pour conserver une copie. Réinitialiser demande confirmation. Imprimer produit une page au format du document d’origine.</p><button id="close-help">Fermer</button></dialog>
<script type="application/json" id="character-sheet-template">${JSON.stringify(manifest)}</script><script>${runtime}</script></body></html>`;
const cible=path.join(dossier,'torg-eternity-fiche-pj-vierge-interactive.html');fs.writeFileSync(cible,html);
fs.writeFileSync(path.join(sortie,'cles-du-modele.json'),JSON.stringify({templateId:id,zones:fields.length,nombreDeCles:keys.size,clesAjoutees:[...keys],clesRetirees:[],versionPrecedente:false},null,2)+'\n');
console.log(JSON.stringify({cible: path.relative(racine,cible),pages:1,zones:fields.length,cles:keys.size,tableDesBonus:'intacte, aucun champ superposé'}));
