import './charger-typescript.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { herosRdd as heros, lieuxRdd as lieux, pnjRdd as pnj, indicesRdd as indices, scenesRdd as scenes, titreRdd } from './rdd-scenario.mjs';
import { preparerModuleRdd } from './rdd-modules.mjs';
import { atelierArchives, DATE_RECETTE, lignesSVG, signalWav } from './archives-de-recette.mjs';
import { ecrireRecetteRdd } from './rdd-recette.mjs';
const { reprendreFicheDeVoyageur, ALIAS_DU_VOYAGEUR } = await import('../../src/modules/session/logic/ficheDeVoyageur.ts');
const { initialiserSanteVoyageur, projeterSanteVoyageur } = await import('../../src/modules/session/logic/santeDuVoyageur.ts');
const { lireHautReve } = await import('../../src/modules/session/logic/hautReveDuVoyageur.ts');
const SORTIE = path.resolve('output/campagnes-tests/reve-de-dragon');
const SOURCE = 'Export Dirvers/corriges/RDD_driver_gmos_finir.gmos-driver';
const { gameDriver: pilote, sheetTemplate: fiche } = JSON.parse(new AdmZip(SOURCE).readAsText('state.json'));
assert.equal(pilote.version, '2.0.0'); assert.equal(fiche.reglesDeFiche, 'rdd-231');
const rattachement = JSON.parse(fs.readFileSync(new URL('./cthulhu-hack-joueurs.json', import.meta.url), 'utf8'));
assert.deepEqual(rattachement.joueurs.map(p => p.realName), heros.map(p => p.joueur));
const id = (type, slug) => `recette-rdd-${type}-${slug}`, ref = (slug, ext = 'svg') => `recette-rdd-media-${slug}.${ext}`;
const C = id('campagne', 'moulin'), INSTANT = Date.parse(DATE_RECETTE), atelier = atelierArchives(SORTIE, 'recette-rdd', pilote, fiche);
const xml = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function document(titre, dessin) { return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#f3ecd7"/><style>text{font-family:Georgia,serif;fill:#293f39}</style><path d="M25 100H1175M25 725H1175" stroke="#567963" stroke-width="3"/><text x="50" y="67" font-size="34" font-weight="700">${xml(titre)}</text>${dessin}<text x="50" y="765" font-size="16">RÊVE DE DRAGON · LE MOULIN · FICTION ORIGINALE DE RECETTE GM-OS</text></svg>`; }
for (const [slug, nom, , description, , voisins] of lieux) {
    const dessin = voisins.map((v,i) => `<path d="M600 345L${220+i*340} 530" stroke="#567963" stroke-width="4"/><rect x="${60+i*340}" y="520" width="310" height="95" rx="20" fill="#d8e1cc" stroke="#567963"/><text x="${75+i*340}" y="570" font-size="20">${xml(lieux.find(l=>l[0]===v)[1])}</text>`).join('');
    atelier.ajouter(`carte-${slug}`, document(nom,lignesSVG(description,55,155,80)+dessin+`<ellipse cx="600" cy="345" rx="230" ry="60" fill="#d8e1cc" stroke="#567963"/><text x="415" y="350" font-size="22">${xml(nom)}</text>`+lignesSVG('Plan de fiction sans échelle ; la carte officielle des TMR est dans le module.',55,675,82)));
}
for (const h of heros) atelier.ajouter(`pj-${h.slug}`,document(h.nom,lignesSVG(h.metier)+lignesSVG(h.description,55,260,80)+lignesSVG(h.histoire,55,410,80)));
for (const [slug,nom,,,description,replique] of pnj) atelier.ajouter(`pnj-${slug}`,document(nom,lignesSVG(description,55,155,80)+lignesSVG(replique,55,330,80)));
for (const [slug,titre,texte] of indices) atelier.ajouter(`indice-${slug}`,document(titre,lignesSVG(texte,55,155,80)));
atelier.ajouter('compagnie',document('Trois voyageurs, trois demi-rêves',lignesSVG('Liseron : G4. Ambre : J4. Oriel : D13. Chacun dispose de son propre demi-rêve dans le module TMR.',55,155,80)+lignesSVG('Préserver une route avant d’arrêter le moulin. Parler, réparer ou guider à pied : trois voies possibles.',55,350,80)));
for (const [son,mode] of [['roue','conduites'],['cloche','annonce'],['gouttes','timbreuse']]) atelier.ajouter(son,signalWav(mode),'wav');
function valeurs(h,i,maj={},blessures={}) {
    const v=Object.fromEntries(fiche.sections.flatMap(s=>s.fields.map(f=>[f.id,f.defaultValue??(['number','rating','gauge'].includes(f.type)?0:f.type==='checkbox'?false:'')])));
    for (const anciens of Object.values(ALIAS_DU_VOYAGEUR)) for (const cle of anciens) delete v[cle];
    Object.assign(v,Object.fromEntries(['taille','constitution','force','agilite','dexterite','vue','ouie','odorat_gout','volonte','intellect','empathie','apparence','reve','chance'].map((cle,n)=>[cle,h.attributs[n]])),h.competences,
        { nom:h.nom, nom_du_personnage:h.nom, age:28+i, heure_naissance:['Le Vaisseau','La Lyre','Le Roseau'][i%3], points_de_chance:h.attributs[13], points_de_destinee:1,
            reve_pts:12, reve_seuil:h.attributs[12], moral:0, fatigue:0, __rddFatigue231:1, route_food:10, route_water:10, magic_repression:'0',
            spells_0_path:'Hypnos', spells_0_name:'Tympan d’Hypnos', spells_0_tmr:'Collines d’Encre (J4)', spells_0_difficulty:-5, spells_0_dreamCost:2, spells_0_cellBonus:'0',
            description:h.description, inventaire:h.materiel.join('\n'), notes:'Personnage de recette avancé, valeurs choisies ; pas une création par budget de départ.' });
    let d=reprendreFicheDeVoyageur(fiche,v);
    d={...d,vie:d.vie_max,endurance:d.endurance_max,...maj};
    // Un nouveau suivi est créé pour chaque variante, sans écraser un suivi actif.
    delete d.__rddSante231; delete d.__rddAvantSante231;
    d=initialiserSanteVoyageur(d,blessures); d.__rddHautReve231=lireHautReve(d); return d;
}
function objet(slug,name,type='other',quantity=1,description='Objet de fiction, sans bonus ni consommation automatique.') { return {id:id('objet',slug),name,type,rarity:'common',quantity,weight:1,value:0,description,properties:{}}; }
function personnage(h,i,campagne=C,code='',maj={},blessures={}) {
    const name=code?`${code} — ${h.nom}`:h.nom, sheetData=valeurs(h,i,maj,blessures); sheetData.nom=name;
    return {id:code?`${campagne}-pj-${code.toLowerCase()}`:id('pj',h.slug),name,classRace:h.metier,campaignId:campagne,templateId:fiche.id,systemId:pilote.id,
        portraitUrl:ref(`pj-${h.slug}`),tokenUrl:ref(`pj-${h.slug}`),hp:sheetData.vie,maxHp:sheetData.vie_max,healthSystem:projeterSanteVoyageur(sheetData),sheetData,
        description:h.description,playerNotes:h.histoire,gmNotes:`SECRET_MJ_RDD_RECETTE : ${h.motivation}`,donneesModifieesLe:INSTANT,inventory:h.materiel.join('\n'),inventoryItems:h.materiel.map((nom,n)=>({...objet(`${h.slug}-${n}`,nom),id:`${campagne}-${h.slug}-${code||'principal'}-objet-${n}`})),relations:[],faction:'Voyageurs du moulin',hubOptions:{showHP:true,showMP:true,showAP:false,showInventory:true,showRelations:true}};
}
const joueurs=heros.map((h,i)=>({...rattachement.joueurs[i],avatarUrl:'',isOnline:false,characters:[personnage(h,i)]})),pjIds=joueurs.flatMap(p=>p.characters.map(c=>c.id));
const scenario={
    campaign:{id:C,name:`RECETTE RÊVE DE DRAGON — ${titreRdd}`,system:pilote.id,activeLocationIds:[id('lieu','auberge')],wallpaperUrl:ref('compagnie'),themeDuJeu:true,langueDeForge:'fr',description:'Campagne originale de recette ; personnages avancés pour éprouver les mécaniques. Aucun événement déjà joué.',synopsis:'Un moulin tourne sans eau. Douze voyageurs restent prisonniers d’un matin. Retrouver une route avant de freiner la roue.',gmNotes:'SECRET_MJ_RDD_RECETTE : Céleste maintient le rappel. Deux plans expliquent le contrepoids ; la lettre, le chant et Aude permettent trois issues. Ne jamais imposer la magie comme passage obligé.'},
    players:joueurs,
    entities:pnj.map(([slug,name,role,lieu,description,roleplayingNotes,secret],i)=>{const sheetData=valeurs(heros[i%3],i%3);sheetData.nom=name;return {id:id('pnj',slug),name,type:slug==='loup'?'monster':'npc',role,status:'alive',campaignId:C,avatar:ref(`pnj-${slug}`),description,roleplayingNotes,gmSecretInfo:`SECRET_MJ_RDD_RECETTE : ${secret}`,templateId:fiche.id,sheetData,hp:sheetData.vie,maxHp:sheetData.vie_max,healthSystem:projeterSanteVoyageur(sheetData),linkedMapIds:[id('lieu',lieu)],relations:[],faction:role==='hostile'?'Obstacle de recette':'Habitants du moulin',isVisibleByPlayers:['maude','soline','neree','colin'].includes(slug)};}),
    atlasMaps:lieux.map(([slug,name,type,narrativeDescription,gmNotes,voisins])=>({id:id('lieu',slug),name,type,narrativeDescription,gmNotes,campaignId:C,fileUrl:ref(`carte-${slug}`),isVideo:false,isVisited:slug==='auberge',linkedEntities:[...pnj.filter(p=>p[3]===slug).map(p=>({id:id('lien',`${slug}-${p[0]}`),name:p[1],category:'npc',entityId:id('pnj',p[0])})),...voisins.map(v=>({id:id('lien',`${slug}-${v}`),name:lieux.find(l=>l[0]===v)[1],category:'lieu',mapId:id('lieu',v)}))]})),
    clues:indices.map(([slug,title,content,lieu,owner,isRevealed])=>({id:id('indice',slug),campaignId:C,title,content,locationId:id('lieu',lieu),ownerId:id('pnj',owner),mediaUrl:ref(`indice-${slug}`),isRevealed,...(isRevealed?{revealedAt:INSTANT}:{})})),
    wikiEntries:[...lieux.map(([slug,title,,content])=>({id:id('wiki',slug),campaignId:C,title,content,category:'location',tags:['moulin','recette'],imageUrls:[ref(`carte-${slug}`)],linkedEntityIds:pnj.filter(p=>p[3]===slug).map(p=>id('pnj',p[0]))})),{id:id('wiki','tmr'),campaignId:C,title:'Deux cartes et trois demi-rêves',content:'Les lieux du village sont dans Atlas. La carte officielle des Terres Médianes est dans le module rdd-tmr. Les tables de rencontres sont livrées en JSON Table-OS ; elles s’importent séparément. La fiche règle les conséquences du haut-rêve ; le module conserve position, demandes, journal et publication privée.',category:'lore',tags:['TMR','recette'],imageUrls:[ref('compagnie')],linkedEntityIds:[id('pnj','neree')]}],
    timelineEvents:['Le rappel est fixé','Les voyageurs ne repartent plus','Céleste écrit sa lettre','Les trois voyageurs arrivent'].map((title,i)=>({id:id('chrono',String(i)),campaignId:C,date:`2026-10-${22+i}`,title,description:'Repère de tri fictif J'+(i-3)+' ; les dates ISO ne constituent pas le calendrier de Rêve de Dragon.',type:'lore',locationId:id('lieu','moulin'),involvedEntityIds:[id('pnj','celeste')]})),
    actes:['Le matin sans départ','Les noms sous les feuilles','La route que l’on garde','Atelier de recette — hors fiction'].map((titre,i)=>({id:id('acte',String(i+1)),campaignId:C,ordre:i+1,titre,resume:titre,acheve:false,notesDuMeneur:'Ne pas bloquer un indice sur un unique jet. Acte IV : laboratoires hors fiction.'})),
    scenes:scenes.map(s=>({id:id('scene',s[0]),campaignId:C,acteId:id('acte',String(s[1])),ordre:scenes.filter(x=>x[1]===s[1]).indexOf(s)+1,titre:s[2],lieuId:id('lieu',s[3]),entiteIds:s[4].map(x=>id('pnj',x)),indiceIds:s[5].map(x=>id('indice',x)),personnagesIds:pjIds,resume:s[6],enjeux:s[6],descriptionNarrative:lieux.find(l=>l[0]===s[3])[3]+' '+s[6],notesDuMeneur:'SECRET_MJ_RDD_RECETTE : '+s[4].map(x=>pnj.find(p=>p[0]===x)[6]).join(' '),repliques:s[4].map(x=>pnj.find(p=>p[0]===x)).map(p=>`${p[1]} : ${p[5]}`).join('\n'),origine:'preparee',importance:s[1]===4?'optionnelle':'principale',enchainements:s[7].map(x=>({vers:id('scene',x),libelle:'Suivre cette piste'})),passages:[],creeeLe:INSTANT,...(['arrivee','verger','tmr','chambre'].includes(s[0])?{momentDeStoryboardId:id('moment',s[0])}:{})})),
    rencontres:[['pont','R01 — Le pont', ['arden'],'colin'],['feuilles','R02 — Le papier', ['loup'],'irene'],['rappel','R03 — Tenir la porte', ['arden'],'vianne']].map(([scene,nom,ennemis,allie],i)=>({id:id('rencontre',String(i)),campaignId:C,sceneId:id('scene',scene),nom,creeeLe:INSTANT,notes:'Combat optionnel de recette ; ajouter les PJ et vérifier les armes/protections avant de commencer. Profils choisis, sans bestiaire officiel.',lignes:[...ennemis.map(x=>({genre:'entite',entiteId:id('pnj',x),faction:'enemy'})),{genre:'entite',entiteId:id('pnj',allie),faction:'ally'}]})),
    sessions:[1,2,3,4].map(n=>({id:id('seance',String(n)),campaignId:C,number:n,date:DATE_RECETTE.slice(0,10),status:'planned',publicSummary:['Trouver les disparus.','Préparer une route.','Choisir le retour.','Atelier hors fiction.'][n-1],gmSecrets:'SECRET_MJ_RDD_RECETTE : l’enquête ne requiert pas une réussite en haut-rêve.',sessionEntityIds:pjIds,acteId:id('acte',String(n)),scenesPrevuesIds:scenes.filter(s=>s[1]===n).map(s=>id('scene',s[0])),checklist:[{id:id('check',String(n)),text:'Consigner les résultats ; ouvrir les TMR aux seuls PJ voulus.',isCompleted:false}]})),
    lootPool:[objet('cle','Clef de bois'),objet('soins','Linges de soins','consumable',3),objet('rations','Rations de voyage','consumable',6),objet('eau','Gourdes pleines','consumable',3),objet('corde','Corde du bief'),objet('deniers','Deniers fictifs','currency',101,'Lot arithmétique : 33 par PJ, reliquat 2 ; pas de conversion monétaire imposée.'),objet('carnet','Carnet de routes'),objet('cloche','Clochette du retour')].map(o=>({...o,campaignId:C})),lootReserve:[{...objet('reserve','Caisse de l’atelier'),campaignId:C}],lootHistory:[],messages:[],journaux:[],requiredDriverData:[pilote],requiredTemplateData:[fiche],
    moments:['arrivee','verger','tmr','chambre'].map((slug,i)=>({id:id('moment',slug),campaignId:C,name:`M0${i+1} — ${scenes.find(s=>s[0]===slug)[2]}`,description:'Plan et signal original de recette.',color:'#567963',icon:'Map',mapUrl:`data:image/svg+xml;base64,${atelier.medias.get(ref(`carte-${scenes.find(s=>s[0]===slug)[3]}`)).contenu.toString('base64')}`,isMapVideo:false,soundAtmosphereId:id('ambiance','moulin'),soundPadId:id('pad',i%2?'cloche':'roue'),titre:scenes.find(s=>s[0]===slug)[2],titreDuree:5})),
    atmospheres:[{id:id('ambiance','moulin'),campagneId:C,name:'RECETTE RdD — roue et pluie',pads:Object.fromEntries(['roue','cloche','gouttes'].map(son=>[id('pad',son),{id:id('pad',son),title:son,filePath:ref(son,'wav'),volume:0.2,color:'#567963',midiMapping:null,keyMapping:null,isActive:false,linkedLightSceneId:null}]))}],
    playlists:[{id:id('playlist','moulin'),campagneId:C,name:'RECETTE RdD — signaux',pads:['roue','gouttes'].map(son=>({id:id('musique',son),label:son,url:ref(son,'wav'),type:'local',loopA:null,loopB:null}))}],
    tuilesDeLumiere:['Auberge — matin','Verger — vert','Moulin — veille'].map((name,i)=>({id:`SCENE_${C}_${i+1}`,name,campagneId:C,icon:'Lightbulb',color:'#567963',lightStates:{},sceneBrightness:30})),
};
function lier(a,b,type,libelle){a.relations.push({targetId:b.id,targetType:b.type?'npc':'pc',type,libelle,description:libelle});}
lier(joueurs[0].characters[0],scenario.entities[3],'ally','Cartes et registres');lier(joueurs[1].characters[0],scenario.entities[0],'ally','Lettre à remettre');lier(joueurs[2].characters[0],scenario.entities[5],'ally','Réparer le pont');
function lierModule(s){s.modulesDuJeu=preparerModuleRdd(s.players.flatMap((p,i)=>p.characters.map(c=>({id:c.id,name:c.name,caseTMR:heros[i].caseTMR}))));}
lierModule(scenario);
function labo(suffixe,nom){const s=JSON.parse(JSON.stringify({...scenario,modulesDuJeu:undefined}).replaceAll('recette-rdd-',`recette-rdd-${suffixe}-`));const retablir=v=>typeof v==='string'?v.replaceAll(`recette-rdd-${suffixe}-media-`,'recette-rdd-media-'):Array.isArray(v)?v.map(retablir):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,retablir(x)])):v;const c=retablir(s);c.campaign.name=nom;c.campaign.description='Laboratoire hors fiction ; réimporter avec Remplacer pour réinitialiser les essais.';c.requiredDriverData=[pilote];c.requiredTemplateData=[fiche];c.players.forEach((p,i)=>{p.id=joueurs[i].id;p.characters=[];});c.scenes.forEach(s=>s.personnagesIds=[]);c.sessions.forEach(s=>s.sessionEntityIds=[]);return c;}
function ajouter(s,i,code,maj={},blessures={}){const c=personnage(heros[i%3],i%3,s.campaign.id,code,maj,blessures);s.players[i%3].characters.push(c);s.scenes.forEach(s=>s.personnagesIds.push(c.id));s.sessions.forEach(s=>s.sessionEntityIds.push(c.id));}
const corps=labo('corps','RECETTE RdD — Laboratoire 02 · Corps, repos et progression');
[
    ['B01',{fatigue:20}],['B02',{endurance:0}],['B03',{vie:6},{legere:1}],['B04',{vie:3},{grave:1}],['B05',{vie:0},{critique:1}],
    ['B06',{points_de_chance:1,points_de_destinee:1}],['B07',{moral:-3}],['B08',{route_food:1,route_water:1}],['B09',{fatigue:4,endurance:16}],
].forEach(([code,maj,blessures],i)=>ajouter(corps,i,code,maj,blessures));lierModule(corps);
const tmr=labo('tmr','RECETTE RdD — Laboratoire 03 · Haut-Rêve et Terres Médianes');
ajouter(tmr,0,'T01',{reve_pts:1});ajouter(tmr,1,'T02',{magic_repression:'2'});ajouter(tmr,2,'T03',{reve_pts:20});lierModule(tmr);
const archives=[atelier.ecrire('01-Le-Moulin-des-heures-oubliees.gmos',scenario),atelier.ecrire('02-Corps-Repos-et-Progression.gmos',corps),atelier.ecrire('03-Haut-Reve-et-TMR.gmos',tmr)];
fs.copyFileSync(SOURCE,path.join(SORTIE,'Reve-de-Dragon-2.0.0.gmos-driver'));
const cas=ecrireRecetteRdd(SORTIE,{scenario,corps,tmr,archives,rattachement});
fs.writeFileSync(path.join(SORTIE,'inventaire.json'),JSON.stringify({version:1,genereLe:DATE_RECETTE,rattachement,pilote:{id:pilote.id,version:pilote.version,source:SOURCE},archives,campagne:{joueurs:3,personnages:3,pnj:12,lieux:8,indices:12,actes:4,scenes:16,rencontres:3,seances:4,wiki:9,butin:8,moments:4},modules:{tmr:{versionDonnees:2,voyageurs:3,carteOfficielle:'module rdd-tmr — carte-officielle.jpg'}},casDeRecette:cas.length},null,2));
console.log(JSON.stringify({sortie:SORTIE,archives,casDeRecette:cas.length}));
