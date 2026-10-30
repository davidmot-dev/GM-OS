import './charger-typescript.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import {empreinte,lignesSVG,signalWav} from './archives-de-recette.mjs';
import {herosRuneQuest as heros,lieuxRuneQuest as lieux,pnjRuneQuest as pnj,indicesRuneQuest as indices,scenesRuneQuest as scenes,titreRuneQuest as titre} from './runequest-scenario.mjs';
import {ecrireRecetteRuneQuest} from './runequest-recette.mjs';
const {santeAlignee,santePrincipaleDeLaFiche}=await import('../../src/modules/combat/logic/SanteDuCombattant.ts');
const SORTIE=path.resolve('output/campagnes-tests/runequest'),SOURCE='Export Dirvers/corriges/RQ_driver_gmos_finir.gmos-driver';
export const DATE_RQ='2026-10-30T12:00:00.000Z';
const INSTANT=Date.parse(DATE_RQ),VERSION=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const {gameDriver:pilote,sheetTemplate:fiche}=JSON.parse(new AdmZip(SOURCE).readAsText('state.json'));
assert.equal(pilote.id,'custom-1793114851695');assert.equal(pilote.version,'2.0.0');assert.equal(fiche.id,'tpl-1793114851695');assert.equal(fiche.sections.flatMap(s=>s.fields).length,313);
assert.ok(pilote.jet.runequest);assert.equal(pilote.combat.initiativeFormula,'ra_dex + ra_tai');
const rattachement=JSON.parse(fs.readFileSync(new URL('./cthulhu-hack-joueurs.json',import.meta.url),'utf8'));
// Seul le relevé autorisé de joueurs est réutilisé ; aucun ancien PJ ni contenu privé.
assert.equal(empreinte(fs.readFileSync(rattachement.source)),rattachement.sha256,'L’export fourni a changé : revérifier le relevé.');
assert.deepEqual(rattachement.joueurs.map(p=>p.id),['p-1','p-2','p-3']);
const champs=new Map(fiche.sections.flatMap(s=>s.fields).map(f=>[f.id,f]));
const id=(type,slug)=>`recette-rq-${type}-${slug}`,ref=(slug,ext='svg')=>`recette-rq-media-${slug}.${ext}`,C=id('campagne','bornes');
fs.mkdirSync(SORTIE,{recursive:true});
const medias=new Map(),ajouter=(slug,contenu,ext='svg')=>medias.set(ref(slug,ext),{chemin:`assets/${ext==='wav'?'audio':'images'}/${slug}.${ext}`,contenu:Buffer.from(contenu),mime:ext==='wav'?'audio/wav':'image/svg+xml'});
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function document(nom,dessin){return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#f3eee3"/><style>text{font-family:Georgia,serif;fill:#243f37}</style><path d="M25 100H1175M25 725H1175" stroke="#8d2029" stroke-width="3"/><text x="50" y="67" font-size="33" font-weight="700">${xml(nom)}</text>${dessin}<text x="50" y="765" font-size="15">RUNEQUEST · LES BORNES DU GUÉ · DOCUMENT ORIGINAL DE RECETTE</text></svg>`;}
for(const[slug,nom,,description,,voisins]of lieux){
 const dessin=voisins.map((v,i)=>{const x=55+i*370;return `<path d="M600 340L${x+165} 520" stroke="#877750" stroke-width="4"/><rect x="${x}" y="520" width="330" height="95" fill="#e3dfcb" stroke="#243f37"/><text x="${x+12}" y="570" font-size="18">${xml(lieux.find(l=>l[0]===v)[1])}</text>`;}).join('');
 ajouter(`carte-${slug}`,document(nom,lignesSVG(description,55,155,80)+dessin+`<rect x="365" y="285" width="470" height="105" fill="#ded8bf" stroke="#8d2029" stroke-width="3"/><text x="390" y="345" font-size="24">${xml(nom)}</text>`+lignesSVG('Plan schématique sans échelle ; positions et distances se règlent à la table.',55,675,80)));
}
for(const h of heros)ajouter(`pj-${h.slug}`,document(h.nom,lignesSVG(h.metier)+lignesSVG(h.description,55,250,80)+lignesSVG(h.histoire,55,410,80)));
for(const[slug,nom,,,description,replique]of pnj)ajouter(`pnj-${slug}`,document(nom,lignesSVG(description,55,160,80)+lignesSVG(replique,55,330,80)));
for(const[slug,nom,texte]of indices)ajouter(`indice-${slug}`,document(nom,lignesSVG(texte,55,160,80)));
ajouter('compagnie',document('Un passage pour trois familles',lignesSVG('Arven, Déléa et Koros : protéger les témoins, comprendre les copies et rendre l’eau au clos.',55,170,80)+lignesSVG('Trois issues : accord négocié, preuves publiques ou réparation commune. La magie n’est jamais la clef unique.',55,340,80)));
for(const[slug,mode]of[['rivage','conduites'],['bronze','timbreuse'],['assemblee','annonce']])ajouter(slug,signalWav(mode),'wav');

function valeurs(h,maj={}){
 const v=Object.fromEntries([...champs].map(([k,f])=>[k,f.defaultValue??(['number','gauge','rating','formula'].includes(f.type)?0:f.type==='checkbox'?false:'')]));
 Object.assign(v,{nom:h.nom,joueur:'',patrie:'Sartar',tribu:'Communauté fictive des Trois-Pierres',clan_tribu:'Les familles du gué — fiction de recette',occupation:h.metier,niveau_de_vie:'Libre — valeur choisie pour recette',genre:'',annee_naissance:'1604',age:21,campagne:titre,
  for:12,con:12,tai:12,dex:12,int:12,pou:12,cha:12,pv_max:12,pm_max:12,points_de_vie:12,points_de_magie:12,pr_max:3,points_de_rune:3,pr_max_2:1,points_de_rune_2:1,
  bonus_degats:'0',degats_spirituels:'1D6',vitesse_guerison:2,enc_max:12,enc_porte:6,ra_dex:3,ra_tai:2,deplacement:8,
  rune_air:60,rune_terre:40,rune_fertilite:60,rune_mort:40,rune_harmonie:70,rune_desordre:30,rune_stase:40,rune_mouvement:60,rune_verite:70,rune_illusion:30,rune_homme:80,rune_bete:20,
  passion_honneur:60,passion1_nom:'Loyauté',passion1_sujet:'Les trois familles du gué',passion1:70,passion2_nom:'Amour',passion2_sujet:'Famille',passion2:60,reputation:10,
  langue_natale_nom:'Heortling',langue_natale:65,connaissance_culte_nom:h.culte,connaissance_culte:50,veneration_nom:h.culte,veneration:50,culte:h.culte,culte_rang:'Initié — profil de recette',culte_2:'Culte associé choisi pour la recette',culte_2_rang:'Initié — réserve indépendante',culte_associe:'Démonstration de deux réserves séparées',
  arme1_nom:h.slug==='delea'?'Lance courte':h.slug==='koros'?'Dague':'Épée large',arme1:50,arme1_degats:h.slug==='koros'?'1D4+2':'1D8+1',arme1_ra:h.slug==='delea'?2:3,arme1_enc:1,arme1_durabilite:12,bouclier_nom:'Bouclier moyen',bouclier:50,bouclier_pv:12,bouclier_degats:'1D4',bouclier_ra:3,
  tir1_nom:'Javelot',tir1:40,tir1_degats:'1D10',tir1_ra:3,tir1_enc:1,tir1_durabilite:8,tir1_portee:'20 m — portée choisie pour le cas',tir1_cadence:'Selon déclaration de la table',
  pv_jambe_droite:4,pv_jambe_gauche:4,pv_abdomen:4,pv_poitrine:5,pv_bras_droit:3,pv_bras_gauche:3,pv_tete:4,
  sorts_spirituels:'Soins (1) : vérifier le coût et l’effet au livre ; dépense à la main après le jet.',sorts_runiques:'RECETTE : exercice abstrait à 1 PR, sans effet officiel revendiqué ; tester les suites du résultat et les deux réserves.',sorcellerie:'RECETTE : exercice abstrait avec une Rune et une technique maîtrisées ; coût minimal 2 PM, manipulation à la table.',limite_magie_spirituelle:12,int_libre:10,
  autre_competence_1_nom:'Sorcellerie — exercice de RECETTE',autre_competence_1:45,lecture_ecriture:50,combat_spirituel:50,
  possessions:h.materiel.join('\n'),richesse_lunars:20,notes:'Profil avancé aux valeurs choisies pour éprouver le pilote, pas une création novice par budget. Dérivés saisis, aucun calcul automatique du personnage revendiqué.',notes_combat:'L’initiative du pilote est RA DEX + RA TAI. Ajouter le RA de l’arme à la table. Les dégâts localisés et les conséquences restent manuels.',notes_magie:'Aucun coût magique automatique du pilote ; tests POU×5, Rune et compétence du sort au panneau, puis comptabilité manuelle.'},h.competences,maj);
 for(const k of Object.keys(v))assert.ok(champs.has(k),'Champ inventé : '+k);
 return v;
}
const objet=(slug,name,type='other',quantity=1,description='Objet de fiction de recette ; aucun effet automatique.')=>({id:id('objet',slug),name,type,rarity:'common',quantity,weight:1,value:0,description,properties:{}});
function personnage(h,i,campagne=C,code='',maj={}){
 const name=code?`${code} — ${h.nom}`:h.nom,sheetData=valeurs(h,maj);sheetData.nom=name;sheetData.joueur=rattachement.joueurs[i].realName;
 const healthSystem=santeAlignee(undefined,santePrincipaleDeLaFiche(pilote,sheetData));
 return {id:code?`${campagne}-pj-${code.toLowerCase()}`:id('pj',h.slug),name,classRace:h.metier,campaignId:campagne,templateId:fiche.id,systemId:pilote.id,portraitUrl:ref(`pj-${h.slug}`),tokenUrl:ref(`pj-${h.slug}`),hp:healthSystem.data.current,maxHp:healthSystem.data.max,healthSystem,sheetData,
 description:h.description,playerNotes:h.histoire,gmNotes:`SECRET_MJ_RQ_RECETTE : ${h.motivation}`,donneesModifieesLe:INSTANT,inventory:h.materiel.join('\n'),inventoryItems:h.materiel.map((nom,n)=>({...objet(`${h.slug}-${n}`,nom),id:`${campagne}-${code||h.slug}-objet-${n}`})),relations:[],faction:'Les témoins du gué',hubOptions:{showHP:true,showMP:true,showAP:false,showInventory:true,showRelations:true}};
}
const joueurs=heros.map((h,i)=>({...rattachement.joueurs[i],avatarUrl:'',isOnline:false,characters:[personnage(h,i)]})),pjIds=joueurs.flatMap(p=>p.characters.map(c=>c.id));
const scenario={
 campaign:{id:C,name:`RECETTE RUNEQUEST — ${titre}`,system:pilote.id,activeLocationIds:[id('lieu','halle')],wallpaperUrl:ref('compagnie'),themeDuJeu:true,langueDeForge:'fr',description:'Aventure originale de recette ; communauté fictive des Trois-Pierres, en Sartar. Profils avancés aux valeurs choisies.',synopsis:'Trois copies d’un accord, des bornes tournées et une rivière détournée menacent une communauté. Protéger les témoins et préserver le passage.',gmNotes:'SECRET_MJ_RQ_RECETTE : Merek a payé un retard de caravane ; la fuite d’eau vient du drain de Tovan. Preuve publique, accord ou réparation commune résolvent la crise sans duel ni magie obligatoires.'},
 players:joueurs,
 entities:pnj.map(([slug,name,role,lieu,description,roleplayingNotes,secret],i)=>{const pc=personnage(heros[i%3],i%3);return {id:id('pnj',slug),name,type:'npc',role,status:'alive',campaignId:C,avatar:ref(`pnj-${slug}`),description,roleplayingNotes,gmSecretInfo:`SECRET_MJ_RQ_RECETTE : ${secret}`,templateId:fiche.id,sheetData:{...pc.sheetData,nom:name},hp:pc.hp,maxHp:pc.maxHp,healthSystem:pc.healthSystem,linkedMapIds:[id('lieu',lieu)],relations:[],faction:['merek','oren','keld'].includes(slug)?'Obstacles du passage':'Communauté du gué',isVisibleByPlayers:['sera','hesra','luma','venna'].includes(slug)};}),
 atlasMaps:lieux.map(([slug,name,type,narrativeDescription,gmNotes,voisins])=>({id:id('lieu',slug),name,type,narrativeDescription,gmNotes,campaignId:C,fileUrl:ref(`carte-${slug}`),isVideo:false,isVisited:slug==='halle',linkedEntities:[...pnj.filter(p=>p[3]===slug).map(p=>({id:id('lien',`${slug}-${p[0]}`),name:p[1],category:'npc',entityId:id('pnj',p[0])})),...voisins.map(v=>({id:id('lien',`${slug}-${v}`),name:lieux.find(l=>l[0]===v)[1],category:'lieu',mapId:id('lieu',v)}))]})),
 clues:indices.map(([slug,title,content,lieu,owner,isRevealed])=>({id:id('indice',slug),campaignId:C,title,content,locationId:id('lieu',lieu),ownerId:id('pnj',owner),mediaUrl:ref(`indice-${slug}`),isRevealed,...(isRevealed?{revealedAt:INSTANT}:{})})),
 wikiEntries:[...lieux.map(([slug,title,,content])=>({id:id('wiki',slug),campaignId:C,title,content,category:'location',tags:['gué','recette'],imageUrls:[ref(`carte-${slug}`)],linkedEntityIds:pnj.filter(p=>p[3]===slug).map(p=>id('pnj',p[0]))})),{id:id('wiki','communaute'),campaignId:C,title:'Trois familles, un passage',content:'Fiction originale, sans appartenance tribale canonique imposée. Les engagements vivent dans les Passions et les relations. Les Runes n’exécutent aucun changement automatique ; la comptabilité des sorts reste à la main. Les SVG sont des documents schématiques, pas des portraits illustrés.',category:'lore',tags:['communauté','recette'],imageUrls:[ref('compagnie')],linkedEntityIds:[id('pnj','sera')]}],
 timelineEvents:['Accord commun','Drain ouvert','Copies rescellées','La caravane s’arrête'].map((title,i)=>({id:id('chrono',String(i)),campaignId:C,date:`2026-10-${26+i}`,title,description:`Repère de tri fictif J${i-3} ; la date ISO n’est pas le calendrier gloranthien.`,type:'lore',locationId:id('lieu','halle'),involvedEntityIds:[id('pnj','sera')]})),
 actes:['Le passage retenu','Les copies et la source','La parole devant témoins','Clôture et ateliers hors fiction'].map((titre,i)=>({id:id('acte',String(i+1)),campaignId:C,ordre:i+1,titre,resume:titre,acheve:false,notesDuMeneur:'Aucun indice essentiel bloqué par une réussite unique.'})),
 scenes:scenes.map(s=>({id:id('scene',s[0]),campaignId:C,acteId:id('acte',String(s[1])),ordre:scenes.filter(x=>x[1]===s[1]).indexOf(s)+1,titre:s[2],lieuId:id('lieu',s[3]),entiteIds:s[4].map(x=>id('pnj',x)),indiceIds:s[5].map(x=>id('indice',x)),personnagesIds:pjIds,resume:s[6],enjeux:s[6],descriptionNarrative:lieux.find(l=>l[0]===s[3])[3]+' '+s[6],notesDuMeneur:'SECRET_MJ_RQ_RECETTE : '+s[4].map(x=>pnj.find(p=>p[0]===x)[6]).join(' '),repliques:s[4].map(x=>pnj.find(p=>p[0]===x)).map(p=>`${p[1]} : ${p[5]}`).join('\n'),origine:'preparee',importance:['corps','runes','bilan'].includes(s[0])?'optionnelle':'principale',enchainements:s[7].map(x=>({vers:id('scene',x),libelle:'Suivre cette piste'})),passages:[],creeeLe:INSTANT,...(['accueil','bronze','source','assemblee'].includes(s[0])?{momentDeStoryboardId:id('moment',s[0])}:{})})),
 rencontres:[['passage','R01 — Le passage retenu','oren','luma'],['camp','R02 — L’ordre contesté','keld','venna'],['assemblee','R03 — Protéger les témoins','merek','branna']].map(([scene,nom,ennemi,allie],i)=>({id:id('rencontre',String(i)),campaignId:C,sceneId:id('scene',scene),nom,creeeLe:INSTANT,notes:'Combat optionnel ; profils humains choisis pour recette. RA d’arme, armure par zone et effets de blessures arbitrés à la table.',lignes:[{genre:'entite',entiteId:id('pnj',ennemi),faction:'enemy'},{genre:'entite',entiteId:id('pnj',allie),faction:'ally'}]})),
 sessions:[1,2,3,4].map(n=>({id:id('seance',String(n)),campaignId:C,number:n,date:DATE_RQ.slice(0,10),status:'planned',publicSummary:['Garder le passage ouvert.','Comparer les copies et réparer la source.','Protéger les témoins.','Clore la fiction puis ouvrir les ateliers.'][n-1],gmSecrets:'SECRET_MJ_RQ_RECETTE : deux causes différentes, un retard volontaire et une fuite accidentelle ; aucune magie obligatoire.',sessionEntityIds:pjIds,acteId:id('acte',String(n)),scenesPrevuesIds:scenes.filter(s=>s[1]===n).map(s=>id('scene',s[0])),checklist:[{id:id('check',String(n)),text:'Consigner le résultat et la preuve ; vérifier les droits des secrets.',isCompleted:false}]})),
 lootPool:[objet('corde','Corde neuve'),objet('semences','Paniers de semences','consumable',3),objet('bandages','Bandages','consumable',3),objet('rations','Rations','consumable',6),objet('tablette','Tablette scellée'),objet('lunars','Lunars de recette','currency',101,'Lot arithmétique : 33 par PJ, reliquat 2 ; pas de dépense magique associée.'),objet('outil','Outils du drain'),objet('rubans','Rubans de témoignage')].map(o=>({...o,campaignId:C})),lootReserve:[{...objet('reserve','Caisse des réparations'),campaignId:C}],lootHistory:[],messages:[],journaux:[],requiredDriverData:[pilote],requiredTemplateData:[fiche],
 moments:['accueil','bronze','source','assemblee'].map((slug,i)=>{const sc=scenes.find(s=>s[0]===slug);return {id:id('moment',slug),campaignId:C,name:`M0${i+1} — ${sc[2]}`,description:'Plan schématique et signal synthétique original.',color:'#8d2029',icon:'Map',mapUrl:'data:image/svg+xml;base64,'+medias.get(ref(`carte-${sc[3]}`)).contenu.toString('base64'),isMapVideo:false,soundAtmosphereId:id('ambiance','gue'),soundPadId:id('pad',i%2?'bronze':'rivage'),titre:sc[2],titreDuree:5};}),
 atmospheres:[{id:id('ambiance','gue'),campagneId:C,name:'RECETTE RuneQuest — le gué',pads:Object.fromEntries(['rivage','bronze','assemblee'].map(son=>[id('pad',son),{id:id('pad',son),title:son,filePath:ref(son,'wav'),volume:0.2,color:'#8d2029',midiMapping:null,keyMapping:null,isActive:false,linkedLightSceneId:null}]))}],
 playlists:[{id:id('playlist','gue'),campagneId:C,name:'RECETTE RuneQuest — signaux',pads:['rivage','bronze'].map(son=>({id:id('musique',son),label:son,url:ref(son,'wav'),type:'local',loopA:null,loopB:null}))}],
 tuilesDeLumiere:['Le gué','Le foyer','Le serment'].map((name,i)=>({id:`SCENE_${C}_${i+1}`,name,campagneId:C,icon:'Lightbulb',color:'#8d2029',lightStates:{},sceneBrightness:30}))
};
for(const [i,c]of joueurs.flatMap(p=>p.characters).entries())c.relations.push({targetId:id('pnj',['sera','venna','daran'][i]),targetType:'npc',type:'ally',libelle:'Mandat de confiance',description:'Lien de fiction original.'});
function labo(suffixe,nom){
 const convertir=v=>typeof v==='string'?(v.includes('recette-rq-media-')?v:v.replaceAll('recette-rq-',`recette-rq-${suffixe}-`)):Array.isArray(v)?v.map(convertir):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[convertir(k),convertir(x)])):v;
 const s=convertir(scenario);s.campaign.name=nom;s.campaign.description='LABORATOIRE HORS FICTION — profils aux valeurs choisies, réinitialisables indépendamment de 01.';s.campaign.synopsis='Suivre le cahier de cas, pas l’ordre d’une aventure.';s.players.forEach(p=>p.characters=[]);s.rencontres=[];
 s.scenes=s.scenes.map(x=>({...x,titre:'LAB — '+x.titre,personnagesIds:[],descriptionNarrative:'Hors fiction : support de recette ; consulter le cahier.',enjeux:'Éprouver le pilote et consigner observé/preuve.'}));return s;
}
const corps=labo('corps','RECETTE RUNEQUEST — Laboratoire 02 · Aptitudes, combat et santé');
const runes=labo('runes','RECETTE RUNEQUEST — Laboratoire 03 · Runes, Passions et magie');
const corpsCas=[['C01',{arme1:3}],['C02',{arme1:56}],['C03',{arme1:120}],['C04',{arme1:140}],['C05',{points_de_vie:2}],['C06',{points_de_vie:0}],['C07',{pv_bras_droit:0,points_de_vie:9}],['C08',{pv_tete:-4,points_de_vie:4}],['C09',{pa_jambe_droite:5,pv_jambe_droite:2,points_de_vie:8}]];
const runesCas=[['M01',{points_de_magie:0}],['M02',{points_de_magie:1}],['M03',{points_de_rune:0}],['M04',{pou:15,pm_max:15,points_de_magie:15,pv_max:13,points_de_vie:13}],['M05',{rune_air:90}],['M06',{passion1:85}],['M07',{autre_competence_1:55,int:16,lecture_ecriture:65,int_libre:12}],['M08',{points_de_rune:1,points_de_rune_2:0}],['M09',{int_libre:0,points_de_magie:2}]];
for(const[s,cas]of[[corps,corpsCas],[runes,runesCas]]){
 for(const[n,[code,maj]]of cas.entries())s.players[n%3].characters.push(personnage(heros[n%3],n%3,s.campaign.id,code,maj));
 const ids=s.players.flatMap(p=>p.characters.map(c=>c.id));s.scenes.forEach(x=>x.personnagesIds=ids);s.sessions.forEach(x=>x.sessionEntityIds=ids);
 s.players.flatMap(p=>p.characters).forEach(c=>c.sheetData.notes+=' '+c.name.split(' — ')[0]+' : voir le cahier de recette.');
}
function ecrire(nom,etat){
 const zip=new AdmZip(),assetMap=[...medias].map(([originalRef,f])=>({originalRef,relativePath:f.chemin,checksum:empreinte(f.contenu),sizeBytes:f.contenu.length,mimeType:f.mime}));
 const manifeste={schemaVersion:1,bundleType:'campaign',bundleId:etat.campaign.id+'-v1',campaignId:etat.campaign.id,campaignName:etat.campaign.name,exportedAt:DATE_RQ,gmosVersion:VERSION,requiredDriverIds:[pilote.id],requiredTemplateIds:[fiche.id],assetMap,stats:{entityCount:etat.entities.length,sessionCount:etat.sessions.length,atlasMapCount:etat.atlasMaps.length,wikiEntryCount:etat.wikiEntries.length,clueCount:etat.clues.length,assetCount:assetMap.length,totalSizeBytes:assetMap.reduce((s,a)=>s+a.sizeBytes,0)}};
 for(const[n,c]of[['manifest.json',JSON.stringify(manifeste,null,2)],['state.json',JSON.stringify(etat,null,2)]])zip.addFile(n,Buffer.from(c));
 for(const f of medias.values()){zip.addFile(f.chemin,f.contenu);fs.mkdirSync(path.dirname(path.join(SORTIE,f.chemin)),{recursive:true});fs.writeFileSync(path.join(SORTIE,f.chemin),f.contenu);}
 for(const e of zip.getEntries())e.header.time=new Date(DATE_RQ);zip.writeZip(path.join(SORTIE,nom));
 fs.writeFileSync(path.join(SORTIE,nom.replace('.gmos','.json')),JSON.stringify(etat,null,2)+'\n');return {fichier:nom,campagne:etat.campaign.id,personnages:etat.players.flatMap(p=>p.characters).length,medias:medias.size,sha256:empreinte(fs.readFileSync(path.join(SORTIE,nom)))};
}
const archives=[ecrire('01-Les-Bornes-du-gue.gmos',scenario),ecrire('02-Aptitudes-Combat-et-Sante.gmos',corps),ecrire('03-Runes-Passions-et-Magie.gmos',runes)];
fs.copyFileSync(SOURCE,path.join(SORTIE,'RuneQuest-2.0.0.gmos-driver'));
const cas=ecrireRecetteRuneQuest(SORTIE,{scenario,corps,runes,archives,rattachement,pilote,fiche,date:DATE_RQ});
const sourcesRegles=fs.readdirSync('docs/systems/runequest/rules').filter(n=>n.endsWith('.md')).map(n=>{const p='docs/systems/runequest/rules/'+n,b=fs.readFileSync(p);assert.match(b.toString('utf8'),/relu: true/);return {fichier:p,sha256:empreinte(b)};});
const inventaire={version:1,genereLe:DATE_RQ,rattachement,pilote:{id:pilote.id,version:pilote.version,source:SOURCE,sha256:empreinte(fs.readFileSync(SOURCE))},gabarit:{id:fiche.id,champs:champs.size,html:'runequest-fr'},archives,modules:{specifiques:0,outils:['Combat-OS','Atlas','Trame','Nexus Wiki','Table-OS','Storyboard','Sound-OS','Music-OS','Light-OS']},casDeRecette:cas.length,sourcesRegles};
fs.writeFileSync(path.join(SORTIE,'inventaire.json'),JSON.stringify(inventaire,null,2)+'\n');fs.writeFileSync(path.join(SORTIE,'provenance.json'),JSON.stringify({...inventaire,generateur:'runequest.mjs v1',gmosVersion:VERSION},null,2)+'\n');
console.log(JSON.stringify({sortie:SORTIE,archives,casDeRecette:cas.length},null,2));
