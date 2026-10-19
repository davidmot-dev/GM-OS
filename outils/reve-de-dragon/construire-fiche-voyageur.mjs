// GM-OS Studio, atelier fiche — livret fourni par David, 19/10/2026.
// Les images sont rendues depuis le PDF. Aucun fond ni police réseau dans le HTML produit.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {corrigerChampsNumeriques,AIDE_NUMERIQUE_RDD} from './fiche-voyageur/champs-numeriques.mjs';

const racine=fileURLToPath(new URL('../../',import.meta.url));
const [source,cible=path.join(racine,'docs/fiches/Rêve de Dragon/reve-de-dragon-livret-voyageur-interactif.html')]=process.argv.slice(2);
if(!source)throw Error('Usage : node outils/reve-de-dragon/construire-fiche-voyageur.mjs <livret.pdf> [fiche.html]');
const octets=fs.readFileSync(source),doc=await getDocument({data:new Uint8Array(octets),useSystemFonts:true}).promise;
assert.equal(doc.numPages,5,'Cette recette vise les cinq pages du Livret du voyageur 2.0.');
const pages=[];
for(let n=1;n<=5;n++){
    const p=await doc.getPage(n),v=p.getViewport({scale:2}),canvas=createCanvas(Math.ceil(v.width),Math.ceil(v.height));
    await p.render({canvas,canvasContext:canvas.getContext('2d'),viewport:v}).promise;
    pages.push({id:`page-${n}`,label:['Personnage','Équipement','Sorts et rituels','Feuille de route','Archétype'][n-1],width:595,height:842,orientation:'portrait',
        backgroundData:`data:image/webp;base64,${canvas.toBuffer('image/webp',94).toString('base64')}`,fields:[]});
}
await doc.destroy();
const f=(p,key,label,type,x,y,w,h=10,options={})=>pages[p-1].fields.push({key,label,type,x,y,w,h,className:`rdd-field rdd-${type}`,...options});
const ligne=(p,key,label,x,base,w,type='text',options={})=>f(p,key,label,type,x,base-10,w,10,options);
const nombre=(p,key,label,x,base,w=22,options={})=>ligne(p,key,label,x,base,w,'number',options);
const texte=(p,key,label,x,y,w,h,options={})=>f(p,key,label,'textarea',x,y,w,h,options);
const choix=(p,key,label,value,x,y,w,h)=>f(p,key,label,'hotspot',x,y,w,h,{value});
const nomCopie=(p)=>f(p,`headers.${p}.name`,'Nom du personnage (copie)','text',134,p===5?102:114,235,25,{readonly:true,derive:{source:'identity.name',operation:'copy'},className:'rdd-field rdd-text rdd-name'});
f(1,'identity.name','Nom du personnage','text',134,114,235,25,{className:'rdd-field rdd-text rdd-name'});
for(const p of [2,3,4,5])nomCopie(p);

// Page 1 : toutes les valeurs et leurs colonnes d'expérience imprimées.
for(const [key,label,x,y,w]of[
    ['age','Âge',151,173,29],['gender','Sexe',214,173,28],['height','Taille en cm',279,173,36],['weight','Poids',352,173,37],
    ['hair','Cheveux',173,190,67],['eyes','Yeux',269,190,57],['beauty','Beauté',367,190,28],
    ['birthHour','Heure de naissance',217,207,160],['birthHourNumber','Numéro de l’heure de naissance',386,207,12]
])ligne(1,`identity.${key}`,label,x,y,w,['beauty','birthHourNumber'].includes(key)?'number':'text');
ligne(1,'identity.distinctive.first','Signes particuliers — première ligne',231,224,294);
ligne(1,'identity.distinctive.second','Signes particuliers — seconde ligne',131,241,394);
const attributs=[['size','Taille',271],['appearance','Apparence',289],['constitution','Constitution',307],['strength','Force',325],['agility','Agilité',343],['dexterity','Dextérité',361],
    ['sight','Vue',389],['hearing','Ouïe',407],['smellTaste','Odorat-Goût',425],['will','Volonté',452.5],['intellect','Intellect',470.5],['empathy','Empathie',488.5],['dream','Rêve',506.5],['luck','Chance',524.5]];
for(const [key,label,y]of attributs){nombre(1,`attributes.${key}.value`,label,247,y,23);if(key!=='size')nombre(1,`attributes.${key}.experience`,`${label} — expérience`,279,y,16);}
for(const [key,label,y]of[['melee','Mêlée',552.5],['shoot','Tir',570.5],['throw','Lancer',588.5],['dodge','Dérobée',606.5]])nombre(1,`derived.${key}`,label,247,y,23);
nombre(1,'resources.life.base','Vie de départ',247,634,23);nombre(1,'resources.endurance.base','Endurance de départ',247,652,23);
for(const [key,label,x,y,w]of[['sustenance','SUST',168,679.5,18],['constitutionThreshold','SC',220,679.5,18],['encumbrance','ENC',268,679.5,25],['damageBonus','Bonus aux dommages',168,698.5,20],['armorPenalty','Malus d’armure',276,698.5,18]])nombre(1,`resources.${key}`,label,x,y,w);
const generales=[['craft','Bricolage'],['sing','Chant'],['run','Course'],['cook','Cuisine'],['dance','Danse'],['draw','Dessin'],['stealth','Discrétion'],['climb','Escalade'],['jump','Saut'],['seduce','Séduction'],['awareness','Vigilance']];
const particulieres=[['carpentry','Charpenterie'],['act','Comédie'],['trade','Commerce'],['ride','Équitation'],['masonry','Maçonnerie'],['music','Musique'],['pickpocket','Pickpocket'],['survivalCity','Survie en cité'],['survivalOutdoors','Survie extérieur'],['survivalDesert','Survie — désert'],['survivalForest','Survie — forêt'],['survivalIce','Survie — glaces'],['survivalSwamp','Survie — marais'],['survivalMountain','Survie — montagne'],['survivalUnderground','Survie — sous-sol'],['disguise','Travestissement']];
const specialisees=[['acrobatics','Acrobatie'],['surgery','Chirurgie'],['gaming','Jeu'],['juggle','Jonglerie'],['leatherwork','Maroquinerie'],['metalwork','Métallurgie'],['swim','Natation'],['navigation','Navigation'],['goldsmith','Orfèvrerie'],['locksmith','Serrurerie']];
const connaissances=[['alchemy','Alchimie'],['astrology','Astrologie'],['botany','Botanique'],['writing','Écriture'],['legends','Légendes'],['medicine','Médecine'],['zoology','Zoologie']];
for(const [liste,x,depart,pas]of[[generales,389.5,302,12.4],[particulieres,511,301,12.4],[specialisees,389.5,483,12.4],[connaissances,511,533,12.4]]){
    liste.forEach(([cle,label],i)=>{nombre(1,`skills.${cle}.level`,label,x,depart+i*pas,17);nombre(1,`skills.${cle}.experience`,`${label} — expérience`,x+23,depart+i*pas,12);});
}
for(const [cle,label,x,y]of[['oniros','Oniros',368,644.5],['hypnos','Hypnos',368,657],['narcos','Narcos',489,644.5],['thanatos','Thanatos',489,657]]){
    nombre(1,`draconic.${cle}.level`,`${label} — niveau`,x,y,16);
    nombre(1,`draconic.${cle}.pathExperience`,`${label} — expérience de voie`,x+21,y,14);
    nombre(1,`draconic.${cle}.spellExperience`,`${label} — expérience de sorts`,x+40,y,14);
}
for(let i=0;i<7;i++){
    const y=710+i*12.4;
    if(i>=3)ligne(1,`combat.${i}.name`,`Combat — arme ${i+1}`,318,y,97);
    for(const [key,label,x,w]of[['level','Niveau',425,19],['initiative','Initiative',457,20],['damage','Bonus dommages',490,19],['experience','Expérience',522,19]])nombre(1,`combat.${i}.${key}`,`${i<3?['Corps à corps','Dague de mêlée','Esquive'][i]:`Arme ${i+1}`} — ${label}`,x,y,w);
}
for(let i=0;i<4;i++)for(let col=0;col<2;col++){
    const x=52+129*col,y=747.5+i*12.4,k=i+col*4;
    ligne(1,`skills.custom.${k}.name`,`Autre compétence ${k+1} — nom`,x,y,77);
    nombre(1,`skills.custom.${k}.level`,`Autre compétence ${k+1} — niveau`,x+83,y,15);
    nombre(1,`skills.custom.${k}.experience`,`Autre compétence ${k+1} — expérience`,x+105,y,11);
}

// Page 2 : contenants, bourse, armes et tous les cartouches personnalisables.
nombre(2,'equipment.worn.encumbrance','Porté sur soi — encombrement',249,223,20);
for(let i=0;i<12;i++)ligne(2,`equipment.worn.${i}`,`Porté sur soi — ligne ${i+1}`,141,243.5+11.2*i,128);
for(let bloc=0;bloc<2;bloc++){
    const base=[392,663][bloc],prefixe=`equipment.containers.${bloc}`;
    ligne(2,`${prefixe}.name`,`Contenant ${bloc+1} — nom`,139,base,110);
    nombre(2,`${prefixe}.encumbrance`,`Contenant ${bloc+1} — encombrement`,254,base,14);
    for(let i=0;i<[21,10][bloc];i++){
        const y=[414,687][bloc]+11.2*i;
        ligne(2,`${prefixe}.items.${i}.name`,`Contenant ${bloc+1} — objet ${i+1}`,141,y,110);
        nombre(2,`${prefixe}.items.${i}.encumbrance`,`Contenant ${bloc+1} — encombrement objet ${i+1}`,254,y,14);
    }
}
for(const [i,key,label,y]of[[0,'gold','Or (10s)',243.5],[1,'silver','Argent (1s)',254.5],[2,'bronze','Bronze (10d)',265.5],[3,'tin','Étain (1d)',276.5]])nombre(2,`equipment.money.${key}`,label,376,y,15);
for(let i=0;i<2;i++){ligne(2,`equipment.money.other.${i}.name`,`Autre monnaie ${i+1}`,297,288.5+i*11.2,74);nombre(2,`equipment.money.other.${i}.amount`,`Autre monnaie ${i+1} — quantité`,376,288.5+i*11.2,15);}
for(let bloc=0;bloc<6;bloc++){
    const base=[318,392,489,599,663,727][bloc],n=[4,6,7,3,3,4][bloc],premiere=[333.5,414,512,622,686.5,751][bloc];
    ligne(2,`equipment.pouches.${bloc}.name`,`Pochette ${bloc+1} — nom`,296,base,76);
    nombre(2,`equipment.pouches.${bloc}.encumbrance`,`Pochette ${bloc+1} — encombrement`,377,base,14);
    for(let i=0;i<n;i++){
        ligne(2,`equipment.pouches.${bloc}.items.${i}.name`,`Pochette ${bloc+1} — objet ${i+1}`,297,premiere+11.2*i,74);
        nombre(2,`equipment.pouches.${bloc}.items.${i}.encumbrance`,`Pochette ${bloc+1} — encombrement objet ${i+1}`,377,premiere+11.2*i,14);
    }
}
nombre(2,'equipment.weapons.encumbrance','Armes — encombrement',532,223,12);
for(let i=0;i<7;i++){
    const y=243.5+11.2*i;ligne(2,`equipment.weapons.${i}.name`,`Arme d’équipement ${i+1} — nom`,416,y,82);
    nombre(2,`equipment.weapons.${i}.damage`,`Arme d’équipement ${i+1} — bonus dommages`,504,y,10);
    nombre(2,`equipment.weapons.${i}.resistance`,`Arme d’équipement ${i+1} — résistance`,519,y,10);
    nombre(2,`equipment.weapons.${i}.encumbrance`,`Arme d’équipement ${i+1} — encombrement`,534,y,11);
}
for(let i=0;i<3;i++){
    const y=346+11.2*i;ligne(2,`equipment.armor.${i}.name`,`Armure ${i+1} — nom`,416,y,97);
    nombre(2,`equipment.armor.${i}.protection`,`Armure ${i+1} — protection`,519,y,11);nombre(2,`equipment.armor.${i}.penalty`,`Armure ${i+1} — détérioration`,535,y,11);
}
for(let bloc=0;bloc<6;bloc++)for(let col=0;col<2;col++){
    const x=416+71*col,base=[392,452,508,566,621,679][bloc],k=bloc*2+col,premiere=[414.5,470.5,526.5,583,639,695.5][bloc];
    ligne(2,`equipment.boxes.${k}.name`,`Rubrique libre ${k+1} — titre`,x,base,43);nombre(2,`equipment.boxes.${k}.encumbrance`,`Rubrique libre ${k+1} — encombrement`,x+47,base,14);
    for(let i=0;i<3;i++)ligne(2,`equipment.boxes.${k}.items.${i}`,`Rubrique libre ${k+1} — ligne ${i+1}`,x+2,premiere+11.2*i,57);
}
nombre(2,'equipment.totalEncumbrance','Encombrement total',506,765,29);

// Page 3 : une ligne par sort/rituel ; la roue sert de repère sélectionnable sans calcul.
for(let i=0;i<21;i++){
    const y=249.5+i*16.18;
    for(const [key,label,x,w,type]of[['path','Voie',138,21,'text'],['name','Nom',164,157,'text'],['tmr','TMR',328,30,'text'],['difficulty','R',364,16,'number'],['dreamCost','r',386,17,'number'],['cellBonus','Bonus de case',408,154,'text']])ligne(3,`spells.${i}.${key}`,`Sort ou rituel ${i+1} — ${label}`,x,y,w,type);
}
ligne(3,'magic.notes.first','Notes magiques — première ligne',185,608,169);
texte(3,'magic.notes.rest','Notes magiques',137,611,218,177,{className:'rdd-field rdd-textarea rdd-notes'});
const heures=['Le Vaisseau','La Sirène','Le Faucon','La Couronne','Le Dragon','Les Épées','La Lyre','Le Serpent','Le Poisson Acrobate','L’Araignée','Le Roseau','Le Château Dormant'];
for(let i=1;i<=12;i++){
    const angle=(15+(9-i)*30)*Math.PI/180,x=459.5+74*Math.sin(angle),y=693.5-74*Math.cos(angle);
    choix(3,'astrology.referenceHour',`Repère zodiacal — ${heures[i-1]}`,heures[i-1],x-9,y-9,18,18);
}

// Page 4 : compteurs et pistes du papier, sans soins ni récupération automatiques.
nombre(4,'resources.dream.current','Points de rêve actuels',173,229,17);
ligne(4,'resources.dream.history.first','Rêve — historique, première ligne',196,229,159);ligne(4,'resources.dream.history.second','Rêve — historique, seconde ligne',134,250,221);
nombre(4,'resources.endurance.current','Endurance actuelle',205,277,150);
ligne(4,'resources.endurance.history','Endurance — historique',134,298,221);
nombre(4,'resources.life.current','Points de vie actuels',166,326,18);ligne(4,'resources.life.history','Vie — historique',188,326,143);
nombre(4,'route.constitutionThreshold','Seuil de Constitution (copie du SC)',339,326,11,{readonly:true,derive:{source:'resources.constitutionThreshold',operation:'copy'}});
nombre(4,'resources.dream.recoveryThreshold','Seuil de rêve',248,364,10);ligne(4,'magic.halfDream','Position du demi-rêve',329,364,24);
for(let i=0;i<7;i++){
    const y=414+i*16.2;
    for(const [key,label,x,w,type]of[['path','Voie',134,14,'text'],['name','Sort',154,130,'text'],['tmr','TMR',292,23,'text'],['birthHour','Heure de naissance',319,16,'text'],['dream','Rêve',342,12,'number']])ligne(4,`reservedSpells.${i}.${key}`,`Sort en réserve ${i+1} — ${label}`,x,y,w,type);
}
texte(4,'magic.dragonEffects','Queues et souffles de Dragon',134,536,220,87,{className:'rdd-field rdd-textarea rdd-dragon-effects'});
ligne(4,'magic.repression','Refoulement',215,640,139);
nombre(4,'route.food','Nourriture absorbée',221,671,53);nombre(4,'route.water','Eau absorbée',309,671,45);
nombre(4,'route.morale','Moral',178,694,94);nombre(4,'route.dissolution','Dissolution',304,694,11);nombre(4,'route.exaltation','Exaltation',339,694,14);
nombre(4,'resources.luck.current','Points de chance actuels',188,717,13);ligne(4,'resources.luck.history','Chance — historique',208,717,59);
nombre(4,'resources.destiny','Points de destinée et dixièmes de voyage',329,717,25);nombre(4,'resources.stress','Stress',179,739,174);
ligne(4,'calendar.month','Mois courant',180,774,102);
nombre(4,'route.generalState','État général',514,229,21);
let fatigue=0;
for(let row=0;row<8;row++)for(let groupe=0;groupe<(row<2?3:1);groupe++)for(let box=0;box<5;box++){
    choix(4,'tracks.fatigue',`Fatigue — case ${fatigue+1}, ligne ${row===0?'0':`−${row}`}`,++fatigue,[393.5,448.5,501.8][groupe]+9.2*box,241.5+12.35*row,7.1,7.1);
}
for(const [key,label,n,y]of[['light','légère',5,409],['serious','grave',2,510],['critical','critique',1,562]])for(let i=0;i<n;i++){
    choix(4,`injuries.${key}.count`,`${i+1} blessure(s) ${label}(s)`,i+1,376.4,y+i*16.3,7.1,7.1);
    ligne(4,`injuries.${key}.${i}.notes`,`Blessure ${label} ${i+1} — notes et soins`,387,y+8+i*16.3,165);
}
for(let i=0;i<8;i++)choix(4,'tracks.inebriation',`Éthylisme — degré ${i}`,String(i),376.5+75.5*Math.floor(i/4),608.5+13.2*(i%4),7.2,7.2);
texte(4,'route.hazards','Aléas du voyage',376,688,178,64,{className:'rdd-field rdd-textarea rdd-hazards'});
const joursX=[];
for(let semaine=0;semaine<4;semaine++){
    for(let j=0;j<6;j++)joursX.push({x:298+64.5*semaine+7.7*j,w:6.4});
    joursX.push({x:347+64.5*semaine,w:10.8});
}
joursX.forEach(({x,w},i)=>{choix(4,'calendar.day',`Jour du mois ${i+1}`,String(i+1),x,i%7===6?762.1:765.2,w,i%7===6?11.2:7.1);
    nombre(4,`calendar.astral.${i+1}`,`Nombre astral annoncé — jour ${i+1}`,x-0.5,786,w+1,{className:'rdd-field rdd-number rdd-astral'});});

// Page 5 : l'Archétype n'est jamais une copie des niveaux de la vie actuelle.
const melees=[['polearm','Arme d’hast'],['shield','Bouclier'],['unarmed','Corps à corps'],['dagger','Dague'],['sword1h','Épée 1 main'],['sword2h','Épée 2 mains'],['dodge','Esquive'],['flail','Fléau'],['axe1h','Hache 1 main'],['axe2h','Hache 2 mains'],['spear','Lance'],['mace1h','Masse 1 main'],['mace2h','Masse 2 mains']];
const tirs=[['crossbow','Arbalète'],['bow','Arc'],['dagger','Dague'],['whip','Fouet'],['sling','Fronde'],['javelin','Javelot']];
for(const [groupe,liste,x,y,nBlancs]of[['general',generales,225,246.5,3],['particular',particulieres,378,247,3],['melee',melees,225,448.5,3],['ranged',tirs,225,669,4],['specialized',specialisees,378,500.5,2],['knowledge',connaissances,378,669,3]]){
    liste.forEach(([cle,label],i)=>nombre(5,`archetype.${groupe}.${cle}`,`Archétype — ${label}`,x,y+i*10.5,33));
    for(let i=0;i<nBlancs;i++){
        const base=y+(liste.length+i)*10.5,left=x===225?141:288;
        ligne(5,`archetype.${groupe}.custom.${i}.name`,`Archétype — ${groupe}, compétence libre ${i+1}`,left,base,x-left-4);
        nombre(5,`archetype.${groupe}.custom.${i}.level`,`Archétype — ${groupe}, niveau libre ${i+1}`,x,base,33);
    }
}
for(const [i,cle]of ['oniros','hypnos','narcos','thanatos'].entries())nombre(5,`archetype.draconic.${cle}`,`Archétype — ${cle}`,500,269.5+10.5*i,33);
for(let i=0;i<9;i++){ligne(5,`archetype.other.${i}.name`,`Archétype — autre compétence ${i+1}`,439,370.5+i*16.2,76);nombre(5,`archetype.other.${i}.level`,`Archétype — niveau autre compétence ${i+1}`,522,370.5+i*16.2,22);}

const id='reve-de-dragon-voyageur-fr';
const customCss=`.sheet[data-template="${id}"] .rdd-field{font-family:Georgia,"Times New Roman",serif;font-size:9px;color:#17130f;background:transparent;border:0;padding:0 1px;box-sizing:border-box;line-height:10px}.sheet[data-template="${id}"] .rdd-number{text-align:center;appearance:textfield}.sheet[data-template="${id}"] .rdd-textarea{resize:none;overflow:auto;white-space:pre-wrap}.sheet[data-template="${id}"] .rdd-name{font-size:16px;line-height:23px;text-align:center;font-weight:bold}.sheet[data-template="${id}"] .hotspot.active{background:rgba(100,41,27,.55);box-shadow:inset 0 0 0 1px #54291e}.sheet[data-template="${id}"] .rdd-hotspot{border-radius:1px}`;
const ruledCss=`.sheet[data-template="${id}"] .rdd-notes{line-height:16.2px;padding-top:5px}.sheet[data-template="${id}"] .rdd-dragon-effects{line-height:16.2px;padding-top:2px}.sheet[data-template="${id}"] .rdd-hazards{line-height:14.3px;padding-top:2px}.sheet[data-template="${id}"] .rdd-astral{font-size:6px;padding:0;letter-spacing:-.25px}`;
const manifeste={format:'character-sheet-studio-html',formatVersion:1,template:{id,name:'Rêve de Dragon — Livret du voyageur',system:'Rêve de Dragon',accent:'#783b2c',schemaVersion:2,customCss:customCss+ruledCss,pages}};
corrigerChampsNumeriques(manifeste.template);
const cles=new Map();
for(const page of pages)for(const champ of page.fields){
    assert.ok(champ.x>=0&&champ.y>=0&&champ.x+champ.w<=page.width&&champ.y+champ.h<=page.height,`Champ hors page : ${champ.key}`);
    const avant=cles.get(champ.key);if(avant)assert.ok(champ.type==='hotspot'&&avant.type==='hotspot',`Doublon : ${champ.key}`);cles.set(champ.key,champ);
}
const runtime=fs.readFileSync(new URL('./fiche-voyageur/runtime.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('./fiche-voyageur/interface.css',import.meta.url),'utf8');
const html=`<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Rêve de Dragon — Livret du voyageur interactif</title><style>${css}\n${customCss+ruledCss}</style>\n<script type="application/json" id="character-sheet-template">${JSON.stringify(manifeste).replaceAll('<','\\u003c')}</script></head>
<body><header class="toolbar"><strong>Rêve de Dragon</strong><nav aria-label="Navigation du livret"><button id="prev" aria-label="Page précédente">‹</button><select id="page" aria-label="Page du livret"></select><button id="next" aria-label="Page suivante">›</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><label><input id="zoom" type="number" min="20" max="400" step="10" aria-label="Zoom en pourcentage"> %</label><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport" aria-label="Fiche de personnage"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite"></span><button id="help">Aide</button></footer><input id="file" type="file" accept="application/json,.json" hidden><dialog id="help-dialog"><h2>Le livret, à l’écran</h2><p>La fiche reprend les cinq pages du PDF. Les champs sont vides au départ. Cliquez sur Zones pour les repérer ; survolez un champ pour lire son intitulé.</p><p>Les pistes de fatigue et de blessures se remplissent jusqu’à la case choisie. Recliquez la dernière case pour remettre la piste à zéro. Éthylisme, jour du mois et roue zodiacale sélectionnent un seul repère.</p><p>La fatigue reproduit les 60 cases imprimées, sans calculer les cases à neutraliser selon l’Endurance. La répartition et les règles se suivent avec le meneur. Aucun soin, bonus astrologique ou changement de caractéristique n’est calculé ici.</p><p>Ctrl + molette, Ctrl + et Ctrl − règlent le zoom ; Ctrl + 0 ajuste la page. La sauvegarde reste dans ce navigateur : exportez un JSON pour conserver une copie ou changer d’appareil.</p><p>L’impression inclut les cinq pages et leurs fonds. Choisissez « Taille réelle », marges nulles, sans en-têtes ni pieds de page dans la fenêtre d’impression.</p><button id="close-help">Fermer</button></dialog><script>${runtime}</script></body></html>\n`;
const htmlFinal=html.replace(customCss+ruledCss,manifeste.template.customCss).replace('<h2>Le livret, à l’écran</h2>',`<h2>Le livret, à l’écran</h2><p>${AIDE_NUMERIQUE_RDD}</p>`);
fs.mkdirSync(path.dirname(cible),{recursive:true});fs.writeFileSync(cible,htmlFinal);
const rapport={source:path.basename(source),sha256:createHash('sha256').update(octets).digest('hex'),template:id,pages:pages.map(p=>({page:p.id,label:p.label,champs:p.fields.length})),champs:pages.flatMap(p=>p.fields).length,cles:cles.size,octets:Buffer.byteLength(htmlFinal),cible:path.relative(racine,cible)};
fs.mkdirSync(path.join(racine,'scratch/reve-de-dragon-fiche'),{recursive:true});fs.writeFileSync(path.join(racine,'scratch/reve-de-dragon-fiche/construction.json'),JSON.stringify(rapport,null,2));console.log(JSON.stringify(rapport,null,2));
