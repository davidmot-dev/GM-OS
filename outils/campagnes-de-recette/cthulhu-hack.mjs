import './charger-typescript.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import assert from 'node:assert/strict';
import { investigateurs, lieux, personnages, indices, scenes } from './cthulhu-hack-scenario.mjs';
import { casDeRecette, ecrireLeCahier } from './cthulhu-hack-recette.mjs';
import { ecrireTables } from './cthulhu-hack-tables.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SORTIE = path.join(RACINE, 'output/campagnes-tests/cthulhu-hack');
const SOURCE = path.join(RACINE, 'Export Dirvers/corriges/CH_driver_gmos_2026-10-23.gmos-driver');
// David confirme le 25/10 que les trois joueurs existent déjà ; leurs identifiants
// viennent de son export RDD, sans recopier leurs personnages ni consulter son profil.
const rattachement = JSON.parse(fs.readFileSync(new URL('./cthulhu-hack-joueurs.json', import.meta.url), 'utf8'));
assert.deepEqual(rattachement.joueurs.map(p => p.realName), investigateurs.map(p => p.joueur));
assert.equal(new Set(rattachement.joueurs.map(p => p.id)).size, 3);
assert.ok(rattachement.joueurs.every(p => typeof p.id === 'string' && p.id.trim()));
const CH = await import('../../src/modules/dice/systemes/cthulhuHack.ts');
const exportPilote = JSON.parse(new AdmZip(SOURCE).readAsText('state.json'));
const { gameDriver: pilote, sheetTemplate: fiche } = exportPilote;
assert.equal(pilote.version, '1.1.0');
assert.equal(pilote.id, 'custom-1774643419710');
assert.ok(pilote.jet.cthulhuHack);
const DATE = '2026-10-25T12:00:00.000Z', INSTANT = Date.parse(DATE);
const champs = ['force', 'dexterite', 'constitution', 'sagesse', 'intelligence', 'charisme'];
const ressources = ['mentalHealth', 'torche', 'bagou', 'richesse'];
const id = (genre, slug) => `recette-ch-${genre}-${slug}`;
const asset = (slug, extension = 'svg') => `recette-ch-media-${slug}.${extension}`;
const fichiers = new Map();
const xml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function svg(nom, contenu, largeur = 1200, hauteur = 800) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}"><rect width="100%" height="100%" fill="#e9e2cf"/><style>text{font-family:Segoe UI,Arial,sans-serif;fill:#183b37} .petit{font-size:19px}.titre{font-size:38px;font-weight:700}</style><rect x="20" y="20" width="${largeur - 40}" height="${hauteur - 40}" fill="none" stroke="#53766c" stroke-width="3"/><text x="50" y="76" class="titre">${xml(nom)}</text>${contenu}<text x="50" y="${hauteur - 36}" font-size="15">PORT-LENOIR · FICTION ORIGINALE · CAMPAGNE DE RECETTE GM-OS</text></svg>`;
}
function ajouterAsset(slug, contenu, extension = 'svg') {
    fichiers.set(asset(slug, extension), { chemin: `assets/${extension === 'wav' ? 'audio' : 'images'}/${slug}.${extension}`, contenu: Buffer.from(contenu), mime: extension === 'wav' ? 'audio/wav' : 'image/svg+xml' });
    return asset(slug, extension);
}
function texteSVG(texte, x = 55, y = 155, longueur = 72) {
    const mots = texte.split(/\s+/), lignes = [''];
    for (const mot of mots) { if ((lignes.at(-1) + ' ' + mot).length > longueur) lignes.push(''); lignes[lignes.length - 1] += (lignes.at(-1) ? ' ' : '') + mot; }
    return lignes.map((l, i) => `<text x="${x}" y="${y + i * 31}" class="petit">${xml(l)}</text>`).join('');
}
function vignette(nom, sousTitre) {
    const initiales = nom.split(/\s+/).map(x => x[0]).slice(0, 2).join('');
    return svg(nom, `<circle cx="300" cy="240" r="100" fill="#294f49"/><text x="300" y="270" text-anchor="middle" style="font-size:76px;fill:#eee4ce">${xml(initiales)}</text>${texteSVG(sousTitre, 55, 390, 45)}`, 600, 550);
}
function carte(slug, nom, type, resume, voisins) {
    const salles = type === 'city' ? ['Quais', 'Café', 'Archives', 'Dispensaire', 'Phare', 'Station'] : ['Entrée', 'Salle principale', 'Réserve', 'Passage', 'Accès technique', 'Sortie'];
    let dessin = texteSVG(resume, 55, 120, 95);
    salles.forEach((s, i) => {
        const x = 70 + (i % 3) * 365, y = 235 + Math.floor(i / 3) * 220;
        dessin += `<rect x="${x}" y="${y}" width="315" height="160" rx="6" fill="#d6d2ba" stroke="#294f49" stroke-width="5"/><text x="${x + 22}" y="${y + 45}" font-size="25">${i + 1}. ${xml(s)}</text><path d="M${x + 115},${y + 160}h65" stroke="#e9e2cf" stroke-width="10"/>`;
        if (i % 3 < 2) dessin += `<path d="M${x + 315},${y + 85}h50" stroke="#6d8177" stroke-width="8" stroke-dasharray="9 6"/>`;
    });
    dessin += `<text x="55" y="710" class="petit">Schéma de test sans échelle · accès : ${xml(voisins.join(', ') || 'sortie maritime')}</text>`;
    return svg(nom, dessin);
}
function wav(mode, duree = 4) {
    const frequence = 22050, longueur = frequence * duree, b = Buffer.alloc(44 + longueur * 2);
    b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(frequence, 24); b.writeUInt32LE(frequence * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(longueur * 2, 40);
    for (let i = 0; i < longueur; i++) {
        const t = i / frequence, bord = Math.min(1, t * 15, (duree - t) * 15);
        const signal = mode === 'cloche' ? Math.sin(2 * Math.PI * 440 * t) * Math.exp(-2 * t)
            : mode === 'radio' ? Math.sin(2 * Math.PI * 310 * t) * (Math.sin(2 * Math.PI * 3 * t) > 0.4 ? 0.6 : 0.05)
                : (Math.sin(2 * Math.PI * 110 * t) + Math.sin(2 * Math.PI * 165 * t)) * 0.3;
        b.writeInt16LE(Math.round(signal * bord * 4000), 44 + i * 2);
    }
    return b;
}

for (const [slug, nom, type, resume, , voisins] of lieux) ajouterAsset(`carte-${slug}`, carte(slug, nom, type, resume, voisins));
for (const p of investigateurs) ajouterAsset(`pj-${p.slug}`, vignette(p.nom, p.metier));
for (const [slug, nom, , , description] of personnages) ajouterAsset(`pnj-${slug}`, vignette(nom, description));
for (const [slug, titre, contenu] of indices) ajouterAsset(`indice-${slug}`, svg(titre, texteSVG(contenu)));
for (const son of ['cloche', 'radio', 'bourdon']) ajouterAsset(son, wav(son), 'wav');

function ficheDe(p) {
    const valeurs = Object.fromEntries(fiche.sections.flatMap(s => s.fields.map(f => [f.id, f.defaultValue ?? (f.type === 'number' ? 0 : '')])));
    Object.assign(valeurs, Object.fromEntries(champs.map((c, i) => [c, p.valeurs[i]])), Object.fromEntries(ressources.map((c, i) => [c, p.ressources[i]])), {
        hp: 12, deVie: 'd8', fortune: p.fortune, degatsArme: 'd6', degatsNonArme: 1,
        competencesList: p.metier + ' : expérience narrative, sans bonus automatique.', capacitesList: 'Aucune capacité spéciale ajoutée par ce jeu de données.',
        equipementList: p.materiel.map(x => x[0]).join('\n'), descriptionText: p.description, histoireText: p.histoire,
    });
    p.materiel.forEach(([nom, de, pa], i) => Object.assign(valeurs, { [`materiel_${i + 1}_nom`]: nom, [`materiel_${i + 1}`]: de, [`materiel_${i + 1}_pa`]: pa }));
    return valeurs;
}
function sante(pv) { return { type: 'hp', data: { current: pv, max: 12 }, state: pv === 0 ? 'critical' : pv < 12 ? 'wounded' : 'healthy', badges: [] }; }
function objet(slug, nom, type = 'other', quantite = 1, description = '') {
    return { id: id('objet', slug), name: nom, type, rarity: 'common', weight: 1, quantity: quantite, description, value: 0, properties: {} };
}
const heros = investigateurs.map((p, i) => ({ id: rattachement.joueurs[i].id, realName: p.joueur, avatarUrl: '', isOnline: false,
    characters: [{ id: id('pj', p.slug), name: p.nom, classRace: p.metier, portraitUrl: asset(`pj-${p.slug}`), tokenUrl: asset(`pj-${p.slug}`),
        campaignId: id('campagne', 'port-lenoir'), systemId: pilote.id, templateId: fiche.id, hp: 12, maxHp: 12, healthSystem: sante(12),
        sheetData: ficheDe(p), description: p.description, playerNotes: p.histoire, gmNotes: p.notes,
        donneesModifieesLe: INSTANT, inventoryItems: p.materiel.map(([nom, de, pa], i) => ({ ...objet(`${p.slug}-${i + 1}`, nom, nom === 'Rations' ? 'consumable' : pa ? 'armor' : i === 3 ? 'weapon' : 'other', 1, `Matériel ${i + 1} : ${de}${pa ? `, ${pa} PA déclarés` : ''}.`), properties: { deUsure: de, pa } })),
        inventory: p.materiel.map(x => x[0]).join('\n'), relations: [], faction: 'Investigateurs', hubOptions: { showHP: true, showMP: false, showAP: false, showInventory: true, showRelations: true } }] }));

const campagneId = id('campagne', 'port-lenoir');
const pjIds = heros.flatMap(p => p.characters.map(c => c.id));
const notesScene = s => `${s[8]}\n\nRecette : ${s[1] === 4 ? 'hors fiction' : 'enquête jouable'} ; consulter CAHIER-DE-RECETTE.md.\nSECRET_MJ_CH_RECETTE : ne jamais afficher ces notes sur les tablettes. La voix du signal imite les disparus.`;
const scenario = {
    campaign: { id: campagneId, name: 'RECETTE CH — La dernière émission de Port-Lenoir', system: pilote.id,
        description: 'Campagne de test originale pour Cthulhu Hack 1.1.0 : enquête côtière, 1926, avec bancs de recette.',
        synopsis: 'Trois investigateurs répondent au télégramme de Jeanne. Une station radio émet des voix impossibles ; fermer trois vannes peut sauver le port.',
        gmNotes: 'SECRET_MJ_CH_RECETTE : Kerdreuc a ramené un résonateur de la mer. Irène tente de le contenir. Les vannes 17–4–9 isolent le dispositif. Le combat est facultatif. Le quatrième acte est un atelier hors fiction.',
        activeLocationIds: [id('lieu', 'port')], wallpaperUrl: asset('carte-port'), themeDuJeu: true, langueDeForge: 'fr',
    },
    entities: personnages.map(([slug, nom, role, lieu, description, dialogue, secret, hp]) => ({
        id: id('pnj', slug), name: nom, type: ['porteur', 'echo'].includes(slug) ? 'monster' : 'npc', role, status: 'alive', avatar: asset(`pnj-${slug}`),
        hp, maxHp: hp, ac: 0, speed: 6, initiative: 0, description, roleplayingNotes: dialogue, gmSecretInfo: `SECRET_MJ_CH_RECETTE : ${secret}`,
        linkedMapIds: [id('lieu', lieu)], campaignId: campagneId, templateId: fiche.id,
        sheetData: { ...ficheDe(investigateurs[0]), hp, fortune: 0, mentalHealth: 'd8', degatsArme: role === 'boss' ? 'd8' : 'd6' },
        healthSystem: { type: 'hp', data: { current: hp, max: hp }, state: 'healthy', badges: [] },
        relations: [], faction: ['hostile', 'boss'].includes(role) ? 'Les Veilleurs du sel' : 'Habitants du port', isVisibleByPlayers: ['jeanne', 'malo'].includes(slug),
    })),
    players: heros,
    atlasMaps: lieux.map(([slug, name, type, narrativeDescription, gmNotes, voisins]) => ({ id: id('lieu', slug), name, fileUrl: asset(`carte-${slug}`), isVideo: false, type, narrativeDescription, gmNotes,
        linkedEntities: [...personnages.filter(p => p[3] === slug).map(p => ({ id: id('lien', `${slug}-${p[0]}`), name: p[1], category: 'npc', entityId: id('pnj', p[0]) })),
            ...voisins.map(v => ({ id: id('lien', `${slug}-${v}`), name: lieux.find(l => l[0] === v)[1], category: 'lieu', mapId: id('lieu', v) }))], campaignId: campagneId, isVisited: slug === 'port' })),
    clues: indices.map(([slug, title, content, lieu, owner, isRevealed]) => ({ id: id('indice', slug), campaignId: campagneId, title, content, mediaUrl: asset(`indice-${slug}`), locationId: id('lieu', lieu), ownerId: id('pnj', owner), isRevealed, ...(isRevealed ? { revealedAt: INSTANT } : {}), campaignMoment: lieu })),
    wikiEntries: lieux.map(([slug, name, , resume]) => ({ id: id('wiki', slug), campaignId: campagneId, title: name, content: resume, category: 'location', tags: ['recette', 'Port-Lenoir'], imageUrls: [asset(`carte-${slug}`)], linkedEntityIds: personnages.filter(p => p[3] === slug).map(p => id('pnj', p[0])) })),
    timelineEvents: [
        ['1926-10-17', 'Le Saint-Elme revient sans son capitaine', 'Un navire endommagé rentre au port. Une caisse reste sous surveillance.'],
        ['1926-10-21', 'Des voix dans le dispensaire', 'Trois dockers tombent malades. Jeanne commence ses observations.'],
        ['1926-10-23', 'Le télégramme', 'Jeanne appelle les investigateurs.'],
        ['1926-10-25', 'Arrivée des investigateurs', 'Adrien, Claire et Émile se retrouvent au port.'],
    ].map(([date, title, description], i) => ({ id: id('chrono', String(i + 1)), campaignId: campagneId, date, title, description, type: 'lore', involvedEntityIds: [id('pnj', 'jeanne')], locationId: id('lieu', 'port') })),
    actes: ['Les papiers du port', 'La voix de trop', 'Fermer la mer', 'Atelier de recette — hors fiction'].map((titre, i) => ({ id: id('acte', String(i + 1)), campaignId: campagneId, ordre: i + 1, titre, resume: ['Relier les témoins et les traces de la caisse.', 'Comprendre le danger avant de couper le courant.', 'Choisir entre fermeture, négociation et fuite.', 'Reproduire les essais du cahier sur des copies.'][i], notesDuMeneur: i === 3 ? 'Ne fait pas partie de la fiction. Les variantes 02 et 03 contiennent les états destructifs déjà préparés.' : 'Laisser plusieurs accès aux indices ; aucun jet raté ne doit rendre la suite inaccessible.', acheve: false })),
    scenes: scenes.map(s => ({ id: id('scene', s[0]), campaignId: campagneId, acteId: id('acte', String(s[1])), ordre: scenes.filter(x => x[1] === s[1]).indexOf(s) + 1,
        titre: s[2], lieuId: id('lieu', s[3]), entiteIds: s[4].map(x => id('pnj', x)), personnagesIds: pjIds,
        indiceIds: s[5].map(x => id('indice', x)), resume: s[6], descriptionNarrative: s[7], notesDuMeneur: notesScene(s),
        enjeux: s[6], repliques: s[4].map(x => personnages.find(p => p[0] === x)).map(p => `${p[1]} : « ${p[5]} »`).join('\n'),
        ideesMusicales: 'Boucle synthétique de recette ; ne pas confondre avec une bande originale.', origine: 'preparee', importance: s[1] === 4 ? 'optionnelle' : 'principale',
        enchainements: s[9].map(x => ({ vers: id('scene', x), libelle: x === 'fuite' ? 'si le groupe se retire' : 'poursuivre cette piste' })), passages: [], creeeLe: INSTANT,
        ...(['arrivee', 'dispensaire', 'station', 'rituel'].includes(s[0]) ? { momentDeStoryboardId: id('moment', s[0]) } : {}),
    })),
    rencontres: [
        ['atelier', 'R01 — Les hommes du hangar', ['contremaitre', 'veilleur'], 'irene'],
        ['tunnel', 'R02 — Le Porteur et le mousse', ['porteur'], 'malo'],
        ['rituel', 'R03 — La chambre de résonance', ['echo', 'kerdreuc'], 'irene'],
    ].map(([scene, nom, ennemis, allie], i) => ({ id: id('rencontre', String(i + 1)), campaignId: campagneId, sceneId: id('scene', scene), nom,
        notes: 'Ajouter les PJ au lancement. Pas d’initiative inventée pour CH : les actions sont simultanées. Les dégâts et le couvert restent sous l’arbitrage du MJ.',
        lignes: [...ennemis.map(p => ({ genre: 'entite', entiteId: id('pnj', p), faction: 'enemy' })), { genre: 'entite', entiteId: id('pnj', allie), faction: 'ally' }], creeeLe: INSTANT })),
    sessions: [1, 2, 3, 4].map(n => ({ id: id('seance', String(n)), campaignId: campagneId, number: n, date: DATE.slice(0, 10), status: 'planned',
        publicSummary: n === 4 ? 'Atelier de tests des investigateurs.' : ['Le télégramme et les témoins.', 'Le phare et la station.', 'La chambre sous la mer.'][n - 1],
        gmSecrets: 'SECRET_MJ_CH_RECETTE : la séance est préparée, aucun événement n’a encore été joué.', sessionEntityIds: pjIds,
        acteId: id('acte', String(n)), scenesPrevuesIds: scenes.filter(s => s[1] === n).map(s => id('scene', s[0])),
        checklist: ['Ouvrir les trois fiches', 'Connecter les tablettes', 'Vérifier les indices cachés', 'Noter les anomalies et leur reproduction'].map((text, i) => ({ id: id('check', `${n}-${i}`), text, isCompleted: false })),
    })),
    lootPool: [
        objet('cle', 'Clef de maintenance', 'other', 1, 'Ouvre l’accès technique de la station ; aucun bonus numérique automatique.'),
        objet('lampe', 'Lampe de rechange', 'other', 1, 'Objet distribuable. Pour l’utiliser en Matériel, le MJ renseigne un emplacement et son dé.'),
        objet('bandages', 'Pochettes de bandages', 'consumable', 3, 'Soins à arbitrer ; ne rend pas automatiquement des PV.'),
        objet('billets', 'Billets de port — partage arithmétique', 'currency', 101, 'Monnaie fictive pour tester 33 chacun et deux unités restantes. Distincte du dé Richesse.'),
        objet('revolver', 'Revolver du contremaître', 'weapon', 1, 'Arme de fiction ; inscrire les dés de dégâts et d’usure décidés par le MJ.'),
        objet('amulette', 'Résonateur de poche', 'other', 1, 'Objet d’enquête, sans pouvoir chiffré ajouté au pilote.'),
        objet('rations', 'Rations des gardiens', 'consumable', 6, 'Quantité utile pour transfert puis partage.'),
        objet('plans', 'Pochette étanche du calque', 'other', 1, 'Transport des documents sans bonus de règle.'),
    ].map(o => ({ ...o, campaignId: campagneId })),
    lootReserve: [{ ...objet('coffre', 'Coffre non attribué', 'other', 1, 'Objet de réserve pour tester Remettre au butin.'), campaignId: campagneId }], lootHistory: [], messages: [], journaux: [],
    requiredDriverData: [pilote], requiredTemplateData: [fiche],
    moments: ['arrivee', 'dispensaire', 'station', 'rituel'].map((slug, i) => {
        const lieu = scenes.find(s => s[0] === slug)[3];
        return { id: id('moment', slug), name: ['M01 — Le port', 'M02 — Les dormeurs', 'M03 — La station', 'M04 — Sous la mer'][i],
            description: 'Carte schématique, titre et son de recette. Déclenchement manuel.', color: '#31594f', icon: 'Waves', campaignId: campagneId,
            mapUrl: `data:image/svg+xml;base64,${fichiers.get(asset(`carte-${lieu}`)).contenu.toString('base64')}`, isMapVideo: false,
            soundAtmosphereId: id('ambiance', 'port'), soundPadId: id('pad', i % 2 ? 'radio' : 'cloche'),
            titre: ['Port-Lenoir', 'Le dispensaire', 'La station Saint-Elme', 'La chambre de résonance'][i], titreDuree: 5,
        };
    }),
    atmospheres: [{ id: id('ambiance', 'port'), name: 'RECETTE CH — signaux du port', campagneId: campagneId,
        pads: Object.fromEntries(['cloche', 'radio', 'bourdon'].map(son => [id('pad', son), { id: id('pad', son), title: `Test — ${son}`, filePath: asset(son, 'wav'), volume: 0.35, color: '#31594f', midiMapping: null, keyMapping: null, isActive: false, linkedLightSceneId: null }])) }],
    playlists: [{ id: id('playlist', 'port'), name: 'RECETTE CH — boucles synthétiques', campagneId: campagneId,
        pads: ['bourdon', 'radio'].map(son => ({ id: id('musique', son), label: `Boucle de recette — ${son}`, url: asset(son, 'wav'), type: 'local', loopA: null, loopB: null })) }],
    tuilesDeLumiere: ['Port — froid', 'Café — ambre', 'Chambre — vert'].map((name, i) => ({ id: `SCENE_${campagneId}_${String(i + 1).padStart(2, '0')}`, name, icon: 'Lightbulb', color: ['#456a83', '#ad7b35', '#396353'][i], lightStates: {}, sceneBrightness: 30, campagneId: campagneId })),
};

function lier(a, b, type, libelle) { a.relations.push({ targetId: b.id, targetType: b.type ? 'npc' : 'pc', type, libelle, description: libelle }); }
lier(scenario.players[0].characters[0], scenario.entities[0], 'family', 'Frère et sœur');
lier(scenario.players[1].characters[0], scenario.entities[0], 'ally', 'Collègues au dispensaire');
lier(scenario.players[2].characters[0], scenario.entities[2], 'rival', 'Presse et enquête officielle');
lier(scenario.entities[7], scenario.entities[8], 'ally', 'Donneur d’ordres et contremaître');
lier(scenario.entities[6], scenario.entities[7], 'hostile', 'Contenir le dispositif contre accomplir le rituel');

// Chaque laboratoire reçoit d'autres identifiants : aucun PJ de l'enquête n'est remplacé.
function laboratoire(suffixe, titre) {
    const copie = structuredClone(scenario), prefixe = `recette-ch-${suffixe}`;
    function remapper(v) {
        if (typeof v === 'string') return v.replaceAll('recette-ch-', prefixe + '-');
        if (Array.isArray(v)) return v.map(remapper);
        if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k.replaceAll('recette-ch-', prefixe + '-'), remapper(x)]));
        return v;
    }
    // Les médias sont des références d'assets communes : ils doivent rester dans le manifeste.
    const refs = new Map([...fichiers.keys()].map(r => [r.replaceAll('recette-ch-', prefixe + '-'), r]));
    function retablir(v) {
        if (typeof v === 'string') return refs.get(v) ?? v;
        if (Array.isArray(v)) return v.map(retablir);
        if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, retablir(x)]));
        return v;
    }
    const lab = retablir(remapper(copie));
    lab.campaign.name = titre; lab.campaign.description = 'Laboratoire hors fiction : personnages de test remplaçables, états préparés par les fonctions du moteur CH.';
    // Le pilote et son gabarit sont communs aux trois campagnes.
    lab.requiredDriverData = [pilote]; lab.requiredTemplateData = [fiche];
    lab.players.forEach((p, i) => { p.id = scenario.players[i].id; p.characters = []; });
    lab.scenes.forEach(s => { s.personnagesIds = []; }); lab.sessions.forEach(s => { s.sessionEntityIds = []; });
    return lab;
}
function ajouterCobaye(lab, index, slug, nom, transformer) {
    const source = scenario.players[index % 3].characters[0], c = structuredClone(source);
    c.id = `${lab.campaign.id}-pj-${slug}`; c.name = nom; c.campaignId = lab.campaign.id; c.relations = [];
    c.sheetData = transformer(ficheDe(investigateurs[index % 3])); c.hp = Number(c.sheetData.hp); c.healthSystem = sante(c.hp);
    if (CH.lireCH(c.sheetData).mort) c.healthSystem.state = 'dead';
    c.description = 'Personnage de laboratoire hors fiction — ' + nom;
    c.playerNotes = 'État initial volontaire pour recette. Ne représente pas une création de personnage par le livre.';
    c.gmNotes = 'Noter l’état avant et après ; réimporter cette campagne avec Remplacer pour repartir à zéro.';
    c.inventoryItems.forEach((o, i) => { o.id = `${c.id}-inventaire-${i}`; });
    lab.players[index % 3].characters.push(c);
    for (const s of lab.scenes) s.personnagesIds.push(c.id);
    for (const s of lab.sessions) s.sessionEntityIds.push(c.id);
    return c;
}
const limites = laboratoire('limites', 'RECETTE CH — Laboratoire 02 · Hors Jeu et limites');
for (let d = 1; d <= 10; d++) ajouterCobaye(limites, d - 1, `d10-${d}`, `HJ${String(d).padStart(2, '0')} — ${CH.NOMS_HORS_JEU_CH[d]} (D10 ${d})`, f => {
    f = CH.signalerImpactCH(pilote.jet.cthulhuHack, f, 12, 0, 12, `recette-impact-${d}`);
    return CH.tirerConsequenceCH(f, `recette-impact-${d}`, d, true);
});
ajouterCobaye(limites, 0, 'standard', 'L01 — Standard · danger encore présent', f => CH.signalerImpactCH(pilote.jet.cthulhuHack, f, 12, 0, 12, 'recette-standard'));
ajouterCobaye(limites, 1, 'pulp', 'L02 — Pulp · premier D10 en attente', f => { f[CH.CLE_CTHULHU_HACK] = { ...CH.lireCH(f), pulp: true }; return CH.signalerImpactCH(pilote.jet.cthulhuHack, f, 12, 0, 12, 'recette-pulp'); });
ajouterCobaye(limites, 2, 'd4', 'L03 — Usure d4 et armure 1 PA · Fortune 0', f => ({ ...f, hp: 1, mentalHealth: 'd4', torche: 'd4', bagou: 'd4', richesse: 'd4', fortune: 0, materiel_1: 'd4', materiel_1_pa: 1 }));
ajouterCobaye(limites, 0, 'd20', 'L04 — Matériel d20 et emplacement vide · Fortune 1', f => ({ ...f, fortune: 1, materiel_1: 'd20', materiel_4_nom: '', materiel_4: '' }));
ajouterCobaye(limites, 1, 'fortune', 'L05 — Fortune 2 · défausse du MJ', f => CH.memoriserTestCH({ ...f, fortune: 2 }, { id: 'recette-test-reussi', champ: 'sagesse', genre: 'sauvegarde', seuil: f.sagesse, modificateur: 'aucun', reussi: true }));

const effets = laboratoire('effets', 'RECETTE CH — Laboratoire 03 · Chocs et Folies');
for (const genre of ['choc', 'folie']) for (let d = 1; d <= 6; d++) {
    const index = (genre === 'choc' ? 0 : 6) + d - 1;
    ajouterCobaye(effets, index, `${genre}-${d}`, `${genre === 'choc' ? 'C' : 'F'}${d} — ${genre === 'choc' ? ['Tremblements', 'Confus', 'Immobile', 'Inconscience', 'Frayeur', 'Hurlement'][d - 1] : ['Amnésie', 'Évanouissement', 'Paranoïa', 'Hystérie', 'Paralysie', 'Délire'][d - 1]}`, f => CH.ajouterEffetMentalCH(f, genre, d, faces => Math.min(faces, 2), `recette-${genre}-${d}`));
}

function ecrireArchive(nom, etat) {
    const archive = new AdmZip();
    const assetMap = [...fichiers.entries()].map(([originalRef, f]) => ({ originalRef, relativePath: f.chemin, checksum: createHash('sha256').update(f.contenu).digest('hex'), sizeBytes: f.contenu.length, mimeType: f.mime }));
    const manifeste = { schemaVersion: 1, bundleType: 'campaign', bundleId: `${etat.campaign.id}-v1`, campaignId: etat.campaign.id, campaignName: etat.campaign.name,
        exportedAt: DATE, gmosVersion: '6.5.0', requiredDriverIds: [pilote.id], requiredTemplateIds: [fiche.id], assetMap,
        stats: { entityCount: etat.entities.length, sessionCount: etat.sessions.length, atlasMapCount: etat.atlasMaps.length, wikiEntryCount: etat.wikiEntries.length, clueCount: etat.clues.length,
            assetCount: assetMap.length, totalSizeBytes: assetMap.reduce((s, a) => s + a.sizeBytes, 0) } };
    archive.addFile('state.json', Buffer.from(JSON.stringify(etat, null, 2)));
    archive.addFile('manifest.json', Buffer.from(JSON.stringify(manifeste, null, 2)));
    for (const f of fichiers.values()) archive.addFile(f.chemin, f.contenu);
    for (const e of archive.getEntries()) e.header.time = new Date(DATE);
    archive.writeZip(path.join(SORTIE, nom));
    fs.writeFileSync(path.join(SORTIE, nom.replace('.gmos', '.json')), JSON.stringify(etat, null, 2) + '\n');
    return { fichier: nom, campagne: etat.campaign.id, personnages: etat.players.flatMap(p => p.characters).length, medias: assetMap.length, sha256: createHash('sha256').update(fs.readFileSync(path.join(SORTIE, nom))).digest('hex') };
}
fs.mkdirSync(SORTIE, { recursive: true });
const archives = [ecrireArchive('01-Port-Lenoir.gmos', scenario), ecrireArchive('02-Hors-Jeu-et-limites.gmos', limites), ecrireArchive('03-Chocs-et-Folies.gmos', effets)];
fs.copyFileSync(SOURCE, path.join(SORTIE, 'Cthulhu-Hack-1.1.0.gmos-driver'));
for (const f of fichiers.values()) { const cible = path.join(SORTIE, f.chemin); fs.mkdirSync(path.dirname(cible), { recursive: true }); fs.writeFileSync(cible, f.contenu); }
fs.writeFileSync(path.join(SORTIE, 'cas-de-recette.json'), JSON.stringify(casDeRecette, null, 2) + '\n');
ecrireLeCahier(SORTIE, { archives, scenario, limites, effets, pilote, fiche, rattachement });
ecrireTables(SORTIE);
fs.writeFileSync(path.join(SORTIE, 'inventaire.json'), JSON.stringify({ version: 2, genereLe: DATE, rattachement, pilote: { id: pilote.id, version: pilote.version, source: path.relative(RACINE, SOURCE) }, archives,
    campagne: { joueurs: heros.map(p => p.realName), personnages: 3, pnj: scenario.entities.length, lieux: scenario.atlasMaps.length, indices: scenario.clues.length, actes: scenario.actes.length, scenes: scenario.scenes.length, rencontres: scenario.rencontres.length, seances: scenario.sessions.length, butin: scenario.lootPool.length, reserve: scenario.lootReserve.length, moments: scenario.moments.length, tuiles: scenario.tuilesDeLumiere.length }, casDeRecette: casDeRecette.length, modulesExternesSpecifiques: [], outilsTransversaux: ['Atlas', 'Trame', 'Combat', 'Indices', 'Butin', 'Wiki', 'Chronologie', 'Sound-OS', 'Music-OS', 'Storyboard', 'Light-OS', 'Hub'] }, null, 2) + '\n');
console.log(JSON.stringify({ sortie: SORTIE, archives, casDeRecette: casDeRecette.length }, null, 2));
