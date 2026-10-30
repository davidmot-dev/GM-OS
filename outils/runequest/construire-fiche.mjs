// GM-OS Studio : reproduction des quatre pages fournies par David le 30/10/2026.
// Poppler conserve les transparences du PDF ; pdfjs/canvas assombrit les pages 3 et 4.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

const ici=path.dirname(fileURLToPath(import.meta.url)),racine=path.resolve(ici,'../..');
const source=process.argv[2]||path.join(racine,'docs/systems/runequest/Runequest Reference/[Runequest][7Ed.][FR] - Feuille de personnage.pdf');
const cible=process.argv[3]||path.join(racine,'docs/fiches/RuneQuest/runequest-fiche-personnage-interactive.html');
const sortie=path.join(racine,'output/fiches/runequest');fs.mkdirSync(sortie,{recursive:true});
const poppler=process.env.GMOS_PDFTOPPM||'C:/Users/david/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe';
execFileSync(poppler,['-r','144','-png',source,path.join(sortie,'poppler')]);
const octets=fs.readFileSync(source),pdf=await getDocument({data:new Uint8Array(octets)}).promise;
assert.equal(pdf.numPages,4,'La recette correspond aux quatre pages du PDF fourni.');
const labels=['Personnage, runes, combat et magie','Compétences et équipement','Famille, propriétés et allié','Histoire familiale'];
const pages=[];
for(let n=1;n<=4;n++){
 const p=await pdf.getPage(n);
 pages.push({id:`page-${n}`,label:labels[n-1],width:p.view[2]-p.view[0],height:p.view[3]-p.view[1],orientation:'portrait',backgroundData:'data:image/png;base64,'+fs.readFileSync(path.join(sortie,`poppler-${n}.png`)).toString('base64'),fields:[]});
}
await pdf.destroy();
// Relevés sur les rendus Poppler à 144 dpi. Les unités natives restent celles du PDF.
const F=(p,key,label,type,x,y,w,h,extra={})=>pages[p-1].fields.push({key,label,type,x:x/2,y:y/2,w:w/2,h:h/2,className:`rq-field rq-${type}`,...extra});
const T=(p,k,l,x,b,w,h=18,e={})=>F(p,k,l,'text',x,b-h+1,w,h,e);
const N=(p,k,l,x,b,w,h=18,e={})=>F(p,k,l,'number',x,b-h+1,w,h,e);
const A=(p,k,l,x,y,w,h)=>F(p,k,l,'textarea',x,y,w,h);
const C=(p,k,l,x,y,s=12)=>F(p,k,l,'checkbox',x,y,s,s);
const H=(p,k,l,v,x,y,w,h,cls='')=>F(p,k,l,'hotspot',x,y,w,h,{value:v,className:'rq-field rq-hotspot '+cls});
const petit={className:'rq-field rq-number rq-small'};

// 1 — identité.
for(const[k,l,x,b,w]of[
 ['name','Nom',177,242,181],['birth_year','Né·e en',423,242,106],['gender','Genre',187,276,139],
 ['origin','Origine',414,276,194],['tribe','Tribu',174,310,138],['clan','Clan',356,310,252],
 ['occupation','Occupation',722,242,198],['living_standard','Niveau de vie',859,276,57],
 ['campaign','Campagne',712,310,151],['player','Joueur',918,310,191]
])T(1,`identity.${k}`,l,x,b,w);
for(const[k,l,x,b,w]of[['age','Âge',566,242,43],['ransom','Rançon (lunars)',990,242,94],['reputation','Réputation',711,276,46],['base_income','Revenu de base (lunars)',1036,276,47]])N(1,`identity.${k}`,l,x,b,w);

// Les sept localisations et les quatre valeurs du bouclier.
for(const[k,l,x,y]of[
 ['head','Tête',329,440],['right_arm','Bras droit',140,507],['left_arm','Bras gauche',346,507],
 ['chest','Poitrine',270,536],['abdomen','Abdomen',254,600],['right_leg','Jambe droite',157,618],['left_leg','Jambe gauche',388,618]
]){N(1,`locations.${k}.armor`,`${l} — PA`,x,y+4,23,13,petit);N(1,`locations.${k}.hp`,`${l} — PV`,x,y+20,23,13,petit);}
for(const[k,l,b]of[['parry','Parade',539],['hp','PV',555],['damage','Dégâts',571]]){
 if(k==='damage')T(1,`shield.${k}`,`Bouclier — ${l}`,418,b,21,13,{className:'rq-field rq-text rq-small'});
 else N(1,`shield.${k}`,`Bouclier — ${l}`,418,b,21,13,petit);
}

// Affinités : chaque grand cartouche reçoit son %, la petite case son expérience.
for(const[k,l,x,y,cx,cy]of[
 ['fire','Feu/Ciel',677,423,708,409],['darkness','Ténèbres',774,541,807,528],
 ['water','Eau',727,647,760,635],['earth','Terre',519,640,509,626],
 ['air','Air',480,485,470,472],['moon','Lune',677,566,708,552],
 ['man','Homme',1002,441,1031,428],['beast','Bête',956,642,946,628],
 ['fertility','Fertilité',861,481,853,469],['harmony','Harmonie',861,522,853,511],
 ['truth','Vérité',861,563,853,552],['stasis','Stase',861,605,853,593],
 ['death','Mort',1090,481,1116,469],['disorder','Désordre',1090,522,1116,511],
 ['illusion','Illusion',1090,563,1116,552],['movement','Mouvement',1090,605,1116,593]
]){N(1,`runes.${k}.level`,`Rune ${l} — affinité`,x,y+18,29,19,petit);C(1,`runes.${k}.experience`,`Rune ${l} — expérience`,cx,cy,10);}

for(const[k,l,x,b,w]of[
 ['strength','FOR',190,764,44],['constitution','CON',319,764,44],['size','TAI',439,764,43],['dexterity','DEX',552,764,45],
 ['intelligence','INT',183,797,45],['power','POU',317,797,45],['charisma','CHA',439,797,43]
])N(1,`attributes.${k}`,l,x,b,w,24,{className:'rq-field rq-number rq-attribute'});
T(1,'combat.damage_bonus','Bonus dégâts',221,827,65,15);
N(1,'combat.size_rank','RA TAI',337,827,29,15);N(1,'combat.dexterity_rank','RA DEX',423,827,29,15);
N(1,'health.healing','Guérison par semaine',530,827,30,15);
N(1,'passions.honor.level','Honneur',200,898,27,16);C(1,'passions.honor.experience','Honneur — expérience',235,887,12);
for(let i=0;i<7;i++){
 const b=920+i*21.6;
 T(1,`passions.${i}.name`,`Passion ${i+1} — nature`,135,b,134,18);
 T(1,`passions.${i}.subject`,`Passion ${i+1} — sujet`,285,b,246,18);
 N(1,`passions.${i}.level`,`Passion ${i+1} — %`,552,b,35,18);
 C(1,`passions.${i}.experience`,`Passion ${i+1} — expérience`,592,b-11,13);
}
for(let i=0;i<4;i++){
 const b=1138+i*21.6;
 for(const[k,l,x,w]of[['name','Nom',135,151],['chance','%',291,38],['damage','Dégâts',341,80],['encumbrance','ENC',428,43],['durability','Durabilité',479,43],['strike_rank','RA',530,53]]){
  const cle=`weapons.melee.${i}.${k}`,label=`Arme de mêlée ${i+1} — ${l}`;
  if(['chance','encumbrance','durability','strike_rank'].includes(k))N(1,cle,label,x,b,w,17,petit);else T(1,cle,label,x,b,w,17,{className:'rq-field rq-text rq-small'});
 }
 C(1,`weapons.melee.${i}.experience`,`Arme de mêlée ${i+1} — expérience`,592,b-11,13);
}
for(let i=0;i<3;i++){
 const b=1259+i*21.6;
 for(const[k,l,x,w]of[['name','Nom',135,143],['chance','%',283,37],['damage','Dégâts',329,82],['encumbrance','ENC',417,41],['durability','Durabilité',469,39],['range','Portée',515,43],['rate','Cadence',564,23]]){
  const cle=`weapons.ranged.${i}.${k}`,label=`Arme à distance ${i+1} — ${l}`;
  if(['chance','encumbrance','durability'].includes(k))N(1,cle,label,x,b,w,17,petit);else T(1,cle,label,x,b,w,17,{className:'rq-field rq-text rq-small'});
 }
 C(1,`weapons.ranged.${i}.experience`,`Arme à distance ${i+1} — expérience`,592,b-11,13);
}
A(1,'combat.notes','Notes de combat',135,1347,283,126);

for(let i=0;i<2;i++){
 const dy=i*67.5;
 T(1,`cults.${i}.name`,`Culte ${i+1}`,677,753+dy,291);
 T(1,`cults.${i}.rank`,`Culte ${i+1} — rang`,1015,753+dy,94);
 N(1,`cults.${i}.rune_points.maximum`,`Culte ${i+1} — maximum de points de Rune`,748,774+dy,38,15);
 const xs=[795,817,841,865,889,913,937,960,984,1007,1030,1059,1089];
 for(let v=0;v<=12;v++)H(1,`cults.${i}.rune_points.current`,`Culte ${i+1} — ${v} point(s) de Rune`,v,xs[v],762+dy,v>9?21:16,16);
}
T(1,'cults.associated','Sous-culte ou culte associé',857,800,252);
N(1,'combat.spirit.skill','Combat spirituel — valeur au combat',757,902,34,16);C(1,'combat.spirit.experience','Combat spirituel — expérience',797,892,13);
T(1,'combat.spirit.damage','Dégâts du combat spirituel',1022,902,87,17);
T(1,'combat.spirit.notes','Notes de combat spirituel',683,928,426,18);
T(1,'magic.spirit.0','Magie spirituelle — ligne 1',638,988,362,18);N(1,'magic.spirit.charisma_limit','Magie spirituelle — limite CHA',1080,988,29,16);
for(let i=1;i<4;i++)T(1,`magic.spirit.${i}`,`Magie spirituelle — ligne ${i+1}`,638,988+i*21.6,471,18);
for(let i=0;i<5;i++)T(1,`magic.rune.${i}`,`Magie runique — ligne ${i+1}`,638,1114+i*21.6,471,18);
T(1,'magic.sorcery.0','Sorcellerie — runes et techniques, ligne 1',638,1259,371,18);N(1,'magic.sorcery.free_int','INT libre',1074,1259,35,16);
for(let i=1;i<3;i++)T(1,`magic.sorcery.${i}`,`Sorcellerie — runes et techniques, ligne ${i+1}`,638,1259+i*21.6,471,18);
A(1,'magic.notes','Notes de magie',826,1348,283,126);
// Mort et Inconscience sont des états séparés, sans convention de PV négatifs ajoutée.
for(const[k,l,xs]of[
 ['health.current','Points de vie',[[496,516,536,557,575],[445,477,509,541,573],[446,476,506,536,566]]],
 ['magic.current','Points de magie',[[690,710,731,751,771],[654,685,715,746,776],[653,682,711,740,769]]]
]){
 for(let v=0;v<=24;v++){
  const row=v<5?0:1+Math.floor((v-5)/5),col=v<5?v:(v-5)%5;
  const xx=xs[Math.min(row,2)][col];
  H(1,k,`${l} — ${v}`,v,xx,1353+row*22.4,row===0?18:row===1?22:26,20);
 }
}
H(1,'conditions.dead','Mort','dead',448,1353,45,20,'rq-state');
H(1,'conditions.unconscious','Inconscient','unconscious',654,1353,35,20,'rq-state');

// 2 — les valeurs de compétence et les seules cases d'expérience imprimées.
const mod=(k,l,x,b)=>N(2,`modifiers.${k}`,`${l} — modificateur`,x,b,36,16);
const skill=(key,label,col,b,check=true,special)=>{
 const x=[396,729,1058][col],cx=[436,770,1098][col];
 N(2,`skills.${key}.level`,`${label} — %`,x,b,35,17);
 if(check)C(2,`skills.${key}.experience`,`${label} — expérience`,cx,b-11,13);
 if(special)T(2,`skills.${key}.specialty`,`${label} — spécialité`,special[0],b,special[1],17);
};
mod('agility','Agilité',396,191);
for(const [k,l,b,s]of[['boating','Canotage',213],['drive','Conduite',234],['climb','Escalade',256],['dodge','Esquive',278],['ride','Monte',299,[202,148]],['swim','Nage',321],['jump','Saut',342]])skill(k,l,0,b,true,s);
mod('communication','Communication',396,389);
for(const[i,[k,l]]of[['art','Art'],['fast_talk','Baratin'],['sing','Chant'],['charm','Charme'],['act','Comédie'],['dance','Danse'],['disguise','Déguisement'],['orate','Éloquence'],['intimidate','Intimidation'],['intrigue','Intrigue'],['bargain','Marchandage']].entries())skill(k,l,0,410+i*21.6);
skill('language.0','Langue 1',0,668,true,[157,191]);skill('language.1','Langue 2',0,690,true,[157,191]);skill('native_language','Langue natale',0,738,true,[157,191]);
mod('knowledge','Connaissances',396,786);
for(const[k,l,b,check,s]of[
 ['farming','Agriculture',807,true],['alchemy','Alchimie',828,false],['battle','Bataille',850,true],['bureaucracy','Bureaucratie',871,false],
 ['animal_lore','Connaissance des animaux',893,false],['celestial_lore','Connaissance des cieux',915,false],
 ['cult_lore.0','Connaissance du culte 1',959,false,[154,194]],['cult_lore.1','Connaissance du culte 2',981,false,[154,194]],
 ['mineral_lore','Connaissance des minéraux',1001,false],['plant_lore','Connaissance des plantes',1022,false],['elder_race_lore','Connaissance des races Aînées',1043,false],
 ['region_lore.0','Connaissance de la région 1',1087,false,[154,194]],['region_lore.1','Connaissance de la région 2',1108,false,[154,194]],
 ['homeland_lore','Connaissance de la région natale',1131,false],['customs','Coutumes',1173,true,[158,190]],['local_customs','Coutumes locales',1197,true],
 ['herding','Élevage',1219,true],['evaluate','Évaluation',1240,true],['manage','Intendance',1261,true],['game','Jeu',1282,true],
 ['read_write.0','Lecture/Écriture',1303,false],['read_write.1','Lecture/Écriture — autre',1325,false,[158,190]],
 ['peaceful_cut','Mort paisible',1347,true],['navigation','Navigation',1368,true],['first_aid','Premiers soins',1389,true],
 ['library_use','Recherche en bibliothèque',1412,false],['treat_disease','Traitement des maladies',1432,true],['treat_poison','Traitement du poison',1455,true],['survival','Survie',1475,true]
])skill(k,l,0,b,check,s);
mod('magic','Magie',729,191);
for(const[k,l,b,check,s]of[
 ['prepare_body','Apprêter le corps',213,true],['herd_understanding','Compréhension des troupeaux',234,true],['spirit_combat','Combat spirituel',256,true],
 ['spirit_lore','Connaissance des esprits',278,false],['spirit_dance','Danse spirituelle',299,true],['sense_assassin','Détection d’assassin',321,true],
 ['sense_chaos','Détection du Chaos',342,true],['meditate','Méditation',364,true],['worship.0','Vénération 1',408,true,[493,191]],['worship.1','Vénération 2',429,true,[493,191]],['spirit_travel','Voyage spirituel',450,true]
])skill(k,l,1,b,check,s);
mod('manipulation','Manipulation',729,496);
for(const[k,l,b,s]of[['craft.0','Artisanat 1',518,[553,131]],['craft.1','Artisanat 2',540,[524,160]],['conceal','Dissimulation',562],['sleight','Escamotage',583],['devise','Invention',605],['instrument','Musique',626,[550,134]]])skill(k,l,1,b,true,s);
mod('perception','Perception',729,673);
for(const[k,l,b,s]of[['insight_species','Empathie (même espèce)',694],['insight.0','Empathie 1',716,[552,130]],['insight.1','Empathie 2',737,[556,126]],['listen','Écoute',759],['scan','Observation',780],['search','Recherche',802],['track','Pistage',824]])skill(k,l,1,b,true,s);
mod('stealth','Discrétion',729,870);skill('hide','Camouflage',1,892);skill('move_quietly','Déplacement silencieux',1,913);
for(let i=0;i<3;i++){skill(`other.${i}`,`Autre compétence ${i+1}`,1,983+i*21.6);T(2,`skills.other.${i}.name`,`Autre compétence ${i+1} — nom`,470,983+i*21.6,245,17);}
mod('melee','Armes de mêlée',1058,191);
for(const[i,[k,l]]of[['dagger','Dague'],['short_sword','Épée courte'],['broadsword','Épée large'],['one_hand_axe','Hache à 1 main'],['two_hand_axe','Hache à 2 mains'],['kopis','Kopis'],['one_hand_spear','Lance à 1 main'],['two_hand_spear','Lance à 2 mains'],['one_hand_mace','Masse à 1 main'],['rapier','Rapière'],['pike','Sarisse']].entries())skill(`melee.${k}`,l,2,213+i*21.6);
for(let i=0;i<3;i++){const b=451+i*21.6;skill(`melee.other.${i}`,`Autre arme de mêlée ${i+1}`,2,b);T(2,`skills.melee.other.${i}.name`,`Autre arme de mêlée ${i+1} — nom`,810,b,235,17);}
mod('ranged','Armes à distance',1058,540);
for(const[i,[k,l]]of[['composite_bow','Arc composite'],['short_bow','Arc court'],['throwing_dagger','Dague de lancer'],['sling','Fronde'],['throwing_axe','Hache de lancer'],['javelin','Javelot'],['staff_lasso','Perche-lasso']].entries())skill(`ranged.${k}`,l,2,562+i*21.6);
for(let i=0;i<2;i++){const b=713+i*21.6;skill(`ranged.other.${i}`,`Autre arme à distance ${i+1}`,2,b);T(2,`skills.ranged.other.${i}.name`,`Autre arme à distance ${i+1} — nom`,810,b,235,17);}
mod('shields','Boucliers',1058,780);
for(const[i,[k,l]]of[['small','Petit bouclier'],['medium','Bouclier moyen'],['large','Grand bouclier'],['other','Autre bouclier']].entries())skill(`shields.${k}`,l,2,802+i*21.6);
T(2,'skills.shields.other.name','Autre bouclier — nom',810,866.8,235,17);
mod('natural','Armes naturelles',1058,913);
for(const[i,[k,l]]of[['kick','Coup de pied'],['fist','Coup de poing'],['grapple','Saisie'],['other.0','Arme naturelle 1'],['other.1','Arme naturelle 2']].entries())skill(`natural.${k}`,l,2,942+i*21.6);
for(let i=0;i<2;i++)T(2,`skills.natural.other.${i}.name`,`Arme naturelle ${i+1} — nom`,810,1006.8+i*21.6,235,17);
for(let i=0;i<4;i++)T(2,`magic.extra.${i}`,`Magie supplémentaire — ligne ${i+1}`,470,1125+i*18,640,16);
for(let i=0;i<6;i++)T(2,`notes.${i}`,`Notes — ligne ${i+1}`,470,1227+i*18,640,16);
T(2,'equipment.0','Matériel, trésors et objets magiques — ligne 1',470,1370,452,17);
N(2,'equipment.encumbrance.maximum','ENC maximale',983,1370,47,16);N(2,'equipment.encumbrance.current','ENC',1063,1370,47,16);
for(let i=1;i<6;i++)T(2,`equipment.${i}`,`Matériel, trésors et objets magiques — ligne ${i+1}`,470,1370+i*18.8,640,17);
for(const[k,l,x,w]of[['wheels','Roues',525,31],['lunars','Lunars',622,31],['clacks','Clacks',720,31],['bolgs','Bolgs',810,32],['property','Biens (lunars)',897,213]])N(2,`wealth.${k}`,l,x,1490,w,16);

// 3 — famille : M/F sont des choix exclusifs, Mort·e est une case indépendante.
for(const[k,l,x,b,w,cx]of[['grandfather','Grand-père',219,270,309,593],['grandmother','Grand-mère',225,295,303,593],['father','Père',672,270,362,1098],['mother','Mère',697,295,337,1098]]){
 T(3,`family.${k}.name`,l,x,b,w,18);C(3,`family.${k}.dead`,`${l} — mort·e`,cx,b-11,12);
}
for(const[group,label,x,mx,fx,dx]of[['relatives','Oncle ou tante',136,472,498,593],['siblings','Frère ou sœur',641,977,1003,1098]])for(let i=0;i<12;i++){
 const b=357+i*25.4,k=`family.${group}.${i}`;
 T(3,`${k}.name`,`${label} ${i+1} — nom`,x,b,312,18);
 H(3,`${k}.sex`,`${label} ${i+1} — M`,'male',mx,b-11,12,12,'rq-choice');H(3,`${k}.sex`,`${label} ${i+1} — F`,'female',fx,b-11,12,12,'rq-choice');
 C(3,`${k}.dead`,`${label} ${i+1} — mort·e`,dx,b-11,12);
}
T(3,'family.famous_ancestors','Ancêtres célèbres',136,693,469,18);T(3,'family.leaders','Dirigeants de clan et de tribu',641,693,469,18);
for(let i=0;i<2;i++){
 const b=831+i*25.4,k=`family.spouses.${i}`;
 T(3,`${k}.name`,`Conjoint ${i+1} — nom`,196,b,127,18);T(3,`${k}.marriage_type`,`Conjoint ${i+1} — type de mariage`,331,b,119,18);
 H(3,`${k}.sex`,`Conjoint ${i+1} — M`,'male',477,b-11,12,12,'rq-choice');H(3,`${k}.sex`,`Conjoint ${i+1} — F`,'female',503,b-11,12,12,'rq-choice');C(3,`${k}.dead`,`Conjoint ${i+1} — mort·e`,593,b-11,12);
}
T(3,'family.events','Événements familiaux',223,881,380,18);
for(let r=0;r<3;r++)for(let c=0;c<2;c++){
 const i=r*2+c,b=828+r*25.4,x=c?880:641,mx=c?977:738,fx=c?1002:764,dx=c?1097:859,k=`family.children.${i}`;
 T(3,`${k}.name`,`Enfant ${i+1} — nom`,x,b,77,18);
 H(3,`${k}.sex`,`Enfant ${i+1} — M`,'male',mx,b-11,12,12,'rq-choice');H(3,`${k}.sex`,`Enfant ${i+1} — F`,'female',fx,b-11,12,12,'rq-choice');C(3,`${k}.dead`,`Enfant ${i+1} — mort·e`,dx,b-11,12);
}
for(const[k,l,x,b]of[['last_omen','Augure de l’an dernier',285,1012],['raids','Raids',177,1033],['heroquest','Quête héroïque',238,1055],['last_harvest','Récoltes de l’an dernier',297,1077],['current_omen','Augure de l’année en cours',315,1098]]){
 T(3,`harvest.${k}.notes`,l,x,b,480-x,18);T(3,`harvest.${k}.modifier`,`${l} — modificateur`,486,b,120,18);
}
N(3,'income.base','Revenu de base',242,1168,66,18);T(3,'income.notes','Revenu — notes particulières',478,1168,128,18);
for(let i=0;i<6;i++)T(3,`property.description.${i}`,`Propriétés — description, ligne ${i+1}`,i===0?723:641,1012+i*21.6,i===0?387:i===5?357:469,18);
N(3,'property.acres','Carucates',1069,1120,41,16);
T(3,'property.tenants.0','Métayers — ligne 1',720,1147,390,18);T(3,'property.tenants.1','Métayers — ligne 2',641,1169,469,18);

// Un seul bloc compagnon est imprimé : monture, élémentaire ou allié, au choix du joueur.
T(3,'companion.name','Compagnon — nom',169,1273,132,17);T(3,'companion.type','Compagnon — type',337,1273,111,17);
for(const[k,l,x,b,w]of[['strength','FOR',169,1295,27],['constitution','CON',236,1295,25],['size','TAI',292,1295,34],['dexterity','DEX',364,1295,25],['intelligence','INT',427,1295,21],['power','POU',170,1317,26],['charisma','CHA',236,1317,25]])N(3,`companion.attributes.${k}`,`Compagnon — ${l}`,x,b,w,16,petit);
N(3,'companion.movement','Compagnon — DÉP',300,1317,26,16,petit);N(3,'companion.health.maximum','Compagnon — PV',355,1317,34,16,petit);N(3,'companion.magic.current','Compagnon — PM',422,1317,26,16,petit);
T(3,'companion.damage_bonus','Compagnon — bonus dégâts',228,1338,58,16);
N(3,'companion.dexterity_rank','Compagnon — RA DEX',341,1338,28,16,petit);N(3,'companion.size_rank','Compagnon — RA TAI',421,1338,27,16,petit);
T(3,'companion.passions','Compagnon — passions',194,1360,254,18);T(3,'companion.runes','Compagnon — runes',179,1382,204,18);N(3,'companion.rune_points','Compagnon — points de Rune',410,1382,38,16);
T(3,'companion.magic.0','Compagnon — magie, ligne 1',178,1404,270,18);T(3,'companion.magic.1','Compagnon — magie, ligne 2',136,1426,312,18);
T(3,'companion.note','Compagnon — note',173,1448,172,18);N(3,'companion.ransom','Compagnon — rançon',403,1448,30,16,petit);
for(let i=0;i<3;i++){
 const b=1295+i*21.6;
 for(const[k,l,x,w]of[['name','Attaque',468,74],['chance','%',547,42],['damage','Dégâts',599,58],['range','Portée',664,56],['strike_rank','RA',729,24],['points','Points',759,24]]){
  if(['chance','strike_rank','points'].includes(k))N(3,`companion.attacks.${i}.${k}`,`Compagnon — attaque ${i+1}, ${l}`,x,b,w,17,petit);
  else T(3,`companion.attacks.${i}.${k}`,`Compagnon — attaque ${i+1}, ${l}`,x,b,w,17,{className:'rq-field rq-text rq-small'});
 }
}
for(let i=0;i<3;i++)T(3,`companion.skills.${i}`,`Compagnon — compétences, ligne ${i+1}`,i===0?558:468,1361+i*21.6,i===0?225:315,18);
for(let i=0;i<8;i++){
 const b=1295+i*21.6;
 for(const[k,l,x,w]of[['name','Localisation',798,152],['range','d20',959,62],['armor','Armure',1029,44],['hp','PV ou durabilité',1083,27]]){
  if(['armor','hp'].includes(k))N(3,`companion.locations.${i}.${k}`,`Compagnon — localisation ${i+1}, ${l}`,x,b,w,17,petit);
  else T(3,`companion.locations.${i}.${k}`,`Compagnon — localisation ${i+1}, ${l}`,x,b,w,17,{className:'rq-field rq-text rq-small'});
 }
}
for(let v=0;v<=21;v++)H(3,'companion.health.current',`Compagnon — PV ${v}`,v,v<10?605+v*17.9:485+(v-10)*25.1,v<10?1412:1434,v<10?16:23,18);
H(3,'companion.dead','Compagnon mort','dead',573,1412,30,18,'rq-state');

// 4 — histoire familiale : les deux colonnes Événements / Résultats sont saisissables.
T(4,'history.origin','Région d’origine (historique)',240,258,355,18);
for(const[k,l,x,b]of[['love_family','Amour (famille)',241,323],['loyalty_clan','Loyauté (clan)',228,344],['loyalty_tribe','Loyauté (tribu)',228,366],['hate','Haine',174,387],['other','Autre passion',174,409]])T(4,`history.passions.${k}`,l,x,b,595-x,18);
for(const[i,[k,l]]of[['favored_grandparent','Grand-parent favori'],['favored_parent','Parent favori'],['other_grandparent','Autre grand-parent'],['other_parent','Autre parent']].entries()){
 const b=260+i*43.2;
 const x=[767,720,768,727][i];T(4,`history.lineage.${k}.name`,l,x,b,1095-x,18);T(4,`history.lineage.${k}.occupation`,`${l} — occupation`,732,b+21.6,363,18);
}
for(const[group,label,years,ys]of[
 ['grandparent','Grand-parent',['1582','1597','1602','1603_1604','1605'],[609,631,652,674,724]],
 ['parent','Parent',['1608','1610','1613','1615','1616','1617','1618','1619','1620','1621'],[898,920,941,963,985,1006,1028,1049,1071,1092]],
 ['adventurer','Aventurier',['1622','1623','1624','1625'],[1240,1261,1283,1304]]
])for(let i=0;i<years.length;i++){
 const b=ys[i],k=`history.${group}.${years[i]}`;
 T(4,`${k}.events`,`${label} ${years[i]} — événements`,194,b,407,18);
 T(4,`${k}.results`,`${label} ${years[i]} — résultats`,612,b,group==='adventurer'?483:401,18);
 if(group!=='adventurer')C(4,`${k}.killed`,`${label} ${years[i]} — tué·e`,1083,b-12,12);
}
for(let i=0;i<2;i++){T(4,`history.treasures.${i}`,`Trésors et aubaines — ligne ${i+1}`,129,1403+i*21.6,466,18);T(4,`history.ancestors.${i}`,`Ancêtres célèbres et réputation — ligne ${i+1}`,629,1403+i*21.6,466,18);}

const customCss=fs.readFileSync(path.join(ici,'fiche/champs.css'),'utf8');
const template={id:'runequest-fr',name:'RuneQuest — fiche de personnage',system:'RuneQuest',accent:'#245247',schemaVersion:2,customCss,pages};
const cles=new Map();
for(const p of pages)for(const f of p.fields){
 assert.ok(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=p.width&&f.y+f.h<=p.height,JSON.stringify(f));
 if(cles.has(f.key))assert.equal(f.type,'hotspot',`Clé répétée : ${f.key}`);cles.set(f.key,f.type);
}
for(const p of pages)for(let i=0;i<p.fields.length;i++)for(let j=i+1;j<p.fields.length;j++){
 const a=p.fields[i],b=p.fields[j];
 const overlap=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>.05&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>.05;
 assert.ok(!overlap,`Zones superposées p.${p.id} : ${a.key} et ${b.key}`);
}
const style=fs.readFileSync(path.join(ici,'fiche/interface.css'),'utf8'),runtime=fs.readFileSync(path.join(ici,'fiche/runtime.js'),'utf8');
const manifeste={format:'character-sheet-studio-html',formatVersion:1,template};
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RuneQuest — fiche de personnage interactive</title><style>${style}\n${customCss}</style></head><body>
<header class="toolbar"><strong>RuneQuest</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer><input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>Remplir la fiche RuneQuest</h2><p>Les quatre fonds sont ceux du PDF fourni, sans recoloration. « Zones » révèle les champs. Les petites cases d’expérience et les cases Mort·e / Tué·e sont indépendantes ; M / F est un choix exclusif.</p><p>PV, PM et points de Rune : cliquez directement les nombres imprimés pour renseigner la jauge. Recliquez la valeur courante pour revenir à zéro. Mort et Inc sont des états séparés, activables en cliquant leur libellé ; ils ne modifient pas les nombres.</p><p>Les lignes d’armes, de magie, de famille, de propriétés et d’histoire sont toutes saisissables. Les colonnes Événements et Résultats sont distinctes. Les champs répétés du PDF restent indépendants. Aucun calcul de règles ni changement automatique d’une Rune opposée n’est ajouté : inscrivez les valeurs de votre personnage.</p><p>Zoom de 20 à 400 %, Ctrl+molette, Ctrl++, Ctrl+− ; Ctrl+0 ajuste la page. Les données s’enregistrent dans ce navigateur. Exportez régulièrement un JSON pour garder une copie ; un import remplace la fiche après confirmation si elle est remplie.</p><p>« Imprimer » imprime les quatre pages aux dimensions originales du PDF. Aucun portrait n’est ajouté : le document n’en prévoit pas. Le manifeste est importable dans le moteur GM-OS ; sa correspondance avec le pilote s’effectue séparément.</p><button id="close-help">Fermer</button></dialog>
<script id="character-sheet-template" type="application/json">${JSON.stringify(manifeste).replaceAll('<','\\u003c')}</script><script>${runtime}</script></body></html>`;
fs.mkdirSync(path.dirname(cible),{recursive:true});fs.writeFileSync(cible,html);
const bilan={source:path.basename(source),sha256:createHash('sha256').update(octets).digest('hex'),templateId:template.id,pages:pages.map(p=>({id:p.id,width:p.width,height:p.height,champs:p.fields.length})),zones:pages.flatMap(p=>p.fields).length,cles:cles.size,types:Object.fromEntries([...new Set(cles.values())].map(t=>[t,[...cles.values()].filter(v=>v===t).length]))};
fs.writeFileSync(path.join(sortie,'construction.json'),JSON.stringify(bilan,null,2)+'\n');console.log(JSON.stringify({cible,...bilan},null,2));
