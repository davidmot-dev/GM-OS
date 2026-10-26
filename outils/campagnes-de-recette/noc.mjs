import './charger-typescript.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { heros, lieux, pnj, indices, scenes } from './noc-scenario.mjs';
import { atelierArchives, DATE_RECETTE, svgNoc, lignesSVG, carteNoc, signalWav } from './archives-de-recette.mjs';
import { ecrireRecetteNoc, casNoc } from './noc-recette.mjs';
const { HealthInterpreter, etatDesCases } = await import('../../src/modules/session/logic/HealthInterpreter.ts');
const { ressourcesDeLaTable } = await import('../../src/modules/table/reservesDuGroupe.ts');
const RACINE = path.resolve(import.meta.dirname, '../..');
const SORTIE = path.join(RACINE, 'output/campagnes-tests/noc');
const SOURCE = 'Export Dirvers/corriges/NOC_driver_gmos_2.0.0.gmos-driver';
const { gameDriver: pilote, sheetTemplate: fiche } = JSON.parse(new AdmZip(path.join(RACINE, SOURCE)).readAsText('state.json'));
assert.equal(pilote.id, 'custom-1776715362245'); assert.equal(pilote.version, '2.0.0');
const rattachement = JSON.parse(fs.readFileSync(new URL('./cthulhu-hack-joueurs.json', import.meta.url), 'utf8'));
assert.deepEqual(rattachement.joueurs.map(p => p.realName), heros.map(p => p.joueur));
const id = (type, slug) => `recette-noc-${type}-${slug}`;
const ref = (slug, ext = 'svg') => `recette-noc-media-${slug}.${ext}`;
const INSTANT = Date.parse(DATE_RECETTE), C = id('campagne', 'neuvieme-timbre');
const atelier = atelierArchives(SORTIE, 'recette-noc', pilote, fiche);
for (const l of lieux) atelier.ajouter(`carte-${l[0]}`, carteNoc(l));
for (const h of heros) atelier.ajouter(`pj-${h.slug}`, svgNoc(h.nom, lignesSVG(h.metier) + lignesSVG(h.description, 55, 250) + lignesSVG(h.motivation, 55, 390)));
for (const [slug, nom, , , description, replique] of pnj) atelier.ajouter(`pnj-${slug}`, svgNoc(nom, lignesSVG(description) + lignesSVG(replique, 55, 300)));
for (const [slug, titre, texte] of indices) atelier.ajouter(`indice-${slug}`, svgNoc(titre, lignesSVG(texte)));
atelier.ajouter('cabale', svgNoc('Les Veilleurs du Palier', lignesSVG('Cabale du Bloc Vesper. Une laverie abandonnée couvre l’abri, l’atelier et les copies clandestines.') + lignesSVG('Devise : Aucun nom ne disparaît seul.', 55, 280) + lignesSVG('Contacts : Nora Kelm, Vassil Dorn, Mina Sel. Trois Héros : Soren, Daria, Naël.', 55, 380)));
for (const son of ['timbreuse', 'annonce', 'conduites']) atelier.ajouter(son, signalWav(son), 'wav');

function sante(blessures) {
    const h = HealthInterpreter.createDefault('boxes', { cases: pilote.combat.casesDeSante });
    h.data.boxes.forEach((b, i) => { b.filled = i < blessures; });
    h.state = etatDesCases(h.data.seuils, blessures);
    return h;
}
function valeurs(h, i) {
    const v = Object.fromEntries(fiche.sections.flatMap(s => s.fields.map(f => [f.id, f.defaultValue ?? (['number', 'gauge', 'formula'].includes(f.type) ? 0 : f.type === 'checkbox' ? false : '')])));
    Object.assign(v, Object.fromEntries(['vie', 'erudition', 'social', 'technique', 'ame', 'action', 'statut'].map((c, n) => [c, h.domaines[n]])), h.talents,
        { nom: h.nom, archetype: h.metier, origine: 'Bloc Vesper — lieu fictif de recette', description: h.description, theme: 'Résister à l’effacement', qualite: h.qualite, defaut: h.defaut,
            bloc: 'Vesper', cabale: 'Les Veilleurs du Palier', identifiant_individuel: `RECETTE-${i + 1}`, cle_citoyenne: `FICTIF-VSP-${i + 1}`,
            espoir: 2, vecu: 2, singularite: 1, faveur: 2, faveur_max: 2, blessures: 0, trauma: 1, traque: i, noirceur: 0, soupcon: 0,
            objets: h.materiel.join('\n'), equipement: h.materiel.join('\n'), motivations: h.motivation,
            relations: 'Nora Kelm — greffe\nVassil Dorn — entretien\nMina Sel — triage', notes_texte: 'Valeurs choisies pour recette ; pas une procédure de création par le livre.' });
    return v;
}
function objet(slug, name, type = 'other', quantity = 1, description = '') {
    return { id: id('objet', slug), name, type, rarity: 'common', quantity, weight: 1, value: 0, description, properties: {} };
}
const joueurs = heros.map((h, i) => ({ ...rattachement.joueurs[i], avatarUrl: '', isOnline: false, characters: [{
    id: id('pj', h.slug), name: h.nom, classRace: h.metier, campaignId: C, templateId: fiche.id, systemId: pilote.id,
    portraitUrl: ref(`pj-${h.slug}`), tokenUrl: ref(`pj-${h.slug}`), sheetData: valeurs(h, i), healthSystem: sante(0),
    description: h.description, playerNotes: h.histoire, gmNotes: `SECRET_MJ_NOC_RECETTE : ${h.motivation} Aucun jet obligatoire ne bloque l’accès aux preuves.`,
    donneesModifieesLe: INSTANT, inventory: h.materiel.join('\n'), inventoryItems: h.materiel.map((nom, n) => objet(`${h.slug}-${n}`, nom)), relations: [], faction: 'Les Veilleurs du Palier',
    hubOptions: { showHP: true, showMP: false, showAP: false, showInventory: true, showRelations: true },
}] }));
const groupe = Object.fromEntries(JSON.parse(fs.readFileSync('docs/systems/noc/fiche/correspondance-groupe.json', 'utf8')).champs.map(c => [c.gmos, /^(domains|assets|tracks|progression)\./.test(c.gmos) ? 0 : '']));
Object.assign(groupe, {
    'identity.name': 'Les Veilleurs du Palier', 'identity.archetype': 'Cellule clandestine de solidarité', 'identity.quality': 'Entraide', 'identity.flaw': 'Obstination',
    'identity.weaknesses': 'Salle blanche inutilisable ; couverture fragile au greffe.', 'identity.block': 'Vesper — Bloc fictif', 'identity.coordinates': 'Palier B-17, ancienne laverie',
    'identity.description': 'Devise : Aucun nom ne disparaît seul. Refuge, atelier de récupération et copies clandestines.',
    'identity.front_companies': 'Entretien des textiles du Palier', 'identity.staff': 'Ilyan Roe et deux apprentis ; aucun personnel supplémentaire automatique.',
    'network.informants': 'Nora Kelm : greffe ; Vassil Dorn : conduites ; Mina Sel : triage.',
    'domains.life': 2, 'domains.erudition': 3, 'domains.social': 2, 'domains.technical': 3, 'domains.soul': 2, 'domains.action': 2, 'domains.status': 3,
    'assets.life.asylum': 2, 'assets.life.infirmary': 1, 'assets.life.creed': 3, 'assets.life.legends': 2,
    'assets.erudition.library': 2, 'assets.erudition.files': 2, 'assets.erudition.laboratory': 1, 'assets.erudition.informants': 2,
    'assets.social.false_identities': 2, 'assets.social.staff': 1, 'assets.social.expert': 1, 'assets.social.unity': 1,
    'assets.technical.passages': 2, 'assets.technical.workshop': 2, 'assets.technical.clean_room': -1, 'assets.technical.observatory': 2,
    'assets.soul.truth_fragments': 1, 'assets.soul.refuge': 1, 'assets.action.armory': 1, 'assets.action.vehicles': 1, 'assets.action.access_level': 1, 'assets.action.fortifications': 1,
    'assets.status.capital': 3, 'assets.status.standing': 1, 'assets.status.network': 3, 'assets.status.front_companies': 1,
    'tracks.espoir': 1, 'tracks.vecu': 1, 'tracks.singularite': 1, 'tracks.traque': 2, 'tracks.noirceur': 1, 'tracks.division': 1, 'tracks.degradation': 2,
    'network.contacts.0.name': 'Nora Kelm', 'network.contacts.0.favours': 2,
    'network.contacts.1.name': 'Vassil Dorn', 'network.contacts.1.favours': 1,
    'network.contacts.2.name': 'Mina Sel', 'network.contacts.2.favours': 2,
});
const pjIds = joueurs.flatMap(p => p.characters.map(c => c.id));
const scenario = {
    campaign: { id: C, name: 'RECETTE NOC — Le neuvième timbre', system: pilote.id, activeLocationIds: [id('lieu', 'refuge')], themeDuJeu: true, langueDeForge: 'fr',
        description: 'Campagne originale de recette : les Veilleurs du Palier recherchent des disparus dans le Bloc Vesper. Noms et lieux inventés.',
        synopsis: 'Huit destinations, neuf timbres. Un convoi de civils est dévié vers une chambre dissimulée. Enquête, entraide et trois voies vers le dénouement.',
        gmNotes: 'SECRET_MJ_NOC_RECETTE : Ozren détourne les convois. Le carbone, le poinçon IX et le visa de Vera permettent un contre-ordre. Isoler la vanne préserve les conduites. Ne pas traiter l’Arpenteur comme un adversaire aux pouvoirs chiffrés inventés.',
        wallpaperUrl: ref('carte-refuge'), groupe: { sheetData: groupe, donneesModifieesLe: INSTANT } },
    players: joueurs,
    entities: pnj.map(([slug, name, role, lieu, description, replique, secret, blessures, espoir]) => ({
        id: id('pnj', slug), name, type: slug === 'arpenteur' ? 'monster' : 'npc', role, status: 'alive', campaignId: C,
        avatar: ref(`pnj-${slug}`), description, roleplayingNotes: replique, gmSecretInfo: `SECRET_MJ_NOC_RECETTE : ${secret}`,
        templateId: fiche.id, sheetData: { ...valeurs(heros[0], 0), nom: name, archetype: role === 'ally' ? 'Allié de recette' : 'Rouage de recette', cabale: '', blessures, espoir, extase: 0, ferveur: 2, lumiere: 0, trauma: 0, traque: 0, fatigue: false },
        healthSystem: sante(blessures), linkedMapIds: [id('lieu', lieu)], relations: [], faction: role === 'hostile' || role === 'boss' ? 'Service des transferts' : 'Habitants de Vesper',
        isVisibleByPlayers: ['nora', 'vassil', 'mina', 'ilyan'].includes(slug),
    })),
    atlasMaps: lieux.map(([slug, name, type, narrativeDescription, gmNotes, voisins]) => ({ id: id('lieu', slug), name, type, narrativeDescription, gmNotes, campaignId: C, fileUrl: ref(`carte-${slug}`), isVideo: false, isVisited: slug === 'refuge',
        linkedEntities: [...pnj.filter(p => p[3] === slug).map(p => ({ id: id('lien', `${slug}-${p[0]}`), name: p[1], category: 'npc', entityId: id('pnj', p[0]) })),
            ...voisins.map(v => ({ id: id('lien', `${slug}-${v}`), name: lieux.find(l => l[0] === v)[1], category: 'lieu', mapId: id('lieu', v) }))] })),
    clues: indices.map(([slug, title, content, lieu, owner, isRevealed]) => ({ id: id('indice', slug), campaignId: C, title, content, mediaUrl: ref(`indice-${slug}`), locationId: id('lieu', lieu), ownerId: id('pnj', owner), isRevealed, ...(isRevealed ? { revealedAt: INSTANT } : {}) })),
    wikiEntries: [...lieux.map(([slug, title, , content]) => ({ id: id('wiki', slug), campaignId: C, title, content, category: 'location', tags: ['recette', 'Vesper'], imageUrls: [ref(`carte-${slug}`)], linkedEntityIds: pnj.filter(p => p[3] === slug).map(p => id('pnj', p[0])) })),
        { id: id('wiki', 'cabale'), campaignId: C, title: 'Les Veilleurs du Palier', content: groupe['identity.description'] + '\n' + groupe['network.informants'], category: 'faction', tags: ['Cabale', 'recette'], imageUrls: [ref('cabale')], linkedEntityIds: ['nora', 'vassil', 'mina'].map(x => id('pnj', x)) }],
    timelineEvents: ['Nora conserve un carbone', 'Le nom de Maëla change de destination', 'Teren disparaît de la relève', 'La Cabale reçoit la convocation'].map((title, i) => ({ id: id('chrono', String(i)), campaignId: C, date: `2026-10-${22 + i}`, title, description: `Repère de recette J${i - 3}. La date ISO sert au tri de Chronologie ; ce n’est pas une date canonique de NOC.`, type: 'lore', locationId: id('lieu', i === 3 ? 'refuge' : 'greffe'), involvedEntityIds: [id('pnj', 'nora')] })),
    actes: ['Les noms effacés', 'Les copies qui parlent', 'La destination interdite', 'Atelier de recette — hors fiction'].map((titre, i) => ({ id: id('acte', String(i + 1)), campaignId: C, ordre: i + 1, titre, resume: titre, acheve: false,
        notesDuMeneur: 'Prévoir un accès de rechange aux indices. L’acte IV est un atelier de tests ; ne pas le confondre avec la fiction.' })),
    scenes: scenes.map(s => ({ id: id('scene', s[0]), campaignId: C, acteId: id('acte', String(s[1])), ordre: scenes.filter(x => x[1] === s[1]).indexOf(s) + 1,
        titre: s[2], lieuId: id('lieu', s[3]), entiteIds: s[4].map(x => id('pnj', x)), indiceIds: s[5].map(x => id('indice', x)), personnagesIds: pjIds,
        resume: s[6], descriptionNarrative: lieux.find(l => l[0] === s[3])[3] + ' ' + s[6], enjeux: s[6], origine: 'preparee', importance: s[1] === 4 ? 'optionnelle' : 'principale',
        notesDuMeneur: 'SECRET_MJ_NOC_RECETTE : ' + (s[1] === 4 ? 'Employer le cahier et les laboratoires pour les cas destructifs.' : s[4].map(x => pnj.find(p => p[0] === x)[6]).join(' ')),
        repliques: s[4].map(x => pnj.find(p => p[0] === x)).map(p => `${p[1]} : ${p[5]}`).join('\n'),
        enchainements: s[7].map(x => ({ vers: id('scene', x), libelle: 'Poursuivre cette piste' })), passages: [], creeeLe: INSTANT,
        ...(['appel', 'passage', 'calme', 'chambre'].includes(s[0]) ? { momentDeStoryboardId: id('moment', s[0]) } : {}) })),
    rencontres: [['plis', 'R01 — Le bac surveillé', ['surveillant'], 'mina'], ['controle', 'R02 — Le portique', ['brigadier'], 'vera'], ['chambre', 'R03 — La destination', ['ozren'], 'maela']].map(([scene, nom, ennemis, allie], i) => ({
        id: id('rencontre', String(i)), campaignId: C, sceneId: id('scene', scene), nom, creeeLe: INSTANT,
        notes: 'Ajouter les Héros. Confrontation évitable ; les profils sont des valeurs de test, sans prétendre reproduire un bestiaire officiel.',
        lignes: [...ennemis.map(x => ({ genre: 'entite', entiteId: id('pnj', x), faction: 'enemy' })), { genre: 'entite', entiteId: id('pnj', allie), faction: 'ally' }] })),
    sessions: [1, 2, 3, 4].map(n => ({ id: id('seance', String(n)), campaignId: C, number: n, date: DATE_RECETTE.slice(0, 10), status: 'planned',
        publicSummary: ['Retrouver le nom disparu.', 'Comparer les copies et préparer le passage.', 'Atteindre la chambre et décider du retour.', 'Atelier de tests hors fiction.'][n - 1],
        gmSecrets: 'SECRET_MJ_NOC_RECETTE : notes fictives de recette ; aucun événement n’a déjà été joué.', sessionEntityIds: pjIds,
        acteId: id('acte', String(n)), scenesPrevuesIds: scenes.filter(s => s[1] === n).map(s => id('scene', s[0])), checklist: [{ id: id('check', String(n)), text: 'Consigner les résultats observés dans le cahier.', isCompleted: false }] })),
    lootPool: [objet('cle', 'Clef de maintenance', 'other', 1, 'Ouvre une porte ; aucun bonus automatique.'), objet('lampe', 'Lampe à volet', 'other', 1, 'Objet de fiction ; les Auras dépendent de la Lumière et de la décision de la Loi.'),
        objet('soins', 'Pansements scellés', 'consumable', 3, 'Soins arbitrés ; pas de guérison automatique à la distribution.'), objet('jetons', 'Jetons de transit fictifs', 'currency', 101, 'Lot arithmétique de recette : 33 par PJ, reliquat 2 ; ne remplace pas Fortune ou Capital.'),
        objet('carbones', 'Carnets de carbone', 'other', 2), objet('rations', 'Rations de relève', 'consumable', 6), objet('outil', 'Outil de coupe', 'weapon', 1, 'Aucun dégât chiffré inventé dans ce lot.'), objet('sceau', 'Boîte au poinçon IX', 'other', 1)].map(o => ({ ...o, campaignId: C })),
    lootReserve: [{ ...objet('reserve', 'Caisse d’atelier', 'other', 1), campaignId: C }], lootHistory: [], messages: [], journaux: [],
    requiredDriverData: [pilote], requiredTemplateData: [fiche],
    moments: ['appel', 'passage', 'calme', 'chambre'].map((slug, i) => ({ id: id('moment', slug), name: `M0${i + 1} — ${scenes.find(s => s[0] === slug)[2]}`, campaignId: C, description: 'Carte et signal synthétique de recette.', color: '#bf8d4e', icon: 'Layers',
        mapUrl: `data:image/svg+xml;base64,${atelier.medias.get(ref(`carte-${scenes.find(s => s[0] === slug)[3]}`)).contenu.toString('base64')}`, isMapVideo: false,
        soundAtmosphereId: id('ambiance', 'vesper'), soundPadId: id('pad', i % 2 ? 'annonce' : 'conduites'), titre: scenes.find(s => s[0] === slug)[2], titreDuree: 5 })),
    atmospheres: [{ id: id('ambiance', 'vesper'), campagneId: C, name: 'RECETTE NOC — Les conduites de Vesper', pads: Object.fromEntries(['timbreuse', 'annonce', 'conduites'].map(son => [id('pad', son), { id: id('pad', son), title: `Recette — ${son}`, filePath: ref(son, 'wav'), volume: 0.25, color: '#bf8d4e', midiMapping: null, keyMapping: null, isActive: false, linkedLightSceneId: null }])) }],
    playlists: [{ id: id('playlist', 'vesper'), campagneId: C, name: 'RECETTE NOC — boucles synthétiques', pads: ['conduites', 'annonce'].map(son => ({ id: id('musique', son), label: son, url: ref(son, 'wav'), type: 'local', loopA: null, loopB: null })) }],
    tuilesDeLumiere: ['Palier — ambre', 'Passerelle — gris', 'Chambre — noir'].map((name, i) => ({ id: `SCENE_${C}_${i + 1}`, name, campagneId: C, icon: 'Lightbulb', color: '#bf8d4e', lightStates: {}, sceneBrightness: 30 })),
};
scenario.reservesDeTable = Object.fromEntries(ressourcesDeLaTable(pilote, scenario.campaign).map(r => [r.id, r.depart]));
Object.assign(scenario.reservesDeTable, { Fiel: 4, Menace: 1 });
function lier(a, b, type, libelle) { a.relations.push({ targetId: b.id, targetType: b.type ? 'npc' : 'pc', type, libelle, description: libelle }); }
lier(joueurs[0].characters[0], scenario.entities[10], 'ally', 'Maître et apprenti');
lier(joueurs[1].characters[0], scenario.entities[0], 'ally', 'Copies clandestines');
lier(joueurs[2].characters[0], scenario.entities[3], 'family', 'Frère et sœur de cœur');
lier(scenario.entities[0], scenario.entities[4], 'hostile', 'Une falsification à prouver');

function labo(prefixe, titre) {
    // Les médias et les joueurs restent communs ; les identifiants de fiction sont distincts.
    const copie = JSON.parse(JSON.stringify(scenario).replaceAll('recette-noc-', `recette-noc-${prefixe}-`));
    const retablir = v => typeof v === 'string' ? v.replaceAll(`recette-noc-${prefixe}-media-`, 'recette-noc-media-')
        : Array.isArray(v) ? v.map(retablir) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, retablir(x)])) : v;
    const s = retablir(copie); s.campaign.name = titre; s.campaign.description = 'Laboratoire hors fiction, à réimporter avec Remplacer entre essais destructifs.';
    s.requiredDriverData = [pilote]; s.requiredTemplateData = [fiche];
    s.players.forEach((p, i) => { p.id = joueurs[i].id; p.characters = []; });
    s.scenes.forEach(s => { s.personnagesIds = []; }); s.sessions.forEach(s => { s.sessionEntityIds = []; });
    return s;
}
function cobaye(lab, i, code, nom, maj) {
    const c = structuredClone(joueurs[i % 3].characters[0]);
    c.id = `${lab.campaign.id}-pj-${code}`; c.campaignId = lab.campaign.id; c.name = `${code} — ${nom}`; c.relations = [];
    c.sheetData = { ...c.sheetData, ...maj, nom: c.name }; c.healthSystem = sante(c.sheetData.blessures);
    c.playerNotes = 'État préparé de laboratoire. Réimporter ce laboratoire avec Remplacer pour le réinitialiser.';
    c.inventoryItems.forEach((o, i) => { o.id = `${c.id}-inventaire-${i}`; });
    lab.players[i % 3].characters.push(c); lab.scenes.forEach(s => s.personnagesIds.push(c.id)); lab.sessions.forEach(s => s.sessionEntityIds.push(c.id));
}
const seuils = labo('seuils', 'RECETTE NOC — Laboratoire 02 · Seuils et Séquelles');
for (const [i, [champ, valeur]] of ['blessures', 'trauma', 'traque', 'noirceur'].flatMap(c => [4, 7, 9].map(n => [c, n])).entries())
    cobaye(seuils, i, `S${String(i + 1).padStart(2, '0')}`, `${champ} ${valeur} avant seuil ${valeur + 1}`, { blessures: 0, trauma: 0, traque: 0, noirceur: 0, [champ]: valeur });
const entraide = labo('entraide', 'RECETTE NOC — Laboratoire 03 · Repos, Auras et Cabale');
[
    ['E01', 'Soupçon 5 · récupérations à répartir', { blessures: 3, trauma: 3, espoir: 0, singularite: 0, soupcon: 5, fatigue: true, extase: 0, lumiere: 0, ferveur: 2 }],
    ['E02', 'Soupçon 8 · Ferveur 4 · Lumière 2', { blessures: 2, trauma: 2, espoir: 1, singularite: 0, soupcon: 8, fatigue: true, extase: 1, lumiere: 2, ferveur: 4, bouleversement: true }],
    ['E03', 'Soupçon 10 · Extase 3 · réserve vide', { blessures: 1, trauma: 1, espoir: 0, singularite: 0, soupcon: 10, fatigue: false, extase: 3, lumiere: 1, ferveur: 2 }],
].forEach(([code, nom, maj], i) => cobaye(entraide, i, code, nom, maj));
Object.assign(entraide.campaign.groupe.sheetData, { 'tracks.espoir': 0, 'tracks.vecu': 0, 'tracks.singularite': 0, 'network.contacts.0.favours': 0, 'network.contacts.1.favours': 1, 'network.contacts.2.favours': 0 });
Object.assign(entraide.reservesDeTable, { Fiel: 0, Menace: 3, 'groupe:domains.technical': 0, 'groupe:assets.status.capital': 0 });
const archives = [atelier.ecrire('01-Le-neuvieme-timbre.gmos', scenario), atelier.ecrire('02-Seuils-et-Sequelles.gmos', seuils), atelier.ecrire('03-Repos-Auras-et-Cabale.gmos', entraide)];
fs.copyFileSync(SOURCE, path.join(SORTIE, 'NOC-2.0.0.gmos-driver'));
ecrireRecetteNoc(SORTIE, { scenario, seuils, entraide, archives, rattachement });
fs.writeFileSync(path.join(SORTIE, 'inventaire.json'), JSON.stringify({ version: 1, genereLe: DATE_RECETTE, rattachement, pilote: { id: pilote.id, version: pilote.version, source: SOURCE }, archives,
    campagne: { cabale: groupe['identity.name'], contacts: 3, joueurs: 3, personnages: 3, pnj: pnj.length, lieux: lieux.length, indices: indices.length, actes: 4, scenes: scenes.length, rencontres: 3, seances: 4, wiki: scenario.wikiEntries.length, butin: 8, moments: 4, sons: 3, tuiles: 3 }, casDeRecette: casNoc.length }, null, 2) + '\n');
console.log(JSON.stringify({ sortie: SORTIE, archives, casDeRecette: casNoc.length }));
