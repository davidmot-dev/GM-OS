// Usage : node outils/alien/ameliorer-pilote-a13-building-better-worlds.mjs "Export Dirvers/corriges/Alien-1.10.0.gmos-driver"
//
// A13 — Building Better Worlds, étape 2 du § 185 (décisions de David du 15/11/2026 : « oui au 1,2,3,4 ») :
//   1. la carrière de la fiche reçoit Prospecteur et Artiste (deux options ajoutées au champ
//      `type_personnage`, rien d'autre ne change sur la fiche) ;
//   2. le catalogue reçoit les objets du supplément — armes, munitions, uniformes, protections, matériel,
//      véhicules, vaisseaux — par `remplirDepuisLesFiches`, la fonction même de la Forge (§ 203, étape C),
//      chargée par jiti : lecture déterministe des tableaux des fiches RELUES, on remplit le vide, on ne
//      remplace rien ;
//   3. toutes les tables du supplément passent dans Table-OS, databases/tables/Alien/ — celles de la table
//      et celles de la génération des planètes et des colonies — lues dans les fiches relues ;
//   4. la colonie elle-même (attributs, initiatives, cycle) n'entre pas dans le pilote : chantier à part.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { createJiti } from 'jiti';

const source = process.argv[2];
assert.ok(source, 'Indiquer le pilote Alien 1.10.0 à enrichir.');

const jiti = createJiti(import.meta.url);
const { remplirDepuisLesFiches } = await jiti.import('../../src/modules/equipement/depuisLeCorpus.ts');
const { controlerLePilote } = await jiti.import('../../src/modules/forge/rules/controlesDuPilote.ts');

const CORPUS = 'docs/systems/alien/supplements/building-better-worlds/rules';
const TABLES = 'databases/tables/Alien';
const LIVRE = 'Building Better Worlds';

function lireFicheRelue(nom) {
    const texte = fs.readFileSync(path.join(CORPUS, nom), 'utf8').replace(/\r\n/g, '\n');
    assert.match(texte, /^relu: true$/m, `${nom} n'est pas relue : on n'en tire rien.`);
    return texte;
}

// ---------------------------------------------------------------- 1 · les tables du supplément
/** Les cellules des lignes du tableau qui suit le titre (qui commence par `titre`). */
function tableau(texte, titre) {
    const lignes = texte.split('\n');
    const i = lignes.findIndex(l => /^#{2,4} /.test(l) && l.replace(/^#+ /, '').startsWith(titre));
    assert.ok(i >= 0, `Tableau introuvable : ${titre}`);
    const rangs = [];
    let dans = false;
    for (const l of lignes.slice(i + 1)) {
        if (l.startsWith('|')) { dans = true; rangs.push(l); continue; }
        if (dans) break;
        if (/^#{2,4} /.test(l)) break;
    }
    const cellules = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim());
    const [entetes, , ...corps] = rangs.map(cellules);
    assert.ok(corps.length, `Tableau vide : ${titre}`);
    return { entetes, corps };
}

/** « 11–26 », « 7 », « 85+ », « ≤ 13 » → bornes. Une queue ouverte n'est atteinte qu'avec un modificateur. */
function bornes(cellule) {
    const c = cellule.replace(/\*+/g, '').trim();
    let m;
    if ((m = /^(\d+)$/.exec(c))) return { min: +m[1], max: +m[1] };
    if ((m = /^(\d+)\s*[–-]\s*(\d+)$/.exec(c))) return { min: +m[1], max: +m[2] };
    if ((m = /^(\d+)\+$/.exec(c))) return { min: +m[1], max: 99 };
    if ((m = /^≤\s*(\d+)$/.exec(c))) return { min: 0, max: +m[1] };
    throw new Error(`Bornes illisibles : « ${cellule} »`);
}

const net = s => s.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
const majuscule = s => s.charAt(0).toUpperCase() + s.slice(1);

/** « Titre : suite » ou « Titre: suite » → titre et description ; sinon la première phrase en titre. */
function couper(texte) {
    const i = texte.search(/\s?:\s/);
    if (i > 0 && i < 140) return { title: texte.slice(0, i).trim(), description: majuscule(texte.slice(texte.indexOf(':', i) + 1).trim()) };
    const m = /^(.+?[.!?…])\s+(.+)$/.exec(texte);
    return m ? { title: m[1].trim(), description: m[2].trim() } : { title: texte, description: '' };
}

/**
 * Une table : `colonne` = la colonne du texte (1 par défaut), `effet` = la colonne versée dans `effect`,
 * `colonnes` = les autres colonnes jointes en description (« Gravité : 0,5G »).
 */
function tableDuLivre({ fiche, titre, dice, name, effet, colonnes }) {
    const { entetes, corps } = tableau(lireFicheRelue(fiche), titre);
    return {
        name, dice,
        entries: corps.map(c => {
            const { min, max } = bornes(c[0]);
            let entree;
            if (colonnes) {
                entree = {
                    title: net(c[1]),
                    description: c.slice(2).map((v, n) => n + 2 === effet ? null : `${entetes[n + 2]} : ${net(v)}`).filter(Boolean).join(' ; '),
                };
            } else entree = couper(net(c[1]));
            const e = { min, max, title: entree.title, description: entree.description };
            if (effet) e.effect = entetes[effet] === 'Effet' ? net(c[effet]) : `${entetes[effet]} : ${net(c[effet])}`;
            return e;
        }),
    };
}

const P = 'creation-et-astronomie-des-systemes-planetaires-enhanced-systems-and-planets.md';
const C = 'gestion-des-attributs-et-initiatives-de-colonie-the-colony-attributes-colony-initiatives.md';
const B = 'Building Better Worlds — ';
const SPECS = {
    bbw_motivations_personnelles: { fiche: 'motivations-personnelles-de-la-frontiere-personal-agendas-on-the-frontier.md', titre: 'Tableau des motivations personnelles', dice: 'd66', name: `${B}Motivations personnelles (p. 55)` },
    bbw_incidents_d_intermede: { fiche: 'evenements-d-intermede-et-rapports-d-expedition-downtime-expedition-reports.md', titre: 'Tableau des DOWNTIME INCIDENTS', dice: '1d6', name: `${B}Incidents d'intermède, campagne The Lost Worlds (p. 164)` },
    bbw_effets_de_l_aiguillon: { fiche: 'dangers-de-la-frontiere-et-exploitation-des-moissonneurs-challenges-of-frontier-life-mining-operations-using-a-tamed-harvester.md', titre: 'Tableau des ZAPPER EFFECTS', dice: '1d6', name: `${B}Aiguillon contre un humain (p. 90)` },
    bbw_breches_de_combinaison: { fiche: 'dangers-de-la-frontiere-et-exploitation-des-moissonneurs-challenges-of-frontier-life-mining-operations-using-a-tamed-harvester.md', titre: 'Tableau des brèches de combinaison', dice: '1d6', name: `${B}Brèches de combinaison, +1 par dégât antérieur (p. 93)` },
    bbw_trouvailles_de_prospection: { fiche: 'modes-de-campagne-et-expeditions-de-la-frontiere-campaign-styles-expeditions.md', titre: 'Tableau des trouvailles de prospection', dice: 'd66', name: `${B}Trouvailles de prospection, +1 aux dizaines par réussite en plus (p. 92)` },
    bbw_incidents_de_colonie: { fiche: 'equipe-de-commandement-et-cycle-de-la-colonie-the-colony-command-team-the-colony-cycle.md', titre: 'Incidents de colonie', dice: 'd66', name: `${B}Incidents de colonie, fin de Cycle (p. 287)`, effet: 2 },
    bbw_planete_01_etoile_du_systeme: { fiche: P, titre: 'Étoile du système', dice: '2d6', name: `${B}Planète 1, étoile du système (p. 275)` },
    bbw_planete_02_type_d_etoile: { fiche: P, titre: "Type d'étoile", dice: '2d6', name: `${B}Planète 2, type d'étoile (p. 275)` },
    bbw_planete_03_position: { fiche: P, titre: 'Position de la planète', dice: '2d6', name: `${B}Planète 3, position (p. 276)` },
    bbw_planete_04_taille: { fiche: P, titre: 'Taille de la planète', dice: '2d6', name: `${B}Planète 4, taille et gravité (p. 276)`, colonnes: true },
    bbw_planete_05_atmosphere: { fiche: P, titre: 'Atmosphère (Atmosphere', dice: '2d6', name: `${B}Planète 5, atmosphère (p. 276)` },
    bbw_planete_06_radiations: { fiche: P, titre: 'Radiations (Radiation', dice: '2d6', name: `${B}Planète 6, radiations (p. 276)` },
    bbw_planete_07_climat: { fiche: P, titre: 'Climat (Climate', dice: '2d6', name: `${B}Planète 7, climat (p. 276)` },
    bbw_planete_08_hydrosphere: { fiche: P, titre: 'Hydrosphère (Hydrosphere', dice: '2d6', name: `${B}Planète 8, hydrosphère (p. 277)` },
    bbw_planete_09_particularite_globale: { fiche: P, titre: 'Particularité globale', dice: '2d6', name: `${B}Planète 9, particularité globale (p. 277)` },
    bbw_planete_10_duree_du_jour: { fiche: P, titre: 'Durée du jour', dice: '2d6', name: `${B}Planète 10, durée du jour (p. 277)` },
    bbw_planete_11_inclinaison_axiale: { fiche: P, titre: 'Inclinaison axiale', dice: '2d6', name: `${B}Planète 11, inclinaison axiale (p. 277)` },
    bbw_planete_12_terrain_regional: { fiche: P, titre: 'Terrain régional', dice: 'd66', name: `${B}Planète 12, terrain d'une région (p. 277-278)`, colonnes: true, effet: 2 },
    bbw_planete_13_potentiel_de_ressources: { fiche: P, titre: 'Potentiel de ressources', dice: 'd66', name: `${B}Planète 13, potentiel de ressources d'une région (p. 278)`, colonnes: true },
    bbw_planete_14_personnalite: { fiche: P, titre: 'Personnalité de la planète', dice: 'd66', name: `${B}Planète 14, personnalité (p. 278)` },
    bbw_colonie_nombre_de_sponsors: { fiche: C, titre: 'Nombre de sponsors', dice: '2d6', name: `${B}Colonie, nombre de sponsors (p. 279)` },
    bbw_colonie_sponsor: { fiche: C, titre: 'Sponsor (2D6', dice: '2d6', name: `${B}Colonie, sponsor (p. 279)` },
    bbw_colonie_mission_principale: { fiche: C, titre: 'Mission principale (D66', dice: 'd66', name: `${B}Colonie, mission principale (p. 279)` },
};

const valeursD66 = [];
for (let d = 1; d <= 6; d++) for (let u = 1; u <= 6; u++) valeursD66.push(d * 10 + u);
const valeursDuDe = { d66: valeursD66, '2d6': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], '1d6': [1, 2, 3, 4, 5, 6] };

const tables = Object.fromEntries(Object.entries(SPECS).map(([f, s]) => [f, tableDuLivre(s)]));
for (const [fichier, t] of Object.entries(tables)) {
    // Chaque valeur du dé tombe sur une entrée et une seule ; les queues ouvertes ne se chevauchent pas.
    for (const v of valeursDuDe[t.dice]) {
        const n = t.entries.filter(e => e.min <= v && v <= e.max).length;
        assert.equal(n, 1, `${fichier} : la valeur ${v} tombe sur ${n} entrée(s).`);
    }
    t.entries.forEach((a, i) => t.entries.slice(i + 1).forEach(b => assert.ok(a.max < b.min || b.max < a.min, `${fichier} : ${a.min}-${a.max} et ${b.min}-${b.max} se chevauchent.`)));
    for (const e of t.entries) assert.ok(e.title, `${fichier} : entrée ${e.min}-${e.max} sans titre.`);
}

const tablesEcrites = [];
for (const [fichier, t] of Object.entries(tables)) {
    const cible = path.join(TABLES, `${fichier}.json`);
    const contenu = JSON.stringify(t, null, 4) + '\n';
    if (fs.existsSync(cible)) assert.equal(fs.readFileSync(cible, 'utf8'), contenu, `${cible} existe déjà et diffère : il n'est pas écrasé.`);
    else fs.writeFileSync(cible, contenu);
    tablesEcrites.push(cible);
}

// ---------------------------------------------------------------- 2 · le pilote
const original = fs.readFileSync(source);
const archive = new AdmZip(original);
const state = JSON.parse(archive.readAsText('state.json'));
const p = state.gameDriver, fiche = state.sheetTemplate;
assert.equal(p.corpusId, 'alien');
assert.equal(p.version, '1.10.0', 'Ce script part du pilote 1.10.0 (A12, 14/11/2026).');
const avant = structuredClone(state);
const constatsAvant = controlerLePilote(p, fiche);

// 2a · la carrière
const carriere = fiche.sections.flatMap(s => s.fields).find(f => f.id === 'type_personnage');
assert.ok(carriere?.type === 'select', 'Le champ de carrière (type_personnage) est introuvable.');
for (const nouvelle of ['Prospecteur', 'Artiste']) {
    assert.ok(!carriere.options.includes(nouvelle), `« ${nouvelle} » est déjà une carrière : rien n'est remplacé.`);
    carriere.options.push(nouvelle);
}

// 2b · le catalogue, par la fonction de la Forge
const FICHES_D_EQUIPEMENT = [
    'armes-a-feu-et-munitions-weapons-ammunition.md',
    'tenues-de-protection-et-equipements-de-survie-suits-armor-protective-gear.md',
    'vehicules-terrestres-et-aeriens-vehicles.md',
    'vaisseaux-spatiaux-d-exploration-spacecraft.md',
];
const champs = fiche.sections.flatMap(s => s.fields).map(f => ({ id: f.id, label: f.label }));
const { catalogue, journal } = remplirDepuisLesFiches(
    p.catalogue,
    FICHES_D_EQUIPEMENT.map(nom => ({ chemin: `systems/alien/supplements/building-better-worlds/rules/${nom}`, contenu: lireFicheRelue(nom), livre: LIVRE })),
    champs,
);
assert.deepEqual(journal.colonnesAjoutees, [], 'Une colonne nouvelle : un en-tête de fiche ne rejoint pas celles du catalogue.');
assert.deepEqual(journal.objetsCompletes, [], 'Un objet du supplément porte le nom d\'un objet déjà au catalogue.');
assert.deepEqual(journal.conserves, []);
assert.deepEqual(journal.lignesNonLues, []);
assert.equal(journal.objetsAjoutes.length, 53, `53 objets attendus, ${journal.objetsAjoutes.length} lus.`);
assert.deepEqual(catalogue.objets.slice(0, p.catalogue.objets.length), p.catalogue.objets, 'Un objet déjà au catalogue a changé.');
// Deux effets que la lecture des « Spécial » attache au porteur alors qu'ils visent les autres : le −1 en
// Observation de la visée LAG frappe ceux qui sont près de la cible, et son +1 va aux dégâts (au prix d'un
// test de Réserve d'énergie, mot qui l'a fait lire « énergie +1 ») ; la clôture SDDG stresse les intrus.
// Retirés ici, en vérifiant que ce sont bien ceux-là.
for (const [nom, cibles] of [['LAG Laser Attunement Guide', ['observation', 'energie']], ['Omni-Tech SDDG Sonic Deterrent Defense Grid', ['niveau_de_stress']]]) {
    const objet = catalogue.objets.find(o => o.nom === nom && o.source?.livre === LIVRE);
    assert.deepEqual(objet?.effets?.map(e => e.cible), cibles, `${nom} : effets inattendus.`);
    delete objet.effets;
}
p.catalogue = catalogue;
p.version = '1.11.0';

// Rien d'autre n'a bougé.
assert.deepEqual({ ...p, version: '1.10.0', catalogue: avant.gameDriver.catalogue }, avant.gameDriver);
assert.deepEqual(state.bestiaire, avant.bestiaire);
const ficheSansCarriere = f => structuredClone(f.sections).map(s => ({ ...s, fields: s.fields.map(x => (x.id === 'type_personnage' ? { ...x, options: x.options.slice(0, 9) } : x)) }));
assert.deepEqual(ficheSansCarriere(fiche), avant.sheetTemplate.sections);
assert.deepEqual({ ...fiche, sections: null }, { ...avant.sheetTemplate, sections: null });

// Les constats de la Forge : aucun nouveau qui ne soit un avertissement du catalogue.
const constats = controlerLePilote(p, fiche);
const deja = new Set(constatsAvant.map(c => JSON.stringify(c)));
const nouveaux = constats.filter(c => !deja.has(JSON.stringify(c)));
assert.ok(nouveaux.every(c => c.gravite === 'avertissement' && c.ou.startsWith('catalogue.')), JSON.stringify(nouveaux, null, 2));

const manifest = JSON.parse(archive.readAsText('manifest.json'));
manifest.exportedAt = new Date().toISOString();
manifest.bundleId += '-a13';
const zip = new AdmZip();
for (const e of archive.getEntries()) if (!['state.json', 'manifest.json'].includes(e.entryName)) zip.addFile(e.entryName, e.getData());
zip.addFile('state.json', Buffer.from(JSON.stringify(state, null, 2)));
zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
const sortie = 'Export Dirvers/corriges/Alien-1.11.0.gmos-driver';
zip.writeZip(sortie);

assert.deepEqual(JSON.parse(new AdmZip(sortie).readAsText('state.json')), state);
assert.deepEqual(fs.readFileSync(source), original, "L'export d'origine a changé.");

const parFamille = {};
for (const o of journal.objetsAjoutes) parFamille[`${o.famille} · ${o.categorie}`] = (parFamille[`${o.famille} · ${o.categorie}`] ?? 0) + 1;
console.log(JSON.stringify({
    sortie,
    version: p.version,
    carrieres: carriere.options,
    objetsAjoutes: journal.objetsAjoutes.length,
    parFamille,
    objetsAvecEffets: catalogue.objets.filter(o => o.source?.livre === LIVRE && o.effets?.length).map(o => `${o.nom} : ${o.effets.map(e => `${e.cible} ${e.valeur > 0 ? '+' : ''}${e.valeur}`).join(', ')}`),
    nouveauxConstats: nouveaux.map(c => `${c.ou} — ${c.message}`),
    tables: tablesEcrites.length,
    entrees: Object.fromEntries(Object.entries(tables).map(([f, t]) => [f, t.entries.length])),
    originalInchange: true,
    sha256Source: crypto.createHash('sha256').update(original).digest('hex'),
}, null, 2));
