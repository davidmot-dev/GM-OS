import './charger-typescript.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { herosAlien as heros, lieuxAlien as lieux, pnjAlien as pnj, indicesAlien as indices, scenesAlien as scenes, titreAlien } from './alien-scenario.mjs';
import { preparerModulesAlien } from './alien-modules.mjs';
import { atelierArchives, DATE_RECETTE, lignesSVG, signalWav } from './archives-de-recette.mjs';
import { ecrireRecetteAlien, casAlien } from './alien-recette.mjs';
const { appliquerLaPaniqueAlien } = await import('../../src/modules/dice/systemes/paniqueAlien.ts');
const { lireProgressionAlien, CLE_PROGRESSION_ALIEN } = await import('../../src/modules/dice/systemes/progressionAlien.ts');
const SORTIE = path.resolve('output/campagnes-tests/alien');
const SOURCE = 'Export Dirvers/corriges/Alien_driver_gmos_combat-spatial.gmos-driver';
const { gameDriver: pilote, sheetTemplate: fiche } = JSON.parse(new AdmZip(SOURCE).readAsText('state.json'));
assert.equal(pilote.version, '1.9.0'); assert.equal(pilote.id, 'custom-1786696751491');
const rattachement = JSON.parse(fs.readFileSync(new URL('./cthulhu-hack-joueurs.json', import.meta.url), 'utf8'));
assert.deepEqual(rattachement.joueurs.map(p => p.realName), heros.map(p => p.joueur));
const id = (type, slug) => `recette-alien-${type}-${slug}`, ref = (slug, ext = 'svg') => `recette-alien-media-${slug}.${ext}`;
const C = id('campagne', 'orphee'), INSTANT = Date.parse(DATE_RECETTE);
const atelier = atelierArchives(SORTIE, 'recette-alien', pilote, fiche);
const xml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function document(titre, dessin) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#0e1d1a"/><style>text{font-family:Consolas,monospace;fill:#c6e8c7}</style><path d="M25 100H1175M25 725H1175" stroke="#77aa83" stroke-width="3"/><text x="50" y="67" font-size="34" font-weight="700">${xml(titre)}</text>${dessin}<text x="50" y="765" font-size="16">ALIEN · ORPHÉE · FICTION ORIGINALE DE RECETTE GM-OS</text></svg>`;
}
for (const [slug, nom, , description] of lieux) {
    const dessin = ['Accès', 'Sas intérieur', 'Salle centrale', 'Maintenance', 'Réserve', 'Issue'].map((label, i) => {
        const x = 55 + i % 3 * 385, y = 270 + Math.floor(i / 3) * 180;
        return `<rect x="${x}" y="${y}" width="325" height="130" fill="#18352b" stroke="#77aa83" stroke-width="3"/><text x="${x + 18}" y="${y + 60}" font-size="24">${i + 1}. ${label}</text>`;
    }).join('');
    atelier.ajouter(`carte-${slug}`, document(nom, lignesSVG(description, 55, 155, 80) + dessin + lignesSVG('Schéma Atlas sans échelle. Le plan métrique privé du M314 est dans le module.', 55, 675, 82)));
}
for (const h of heros) atelier.ajouter(`pj-${h.slug}`, document(h.nom, lignesSVG(h.metier) + lignesSVG(h.description, 55, 260, 80) + lignesSVG(h.histoire, 55, 410, 80)));
for (const [slug, nom, , , description, replique] of pnj) atelier.ajouter(`pnj-${slug}`, document(nom, lignesSVG(description, 55, 155, 80) + lignesSVG(replique, 55, 330, 80)));
for (const [slug, titre, texte] of indices) atelier.ajouter(`indice-${slug}`, document(titre, lignesSVG(texte, 55, 155, 80)));
atelier.ajouter('iskra', document('Iskra — équipage de relève', lignesSVG('Eli Voss : machines et senseurs. Mara Chen : commandement et soins. Samir Hale : pilote. Célian Dorr (PNJ) : artilleur.', 55, 155, 80) + lignesSVG('Récupérer les survivants. Garder une route de retour. Toute cargaison est une décision séparée.', 55, 350, 80)));
for (const [son, mode] of [['relais', 'conduites'], ['balise', 'annonce'], ['sas', 'timbreuse']]) atelier.ajouter(son, signalWav(mode), 'wav');
function sante(courant, max) { return { type: 'hp', data: { current: courant, max }, state: courant === 0 ? 'critical' : courant < max ? 'wounded' : 'healthy', badges: [] }; }
function valeurs(h, i) {
    const v = Object.fromEntries(fiche.sections.flatMap(s => s.fields.map(f => [f.id, f.defaultValue ?? (['number', 'rating', 'gauge'].includes(f.type) ? 0 : f.type === 'checkbox' ? false : '')])));
    Object.assign(v, Object.fromEntries(['force', 'agilite', 'esprit', 'empathie'].map((n, i) => [n, h.attributs[i]])), h.competences,
        { nom: h.nom, type_personnage: 'Humain', androide: false, talent: h.talents, sante: h.attributs[0], niveau_de_stress: 0, points_de_recit: 1,
            air: 5, eau: 4, nourriture: 4, energie: 5, inventaire: h.materiel.join('\n'), objet_fetiche: h.fetiche,
            camarade: heros[(i + 1) % 3].nom, rival: 'Nils Arendt — contrat contre secours',
            'field-1786783170092': '0', 'field-1786783213114': 4, 'field-1786783062962': 'Objectif privé à remettre depuis MU/TH/UR, acte par acte.',
            'field-1786783108730': 'Arme de recette', armes_bonus: '0', armes_degats: '1', armes_portees: 'Courte', armes_proprietes: '' });
    v[CLE_PROGRESSION_ALIEN] = { ...lireProgressionAlien({}), mode: 'cinema', scenario: titreAlien, acte: 1, seance: 'Orphée-01' };
    return v;
}
function objet(slug, name, type = 'other', quantity = 1, description = 'Objet de recette, sans bonus ni consommation automatique.') {
    return { id: id('objet', slug), name, type, rarity: 'common', quantity, weight: 1, value: 0, description, properties: {} };
}
const joueurs = heros.map((h, i) => ({ ...rattachement.joueurs[i], avatarUrl: '', isOnline: false, characters: [{ id: id('pj', h.slug), name: h.nom, classRace: h.metier,
    portraitUrl: ref(`pj-${h.slug}`), tokenUrl: ref(`pj-${h.slug}`), campaignId: C, templateId: fiche.id, systemId: pilote.id,
    hp: h.attributs[0], maxHp: h.attributs[0], healthSystem: sante(h.attributs[0], h.attributs[0]), sheetData: valeurs(h, i),
    description: h.description, playerNotes: h.histoire, gmNotes: 'SECRET_MJ_ALIEN_RECETTE : les objectifs d’acte sont dans la préparation privée MU/TH/UR.',
    donneesModifieesLe: INSTANT, inventory: h.materiel.join('\n'), inventoryItems: h.materiel.map((nom, n) => objet(`${h.slug}-${n}`, nom)), relations: [], faction: 'Équipage d’Iskra',
    hubOptions: { showHP: true, showMP: false, showAP: false, showInventory: true, showRelations: true } }] }));
const pjIds = joueurs.flatMap(p => p.characters.map(c => c.id));
const scenario = {
    campaign: { id: C, name: `RECETTE ALIEN — ${titreAlien}`, system: pilote.id, activeLocationIds: [id('lieu', 'sas')], wallpaperUrl: ref('iskra'), themeDuJeu: true, langueDeForge: 'fr',
        description: 'Scénario original de recette en trois actes Cinéma, prolongeable en campagne. Relais et personnages inventés.',
        synopsis: 'Iskra répond à une relève manquante. Le contrat compte quatre personnes, le relais en attendait six. Une caisse a été ouverte avant la panne.',
        gmNotes: 'SECRET_MJ_ALIEN_RECETTE : l’ordre de purge et les horaires prouvent une ouverture préalable. On peut sauver les gens et copier les preuves sans transporter le conteneur. Trois voies : terminal, témoins, réparation.' },
    players: joueurs,
    entities: pnj.map(([slug, name, role, lieu, description, replique, secret, androide], i) => {
        const max = slug === 'creature' || androide ? 6 : 3, hp = slug === 'iona' ? 1 : max;
        return { id: id('pnj', slug), name, type: role === 'monster' ? 'monster' : 'npc', role: role === 'monster' ? 'hostile' : role, status: 'alive', campaignId: C,
            avatar: ref(`pnj-${slug}`), description, roleplayingNotes: replique, gmSecretInfo: `SECRET_MJ_ALIEN_RECETTE : ${secret}`,
            hp, maxHp: max, healthSystem: sante(hp, max), templateId: fiche.id,
            sheetData: { ...valeurs(heros[i % 3], i % 3), nom: name, force: max, sante: hp, niveau_de_stress: 0, androide, type_personnage: androide ? 'Androïde' : 'Humain', talent: '', points_de_recit: 0 },
            linkedMapIds: [id('lieu', lieu)], relations: [], faction: role === 'hostile' ? 'Contrat de récupération' : 'Relève Orphée', isVisibleByPlayers: ['vesna', 'nils', 'iona', 'boreal'].includes(slug) };
    }),
    atlasMaps: lieux.map(([slug, name, type, narrativeDescription, gmNotes, voisins]) => ({ id: id('lieu', slug), name, type, narrativeDescription, gmNotes, campaignId: C, fileUrl: ref(`carte-${slug}`), isVideo: false, isVisited: slug === 'sas',
        linkedEntities: [...pnj.filter(p => p[3] === slug).map(p => ({ id: id('lien', `${slug}-${p[0]}`), name: p[1], category: 'npc', entityId: id('pnj', p[0]) })), ...voisins.map(v => ({ id: id('lien', `${slug}-${v}`), name: lieux.find(l => l[0] === v)[1], category: 'lieu', mapId: id('lieu', v) }))] })),
    clues: indices.map(([slug, title, content, lieu, owner, isRevealed]) => ({ id: id('indice', slug), campaignId: C, title, content, locationId: id('lieu', lieu), ownerId: id('pnj', owner), mediaUrl: ref(`indice-${slug}`), isRevealed, ...(isRevealed ? { revealedAt: INSTANT } : {}) })),
    wikiEntries: [...lieux.map(([slug, title, , content]) => ({ id: id('wiki', slug), title, content, campaignId: C, category: 'location', tags: ['Orphée', 'recette'], imageUrls: [ref(`carte-${slug}`)], linkedEntityIds: pnj.filter(p => p[3] === slug).map(p => id('pnj', p[0])) })),
        { id: id('wiki', 'iskra'), title: 'Iskra et sa mission', content: 'Navire de relève fictif. Secours et contrat de fret sont des décisions distinctes. Équipage : Eli, Mara, Samir, Célian.', campaignId: C, category: 'lore', tags: ['recette'], imageUrls: [ref('iskra')], linkedEntityIds: [id('pnj', 'celian')] }],
    timelineEvents: ['Dernière relève complète', 'Ouverture du conteneur', 'Panne et appels incomplets', 'Arrivée d’Iskra'].map((title, i) => ({ id: id('chrono', String(i)), title, campaignId: C, date: `2183-01-${String(i + 1).padStart(2, '0')}`, description: 'Date fictive de recette pour le tri, pas une chronologie officielle ALIEN.', type: 'lore', locationId: id('lieu', 'mess'), involvedEntityIds: [id('pnj', 'iona')] })),
    actes: ['La relève incomplète', 'Le contrat sous la glace', 'Ce que l’on ramène', 'Atelier de recette — hors fiction'].map((titre, i) => ({ id: id('acte', String(i + 1)), campaignId: C, ordre: i + 1, titre, resume: titre, acheve: false, notesDuMeneur: 'Actes 1–3 : objectifs privés dans MU/TH/UR. Acte 4 : essais hors fiction ; employer les laboratoires pour les changements destructifs.' })),
    scenes: scenes.map(s => ({ id: id('scene', s[0]), campaignId: C, acteId: id('acte', String(s[1])), ordre: scenes.filter(x => x[1] === s[1]).indexOf(s) + 1, titre: s[2], lieuId: id('lieu', s[3]),
        entiteIds: s[4].map(x => id('pnj', x)), personnagesIds: pjIds, indiceIds: s[5].map(x => id('indice', x)), resume: s[6], enjeux: s[6], descriptionNarrative: lieux.find(l => l[0] === s[3])[3] + ' ' + s[6],
        notesDuMeneur: 'SECRET_MJ_ALIEN_RECETTE : ' + s[4].map(x => pnj.find(p => p[0] === x)[6]).join(' '), repliques: s[4].map(x => pnj.find(p => p[0] === x)).map(p => `${p[1]} : ${p[5]}`).join('\n'),
        origine: 'preparee', importance: s[1] === 4 ? 'optionnelle' : 'principale', enchainements: s[7].map(x => ({ vers: id('scene', x), libelle: 'Suivre cette piste' })), passages: [], creeeLe: INSTANT,
        ...(['approche', 'infirmerie', 'labo', 'sortie'].includes(s[0]) ? { momentDeStoryboardId: id('moment', s[0]) } : {}) })),
    rencontres: [['porte', 'R01 — Porte et panique', ['tor'], 'milo'], ['labo', 'R02 — Le laboratoire', ['creature'], 'leena'], ['sortie', 'R03 — Le quai', ['creature'], 'celian']].map(([scene, nom, ennemis, allie], i) => ({ id: id('rencontre', String(i)), nom, campaignId: C, sceneId: id('scene', scene), creeeLe: INSTANT,
        notes: 'Ajouter les PJ ; profils de recette à confirmer, combat évitable. Initiative par cartes ; ne pas inventer une attaque de signature d’espèce.', lignes: [...ennemis.map(x => ({ genre: 'entite', entiteId: id('pnj', x), faction: 'enemy' })), { genre: 'entite', entiteId: id('pnj', allie), faction: 'ally' }] })),
    sessions: [1, 2, 3, 4].map(n => ({ id: id('seance', String(n)), campaignId: C, number: n, date: DATE_RECETTE.slice(0, 10), status: 'planned', publicSummary: ['Atteindre les survivants.', 'Comprendre le contrat.', 'Choisir l’évacuation.', 'Atelier hors fiction.'][n - 1],
        gmSecrets: 'SECRET_MJ_ALIEN_RECETTE : aucune résolution n’est déjà jouée. Préparer et remettre les objectifs dans le terminal privé.', sessionEntityIds: pjIds, acteId: id('acte', String(n)), scenesPrevuesIds: scenes.filter(s => s[1] === n).map(s => id('scene', s[0])), checklist: [{ id: id('check', String(n)), text: 'Ouvrir les accès des trois modules au moment choisi.', isCompleted: false }] })),
    lootPool: [objet('cle', 'Clef de maintenance'), objet('air', 'Cartouche d’air', 'consumable', 3), objet('soins', 'Pansements', 'consumable', 3), objet('rations', 'Rations scellées', 'consumable', 6),
        objet('batteries', 'Batteries de rechange', 'consumable', 2, 'Le remplacement doit être décidé puis écrit dans l’appareil concerné ; aucune recharge automatique à la distribution.'), objet('credits', 'Crédits fictifs', 'currency', 101), objet('boite', 'Copie de boîte noire'), objet('outil', 'Pièce de dérivation')].map(o => ({ ...o, campaignId: C })),
    lootReserve: [{ ...objet('reserve', 'Caisse restée en réserve'), campaignId: C }], lootHistory: [], messages: [], journaux: [], requiredDriverData: [pilote], requiredTemplateData: [fiche],
    moments: ['approche', 'infirmerie', 'labo', 'sortie'].map((slug, i) => ({ id: id('moment', slug), campaignId: C, name: `M0${i + 1} — ${scenes.find(s => s[0] === slug)[2]}`, color: '#77aa83', icon: 'Radar', description: 'Carte et signal synthétique de recette.',
        mapUrl: `data:image/svg+xml;base64,${atelier.medias.get(ref(`carte-${scenes.find(s => s[0] === slug)[3]}`)).contenu.toString('base64')}`, isMapVideo: false, soundAtmosphereId: id('ambiance', 'orphee'), soundPadId: id('pad', i % 2 ? 'balise' : 'relais'), titre: scenes.find(s => s[0] === slug)[2], titreDuree: 5 })),
    atmospheres: [{ id: id('ambiance', 'orphee'), campagneId: C, name: 'RECETTE ALIEN — relais Orphée', pads: Object.fromEntries(['relais', 'balise', 'sas'].map(son => [id('pad', son), { id: id('pad', son), title: son, filePath: ref(son, 'wav'), volume: 0.2, color: '#77aa83', midiMapping: null, keyMapping: null, isActive: false, linkedLightSceneId: null }])) }],
    playlists: [{ id: id('playlist', 'orphee'), campagneId: C, name: 'RECETTE ALIEN — signaux', pads: ['relais', 'balise'].map(son => ({ id: id('musique', son), label: son, url: ref(son, 'wav'), type: 'local', loopA: null, loopB: null })) }],
    tuilesDeLumiere: ['Sas — secours', 'Mess — terminal', 'Laboratoire — alarme'].map((name, i) => ({ id: `SCENE_${C}_${i + 1}`, name, campagneId: C, icon: 'Lightbulb', color: '#77aa83', lightStates: {}, sceneBrightness: 25 })),
};
function lier(a, b, type, libelle) { a.relations.push({ targetId: b.id, targetType: b.type ? 'npc' : 'pc', type, libelle, description: libelle }); }
lier(joueurs[0].characters[0], scenario.entities[0], 'ally', 'Promesse de retour'); lier(joueurs[1].characters[0], scenario.entities[1], 'ally', 'Soins et maintenance'); lier(joueurs[2].characters[0], scenario.entities[2], 'rival', 'Secours contre contrat');
function lierModules(s, prefixe, opts = {}) { s.modulesDuJeu = preparerModulesAlien(s.players.map((p, i) => ({ id: p.characters[0].id, name: p.characters[0].name, objectifs: heros[i].objectifs })), { prefixe, ...opts }); }
lierModules(scenario, 'recette-alien');
function labo(suffixe, nom) {
    const original = { ...scenario, modulesDuJeu: undefined };
    const s = JSON.parse(JSON.stringify(original).replaceAll('recette-alien-', `recette-alien-${suffixe}-`));
    const restaurer = v => typeof v === 'string' ? v.replaceAll(`recette-alien-${suffixe}-media-`, 'recette-alien-media-') : Array.isArray(v) ? v.map(restaurer) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, restaurer(x)])) : v;
    const copie = restaurer(s); copie.campaign.name = nom; copie.campaign.description = 'Laboratoire hors fiction, à réimporter avec Remplacer entre essais.';
    copie.requiredDriverData = [pilote]; copie.requiredTemplateData = [fiche]; copie.players.forEach((p, i) => { p.id = joueurs[i].id; p.characters = []; }); copie.scenes.forEach(s => { s.personnagesIds = []; }); copie.sessions.forEach(s => { s.sessionEntityIds = []; }); return copie;
}
function cobaye(s, i, code, nom, maj, panique) {
    const c = structuredClone(joueurs[i % 3].characters[0]); c.id = `${s.campaign.id}-pj-${code.toLowerCase()}`; c.name = `${code} — ${nom}`; c.campaignId = s.campaign.id; c.relations = [];
    c.sheetData = { ...c.sheetData, ...maj, nom: c.name }; if (panique) Object.assign(c.sheetData, appliquerLaPaniqueAlien(pilote.jet.panique.suites, 'panique_en_cours', c.sheetData, `${code}-panique`, panique));
    c.hp = c.sheetData.sante; c.maxHp = c.sheetData.force; c.healthSystem = sante(c.hp, c.maxHp); c.playerNotes = 'État initial de laboratoire ; la Santé zéro appelle le traitement critique approprié, pas une mort automatique.';
    c.inventoryItems.forEach((o, i) => { o.id = `${c.id}-objet-${i}`; });
    s.players[i % 3].characters.push(c); s.scenes.forEach(sc => sc.personnagesIds.push(c.id)); s.sessions.forEach(se => se.sessionEntityIds.push(c.id));
}
const corps = labo('corps', 'RECETTE ALIEN — Laboratoire 02 · Corps, Panique et Survie');
[
    ['B01', 'Panique 7 · Tremblement', { niveau_de_stress: 2 }, 7], ['B02', 'Panique 10 · Action annulée', { niveau_de_stress: 4 }, 10], ['B03', 'Panique 13 · Bilan à résoudre', { niveau_de_stress: 5 }, 13],
    ['B04', 'Synthétique brisé', { androide: true, type_personnage: 'Androïde', force: 6, sante: 0, niveau_de_stress: 0 }],
    ['B05', 'Réserves à 1', { air: 1, eau: 1, nourriture: 1, energie: 1 }], ['B06', 'Humain brisé', { sante: 0, niveau_de_stress: 0 }],
    ['B07', 'Stress 11 et Point de Récit', { niveau_de_stress: 11, points_de_recit: 2 }], ['B08', 'Radiations et privations', { 'field-1786782860390': 4, rads_permanents: 2, affame: true, dehydrate: true, epuise: true, gele: true }],
    ['B09', 'Campagne et PX', { 'field-1786782929062': 10, [CLE_PROGRESSION_ALIEN]: { ...lireProgressionAlien({}), mode: 'campagne', scenario: titreAlien, seance: 'recette-campagne-01', pxEnPlus: 5 } }],
].forEach(([code, nom, maj, panique], i) => cobaye(corps, i, code, nom, maj, panique));
lierModules(corps, 'recette-alien-corps');
const instruments = labo('modules', 'RECETTE ALIEN — Laboratoire 03 · M314, Terminal et Vaisseaux');
heros.forEach((h, i) => cobaye(instruments, i, `M0${i + 1}`, h.metier, {}));
lierModules(instruments, 'recette-alien-modules', { energie: 1, engage: true });
const archives = [atelier.ecrire('01-La-derniere-releve.gmos', scenario), atelier.ecrire('02-Corps-Panique-et-Survie.gmos', corps), atelier.ecrire('03-M314-Terminal-et-Vaisseaux.gmos', instruments)];
fs.copyFileSync(SOURCE, path.join(SORTIE, 'Alien-1.9.0.gmos-driver'));
ecrireRecetteAlien(SORTIE, { scenario, corps, instruments, archives, rattachement });
fs.writeFileSync(path.join(SORTIE, 'inventaire.json'), JSON.stringify({ version: 1, genereLe: DATE_RECETTE, rattachement, pilote: { id: pilote.id, version: pilote.version, source: SOURCE }, archives,
    campagne: { joueurs: 3, personnages: 3, pnj: 12, lieux: 8, indices: 12, actes: 4, scenes: 16, rencontres: 3, seances: 4, wiki: 9, butin: 8, moments: 4 },
    modules: { muthur: { versionDonnees: 5, dossiers: 3, actes: 3, objectifs: 9, protocoles: 4 }, detecteur: { versionDonnees: 4, zones: 8, pions: 7, energie: 5 }, spatial: { versionDonnees: 2, vaisseaux: 2, postes: 5 } }, casDeRecette: casAlien.length }, null, 2));
console.log(JSON.stringify({ sortie: SORTIE, archives, casDeRecette: casAlien.length }));
